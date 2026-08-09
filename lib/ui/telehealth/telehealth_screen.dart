import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import 'package:uuid/uuid.dart';

import '../../bloc/auth/auth_cubit.dart';
import '../../bloc/notification/notification_cubit.dart';
import '../../core/theme/app_colors.dart';
import '../../data/models/user_profile.dart';
import '../../data/models/vault_report.dart';
import '../../data/repositories/health_repository.dart';
import '../../localization/app_localizations.dart';
import '../widgets/common_widgets.dart';
import '../widgets/suwasiri_brand_header.dart';

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
  bool _sendingPharmacare = false;
  String? _sessionId;
  List<Prescription> _sessionRx = [];
  Duration _remaining = const Duration(minutes: 8, seconds: 18);
  Timer? _callTimer;
  Timer? _rxTimer;

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
    super.dispose();
  }

  /// Always present the live Telehealth layout (matches product mockups).
  Future<void> _startSession() async {
    final user = context.read<AuthCubit>().state.user;
    if (user == null) return;

    _callTimer?.cancel();
    _rxTimer?.cancel();

    setState(() {
      _sessionId = const Uuid().v4();
      _sessionRx = [
        Prescription(
          id: 'preview-amox',
          medicine: 'Amoxicillin 500mg',
          doctor: _doctorName,
          code: 'EP-PREVIEW',
          active: true,
          patientId: user.id,
          schedule: 'Antibiotic (TDS Schedule)',
          doseBadge: '1×3',
          sessionId: _sessionId,
          issuedAt: DateTime.now(),
          clinicName: _clinicName,
          updating: true,
        ),
        Prescription(
          id: 'preview-para',
          medicine: 'Paracetamol 500mg',
          doctor: _doctorName,
          code: 'EP-PREVIEW-2',
          active: true,
          patientId: user.id,
          schedule: 'As Needed for Pain/Fever',
          doseBadge: 'PRN',
          sessionId: _sessionId,
          issuedAt: DateTime.now(),
          clinicName: _clinicName,
          updating: true,
        ),
      ];
      _rxUpdating = true;
      _remaining = const Duration(minutes: 8, seconds: 18);
      _showAiOverlay = true;
      _muted = false;
      _camOff = false;
    });

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
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(AppLocalizations.of(context).t('callEndedRestart'))),
    );
    _startSession();
  }

  Future<void> _sendToPharmacare() async {
    final user = context.read<AuthCubit>().state.user;
    if (user == null || _sessionId == null || _sessionRx.isEmpty) return;
    setState(() => _sendingPharmacare = true);
    await context.read<HealthRepository>().sendPrescriptionsToPharmacare(
          patientId: user.id,
          sessionId: _sessionId!,
        );
    if (!mounted) return;
    await context.read<NotificationCubit>().load();
    if (!mounted) return;
    setState(() {
      _sendingPharmacare = false;
      _sessionRx =
          _sessionRx.map((p) => p.copyWith(sentToPharmacare: true)).toList();
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(AppLocalizations.of(context).t('pharmacareSent'))),
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
    final canSendPharmacare = _sessionRx.isNotEmpty &&
        !_rxUpdating &&
        !_sessionRx.every((p) => p.sentToPharmacare);
    final sent = _sessionRx.isNotEmpty &&
        _sessionRx.every((p) => p.sentToPharmacare);

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
            showAiOverlay: _showAiOverlay,
            doctorName: _doctorName,
            onMute: () => setState(() => _muted = !_muted),
            onCam: () => setState(() => _camOff = !_camOff),
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
            sending: _sendingPharmacare,
            sent: sent,
            patient: context.watch<AuthCubit>().state.user,
            doctorName: _doctorName,
            clinicName: _clinicName,
            onSendPharmacare: canSendPharmacare ? _sendToPharmacare : null,
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
              width: 88,
              height: 118,
              decoration: BoxDecoration(
                color: const Color(0xFF1A2332),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: Colors.white24),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    camOff ? Icons.videocam_off : Icons.person,
                    color: Colors.white70,
                    size: 30,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    l.t('youFeed'),
                    style: const TextStyle(
                      color: Colors.white70,
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
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
    required this.sending,
    required this.sent,
    required this.doctorName,
    required this.clinicName,
    this.patient,
    this.onSendPharmacare,
  });

  final List<Prescription> medicines;
  final bool updating;
  final bool sending;
  final bool sent;
  final UserProfile? patient;
  final String doctorName;
  final String clinicName;
  final VoidCallback? onSendPharmacare;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final first = medicines.isNotEmpty ? medicines.first : null;
    final issuedLabel = first?.issuedAt != null
        ? DateFormat('d MMM yyyy · hh:mm a').format(first!.issuedAt!)
        : '—';
    final clinic = first?.clinicName ?? clinicName;
    final showFormal = !updating && medicines.isNotEmpty;

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
                      '${l.t('issuedDate')}: $issuedLabel',
                      style: const TextStyle(
                        color: AppColors.slateMuted,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Text(
                      '${l.t('medicalClinic')}: $clinic',
                      style: const TextStyle(
                        color: AppColors.trustBlueDark,
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 12),
                    if (showFormal)
                      _IssuedPrescriptionDocument(
                        medicines: medicines,
                        patient: patient,
                        doctorName: first?.doctor ?? doctorName,
                        clinicName: clinic,
                      )
                    else ...[
                      ...medicines.map(
                        (m) => Padding(
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
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        m.medicine,
                                        style: const TextStyle(
                                          color: AppColors.trustBlueDark,
                                          fontWeight: FontWeight.w800,
                                          fontSize: 14,
                                        ),
                                      ),
                                      if (m.schedule.isNotEmpty) ...[
                                        const SizedBox(height: 3),
                                        Text(
                                          m.schedule,
                                          style: const TextStyle(
                                            color: AppColors.slateMuted,
                                            fontSize: 12,
                                          ),
                                        ),
                                      ],
                                    ],
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 10,
                                    vertical: 5,
                                  ),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFE2E8F0),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    m.doseBadge.isEmpty ? m.code : m.doseBadge,
                                    style: const TextStyle(
                                      color: AppColors.trustBlueDark,
                                      fontWeight: FontWeight.w700,
                                      fontSize: 12,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.only(top: 2, bottom: 4),
                        child: Row(
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
                      ),
                    ],
                    const SizedBox(height: 6),
                    Text(
                      l.t('gpCarePortalSync'),
                      style: const TextStyle(
                        color: AppColors.slateMuted,
                        fontSize: 11,
                      ),
                    ),
                    if (onSendPharmacare != null) ...[
                      const SizedBox(height: 10),
                      SizedBox(
                        width: double.infinity,
                        child: FilledButton.icon(
                          onPressed: sending ? null : onSendPharmacare,
                          icon: sending
                              ? const SizedBox(
                                  width: 16,
                                  height: 16,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: Colors.white,
                                  ),
                                )
                              : const Icon(Icons.local_pharmacy_outlined),
                          label: Text(l.t('sendPharmacare')),
                        ),
                      ),
                    ] else if (sent) ...[
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          const Icon(
                            Icons.check_circle,
                            color: AppColors.emerald,
                            size: 18,
                          ),
                          const SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              l.t('pharmacareSent'),
                              style: const TextStyle(
                                color: AppColors.emerald,
                                fontWeight: FontWeight.w600,
                                fontSize: 13,
                              ),
                            ),
                          ),
                        ],
                      ),
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

/// Formal dual-copy prescription form (patient + PharmaCare), matching
/// regulated script layout for issued e-Rx under E-Prescription.
class _IssuedPrescriptionDocument extends StatelessWidget {
  const _IssuedPrescriptionDocument({
    required this.medicines,
    required this.doctorName,
    required this.clinicName,
    this.patient,
  });

  final List<Prescription> medicines;
  final UserProfile? patient;
  final String doctorName;
  final String clinicName;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          l.t('issuedPrescriptionForm'),
          style: const TextStyle(
            color: AppColors.slateMuted,
            fontSize: 11,
            fontWeight: FontWeight.w700,
            letterSpacing: 0.3,
          ),
        ),
        const SizedBox(height: 8),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _PrescriptionFormCopy(
                width: 280,
                sidebarLabel: l.t('rxPharmacistCopy'),
                patientFooter: false,
                medicines: medicines,
                patient: patient,
                doctorName: doctorName,
                clinicName: clinicName,
              ),
              const SizedBox(width: 10),
              _PrescriptionFormCopy(
                width: 280,
                sidebarLabel: l.t('rxAgencyCopy'),
                patientFooter: true,
                medicines: medicines,
                patient: patient,
                doctorName: doctorName,
                clinicName: clinicName,
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _PrescriptionFormCopy extends StatelessWidget {
  const _PrescriptionFormCopy({
    required this.width,
    required this.sidebarLabel,
    required this.patientFooter,
    required this.medicines,
    required this.doctorName,
    required this.clinicName,
    this.patient,
  });

  final double width;
  final String sidebarLabel;
  final bool patientFooter;
  final List<Prescription> medicines;
  final UserProfile? patient;
  final String doctorName;
  final String clinicName;

  static const _ink = Color(0xFF1A1A1A);
  static const _teal = Color(0xFFB8D4D8);
  static const _tealDeep = Color(0xFF7BA8B0);
  static const _bodyWash = Color(0xFFE8F4F6);

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final issued = medicines.first.issuedAt ?? DateTime.now();
    final dateStr = DateFormat('dd/MM/yyyy').format(issued);
    final digits = medicines.first.code.replaceAll(RegExp(r'[^0-9]'), '');
    final scriptNo = digits.isEmpty
        ? '00003194'
        : digits.padLeft(8, '0').substring(digits.padLeft(8, '0').length - 8);
    final patientName = patient?.name.isNotEmpty == true
        ? patient!.name
        : 'Kamal Gunasekara';
    final healthId = patient?.ceylonHealthId?.isNotEmpty == true
        ? patient!.ceylonHealthId!
        : (patient?.nic?.isNotEmpty == true
            ? patient!.nic!
            : '1234 56789 0-1');
    final address = [
      if (patient?.region != null && patient!.region!.isNotEmpty)
        patient!.region!,
      'Sri Lanka',
    ].join(', ');
    final phone = patient?.mobileNo?.isNotEmpty == true
        ? patient!.mobileNo!
        : '+94 11 214 0000';

    return Container(
      width: width,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: const Color(0xFF9CA3AF), width: 1.2),
      ),
      child: IntrinsicHeight(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Container(
              width: 22,
              color: _teal,
              alignment: Alignment.center,
              child: RotatedBox(
                quarterTurns: 3,
                child: Text(
                  sidebarLabel,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Color(0xFF334155),
                    fontSize: 9,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.4,
                  ),
                ),
              ),
            ),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: const EdgeInsets.fromLTRB(8, 8, 8, 4),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          doctorName,
                          style: const TextStyle(
                            color: _ink,
                            fontWeight: FontWeight.w800,
                            fontSize: 11,
                          ),
                        ),
                        Text(
                          clinicName,
                          style: const TextStyle(color: _ink, fontSize: 9),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '${l.t('rxPrescriberNo')} 1234567',
                          style: const TextStyle(color: _ink, fontSize: 9),
                        ),
                        Text(
                          'Phone: $phone',
                          style: const TextStyle(color: _ink, fontSize: 9),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    width: double.infinity,
                    color: _teal.withValues(alpha: 0.45),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 5,
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          "${l.t('rxPatientHealthId')}  $healthId",
                          style: const TextStyle(
                            color: _ink,
                            fontSize: 9,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(5),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.7),
                            border: Border.all(color: _tealDeep),
                          ),
                          child: Text(
                            l.t('rxEntitlementNo'),
                            style: const TextStyle(color: _ink, fontSize: 8),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          "${l.t('rxPatientName')}: $patientName",
                          style: const TextStyle(
                            color: _ink,
                            fontSize: 9,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        Text(
                          "${l.t('rxAddress')}: $address",
                          style: const TextStyle(color: _ink, fontSize: 9),
                        ),
                      ],
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(8, 6, 8, 4),
                    child: Row(
                      children: [
                        Text(
                          '${l.t('rxDate')} $dateStr',
                          style: const TextStyle(
                            color: _ink,
                            fontSize: 9,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const Spacer(),
                        _TinyCheck(label: l.t('rxPrivate'), checked: true),
                        const SizedBox(width: 6),
                        _TinyCheck(label: l.t('rxFormulary'), checked: false),
                      ],
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                    child: Row(
                      children: [
                        _TinyCheck(label: l.t('rxBrandSub'), checked: false),
                      ],
                    ),
                  ),
                  const SizedBox(height: 4),
                  Container(
                    width: double.infinity,
                    margin: const EdgeInsets.symmetric(horizontal: 6),
                    padding: const EdgeInsets.fromLTRB(8, 8, 8, 10),
                    decoration: BoxDecoration(
                      color: _bodyWash,
                      border: Border.all(color: _tealDeep.withValues(alpha: 0.6)),
                      borderRadius: BorderRadius.circular(2),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Align(
                          alignment: Alignment.centerRight,
                          child: Text(
                            '${l.t('rxScriptNo')}: $scriptNo',
                            style: const TextStyle(
                              color: _ink,
                              fontSize: 9,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                        const SizedBox(height: 6),
                        ...medicines.map((m) {
                          final qty = m.doseBadge.toUpperCase() == 'PRN'
                              ? '1'
                              : (RegExp(r'(\d+)').firstMatch(m.doseBadge)?.group(1) ??
                                  '1');
                          final repeats =
                              m.doseBadge.toUpperCase() == 'PRN' ? '0' : '0';
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 10),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  m.medicine,
                                  style: const TextStyle(
                                    color: _ink,
                                    fontSize: 11,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                                if (m.schedule.isNotEmpty)
                                  Text(
                                    m.schedule,
                                    style: const TextStyle(
                                      color: _ink,
                                      fontSize: 10,
                                    ),
                                  ),
                                const SizedBox(height: 2),
                                Text(
                                  '${l.t('rxQuantity')}: $qty    $repeats ${l.t('rxRepeats')}',
                                  style: const TextStyle(
                                    color: _ink,
                                    fontSize: 9,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          );
                        }),
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Expanded(
                              child: Text(
                                '$doctorName, MBBS',
                                style: const TextStyle(
                                  color: _ink,
                                  fontSize: 9,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ),
                            Text(
                              '${medicines.length} ${l.t('rxItemsPrinted')}',
                              style: const TextStyle(
                                color: _ink,
                                fontSize: 8,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 6),
                  if (!patientFooter)
                    Container(
                      width: double.infinity,
                      margin: const EdgeInsets.fromLTRB(6, 0, 6, 6),
                      padding: const EdgeInsets.all(8),
                      color: _teal,
                      child: Text(
                        l.t('rxDoctorSign'),
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          color: Color(0xFF1E3A3F),
                          fontSize: 9,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    )
                  else
                    Container(
                      width: double.infinity,
                      margin: const EdgeInsets.fromLTRB(6, 0, 6, 6),
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: _teal.withValues(alpha: 0.55),
                        border: Border.all(color: _tealDeep),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            l.t('rxPatientDeclare'),
                            style: const TextStyle(
                              color: _ink,
                              fontSize: 8,
                              height: 1.25,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            l.t('rxPatientSignature'),
                            style: const TextStyle(color: _ink, fontSize: 8),
                          ),
                          Container(
                            margin: const EdgeInsets.only(top: 2, bottom: 6),
                            height: 1,
                            color: _ink.withValues(alpha: 0.35),
                          ),
                          Text(
                            '${l.t('rxDateOfSupply')}   /   /',
                            style: const TextStyle(color: _ink, fontSize: 8),
                          ),
                        ],
                      ),
                    ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(8, 0, 8, 6),
                    child: Align(
                      alignment: Alignment.centerRight,
                      child: Text(
                        l.t('rxPrivacyNote'),
                        style: const TextStyle(
                          color: Color(0xFF64748B),
                          fontSize: 7,
                          fontStyle: FontStyle.italic,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TinyCheck extends StatelessWidget {
  const _TinyCheck({required this.label, required this.checked});

  final String label;
  final bool checked;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 10,
          height: 10,
          decoration: BoxDecoration(
            border: Border.all(color: const Color(0xFF1A1A1A)),
            color: checked ? const Color(0xFF1A1A1A) : Colors.white,
          ),
          child: checked
              ? const Icon(Icons.check, size: 8, color: Colors.white)
              : null,
        ),
        const SizedBox(width: 3),
        Text(
          label,
          style: const TextStyle(
            color: Color(0xFF1A1A1A),
            fontSize: 8,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
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
