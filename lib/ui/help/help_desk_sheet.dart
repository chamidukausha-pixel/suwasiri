import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../../core/theme/app_colors.dart';
import '../../data/services/help_desk_replies.dart';
import '../../localization/app_localizations.dart';

/// Opens the Suwasiri AI Help Desk chat sheet.
Future<void> showHelpDeskSheet(BuildContext context) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (ctx) => const _HelpDeskSheet(),
  );
}

/// Compact yellow Help button that can be dragged anywhere on screen.
class DraggableHelpFab extends StatefulWidget {
  const DraggableHelpFab({super.key});

  static const double size = 56;

  @override
  State<DraggableHelpFab> createState() => _DraggableHelpFabState();
}

class _DraggableHelpFabState extends State<DraggableHelpFab> {
  Offset? _offset;
  Offset _dragStart = Offset.zero;
  Offset _originAtDrag = Offset.zero;
  bool _moved = false;

  Offset _defaultOffset(Size area) {
    const margin = 12.0;
    return Offset(
      area.width - DraggableHelpFab.size - margin,
      area.height - DraggableHelpFab.size - margin,
    );
  }

  Offset _clamp(Offset raw, Size area) {
    const margin = 4.0;
    final maxX = (area.width - DraggableHelpFab.size - margin)
        .clamp(margin, double.infinity);
    final maxY = (area.height - DraggableHelpFab.size - margin)
        .clamp(margin, double.infinity);
    return Offset(
      raw.dx.clamp(margin, maxX),
      raw.dy.clamp(margin, maxY),
    );
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final area = Size(constraints.maxWidth, constraints.maxHeight);
        final pos = _clamp(_offset ?? _defaultOffset(area), area);

        return Stack(
          children: [
            Positioned(
              left: pos.dx,
              top: pos.dy,
              child: GestureDetector(
                onPanStart: (d) {
                  _dragStart = d.globalPosition;
                  _originAtDrag = pos;
                  _moved = false;
                },
                onPanUpdate: (d) {
                  final delta = d.globalPosition - _dragStart;
                  if (delta.distance > 6) _moved = true;
                  setState(() {
                    _offset = _clamp(_originAtDrag + delta, area);
                  });
                },
                onPanEnd: (_) {
                  if (!_moved && mounted) {
                    showHelpDeskSheet(context);
                  }
                },
                child: const _HelpFabVisual(),
              ),
            ),
          ],
        );
      },
    );
  }
}

class _HelpFabVisual extends StatelessWidget {
  const _HelpFabVisual();

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    return Material(
      color: Colors.transparent,
      elevation: 4,
      shadowColor: Colors.black26,
      shape: const CircleBorder(),
      child: Container(
        width: DraggableHelpFab.size,
        height: DraggableHelpFab.size,
        decoration: BoxDecoration(
          color: const Color(0xFFFFD400),
          shape: BoxShape.circle,
          border: Border.all(color: const Color(0xFFE6B800), width: 1),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.16),
              blurRadius: 8,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.chat_bubble_outline_rounded,
              color: Colors.black87,
              size: 20,
            ),
            const SizedBox(height: 1),
            Text(
              l.t('help'),
              style: const TextStyle(
                color: Colors.black87,
                fontWeight: FontWeight.w800,
                fontSize: 10,
                height: 1,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Kept for any direct references; prefer [DraggableHelpFab].
class HelpFab extends StatelessWidget {
  const HelpFab({super.key});

  @override
  Widget build(BuildContext context) => const _HelpFabVisual();
}

class _ChatBubble {
  const _ChatBubble({
    required this.text,
    required this.isUser,
    this.imagePath,
  });

  final String text;
  final bool isUser;
  final String? imagePath;
}

class _HelpDeskSheet extends StatefulWidget {
  const _HelpDeskSheet();

  @override
  State<_HelpDeskSheet> createState() => _HelpDeskSheetState();
}

class _HelpDeskSheetState extends State<_HelpDeskSheet> {
  final _ctrl = TextEditingController();
  final _scroll = ScrollController();
  final _messages = <_ChatBubble>[];
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final l = AppLocalizations.of(context);
      setState(() {
        _messages.add(
          _ChatBubble(text: l.t('helpDeskWelcome'), isUser: false),
        );
      });
    });
  }

  @override
  void dispose() {
    _ctrl.dispose();
    _scroll.dispose();
    super.dispose();
  }

  void _scrollToEnd() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_scroll.hasClients) return;
      _scroll.animateTo(
        _scroll.position.maxScrollExtent,
        duration: const Duration(milliseconds: 250),
        curve: Curves.easeOut,
      );
    });
  }

  Future<void> _send([String? preset]) async {
    final text = (preset ?? _ctrl.text).trim();
    if (text.isEmpty || _busy) return;
    setState(() {
      _busy = true;
      _messages.add(_ChatBubble(text: text, isUser: true));
      if (preset == null) _ctrl.clear();
    });
    _scrollToEnd();

    await Future<void>.delayed(const Duration(milliseconds: 450));
    if (!mounted) return;
    final reply = HelpDeskReplies.reply(text);
    setState(() {
      _messages.add(_ChatBubble(text: reply, isUser: false));
      _busy = false;
    });
    _scrollToEnd();
  }

  Future<void> _uploadCertificate(ImageSource source) async {
    if (_busy) return;
    final picker = ImagePicker();
    final file = await picker.pickImage(
      source: source,
      imageQuality: 85,
      maxWidth: 1600,
    );
    if (file == null || !mounted) return;

    final l = AppLocalizations.of(context);
    setState(() {
      _busy = true;
      _messages.add(
        _ChatBubble(
          text: l.t('helpDeskCertUploaded'),
          isUser: true,
          imagePath: file.path,
        ),
      );
    });
    _scrollToEnd();

    await Future<void>.delayed(const Duration(milliseconds: 650));
    if (!mounted) return;
    final lang = AppLocalizations.of(context).locale.languageCode;
    final reply = HelpDeskReplies.explainCertificate(
      fileName: file.name,
      lang: lang == 'si' || lang == 'ta' ? lang : 'en',
    );
    setState(() {
      _messages.add(_ChatBubble(text: reply, isUser: false));
      _busy = false;
    });
    _scrollToEnd();
  }

  void _pickSource() {
    final l = AppLocalizations.of(context);
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.photo_library_outlined),
                title: Text(l.t('helpDeskPickGallery')),
                onTap: () {
                  Navigator.pop(ctx);
                  _uploadCertificate(ImageSource.gallery);
                },
              ),
              ListTile(
                leading: const Icon(Icons.photo_camera_outlined),
                title: Text(l.t('helpDeskPickCamera')),
                onTap: () {
                  Navigator.pop(ctx);
                  _uploadCertificate(ImageSource.camera);
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final bottomInset = MediaQuery.viewInsetsOf(context).bottom;
    final height = MediaQuery.sizeOf(context).height * 0.88;

    return Padding(
      padding: EdgeInsets.only(bottom: bottomInset),
      child: Container(
        height: height,
        decoration: const BoxDecoration(
          color: AppColors.canvas,
          borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
        ),
        child: Column(
          children: [
            const SizedBox(height: 10),
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.border,
                borderRadius: BorderRadius.circular(4),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 14, 8, 8),
              child: Row(
                children: [
                  Container(
                    width: 42,
                    height: 42,
                    decoration: const BoxDecoration(
                      color: Color(0xFFFFD400),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.chat_bubble_outline_rounded,
                      color: Colors.black87,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          l.t('helpDeskTitle'),
                          style: const TextStyle(
                            color: AppColors.trustBlueDark,
                            fontWeight: FontWeight.w800,
                            fontSize: 17,
                          ),
                        ),
                        Text(
                          l.t('helpDeskSubtitle'),
                          style: const TextStyle(
                            color: AppColors.slateMuted,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.close),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 0, 12, 8),
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    _QuickChip(
                      label: l.t('helpChipApp'),
                      onTap: () => _send(l.t('helpPromptApp')),
                    ),
                    _QuickChip(
                      label: l.t('helpChipFever'),
                      onTap: () => _send(l.t('helpPromptFever')),
                    ),
                    _QuickChip(
                      label: l.t('helpChipDengue'),
                      onTap: () => _send(l.t('helpPromptDengue')),
                    ),
                    _QuickChip(
                      label: l.t('helpChipSymptoms'),
                      onTap: () => _send(l.t('helpPromptSymptoms')),
                    ),
                    _QuickChip(
                      label: l.t('helpChipCert'),
                      onTap: _pickSource,
                    ),
                  ],
                ),
              ),
            ),
            Expanded(
              child: ListView.builder(
                controller: _scroll,
                padding: const EdgeInsets.fromLTRB(14, 4, 14, 12),
                itemCount: _messages.length + (_busy ? 1 : 0),
                itemBuilder: (context, i) {
                  if (_busy && i == _messages.length) {
                    return const Padding(
                      padding: EdgeInsets.symmetric(vertical: 8),
                      child: Align(
                        alignment: Alignment.centerLeft,
                        child: SizedBox(
                          width: 28,
                          height: 28,
                          child: CircularProgressIndicator(strokeWidth: 2.5),
                        ),
                      ),
                    );
                  }
                  final m = _messages[i];
                  return _BubbleTile(message: m);
                },
              ),
            ),
            Container(
              padding: EdgeInsets.fromLTRB(
                12,
                10,
                12,
                12 + MediaQuery.paddingOf(context).bottom,
              ),
              decoration: const BoxDecoration(
                color: AppColors.surface,
                border: Border(top: BorderSide(color: AppColors.border)),
              ),
              child: Row(
                children: [
                  IconButton(
                    tooltip: l.t('helpDeskUploadCert'),
                    onPressed: _busy ? null : _pickSource,
                    icon: const Icon(
                      Icons.attach_file_rounded,
                      color: AppColors.trustBlue,
                    ),
                  ),
                  Expanded(
                    child: TextField(
                      controller: _ctrl,
                      minLines: 1,
                      maxLines: 4,
                      textInputAction: TextInputAction.send,
                      onSubmitted: (_) => _send(),
                      decoration: InputDecoration(
                        hintText: l.t('helpDeskPlaceholder'),
                        filled: true,
                        fillColor: AppColors.canvas,
                        isDense: true,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: BorderSide.none,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Material(
                    color: AppColors.trustBlue,
                    borderRadius: BorderRadius.circular(12),
                    child: InkWell(
                      borderRadius: BorderRadius.circular(12),
                      onTap: _busy ? null : () => _send(),
                      child: const SizedBox(
                        width: 48,
                        height: 48,
                        child: Icon(
                          Icons.send_rounded,
                          color: Colors.white,
                          size: 20,
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

class _QuickChip extends StatelessWidget {
  const _QuickChip({required this.label, required this.onTap});

  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: ActionChip(
        onPressed: onTap,
        backgroundColor: const Color(0xFFFFF7CC),
        side: const BorderSide(color: Color(0xFFFFD400)),
        label: Text(
          label,
          style: const TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: 12,
            color: AppColors.trustBlueDark,
          ),
        ),
      ),
    );
  }
}

class _BubbleTile extends StatelessWidget {
  const _BubbleTile({required this.message});

  final _ChatBubble message;

  @override
  Widget build(BuildContext context) {
    final align =
        message.isUser ? Alignment.centerRight : Alignment.centerLeft;
    final bg = message.isUser ? AppColors.trustBlue : Colors.white;
    final fg = message.isUser ? Colors.white : AppColors.trustBlueDark;

    return Align(
      alignment: align,
      child: Container(
        constraints: BoxConstraints(
          maxWidth: MediaQuery.sizeOf(context).width * 0.82,
        ),
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(14),
          border: message.isUser
              ? null
              : Border.all(color: AppColors.border),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (message.imagePath != null) ...[
              ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: Image.file(
                  File(message.imagePath!),
                  height: 140,
                  width: double.infinity,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => const SizedBox(
                    height: 80,
                    child: Center(child: Icon(Icons.broken_image_outlined)),
                  ),
                ),
              ),
              const SizedBox(height: 8),
            ],
            Text(
              message.text,
              style: TextStyle(color: fg, fontSize: 13.5, height: 1.4),
            ),
          ],
        ),
      ),
    );
  }
}
