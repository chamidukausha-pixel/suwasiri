import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';

import '../../core/constants/app_constants.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/map_launcher.dart';
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
  List<Doctor> _doctors = [];
  bool _loading = true;
  String _region = 'All';
  String _category = 'All';
  CatalogFacility? _selectedFacility;

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
    final docs = await health.getDoctors(query: _query.text);
    if (!mounted) return;
    setState(() {
      _doctors = docs;
      _loading = false;
    });
  }

  List<CatalogFacility> get _facilities {
    var list = DoctorCatalog.facilitiesInDistrict(_region);
    final q = _query.text.trim().toLowerCase();
    if (q.isNotEmpty) {
      list = list
          .where(
            (f) =>
                f.name.toLowerCase().contains(q) ||
                f.address.toLowerCase().contains(q) ||
                f.region.toLowerCase().contains(q),
          )
          .toList();
    }
    return list;
  }

  List<Doctor> get _doctorsForView {
    Iterable<Doctor> list = _doctors;
    if (_selectedFacility != null) {
      list = list.where((d) => d.hospital == _selectedFacility!.name);
    } else if (_region != 'All') {
      list = list.where((d) => d.region == _region);
    }
    if (_category != 'All') {
      list = list.where((d) => d.specialty == _category);
    }
    final q = _query.text.trim().toLowerCase();
    if (q.isNotEmpty && _selectedFacility == null) {
      list = list.where(
        (d) =>
            d.name.toLowerCase().contains(q) ||
            d.specialty.toLowerCase().contains(q) ||
            d.hospital.toLowerCase().contains(q),
      );
    }
    return list.toList();
  }

  Future<void> _book(Doctor doctor) async {
    await showBookingCheckoutFlow(context, doctor: doctor);
    if (!mounted) return;
    await _refresh();
  }

  void _openFacility(CatalogFacility facility) {
    setState(() => _selectedFacility = facility);
  }

  @override
  void dispose() {
    _query.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final facilities = _facilities;
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
            region: _region,
            category: _category,
            regions: _regions,
            categories: _categories,
            onQueryChanged: (_) {
              setState(() {});
              _refresh();
            },
            onRegionChanged: (v) => setState(() {
              _region = v;
              _selectedFacility = null;
            }),
            onCategoryChanged: (v) => setState(() => _category = v),
          ),
          const SizedBox(height: 18),
          if (_selectedFacility != null) ...[
            Align(
              alignment: Alignment.centerLeft,
              child: TextButton.icon(
                onPressed: () => setState(() => _selectedFacility = null),
                icon: const Icon(Icons.arrow_back, size: 18),
                label: Text(l.t('filterByRegion')),
              ),
            ),
            _FacilityDetailCard(
              facility: _selectedFacility!,
              onOpenMaps: () => MapLauncher.showPlaceMapChoice(
                context,
                title: _selectedFacility!.name,
                address: _selectedFacility!.placeLabel,
                latitude: _selectedFacility!.latitude,
                longitude: _selectedFacility!.longitude,
              ),
            ),
            const SizedBox(height: 16),
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
                  padding: const EdgeInsets.only(bottom: 12),
                  child: _DoctorResultCard(
                    doctor: d,
                    onBook: () => _book(d),
                  ),
                ),
              ),
          ] else ...[
            Text(
              'Registered clinics & hospitals (${facilities.length})',
              style: const TextStyle(
                color: AppColors.slateMuted,
                fontWeight: FontWeight.w700,
                fontSize: 12,
                letterSpacing: 0.6,
              ),
            ),
            const SizedBox(height: 10),
            if (_loading)
              const Padding(
                padding: EdgeInsets.all(24),
                child: Center(child: CircularProgressIndicator()),
              )
            else if (facilities.isEmpty)
              const EmptyHint('No clinics or hospitals in this district.')
            else
              ...facilities.map(
                (f) => Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: _FacilityListTile(
                    facility: f,
                    doctorCount:
                        DoctorCatalog.doctorsAtFacility(f.name).length,
                    onTap: () => _openFacility(f),
                    onMap: () => MapLauncher.showPlaceMapChoice(
                      context,
                      title: f.name,
                      address: f.placeLabel,
                      latitude: f.latitude,
                      longitude: f.longitude,
                    ),
                  ),
                ),
              ),
          ],
        ],
      ),
    );
  }
}

class _FacilityListTile extends StatelessWidget {
  const _FacilityListTile({
    required this.facility,
    required this.doctorCount,
    required this.onTap,
    required this.onMap,
  });

  final CatalogFacility facility;
  final int doctorCount;
  final VoidCallback onTap;
  final VoidCallback onMap;

  @override
  Widget build(BuildContext context) {
    final isClinic = facility.type == FacilityKind.clinic;
    return SoftCard(
      onTap: onTap,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: isClinic
                  ? const Color(0xFFEEF2FF)
                  : const Color(0xFFECFDF5),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              isClinic ? Icons.medical_services_outlined : Icons.local_hospital,
              color: isClinic
                  ? const Color(0xFF4F46E5)
                  : const Color(0xFF059669),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  facility.name,
                  style: const TextStyle(
                    fontWeight: FontWeight.w800,
                    color: AppColors.trustBlueDark,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  facility.address,
                  style: const TextStyle(
                    color: AppColors.slateMuted,
                    fontSize: 12,
                    height: 1.3,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${facility.region} · ${isClinic ? 'Clinic' : 'Hospital'} · $doctorCount doctors',
                  style: const TextStyle(
                    color: AppColors.trustBlue,
                    fontWeight: FontWeight.w600,
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            tooltip: 'Maps',
            onPressed: onMap,
            icon: const Icon(Icons.map_outlined, color: AppColors.trustBlue),
          ),
        ],
      ),
    );
  }
}

class _FacilityDetailCard extends StatelessWidget {
  const _FacilityDetailCard({
    required this.facility,
    required this.onOpenMaps,
  });

  final CatalogFacility facility;
  final VoidCallback onOpenMaps;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    return SoftCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            facility.name,
            style: const TextStyle(
              fontWeight: FontWeight.w800,
              fontSize: 18,
              color: AppColors.trustBlueDark,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            facility.address,
            style: const TextStyle(
              color: AppColors.slateMuted,
              fontSize: 13,
              height: 1.35,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            '${facility.region} District · ${facility.hours}',
            style: const TextStyle(
              color: AppColors.slateMuted,
              fontSize: 12,
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: onOpenMaps,
              icon: const Icon(Icons.map_outlined),
              label: Text(l.t('openClinicInMaps')),
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
    required this.region,
    required this.category,
    required this.regions,
    required this.categories,
    required this.onQueryChanged,
    required this.onRegionChanged,
    required this.onCategoryChanged,
  });

  final TextEditingController queryController;
  final String region;
  final String category;
  final List<String> regions;
  final List<String> categories;
  final ValueChanged<String> onQueryChanged;
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

/// Mobile-safe doctor card — vertical stack avoids the mockup overlap bugs.
class _DoctorResultCard extends StatelessWidget {
  const _DoctorResultCard({
    required this.doctor,
    required this.onBook,
  });

  final Doctor doctor;
  final VoidCallback onBook;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final fee = NumberFormat.decimalPattern().format(doctor.feeLkr);
    final initial = doctor.name.split(' ').last.isNotEmpty
        ? doctor.name.split(' ').last[0]
        : 'D';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(
            color: AppColors.trustBlueDark.withValues(alpha: 0.05),
            blurRadius: 14,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Stack(
                clipBehavior: Clip.none,
                children: [
                  CircleAvatar(
                    radius: 30,
                    backgroundColor: AppColors.trustBlueSoft,
                    child: Text(
                      initial,
                      style: const TextStyle(
                        color: AppColors.trustBlue,
                        fontWeight: FontWeight.w800,
                        fontSize: 22,
                      ),
                    ),
                  ),
                  Positioned(
                    right: -2,
                    bottom: -2,
                    child: Container(
                      width: 22,
                      height: 22,
                      decoration: BoxDecoration(
                        color: AppColors.trustBlueSoft,
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: Colors.white, width: 1.5),
                      ),
                      child: const Icon(
                        Icons.verified_user_rounded,
                        size: 14,
                        color: AppColors.trustBlue,
                      ),
                    ),
                  ),
                ],
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
                        fontSize: 17,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      '${doctor.specialty} Consultation',
                      style: const TextStyle(
                        color: AppColors.trustBlue,
                        fontWeight: FontWeight.w600,
                        fontSize: 13,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        const Icon(
                          Icons.workspace_premium_outlined,
                          size: 14,
                          color: AppColors.slateMuted,
                        ),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            l
                                .t('yearsExpertise')
                                .replaceAll('{years}', '${doctor.yearsExperience}'),
                            style: const TextStyle(
                              color: AppColors.slateMuted,
                              fontSize: 12,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            '"${doctor.bio}"',
            style: TextStyle(
              color: AppColors.slateMuted.withValues(alpha: 0.95),
              fontStyle: FontStyle.italic,
              fontSize: 13,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 12),
          InkWell(
            onTap: () => MapLauncher.showMapChoice(context, doctor: doctor),
            borderRadius: BorderRadius.circular(10),
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 2),
              child: Row(
                children: [
                  const Icon(Icons.location_on_outlined,
                      size: 15, color: AppColors.trustBlue),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      doctor.placeLabel,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: AppColors.trustBlue,
                        fontWeight: FontWeight.w600,
                        fontSize: 12,
                        decoration: TextDecoration.underline,
                        decorationColor: AppColors.trustBlueSoft,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  const Icon(Icons.access_time,
                      size: 15, color: AppColors.slateMuted),
                  const SizedBox(width: 4),
                  Flexible(
                    child: Text(
                      doctor.nextAvailable,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: AppColors.slateMuted,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 14),
          const Divider(height: 1, color: AppColors.border),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      l.t('consultationFees'),
                      style: const TextStyle(
                        color: AppColors.slateMuted,
                        fontWeight: FontWeight.w700,
                        fontSize: 10,
                        letterSpacing: 0.7,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'LKR $fee',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: AppColors.emerald,
                        fontWeight: FontWeight.w800,
                        fontSize: 20,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              FilledButton(
                onPressed: onBook,
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.trustBlue,
                  foregroundColor: Colors.white,
                  minimumSize: const Size(0, 40),
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  padding:
                      const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(24),
                  ),
                ),
                child: Text(
                  l.t('bookSession'),
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
