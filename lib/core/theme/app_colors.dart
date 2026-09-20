import 'package:flutter/material.dart';

/// Suwasiri brand palette — white canvas with blue / green / red accents.
abstract final class AppColors {
  // Primary blue (actions, links, charts)
  static const Color trustBlue = Color(0xFF0066FF);
  static const Color trustBlueDark = Color(0xFF111827);
  static const Color trustBlueLight = Color(0xFF4D94FF);
  static const Color trustBlueSoft = Color(0xFFEFF6FF);

  // Success / positive green
  static const Color emerald = Color(0xFF28A745);
  static const Color emeraldSoft = Color(0xFFE8F5E9);
  static const Color vaultGreen = Color(0xFF28A745);
  static const Color onlineGreen = Color(0xFF28A745);
  static const Color sosSafeGreen = Color(0xFF28A745);
  static const Color tipTeal = Color(0xFF28A745);
  static const Color limePrice = Color(0xFF28A745);

  // Danger / negative red
  static const Color emergencyRed = Color(0xFFDC3545);
  static const Color emergencyRedSoft = Color(0xFFFEE2E2);
  static const Color sosAccentRed = Color(0xFFDC3545);
  static const Color heartPink = Color(0xFFDC3545);

  // Palette shades for tiles and accents
  static const Color brandBlueDeep = Color(0xFF1D4ED8);
  static const Color brandBlueSky = Color(0xFF0EA5E9);
  static const Color brandGreenBright = Color(0xFF22C55E);
  static const Color brandGreenDeep = Color(0xFF16A34A);
  static const Color brandRedBright = Color(0xFFE53935);
  static const Color brandRedDeep = Color(0xFFB91C1C);

  // SOS overlay (dark shell keeps red/green accents)
  static const Color sosBackground = Color(0xFF08080C);
  static const Color sosCard = Color(0xFF12141D);

  // Mapped legacy tokens → blue / green / red palette
  static const Color videoBrown = Color(0xFF0066FF);
  static const Color videoPurple = Color(0xFF0066FF);
  static const Color videoPurpleSoft = Color(0xFFEFF6FF);
  static const Color labBeige = Color(0xFFFFFFFF);
  static const Color labIcon = Color(0xFF6B7280);
  static const Color vaccineOrange = Color(0xFF28A745);
  static const Color vaccineOrangeSoft = Color(0xFFE8F5E9);

  static const Color cosmicSlate = Color(0xFF111827);
  static const Color slateMuted = Color(0xFF6B7280);
  static const Color canvas = Color(0xFFFFFFFF);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color border = Color(0xFFE5E7EB);
  static const Color warning = Color(0xFFDC3545);
  static const Color warningSoft = Color(0xFFFEE2E2);
  static const Color liquidGlow = Color(0xFF0066FF);
  static const Color liquidGlowSoft = Color(0xFFEFF6FF);

  /// Pure black page background in dark mode.
  static const Color darkCanvas = Color(0xFF000000);
  /// Elevated card surface in dark mode.
  static const Color darkSurface = Color(0xFF121212);

  static bool isDark(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark;

  static Color pageBg(BuildContext context) =>
      isDark(context) ? darkCanvas : canvas;

  static Color cardBg(BuildContext context) =>
      isDark(context) ? darkSurface : surface;

  static Color ink(BuildContext context) =>
      isDark(context) ? Colors.white : trustBlueDark;

  static Color muted(BuildContext context) =>
      isDark(context) ? Colors.white70 : slateMuted;

  static Color line(BuildContext context) =>
      isDark(context) ? Colors.white24 : border;

  static Color softFill(BuildContext context) =>
      isDark(context) ? const Color(0xFF1E1E1E) : trustBlueSoft;
}
