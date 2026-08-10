import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_theme.dart';
import '../../data/models/user_profile.dart';
import '../../localization/health_intake_l10n.dart';
import '../widgets/common_widgets.dart';

/// Unique patient ID card: name, age, blood group, NIC, barcode.
class UniqueHealthIdCard extends StatelessWidget {
  const UniqueHealthIdCard({
    super.key,
    required this.user,
    this.onEdit,
  });

  final UserProfile user;
  final VoidCallback? onEdit;

  @override
  Widget build(BuildContext context) {
    final t = HealthIntakeL10n.t;
    final code = user.barcodeNumber ?? user.ceylonHealthId ?? '—';
    final age = user.ageYears;

    return ClipRRect(
      borderRadius: BorderRadius.circular(16),
      child: SoftCard(
        padding: EdgeInsets.zero,
        child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.fromLTRB(16, 14, 8, 14),
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [Color(0xFF0B1F3A), Color(0xFF123A63)],
              ),
              borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
            ),
            child: Row(
              children: [
                const Icon(Icons.badge_outlined, color: Colors.white70, size: 22),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    t(context, 'uniqueHealthId'),
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w800,
                      fontSize: 15,
                    ),
                  ),
                ),
                if (onEdit != null)
                  IconButton(
                    onPressed: onEdit,
                    icon: const Icon(Icons.edit_outlined, color: Colors.white70),
                    tooltip: t(context, 'editIntake'),
                  ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  user.displayName,
                  style: const TextStyle(
                    fontWeight: FontWeight.w800,
                    fontSize: 20,
                    color: AppColors.trustBlueDark,
                  ),
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    _chip(
                      t(context, 'age'),
                      age != null
                          ? '$age ${t(context, 'years')}'
                          : '—',
                    ),
                    _chip(
                      t(context, 'bloodGroup'),
                      user.bloodGroup ?? '—',
                    ),
                    _chip(
                      t(context, 'nicNo'),
                      user.nic ?? '—',
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Text(
                  t(context, 'barcodeNumber'),
                  style: const TextStyle(
                    color: AppColors.slateMuted,
                    fontWeight: FontWeight.w700,
                    fontSize: 11,
                    letterSpacing: 0.5,
                  ),
                ),
                const SizedBox(height: 6),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.fromLTRB(12, 10, 12, 8),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Column(
                    children: [
                      SizedBox(
                        height: 56,
                        width: double.infinity,
                        child: CustomPaint(
                          painter: _BarcodePainter(code),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              code,
                              textAlign: TextAlign.center,
                              style: AppTheme.mono(
                                fontSize: 13,
                                color: AppColors.trustBlueDark,
                                weight: FontWeight.w700,
                              ),
                            ),
                          ),
                          IconButton(
                            tooltip: 'Copy',
                            onPressed: () {
                              Clipboard.setData(ClipboardData(text: code));
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(t(context, 'barcodeNumber')),
                                ),
                              );
                            },
                            icon: const Icon(Icons.copy, size: 18),
                          ),
                        ],
                      ),
                    ],
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

  Widget _chip(String label, String value) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              color: AppColors.slateMuted,
              fontSize: 10,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            value,
            style: const TextStyle(
              color: AppColors.trustBlueDark,
              fontWeight: FontWeight.w800,
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }
}

/// Simple Code39-style barcode bars from a string (visual ID, not retail scanner certified).
class _BarcodePainter extends CustomPainter {
  _BarcodePainter(this.data);

  final String data;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = Colors.black;
    final pattern = <bool>[];
    // Start guard
    pattern.addAll([true, true, false, true]);
    for (final unit in data.codeUnits) {
      final bits = unit & 0xFF;
      for (var i = 7; i >= 0; i--) {
        pattern.add(((bits >> i) & 1) == 1);
        pattern.add(false);
      }
      pattern.add(false);
    }
    // End guard
    pattern.addAll([true, false, true, true]);

    final barWidth = size.width / pattern.length;
    var x = 0.0;
    for (final on in pattern) {
      if (on) {
        canvas.drawRect(Rect.fromLTWH(x, 0, barWidth * 0.9, size.height), paint);
      }
      x += barWidth;
    }
  }

  @override
  bool shouldRepaint(covariant _BarcodePainter oldDelegate) =>
      oldDelegate.data != data;
}
