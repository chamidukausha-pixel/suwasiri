import 'package:flutter/material.dart';

import '../../localization/app_localizations.dart';

/// Close text button plus an X — use on modal sheets / sub-pages.
class SheetCloseActions extends StatelessWidget {
  const SheetCloseActions({super.key, this.onClose});

  final VoidCallback? onClose;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    void close() {
      if (onClose != null) {
        onClose!();
      } else {
        Navigator.of(context).maybePop();
      }
    }

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        TextButton(
          onPressed: close,
          child: Text(
            l.t('close'),
            style: const TextStyle(fontWeight: FontWeight.w700),
          ),
        ),
        IconButton(
          tooltip: l.t('close'),
          onPressed: close,
          style: IconButton.styleFrom(
            backgroundColor: const Color(0xFFF1F5F9),
          ),
          icon: const Icon(Icons.close, size: 20),
        ),
      ],
    );
  }
}
