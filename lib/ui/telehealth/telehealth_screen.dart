import 'dart:async';

import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import 'package:uuid/uuid.dart';

import '../../bloc/auth/auth_cubit.dart';
import '../../bloc/notification/notification_cubit.dart';
import '../../bloc/vault/vault_cubit.dart';
import '../../core/theme/app_colors.dart';
import '../../data/catalogs/patient_health_samples.dart';
import '../../data/models/vault_report.dart';
import '../../data/repositories/health_repository.dart';
import '../../localization/app_localizations.dart';
import '../widgets/common_widgets.dart';
import '../widgets/suwasiri_brand_header.dart';
import 'prescription_detail_sheet.dart';

class TelehealthScreen extends StatefulWidget {
  const TelehealthScreen({super.key});

  @override
  State<TelehealthScreen> createState() => _TelehealthScreenState();
}

class _TelehealthScreenState extends State<TelehealthScreen> {
  static const _doctorName = 'Dr. Aruni Perera';
  static const _clinicName = 'Lanka GP Care · Durdans Teleclinic';

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
  bool _showAiOverlay = true;
  bool _rxUpdating = true;
  String? _sessionId;
  List<Prescription> _sessionRx = [];
  Duration _remaining = const Duration(minutes: 8, seconds: 18);
  Timer? _callTimer;
  Timer? _rxTimer;
  CameraController? _camera;
  bool _cameraReady = false;
  bool _cameraBusy = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _startSession());
  }

  @override
  void dispose() {
    _noteCtrl.dispose();
    _aiCtrl.dispose();
    _callTimer?.cancel();
    _rxTimer?.cancel();
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

  /// Always present the live Telehealth layout (matches product mockups).
  Future<void> _startSession() async {
    final user = context.read<AuthCubit>().state.user;
    if (user == null) return;

    _callTimer?.cancel();
    _rxTimer?.cancel();

    setState(() {
      _sessionId = const Uuid().v4();
      _sessionRx = PatientHealthSamples.latestDoctorScript(
        patientId: user.id,
        doctorName: _doctorName,
        clinicName: _clinicName,
        sessionId: _sessionId,
        issuedAt: DateTime.now(),
      )
          .map((p) => p.copyWith(updating: true))
          .toList();
      _rxUpdating = true;
      _remaining = const Duration(minutes: 8, seconds: 18);
      _showAiOverlay = true;
      _muted = false;
      _camOff = false; // Call starts with camera on; user may switch off.
      _cameraReady = false;
    });

    // Auto-enable patient camera as soon as the video consult starts.
    unawaited(_initCamera());

    await context.read<HealthRepository>().syncGpCare(user.id);
    if (!mounted) return;

    _callTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted) return;
      setState(() {
        if (_remaining.inSeconds > 0) {
          _remaining -= const Duration(seconds: 1);
        }
      });
    });

    // Persist e-Rx via Lanka GP Care portal sync after a short draft delay.
    _rxTimer = Timer(const Duration(seconds: 5), () async {
      if (!mounted || _sessionId == null) return;
      final issued =
          await context.read<HealthRepository>().issueTelehealthPrescription(
                patientId: user.id,
                doctorName: _doctorName,
                sessionId: _sessionId!,
              );
      if (!mounted) return;
      await context.read<NotificationCubit>().load();
      if (!mounted) return;
      setState(() {
        _sessionRx = issued;
        _rxUpdating = false;
      });
    });
  }

  void _endCall() {
    _callTimer?.cancel();
    _rxTimer?.cancel();
    unawaited(_disposeCamera());
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(AppLocalizations.of(context).t('callEndedRestart'))),
    );
    _startSession();
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
      await context.read<VaultCubit>().load(user.id);
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
    _aiCtrl.clear();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(AppLocalizations.of(context).t('aiCopilotReply'))),
    );
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

    return SafeArea(
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
          _VideoStage(
            muted: _muted,
            camOff: _camOff,
            camera: _camera,
            cameraReady: _cameraReady,
            showAiOverlay: _showAiOverlay,
            doctorName: _doctorName,
            onMute: () => setState(() => _muted = !_muted),
            onCam: _toggleCamera,
            onAi: () => setState(() => _showAiOverlay = !_showAiOverlay),
            onShare: () {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text(l.t('shareSimulated'))),
              );
            },
            onEnd: _endCall,
          ),
          const SizedBox(height: 14),
          _LiveConsultationCard(
            patientLabel: patientLabel,
            timerLabel: _timerLabel,
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
            notes: _notes,
            showAll: _showAllTips,
            controller: _noteCtrl,
            onAdd: _addNote,
            onToggleViewAll: () =>
                setState(() => _showAllTips = !_showAllTips),
          ),
          const SizedBox(height: 14),
          _AiCopilotCard(
            controller: _aiCtrl,
            onSend: _askAi,
          ),
        ],
      ),
    );
  }
}

class _VideoStage extends StatelessWidget {
  const _VideoStage({
    required this.muted,
    required this.camOff,
    required this.camera,
    required this.cameraReady,
    required this.showAiOverlay,
    required this.doctorName,
    required this.onMute,
    required this.onCam,
    required this.onAi,
    required this.onShare,
    required this.onEnd,
  });

  final bool muted;
  final bool camOff;
  final CameraController? camera;
  final bool cameraReady;
  final bool showAiOverlay;
  final String doctorName;
  final VoidCallback onMute;
  final VoidCallback onCam;
  final VoidCallback onAi;
  final VoidCallback onShare;
  final VoidCallback onEnd;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);

    return Container(
      height: 340,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: AppColors.trustBlueDark.withValues(alpha: 0.12),
            blurRadius: 18,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        fit: StackFit.expand,
        children: [
          // Simulated doctor video feed
          DecoratedBox(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Color(0xFF4A6FA5),
                  Color(0xFF2C4A6E),
                  Color(0xFF1A2F45),
                ],
              ),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 120,
                  height: 120,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: const Color(0xFF5B8DEF),
                    border: Border.all(color: Colors.white24, width: 3),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.25),
                        blurRadius: 16,
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.medical_services_rounded,
                    size: 56,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 14),
                Text(
                  doctorName,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w800,
                    fontSize: 17,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  l.t('gpCareLive'),
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.75),
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 48),
              ],
            ),
          ),
          Positioned(
            top: 14,
            left: 14,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: AppColors.emergencyRed,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                l.t('recSecure'),
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w800,
                  fontSize: 10,
                  letterSpacing: 0.4,
                ),
              ),
            ),
          ),
          Positioned(
            top: 14,
            right: 14,
            child: Container(
              width: 96,
              height: 128,
              decoration: BoxDecoration(
                color: const Color(0xFF1A2332),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: Colors.white24),
              ),
              clipBehavior: Clip.antiAlias,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  if (!camOff &&
                      cameraReady &&
                      camera != null &&
                      camera!.value.isInitialized)
                    FittedBox(
                      fit: BoxFit.cover,
                      clipBehavior: Clip.hardEdge,
                      child: SizedBox(
                        width: camera!.value.previewSize?.height ?? 96,
                        height: camera!.value.previewSize?.width ?? 128,
                        child: CameraPreview(camera!),
                      ),
                    )
                  else
                    Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          camOff ? Icons.videocam_off : Icons.person,
                          color: Colors.white70,
                          size: 30,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          camOff ? l.t('cameraOff') : l.t('youFeed'),
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            color: Colors.white70,
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                  Positioned(
                    left: 0,
                    right: 0,
                    bottom: 0,
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 4),
                      color: Colors.black54,
                      child: Text(
                        l.t('youFeed'),
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          if (showAiOverlay)
            Positioned(
              left: 14,
              right: 110,
              top: 54,
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.trustBlue.withValues(alpha: 0.94),
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.trustBlue.withValues(alpha: 0.35),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.auto_awesome,
                            color: Colors.white, size: 16),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            l.t('aiTranslateTitle'),
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w800,
                              fontSize: 11,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      l.t('aiTranslateBody'),
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.95),
                        fontSize: 12,
                        height: 1.35,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          Positioned(
            left: 0,
            right: 0,
            bottom: 16,
            child: Center(
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                decoration: BoxDecoration(
                  color: const Color(0xE61A2332),
                  borderRadius: BorderRadius.circular(36),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    _CallControl(
                      icon: muted ? Icons.mic_off : Icons.mic_none_rounded,
                      onTap: onMute,
                    ),
                    const SizedBox(width: 10),
                    _CallControl(
                      icon: camOff ? Icons.videocam_off : Icons.videocam,
                      onTap: onCam,
                    ),
                    const SizedBox(width: 10),
                    _CallControl(
                      icon: Icons.auto_awesome,
                      onTap: onAi,
                      color: AppColors.trustBlue,
                    ),
                    const SizedBox(width: 10),
                    _CallControl(
                      icon: Icons.file_upload_outlined,
                      onTap: onShare,
                    ),
                    const SizedBox(width: 10),
                    _CallControl(
                      icon: Icons.phone_disabled_rounded,
                      onTap: onEnd,
                      color: const Color(0xFF3A4454),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _CallControl extends StatelessWidget {
  const _CallControl({
    required this.icon,
    required this.onTap,
    this.color = const Color(0xFF2A3444),
  });

  final IconData icon;
  final VoidCallback onTap;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: color,
      shape: const CircleBorder(),
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: onTap,
        child: SizedBox(
          width: 44,
          height: 44,
          child: Icon(icon, color: Colors.white, size: 22),
        ),
      ),
    );
  }
}

class _LiveConsultationCard extends StatelessWidget {
  const _LiveConsultationCard({
    required this.patientLabel,
    required this.timerLabel,
  });

  final String patientLabel;
  final String timerLabel;

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
            icon: Icons.schedule,
            iconBg: AppColors.warningSoft,
            iconColor: AppColors.warning,
            label: l.t('timeRemaining'),
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
                      MinTap(
                        enforceMinSize: false,
                        onTap: updating
                            ? null
                            : () => onOpenClinic(pending, clinic, doctor),
                        child: Text(
                          clinic,
                          style: const TextStyle(
                            color: AppColors.trustBlue,
                            fontSize: 15,
                            fontWeight: FontWeight.w800,
                            decoration: TextDecoration.underline,
                            decorationColor: AppColors.trustBlue,
                          ),
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
                      MinTap(
                        enforceMinSize: false,
                        onTap: updating
                            ? null
                            : () => onOpenClinic(pending, clinic, doctor),
                        child: Text(
                          doctor,
                          style: const TextStyle(
                            color: AppColors.trustBlueDark,
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                          ),
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
  });

  final List<String> notes;
  final bool showAll;
  final TextEditingController controller;
  final VoidCallback onAdd;
  final VoidCallback onToggleViewAll;

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
                  l.t('quickNotes'),
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

class _AiCopilotCard extends StatelessWidget {
  const _AiCopilotCard({
    required this.controller,
    required this.onSend,
  });

  final TextEditingController controller;
  final VoidCallback onSend;

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
            ],
          ),
          const SizedBox(height: 6),
          Text(
            l.t('aiCopilotHint'),
            style: const TextStyle(
              color: AppColors.slateMuted,
              fontSize: 13,
            ),
          ),
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
