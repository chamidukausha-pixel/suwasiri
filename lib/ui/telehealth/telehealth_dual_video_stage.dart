import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';

import '../../core/theme/app_colors.dart';
import '../../localization/app_localizations.dart';
import '../widgets/common_widgets.dart';

/// Side-by-side Call stage: patient (left) · doctor / GP Care (right).
class TelehealthDualVideoStage extends StatelessWidget {
  const TelehealthDualVideoStage({
    super.key,
    required this.muted,
    required this.camOff,
    required this.camera,
    required this.cameraReady,
    required this.patientName,
    required this.doctorName,
    required this.liveConnected,
    required this.joiningLive,
    required this.canJoinLive,
    required this.incomingRinging,
    required this.liveStatus,
    required this.localRenderer,
    required this.remoteRenderer,
    required this.onMute,
    required this.onCam,
    required this.onEnd,
    required this.onJoinLive,
    required this.onAnswerCall,
  });

  final bool muted;
  final bool camOff;
  final CameraController? camera;
  final bool cameraReady;
  final String patientName;
  final String doctorName;
  final bool liveConnected;
  final bool joiningLive;
  final bool canJoinLive;
  final bool incomingRinging;
  final String liveStatus;
  final RTCVideoRenderer? localRenderer;
  final RTCVideoRenderer? remoteRenderer;
  final VoidCallback onMute;
  final VoidCallback onCam;
  final VoidCallback onEnd;
  final VoidCallback onJoinLive;
  final VoidCallback onAnswerCall;

  String get _patientInitials {
    final parts = patientName
        .trim()
        .split(RegExp(r'\s+'))
        .where((w) => w.isNotEmpty)
        .toList();
    if (parts.isEmpty) return 'P';
    if (parts.length == 1) return parts.first[0].toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          child: Row(
            children: [
              Container(
                width: 8,
                height: 8,
                decoration: const BoxDecoration(
                  color: AppColors.onlineGreen,
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 8),
              Text(
                liveConnected
                    ? 'Telehealth Live'
                    : joiningLive
                        ? 'Connecting…'
                        : 'Suwasiri Call',
                style: TextStyle(
                  color: AppColors.muted(context),
                  fontWeight: FontWeight.w700,
                  fontSize: 11,
                ),
              ),
            ],
          ),
        ),
        SizedBox(
          height: 280,
          child: Row(
            children: [
              Expanded(
                child: _Pane(
                  topLabel: 'You — $patientName',
                  bottomLabel: camOff
                      ? 'Camera off'
                      : liveConnected
                          ? 'Patient live'
                          : 'Patient waiting',
                  bottomDot: camOff
                      ? Colors.orange
                      : liveConnected
                          ? AppColors.onlineGreen
                          : const Color(0xFF38BDF8),
                  child: _PatientFeed(
                    camOff: camOff,
                    camera: camera,
                    cameraReady: cameraReady,
                    localRenderer: localRenderer,
                    joiningLive: joiningLive,
                    liveConnected: liveConnected,
                    initials: _patientInitials,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _Pane(
                  topLabel: 'GP Care — $doctorName',
                  bottomLabel: liveConnected
                      ? 'GP room cam ready'
                      : joiningLive
                          ? l.t('waitingForGpCare')
                          : 'Doctor camera',
                  bottomDot: liveConnected
                      ? const Color(0xFF60A5FA)
                      : const Color(0xFF94A3B8),
                  child: _DoctorFeed(
                    doctorName: doctorName,
                    liveConnected: liveConnected,
                    joiningLive: joiningLive,
                    liveStatus: liveStatus,
                    remoteRenderer: remoteRenderer,
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        if (incomingRinging && !liveConnected)
          Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: Column(
              children: [
                Text(
                  '$doctorName is calling via Lanka GP Care…',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: AppColors.ink(context),
                    fontWeight: FontWeight.w800,
                    fontSize: 13,
                  ),
                ),
                const SizedBox(height: 8),
                LiquidFilledButton.icon(
                  onPressed: joiningLive ? null : onAnswerCall,
                  icon: Icon(joiningLive ? Icons.hourglass_top : Icons.call),
                  label: Text(
                    joiningLive ? l.t('waitingForGpCare') : 'Answer call',
                  ),
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.onlineGreen,
                    foregroundColor: Colors.white,
                    minimumSize: const Size.fromHeight(46),
                  ),
                ),
              ],
            ),
          )
        else if (canJoinLive && !liveConnected)
          Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: LiquidFilledButton.icon(
              onPressed: joiningLive ? null : onJoinLive,
              icon: Icon(joiningLive ? Icons.hourglass_top : Icons.videocam),
              label: Text(
                joiningLive ? l.t('waitingForGpCare') : l.t('joinGpCareVideo'),
              ),
              style: FilledButton.styleFrom(
                backgroundColor: const Color(0xFFE2E8F0),
                foregroundColor: AppColors.trustBlueDark,
                minimumSize: const Size.fromHeight(46),
              ),
            ),
          )
        else if (!canJoinLive && !liveConnected)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Text(
              l.t('videoCallOpensAt'),
              textAlign: TextAlign.center,
              style: TextStyle(
                color: AppColors.muted(context),
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
          decoration: BoxDecoration(
            color: const Color(0xFF0F172A),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Row(
            children: [
              _Ctrl(
                icon: muted ? Icons.mic_off : Icons.mic_none_rounded,
                onTap: onMute,
              ),
              const SizedBox(width: 8),
              _Ctrl(
                icon: camOff ? Icons.videocam_off : Icons.videocam,
                onTap: onCam,
              ),
              const SizedBox(width: 8),
              _Ctrl(
                icon: Icons.fiber_manual_record,
                color: const Color(0xFF3F3F46),
                iconColor: AppColors.emergencyRed,
                onTap: () {},
              ),
              const Spacer(),
              Text(
                'You ↔ doctor · synced with Lanka GP Care',
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.7),
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(width: 8),
              _Ctrl(
                icon: Icons.call_end_rounded,
                color: AppColors.emergencyRed,
                onTap: onEnd,
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _Pane extends StatelessWidget {
  const _Pane({
    required this.topLabel,
    required this.bottomLabel,
    required this.bottomDot,
    required this.child,
  });

  final String topLabel;
  final String bottomLabel;
  final Color bottomDot;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF0B1220),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF1E293B)),
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        fit: StackFit.expand,
        children: [
          child,
          Positioned(
            top: 8,
            right: 8,
            left: 8,
            child: Align(
              alignment: Alignment.topRight,
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.black54,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  topLabel,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ),
          ),
          Positioned(
            left: 8,
            bottom: 8,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.black54,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 7,
                    height: 7,
                    decoration: BoxDecoration(
                      color: bottomDot,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 6),
                  Text(
                    bottomLabel,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _PatientFeed extends StatelessWidget {
  const _PatientFeed({
    required this.camOff,
    required this.camera,
    required this.cameraReady,
    required this.localRenderer,
    required this.joiningLive,
    required this.liveConnected,
    required this.initials,
  });

  final bool camOff;
  final CameraController? camera;
  final bool cameraReady;
  final RTCVideoRenderer? localRenderer;
  final bool joiningLive;
  final bool liveConnected;
  final String initials;

  @override
  Widget build(BuildContext context) {
    if (!camOff &&
        localRenderer != null &&
        (joiningLive || liveConnected)) {
      return RTCVideoView(
        localRenderer!,
        mirror: true,
        objectFit: RTCVideoViewObjectFit.RTCVideoViewObjectFitCover,
      );
    }
    if (!camOff &&
        cameraReady &&
        camera != null &&
        camera!.value.isInitialized) {
      return FittedBox(
        fit: BoxFit.cover,
        clipBehavior: Clip.hardEdge,
        child: SizedBox(
          width: camera!.value.previewSize?.height ?? 160,
          height: camera!.value.previewSize?.width ?? 200,
          child: CameraPreview(camera!),
        ),
      );
    }
    return ColoredBox(
      color: const Color(0xFF111827),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 72,
              height: 72,
              alignment: Alignment.center,
              decoration: const BoxDecoration(
                color: Color(0xFF2563EB),
                shape: BoxShape.circle,
              ),
              child: Text(
                initials,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w800,
                  fontSize: 22,
                ),
              ),
            ),
            const SizedBox(height: 10),
            Text(
              camOff ? 'Camera off' : 'Starting your camera…',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.75),
                fontSize: 11,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _DoctorFeed extends StatelessWidget {
  const _DoctorFeed({
    required this.doctorName,
    required this.liveConnected,
    required this.joiningLive,
    required this.liveStatus,
    required this.remoteRenderer,
  });

  final String doctorName;
  final bool liveConnected;
  final bool joiningLive;
  final String liveStatus;
  final RTCVideoRenderer? remoteRenderer;

  @override
  Widget build(BuildContext context) {
    if (liveConnected && remoteRenderer != null) {
      return RTCVideoView(
        remoteRenderer!,
        objectFit: RTCVideoViewObjectFit.RTCVideoViewObjectFitCover,
      );
    }
    return ColoredBox(
      color: const Color(0xFF0F172A),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: const Color(0xFF1D4ED8),
                border: Border.all(color: Colors.white24, width: 2),
              ),
              child: const Icon(
                Icons.medical_services_rounded,
                color: Colors.white,
                size: 34,
              ),
            ),
            const SizedBox(height: 10),
            Text(
              doctorName,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w800,
                fontSize: 13,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              joiningLive || liveStatus == 'waiting'
                  ? 'Waiting for doctor…'
                  : 'Doctor will appear here',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.7),
                fontSize: 11,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Ctrl extends StatelessWidget {
  const _Ctrl({
    required this.icon,
    required this.onTap,
    this.color = const Color(0xFF334155),
    this.iconColor = Colors.white,
  });

  final IconData icon;
  final VoidCallback onTap;
  final Color color;
  final Color iconColor;

  @override
  Widget build(BuildContext context) {
    return MinTap(
      enforceMinSize: false,
      onTap: onTap,
      child: Container(
        width: 42,
        height: 42,
        decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        child: Icon(icon, color: iconColor, size: 20),
      ),
    );
  }
}
