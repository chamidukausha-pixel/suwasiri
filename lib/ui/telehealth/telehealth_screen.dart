import 'package:flutter/material.dart';
import 'package:uuid/uuid.dart';

import '../../core/theme/app_colors.dart';
import '../../data/models/sos_location.dart';
import '../widgets/common_widgets.dart';

class TelehealthScreen extends StatefulWidget {
  const TelehealthScreen({super.key});

  @override
  State<TelehealthScreen> createState() => _TelehealthScreenState();
}

class _TelehealthScreenState extends State<TelehealthScreen> {
  final _messages = <ChatMessage>[
    ChatMessage(
      id: '1',
      senderId: 'dr',
      text: 'Hello — Dr. Fernando here. How can I help today?',
      timestamp: DateTime.now().subtract(const Duration(minutes: 5)),
    ),
  ];
  final _input = TextEditingController();
  bool _inCall = false;
  bool _muted = false;
  bool _camFlipped = false;

  @override
  void dispose() {
    _input.dispose();
    super.dispose();
  }

  void _send({String? attachment}) {
    final text = _input.text.trim();
    if (text.isEmpty && attachment == null) return;
    setState(() {
      _messages.add(ChatMessage(
        id: const Uuid().v4(),
        senderId: 'me',
        text: text.isEmpty ? 'Shared attachment' : text,
        timestamp: DateTime.now(),
        isMine: true,
        attachmentLabel: attachment,
      ));
      _input.clear();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        if (_inCall)
          Expanded(
            flex: 2,
            child: Container(
              margin: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.cosmicSlate,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Stack(
                children: [
                  const Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.videocam, color: Colors.white54, size: 48),
                        SizedBox(height: 8),
                        Text(
                          'Video consultation (simulated)',
                          style: TextStyle(color: Colors.white70),
                        ),
                      ],
                    ),
                  ),
                  Positioned(
                    top: 12,
                    right: 12,
                    child: Container(
                      width: 90,
                      height: 120,
                      decoration: BoxDecoration(
                        color: AppColors.slateMuted,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(
                        _camFlipped ? Icons.cameraswitch : Icons.person,
                        color: Colors.white70,
                      ),
                    ),
                  ),
                  Positioned(
                    left: 0,
                    right: 0,
                    bottom: 16,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        _CallBtn(
                          icon: _muted ? Icons.mic_off : Icons.mic,
                          onTap: () => setState(() => _muted = !_muted),
                        ),
                        const SizedBox(width: 12),
                        _CallBtn(
                          icon: Icons.cameraswitch,
                          onTap: () =>
                              setState(() => _camFlipped = !_camFlipped),
                        ),
                        const SizedBox(width: 12),
                        _CallBtn(
                          icon: Icons.screen_share_outlined,
                          onTap: () {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                  content: Text('Screen share simulated')),
                            );
                          },
                        ),
                        const SizedBox(width: 12),
                        _CallBtn(
                          icon: Icons.call_end,
                          color: AppColors.emergencyRed,
                          onTap: () => setState(() => _inCall = false),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          )
        else
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: SoftCard(
              child: Row(
                children: [
                  const Icon(Icons.video_call, color: AppColors.trustBlue),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Text('Schedule / join virtual consultation'),
                  ),
                  FilledButton(
                    onPressed: () => setState(() => _inCall = true),
                    child: const Text('Join'),
                  ),
                ],
              ),
            ),
          ),
        Expanded(
          flex: 3,
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: _messages.length,
            itemBuilder: (_, i) {
              final m = _messages[i];
              return Align(
                alignment:
                    m.isMine ? Alignment.centerRight : Alignment.centerLeft,
                child: Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding:
                      const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  constraints: BoxConstraints(
                    maxWidth: MediaQuery.sizeOf(context).width * 0.75,
                  ),
                  decoration: BoxDecoration(
                    color: m.isMine
                        ? AppColors.trustBlue
                        : AppColors.surface,
                    borderRadius: BorderRadius.circular(14),
                    border: m.isMine
                        ? null
                        : Border.all(color: AppColors.border),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        m.text,
                        style: TextStyle(
                          color: m.isMine ? Colors.white : AppColors.cosmicSlate,
                        ),
                      ),
                      if (m.attachmentLabel != null)
                        Padding(
                          padding: const EdgeInsets.only(top: 4),
                          child: Text(
                            '📎 ${m.attachmentLabel}',
                            style: TextStyle(
                              color: m.isMine ? Colors.white70 : AppColors.slateMuted,
                              fontSize: 12,
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
        SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
            child: Row(
              children: [
                IconButton(
                  onPressed: () => _send(attachment: 'Camera photo'),
                  icon: const Icon(Icons.photo_camera_outlined),
                ),
                IconButton(
                  onPressed: () => _send(attachment: 'Gallery image'),
                  icon: const Icon(Icons.photo_library_outlined),
                ),
                Expanded(
                  child: TextField(
                    controller: _input,
                    decoration: const InputDecoration(
                      hintText: 'Message your clinician…',
                    ),
                    onSubmitted: (_) => _send(),
                  ),
                ),
                IconButton(
                  onPressed: _send,
                  icon: const Icon(Icons.send, color: AppColors.trustBlue),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _CallBtn extends StatelessWidget {
  const _CallBtn({
    required this.icon,
    required this.onTap,
    this.color = AppColors.slateMuted,
  });

  final IconData icon;
  final VoidCallback onTap;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: color,
      shape: const CircleBorder(),
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: onTap,
        child: SizedBox(
          width: 48,
          height: 48,
          child: Icon(icon, color: Colors.white),
        ),
      ),
    );
  }
}
