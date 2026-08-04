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
        }
      },
      builder: (context, state) {
        final cubit = context.read<VaccineCubit>();
        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            SoftCard(
              color: AppColors.emeraldSoft,
              child: Row(
                children: [
                  const Icon(Icons.cloud_done, color: AppColors.emerald),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '${l.t('mohBanner')} · ${l.t('liveSynced')}',
                          style: const TextStyle(fontWeight: FontWeight.w700),
                        ),
                        Text(
                          state.lastSync == null
                              ? '—'
                              : 'Updated ${DateFormat('d MMM yyyy · HH:mm').format(state.lastSync!)}',
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            SectionHeader('National vaccine tracker'),
            ...state.protocols.map((p) => Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: SoftCard(
                    child: Row(
                      children: [
                        SizedBox(
                          width: 56,
                          height: 56,
                          child: Stack(
                            fit: StackFit.expand,
                            children: [
                              CircularProgressIndicator(
                                value: p.progress,
                                strokeWidth: 6,
                                backgroundColor: AppColors.border,
                                color: AppColors.emerald,
                              ),
                              Center(
                                child: Text(
                                  '${(p.progress * 100).round()}%',
                                  style: const TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(p.name,
                                  style: const TextStyle(
                                      fontWeight: FontWeight.w700)),
                              Text(p.doseLabel),
                              if (p.nextDue != null)
                                Text(
                                  'Next: ${DateFormat('d MMM yyyy').format(p.nextDue!)}',
                                  style: Theme.of(context).textTheme.bodyMedium,
                                ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                )),
            const SizedBox(height: 12),
            SectionHeader('Clinic search'),
            DropdownButtonFormField<String>(
              key: ValueKey('district-${state.district ?? ''}'),
              initialValue: (state.district == null || state.district!.isEmpty)
                  ? ''
                  : state.district,
              decoration: const InputDecoration(labelText: 'Medical district'),
              items: [
                const DropdownMenuItem(value: '', child: Text('All districts')),
                ...AppConstants.mohDistricts.map(
                  (d) => DropdownMenuItem(value: d, child: Text(d)),
                ),
              ],
              onChanged: (v) => cubit.setDistrict(v == null || v.isEmpty ? null : v),
            ),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              children: FacilityType.values.map((t) {
                final selected = state.facilityType == t;
                final label = switch (t) {
                  FacilityType.all => 'All',
                  FacilityType.mohClinic => 'MOH Clinic',
                  FacilityType.hospital => 'Hospital',
                };
                return ChoiceChip(
                  label: Text(label),
                  selected: selected,
                  onSelected: (_) => cubit.setType(t),
                  selectedColor: AppColors.trustBlue.withValues(alpha: 0.15),
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
              ...state.clinics.map((c) => Padding(
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
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(c.name,
                                    style: const TextStyle(
                                        fontWeight: FontWeight.w600)),
                                Text('${c.district} · ${c.address}'),
                              ],
                            ),
                          ),
                          const Icon(Icons.chevron_right),
                        ],
                      ),
                    ),
                  )),
            if (state.selectedClinic != null) ...[
              const SizedBox(height: 12),
              SectionHeader('Book: ${state.selectedClinic!.name}'),
              if (state.bookingStage != null)
                SoftCard(
                  child: Text(
                    state.bookingStage!,
                    style: const TextStyle(fontWeight: FontWeight.w600),
                  ),
                ),
              ...state.slots.map((slot) => ListTile(
                    title: Text(DateFormat('EEE d MMM · HH:mm').format(slot)),
                    trailing: FilledButton(
                      onPressed: () {
                        final user = context.read<AuthCubit>().state.user!;
                        cubit.book(
                          patientId: user.id,
                          slot: slot,
                          ceylonHealthId:
                              user.ceylonHealthId ?? 'CH-UNKNOWN',
                        );
                      },
                      child: const Text('Reserve'),
                    ),
                  )),
            ],
          ],
        );
      },
    );
  }
}
