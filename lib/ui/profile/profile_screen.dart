import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:image_picker/image_picker.dart';

import '../../bloc/auth/auth_cubit.dart';
import '../../bloc/locale/locale_cubit.dart';
import '../../core/theme/app_colors.dart';
import '../../localization/app_localizations.dart';
import '../../localization/health_intake_l10n.dart';
import '../../data/models/family_member.dart';
import '../auth/health_intake_screen.dart';
import '../widgets/common_widgets.dart';
import '../widgets/profile_avatar.dart';
import '../widgets/suwasiri_brand_header.dart';
import 'unique_health_id_card.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  static const _kSms = 'suwasiri_pref_sms';
  static const _kWa = 'suwasiri_pref_whatsapp';
  static const _kEmail = 'suwasiri_pref_email_reports';
  static const _kOffset = 'suwasiri_pref_reminder_offset';
  static const _kWaNumber = 'suwasiri_pref_wa_number';

  bool _sms = true;
  bool _whatsapp = true;
  bool _emailReports = true;
  String _reminderOffset = '1 Hour Before';
  late final TextEditingController _waCtrl;

  static const _offsets = [
    '30 Minutes Before',
    '1 Hour Before',
    '2 Hours Before',
    '1 Day Before',
  ];

  @override
  void initState() {
    super.initState();
    final prefs = context.read<LocaleCubit>().prefs;
    final user = context.read<AuthCubit>().state.user;
    _sms = prefs.getBool(_kSms) ?? true;
    _whatsapp = prefs.getBool(_kWa) ?? true;
    _emailReports = prefs.getBool(_kEmail) ?? true;
    _reminderOffset = prefs.getString(_kOffset) ?? '1 Hour Before';
    _waCtrl = TextEditingController(
      text: prefs.getString(_kWaNumber) ??
          _formatMobile(user?.mobileNo) ??
          '+94771234567',
    );
  }

  String? _formatMobile(String? mobile) {
    if (mobile == null || mobile.isEmpty) return null;
    final digits = mobile.replaceAll(RegExp(r'\D'), '');
    if (digits.startsWith('94')) return '+$digits';
    if (digits.startsWith('0') && digits.length == 10) {
      return '+94${digits.substring(1)}';
    }
    if (digits.length == 9) return '+94$digits';
    return mobile.startsWith('+') ? mobile : '+$digits';
  }

  String _prettyPhone(String? mobile) {
    final raw = _formatMobile(mobile) ?? '+94771234567';
    final d = raw.replaceAll(RegExp(r'\D'), '');
    if (d.length >= 11 && d.startsWith('94')) {
      return '+94 (${d.substring(2, 4)}) ${d.substring(4, 7)} ${d.substring(7)}';
    }
    return raw;
  }

  Future<void> _saveSettings() async {
    final prefs = context.read<LocaleCubit>().prefs;
    await prefs.setBool(_kSms, _sms);
    await prefs.setBool(_kWa, _whatsapp);
    await prefs.setBool(_kEmail, _emailReports);
    await prefs.setString(_kOffset, _reminderOffset);
    await prefs.setString(_kWaNumber, _waCtrl.text.trim());
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(AppLocalizations.of(context).t('settingsSaved'))),
    );
  }

  Future<void> _logout() async {
    await context.read<AuthCubit>().signOut();
    if (!mounted) return;
    Navigator.of(context).pushNamedAndRemoveUntil('/auth', (_) => false);
  }

  Future<void> _openHealthIntake() async {
    if (!context.read<AuthCubit>().isActiveOwner) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Only the main applicant can edit intake in this prototype.',
          ),
        ),
      );
      return;
    }

    await Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => const HealthIntakeScreen(editing: true),
      ),
    );
    if (mounted) setState(() {});
  }

  Future<void> _changePhoto() async {
    final l = AppLocalizations.of(context);
    if (!context.read<AuthCubit>().isActiveOwner) return;
    final user = context.read<AuthCubit>().state.user;
    if (user == null) return;

    final choice = await showModalBottomSheet<ImageSource>(
      context: context,
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.photo_camera_outlined),
              title: Text(l.t('takeSelfie')),
              onTap: () => Navigator.pop(ctx, ImageSource.camera),
            ),
            ListTile(
              leading: const Icon(Icons.photo_library_outlined),
              title: Text(l.t('chooseFromGallery')),
              onTap: () => Navigator.pop(ctx, ImageSource.gallery),
            ),
          ],
        ),
      ),
    );
    if (choice == null || !mounted) return;

    final shot = await ImagePicker().pickImage(
      source: choice,
      imageQuality: 85,
      maxWidth: 1024,
    );
    if (shot == null || !mounted) return;

    final prefs = context.read<LocaleCubit>().prefs;
    await ProfileAvatarStore.save(prefs, user.id, shot.path);
    if (!mounted) return;
    setState(() {});
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(l.t('profilePhotoUpdated'))),
    );
  }

  @override
  void dispose() {
    _waCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final auth = context.watch<AuthCubit>().state;
    final user = auth.user;

    if (user == null) {
      return EmptyHint(l.t('notSignedIn'));
    }

    return SafeArea(
      bottom: false,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 28),
        children: [
          const SuwasiriBrandHeader(),
          const SizedBox(height: 18),
          if (auth.familyMembers.isNotEmpty) ...[
            _FamilyMemberSelector(
              familyMembers: auth.familyMembers,
              activeKey:
                  auth.activeFamilyKey ?? auth.familyMembers.first.key,
              isOwnerActive: context.read<AuthCubit>().isActiveOwner,
              onSelect: (key) =>
                  context.read<AuthCubit>().selectFamilyMember(key),
              onAdd: () {
                _showAddFamilyMemberSheet(context);
              },
            ),
            const SizedBox(height: 14),
          ],
          _IdentityCard(
            userName: user.displayName,
            email: user.email,
            onChangePhoto: _changePhoto,
            onEditIntake: _openHealthIntake,
          ),
          const SizedBox(height: 14),
          UniqueHealthIdCard(
            user: user,
            onEdit: _openHealthIntake,
          ),
          const SizedBox(height: 14),
          SoftCard(
            onTap: _openHealthIntake,
            child: Row(
              children: [
                const Icon(Icons.medical_information_outlined,
                    color: AppColors.trustBlue),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        HealthIntakeL10n.t(context, 'editIntake'),
                        style: const TextStyle(
                          fontWeight: FontWeight.w800,
                          color: AppColors.trustBlueDark,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        HealthIntakeL10n.t(context, 'intakeSubtitle'),
                        style: const TextStyle(
                          color: AppColors.slateMuted,
                          fontSize: 12,
                          height: 1.3,
                        ),
                      ),
                    ],
                  ),
                ),
                const Icon(Icons.chevron_right, color: AppColors.slateMuted),
              ],
            ),
          ),
          const SizedBox(height: 14),
          _CommunicationCard(
            sms: _sms,
            whatsapp: _whatsapp,
            emailReports: _emailReports,
            reminderOffset: _reminderOffset,
            offsets: _offsets,
            waCtrl: _waCtrl,
            email: user.email,
            onSms: (v) => setState(() => _sms = v),
            onWhatsapp: (v) => setState(() => _whatsapp = v),
            onEmail: (v) => setState(() => _emailReports = v),
            onOffset: (v) => setState(() => _reminderOffset = v),
            onSave: _saveSettings,
          ),
          const SizedBox(height: 14),
          _SecurityCard(
            email: user.email,
            phone: _prettyPhone(user.mobileNo),
          ),
          const SizedBox(height: 14),
          _DarkModeCard(),
          const SizedBox(height: 14),
          _LogoutButton(onTap: _logout),
        ],
      ),
    );
  }
}

class _FamilyMemberSelector extends StatelessWidget {
  const _FamilyMemberSelector({
    required this.familyMembers,
    required this.activeKey,
    required this.isOwnerActive,
    required this.onSelect,
    required this.onAdd,
  });

  final List<FamilyMember> familyMembers;
  final String activeKey;
  final bool isOwnerActive;
  final ValueChanged<String> onSelect;
  final VoidCallback onAdd;

  @override
  Widget build(BuildContext context) {
    return SoftCard(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.family_restroom_outlined,
                    color: AppColors.trustBlue),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Family profiles',
                    style: const TextStyle(
                      color: AppColors.trustBlueDark,
                      fontWeight: FontWeight.w800,
                      fontSize: 16,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              key: ValueKey(activeKey),
              initialValue: activeKey,
              isExpanded: true,
              decoration: const InputDecoration(
                isDense: true,
                border: OutlineInputBorder(),
                contentPadding:
                    EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              ),
              items: familyMembers.map((m) {
                return DropdownMenuItem(
                  value: m.key,
                  child: Text('${m.relationLabel} · ${m.profile.displayName}'),
                );
              }).toList(),
              onChanged: (v) {
                if (v == null) return;
                onSelect(v);
              },
            ),
            const SizedBox(height: 12),
            if (isOwnerActive)
              SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
                  onPressed: onAdd,
                  icon: const Icon(Icons.person_add_outlined),
                  label: const Text('Add Family Member'),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

Future<void> _showAddFamilyMemberSheet(BuildContext context) async {
  final auth = context.read<AuthCubit>();
  final owner = auth.state.user;
  if (owner == null) return;

  DateTime? dob = DateTime(DateTime.now().year - 2, DateTime.now().month, 1);
  String relation = 'Wife';
  final nameCtrl = TextEditingController();
  final nicCtrl = TextEditingController();
  final bloodCtrl = TextEditingController();

  await showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    builder: (ctx) {
      return StatefulBuilder(
        builder: (ctx, setState) {
          Future<void> pickDob() async {
            final picked = await showDatePicker(
              context: ctx,
              initialDate: dob ?? DateTime(2020, 1, 1),
              firstDate: DateTime(1900, 1, 1),
              lastDate: DateTime(2100, 12, 31),
            );
            if (picked == null) return;
            setState(() => dob = picked);
          }

          String keyForRelation(String r) {
            return switch (r) {
              'Wife' => 'wife',
              'Mother' => 'mother',
              'Father' => 'father',
              "Wife's Mother" => 'wife_mother',
              "Wife's Father" => 'wife_father',
              'Child' => 'child',
              _ => 'custom',
            };
          }

          Future<void> onSave() async {
            final name = nameCtrl.text.trim();
            if (name.isEmpty) return;
            final key = keyForRelation(relation);
            final profile = owner
                .copyWith(
                  name: name,
                  dateOfBirth: dob,
                  nic: nicCtrl.text.trim().isEmpty ? null : nicCtrl.text.trim(),
                  bloodGroup:
                      bloodCtrl.text.trim().isEmpty ? null : bloodCtrl.text.trim(),
                )
                .withEnsuredBarcode();

            await auth.upsertFamilyMember(
              key: key,
              relationLabel: relation,
              profile: profile,
              selectAfter: true,
            );
            if (!context.mounted) return;
            Navigator.of(ctx).pop();
          }

          return Padding(
            padding: EdgeInsets.only(
              bottom: MediaQuery.of(ctx).viewInsets.bottom,
              left: 16,
              right: 16,
              top: 16,
            ),
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Add Family Member',
                    style: Theme.of(ctx).textTheme.headlineSmall,
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    key: ValueKey(relation),
                    initialValue: relation,
                    isExpanded: true,
                    decoration: const InputDecoration(
                      labelText: 'Relation',
                      isDense: true,
                    ),
                    items: const [
                      'Wife',
                      'Mother',
                      'Father',
                      "Wife's Mother",
                      "Wife's Father",
                      'Child',
                    ].map((r) {
                      return DropdownMenuItem<String>(
                        value: r,
                        child: Text(r),
                      );
                    }).toList(),
                    onChanged: (v) {
                      if (v == null) return;
                      setState(() => relation = v);
                    },
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: nameCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Full name',
                      isDense: true,
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: nicCtrl,
                    decoration: const InputDecoration(
                      labelText: 'NIC (optional)',
                      isDense: true,
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: bloodCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Blood group (optional)',
                      isDense: true,
                    ),
                  ),
                  const SizedBox(height: 12),
                  InkWell(
                    onTap: pickDob,
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        dob == null
                            ? 'Select date of birth'
                            : 'DOB: ${dob!.day}/${dob!.month}/${dob!.year}',
                        style: const TextStyle(
                          fontWeight: FontWeight.w800,
                          color: AppColors.slateMuted,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      onPressed: onSave,
                      child: const Text('Save'),
                    ),
                  ),
                  const SizedBox(height: 10),
                ],
              ),
            ),
          );
        },
      );
    },
  );
}

class _IdentityCard extends StatelessWidget {
  const _IdentityCard({
    required this.userName,
    required this.email,
    required this.onChangePhoto,
    required this.onEditIntake,
  });

  final String userName;
  final String email;
  final VoidCallback onChangePhoto;
  final VoidCallback onEditIntake;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);

    return SoftCard(
      child: Row(
        children: [
          Stack(
            children: [
              ProfileAvatar(
                radius: 30,
                showOnlineDot: false,
                onTap: onChangePhoto,
              ),
              Positioned(
                right: 0,
                bottom: 0,
                child: Material(
                  color: AppColors.trustBlue,
                  shape: const CircleBorder(),
                  child: InkWell(
                    customBorder: const CircleBorder(),
                    onTap: onChangePhoto,
                    child: const Padding(
                      padding: EdgeInsets.all(5),
                      child: Icon(
                        Icons.camera_alt,
                        size: 14,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  userName,
                  style: const TextStyle(
                    color: AppColors.trustBlueDark,
                    fontWeight: FontWeight.w800,
                    fontSize: 18,
                  ),
                ),
                Text(
                  email,
                  style: const TextStyle(color: AppColors.slateMuted),
                ),
                const SizedBox(height: 4),
                MinTap(
                  enforceMinSize: false,
                  onTap: onChangePhoto,
                  child: Text(
                    l.t('changeProfilePhoto'),
                    style: const TextStyle(
                      color: AppColors.trustBlue,
                      fontWeight: FontWeight.w700,
                      fontSize: 12,
                    ),
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            tooltip: HealthIntakeL10n.t(context, 'editIntake'),
            onPressed: onEditIntake,
            icon: const Icon(Icons.edit_outlined, color: AppColors.trustBlue),
          ),
        ],
      ),
    );
  }
}

class _CommunicationCard extends StatelessWidget {
  const _CommunicationCard({
    required this.sms,
    required this.whatsapp,
    required this.emailReports,
    required this.reminderOffset,
    required this.offsets,
    required this.waCtrl,
    required this.email,
    required this.onSms,
    required this.onWhatsapp,
    required this.onEmail,
    required this.onOffset,
    required this.onSave,
  });

  final bool sms;
  final bool whatsapp;
  final bool emailReports;
  final String reminderOffset;
  final List<String> offsets;
  final TextEditingController waCtrl;
  final String email;
  final ValueChanged<bool> onSms;
  final ValueChanged<bool> onWhatsapp;
  final ValueChanged<bool> onEmail;
  final ValueChanged<String> onOffset;
  final VoidCallback onSave;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);

    return SoftCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.notifications_outlined,
                  color: AppColors.trustBlue),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  l.t('communicationReminders'),
                  style: const TextStyle(
                    color: AppColors.trustBlueDark,
                    fontWeight: FontWeight.w800,
                    fontSize: 16,
                  ),
                ),
              ),
              MinTap(
                enforceMinSize: false,
                onTap: onSave,
                child: Text(
                  l.t('saveSettings'),
                  style: const TextStyle(
                    color: AppColors.trustBlue,
                    fontWeight: FontWeight.w800,
                    fontSize: 12,
                    letterSpacing: 0.4,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _ToggleRow(
            title: l.t('instantSms'),
            subtitle: l.t('instantSmsHint'),
            value: sms,
            activeColor: AppColors.trustBlue,
            onChanged: onSms,
          ),
          const Divider(height: 24),
          _ToggleRow(
            title: l.t('whatsappNotifications'),
            subtitle: l.t('whatsappHint'),
            value: whatsapp,
            activeColor: const Color(0xFF25D366),
            onChanged: onWhatsapp,
          ),
          if (whatsapp) ...[
            const SizedBox(height: 12),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    l.t('whatsappMobileNumber'),
                    style: const TextStyle(
                      color: AppColors.slateMuted,
                      fontWeight: FontWeight.w700,
                      fontSize: 10,
                      letterSpacing: 0.6,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: waCtrl,
                          keyboardType: TextInputType.phone,
                          decoration: const InputDecoration(
                            isDense: true,
                            filled: true,
                            fillColor: Colors.white,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: AppColors.emeraldSoft,
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Text(
                          l.t('activeBadge'),
                          style: const TextStyle(
                            color: AppColors.emerald,
                            fontWeight: FontWeight.w800,
                            fontSize: 11,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
          const Divider(height: 24),
          Text(
            l.t('reminderOffset'),
            style: const TextStyle(
              color: AppColors.trustBlueDark,
              fontWeight: FontWeight.w800,
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            l.t('reminderOffsetHint'),
            style: const TextStyle(color: AppColors.slateMuted, fontSize: 12),
          ),
          const SizedBox(height: 10),
          DropdownButtonFormField<String>(
            // ignore: deprecated_member_use
            value: reminderOffset,
            decoration: const InputDecoration(isDense: true),
            items: offsets
                .map((o) => DropdownMenuItem(value: o, child: Text(o)))
                .toList(),
            onChanged: (v) {
              if (v != null) onOffset(v);
            },
          ),
          const Divider(height: 24),
          _ToggleRow(
            title: l.t('emailReports'),
            subtitle: l.t('emailReportsHint').replaceAll('{email}', email),
            value: emailReports,
            activeColor: AppColors.trustBlue,
            onChanged: onEmail,
          ),
        ],
      ),
    );
  }
}

class _ToggleRow extends StatelessWidget {
  const _ToggleRow({
    required this.title,
    required this.subtitle,
    required this.value,
    required this.activeColor,
    required this.onChanged,
  });

  final String title;
  final String subtitle;
  final bool value;
  final Color activeColor;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  color: AppColors.trustBlueDark,
                  fontWeight: FontWeight.w800,
                  fontSize: 14,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                subtitle,
                style: const TextStyle(
                  color: AppColors.slateMuted,
                  fontSize: 12,
                  height: 1.35,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(width: 8),
        Switch.adaptive(
          value: value,
          activeThumbColor: Colors.white,
          activeTrackColor: activeColor,
          onChanged: onChanged,
        ),
      ],
    );
  }
}

class _SecurityCard extends StatelessWidget {
  const _SecurityCard({
    required this.email,
    required this.phone,
  });

  final String email;
  final String phone;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);

    return SoftCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.verified_user_outlined,
                  color: AppColors.trustBlue),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  l.t('securitySupport'),
                  style: const TextStyle(
                    color: AppColors.trustBlueDark,
                    fontWeight: FontWeight.w800,
                    fontSize: 16,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              const Icon(Icons.mail_outline,
                  size: 18, color: AppColors.slateMuted),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  email,
                  style: const TextStyle(
                    color: AppColors.slateMuted,
                    fontSize: 14,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              const Icon(Icons.phone_outlined,
                  size: 18, color: AppColors.slateMuted),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  phone,
                  style: const TextStyle(
                    color: AppColors.slateMuted,
                    fontSize: 14,
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

class _LogoutButton extends StatelessWidget {
  const _LogoutButton({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);

    return MinTap(
      onTap: onTap,
      child: CustomPaint(
        painter: _DashedRRectPainter(
          color: AppColors.emergencyRed.withValues(alpha: 0.55),
          radius: 16,
        ),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(vertical: 16),
          decoration: BoxDecoration(
            color: AppColors.emergencyRedSoft.withValues(alpha: 0.45),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.logout, color: AppColors.emergencyRed),
              const SizedBox(width: 8),
              Text(
                l.t('logoutSession'),
                style: const TextStyle(
                  color: AppColors.emergencyRed,
                  fontWeight: FontWeight.w800,
                  fontSize: 15,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _DashedRRectPainter extends CustomPainter {
  _DashedRRectPainter({required this.color, required this.radius});

  final Color color;
  final double radius;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.4;
    final rrect = RRect.fromRectAndRadius(
      Offset.zero & size,
      Radius.circular(radius),
    );
    final path = Path()..addRRect(rrect);
    for (final metric in path.computeMetrics()) {
      var distance = 0.0;
      const dash = 6.0;
      const gap = 4.0;
      while (distance < metric.length) {
        final next = distance + dash;
        canvas.drawPath(
          metric.extractPath(distance, next.clamp(0, metric.length)),
          paint,
        );
        distance = next + gap;
      }
    }
  }

  @override
  bool shouldRepaint(covariant _DashedRRectPainter oldDelegate) =>
      oldDelegate.color != color || oldDelegate.radius != radius;
}

class _DarkModeCard extends StatelessWidget {
  const _DarkModeCard();

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<LocaleCubit, LocaleState>(
      builder: (context, state) {
        final isDark = state.themeMode == ThemeMode.dark;
        return Card(
          child: SwitchListTile(
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            secondary: Icon(
              isDark ? Icons.dark_mode : Icons.light_mode_outlined,
              color: isDark ? Colors.amber : AppColors.trustBlue,
            ),
            title: Text(
              'Dark Mode',
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
            subtitle: Text(
              isDark ? 'Dark theme is on' : 'Light theme is on',
              style: const TextStyle(fontSize: 12),
            ),
            value: isDark,
            onChanged: (_) =>
                context.read<LocaleCubit>().toggleDarkMode(),
          ),
        );
      },
    );
  }
}
