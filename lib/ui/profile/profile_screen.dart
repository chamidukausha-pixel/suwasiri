import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../bloc/auth/auth_cubit.dart';
import '../../bloc/locale/locale_cubit.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_theme.dart';
import '../../data/models/user_profile.dart';
import '../../localization/app_localizations.dart';
import '../widgets/common_widgets.dart';
import '../widgets/suwasiri_brand_header.dart';

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

  @override
  void dispose() {
    _waCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final user = context.watch<AuthCubit>().state.user;

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
          _IdentityCard(user: user),
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
          _TreatmentHistoryCard(entries: _historyFor(user)),
          const SizedBox(height: 14),
          _SecurityCard(
            email: user.email,
            phone: _prettyPhone(user.mobileNo),
          ),
          const SizedBox(height: 14),
          _LogoutButton(onTap: _logout),
        ],
      ),
    );
  }

  List<_HistoryEntry> _historyFor(UserProfile user) {
    return [
      _HistoryEntry(
        dateLabel: 'JUN 12, 2026',
        category: _HistoryCategory.treatmentPlan,
        title: 'Clinic Consultation & E-Prescription Issued',
        doctor: 'Dr. Aruni Perera (Cardiology Specialist)',
        facility: 'Asiri Central Hospital, Colombo 10',
        summary:
            'Symptom check: Normal cardiorespiratory rhythm. Issued Electronic prescription (EP-5290) for lipids management.',
      ),
      _HistoryEntry(
        dateLabel: 'MAY 28, 2023',
        category: _HistoryCategory.familyCare,
        title: 'Routine Pediatric Growth Review',
        doctor: 'Dr. Sandeep Bandara (Pediatrician)',
        facility: 'Nawaloka Hospital, Colombo 02',
        summary:
            'Growth parameters within expected percentile. Nutritional counselling provided for balanced diet adherence.',
        medicines: const [
          'Multivitamin Syrup (5ml daily - 14 Days)',
          'Oral Rehydration Salts (as needed)',
        ],
      ),
      _HistoryEntry(
        dateLabel: 'OCT 12, 2023',
        category: _HistoryCategory.labReport,
        title: 'Full Blood Count (FBC) Review',
        doctor: 'Dr. S. Perera',
        facility: 'Lanka Hospitals PLC',
        summary:
            'Hematology panel synced from LankaLab. Hemoglobin and WBC within normal clinical ranges.',
      ),
      _HistoryEntry(
        dateLabel: 'SEP 22, 2023',
        category: _HistoryCategory.immunization,
        title: 'Influenza Vaccine (Seasonal)',
        doctor: 'MOH Clinic Officer',
        facility: 'National Hospital of Sri Lanka',
        summary:
            'Seasonal influenza dose administered. Batch IN-044-L recorded in MOH national registry.',
      ),
    ];
  }
}

enum _HistoryCategory { treatmentPlan, familyCare, labReport, immunization }

class _HistoryEntry {
  const _HistoryEntry({
    required this.dateLabel,
    required this.category,
    required this.title,
    required this.doctor,
    required this.facility,
    required this.summary,
    this.medicines = const [],
  });

  final String dateLabel;
  final _HistoryCategory category;
  final String title;
  final String doctor;
  final String facility;
  final String summary;
  final List<String> medicines;
}

class _IdentityCard extends StatelessWidget {
  const _IdentityCard({required this.user});

  final UserProfile user;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final initial = user.name.isNotEmpty ? user.name[0].toUpperCase() : '?';

    return SoftCard(
      child: Row(
        children: [
          CircleAvatar(
            radius: 30,
            backgroundColor: AppColors.trustBlueSoft,
            child: Text(
              initial,
              style: const TextStyle(
                fontSize: 26,
                fontWeight: FontWeight.w800,
                color: AppColors.trustBlue,
              ),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  user.name,
                  style: const TextStyle(
                    color: AppColors.trustBlueDark,
                    fontWeight: FontWeight.w800,
                    fontSize: 18,
                  ),
                ),
                Text(
                  user.email,
                  style: const TextStyle(color: AppColors.slateMuted),
                ),
                if (user.ceylonHealthId != null)
                  Text(
                    user.ceylonHealthId!,
                    style: AppTheme.mono(
                      fontSize: 12,
                      color: AppColors.trustBlue,
                    ),
                  ),
                if (user.region != null)
                  Text(
                    'MOH ${user.region}',
                    style: const TextStyle(
                      color: AppColors.slateMuted,
                      fontSize: 12,
                    ),
                  ),
              ],
            ),
          ),
          IconButton(
            tooltip: l.t('editProfile'),
            onPressed: () =>
                Navigator.of(context).pushNamed('/register-profile'),
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

class _TreatmentHistoryCard extends StatelessWidget {
  const _TreatmentHistoryCard({required this.entries});

  final List<_HistoryEntry> entries;

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
              const Icon(Icons.monitor_heart_outlined,
                  color: AppColors.trustBlue),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  l.t('treatmentHistory'),
                  style: const TextStyle(
                    color: AppColors.trustBlueDark,
                    fontWeight: FontWeight.w800,
                    fontSize: 16,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            l.t('treatmentHistoryHint'),
            style: const TextStyle(
              color: AppColors.slateMuted,
              fontSize: 12,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 16),
          ...entries.map(
            (e) => Padding(
              padding: const EdgeInsets.only(bottom: 14),
              child: _HistoryTimelineItem(entry: e),
            ),
          ),
        ],
      ),
    );
  }
}

class _HistoryTimelineItem extends StatelessWidget {
  const _HistoryTimelineItem({required this.entry});

  final _HistoryEntry entry;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final style = _badgeStyle(entry.category, l);

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SizedBox(
            width: 20,
            child: Column(
              children: [
                Container(
                  width: 12,
                  height: 12,
                  decoration: BoxDecoration(
                    color: style.dot,
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 2),
                    boxShadow: [
                      BoxShadow(
                        color: style.dot.withValues(alpha: 0.35),
                        blurRadius: 4,
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: Container(
                    width: 2,
                    margin: const EdgeInsets.symmetric(vertical: 4),
                    color: AppColors.border,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        entry.dateLabel,
                        style: const TextStyle(
                          color: AppColors.slateMuted,
                          fontWeight: FontWeight.w700,
                          fontSize: 11,
                          letterSpacing: 0.6,
                        ),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: style.bg,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Text(
                        style.label,
                        style: TextStyle(
                          color: style.fg,
                          fontWeight: FontWeight.w800,
                          fontSize: 10,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  entry.title,
                  style: const TextStyle(
                    color: AppColors.trustBlueDark,
                    fontWeight: FontWeight.w800,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  entry.doctor,
                  style: const TextStyle(
                    color: AppColors.slateMuted,
                    fontSize: 12,
                  ),
                ),
                Text(
                  entry.facility,
                  style: const TextStyle(
                    color: AppColors.slateMuted,
                    fontSize: 12,
                    fontStyle: FontStyle.italic,
                  ),
                ),
                const SizedBox(height: 8),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    entry.summary,
                    style: const TextStyle(
                      color: AppColors.slateMuted,
                      fontSize: 12,
                      height: 1.4,
                    ),
                  ),
                ),
                if (entry.medicines.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.trustBlueSoft,
                      borderRadius: BorderRadius.circular(12),
                      border: const Border(
                        top: BorderSide(color: AppColors.trustBlue, width: 2),
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          l.t('issuedClinicalMedicines'),
                          style: const TextStyle(
                            color: AppColors.trustBlue,
                            fontWeight: FontWeight.w800,
                            fontSize: 11,
                            letterSpacing: 0.5,
                          ),
                        ),
                        const SizedBox(height: 6),
                        ...entry.medicines.map(
                          (m) => Padding(
                            padding: const EdgeInsets.only(bottom: 2),
                            child: Text(
                              '• $m',
                              style: const TextStyle(
                                color: AppColors.trustBlueDark,
                                fontSize: 12,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  _BadgeStyle _badgeStyle(_HistoryCategory category, AppLocalizations l) {
    return switch (category) {
      _HistoryCategory.treatmentPlan => _BadgeStyle(
          label: l.t('treatmentPlan'),
          bg: AppColors.trustBlueSoft,
          fg: AppColors.trustBlue,
          dot: AppColors.trustBlue,
        ),
      _HistoryCategory.familyCare => const _BadgeStyle(
          label: 'Family Care',
          bg: Color(0xFFFEF3C7),
          fg: Color(0xFFB45309),
          dot: Color(0xFFF59E0B),
        ),
      _HistoryCategory.labReport => const _BadgeStyle(
          label: 'Lab Report',
          bg: Color(0xFFF3E8FF),
          fg: Color(0xFF7E22CE),
          dot: Color(0xFFA855F7),
        ),
      _HistoryCategory.immunization => const _BadgeStyle(
          label: 'Immunization',
          bg: Color(0xFFCCFBF1),
          fg: Color(0xFF0F766E),
          dot: Color(0xFF14B8A6),
        ),
    };
  }
}

class _BadgeStyle {
  const _BadgeStyle({
    required this.label,
    required this.bg,
    required this.fg,
    required this.dot,
  });

  final String label;
  final Color bg;
  final Color fg;
  final Color dot;
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
