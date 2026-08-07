import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../bloc/auth/auth_cubit.dart';
import '../../bloc/sos/sos_cubit.dart';
import '../../core/theme/app_colors.dart';
import '../../localization/app_localizations.dart';

Future<void> showSosOverlay(BuildContext context) {
  final patientId = context.read<AuthCubit>().state.user?.id;
  context.read<SosCubit>().prepareEmergency(patientId: patientId);

  return showGeneralDialog(
    context: context,
    barrierDismissible: false,
    barrierLabel: 'SOS',
    barrierColor: Colors.black87,
    pageBuilder: (_, animation, secondaryAnimation) {
      return FadeTransition(
        opacity: animation,
        child: const SosOverlay(),
      );
    },
  );
}

class SosOverlay extends StatelessWidget {
  const SosOverlay({super.key});

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);

    return Material(
      color: AppColors.sosBackground,
      child: SafeArea(
        child: BlocBuilder<SosCubit, SosState>(
          builder: (context, state) {
            return Column(
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 12, 12, 0),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              l.t('lankaRescueSystem'),
                              style: const TextStyle(
                                color: AppColors.sosAccentRed,
                                fontWeight: FontWeight.w700,
                                fontSize: 11,
                                letterSpacing: 1.1,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Row(
                              children: [
                                const Icon(
                                  Icons.airport_shuttle_rounded,
                                  color: Colors.white,
                                  size: 22,
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  l.t('suwasariyaTitle'),
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w800,
                                    fontSize: 22,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      Material(
                        color: const Color(0xFF2A2D38),
                        shape: const CircleBorder(),
                        child: InkWell(
                          customBorder: const CircleBorder(),
                          onTap: () async {
                            await context.read<SosCubit>().closeSession();
                            if (context.mounted) Navigator.of(context).pop();
                          },
                          child: const Padding(
                            padding: EdgeInsets.all(10),
                            child: Icon(Icons.close, color: Colors.white70, size: 20),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.fromLTRB(20, 20, 20, 16),
                    child: Column(
                      children: [
                        const _RadarPulse(),
                        const SizedBox(height: 22),
                        if (state.phase == SosPhase.locating)
                          const Padding(
                            padding: EdgeInsets.symmetric(vertical: 40),
                            child: CircularProgressIndicator(
                              color: AppColors.sosAccentRed,
                            ),
                          )
                        else ...[
                          _DispatcherLockCard(state: state),
                          const SizedBox(height: 18),
                          _ShareGpsConsent(
                            approved: state.shareLiveGps,
                            onChanged: (v) => context
                                .read<SosCubit>()
                                .setShareLiveGps(v ?? false),
                          ),
                          if (state.error != null) ...[
                            const SizedBox(height: 12),
                            Text(
                              state.error!,
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                color: Colors.white.withValues(alpha: 0.55),
                                fontSize: 12,
                              ),
                            ),
                          ],
                          const SizedBox(height: 18),
                          Text(
                            l.t('suwasariyaBlurb'),
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.88),
                              height: 1.45,
                              fontSize: 14,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
                  child: Column(
                    children: [
                      SizedBox(
                        width: double.infinity,
                        height: 54,
                        child: DecoratedBox(
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(16),
                            boxShadow: [
                              BoxShadow(
                                color: AppColors.sosAccentRed
                                    .withValues(alpha: 0.45),
                                blurRadius: 18,
                                offset: const Offset(0, 8),
                              ),
                            ],
                          ),
                          child: FilledButton.icon(
                            onPressed: state.phase == SosPhase.locating
                                ? null
                                : () => context
                                    .read<SosCubit>()
                                    .callSuwasariya(),
                            style: FilledButton.styleFrom(
                              backgroundColor: AppColors.sosAccentRed,
                              disabledBackgroundColor:
                                  AppColors.sosAccentRed.withValues(alpha: 0.4),
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(16),
                              ),
                            ),
                            icon: const Icon(Icons.phone_in_talk_rounded),
                            label: Text(
                              l.t('directCallSuwasariya'),
                              style: const TextStyle(
                                fontWeight: FontWeight.w800,
                                letterSpacing: 0.4,
                              ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        l.t('lkNhdFooter'),
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.35),
                          fontSize: 10,
                          letterSpacing: 0.6,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _RadarPulse extends StatefulWidget {
  const _RadarPulse();

  @override
  State<_RadarPulse> createState() => _RadarPulseState();
}

class _RadarPulseState extends State<_RadarPulse>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat();
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 160,
      height: 160,
      child: AnimatedBuilder(
        animation: _ctrl,
        builder: (context, _) {
          return CustomPaint(
            painter: _RadarPainter(progress: _ctrl.value),
            child: const Center(
              child: Icon(
                Icons.location_on_rounded,
                color: Colors.white,
                size: 36,
              ),
            ),
          );
        },
      ),
    );
  }
}

class _RadarPainter extends CustomPainter {
  _RadarPainter({required this.progress});

  final double progress;

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final maxR = size.width / 2;

    for (var i = 0; i < 3; i++) {
      final t = (progress + i / 3) % 1.0;
      final r = maxR * (0.35 + t * 0.65);
      final paint = Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.6
        ..color = AppColors.sosAccentRed.withValues(alpha: (1 - t) * 0.55);
      _drawDashedCircle(canvas, center, r, paint);
    }

    final glow = Paint()
      ..color = AppColors.sosAccentRed.withValues(alpha: 0.18)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 16);
    canvas.drawCircle(center, 28, glow);

    final core = Paint()..color = const Color(0xFF1A1D28);
    canvas.drawCircle(center, 26, core);
    canvas.drawCircle(
      center,
      26,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.5
        ..color = AppColors.sosAccentRed.withValues(alpha: 0.7),
    );
  }

  void _drawDashedCircle(
    Canvas canvas,
    Offset center,
    double radius,
    Paint paint,
  ) {
    const dashCount = 36;
    for (var i = 0; i < dashCount; i++) {
      if (i.isOdd) continue;
      final a0 = (i / dashCount) * math.pi * 2;
      final a1 = ((i + 0.55) / dashCount) * math.pi * 2;
      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        a0,
        a1 - a0,
        false,
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant _RadarPainter oldDelegate) =>
      oldDelegate.progress != progress;
}

class _DispatcherLockCard extends StatelessWidget {
  const _DispatcherLockCard({required this.state});

  final SosState state;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final loc = state.location;
    final safe = loc?.isGpsSafe ?? false;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.sosCard,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFF2A2F3D)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.gps_fixed, color: Colors.white, size: 18),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  l.t('dispatcherLocationLock'),
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w800,
                    fontSize: 13,
                    letterSpacing: 0.4,
                  ),
                ),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: (safe ? AppColors.sosSafeGreen : AppColors.warning)
                      .withValues(alpha: 0.18),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  safe ? l.t('gpsSafe') : l.t('gpsWeak'),
                  style: TextStyle(
                    color: safe ? AppColors.sosSafeGreen : AppColors.warning,
                    fontWeight: FontWeight.w800,
                    fontSize: 10,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Text(
            '${l.t('latitude')}: ${loc?.latitudeLabel ?? '—'}',
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w600,
              fontSize: 15,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            '${l.t('longitude')}: ${loc?.longitudeLabel ?? '—'}',
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w600,
              fontSize: 15,
            ),
          ),
          const SizedBox(height: 14),
          Text(
            l.t('approxLocationAddress'),
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.45),
              fontSize: 11,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.5,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            loc?.address ?? l.t('resolvingAddress'),
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w600,
              fontSize: 14,
              height: 1.35,
            ),
          ),
          const SizedBox(height: 12),
          RichText(
            text: TextSpan(
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.7),
                fontSize: 12,
              ),
              children: [
                TextSpan(text: '${l.t('precisionStatus')}: '),
                TextSpan(
                  text: loc?.precisionStatus ?? '—',
                  style: TextStyle(
                    color: safe
                        ? AppColors.sosSafeGreen
                        : AppColors.sosAccentRed,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
          if (state.shareLiveGps) ...[
            const SizedBox(height: 10),
            Row(
              children: [
                const Icon(
                  Icons.sensors,
                  color: AppColors.sosSafeGreen,
                  size: 16,
                ),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    l.t('liveGpsStreaming'),
                    style: const TextStyle(
                      color: AppColors.sosSafeGreen,
                      fontWeight: FontWeight.w700,
                      fontSize: 12,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

class _ShareGpsConsent extends StatelessWidget {
  const _ShareGpsConsent({
    required this.approved,
    required this.onChanged,
  });

  final bool approved;
  final ValueChanged<bool?> onChanged;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);

    return InkWell(
      borderRadius: BorderRadius.circular(12),
      onTap: () => onChanged(!approved),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 28,
            height: 28,
            child: Checkbox(
              value: approved,
              onChanged: onChanged,
              activeColor: AppColors.trustBlue,
              checkColor: Colors.white,
              side: BorderSide(
                color: Colors.white.withValues(alpha: 0.45),
                width: 1.6,
              ),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(5),
              ),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text(
                l.t('permitSuwasariyaGps'),
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.9),
                  fontSize: 13,
                  height: 1.4,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
