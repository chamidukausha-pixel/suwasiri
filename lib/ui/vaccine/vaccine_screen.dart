import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';

import '../../bloc/auth/auth_cubit.dart';
import '../../bloc/notification/notification_cubit.dart';
import '../../bloc/vaccine/vaccine_cubit.dart';
import '../../core/constants/app_constants.dart';
import '../../core/theme/app_colors.dart';
import '../../data/models/app_notification.dart';
import '../../data/models/vaccine_models.dart';
import '../../localization/app_localizations.dart';
import '../widgets/common_widgets.dart';
import '../widgets/suwasiri_brand_header.dart';

class VaccineScreen extends StatefulWidget {
  const VaccineScreen({super.key});

  @override
  State<VaccineScreen> createState() => _VaccineScreenState();
}

class _VaccineScreenState extends State<VaccineScreen> {
  @override
  void initState() {
    super.initState();
    final user = context.read<AuthCubit>().state.user;
    if (user != null) {
      context.read<VaccineCubit>().bootstrap(user.id).then((_) {
        if (!mounted) return;
        context.read<NotificationCubit>().load();
        context.read<NotificationCubit>().showToast(
              AppNotification(
                id: 'toast-moh-${DateTime.now().millisecondsSinceEpoch}',
                title: 'MOH Live Synced',
                body: 'Immunization registry refreshed.',
                timestamp: DateTime.now(),
                type: NotificationPayloadType.sync,
              ),
            );
      });
    }
  }

  Future<void> _openBookingSheet() async {
    final cubit = context.read<VaccineCubit>();
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (ctx) {
        return DraggableScrollableSheet(
          expand: false,
          initialChildSize: 0.75,
          minChildSize: 0.45,
          maxChildSize: 0.95,
          builder: (_, scrollCtrl) {
            return BlocBuilder<VaccineCubit, VaccineState>(
              builder: (context, state) {
                final l = AppLocalizations.of(context);
                return ListView(
                  controller: scrollCtrl,
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                  children: [
                    Text(
                      l.t('requestBookVaccine'),
                      style: const TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 18,
                        color: AppColors.trustBlueDark,
                      ),
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      key: ValueKey('district-${state.district ?? ''}'),
                      initialValue:
                          (state.district == null || state.district!.isEmpty)
                              ? ''
                              : state.district,
                      decoration: InputDecoration(
                        labelText: l.t('medicalDistrict'),
                      ),
                      items: [
                        DropdownMenuItem(
                          value: '',
                          child: Text(l.t('allDistricts')),
                        ),
                        ...AppConstants.mohDistricts.map(
                          (d) => DropdownMenuItem(value: d, child: Text(d)),
                        ),
                      ],
                      onChanged: (v) => cubit
                          .setDistrict(v == null || v.isEmpty ? null : v),
                    ),
                    const SizedBox(height: 10),
                    Wrap(
                      spacing: 8,
                      children: FacilityType.values.map((t) {
                        final selected = state.facilityType == t;
                        final label = switch (t) {
                          FacilityType.all => l.t('allCategories'),
                          FacilityType.mohClinic => 'MOH Clinic',
                          FacilityType.hospital => 'Hospital',
                        };
                        return ChoiceChip(
                          label: Text(label),
                          selected: selected,
                          onSelected: (_) => cubit.setType(t),
                          selectedColor:
                              AppColors.trustBlue.withValues(alpha: 0.15),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 10),
                    TextField(
                      decoration: InputDecoration(
                        hintText: l.t('searchClinic'),
                        prefixIcon: const Icon(Icons.search),
                      ),
                      onChanged: cubit.setQuery,
                    ),
                    const SizedBox(height: 12),
                    if (state.loading)
                      const Center(child: CircularProgressIndicator())
                    else
                      ...state.clinics.map(
                        (c) => Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: SoftCard(
                            onTap: () => cubit.selectClinic(c),
                            child: Row(
                              children: [
                                Icon(
                                  c.type == FacilityType.hospital
                                      ? Icons.local_hospital
                                      : Icons.medical_services,
                                  color: AppColors.trustBlue,
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        c.name,
                                        style: const TextStyle(
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                      Text('${c.district} · ${c.address}'),
                                    ],
                                  ),
                                ),
                                const Icon(Icons.chevron_right),
                              ],
                            ),
                          ),
                        ),
                      ),
                    if (state.selectedClinic != null) ...[
                      const SizedBox(height: 8),
                      Text(
                        '${l.t('book')}: ${state.selectedClinic!.name}',
                        style: const TextStyle(fontWeight: FontWeight.w700),
                      ),
                      if (state.bookingStage != null)
                        SoftCard(child: Text(state.bookingStage!)),
                      ...state.slots.map(
                        (slot) => ListTile(
                          contentPadding: EdgeInsets.zero,
                          title: Text(
                            DateFormat('EEE d MMM · HH:mm').format(slot),
                          ),
                          trailing: FilledButton(
                            onPressed: () {
                              final user =
                                  context.read<AuthCubit>().state.user!;
                              cubit.book(
                                patientId: user.id,
                                slot: slot,
                                ceylonHealthId:
                                    user.ceylonHealthId ?? 'CH-UNKNOWN',
                              );
                            },
                            child: Text(l.t('reserve')),
                          ),
                        ),
                      ),
                    ],
                  ],
                );
              },
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    return BlocConsumer<VaccineCubit, VaccineState>(
      listener: (context, state) {
        if (state.message != null) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(state.message!)),
          );
          context.read<NotificationCubit>().load();
          if (state.message!.startsWith('Booked') &&
              Navigator.of(context).canPop()) {
            Navigator.of(context).pop();
          }
        }
      },
      builder: (context, state) {
        VaccineProtocol? dengue;
        for (final p in state.protocols) {
          if (p.name.toLowerCase().contains('dengue')) {
            dengue = p;
            break;
          }
        }
        dengue ??= state.protocols.isEmpty ? null : state.protocols.first;
        final syncTime = state.lastSync ?? DateTime.now();

        return SafeArea(
          bottom: false,
          child: ListView(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 28),
            children: [
              const SuwasiriBrandHeader(),
              const SizedBox(height: 18),
              Text(
                l.t('vaccineRegistryTitle'),
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                      fontSize: 24,
                    ),
              ),
              const SizedBox(height: 6),
              Text(
                l.t('vaccineRegistrySubtitle'),
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 14),
              Align(
                alignment: Alignment.centerRight,
                child: FilledButton.icon(
                  onPressed: _openBookingSheet,
                  style: FilledButton.styleFrom(
                    minimumSize: const Size(0, 44),
                    padding: const EdgeInsets.symmetric(horizontal: 14),
                  ),
                  icon: const Icon(Icons.calendar_month, size: 18),
                  label: Text(l.t('requestBookVaccine')),
                ),
              ),
              const SizedBox(height: 16),
              _MohPortalCard(
                syncTime: syncTime,
                onRefresh: () {
                  final user = context.read<AuthCubit>().state.user;
                  if (user != null) {
                    context.read<VaccineCubit>().bootstrap(user.id);
                  }
                },
              ),
              const SizedBox(height: 14),
              if (dengue != null) _ActiveProtocolCard(protocol: dengue),
              const SizedBox(height: 18),
              Text(
                l.t('registeredProtocols'),
                style: const TextStyle(
                  color: AppColors.slateMuted,
                  fontWeight: FontWeight.w800,
                  fontSize: 12,
                  letterSpacing: 1.0,
                ),
              ),
              const SizedBox(height: 12),
              ...state.protocols.map(
                (p) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: _ProtocolCard(
                    protocol: p,
                    onSchedule: p.status == VaccineStatus.pending
                        ? _openBookingSheet
                        : null,
                  ),
                ),
              ),
              SoftCard(
                color: const Color(0xFFF1F5F9),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.info_outline, color: AppColors.slateMuted),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        l.t('mohCertifiedNote'),
                        style: const TextStyle(
                          color: AppColors.slateMuted,
                          fontSize: 12,
                          height: 1.4,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _MohPortalCard extends StatelessWidget {
  const _MohPortalCard({
    required this.syncTime,
    required this.onRefresh,
  });

  final DateTime syncTime;
  final VoidCallback onRefresh;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final time = DateFormat('hh:mm:ss a').format(syncTime);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF0D1B2E), Color(0xFF071526)],
        ),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white24),
                ),
                child: const Text(
                  'LK',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w800,
                    fontSize: 13,
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      l.t('mohPortalLink'),
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w800,
                        fontSize: 14,
                      ),
                    ),
                    Text(
                      l.t('mohCentralRegistry'),
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.65),
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ),
              IconButton(
                onPressed: onRefresh,
                icon: const Icon(Icons.refresh, color: Colors.white70, size: 20),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.circle, size: 8, color: Color(0xFF00E676)),
                    const SizedBox(width: 4),
                    Text(
                      l.t('liveSyncedCaps'),
                      style: const TextStyle(
                        color: Color(0xFF00E676),
                        fontWeight: FontWeight.w800,
                        fontSize: 10,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: _MohStatBox(
                  label: l.t('syncTimestamp'),
                  value: time,
                  valueColor: const Color(0xFF00E676),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _MohStatBox(
                  label: l.t('registryProfile'),
                  value: l.t('verifiedLankaId'),
                  valueColor: Colors.white,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.06),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Row(
              children: [
                const Icon(Icons.campaign_outlined,
                    color: Color(0xFFF472B6), size: 18),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    l.t('mohDengueAlert'),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.75),
                      fontSize: 12,
                    ),
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

class _MohStatBox extends StatelessWidget {
  const _MohStatBox({
    required this.label,
    required this.value,
    required this.valueColor,
  });

  final String label;
  final String value;
  final Color valueColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.5),
              fontWeight: FontWeight.w700,
              fontSize: 10,
              letterSpacing: 0.6,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              color: valueColor,
              fontWeight: FontWeight.w800,
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }
}

class _ActiveProtocolCard extends StatelessWidget {
  const _ActiveProtocolCard({required this.protocol});

  final VaccineProtocol protocol;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final days = protocol.nextDue == null
        ? 0
        : protocol.nextDue!.difference(DateTime.now()).inDays.clamp(0, 999);
    final immunity = (protocol.progress * 100).round().clamp(0, 100);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.trustBlue,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: AppColors.trustBlue.withValues(alpha: 0.35),
            blurRadius: 16,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Text(
              l.t('registryUpdate'),
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w800,
                fontSize: 10,
                letterSpacing: 0.5,
              ),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            l.t('activeDengueProtocol'),
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w800,
              fontSize: 18,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            l.t('activeDengueBody').replaceAll('{days}', '$days'),
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.92),
              fontSize: 13,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 14),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              color: Colors.black.withValues(alpha: 0.18),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              children: [
                const Icon(Icons.monitor_heart_outlined,
                    color: Colors.white, size: 18),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    l.t('registryStatusActive'),
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                      fontSize: 12,
                    ),
                  ),
                ),
                Text(
                  '${l.t('immunityIndex')}: $immunity%',
                  style: const TextStyle(
                    color: Color(0xFF00E676),
                    fontWeight: FontWeight.w800,
                    fontSize: 12,
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

class _ProtocolCard extends StatelessWidget {
  const _ProtocolCard({
    required this.protocol,
    this.onSchedule,
  });

  final VaccineProtocol protocol;
  final VoidCallback? onSchedule;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final theme = _themeFor(protocol.status);
    final pct = (protocol.progress * 100).round();

    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(
            color: AppColors.trustBlueDark.withValues(alpha: 0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: IntrinsicHeight(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Container(
              width: 5,
              decoration: BoxDecoration(
                color: theme.accent,
                borderRadius: const BorderRadius.horizontal(
                  left: Radius.circular(18),
                ),
              ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(14, 14, 14, 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            color: theme.soft,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Icon(
                            Icons.vaccines_rounded,
                            color: theme.accent,
                            size: 22,
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                protocol.name,
                                style: const TextStyle(
                                  color: AppColors.trustBlueDark,
                                  fontWeight: FontWeight.w800,
                                  fontSize: 15,
                                ),
                              ),
                              if (protocol.productName.isNotEmpty)
                                Text(
                                  protocol.productName,
                                  style: const TextStyle(
                                    color: AppColors.slateMuted,
                                    fontSize: 12,
                                  ),
                                ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: theme.soft,
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Text(
                            theme.badge,
                            style: TextStyle(
                              color: theme.accent,
                              fontWeight: FontWeight.w800,
                              fontSize: 10,
                              letterSpacing: 0.4,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            l.t('immunizationProgress'),
                            style: const TextStyle(
                              color: AppColors.slateMuted,
                              fontSize: 12,
                            ),
                          ),
                        ),
                        Text(
                          '$pct%',
                          style: TextStyle(
                            color: theme.accent,
                            fontWeight: FontWeight.w800,
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: LinearProgressIndicator(
                        value: protocol.progress.clamp(0.0, 1.0),
                        minHeight: 8,
                        backgroundColor: AppColors.border,
                        color: theme.accent,
                      ),
                    ),
                    const SizedBox(height: 12),
                    if (protocol.status == VaccineStatus.pending &&
                        onSchedule != null)
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
                              protocol.nextDue == null
                                  ? protocol.statusDetail
                                  : '${l.t('dueDate')}: ${DateFormat('MMM d, yyyy').format(protocol.nextDue!)}',
                              style: const TextStyle(
                                color: AppColors.slateMuted,
                                fontSize: 12,
                              ),
                            ),
                          ),
                          FilledButton(
                            onPressed: onSchedule,
                            style: FilledButton.styleFrom(
                              minimumSize: const Size(0, 36),
                              padding:
                                  const EdgeInsets.symmetric(horizontal: 12),
                            ),
                            child: Text(l.t('scheduleDoseNow')),
                          ),
                        ],
                      )
                    else
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
                              protocol.status == VaccineStatus.completed
                                  ? l.t('fullyImmunised')
                                  : protocol.nextDue == null
                                      ? protocol.statusDetail
                                      : '${l.t('dueDate')}: ${DateFormat('MMM d, yyyy').format(protocol.nextDue!)}',
                              style: const TextStyle(
                                color: AppColors.slateMuted,
                                fontSize: 12,
                              ),
                            ),
                          ),
                          Icon(Icons.check_circle,
                              size: 16, color: theme.accent),
                          const SizedBox(width: 4),
                          Flexible(
                            child: Text(
                              protocol.statusDetail.isEmpty
                                  ? theme.badge
                                  : protocol.statusDetail,
                              textAlign: TextAlign.end,
                              style: TextStyle(
                                color: theme.accent,
                                fontWeight: FontWeight.w700,
                                fontSize: 12,
                              ),
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

  _ProtocolTheme _themeFor(VaccineStatus status) {
    return switch (status) {
      VaccineStatus.completed => const _ProtocolTheme(
          accent: AppColors.emerald,
          soft: AppColors.emeraldSoft,
          badge: 'COMPLETED',
        ),
      VaccineStatus.scheduled => const _ProtocolTheme(
          accent: AppColors.trustBlue,
          soft: AppColors.trustBlueSoft,
          badge: 'SCHEDULED',
        ),
      VaccineStatus.pending => const _ProtocolTheme(
          accent: AppColors.vaccineOrange,
          soft: AppColors.vaccineOrangeSoft,
          badge: 'PENDING',
        ),
    };
  }
}

class _ProtocolTheme {
  const _ProtocolTheme({
    required this.accent,
    required this.soft,
    required this.badge,
  });

  final Color accent;
  final Color soft;
  final String badge;
}
