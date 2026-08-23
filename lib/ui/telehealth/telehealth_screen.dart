import 'dart:async';

import 'package:camera/camera.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../bloc/auth/auth_cubit.dart';
import '../../bloc/notification/notification_cubit.dart';
import '../../bloc/schedule/schedule_cubit.dart';
import '../../bloc/vault/vault_cubit.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/booking_expiry.dart';
import '../../data/catalogs/doctor_catalog.dart';
import '../../data/models/appointment.dart';
import '../../data/models/vault_report.dart';
import '../../data/repositories/health_repository.dart';
import '../../data/services/clinic_copilot_replies.dart';
import '../../data/services/telehealth_call_session.dart';
import '../../localization/app_localizations.dart';
import '../widgets/common_widgets.dart';
import '../widgets/profile_avatar.dart';
import '../widgets/suwasiri_brand_header.dart';
import 'prescription_detail_sheet.dart';
import 'telehealth_dual_video_stage.dart';

class TelehealthScreen extends StatefulWidget {
  const TelehealthScreen({super.key, this.isActive = true});

  final bool isActive;

  @override
  State<TelehealthScreen> createState() => _TelehealthScreenState();
}

class _TelehealthScreenState extends State<TelehealthScreen> {
  Appointment? _videoAppt;

  String get _doctorName =>
      _videoAppt?.doctorName ?? '';

  String get _clinicName {
    final appt = _videoAppt;
    if (appt == null) return '';
    final fromCatalog = DoctorCatalog.doctorById(appt.doctorId)?.hospital;
    if (fromCatalog != null && fromCatalog.isNotEmpty) return fromCatalog;
    if (appt.hospital.isNotEmpty) return appt.hospital;
    return appt.specialty;
  }

  final _noteCtrl = TextEditingController();
  final _aiCtrl = TextEditingController();
  final _notes = <String>[
    'Rest for 2 days. Avoid cold beverages and direct cold drafts.',
    'Monitor body temperature every 4 hours. Keep a log.',
    'Take Paracetamol only if temperature exceeds 38°C / 100°F.',
    'Drink warm fluids regularly — aim for 2–3 litres of water daily.',
    'Wash hands before meals and after returning home.',
    'Sleep 7–8 hours; elevate your head if coughing at night.',
    'Avoid self-medicating antibiotics without clinician advice.',
    'If breathing worsens or fever lasts >3 days, seek urgent care.',
  ];

  bool _showAllTips = false;
  bool _muted = false;
  bool _camOff = false;
  bool _rxUpdating = true;
  String? _sessionId;
  List<Prescription> _sessionRx = [];
  String? _aiReply;
  String? _aiLastQuery;
  Duration _remaining = const Duration(minutes: 8, seconds: 18);
  Timer? _callTimer;
  Timer? _rxTimer;
  StreamSubscription<List<Prescription>>? _rxWatch;
  CameraController? _camera;
  bool _cameraReady = false;
  bool _cameraBusy = false;
  TelehealthCallSession? _liveCall;
  bool _liveConnected = false;
  bool _joiningLive = false;
  bool _liveJoinBlocked = false;
  bool _incomingRinging = false;
  String _liveStatus = '';
  StreamSubscription<DocumentSnapshot<Map<String, dynamic>>>? _ringSub;
  StreamSubscription<QuerySnapshot<Map<String, dynamic>>>? _chatSub;
  StreamSubscription<QuerySnapshot<Map<String, dynamic>>>? _doctorNotesSub;
  final _chatCtrl = TextEditingController();
  final _callMessages = <_InCallMsg>[];
  final _doctorLiveNotes = <String>[];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      unawaited(
        _applyVideo(context.read<ScheduleCubit>().state.nextVideo),
      );
    });
  }

  @override
  void didUpdateWidget(TelehealthScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isActive && !oldWidget.isActive) {
      unawaited(
        _applyVideo(context.read<ScheduleCubit>().state.nextVideo),
      );
    }
  }

  @override
  void dispose() {
    _noteCtrl.dispose();
    _aiCtrl.dispose();
    _chatCtrl.dispose();
    _callTimer?.cancel();
    _rxTimer?.cancel();
    unawaited(_rxWatch?.cancel());
    unawaited(_ringSub?.cancel());
    unawaited(_chatSub?.cancel());
    unawaited(_doctorNotesSub?.cancel());
    unawaited(_hangupLiveCall());
    _disposeCamera();
    super.dispose();
  }

  Future<void> _disposeCamera() async {
    final cam = _camera;
    _camera = null;
    _cameraReady = false;
    if (cam != null) {
      try {
        await cam.dispose();
      } catch (_) {}
    }
  }

  Future<void> _initCamera() async {
    if (_cameraBusy) return;
    _cameraBusy = true;
    try {
      await _disposeCamera();
      final cameras = await availableCameras();
      if (!mounted || cameras.isEmpty) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(AppLocalizations.of(context).t('cameraUnavailable')),
            ),
          );
        }
        return;
      }
      final front = cameras.firstWhere(
        (c) => c.lensDirection == CameraLensDirection.front,
        orElse: () => cameras.first,
      );
      final controller = CameraController(
        front,
        ResolutionPreset.medium,
        enableAudio: false,
        imageFormatGroup: ImageFormatGroup.jpeg,
      );
      await controller.initialize();
      if (!mounted) {
        await controller.dispose();
        return;
      }
      setState(() {
        _camera = controller;
        _cameraReady = true;
        _camOff = false;
      });
    } catch (_) {
      if (mounted) {
        setState(() {
          _cameraReady = false;
          _camOff = true;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(AppLocalizations.of(context).t('cameraPermissionDenied')),
          ),
        );
      }
    } finally {
      _cameraBusy = false;
    }
  }

  Future<void> _toggleCamera() async {
    final live = _liveCall;
    if (live != null) {
      final next = !_camOff;
      await live.setCameraOff(next);
      if (mounted) setState(() => _camOff = next);
      return;
    }
    if (_cameraBusy) return;
    if (_camera == null || !_cameraReady) {
      await _initCamera();
      return;
    }
    try {
      if (_camOff) {
        await _camera!.resumePreview();
        if (!mounted) return;
        setState(() => _camOff = false);
      } else {
        await _camera!.pausePreview();
        if (!mounted) return;
        setState(() => _camOff = true);
      }
    } catch (_) {
      // Re-init if pause/resume fails on some devices.
      if (_camOff) {
        await _initCamera();
      } else {
        await _disposeCamera();
        if (mounted) setState(() => _camOff = true);
      }
    }
  }

  /// Load the booked video consult onto Call. In-person visits stay off this tab.
  Future<void> _applyVideo(Appointment? next) async {
    if (next == null || !next.isActiveSlot) {
      await _teardownSession(clearAppt: true);
      return;
    }
    final changed = _videoAppt?.id != next.id ||
        _videoAppt?.doctorId != next.doctorId ||
        _videoAppt?.timeSlot != next.timeSlot;
    if (!mounted) return;
    if (changed) _liveJoinBlocked = false;
    setState(() => _videoAppt = next);
    _watchIncomingRing(next.id);
    if (changed || _sessionId == null) {
      await _startSession();
    } else {
      _ensureExpiryTimer();
    }
  }

  void _watchIncomingRing(String appointmentId) {
    unawaited(_ringSub?.cancel());
    _ringSub = FirebaseFirestore.instance
        .collection('telehealth_sessions')
        .doc(appointmentId)
        .snapshots()
        .listen((snap) {
      if (!mounted || _liveCall != null) return;
      final data = snap.data();
      if (data == null) {
        if (_incomingRinging) setState(() => _incomingRinging = false);
        return;
      }
      final status = (data['status'] as String? ?? '').toLowerCase();
      final doctorJoined = data['doctorJoined'] == true;
      final hasOffer = data['offer'] is Map;
      final answered = data['answer'] is Map;
      final ringing = doctorJoined &&
          hasOffer &&
          !answered &&
          (status == 'ringing' ||
              status == 'connecting' ||
              status == 'lobby');
      if (ringing == _incomingRinging) return;
      setState(() => _incomingRinging = ringing);
      if (ringing) {
        HapticFeedback.heavyImpact();
        SystemSound.play(SystemSoundType.alert);
      }
    });
  }

  Future<void> _teardownSession({required bool clearAppt}) async {
    _callTimer?.cancel();
    _rxTimer?.cancel();
    await _rxWatch?.cancel();
    _rxWatch = null;
    await _chatSub?.cancel();
    _chatSub = null;
    await _doctorNotesSub?.cancel();
    _doctorNotesSub = null;
    await _hangupLiveCall();
    await _disposeCamera();
    if (!mounted) return;
    setState(() {
      if (clearAppt) _videoAppt = null;
      _sessionId = null;
      _sessionRx = [];
      _rxUpdating = false;
      _cameraReady = false;
    });
  }

  void _ensureExpiryTimer() {
    _callTimer?.cancel();
    _callTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted) return;
      final appt = _videoAppt;
      if (appt == null || !appt.isActiveSlot) {
        unawaited(_teardownSession(clearAppt: true));
        return;
      }
      setState(() => _remaining = _remainingFor(appt));
      // Do not auto-join — patient answers when the doctor rings from GP Care.
    });
  }

  Duration _remainingFor(Appointment appt) {
    final now = DateTime.now();
    final untilStart = appt.timeSlot.difference(now);
    if (!untilStart.isNegative) return untilStart;
    final untilEnd = BookingExpiry.hidesAtAppointment(appt.timeSlot).difference(now);
    return untilEnd.isNegative ? Duration.zero : untilEnd;
  }

  /// Live Call layout for the booked telehealth doctor only.
  Future<void> _startSession() async {
    final user = context.read<AuthCubit>().state.user;
    final appt = _videoAppt;
    if (user == null || appt == null) return;

    _callTimer?.cancel();
    _rxTimer?.cancel();

    setState(() {
      _sessionId = appt.id;
      _sessionRx = const [];
      _rxUpdating = true;
      _remaining = _remainingFor(appt);
      _muted = false;
      _camOff = false;
      _cameraReady = false;
    });

    // Patient waits with camera on; joins only after Answer / Join.
    unawaited(_initCamera());

    final health = context.read<HealthRepository>();
    await health.syncGpCare(user.id);
    if (!mounted) return;

    _ensureExpiryTimer();
    await _rxWatch?.cancel();
    _rxWatch = health.watchPrescriptions(user.id).listen((list) {
      if (!mounted) return;
      final pending = list.where((p) {
        if (p.sentToPharmacare) return false;
        if (p.source == 'gp_care') return true;
        return p.sessionId != null && p.sessionId == appt.id;
      }).toList();
      setState(() {
        _sessionRx = pending;
        _rxUpdating = false;
      });
    });
    _watchConsultSync(patientId: user.id, appointmentId: appt.id);
  }

  void _watchConsultSync({
    required String patientId,
    required String appointmentId,
  }) {
    unawaited(_chatSub?.cancel());
    unawaited(_doctorNotesSub?.cancel());
    _chatSub = FirebaseFirestore.instance
        .collection('telehealth_sessions')
        .doc(appointmentId)
        .collection('messages')
        .snapshots()
        .listen((snap) {
      if (!mounted) return;
      final timed = snap.docs.map((d) {
        final data = d.data();
        final sender = (data['sender'] as String? ?? '').toLowerCase();
        final at = data['at'];
        final millis = at is int ? at : (at is num ? at.toInt() : 0);
        return (
          millis,
          _InCallMsg(
            sender: data['senderName'] as String? ??
                data['sender'] as String? ??
                '',
            text: data['text'] as String? ?? '',
            fromPatient: sender == 'patient',
          ),
        );
      }).toList()
        ..sort((a, b) => a.$1.compareTo(b.$1));
      setState(() {
        _callMessages
          ..clear()
          ..addAll(timed.map((e) => e.$2));
      });
    });
    _doctorNotesSub = FirebaseFirestore.instance
        .collection('consultation_notes')
        .where('patientId', isEqualTo: patientId)
        .snapshots()
        .listen((snap) {
      if (!mounted) return;
      final notes = snap.docs.map((d) {
        final data = d.data();
        final body = (data['body'] as String? ?? '').trim();
        final doctor = data['doctor'] as String? ?? '';
        if (body.isEmpty) return '';
        return doctor.isEmpty ? body : '$doctor: $body';
      }).where((s) => s.isNotEmpty).toList();
      setState(() {
        _doctorLiveNotes
          ..clear()
          ..addAll(notes);
      });
    });
  }

  Future<void> _sendInCallMessage() async {
    final text = _chatCtrl.text.trim();
    final appt = _videoAppt;
    final user = context.read<AuthCubit>().state.user;
    if (text.isEmpty || appt == null || user == null) return;
    _chatCtrl.clear();
    await FirebaseFirestore.instance
        .collection('telehealth_sessions')
        .doc(appt.id)
        .collection('messages')
        .add({
      'sender': 'patient',
      'senderName': user.name,
      'text': text,
      'at': DateTime.now().millisecondsSinceEpoch,
    });
  }

  void _endCall() {
    _liveJoinBlocked = true;
    _rxTimer?.cancel();
    unawaited(_hangupLiveCall());
    unawaited(_disposeCamera());
    if (mounted) setState(() => _camOff = true);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(AppLocalizations.of(context).t('callEndedRestart'))),
    );
  }

  Future<void> _hangupLiveCall() async {
    final live = _liveCall;
    _liveCall = null;
    if (live != null) {
      try {
        await live.hangup();
      } catch (_) {}
    }
    if (mounted) {
      setState(() {
        _liveConnected = false;
        _joiningLive = false;
        _liveStatus = '';
      });
    }
  }

  Future<void> _joinGpCareCall() async {
    final appt = _videoAppt;
    if (appt == null || _joiningLive || _liveCall != null) return;
    // Allow answer when doctor is ringing even slightly outside the T-15 window.
    if (!appt.canJoinGpCareCall && !_incomingRinging) return;
    if (_liveJoinBlocked && !_incomingRinging) return;
    setState(() {
      _joiningLive = true;
      _liveJoinBlocked = false;
      _incomingRinging = false;
      _liveStatus = 'waiting';
    });
    while (_cameraBusy) {
      await Future<void>.delayed(const Duration(milliseconds: 40));
    }
    await _disposeCamera();
    final session = TelehealthCallSession(
      appointmentId: appt.id,
      role: TelehealthRole.patient,
    );
    _liveCall = session;
    try {
      await session.start(
        onRemote: () {
          if (!mounted) return;
          setState(() {
            _liveConnected = true;
            _liveStatus = 'live';
          });
        },
        onStatus: (status) {
          if (!mounted) return;
          if (status == 'ended') {
            unawaited(_hangupLiveCall());
            return;
          }
          setState(() {
            _liveStatus = status;
            if (status == 'live') _liveConnected = true;
          });
        },
      );
      if (_muted) await session.setMuted(true);
      if (_camOff) await session.setCameraOff(true);
    } catch (e) {
      await _hangupLiveCall();
      if (!mounted) return;
      unawaited(_initCamera());
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    }
  }

  Future<void> _sendToMediLanka({
    required List<Prescription> medicines,
    String? sessionId,
  }) async {
    final user = context.read<AuthCubit>().state.user;
    if (user == null || medicines.isEmpty) return;
    final health = context.read<HealthRepository>();
    final notifications = context.read<NotificationCubit>();
    final sid = sessionId ?? medicines.first.sessionId ?? _sessionId;

    if (sid != null) {
      await health.sendPrescriptionsToPharmacare(
        patientId: user.id,
        sessionId: sid,
      );
    } else {
      await health.markPrescriptionsSentToPharmacy(
        patientId: user.id,
        medicines: medicines,
      );
    }
    if (!mounted) return;
    await notifications.load();
    if (!mounted) return;
    try {
      await context.read<VaultCubit>().watch(user.id);
    } catch (_) {}
    if (!mounted) return;
    // After pharmacy send, remove from Call E-Prescription (moves to Vault Issued Medicines).
    setState(() {
      _sessionRx = [];
      _rxUpdating = false;
    });
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(AppLocalizations.of(context).t('rxMovedToHistory'))),
    );
  }

  Future<void> _openClinicPrescription({
    required List<Prescription> medicines,
    required String clinicName,
    required String doctorName,
  }) async {
    final user = context.read<AuthCubit>().state.user;
    final synced = medicines.every((p) => p.sentToPharmacare);
    await showPrescriptionDetailSheet(
      context: context,
      medicines: medicines,
      clinicName: clinicName,
      doctorName: doctorName,
      patient: user,
      mediLankaSynced: synced,
      showFormalForm: true,
      onSyncMediLanka: () => _sendToMediLanka(medicines: medicines),
    );
  }

  void _addNote() {
    final text = _noteCtrl.text.trim();
    if (text.isEmpty) return;
    setState(() {
      _notes.insert(0, text);
      _noteCtrl.clear();
    });
  }

  void _askAi() {
    final q = _aiCtrl.text.trim();
    if (q.isEmpty) return;
    setState(() {
      _aiReply = ClinicCopilotReplies.reply(q);
      _aiLastQuery = q;
      _aiCtrl.clear();
    });
  }

  Future<void> _openAiGoogle() async {
    final q = ClinicCopilotReplies.googleQuery(_aiLastQuery ?? _aiCtrl.text);
    final uri = Uri.parse(
      'https://www.google.com/search?q=${Uri.encodeComponent(q)}',
    );
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  String get _timerLabel {
    final m = _remaining.inMinutes.remainder(60).toString().padLeft(2, '0');
    final s = _remaining.inSeconds.remainder(60).toString().padLeft(2, '0');
    return '$m:$s';
  }

  String _patientLabel(BuildContext context) {
    final user = context.watch<AuthCubit>().state.user;
    if (user == null) return 'Kamal Gunasekara (28, M)';
    final age = user.dateOfBirth == null
        ? 28
        : DateTime.now().year - user.dateOfBirth!.year;
    return '${user.name} ($age, M)';
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final patientLabel = _patientLabel(context);
    final appt = context.watch<ScheduleCubit>().state.nextVideo;
    final hasCall = appt != null && appt.isActiveSlot;
    final waiting = hasCall && appt.timeSlot.isAfter(DateTime.now());

    return BlocListener<AuthCubit, AuthState>(
      listenWhen: (prev, curr) =>
          prev.activeFamilyKey != curr.activeFamilyKey ||
          prev.user?.id != curr.user?.id,
      listener: (context, _) {
        unawaited(
          _applyVideo(context.read<ScheduleCubit>().state.nextVideo),
        );
      },
      child: BlocListener<ScheduleCubit, ScheduleState>(
      listenWhen: (prev, next) =>
          prev.nextVideo?.id != next.nextVideo?.id ||
          prev.nextVideo?.doctorId != next.nextVideo?.doctorId ||
          prev.nextVideo?.doctorName != next.nextVideo?.doctorName ||
          prev.nextVideo?.timeSlot != next.nextVideo?.timeSlot ||
          prev.tick != next.tick,
      listener: (context, state) {
        unawaited(_applyVideo(state.nextVideo));
      },
      child: SafeArea(
      bottom: false,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 28),
        children: [
          const SuwasiriBrandHeader(),
          const SizedBox(height: 18),
          Text(
            l.t('telehealthTitle'),
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  fontSize: 28,
                  fontWeight: FontWeight.w800,
                  color: AppColors.trustBlueDark,
                ),
          ),
          const SizedBox(height: 6),
          Text(
            l.t('telehealthSubtitle'),
            style: const TextStyle(
              color: AppColors.slateMuted,
              fontSize: 14,
              height: 1.35,
            ),
          ),
          const SizedBox(height: 16),
          if (!hasCall)
            SoftCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    l.t('noVideoConsult'),
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          height: 1.4,
                        ),
                  ),
                  const SizedBox(height: 12),
                  FilledButton.icon(
                    onPressed: () => MainTabScope.go(context, 1),
                    icon: const Icon(Icons.videocam_outlined),
                    label: Text(l.t('bookVideoFromDoctors')),
                  ),
                ],
              ),
            )
          else ...[
            TelehealthDualVideoStage(
              muted: _muted,
              camOff: _camOff,
              camera: _camera,
              cameraReady: _cameraReady,
              patientName:
                  context.watch<AuthCubit>().state.user?.displayName ?? 'You',
              doctorName: _doctorName,
              liveConnected: _liveConnected,
              joiningLive: _joiningLive,
              canJoinLive: appt.canJoinGpCareCall || _incomingRinging,
              incomingRinging: _incomingRinging,
              liveStatus: _liveStatus,
              localRenderer: _liveCall?.localRenderer,
              remoteRenderer: _liveCall?.remoteRenderer,
              onMute: () {
                final next = !_muted;
                setState(() => _muted = next);
                final live = _liveCall;
                if (live != null) unawaited(live.setMuted(next));
              },
              onCam: _toggleCamera,
              onEnd: _endCall,
              onJoinLive: _joinGpCareCall,
              onAnswerCall: _joinGpCareCall,
            ),
            const SizedBox(height: 14),
            _LiveConsultationCard(
              patientLabel: patientLabel,
              timerLabel: waiting
                  ? DateFormat('MMM d · hh:mm a').format(appt.timeSlot)
                  : _timerLabel,
              timerCaption:
                  waiting ? l.t('scheduledConsult') : l.t('timeRemaining'),
              doctorName: _doctorName,
            ),
            const SizedBox(height: 14),
            _EPrescriptionCard(
              medicines: _sessionRx,
              updating: _rxUpdating,
              doctorName: _doctorName,
              clinicName: _clinicName,
              onOpenClinic: (meds, clinic, doctor) => _openClinicPrescription(
                medicines: meds,
                clinicName: clinic,
                doctorName: doctor,
              ),
            ),
            const SizedBox(height: 14),
            _QuickNotesCard(
              notes: _doctorLiveNotes.isNotEmpty
                  ? _doctorLiveNotes
                  : _notes,
              showAll: _showAllTips,
              controller: _noteCtrl,
              onAdd: _addNote,
              onToggleViewAll: () =>
                  setState(() => _showAllTips = !_showAllTips),
              liveFromDoctor: _doctorLiveNotes.isNotEmpty,
            ),
            const SizedBox(height: 14),
            _InCallMessagesCard(
              messages: _callMessages,
              controller: _chatCtrl,
              onSend: _sendInCallMessage,
            ),
          ],
          const SizedBox(height: 14),
          _AiCopilotCard(
            controller: _aiCtrl,
            reply: _aiReply,
            onSend: _askAi,
            onGoogle: _openAiGoogle,
          ),
        ],
      ), // ListView
    ), // SafeArea
    ), // ScheduleCubit listener
    ); // AuthCubit listener
  }
}

class _LiveConsultationCard extends StatelessWidget {
  const _LiveConsultationCard({
    required this.patientLabel,
    required this.timerLabel,
    required this.timerCaption,
    required this.doctorName,
  });

  final String patientLabel;
  final String timerLabel;
  final String timerCaption;
  final String doctorName;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(
            color: AppColors.trustBlueDark.withValues(alpha: 0.05),
            blurRadius: 14,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  l.t('liveConsultation'),
                  style: const TextStyle(
                    color: AppColors.trustBlueDark,
                    fontWeight: FontWeight.w800,
                    fontSize: 17,
                  ),
                ),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: const Color(0xFFE6F4EA),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  l.t('secureV3'),
                  style: const TextStyle(
                    color: Color(0xFF1E8E3E),
                    fontWeight: FontWeight.w800,
                    fontSize: 11,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          _InfoRow(
            icon: Icons.person_outline,
            iconBg: AppColors.trustBlueSoft,
            iconColor: AppColors.trustBlue,
            label: l.t('patientProfile'),
            value: patientLabel,
          ),
          const SizedBox(height: 12),
          _InfoRow(
            icon: Icons.medical_services_outlined,
            iconBg: const Color(0xFFE0F2FE),
            iconColor: AppColors.trustBlue,
            label: l.t('onlineVideoConsult'),
            value: doctorName,
          ),
          const SizedBox(height: 12),
          _InfoRow(
            icon: Icons.schedule,
            iconBg: AppColors.warningSoft,
            iconColor: AppColors.warning,
            label: timerCaption,
            value: timerLabel,
          ),
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({
    required this.icon,
    required this.iconBg,
    required this.iconColor,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final Color iconBg;
  final Color iconColor;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 42,
          height: 42,
          decoration: BoxDecoration(
            color: iconBg,
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: iconColor, size: 22),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(
                  color: AppColors.slateMuted,
                  fontWeight: FontWeight.w700,
                  fontSize: 11,
                  letterSpacing: 0.6,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                value,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: AppColors.trustBlueDark,
                  fontWeight: FontWeight.w800,
                  fontSize: 15,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _EPrescriptionCard extends StatelessWidget {
  const _EPrescriptionCard({
    required this.medicines,
    required this.updating,
    required this.doctorName,
    required this.clinicName,
    required this.onOpenClinic,
  });

  final List<Prescription> medicines;
  final bool updating;
  final String doctorName;
  final String clinicName;
  final void Function(
    List<Prescription> medicines,
    String clinicName,
    String doctorName,
  ) onOpenClinic;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final pending = latestPendingPrescription(medicines);
    final first = pending.isNotEmpty ? pending.first : null;
    final issuedLabel = first?.issuedAt != null
        ? DateFormat('d MMM yyyy · hh:mm a').format(first!.issuedAt!)
        : '—';
    final clinic = first?.clinicName ?? clinicName;
    final doctor = first?.doctor ?? doctorName;
    final empty = pending.isEmpty && !updating;
    void open() {
      if (pending.isEmpty) return;
      onOpenClinic(pending, clinic, doctor);
    }

    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(
            color: AppColors.trustBlueDark.withValues(alpha: 0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: IntrinsicHeight(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Container(
              width: 5,
              decoration: const BoxDecoration(
                color: AppColors.trustBlue,
                borderRadius: BorderRadius.horizontal(
                  left: Radius.circular(20),
                ),
              ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(14, 16, 16, 14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(
                          Icons.description_outlined,
                          color: AppColors.trustBlue,
                          size: 22,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            l.t('ePrescription'),
                            style: const TextStyle(
                              color: AppColors.trustBlueDark,
                              fontWeight: FontWeight.w800,
                              fontSize: 16,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      l.t('tapClinicForRx'),
                      style: const TextStyle(
                        color: AppColors.slateMuted,
                        fontSize: 12,
                        height: 1.35,
                      ),
                    ),
                    if (empty) ...[
                      const SizedBox(height: 14),
                      Text(
                        l.t('noPendingCallRx'),
                        style: const TextStyle(
                          color: AppColors.slateMuted,
                          fontSize: 13,
                          fontStyle: FontStyle.italic,
                        ),
                      ),
                    ] else ...[
                      const SizedBox(height: 12),
                      Text(
                        '${l.t('issuedDate')}: $issuedLabel',
                        style: const TextStyle(
                          color: AppColors.slateMuted,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        l.t('issuedHospitalClinic'),
                        style: const TextStyle(
                          color: AppColors.slateMuted,
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.4,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        clinic,
                        style: const TextStyle(
                          color: AppColors.trustBlue,
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        l.t('issuedDoctorName'),
                        style: const TextStyle(
                          color: AppColors.slateMuted,
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.4,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        doctor,
                        style: const TextStyle(
                          color: AppColors.trustBlueDark,
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 12),
                      SizedBox(
                        width: double.infinity,
                        child: FilledButton.icon(
                          onPressed: open,
                          icon: const Icon(Icons.description_outlined),
                          label: Text(l.t('viewEPrescription')),
                        ),
                      ),
                      if (updating) ...[
                        const SizedBox(height: 10),
                        Row(
                          children: [
                            Container(
                              width: 8,
                              height: 8,
                              decoration: const BoxDecoration(
                                color: AppColors.trustBlueLight,
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                l.t('doctorUpdatingRx'),
                                style: const TextStyle(
                                  color: AppColors.slateMuted,
                                  fontStyle: FontStyle.italic,
                                  fontSize: 12,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
class _QuickNotesCard extends StatelessWidget {
  const _QuickNotesCard({
    required this.notes,
    required this.showAll,
    required this.controller,
    required this.onAdd,
    required this.onToggleViewAll,
    this.liveFromDoctor = false,
  });

  final List<String> notes;
  final bool showAll;
  final TextEditingController controller;
  final VoidCallback onAdd;
  final VoidCallback onToggleViewAll;
  final bool liveFromDoctor;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final visible = showAll ? notes : notes.take(3).toList();

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.assignment_outlined, color: AppColors.trustBlue),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  liveFromDoctor ? l.t('doctorLiveNotes') : l.t('quickNotes'),
                  style: const TextStyle(
                    color: AppColors.trustBlueDark,
                    fontWeight: FontWeight.w800,
                    fontSize: 16,
                  ),
                ),
              ),
              MinTap(
                enforceMinSize: false,
                onTap: onToggleViewAll,
                child: Text(
                  showAll ? l.t('showLess') : l.t('viewAll'),
                  style: const TextStyle(
                    color: AppColors.trustBlue,
                    fontWeight: FontWeight.w700,
                    fontSize: 13,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ...visible.map(
            (n) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.border),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(
                      Icons.check_circle,
                      color: AppColors.emerald,
                      size: 18,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        n,
                        style: const TextStyle(
                          color: AppColors.trustBlueDark,
                          fontSize: 13,
                          height: 1.35,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: controller,
                  decoration: InputDecoration(
                    hintText: l.t('privateNoteHint'),
                  ),
                  onSubmitted: (_) => onAdd(),
                ),
              ),
              const SizedBox(width: 8),
              FilledButton(
                onPressed: onAdd,
                style: FilledButton.styleFrom(
                  minimumSize: const Size(0, 48),
                  padding: const EdgeInsets.symmetric(horizontal: 18),
                ),
                child: Text(l.t('add')),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _InCallMsg {
  const _InCallMsg({
    required this.sender,
    required this.text,
    required this.fromPatient,
  });

  final String sender;
  final String text;
  final bool fromPatient;
}

class _InCallMessagesCard extends StatelessWidget {
  const _InCallMessagesCard({
    required this.messages,
    required this.controller,
    required this.onSend,
  });

  final List<_InCallMsg> messages;
  final TextEditingController controller;
  final VoidCallback onSend;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.chat_bubble_outline, color: AppColors.trustBlue),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  l.t('inCallMessages'),
                  style: const TextStyle(
                    color: AppColors.trustBlueDark,
                    fontWeight: FontWeight.w800,
                    fontSize: 16,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (messages.isEmpty)
            Text(
              l.t('inCallMessagesEmpty'),
              style: const TextStyle(
                color: AppColors.slateMuted,
                fontSize: 13,
              ),
            )
          else
            ConstrainedBox(
              constraints: const BoxConstraints(maxHeight: 180),
              child: ListView.builder(
                shrinkWrap: true,
                itemCount: messages.length,
                itemBuilder: (context, i) {
                  final m = messages[i];
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Align(
                      alignment: m.fromPatient
                          ? Alignment.centerRight
                          : Alignment.centerLeft,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 8,
                        ),
                        decoration: BoxDecoration(
                          color: m.fromPatient
                              ? AppColors.trustBlueSoft
                              : const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: Text(
                          '${m.sender}: ${m.text}',
                          style: const TextStyle(
                            color: AppColors.trustBlueDark,
                            fontSize: 13,
                            height: 1.35,
                          ),
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: controller,
                  decoration: InputDecoration(
                    hintText: l.t('inCallMessageHint'),
                  ),
                  onSubmitted: (_) => onSend(),
                ),
              ),
              const SizedBox(width: 8),
              FilledButton(
                onPressed: onSend,
                style: FilledButton.styleFrom(
                  minimumSize: const Size(0, 48),
                  padding: const EdgeInsets.symmetric(horizontal: 18),
                ),
                child: Text(l.t('send')),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _AiCopilotCard extends StatelessWidget {
  const _AiCopilotCard({
    required this.controller,
    required this.onSend,
    required this.onGoogle,
    this.reply,
  });

  final TextEditingController controller;
  final VoidCallback onSend;
  final VoidCallback onGoogle;
  final String? reply;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.trustBlueSoft,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: AppColors.trustBlue.withValues(alpha: 0.12),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.auto_awesome, color: AppColors.trustBlue),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  l.t('aiCopilotActive'),
                  style: const TextStyle(
                    color: AppColors.trustBlue,
                    fontWeight: FontWeight.w800,
                    fontSize: 13,
                    letterSpacing: 0.5,
                  ),
                ),
              ),
              TextButton.icon(
                onPressed: onGoogle,
                icon: const Icon(Icons.open_in_new, size: 16),
                label: Text(l.t('searchOnGoogle')),
                style: TextButton.styleFrom(
                  foregroundColor: AppColors.trustBlue,
                  visualDensity: VisualDensity.compact,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            l.t('aiCopilotHint'),
            style: const TextStyle(
              color: AppColors.slateMuted,
              fontSize: 13,
              height: 1.35,
            ),
          ),
          if (reply != null) ...[
            const SizedBox(height: 12),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.border),
              ),
              child: Text(
                reply!,
                style: const TextStyle(
                  color: AppColors.trustBlueDark,
                  fontSize: 13,
                  height: 1.4,
                ),
              ),
            ),
          ],
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: controller,
                  decoration: InputDecoration(
                    hintText: l.t('aiCopilotPlaceholder'),
                    filled: true,
                    fillColor: AppColors.surface,
                    isDense: true,
                  ),
                  onSubmitted: (_) => onSend(),
                ),
              ),
              const SizedBox(width: 8),
              Material(
                color: AppColors.trustBlue,
                borderRadius: BorderRadius.circular(12),
                child: InkWell(
                  borderRadius: BorderRadius.circular(12),
                  onTap: onSend,
                  child: const SizedBox(
                    width: 48,
                    height: 48,
                    child: Icon(Icons.send_rounded,
                        color: Colors.white, size: 20),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
