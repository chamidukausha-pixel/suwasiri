import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:image_picker/image_picker.dart';

import '../../bloc/vault/vault_cubit.dart';
import '../../core/theme/app_colors.dart';
import '../../data/models/previous_medical_folder.dart';
import '../widgets/common_widgets.dart';
import '../widgets/zoomable_image_page.dart';

class PreviousMedicalHistoryPanel extends StatelessWidget {
  const PreviousMedicalHistoryPanel({super.key});

  Future<void> _createFolder(BuildContext context) async {
    final titleCtrl = TextEditingController();
    final notesCtrl = TextEditingController();
    final yearCtrl = TextEditingController();
    final ok = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (ctx) {
        return Padding(
          padding: EdgeInsets.only(
            left: 16,
            right: 16,
            top: 8,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 16,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                'New previous medical history',
                style: Theme.of(ctx).textTheme.titleLarge,
              ),
              const SizedBox(height: 12),
              TextField(
                controller: titleCtrl,
                decoration: const InputDecoration(
                  labelText: 'Title (e.g. Heart surgery)',
                ),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: yearCtrl,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Year (optional)',
                  hintText: '2003',
                ),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: notesCtrl,
                maxLines: 3,
                decoration: const InputDecoration(labelText: 'Notes'),
              ),
              const SizedBox(height: 14),
              FilledButton(
                onPressed: () => Navigator.pop(ctx, true),
                child: const Text('Create folder'),
              ),
            ],
          ),
        );
      },
    );
    if (ok != true || !context.mounted) return;
    await context.read<VaultCubit>().addPreviousMedicalFolder(
          title: titleCtrl.text,
          notes: notesCtrl.text,
          eventYear: int.tryParse(yearCtrl.text.trim()),
        );
  }

  @override
  Widget build(BuildContext context) {
    final folders = context.watch<VaultCubit>().state.previousMedical;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SoftCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Previous medical history',
                style: TextStyle(
                  fontWeight: FontWeight.w800,
                  color: AppColors.ink(context),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Add folders for past surgeries, illnesses, or reports. Attach photos from gallery or camera.',
                style: TextStyle(
                  color: AppColors.muted(context),
                  fontSize: 12,
                  height: 1.35,
                ),
              ),
              const SizedBox(height: 12),
              FilledButton.icon(
                onPressed: () => _createFolder(context),
                icon: const Icon(Icons.create_new_folder_outlined),
                label: const Text('Create folder'),
              ),
            ],
          ),
        ),
        const SizedBox(height: 10),
        if (folders.isEmpty)
          SoftCard(
            child: Text(
              'No folders yet. Create one for events like a 2003 heart surgery.',
              style: TextStyle(color: AppColors.muted(context)),
            ),
          )
        else
          ...folders.map(
            (f) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: SoftCard(
                onTap: () {
                  Navigator.of(context).push(
                    MaterialPageRoute<void>(
                      builder: (_) =>
                          PreviousMedicalFolderPage(folderId: f.id),
                    ),
                  );
                },
                child: Row(
                  children: [
                    Container(
                      width: 42,
                      height: 42,
                      decoration: BoxDecoration(
                        color: const Color(0xFF7C3AED).withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(
                        Icons.folder_shared_outlined,
                        color: Color(0xFF7C3AED),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            f.title,
                            style: TextStyle(
                              fontWeight: FontWeight.w800,
                              color: AppColors.ink(context),
                            ),
                          ),
                          Text(
                            [
                              if (f.eventYear != null) '${f.eventYear}',
                              if (f.notes.isNotEmpty) f.notes,
                              '${f.imagePaths.length} photo(s)',
                            ].join(' · '),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              color: AppColors.muted(context),
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Icon(Icons.chevron_right, color: AppColors.muted(context)),
                  ],
                ),
              ),
            ),
          ),
      ],
    );
  }
}

class PreviousMedicalFolderPage extends StatefulWidget {
  const PreviousMedicalFolderPage({super.key, required this.folderId});

  final String folderId;

  @override
  State<PreviousMedicalFolderPage> createState() =>
      _PreviousMedicalFolderPageState();
}

class _PreviousMedicalFolderPageState extends State<PreviousMedicalFolderPage> {
  late final TextEditingController _notesCtrl;

  PreviousMedicalFolder? _find(List<PreviousMedicalFolder> list) {
    for (final f in list) {
      if (f.id == widget.folderId) return f;
    }
    return null;
  }

  @override
  void initState() {
    super.initState();
    final found = _find(context.read<VaultCubit>().state.previousMedical);
    _notesCtrl = TextEditingController(text: found?.notes ?? '');
  }

  @override
  void dispose() {
    _notesCtrl.dispose();
    super.dispose();
  }

  Future<void> _pick(ImageSource source) async {
    final folder = _find(context.read<VaultCubit>().state.previousMedical);
    if (folder == null) return;
    final shot = await ImagePicker().pickImage(
      source: source,
      imageQuality: 85,
      maxWidth: 1600,
    );
    if (shot == null || !mounted) return;
    await context.read<VaultCubit>().updatePreviousMedicalFolder(
          folder.copyWith(imagePaths: [...folder.imagePaths, shot.path]),
        );
  }

  Future<void> _saveNotes() async {
    final folder = _find(context.read<VaultCubit>().state.previousMedical);
    if (folder == null) return;
    await context.read<VaultCubit>().updatePreviousMedicalFolder(
          folder.copyWith(notes: _notesCtrl.text.trim()),
        );
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Notes saved')),
    );
  }

  @override
  Widget build(BuildContext context) {
    final folder = _find(context.watch<VaultCubit>().state.previousMedical);
    if (folder == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Folder')),
        body: const Center(child: Text('Folder not found')),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(folder.title),
        actions: [
          IconButton(
            tooltip: 'Delete folder',
            onPressed: () async {
              await context
                  .read<VaultCubit>()
                  .deletePreviousMedicalFolder(folder.id);
              if (context.mounted) Navigator.pop(context);
            },
            icon: const Icon(Icons.delete_outline),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
        children: [
          if (folder.eventYear != null)
            Text(
              'Year: ${folder.eventYear}',
              style: TextStyle(
                fontWeight: FontWeight.w700,
                color: AppColors.ink(context),
              ),
            ),
          const SizedBox(height: 12),
          TextField(
            controller: _notesCtrl,
            maxLines: 5,
            decoration: const InputDecoration(
              labelText: 'Notes',
              alignLabelWithHint: true,
            ),
          ),
          const SizedBox(height: 10),
          FilledButton(
            onPressed: _saveNotes,
            child: const Text('Save notes'),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => _pick(ImageSource.gallery),
                  icon: const Icon(Icons.photo_library_outlined),
                  label: const Text('Gallery'),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => _pick(ImageSource.camera),
                  icon: const Icon(Icons.photo_camera_outlined),
                  label: const Text('Camera'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            'Attached images',
            style: TextStyle(
              fontWeight: FontWeight.w800,
              color: AppColors.ink(context),
            ),
          ),
          const SizedBox(height: 10),
          if (folder.imagePaths.isEmpty)
            Text(
              'No images yet.',
              style: TextStyle(color: AppColors.muted(context)),
            )
          else
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final path in folder.imagePaths)
                  GestureDetector(
                    onTap: () {
                      Navigator.of(context).push(
                        MaterialPageRoute<void>(
                          builder: (_) => ZoomableImagePage(
                            imagePath: path,
                            title: folder.title,
                          ),
                        ),
                      );
                    },
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: Image.file(
                        File(path),
                        width: 104,
                        height: 104,
                        fit: BoxFit.cover,
                        errorBuilder: (_, _, _) => Container(
                          width: 104,
                          height: 104,
                          color: AppColors.softFill(context),
                          child: const Icon(Icons.broken_image_outlined),
                        ),
                      ),
                    ),
                  ),
              ],
            ),
        ],
      ),
    );
  }
}
