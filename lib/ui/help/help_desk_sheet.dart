import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;

import '../../core/theme/app_colors.dart';
import '../../data/models/appointment.dart';
import '../../data/services/help_desk_replies.dart';
import '../../localization/app_localizations.dart';
import '../widgets/profile_avatar.dart';
import '../widgets/sheet_close_bar.dart';

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
    this.suggestedDoctors = const [],
  });

  final String text;
  final bool isUser;
  final String? imagePath;
  final List<Doctor> suggestedDoctors;
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
  final _speech = stt.SpeechToText();
  bool _busy = false;
  bool _speechReady = false;
  bool _listening = false;
  String _voiceLocale = 'en_US';
  String _replyLang = 'en';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final l = AppLocalizations.of(context);
      final code = l.locale.languageCode;
      setState(() {
        _replyLang = (code == 'si' || code == 'ta') ? code : 'en';
        _messages.add(
          _ChatBubble(text: l.t('helpDeskWelcome'), isUser: false),
        );
      });
      _initSpeech();
    });
  }

  Future<void> _initSpeech() async {
    final ok = await _speech.initialize(
      onStatus: (status) {
        if (!mounted) return;
        if (status == 'done' || status == 'notListening') {
          setState(() => _listening = false);
        }
      },
      onError: (_) {
        if (!mounted) return;
        setState(() => _listening = false);
      },
    );
    if (!mounted) return;
    await _applyVoiceLocale();
    setState(() => _speechReady = ok);
  }

  Future<void> _applyVoiceLocale() async {
    final code = _replyLang;
    _voiceLocale = switch (code) {
      'si' => 'si_LK',
      'ta' => 'ta_LK',
      _ => 'en_US',
    };
    try {
      final locales = await _speech.locales();
      final match = locales.where((e) {
        final id = e.localeId.toLowerCase();
        return id.startsWith(code) ||
            (code == 'si' && id.contains('si')) ||
            (code == 'ta' && (id.contains('ta') || id.contains('tam')));
      });
      if (match.isNotEmpty) {
        _voiceLocale = match.first.localeId;
      }
    } catch (_) {}
  }

  Future<void> _setReplyLang(String code) async {
    setState(() => _replyLang = code);
    await _applyVoiceLocale();
    if (mounted) setState(() {});
  }

  Future<void> _toggleVoice() async {
    final l = AppLocalizations.of(context);
    if (_busy) return;
    if (!_speechReady) {
      await _initSpeech();
      if (!_speechReady) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(l.t('helpVoiceUnavailable'))),
        );
        return;
      }
    }
    if (_listening) {
      await _speech.stop();
      setState(() => _listening = false);
      final text = _ctrl.text.trim();
      if (text.isNotEmpty) {
        await _send();
      }
      return;
    }
    setState(() => _listening = true);
    await _speech.listen(
      onResult: (result) {
        if (!mounted) return;
        setState(() {
          _ctrl.text = result.recognizedWords;
          _ctrl.selection = TextSelection.fromPosition(
            TextPosition(offset: _ctrl.text.length),
          );
        });
        if (result.finalResult) {
          setState(() => _listening = false);
        }
      },
      listenOptions: stt.SpeechListenOptions(
        localeId: _voiceLocale,
        listenMode: stt.ListenMode.dictation,
        cancelOnError: true,
        partialResults: true,
      ),
    );
  }

  @override
  void dispose() {
    _speech.stop();
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
    final answer = HelpDeskReplies.answer(text, preferredLang: _replyLang);
    setState(() {
      _messages.add(
        _ChatBubble(
          text: answer.text,
          isUser: false,
          suggestedDoctors: answer.suggestedDoctors,
        ),
      );
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
    final lang = _replyLang == 'si' || _replyLang == 'ta' ? _replyLang : 'en';
    final reply = HelpDeskReplies.explainCertificate(
      fileName: file.name,
      lang: lang,
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
                  const SheetCloseActions(),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 0, 12, 8),
              child: Row(
                children: [
                  _LangChip(
                    label: 'EN',
                    selected: _replyLang == 'en',
                    onTap: () => _setReplyLang('en'),
                  ),
                  _LangChip(
                    label: 'සිංහල',
                    selected: _replyLang == 'si',
                    onTap: () => _setReplyLang('si'),
                  ),
                  _LangChip(
                    label: 'தமிழ்',
                    selected: _replyLang == 'ta',
                    onTap: () => _setReplyLang('ta'),
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
                      onTap: () => _send(l.t('helpPromptSymptomsDescribe')),
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
                  return _BubbleTile(
                    message: m,
                    onOpenDoctors: () {
                      Navigator.of(context).pop();
                      MainTabScope.go(context, 1);
                    },
                  );
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
              child: Column(
                children: [
                  if (_listening)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Row(
                        children: [
                          const Icon(Icons.mic, color: AppColors.emergencyRed, size: 16),
                          const SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              l.t('helpVoiceListening'),
                              style: const TextStyle(
                                color: AppColors.emergencyRed,
                                fontWeight: FontWeight.w700,
                                fontSize: 12,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  Row(
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
                          enabled: !_busy,
                          textInputAction: TextInputAction.send,
                          onSubmitted: (_) => _send(),
                          decoration: InputDecoration(
                            hintText: _listening
                                ? l.t('helpVoiceListening')
                                : l.t('helpDeskPlaceholder'),
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
                      const SizedBox(width: 4),
                      Material(
                        color: _listening
                            ? AppColors.emergencyRed
                            : const Color(0xFFFFD400),
                        borderRadius: BorderRadius.circular(12),
                        child: InkWell(
                          borderRadius: BorderRadius.circular(12),
                          onTap: _busy ? null : _toggleVoice,
                          child: SizedBox(
                            width: 48,
                            height: 48,
                            child: Icon(
                              _listening ? Icons.stop_rounded : Icons.mic_rounded,
                              color: Colors.black87,
                              size: 22,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 6),
                      Material(
                        color: AppColors.trustBlue,
                        borderRadius: BorderRadius.circular(12),
                        child: InkWell(
                          borderRadius: BorderRadius.circular(12),
                          onTap: _busy || _listening ? null : () => _send(),
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
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _LangChip extends StatelessWidget {
  const _LangChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: ChoiceChip(
        label: Text(
          label,
          style: TextStyle(
            fontWeight: FontWeight.w800,
            fontSize: 12,
            color: selected ? Colors.white : AppColors.trustBlueDark,
          ),
        ),
        selected: selected,
        onSelected: (_) => onTap(),
        selectedColor: AppColors.trustBlue,
        backgroundColor: Colors.white,
        showCheckmark: false,
        side: BorderSide(
          color: selected ? AppColors.trustBlue : AppColors.border,
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
  const _BubbleTile({
    required this.message,
    this.onOpenDoctors,
  });

  final _ChatBubble message;
  final VoidCallback? onOpenDoctors;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final align =
        message.isUser ? Alignment.centerRight : Alignment.centerLeft;
    final bg = message.isUser ? AppColors.trustBlue : Colors.white;
    final fg = message.isUser ? Colors.white : AppColors.trustBlueDark;

    return Align(
      alignment: align,
      child: Container(
        constraints: BoxConstraints(
          maxWidth: MediaQuery.sizeOf(context).width * 0.88,
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
                  errorBuilder: (_, _, _) => const SizedBox(
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
            if (!message.isUser && message.suggestedDoctors.isNotEmpty) ...[
              const SizedBox(height: 10),
              Text(
                l.t('helpSuggestedDoctors'),
                style: const TextStyle(
                  color: AppColors.trustBlue,
                  fontWeight: FontWeight.w800,
                  fontSize: 12,
                ),
              ),
              const SizedBox(height: 6),
              for (final d in message.suggestedDoctors)
                Container(
                  width: double.infinity,
                  margin: const EdgeInsets.only(bottom: 6),
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppColors.trustBlueSoft,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        d.name,
                        style: const TextStyle(
                          color: AppColors.trustBlueDark,
                          fontWeight: FontWeight.w800,
                          fontSize: 13,
                        ),
                      ),
                      Text(
                        d.specialty,
                        style: const TextStyle(
                          color: AppColors.trustBlue,
                          fontWeight: FontWeight.w600,
                          fontSize: 12,
                        ),
                      ),
                      Text(
                        d.hospital,
                        style: const TextStyle(
                          color: AppColors.slateMuted,
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                ),
              SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
                  onPressed: onOpenDoctors,
                  icon: const Icon(Icons.calendar_month_outlined, size: 18),
                  label: Text(l.t('helpOpenDoctors')),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
