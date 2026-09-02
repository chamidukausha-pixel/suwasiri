import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../core/theme/app_colors.dart';
import 'liquid_button.dart';
export 'liquid_button.dart';

class MinTap extends StatefulWidget {
  const MinTap({
    super.key,
    required this.onTap,
    required this.child,
    this.haptic = true,
    this.enforceMinSize = true,
    this.liquid = true,
    this.selected = false,
    this.borderRadius = const BorderRadius.all(Radius.circular(16)),
    this.glowColor,
  });

  final VoidCallback? onTap;
  final Widget child;
  final bool haptic;
  final bool enforceMinSize;
  final bool liquid;
  final bool selected;
  final BorderRadius borderRadius;
  final Color? glowColor;

  @override
  State<MinTap> createState() => _MinTapState();
}

class _MinTapState extends State<MinTap> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    final enabled = widget.onTap != null;
    final content = widget.enforceMinSize
        ? ConstrainedBox(
            constraints: const BoxConstraints(minHeight: 48, minWidth: 48),
            child: widget.child,
          )
        : widget.child;

    if (!widget.liquid) {
      return Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: enabled
              ? () {
                  if (widget.haptic) HapticFeedback.lightImpact();
                  widget.onTap!();
                }
              : null,
          borderRadius: widget.borderRadius,
          child: content,
        ),
      );
    }

    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTapDown: enabled ? (_) => setState(() => _pressed = true) : null,
      onTapUp: enabled
          ? (_) {
              setState(() => _pressed = false);
              if (widget.haptic) HapticFeedback.lightImpact();
              widget.onTap!();
            }
          : null,
      onTapCancel: enabled ? () => setState(() => _pressed = false) : null,
      child: LiquidSurface(
        selected: widget.selected,
        pressed: _pressed,
        borderRadius: widget.borderRadius,
        glowColor: widget.glowColor,
        child: content,
      ),
    );
  }
}

class SectionHeader extends StatelessWidget {
  const SectionHeader(this.title, {super.key, this.trailing});

  final String title;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Expanded(
            child: Text(
              title,
              style: Theme.of(context).textTheme.titleLarge,
            ),
          ),
          ?trailing,
        ],
      ),
    );
  }
}

class SoftCard extends StatelessWidget {
  const SoftCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(16),
    this.color,
    this.onTap,
  });

  final Widget child;
  final EdgeInsets padding;
  final Color? color;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final card = Container(
      width: double.infinity,
      padding: padding,
      decoration: BoxDecoration(
        color: color ?? AppColors.cardBg(context),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.line(context)),
      ),
      child: child,
    );
    if (onTap == null) return card;
    return MinTap(
      onTap: onTap,
      liquid: false,
      borderRadius: BorderRadius.circular(16),
      child: card,
    );
  }
}

class StatusChip extends StatelessWidget {
  const StatusChip({
    super.key,
    required this.label,
    required this.color,
    this.icon,
  });

  final String label;
  final Color color;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 14, color: color),
            const SizedBox(width: 4),
          ],
          Text(
            label,
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.w600,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }
}

class EmptyHint extends StatelessWidget {
  const EmptyHint(this.text, {super.key});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Text(
        text,
        textAlign: TextAlign.center,
        style: Theme.of(context).textTheme.bodyMedium,
      ),
    );
  }
}
