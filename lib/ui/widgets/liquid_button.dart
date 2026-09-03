import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';

/// Legacy name kept for call sites — renders a standard Material surface.
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
    return Padding(
      padding: padding ?? EdgeInsets.zero,
      child: child,
    );
  }
}

class LiquidFilledButton extends StatelessWidget {
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
  Widget build(BuildContext context) {
    final mergedStyle = (style ?? const ButtonStyle()).merge(
      ButtonStyle(
        backgroundColor: glowColor == null
            ? null
            : WidgetStatePropertyAll(glowColor),
      ),
    );

    if (icon != null) {
      return FilledButton.icon(
        onPressed: onPressed,
        style: mergedStyle,
        icon: icon!,
        label: child,
      );
    }
    return FilledButton(
      onPressed: onPressed,
      style: mergedStyle,
      child: child,
    );
  }
}

class LiquidOutlinedButton extends StatelessWidget {
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
  Widget build(BuildContext context) {
    if (icon != null) {
      return OutlinedButton.icon(
        onPressed: onPressed,
        icon: icon!,
        label: child,
      );
    }
    return OutlinedButton(onPressed: onPressed, child: child);
  }
}

class LiquidTextButton extends StatelessWidget {
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
  Widget build(BuildContext context) {
    return TextButton(onPressed: onPressed, child: child);
  }
}

class LiquidPillButton extends StatelessWidget {
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
  Widget build(BuildContext context) {
    return Material(
      color: selected
          ? (glowColor ?? AppColors.trustBlueSoft)
          : AppColors.surface,
      borderRadius: BorderRadius.circular(999),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(999),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Row(
            children: [
              Icon(icon, color: AppColors.trustBlueDark, size: 22),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  label,
                  style: const TextStyle(
                    color: AppColors.trustBlueDark,
                    fontWeight: FontWeight.w700,
                    fontSize: 16,
                  ),
                ),
              ),
              ?trailing,
            ],
          ),
        ),
      ),
    );
  }
}

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
    if (busy) {
      return SizedBox(
        width: double.infinity,
        height: height,
        child: FilledButton(
          onPressed: null,
          style: FilledButton.styleFrom(
            backgroundColor: color ?? AppColors.trustBlue,
            minimumSize: Size(double.infinity, height),
          ),
          child: SizedBox(
            width: 20,
            height: 20,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              color: Theme.of(context).colorScheme.onPrimary,
            ),
          ),
        ),
      );
    }

    if (icon != null) {
      return SizedBox(
        width: double.infinity,
        height: height,
        child: FilledButton.icon(
          onPressed: onPressed,
          style: FilledButton.styleFrom(
            backgroundColor: color ?? AppColors.trustBlue,
            minimumSize: Size(double.infinity, height),
          ),
          icon: Icon(icon, size: 20),
          label: Text(label),
        ),
      );
    }

    return SizedBox(
      width: double.infinity,
      height: height,
      child: FilledButton(
        onPressed: onPressed,
        style: FilledButton.styleFrom(
          backgroundColor: color ?? AppColors.trustBlue,
          minimumSize: Size(double.infinity, height),
        ),
        child: Text(label),
      ),
    );
  }
}

class LiquidChoiceChip extends StatelessWidget {
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
  Widget build(BuildContext context) {
    return FilterChip(
      label: Text(label),
      selected: selected,
      onSelected: (_) => onTap(),
      selectedColor: (glowColor ?? AppColors.trustBlue).withValues(alpha: 0.16),
      checkmarkColor: glowColor ?? AppColors.trustBlue,
      labelStyle: TextStyle(
        color: AppColors.trustBlueDark,
        fontWeight: selected ? FontWeight.w800 : FontWeight.w600,
        fontSize: 12,
      ),
      side: BorderSide(
        color: selected
            ? (glowColor ?? AppColors.trustBlue)
            : AppColors.border,
      ),
    );
  }
}
