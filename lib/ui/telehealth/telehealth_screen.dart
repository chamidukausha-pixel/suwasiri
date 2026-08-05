import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:uuid/uuid.dart';

import '../../bloc/auth/auth_cubit.dart';
import '../../bloc/notification/notification_cubit.dart';
import '../../core/theme/app_colors.dart';
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

  final _noteCtrl = TextEditingController();
  final _aiCtrl = TextEditingController();
  final _notes = <String>[
    'Rest for 2 days. Avoid cold beverages and direct cold drafts.',
    'Monitor body temperature every 4 hours. Keep a log.',
    'Take Paracetamol only if temperature exceeds 38°C / 100°F.',
  ];

  bool _inCall = false;
  bool _muted = false;
  bool _camOff = false;
  bool _showAiOverlay = true;
  bool _rxUpdating = false;
  bool _sendingPharmacare = false;
  String? _sessionId;
  List<Prescription> _sessionRx = [];
  Duration _remaining = const Duration(minutes: 8, seconds: 18);
  Timer? _callTimer;
  Timer? _rxTimer;

  @override
  void dispose() {
    _noteCtrl.dispose();
    _aiCtrl.dispose();
    _callTimer?.cancel();
    _rxTimer?.cancel();
    super.dispose();
  }

  Future<void> _joinCall() async {
    final user = context.read<AuthCubit>().state.user;
    if (user == null) return;
    await context.read<HealthRepository>().syncGpCare(user.id);
    if (!mounted) return;

    setState(() {
      _inCall = true;
      _sessionId = const Uuid().v4();
      _sessionRx = [];
      _rxUpdating = false;
      _remaining = const Duration(minutes: 8, seconds: 18);
      _showAiOverlay = true;
    });

    _callTimer?.cancel();
    _callTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted || !_inCall) return;
      setState(() {
        if (_remaining.inSeconds > 0) {
          _remaining -= const Duration(seconds: 1);
        }
      });
    });

    // Simulate Lanka GP Care: doctor drafts then issues e-Rx mid-call.
    _rxTimer?.cancel();
    _rxTimer = Timer(const Duration(seconds: 4), () async {
      if (!mounted || !_inCall) return;
      setState(() => _rxUpdating = true);
      await Future<void>.delayed(const Duration(seconds: 2));
      if (!mounted || !_inCall || _sessionId == null) return;
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
    setState(() => _inCall = false);
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
      _sessionRx = _sessionRx
          .map((p) => p.copyWith(sentToPharmacare: true))
          .toList();
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
      SnackBar(
        content: Text(
          AppLocalizations.of(context).t('aiCopilotReply'),
        ),
      ),
    );
  }

  String get _timerLabel {
    final m = _remaining.inMinutes.remainder(60).toString().padLeft(2, '0');
    final s = _remaining.inSeconds.remainder(60).toString().padLeft(2, '0');
    return '$m:$s';
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final user = context.watch<AuthCubit>().state.user;
    final age = user?.dateOfBirth == null
        ? null
        : DateTime.now().year - user!.dateOfBirth!.year;
    final patientLabel = user == null
        ? '—'
        : '${user.name}${age != null ? ' ($age)' : ''}';

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
                  fontSize: 26,
                ),
          ),
          const SizedBox(height: 6),
          Text(
            l.t('telehealthSubtitle'),
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: 16),
          if (!_inCall)
            SoftCard(
              child: Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: AppColors.trustBlueSoft,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(
                      Icons.video_call_rounded,
                      color: AppColors.trustBlue,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      l.t('joinConsultHint'),
                      style: const TextStyle(
                        color: AppColors.trustBlueDark,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  FilledButton(
                    onPressed: _joinCall,
                    style: FilledButton.styleFrom(
                      minimumSize: const Size(0, 40),
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                    ),
                    child: Text(l.t('joinCall')),
                  ),
                ],
              ),
            )
          else ...[
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
          ],
          if (_inCall && (_rxUpdating || _sessionRx.isNotEmpty)) ...[
            const SizedBox(height: 14),
            _EPrescriptionCard(
              medicines: _sessionRx,
              updating: _rxUpdating,
              sending: _sendingPharmacare,
              onSendPharmacare: _sessionRx.isNotEmpty &&
                      !_rxUpdating &&
                      !_sessionRx.every((p) => p.sentToPharmacare)
                  ? _sendToPharmacare
                  : null,
              sent: _sessionRx.isNotEmpty &&
                  _sessionRx.every((p) => p.sentToPharmacare),
            ),
          ],
          if (_inCall) ...[
            const SizedBox(height: 14),
            _QuickNotesCard(
              notes: _notes,
              controller: _noteCtrl,
              onAdd: _addNote,
            ),
            const SizedBox(height: 14),
            _AiCopilotCard(
              controller: _aiCtrl,
              onSend: _askAi,
            ),
          ],
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
      height: 320,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(22),
        gradient: const LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Color(0xFF1E3A5F), Color(0xFF0B1F3A)],
        ),
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        children: [
          Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    AppColors.trustBlue.withValues(alpha: 0.35),
                    const Color(0xFF0B1F3A),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              child: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    CircleAvatar(
                      radius: 42,
                      backgroundColor: Colors.white.withValues(alpha: 0.15),
                      child: const Icon(
                        Icons.person,
                        size: 48,
                        color: Colors.white70,
                      ),
                    ),
                    const SizedBox(height: 10),
                    Text(
                      doctorName,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w700,
                        fontSize: 16,
                      ),
                    ),
                    Text(
                      l.t('gpCareLive'),
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.7),
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          Positioned(
            top: 12,
            left: 12,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
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
            top: 12,
            right: 12,
            child: Container(
              width: 86,
              height: 110,
              decoration: BoxDecoration(
                color: const Color(0xFF1A2332),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.white24),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    camOff ? Icons.videocam_off : Icons.person,
                    color: Colors.white70,
                    size: 28,
                  ),
                  const SizedBox(height: 6),
                  Text(
                    l.t('youFeed'),
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      color: Colors.white70,
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          ),
          if (showAiOverlay)
            Positioned(
              left: 12,
              right: 108,
              top: 52,
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.trustBlue.withValues(alpha: 0.92),
                  borderRadius: BorderRadius.circular(14),
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
                        color: Colors.white.withValues(alpha: 0.92),
                        fontSize: 12,
                        height: 1.35,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          Positioned(
            left: 12,
            right: 12,
            bottom: 14,
            child: Center(
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                decoration: BoxDecoration(
                  color: const Color(0xE61A2332),
                  borderRadius: BorderRadius.circular(32),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    _CallControl(
                      icon: muted ? Icons.mic_off : Icons.mic,
                      onTap: onMute,
                    ),
                    const SizedBox(width: 8),
                    _CallControl(
                      icon: camOff ? Icons.videocam_off : Icons.videocam,
                      onTap: onCam,
                    ),
                    const SizedBox(width: 8),
                    _CallControl(
                      icon: Icons.auto_awesome,
                      onTap: onAi,
                      color: AppColors.trustBlue,
                    ),
                    const SizedBox(width: 8),
                    _CallControl(
                      icon: Icons.ios_share_rounded,
                      onTap: onShare,
                    ),
                    const SizedBox(width: 8),
                    _CallControl(
                      icon: Icons.call_end,
                      onTap: onEnd,
                      color: AppColors.emergencyRed,
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
          width: 42,
          height: 42,
          child: Icon(icon, color: Colors.white, size: 20),
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
                  color: AppColors.emeraldSoft,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  l.t('secureV3'),
                  style: const TextStyle(
                    color: AppColors.emerald,
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
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: iconBg,
            borderRadius: BorderRadius.circular(12),
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
    this.onSendPharmacare,
  });

  final List<Prescription> medicines;
  final bool updating;
  final bool sending;
  final bool sent;
  final VoidCallback? onSendPharmacare;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);

    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border),
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
                    const SizedBox(height: 12),
                    if (medicines.isEmpty && updating)
                      Text(
                        l.t('doctorUpdatingRx'),
                        style: const TextStyle(
                          color: AppColors.slateMuted,
                          fontStyle: FontStyle.italic,
                          fontSize: 13,
                        ),
                      )
                    else ...[
                      ...medicines.map(
                        (m) => Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: Container(
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
                                    borderRadius: BorderRadius.circular(16),
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
                      if (updating)
                        Padding(
                          padding: const EdgeInsets.only(top: 4, bottom: 8),
                          child: Row(
                            children: [
                              const Icon(
                                Icons.sync,
                                size: 14,
                                color: AppColors.slateMuted,
                              ),
                              const SizedBox(width: 6),
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
                      if (onSendPharmacare != null) ...[
                        const SizedBox(height: 4),
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
                        const SizedBox(height: 4),
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
    required this.controller,
    required this.onAdd,
  });

  final List<String> notes;
  final TextEditingController controller;
  final VoidCallback onAdd;

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
              Text(
                l.t('viewAll'),
                style: const TextStyle(
                  color: AppColors.trustBlue,
                  fontWeight: FontWeight.w700,
                  fontSize: 13,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ...notes.take(3).map(
                (n) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
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
                    isDense: true,
                  ),
                  onSubmitted: (_) => onAdd(),
                ),
              ),
              const SizedBox(width: 8),
              FilledButton(
                onPressed: onAdd,
                style: FilledButton.styleFrom(
                  minimumSize: const Size(0, 48),
                  padding: const EdgeInsets.symmetric(horizontal: 16),
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
          color: AppColors.trustBlue.withValues(alpha: 0.15),
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
                shape: const CircleBorder(),
                child: InkWell(
                  customBorder: const CircleBorder(),
                  onTap: onSend,
                  child: const SizedBox(
                    width: 44,
                    height: 44,
                    child: Icon(Icons.send_rounded, color: Colors.white, size: 20),
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
