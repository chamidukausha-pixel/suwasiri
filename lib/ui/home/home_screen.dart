import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';

import '../../bloc/auth/auth_cubit.dart';
import '../../core/theme/app_colors.dart';
import '../../data/models/appointment.dart';
import '../../data/models/vaccine_models.dart';
import '../../data/repositories/health_repository.dart';
import '../../localization/app_localizations.dart';
import '../widgets/common_widgets.dart';
import '../widgets/suwasiri_brand_header.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key, required this.onNavigate});

  final ValueChanged<int> onNavigate;

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  Appointment? _nextAppt;
  VaccineProtocol? _vaccine;

  static const _categories = [
    'Cardiology',
    'Pediatrics',
    'Dermatology',
    'Neurology',
  ];

  @override
  void initState() {
    super.initState();
    _loadHomeData();
  }

  Future<void> _loadHomeData() async {
    final user = context.read<AuthCubit>().state.user;
    if (user == null) return;
    final health = context.read<HealthRepository>();
    final appts = await health.getAppointments(user.id);
    final protocols = await health.getVaccineProtocols(user.id);
    if (!mounted) return;
    setState(() {
      final upcoming = appts
          .where((a) => a.status == AppointmentStatus.upcoming)
          .toList()
        ..sort((a, b) => a.timeSlot.compareTo(b.timeSlot));
      _nextAppt = upcoming.isEmpty ? null : upcoming.first;
      _vaccine = protocols.where((p) => p.progress < 1.0).isNotEmpty
          ? protocols.firstWhere((p) => p.progress < 1.0)
          : (protocols.isEmpty ? null : protocols.first);
    });
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final user = context.watch<AuthCubit>().state.user;
    final firstName = user?.name.split(' ').first ?? '';

    return SafeArea(
      bottom: false,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 28),
        children: [
          const SuwasiriBrandHeader(),
          const SizedBox(height: 22),
          Text(
            '${l.t('greeting')}, $firstName',
            style: Theme.of(context).textTheme.headlineMedium,
          ),
          const SizedBox(height: 6),
          Text(
            l.t('homeHelp'),
            style:
                Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 15),
          ),
          const SizedBox(height: 18),
          _SearchField(
            hint: l.t('searchDoctors'),
            onTap: () => widget.onNavigate(1),
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 38,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: _categories.length,
              separatorBuilder: (_, _) => const SizedBox(width: 8),
              itemBuilder: (context, i) {
                return _CategoryChip(
                  label: _categories[i],
                  onTap: () => widget.onNavigate(1),
                );
              },
            ),
          ),
          const SizedBox(height: 24),
          Text(
            l.t('quickActions'),
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _QuickActionCard(
                  icon: Icons.calendar_month_rounded,
                  iconBg: AppColors.trustBlue,
                  label: l.t('bookAppointment'),
                  onTap: () => widget.onNavigate(1),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _QuickActionCard(
                  icon: Icons.videocam_rounded,
                  iconBg: AppColors.videoBrown,
                  label: l.t('videoConsultation'),
                  onTap: () => widget.onNavigate(2),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _QuickActionCard(
                  icon: Icons.folder_special_rounded,
                  iconBg: AppColors.vaultGreen,
                  label: l.t('viewVault'),
                  onTap: () => widget.onNavigate(3),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          _LabReportsTile(
            label: l.t('myLabReports'),
            onTap: () => widget.onNavigate(3),
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              Text(
                l.t('upcoming'),
                style: const TextStyle(
                  color: AppColors.slateMuted,
                  fontWeight: FontWeight.w700,
                  fontSize: 12,
                  letterSpacing: 1.2,
                ),
              ),
              const Spacer(),
              Container(
                width: 7,
                height: 7,
                decoration: const BoxDecoration(
                  color: AppColors.trustBlue,
                  shape: BoxShape.circle,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (_nextAppt != null)
            _UpcomingAppointmentCard(
              appointment: _nextAppt!,
              upcomingLabel: l.t('upcoming'),
              detailsLabel: l.t('viewDetailsMap'),
              inPersonLabel: l.t('inPerson'),
              onDetails: () => widget.onNavigate(1),
            )
          else
            SoftCard(
              child: Text(
                l.t('noUpcoming'),
                style: Theme.of(context).textTheme.bodyMedium,
              ),
            ),
          const SizedBox(height: 14),
          if (_vaccine != null)
            _VaccinationStatusCard(
              protocol: _vaccine!,
              statusLabel: l.t('vaccinationStatus'),
              pendingLabel: l.t('pending'),
              scheduleLabel: l.t('scheduleNow'),
              dueLabel: _dueLabel(l, _vaccine!),
              onSchedule: () => widget.onNavigate(4),
            ),
          const SizedBox(height: 14),
          _HealthTipCard(
            title: l.t('healthTipTitle'),
            body: l.t('healthTipBody'),
          ),
        ],
      ),
    );
  }

  String _dueLabel(AppLocalizations l, VaccineProtocol protocol) {
    final due = protocol.nextDue;
    if (due == null) return protocol.doseLabel;
    final days = due.difference(DateTime.now()).inDays.clamp(0, 999);
    return l.t('dueInDays').replaceAll('{days}', '$days');
  }
}

class _SearchField extends StatelessWidget {
  const _SearchField({required this.hint, required this.onTap});

  final String hint;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return MinTap(
      onTap: onTap,
      child: Container(
        height: 52,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          children: [
            const Icon(Icons.search_rounded, color: AppColors.slateMuted),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                hint,
                style: const TextStyle(
                  color: AppColors.slateMuted,
                  fontSize: 15,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CategoryChip extends StatelessWidget {
  const _CategoryChip({required this.label, required this.onTap});

  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return MinTap(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: AppColors.trustBlueSoft,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          label,
          style: const TextStyle(
            color: AppColors.trustBlueDark,
            fontWeight: FontWeight.w600,
            fontSize: 13,
          ),
        ),
      ),
    );
  }
}

class _QuickActionCard extends StatelessWidget {
  const _QuickActionCard({
    required this.icon,
    required this.iconBg,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final Color iconBg;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return MinTap(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.fromLTRB(10, 16, 10, 14),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: AppColors.border),
          boxShadow: [
            BoxShadow(
              color: AppColors.trustBlueDark.withValues(alpha: 0.04),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: iconBg,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: Colors.white, size: 24),
            ),
            const SizedBox(height: 10),
            Text(
              label,
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: AppColors.trustBlueDark,
                fontWeight: FontWeight.w700,
                fontSize: 12,
                height: 1.25,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _LabReportsTile extends StatelessWidget {
  const _LabReportsTile({required this.label, required this.onTap});

  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return MinTap(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: AppColors.labBeige,
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(
                Icons.description_outlined,
                color: AppColors.labIcon,
                size: 22,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                label,
                style: const TextStyle(
                  color: AppColors.trustBlueDark,
                  fontWeight: FontWeight.w700,
                  fontSize: 15,
                ),
              ),
            ),
            const Icon(
              Icons.chevron_right_rounded,
              color: AppColors.slateMuted,
            ),
          ],
        ),
      ),
    );
  }
}

class _UpcomingAppointmentCard extends StatelessWidget {
  const _UpcomingAppointmentCard({
    required this.appointment,
    required this.upcomingLabel,
    required this.detailsLabel,
    required this.inPersonLabel,
    required this.onDetails,
  });

  final Appointment appointment;
  final String upcomingLabel;
  final String detailsLabel;
  final String inPersonLabel;
  final VoidCallback onDetails;

  @override
  Widget build(BuildContext context) {
    final date = DateFormat('MMM d, y').format(appointment.timeSlot);
    final time = DateFormat('hh:mm a').format(appointment.timeSlot);

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.trustBlue,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: AppColors.trustBlue.withValues(alpha: 0.35),
            blurRadius: 18,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  upcomingLabel,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                    fontSize: 11,
                    letterSpacing: 0.6,
                  ),
                ),
              ),
              const Spacer(),
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.18),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.notifications_outlined,
                  color: Colors.white,
                  size: 18,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            appointment.doctorName,
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w800,
              fontSize: 22,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            '${appointment.specialty} Consultation',
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.85),
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 14),
          Divider(color: Colors.white.withValues(alpha: 0.25), height: 1),
          const SizedBox(height: 14),
          Row(
            children: [
              const Icon(Icons.calendar_today_outlined,
                  color: Colors.white, size: 16),
              const SizedBox(width: 6),
              Text(
                date,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                  fontSize: 13,
                ),
              ),
              const Spacer(),
              const Icon(Icons.access_time, color: Colors.white, size: 16),
              const SizedBox(width: 6),
              Flexible(
                child: Text(
                  '$time ($inPersonLabel)',
                  textAlign: TextAlign.end,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            height: 48,
            child: FilledButton(
              style: FilledButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: AppColors.trustBlue,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(28),
                ),
                elevation: 0,
              ),
              onPressed: onDetails,
              child: Text(
                detailsLabel,
                style: const TextStyle(fontWeight: FontWeight.w700),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _VaccinationStatusCard extends StatelessWidget {
  const _VaccinationStatusCard({
    required this.protocol,
    required this.statusLabel,
    required this.pendingLabel,
    required this.scheduleLabel,
    required this.dueLabel,
    required this.onSchedule,
  });

  final VaccineProtocol protocol;
  final String statusLabel;
  final String pendingLabel;
  final String scheduleLabel;
  final String dueLabel;
  final VoidCallback onSchedule;

  @override
  Widget build(BuildContext context) {
    final pct = (protocol.progress * 100).round();
    final pending = protocol.progress < 1.0;

    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border),
      ),
      child: IntrinsicHeight(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Container(
              width: 5,
              decoration: const BoxDecoration(
                color: AppColors.vaccineOrange,
                borderRadius: BorderRadius.horizontal(
                  left: Radius.circular(20),
                ),
              ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(14, 16, 16, 14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 36,
                          height: 36,
                          decoration: BoxDecoration(
                            color: AppColors.vaccineOrangeSoft,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(
                            Icons.vaccines_rounded,
                            color: AppColors.vaccineOrange,
                            size: 20,
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            statusLabel,
                            style: const TextStyle(
                              color: AppColors.slateMuted,
                              fontWeight: FontWeight.w700,
                              fontSize: 11,
                              letterSpacing: 0.8,
                            ),
                          ),
                        ),
                        if (pending)
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 10,
                              vertical: 4,
                            ),
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(
                                color: AppColors.vaccineOrange
                                    .withValues(alpha: 0.55),
                              ),
                            ),
                            child: Text(
                              pendingLabel,
                              style: const TextStyle(
                                color: AppColors.vaccineOrange,
                                fontWeight: FontWeight.w700,
                                fontSize: 10,
                                letterSpacing: 0.5,
                              ),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            '${protocol.name} (${protocol.doseLabel})',
                            style: const TextStyle(
                              color: AppColors.trustBlueDark,
                              fontWeight: FontWeight.w700,
                              fontSize: 15,
                            ),
                          ),
                        ),
                        Text(
                          '$pct%',
                          style: const TextStyle(
                            color: AppColors.vaccineOrange,
                            fontWeight: FontWeight.w800,
                            fontSize: 15,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: LinearProgressIndicator(
                        value: protocol.progress.clamp(0.0, 1.0),
                        minHeight: 8,
                        backgroundColor: AppColors.border,
                        color: AppColors.vaccineOrange,
                      ),
                    ),
                    const SizedBox(height: 14),
                    Row(
                      children: [
                        const Icon(
                          Icons.calendar_today_outlined,
                          size: 14,
                          color: AppColors.slateMuted,
                        ),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            dueLabel,
                            style: const TextStyle(
                              color: AppColors.slateMuted,
                              fontSize: 13,
                            ),
                          ),
                        ),
                        MinTap(
                          onTap: onSchedule,
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                scheduleLabel,
                                style: const TextStyle(
                                  color: AppColors.trustBlue,
                                  fontWeight: FontWeight.w700,
                                  fontSize: 13,
                                ),
                              ),
                              const SizedBox(width: 2),
                              const Icon(
                                Icons.arrow_forward_rounded,
                                size: 16,
                                color: AppColors.trustBlue,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _HealthTipCard extends StatelessWidget {
  const _HealthTipCard({required this.title, required this.body});

  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.emeraldSoft,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: AppColors.emerald.withValues(alpha: 0.2),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: const Color(0xFFD1FAE5),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.spa_outlined,
              color: AppColors.tipTeal,
              size: 22,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    color: AppColors.tipTeal,
                    fontWeight: FontWeight.w800,
                    fontSize: 15,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  body,
                  style: TextStyle(
                    color: AppColors.tipTeal.withValues(alpha: 0.85),
                    fontSize: 13,
                    height: 1.45,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
