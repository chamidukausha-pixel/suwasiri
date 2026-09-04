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
import 'doctor_directory_intent.dart';
import 'practice_list_section.dart';

class AppointmentsScreen extends StatefulWidget {
  const AppointmentsScreen({super.key, this.isActive = false});

  final bool isActive;

  @override
  State<AppointmentsScreen> createState() => _AppointmentsScreenState();
}

class _AppointmentsScreenState extends State<AppointmentsScreen> {
  final _searchCtrl = TextEditingController();
  final _nameCtrl = TextEditingController();
  final _clinicCtrl = TextEditingController();
  List<Doctor> _doctors = [];
  bool _loading = true;
  String _category = 'general';
  String? _pendingVisitReason;
  String? _district;

  @override
  void initState() {
    super.initState();
    _applyPendingIntent();
    _refresh();
  }

  @override
  void didUpdateWidget(covariant AppointmentsScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isActive && !oldWidget.isActive) {
      _applyPendingIntent();
    }
  }

  void _applyPendingIntent() {
    final pending = DoctorDirectoryIntent.consume();
    if (pending.visitReason == null && pending.categoryId == null) return;
    setState(() {
      if (pending.categoryId != null && pending.categoryId!.isNotEmpty) {
        _category = pending.categoryId!;
      }
      if (pending.visitReason != null && pending.visitReason!.isNotEmpty) {
        _pendingVisitReason = pending.visitReason;
      }
    });
  }

  Future<void> _refresh() async {
    final health = context.read<HealthRepository>();
    setState(() => _loading = true);
    final docs = await health.getDoctors();
    if (!mounted) return;
    setState(() {
      _doctors = docs;
      _loading = false;
    });
  }

  List<Doctor> get _doctorsForView {
    Iterable<Doctor> list = _doctors;
    if (_category != 'all') {
      list = list.where(
        (d) =>
            !d.isClinicOnly &&
            DoctorCatalog.doctorMatchesBrowseCategory(d, _category),
      );
    }

    final combined = _searchCtrl.text.trim().toLowerCase();
    final nameQ = _nameCtrl.text.trim().toLowerCase();
    final clinicQ = _clinicCtrl.text.trim().toLowerCase();
    final district = _district;

    list = list.where((d) {
      if (nameQ.isNotEmpty && !d.name.toLowerCase().contains(nameQ)) {
        return false;
      }
      if (clinicQ.isNotEmpty &&
          !d.hospital.toLowerCase().contains(clinicQ) &&
          !d.address.toLowerCase().contains(clinicQ)) {
        return false;
      }
      if (district != null &&
          district.isNotEmpty &&
          d.region.toLowerCase() != district.toLowerCase()) {
        return false;
      }
      if (combined.isNotEmpty) {
        final hay =
            '${d.name} ${d.hospital} ${d.region} ${d.address} ${d.specialty}'
                .toLowerCase();
        if (!hay.contains(combined)) return false;
      }
      return true;
    });

    return list.toList()..sort((a, b) {
      if (a.isClinicOnly != b.isClinicOnly) {
        return a.isClinicOnly ? 1 : -1;
      }
      return b.rating.compareTo(a.rating);
    });
  }

  void _showAllCategories() {
    setState(() => _category = 'all');
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    _nameCtrl.dispose();
    _clinicCtrl.dispose();
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
          Row(
            children: [
              Expanded(
                child: Text(
                  l.t('categories'),
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                        color: AppColors.trustBlueDark,
                      ),
                ),
              ),
              TextButton(
                onPressed: _showAllCategories,
                child: Text(l.t('seeAll')),
              ),
            ],
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 132,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: DoctorCatalog.browseCategories.length,
              separatorBuilder: (_, _) => const SizedBox(width: 12),
              itemBuilder: (context, i) {
                final cat = DoctorCatalog.browseCategories[i];
                final selected = _category == cat.id;
                return _CategoryTile(
                  label: l.t(cat.labelKey),
                  selectedLabel: cat.selectedLabelKey == null
                      ? null
                      : l.t(cat.selectedLabelKey!),
                  imageAsset: cat.imageAsset,
                  icon: cat.icon,
                  color: cat.color,
                  selected: selected,
                  onTap: () => setState(() => _category = cat.id),
                );
              },
            ),
          ),
          const SizedBox(height: 16),
          Text(
            l.t('dividedSearchOptions'),
            style: const TextStyle(
              color: AppColors.slateMuted,
              fontWeight: FontWeight.w800,
              fontSize: 11,
              letterSpacing: 0.7,
            ),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _nameCtrl,
            onChanged: (_) => setState(() {}),
            decoration: InputDecoration(
              labelText: l.t('searchByClinician'),
              hintText: l.t('clinicianHint'),
              prefixIcon: const Icon(Icons.person_search_rounded),
              filled: true,
              fillColor: AppColors.surface,
            ),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: _clinicCtrl,
            onChanged: (_) => setState(() {}),
            decoration: InputDecoration(
              labelText: l.t('searchByClinicName'),
              hintText: l.t('clinicNameHint'),
              prefixIcon: const Icon(Icons.local_hospital_outlined),
              filled: true,
              fillColor: AppColors.surface,
            ),
          ),
          const SizedBox(height: 10),
          DropdownButtonFormField<String?>(
            key: ValueKey(_district ?? 'all'),
            initialValue: _district,
            isExpanded: true,
            decoration: InputDecoration(
              labelText: l.t('filterByRegion'),
              prefixIcon: const Icon(Icons.map_outlined),
              filled: true,
              fillColor: AppColors.surface,
            ),
            items: [
              DropdownMenuItem<String?>(
                value: null,
                child: Text(l.t('allDistricts')),
              ),
              ...AppConstants.mohDistricts.map(
                (d) => DropdownMenuItem<String?>(
                  value: d,
                  child: Text(d),
                ),
              ),
            ],
            onChanged: (v) => setState(() => _district = v),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: _searchCtrl,
            onChanged: (_) => setState(() {}),
            decoration: InputDecoration(
              hintText: l.t('searchDoctorClinicRegion'),
              prefixIcon: const Icon(Icons.search_rounded),
              filled: true,
              fillColor: AppColors.surface,
            ),
          ),
          const SizedBox(height: 20),
          if (_loading)
            const Padding(
              padding: EdgeInsets.all(24),
              child: Center(child: CircularProgressIndicator()),
            )
          else if (doctors.isEmpty)
            EmptyHint(l.t('noDoctorsFound'))
          else
            PracticeListSection(
              doctors: doctors,
              categoryId: _category,
              initialVisitReason: _pendingVisitReason,
            ),
        ],
      ),
    );
  }
}

class _CategoryTile extends StatelessWidget {
  const _CategoryTile({
    required this.label,
    required this.imageAsset,
    required this.icon,
    required this.color,
    required this.selected,
    required this.onTap,
    this.selectedLabel,
  });

  final String label;
  final String? selectedLabel;
  final String imageAsset;
  final IconData icon;
  final Color color;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final displayLabel =
        selected && selectedLabel != null ? selectedLabel! : label;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(22),
        child: Ink(
          width: 102,
          height: 128,
          decoration: BoxDecoration(
            color: Color.alphaBlend(
              color.withValues(alpha: selected ? 0.14 : 0.08),
              const Color(0xFFF4F5F9),
            ),
            borderRadius: BorderRadius.circular(22),
            border: Border.all(
              color: selected
                  ? color.withValues(alpha: 0.65)
                  : Colors.white.withValues(alpha: 0.85),
              width: selected ? 2 : 1,
            ),
            boxShadow: [
              BoxShadow(
                color: selected
                    ? color.withValues(alpha: 0.18)
                    : Colors.black.withValues(alpha: 0.05),
                blurRadius: selected ? 16 : 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(22),
            child: Stack(
              fit: StackFit.expand,
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(8, 10, 8, 36),
                  child: Image.asset(
                    imageAsset,
                    fit: BoxFit.contain,
                    errorBuilder: (_, _, _) => Center(
                      child: Icon(
                        icon,
                        color: color,
                        size: 42,
                      ),
                    ),
                  ),
                ),
                Align(
                  alignment: Alignment.bottomCenter,
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.fromLTRB(6, 20, 6, 8),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.bottomCenter,
                        end: Alignment.topCenter,
                        colors: [
                          Colors.white.withValues(alpha: 0.96),
                          Colors.white.withValues(alpha: 0.88),
                          Colors.white.withValues(alpha: 0),
                        ],
                        stops: const [0, 0.5, 1],
                      ),
                    ),
                    child: Text(
                      displayLabel,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: AppColors.trustBlueDark,
                        fontWeight:
                            selected ? FontWeight.w800 : FontWeight.w700,
                        fontSize: 11,
                        height: 1.1,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
