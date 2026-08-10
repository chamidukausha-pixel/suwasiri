import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';

import '../../bloc/auth/auth_cubit.dart';
import '../../bloc/vaccine/vaccine_cubit.dart';
import '../../core/constants/app_constants.dart';
import '../../core/theme/app_colors.dart';
import '../../data/catalogs/vaccine_catalog.dart';
import '../../data/models/vaccine_models.dart';

/// National Vaccine Slot Booking sheet (MOH Scheduling Coordinator).
class VaccineBookingSheet extends StatelessWidget {
  const VaccineBookingSheet({super.key, required this.scrollController});

  final ScrollController scrollController;

  static String _typeLabel(FacilityType t) => switch (t) {
        FacilityType.all => 'All',
        FacilityType.mohClinic => 'MOH',
        FacilityType.hospital => 'Hospital',
        FacilityType.privateHospital => 'Private Hospital',
      };

  static String _typeTag(FacilityType t) => switch (t) {
        FacilityType.mohClinic => 'MOH',
        FacilityType.hospital => 'Hospital',
        FacilityType.privateHospital => 'Private',
        FacilityType.all => '',
      };

  static Color _typeTagColor(FacilityType t) => switch (t) {
        FacilityType.mohClinic => const Color(0xFF7C3AED),
        FacilityType.hospital => const Color(0xFF0369A1),
        FacilityType.privateHospital => const Color(0xFFB45309),
        FacilityType.all => AppColors.slateMuted,
      };

  @override
  Widget build(BuildContext context) {
    final cubit = context.read<VaccineCubit>();

    return BlocBuilder<VaccineCubit, VaccineState>(
      builder: (context, state) {
        final clinic = state.selectedClinic;
        final isPrivate = clinic?.type == FacilityType.privateHospital;
        final price = clinic?.priceLkr;

        return ListView(
          controller: scrollController,
          padding: const EdgeInsets.fromLTRB(20, 4, 20, 28),
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xFFE0F2FE),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Text(
                          'MOH SCHEDULING COORDINATOR',
                          style: TextStyle(
                            color: Color(0xFF0369A1),
                            fontWeight: FontWeight.w800,
                            fontSize: 10,
                            letterSpacing: 0.6,
                          ),
                        ),
                      ),
                      const SizedBox(height: 10),
                      const Text(
                        'National Vaccine Slot Booking',
                        style: TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 22,
                          color: Color(0xFF0F172A),
                          height: 1.2,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Reserve slots across official MOH clinics & hospitals. '
                        'Synced directly with central immunization grids.',
                        style: TextStyle(
                          color: Colors.grey.shade600,
                          fontSize: 13,
                          height: 1.35,
                        ),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.of(context).maybePop(),
                  style: IconButton.styleFrom(
                    backgroundColor: const Color(0xFFF1F5F9),
                  ),
                  icon: const Icon(Icons.close, size: 20),
                ),
              ],
            ),
            const SizedBox(height: 18),
            const _FieldLabel('Select Target Immunization'),
            const SizedBox(height: 6),
            DropdownButtonFormField<String>(
              key: ValueKey('imm-${state.immunizationTarget}'),
              initialValue: VaccineCatalog.immunizationTargets
                      .contains(state.immunizationTarget)
                  ? state.immunizationTarget
                  : VaccineCatalog.immunizationTargets.first,
              isExpanded: true,
              decoration: const InputDecoration(
                contentPadding:
                    EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              ),
              items: VaccineCatalog.immunizationTargets
                  .map(
                    (t) => DropdownMenuItem(
                      value: t,
                      child: Text(
                        t,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontSize: 13),
                      ),
                    ),
                  )
                  .toList(),
              onChanged: (v) {
                if (v != null) cubit.setImmunization(v);
              },
            ),
            const SizedBox(height: 14),
            const _FieldLabel('Select Region / District'),
            const SizedBox(height: 6),
            DropdownButtonFormField<String>(
              key: ValueKey('dist-${state.district ?? ''}'),
              initialValue: (state.district == null || state.district!.isEmpty)
                  ? 'Colombo'
                  : state.district,
              isExpanded: true,
              decoration: const InputDecoration(
                contentPadding:
                    EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              ),
              items: AppConstants.mohDistricts
                  .map(
                    (d) => DropdownMenuItem(
                      value: d,
                      child: Text('$d District'),
                    ),
                  )
                  .toList(),
              onChanged: (v) => cubit.setDistrict(v),
            ),
            const SizedBox(height: 14),
            const _FieldLabel('Registered Center Type'),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: FacilityType.values.map((t) {
                  final selected = state.facilityType == t;
                  return Expanded(
                    child: GestureDetector(
                      onTap: () => cubit.setType(t),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 160),
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        decoration: BoxDecoration(
                          color: selected ? Colors.white : Colors.transparent,
                          borderRadius: BorderRadius.circular(10),
                          boxShadow: selected
                              ? [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.06),
                                    blurRadius: 6,
                                    offset: const Offset(0, 1),
                                  ),
                                ]
                              : null,
                        ),
                        alignment: Alignment.center,
                        child: Text(
                          _typeLabel(t),
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: selected
                                ? AppColors.trustBlueDark
                                : AppColors.slateMuted,
                          ),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
            const SizedBox(height: 14),
            const _FieldLabel('Search Registered Vaccination Centers'),
            const SizedBox(height: 6),
            TextField(
              decoration: InputDecoration(
                hintText: 'Type name (e.g., MOH Clinic, Colombo General...)',
                hintStyle: TextStyle(color: Colors.grey.shade500, fontSize: 13),
                prefixIcon: const Icon(Icons.search, size: 20),
                contentPadding:
                    const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              ),
              onChanged: cubit.setQuery,
            ),
            const SizedBox(height: 16),
            Text(
              'Registered Centers matching search (${state.clinics.length})',
              style: const TextStyle(
                fontWeight: FontWeight.w700,
                fontSize: 13,
                color: Color(0xFF334155),
              ),
            ),
            const SizedBox(height: 8),
            if (state.clinics.isEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 16),
                child: Text(
                  'No centers match this district / type / search.',
                  style: TextStyle(color: Colors.grey.shade600, fontSize: 13),
                ),
              )
            else
              ...state.clinics.map((c) {
                final selected = clinic?.id == c.id;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Material(
                    color: selected
                        ? const Color(0xFFEFF6FF)
                        : Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    child: InkWell(
                      borderRadius: BorderRadius.circular(14),
                      onTap: () => cubit.selectClinic(c),
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                            color: selected
                                ? AppColors.trustBlue
                                : const Color(0xFFE2E8F0),
                            width: selected ? 1.5 : 1,
                          ),
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    c.name,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w700,
                                      fontSize: 14,
                                      color: Color(0xFF0F172A),
                                    ),
                                  ),
                                  if (c.hours.isNotEmpty) ...[
                                    const SizedBox(height: 4),
                                    Text(
                                      'Hrs: ${c.hours}',
                                      style: TextStyle(
                                        color: Colors.grey.shade600,
                                        fontSize: 12,
                                      ),
                                    ),
                                  ],
                                  if (c.type == FacilityType.privateHospital &&
                                      c.priceLkr != null) ...[
                                    const SizedBox(height: 6),
                                    Text(
                                      'Price: LKR ${NumberFormat('#,###').format(c.priceLkr)}',
                                      style: const TextStyle(
                                        color: Color(0xFFB45309),
                                        fontWeight: FontWeight.w800,
                                        fontSize: 13,
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: _typeTagColor(c.type)
                                    .withValues(alpha: 0.12),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                _typeTag(c.type),
                                style: TextStyle(
                                  color: _typeTagColor(c.type),
                                  fontWeight: FontWeight.w800,
                                  fontSize: 11,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                );
              }),
            if (clinic != null) ...[
              const SizedBox(height: 12),
              Row(
                children: [
                  const Icon(Icons.calendar_month,
                      size: 18, color: AppColors.trustBlue),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      'Available Dates in ${clinic.name}',
                      style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 13,
                        color: Color(0xFF334155),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: state.availableDates.map((d) {
                  final selected = state.selectedDate != null &&
                      state.selectedDate!.year == d.year &&
                      state.selectedDate!.month == d.month &&
                      state.selectedDate!.day == d.day;
                  return ChoiceChip(
                    label: Text(DateFormat('MMMM d, yyyy').format(d)),
                    selected: selected,
                    onSelected: (_) => cubit.selectDate(d),
                    selectedColor: AppColors.trustBlue,
                    labelStyle: TextStyle(
                      color: selected ? Colors.white : AppColors.trustBlueDark,
                      fontWeight: FontWeight.w700,
                      fontSize: 12,
                    ),
                    backgroundColor: Colors.white,
                    side: BorderSide(
                      color: selected
                          ? AppColors.trustBlue
                          : const Color(0xFFCBD5E1),
                    ),
                    showCheckmark: false,
                  );
                }).toList(),
              ),
              const SizedBox(height: 16),
              const Row(
                children: [
                  Icon(Icons.schedule, size: 18, color: AppColors.trustBlue),
                  SizedBox(width: 6),
                  Text(
                    'Available Slots',
                    style: TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 13,
                      color: Color(0xFF334155),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: state.slotsForSelectedDate.map((slot) {
                  final selected = state.selectedSlot == slot;
                  return ChoiceChip(
                    label: Text(DateFormat('hh:mm a').format(slot)),
                    selected: selected,
                    onSelected: (_) => cubit.selectSlot(slot),
                    selectedColor: AppColors.trustBlue,
                    labelStyle: TextStyle(
                      color: selected ? Colors.white : AppColors.trustBlueDark,
                      fontWeight: FontWeight.w700,
                      fontSize: 12,
                    ),
                    backgroundColor: Colors.white,
                    side: BorderSide(
                      color: selected
                          ? AppColors.trustBlue
                          : const Color(0xFFCBD5E1),
                    ),
                    showCheckmark: false,
                  );
                }).toList(),
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFF7ED),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFFDBA74)),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 28,
                      height: 28,
                      alignment: Alignment.center,
                      decoration: const BoxDecoration(
                        color: Color(0xFFFB923C),
                        shape: BoxShape.circle,
                      ),
                      child: const Text(
                        'i',
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text.rich(
                        TextSpan(
                          style: TextStyle(
                            color: Colors.grey.shade800,
                            fontSize: 12.5,
                            height: 1.35,
                          ),
                          children: [
                            if (isPrivate && price != null) ...[
                              const TextSpan(
                                text:
                                    'Private hospital immunization. Estimated charge at center: ',
                              ),
                              TextSpan(
                                text:
                                    'LKR ${NumberFormat('#,###').format(price)}.',
                                style: const TextStyle(
                                  color: Color(0xFFC2410C),
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            ] else ...[
                              const TextSpan(
                                text:
                                    'Dengue and pediatric protocol programs are fully subsidized by MOH. Estimated service charge at center: ',
                              ),
                              const TextSpan(
                                text: 'LKR 850 max.',
                                style: TextStyle(
                                  color: Color(0xFFC2410C),
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              if (state.bookingStage != null) ...[
                const SizedBox(height: 12),
                Text(
                  state.bookingStage!,
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    color: AppColors.trustBlue,
                  ),
                ),
              ],
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.of(context).maybePop(),
                      style: OutlinedButton.styleFrom(
                        minimumSize: const Size(0, 48),
                        backgroundColor: const Color(0xFFF1F5F9),
                        side: BorderSide.none,
                        foregroundColor: const Color(0xFF334155),
                      ),
                      child: const Text('Cancel'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    flex: 2,
                    child: FilledButton(
                      onPressed: state.selectedSlot == null ||
                              state.bookingStage != null
                          ? null
                          : () {
                              final user =
                                  context.read<AuthCubit>().state.user!;
                              cubit.book(
                                patientId: user.id,
                                ceylonHealthId:
                                    user.ceylonHealthId ?? 'CH-UNKNOWN',
                              );
                            },
                      style: FilledButton.styleFrom(
                        minimumSize: const Size(0, 48),
                        backgroundColor: AppColors.trustBlueDark,
                      ),
                      child: Text(
                        isPrivate
                            ? 'Confirm Private Booking'
                            : 'Confirm Central MOH Booking',
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 13,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ],
        );
      },
    );
  }
}

class _FieldLabel extends StatelessWidget {
  const _FieldLabel(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: const TextStyle(
        fontWeight: FontWeight.w700,
        fontSize: 12,
        color: Color(0xFF475569),
      ),
    );
  }
}
