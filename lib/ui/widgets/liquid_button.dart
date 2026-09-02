import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../core/theme/app_colors.dart';

/// Frosted glass + glossy highlight surface (liquid button look).
class LiquidSurface extends StatelessWidget {
  const LiquidSurface({
    super.key,
    required this.child,
    this.borderRadius = const BorderRadius.all(Radius.circular(999)),
    this.padding,
    this.selected = false,
    this.pressed = false,
    this.glowColor,
    this.tint,
  });

  final Widget child;
  final BorderRadius borderRadius;
  final EdgeInsetsGeometry? padding;
  final bool selected;
  final bool pressed;
  final Color? glowColor;
  final Color? tint;

  @override
  Widget build(BuildContext context) {
    final dark = AppColors.isDark(context);
    final glow = glowColor ?? AppColors.liquidGlow;
    final baseTint = tint ?? (dark ? Colors.white : AppColors.trustBlue);

    final fillTop = selected
        ? glow.withValues(alpha: dark ? 0.42 : 0.48)
        : (dark
            ? Colors.white.withValues(alpha: 0.14)
            : Colors.white.withValues(alpha: 0.78));
    final fillBottom = selected
        ? glow.withValues(alpha: dark ? 0.18 : 0.22)
        : (dark
            ? Colors.white.withValues(alpha: 0.05)
            : baseTint.withValues(alpha: 0.08));

    return AnimatedScale(
      scale: pressed ? 0.985 : 1,
      duration: const Duration(milliseconds: 120),
      curve: Curves.easeOut,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        curve: Curves.easeOut,
        decoration: BoxDecoration(
          borderRadius: borderRadius,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: dark ? 0.45 : 0.10),
              blurRadius: pressed ? 10 : 22,
              offset: Offset(0, pressed ? 3 : 10),
            ),
            if (selected)
              BoxShadow(
                color: glow.withValues(alpha: 0.28),
                blurRadius: 26,
                spreadRadius: -4,
                offset: const Offset(0, 6),
              ),
          ],
        ),
        child: ClipRRect(
          borderRadius: borderRadius,
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 16, sigmaY: 16),
            child: Container(
              padding: padding,
              decoration: BoxDecoration(
                borderRadius: borderRadius,
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [fillTop, fillBottom],
                ),
                border: Border.all(
                  color: Colors.white.withValues(
                    alpha: selected ? 0.72 : (dark ? 0.22 : 0.88),
                  ),
                  width: 1.15,
                ),
              ),
              foregroundDecoration: BoxDecoration(
                borderRadius: borderRadius,
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.center,
                  colors: [
                    Colors.white.withValues(alpha: dark ? 0.18 : 0.55),
                    Colors.white.withValues(alpha: 0),
                  ],
                  stops: const [0, 0.45],
                ),
              ),
              child: child,
            ),
          ),
        ),
      ),
    );
  }
}

class LiquidFilledButton extends StatefulWidget {
  const LiquidFilledButton({
    super.key,
    required this.onPressed,
    required this.child,
    this.icon,
    this.style,
    this.selected = false,
    this.glowColor,
    this.haptic = true,
  });

  factory LiquidFilledButton.icon({
    Key? key,
    required VoidCallback? onPressed,
    required Widget icon,
    required Widget label,
    ButtonStyle? style,
    bool selected = false,
    Color? glowColor,
    bool haptic = true,
  }) {
    return LiquidFilledButton(
      key: key,
      onPressed: onPressed,
      style: style,
      selected: selected,
      glowColor: glowColor,
      haptic: haptic,
      icon: icon,
      child: label,
    );
  }

  final VoidCallback? onPressed;
  final Widget child;
  final Widget? icon;
  final ButtonStyle? style;
  final bool selected;
  final Color? glowColor;
  final bool haptic;

  @override
  State<LiquidFilledButton> createState() => _LiquidFilledButtonState();
}

class _LiquidFilledButtonState extends State<LiquidFilledButton> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    final style = widget.style ?? const ButtonStyle();
    final padding = style.padding?.resolve({}) ??
        const EdgeInsets.symmetric(horizontal: 22, vertical: 14);
    final minSize = style.minimumSize?.resolve({}) ?? const Size(48, 48);
    final fgColor = style.foregroundColor?.resolve({}) ??
        AppColors.ink(context);
    final glow = widget.glowColor ?? AppColors.trustBlue;
    final enabled = widget.onPressed != null;

    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTapDown: enabled ? (_) => setState(() => _pressed = true) : null,
      onTapUp: enabled
          ? (_) {
              setState(() => _pressed = false);
              if (widget.haptic) HapticFeedback.lightImpact();
              widget.onPressed!();
            }
          : null,
      onTapCancel: enabled ? () => setState(() => _pressed = false) : null,
      child: Opacity(
        opacity: enabled ? 1 : 0.45,
        child: LiquidSurface(
          selected: widget.selected || _pressed,
          pressed: _pressed,
          glowColor: glow,
          padding: padding,
          child: ConstrainedBox(
            constraints: BoxConstraints(
              minWidth: minSize.width,
              minHeight: minSize.height,
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                if (widget.icon != null) ...[
                  IconTheme.merge(
                    data: IconThemeData(
                      color: fgColor,
                      size: 20,
                    ),
                    child: widget.icon!,
                  ),
                  const SizedBox(width: 8),
                ],
                DefaultTextStyle(
                  style: TextStyle(
                    color: fgColor,
                    fontWeight: FontWeight.w700,
                    fontSize: 14,
                  ),
                  child: widget.child,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class LiquidOutlinedButton extends StatefulWidget {
  const LiquidOutlinedButton({
    super.key,
    required this.onPressed,
    required this.child,
    this.icon,
    this.selected = false,
    this.haptic = true,
  });

  final VoidCallback? onPressed;
  final Widget child;
  final Widget? icon;
  final bool selected;
  final bool haptic;

  @override
  State<LiquidOutlinedButton> createState() => _LiquidOutlinedButtonState();
}

class _LiquidOutlinedButtonState extends State<LiquidOutlinedButton> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    final enabled = widget.onPressed != null;
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTapDown: enabled ? (_) => setState(() => _pressed = true) : null,
      onTapUp: enabled
          ? (_) {
              setState(() => _pressed = false);
              if (widget.haptic) HapticFeedback.lightImpact();
              widget.onPressed!();
            }
          : null,
      onTapCancel: enabled ? () => setState(() => _pressed = false) : null,
      child: Opacity(
        opacity: enabled ? 1 : 0.45,
        child: LiquidSurface(
          selected: widget.selected,
          pressed: _pressed,
          glowColor: AppColors.trustBlue,
          tint: AppColors.trustBlue,
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (widget.icon != null) ...[
                IconTheme(
                  data: IconThemeData(
                    color: AppColors.trustBlue,
                    size: 18,
                  ),
                  child: widget.icon!,
                ),
                const SizedBox(width: 8),
              ],
              DefaultTextStyle(
                style: TextStyle(
                  color: AppColors.trustBlue,
                  fontWeight: FontWeight.w700,
                  fontSize: 13,
                ),
                child: widget.child,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class LiquidTextButton extends StatefulWidget {
  const LiquidTextButton({
    super.key,
    required this.onPressed,
    required this.child,
    this.selected = false,
  });

  final VoidCallback? onPressed;
  final Widget child;
  final bool selected;

  @override
  State<LiquidTextButton> createState() => _LiquidTextButtonState();
}

class _LiquidTextButtonState extends State<LiquidTextButton> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    final enabled = widget.onPressed != null;
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTapDown: enabled ? (_) => setState(() => _pressed = true) : null,
      onTapUp: enabled
          ? (_) {
              setState(() => _pressed = false);
              HapticFeedback.selectionClick();
              widget.onPressed!();
            }
          : null,
      onTapCancel: enabled ? () => setState(() => _pressed = false) : null,
      child: LiquidSurface(
        selected: widget.selected,
        pressed: _pressed,
        glowColor: AppColors.liquidGlow,
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        child: DefaultTextStyle(
          style: TextStyle(
            color: AppColors.trustBlue,
            fontWeight: FontWeight.w700,
            fontSize: 13,
          ),
          child: widget.child,
        ),
      ),
    );
  }
}

/// Pill row button: leading icon, label, optional trailing (matches reference mockup).
class LiquidPillButton extends StatefulWidget {
  const LiquidPillButton({
    super.key,
    required this.label,
    required this.icon,
    required this.onTap,
    this.trailing,
    this.selected = false,
    this.glowColor,
  });

  final String label;
  final IconData icon;
  final VoidCallback? onTap;
  final Widget? trailing;
  final bool selected;
  final Color? glowColor;

  @override
  State<LiquidPillButton> createState() => _LiquidPillButtonState();
}

class _LiquidPillButtonState extends State<LiquidPillButton> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    final enabled = widget.onTap != null;
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTapDown: enabled ? (_) => setState(() => _pressed = true) : null,
      onTapUp: enabled
          ? (_) {
              setState(() => _pressed = false);
              HapticFeedback.lightImpact();
              widget.onTap!();
            }
          : null,
      onTapCancel: enabled ? () => setState(() => _pressed = false) : null,
      child: LiquidSurface(
        selected: widget.selected,
        pressed: _pressed,
        glowColor: widget.glowColor,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            Icon(widget.icon, color: AppColors.ink(context), size: 22),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                widget.label,
                style: TextStyle(
                  color: AppColors.ink(context),
                  fontWeight: FontWeight.w700,
                  fontSize: 16,
                ),
              ),
            ),
            if (widget.trailing != null) widget.trailing!,
          ],
        ),
      ),
    );
  }
}

/// Full-width primary action with optional icon (used across booking flows).
class LiquidButton extends StatelessWidget {
  const LiquidButton({
    super.key,
    required this.onPressed,
    required this.label,
    this.icon,
    this.color,
    this.height = 48,
    this.selected = false,
    this.busy = false,
  });

  final VoidCallback? onPressed;
  final String label;
  final IconData? icon;
  final Color? color;
  final double height;
  final bool selected;
  final bool busy;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: height,
      child: LiquidFilledButton(
        onPressed: busy ? null : onPressed,
        selected: selected,
        glowColor: color ?? AppColors.trustBlue,
        style: ButtonStyle(
          minimumSize: WidgetStatePropertyAll(Size(double.infinity, height)),
          padding: const WidgetStatePropertyAll(
            EdgeInsets.symmetric(horizontal: 18),
          ),
        ),
        icon: busy
            ? const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: Colors.white,
                ),
              )
            : (icon == null ? null : Icon(icon, size: 20)),
        child: Text(label),
      ),
    );
  }
}

/// Selectable pill chip (payment channel, filters, etc.).
class LiquidChoiceChip extends StatefulWidget {
  const LiquidChoiceChip({
    super.key,
    required this.label,
    required this.selected,
    required this.onTap,
    this.glowColor,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;
  final Color? glowColor;

  @override
  State<LiquidChoiceChip> createState() => _LiquidChoiceChipState();
}

class _LiquidChoiceChipState extends State<LiquidChoiceChip> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTapDown: (_) => setState(() => _pressed = true),
      onTapUp: (_) {
        setState(() => _pressed = false);
        HapticFeedback.selectionClick();
        widget.onTap();
      },
      onTapCancel: () => setState(() => _pressed = false),
      child: LiquidSurface(
        selected: widget.selected,
        pressed: _pressed,
        glowColor: widget.glowColor ?? AppColors.liquidGlow,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Center(
          child: Text(
            widget.label,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: AppColors.ink(context),
              fontWeight: FontWeight.w800,
              fontSize: 12,
            ),
          ),
        ),
      ),
    );
  }
}
