import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';

import '../../bloc/auth/auth_cubit.dart';
import '../../bloc/locale/locale_cubit.dart';
import '../../core/theme/app_colors.dart';
import '../../data/models/appointment.dart';
import '../../data/models/family_member.dart';
import '../../data/models/user_profile.dart';
import '../../data/repositories/health_repository.dart';
import '../../localization/health_intake_l10n.dart';
import '../help/help_desk_sheet.dart';
import '../widgets/common_widgets.dart';
import '../widgets/profile_avatar.dart';
import 'unique_health_id_card.dart';

const _kAccentPink = Color(0xFFFCE7F3);
const _kAccentPinkDeep = Color(0xFFDB2777);

/// Accounts-style menu matching the product mockup.
class AccountsMenuCard extends StatelessWidget {
  const AccountsMenuCard({
    super.key,
    required this.onMyProfile,
    required this.onAccountSettings,
    required this.onBilling,
    required this.familyMembers,
    required this.activeKey,
    required this.isOwnerActive,
    required this.onSelectMember,
    required this.onAddMember,
    required this.onSignOut,
  });

  final VoidCallback onMyProfile;
  final VoidCallback onAccountSettings;
  final VoidCallback onBilling;
  final List<FamilyMember> familyMembers;
  final String? activeKey;
  final bool isOwnerActive;
  final ValueChanged<String> onSelectMember;
  final VoidCallback onAddMember;
  final VoidCallback onSignOut;

  @override
  Widget build(BuildContext context) {
    final dark = AppColors.isDark(context);
    return Container(
      decoration: BoxDecoration(
        color: AppColors.cardBg(context),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppColors.line(context)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: dark ? 0.35 : 0.06),
            blurRadius: 24,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const SizedBox(height: 8),
          _MenuRow(
            icon: Icons.account_circle_outlined,
            label: 'My Profile',
            onTap: onMyProfile,
          ),
          _MenuRow(
            icon: Icons.settings_outlined,
            label: 'Account Settings',
            onTap: onAccountSettings,
          ),
          _MenuRow(
            icon: Icons.credit_card_outlined,
            label: 'Billing & Plans',
            onTap: onBilling,
          ),
          _MenuRow(
            icon: Icons.help_outline_rounded,
            label: 'Help Center',
            onTap: () => showHelpDeskSheet(context),
          ),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 16),
            child: Divider(height: 12),
          ),
          const _DarkModeMenuRow(),
          const SizedBox(height: 8),
          Container(
            width: double.infinity,
            color: dark ? const Color(0xFF1A1A1A) : const Color(0xFFF1F5F9),
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
            child: Text(
              'SWITCH ACCOUNT',
              style: TextStyle(
                color: AppColors.muted(context),
                fontWeight: FontWeight.w800,
                fontSize: 11,
                letterSpacing: 0.9,
              ),
            ),
          ),
          if (familyMembers.isEmpty)
            Padding(
              padding: const EdgeInsets.all(16),
              child: Text(
                'No family profiles yet',
                style: TextStyle(color: AppColors.muted(context)),
              ),
            )
          else
            ...familyMembers.map((m) {
              return _SwitchAccountRow(
                member: m,
                active: m.key == activeKey,
                onTap: () => onSelectMember(m.key),
              );
            }),
          if (isOwnerActive)
            _MenuRow(
              icon: Icons.person_add_alt_1_outlined,
              label: 'Add Family Member',
              onTap: onAddMember,
            ),
          _MenuRow(
            icon: Icons.logout_rounded,
            label: 'Sign out all accounts',
            onTap: onSignOut,
            danger: true,
          ),
          const SizedBox(height: 8),
        ],
      ),
    );
  }
}

class _MenuRow extends StatelessWidget {
  const _MenuRow({
    required this.icon,
    required this.label,
    required this.onTap,
    this.danger = false,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool danger;

  @override
  Widget build(BuildContext context) {
    final color = danger ? AppColors.emergencyRed : AppColors.ink(context);
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
        child: Row(
          children: [
            Icon(icon, color: color, size: 24),
            const SizedBox(width: 14),
            Expanded(
              child: Text(
                label,
                style: TextStyle(
                  color: color,
                  fontWeight: FontWeight.w600,
                  fontSize: 15,
                ),
              ),
            ),
            if (!danger)
              Icon(Icons.chevron_right, color: AppColors.muted(context)),
          ],
        ),
      ),
    );
  }
}

class _DarkModeMenuRow extends StatelessWidget {
  const _DarkModeMenuRow();

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<LocaleCubit, LocaleState>(
      builder: (context, state) {
        final isDark = state.themeMode == ThemeMode.dark;
        final accent = AppColors.isDark(context)
            ? const Color(0xFF3B1F2B)
            : _kAccentPink;
        return Container(
          margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          decoration: BoxDecoration(
            color: accent,
            borderRadius: BorderRadius.circular(14),
          ),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            child: Row(
              children: [
                Icon(
                  isDark ? Icons.dark_mode : Icons.dark_mode_outlined,
                  color: isDark ? Colors.white : _kAccentPinkDeep,
                  size: 22,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Dark Mode',
                    style: TextStyle(
                      color: AppColors.ink(context),
                      fontWeight: FontWeight.w700,
                      fontSize: 15,
                    ),
                  ),
                ),
                Switch.adaptive(
                  value: isDark,
                  activeThumbColor: Colors.white,
                  activeTrackColor: _kAccentPinkDeep,
                  onChanged: (_) =>
                      context.read<LocaleCubit>().toggleDarkMode(),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _SwitchAccountRow extends StatelessWidget {
  const _SwitchAccountRow({
    required this.member,
    required this.active,
    required this.onTap,
  });

  final FamilyMember member;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final prefs = context.watch<LocaleCubit>().prefs;
    final path = ProfileAvatarStore.pathFor(prefs, member.profile.id);
    final name = member.profile.displayName;
    final initial = name.isNotEmpty ? name[0].toUpperCase() : '?';
    final subtitle = member.profile.email.isNotEmpty
        ? member.profile.email
        : member.relationLabel;

    return InkWell(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
        decoration: BoxDecoration(
          color: active
              ? (AppColors.isDark(context)
                  ? const Color(0xFF3B1F2B)
                  : _kAccentPink)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(14),
        ),
        child: Row(
          children: [
            CircleAvatar(
              radius: 22,
              backgroundColor: AppColors.softFill(context),
              backgroundImage:
                  path != null ? FileImage(File(path)) : null,
              child: path == null
                  ? Text(
                      initial,
                      style: TextStyle(
                        color: AppColors.isDark(context)
                            ? Colors.white
                            : AppColors.trustBlue,
                        fontWeight: FontWeight.w800,
                      ),
                    )
                  : null,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    name,
                    style: TextStyle(
                      color: AppColors.ink(context),
                      fontWeight: FontWeight.w800,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '$subtitle · ${member.relationLabel}',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: AppColors.muted(context),
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
            if (active)
              Icon(
                Icons.check_circle,
                color: AppColors.isDark(context)
                    ? Colors.white
                    : _kAccentPinkDeep,
                size: 20,
              ),
          ],
        ),
      ),
    );
  }
}

class MyProfilePage extends StatelessWidget {
  const MyProfilePage({
    super.key,
    required this.onChangePhoto,
    required this.onEditIntake,
    required this.identityCardBuilder,
  });

  final VoidCallback onChangePhoto;
  final VoidCallback onEditIntake;
  final Widget Function(UserProfile user) identityCardBuilder;

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthCubit>().state.user;
    if (user == null) {
      return const Scaffold(body: Center(child: Text('Not signed in')));
    }
    return Scaffold(
      appBar: AppBar(title: const Text('My Profile')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
        children: [
          identityCardBuilder(user),
          const SizedBox(height: 14),
          UniqueHealthIdCard(user: user, onEdit: onEditIntake),
          const SizedBox(height: 14),
          SoftCard(
            onTap: onEditIntake,
            child: Row(
              children: [
                Icon(Icons.medical_information_outlined,
                    color: AppColors.isDark(context)
                        ? Colors.white
                        : AppColors.trustBlue),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        HealthIntakeL10n.t(context, 'editIntake'),
                        style: TextStyle(
                          fontWeight: FontWeight.w800,
                          color: AppColors.ink(context),
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        HealthIntakeL10n.t(context, 'intakeSubtitle'),
                        style: TextStyle(
                          color: AppColors.muted(context),
                          fontSize: 12,
                          height: 1.3,
                        ),
                      ),
                    ],
                  ),
                ),
                Icon(Icons.chevron_right, color: AppColors.muted(context)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class AccountSettingsPage extends StatelessWidget {
  const AccountSettingsPage({
    super.key,
    required this.communicationCard,
    required this.securityCard,
  });

  final Widget communicationCard;
  final Widget securityCard;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Account Settings')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
        children: [
          communicationCard,
          const SizedBox(height: 14),
          securityCard,
        ],
      ),
    );
  }
}

class BillingPlansPage extends StatefulWidget {
  const BillingPlansPage({super.key, required this.patientId});

  final String patientId;

  @override
  State<BillingPlansPage> createState() => _BillingPlansPageState();
}

class _BillingPlansPageState extends State<BillingPlansPage> {
  List<Appointment> _payments = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void didUpdateWidget(covariant BillingPlansPage oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.patientId != widget.patientId) {
      _load();
    }
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final health = context.read<HealthRepository>();
    List<Appointment> list = [];
    try {
      list = await health.getAppointments(widget.patientId);
    } catch (_) {}
    list = list.where((a) => (a.feeLkr ?? 0) > 0 || a.paymentMethod != null).toList()
      ..sort((a, b) => b.bookedStamp.compareTo(a.bookedStamp));
    if (!mounted) return;
    setState(() {
      _payments = list;
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final currency = NumberFormat.currency(symbol: 'LKR ', decimalDigits: 0);
    final dateFmt = DateFormat('dd MMM yyyy · hh:mm a');
    final total = _payments.fold<int>(0, (sum, a) => sum + (a.feeLkr ?? 0));

    return Scaffold(
      appBar: AppBar(title: const Text('Billing & Plans')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
              children: [
                SoftCard(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Current plan',
                        style: TextStyle(
                          color: AppColors.slateMuted,
                          fontWeight: FontWeight.w700,
                          fontSize: 12,
                        ),
                      ),
                      const SizedBox(height: 6),
                      const Text(
                        'Suwasiri Care · Pay per visit',
                        style: TextStyle(
                          color: AppColors.trustBlueDark,
                          fontWeight: FontWeight.w800,
                          fontSize: 18,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Total paid: ${currency.format(total)}',
                        style: const TextStyle(
                          color: AppColors.emerald,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 18),
                const Text(
                  'Payment history',
                  style: TextStyle(
                    color: AppColors.trustBlueDark,
                    fontWeight: FontWeight.w800,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Appointments you booked and paid for in the app.',
                  style: TextStyle(color: AppColors.slateMuted, fontSize: 13),
                ),
                const SizedBox(height: 12),
                if (_payments.isEmpty)
                  const EmptyHint('No appointment payments yet')
                else
                  ..._payments.map((a) {
                    final fee = a.feeLkr ?? 0;
                    final method = a.paymentMethod ?? 'Paid';
                    final when = a.bookedAt ?? a.timeSlot;
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: SoftCard(
                        padding: const EdgeInsets.all(14),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              width: 42,
                              height: 42,
                              decoration: BoxDecoration(
                                color: AppColors.trustBlueSoft,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Icon(
                                a.isVideo
                                    ? Icons.videocam_outlined
                                    : Icons.local_hospital_outlined,
                                color: AppColors.trustBlue,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    a.doctorName,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w800,
                                      color: AppColors.trustBlueDark,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    '${a.specialty}${a.hospital.isNotEmpty ? ' · ${a.hospital}' : ''}',
                                    style: const TextStyle(
                                      color: AppColors.slateMuted,
                                      fontSize: 12,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    dateFmt.format(when),
                                    style: const TextStyle(
                                      color: AppColors.slateMuted,
                                      fontSize: 12,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    method,
                                    style: const TextStyle(
                                      color: AppColors.trustBlue,
                                      fontWeight: FontWeight.w600,
                                      fontSize: 12,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Text(
                              currency.format(fee),
                              style: const TextStyle(
                                fontWeight: FontWeight.w800,
                                color: AppColors.trustBlueDark,
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  }),
              ],
            ),
    );
  }
}
