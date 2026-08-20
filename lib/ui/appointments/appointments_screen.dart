import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../core/constants/app_constants.dart';
import '../../core/theme/app_colors.dart';
import '../../data/catalogs/doctor_catalog.dart';
import '../../data/models/appointment.dart';
import '../../data/repositories/health_repository.dart';
import '../../localization/app_localizations.dart';
import '../widgets/common_widgets.dart';
import '../widgets/suwasiri_brand_header.dart';
import 'booking_checkout_flow.dart';

class AppointmentsScreen extends StatefulWidget {
  const AppointmentsScreen({super.key});

  @override
  State<AppointmentsScreen> createState() => _AppointmentsScreenState();
}

class _AppointmentsScreenState extends State<AppointmentsScreen> {
  final _query = TextEditingController();
  final _clinicQuery = TextEditingController();
  List<Doctor> _doctors = [];
  bool _loading = true;
  String _region = 'All';
  String _category = 'All';

  static final _regions = ['All', ...AppConstants.mohDistricts];
  static const _categories = DoctorCatalog.categories;

  @override
  void initState() {
    super.initState();
    _refresh();
  }

  Future<void> _refresh() async {
    final health = context.read<HealthRepository>();
    setState(() => _loading = true);
    // Load full directory; clinician + clinic filters are applied client-side.
    final docs = await health.getDoctors();
    if (!mounted) return;
    setState(() {
      _doctors = docs;
      _loading = false;
    });
  }

  List<Doctor> get _doctorsForView {
    Iterable<Doctor> list = _doctors;
    if (_region != 'All') {
      list = list.where((d) => d.region == _region);
    }
    if (_category != 'All') {
      list = list.where((d) => d.specialty == _category);
    }

    final clinicQ = _clinicQuery.text.trim().toLowerCase();
    if (clinicQ.isNotEmpty) {
      // Clinic search: show every clinician registered at matching clinics.
      list = list.where(
        (d) =>
            d.hospital.toLowerCase().contains(clinicQ) ||
            d.address.toLowerCase().contains(clinicQ),
      );
    }

    final q = _query.text.trim().toLowerCase();
    if (q.isNotEmpty) {
      // Doctor-name search: match clinician name (specialty still via category).
      list = list.where((d) => d.name.toLowerCase().contains(q));
    }
    return list.toList();
  }

  Future<void> _book(Doctor doctor) async {
    await showBookingCheckoutFlow(context, doctor: doctor);
    if (!mounted) return;
    await _refresh();
  }

  @override
  void dispose() {
    _query.dispose();
    _clinicQuery.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final doctors = _doctorsForView;

    return SafeArea(
      bottom: false,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 28),
        children: [
          const SuwasiriBrandHeader(),
          const SizedBox(height: 20),
          Text(
            l.t('directoryTitle'),
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  fontSize: 24,
                ),
          ),
          const SizedBox(height: 8),
          Text(
            l.t('directorySubtitle'),
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  height: 1.45,
                ),
          ),
          const SizedBox(height: 16),
          _SearchOptionsCard(
            queryController: _query,
            clinicQueryController: _clinicQuery,
            region: _region,
            category: _category,
            regions: _regions,
            categories: _categories,
            onQueryChanged: (_) => setState(() {}),
            onClinicQueryChanged: (_) => setState(() {}),
            onRegionChanged: (v) => setState(() => _region = v),
            onCategoryChanged: (v) => setState(() => _category = v),
          ),
          const SizedBox(height: 18),
          Text(
            l.t('resultsFound').replaceAll('{count}', '${doctors.length}'),
            style: const TextStyle(
              color: AppColors.slateMuted,
              fontWeight: FontWeight.w600,
              fontSize: 13,
            ),
          ),
          const SizedBox(height: 12),
          if (_loading)
            const Padding(
              padding: EdgeInsets.all(24),
              child: Center(child: CircularProgressIndicator()),
            )
          else if (doctors.isEmpty)
            EmptyHint(l.t('noDoctorsFound'))
          else
            ...doctors.map(
              (d) => Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: _DoctorNameHospitalCard(
                  doctor: d,
                  onBook: () => _book(d),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _SearchOptionsCard extends StatelessWidget {
  const _SearchOptionsCard({
    required this.queryController,
    required this.clinicQueryController,
    required this.region,
    required this.category,
    required this.regions,
    required this.categories,
    required this.onQueryChanged,
    required this.onClinicQueryChanged,
    required this.onRegionChanged,
    required this.onCategoryChanged,
  });

  final TextEditingController queryController;
  final TextEditingController clinicQueryController;
  final String region;
  final String category;
  final List<String> regions;
  final List<String> categories;
  final ValueChanged<String> onQueryChanged;
  final ValueChanged<String> onClinicQueryChanged;
  final ValueChanged<String> onRegionChanged;
  final ValueChanged<String> onCategoryChanged;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(
            color: AppColors.trustBlueDark.withValues(alpha: 0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: AppColors.trustBlueSoft,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              l.t('dividedSearchOptions'),
              style: const TextStyle(
                color: AppColors.trustBlue,
                fontWeight: FontWeight.w800,
                fontSize: 10,
                letterSpacing: 0.8,
              ),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            l.t('searchByClinician'),
            style: const TextStyle(
              color: AppColors.trustBlueDark,
              fontWeight: FontWeight.w700,
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: queryController,
            onChanged: onQueryChanged,
            decoration: InputDecoration(
              hintText: l.t('clinicianHint'),
              prefixIcon: const Icon(Icons.search_rounded),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            l.t('searchByClinicName'),
            style: const TextStyle(
              color: AppColors.trustBlueDark,
              fontWeight: FontWeight.w700,
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: clinicQueryController,
            onChanged: onClinicQueryChanged,
            decoration: InputDecoration(
              hintText: l.t('clinicNameHint'),
              prefixIcon: const Icon(Icons.local_hospital_outlined),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            l.t('filterByRegion'),
            style: const TextStyle(
              color: AppColors.trustBlueDark,
              fontWeight: FontWeight.w700,
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 8),
          DropdownButtonFormField<String>(
            // Controlled filter — keep `value` until FormField API settles.
            // ignore: deprecated_member_use
            value: region,
            decoration: const InputDecoration(),
            items: regions
                .map(
                  (r) => DropdownMenuItem(
                    value: r,
                    child: Text(
                      r == 'All' ? l.t('allRegions') : r,
                    ),
                  ),
                )
                .toList(),
            onChanged: (v) {
              if (v != null) onRegionChanged(v);
            },
          ),
          const SizedBox(height: 16),
          Text(
            l.t('browseSpecialties'),
            style: const TextStyle(
              color: AppColors.trustBlueDark,
              fontWeight: FontWeight.w700,
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 8),
          DropdownButtonFormField<String>(
            // ignore: deprecated_member_use
            value: category,
            isExpanded: true,
            decoration: const InputDecoration(),
            items: categories
                .map(
                  (c) => DropdownMenuItem(
                    value: c,
                    child: Text(
                      c == 'All' ? l.t('allCategories') : c,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                )
                .toList(),
            onChanged: (v) {
              if (v != null) onCategoryChanged(v);
            },
          ),
        ],
      ),
    );
  }
}

/// Doctor directory card with specialty and full details.
class _DoctorNameHospitalCard extends StatelessWidget {
  const _DoctorNameHospitalCard({
    required this.doctor,
    required this.onBook,
  });

  final Doctor doctor;
  final VoidCallback onBook;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final initial = doctor.name.split(' ').last.isNotEmpty
        ? doctor.name.split(' ').last[0]
        : 'D';
    final address = doctor.address.isNotEmpty
        ? doctor.address
        : doctor.placeLabel;
    final fee = doctor.feeLkr;

    return SoftCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              CircleAvatar(
                radius: 26,
                backgroundColor: AppColors.trustBlueSoft,
                child: Text(
                  initial,
                  style: const TextStyle(
                    color: AppColors.trustBlue,
                    fontWeight: FontWeight.w800,
                    fontSize: 18,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      doctor.name,
                      style: const TextStyle(
                        color: AppColors.trustBlueDark,
                        fontWeight: FontWeight.w800,
                        fontSize: 16,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 3,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.trustBlueSoft,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        doctor.specialty,
                        style: const TextStyle(
                          color: AppColors.trustBlue,
                          fontWeight: FontWeight.w800,
                          fontSize: 12,
                        ),
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      doctor.hospital,
                      style: const TextStyle(
                        color: AppColors.trustBlueDark,
                        fontWeight: FontWeight.w700,
                        fontSize: 13,
                      ),
                    ),
                    if (address.isNotEmpty) ...[
                      const SizedBox(height: 2),
                      Text(
                        address,
                        style: const TextStyle(
                          color: AppColors.slateMuted,
                          fontSize: 12,
                          height: 1.3,
                        ),
                      ),
                    ],
                    const SizedBox(height: 4),
                    Text(
                      '${doctor.region} · ${l.t('yearsExpertise').replaceAll('{years}', '${doctor.yearsExperience}')}',
                      style: const TextStyle(
                        color: AppColors.slateMuted,
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (doctor.bio.isNotEmpty) ...[
            const SizedBox(height: 10),
            Text(
              doctor.bio,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: AppColors.slateMuted,
                fontSize: 12,
                height: 1.35,
                fontStyle: FontStyle.italic,
              ),
            ),
          ],
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: Text(
                  'LKR $fee · ${doctor.nextAvailable}',
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: AppColors.emerald,
                    fontWeight: FontWeight.w700,
                    fontSize: 12,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              FilledButton(
                onPressed: onBook,
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.trustBlue,
                  foregroundColor: Colors.white,
                  minimumSize: const Size(0, 36),
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  padding:
                      const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(20),
                  ),
                ),
                child: Text(
                  l.t('bookSession'),
                  style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 12,
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
