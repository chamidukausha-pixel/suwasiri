import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../core/constants/app_constants.dart';
import '../../core/theme/app_colors.dart';
import '../../data/catalogs/doctor_catalog.dart';
import '../../data/models/appointment.dart';
import '../../data/repositories/health_repository.dart';
import '../../localization/app_localizations.dart';
import '../widgets/common_widgets.dart';
import '../widgets/liquid_button.dart';
import '../widgets/suwasiri_brand_header.dart';
import 'booking_checkout_flow.dart';
import 'doctor_directory_intent.dart';

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
  final Set<String> _favorites = {};
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

  Future<void> _book(Doctor doctor) async {
    if (doctor.isClinicOnly) return;
    await showBookingCheckoutFlow(
      context,
      doctor: doctor,
      initialVisitReason: _pendingVisitReason,
    );
    if (!mounted) return;
    setState(() => _pendingVisitReason = null);
    await _refresh();
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
                  l.t('findYourSpecialist'),
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
            height: 100,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: DoctorCatalog.browseCategories.length,
              separatorBuilder: (_, _) => const SizedBox(width: 10),
              itemBuilder: (context, i) {
                final cat = DoctorCatalog.browseCategories[i];
                final selected = _category == cat.id;
                return _CategoryTile(
                  label: l.t(cat.labelKey),
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
          Row(
            children: [
              Expanded(
                child: Text(
                  l.t('topDoctors'),
                  style: const TextStyle(
                    color: AppColors.trustBlueDark,
                    fontWeight: FontWeight.w800,
                    fontSize: 18,
                  ),
                ),
              ),
              TextButton(
                onPressed: _showAllCategories,
                child: Text(l.t('viewAll')),
              ),
            ],
          ),
          const SizedBox(height: 8),
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
                child: _TopDoctorCard(
                  doctor: d,
                  favorite: _favorites.contains(d.id),
                  onFavorite: () => setState(() {
                    if (_favorites.contains(d.id)) {
                      _favorites.remove(d.id);
                    } else {
                      _favorites.add(d.id);
                    }
                  }),
                  onBook: () => _book(d),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _CategoryTile extends StatelessWidget {
  const _CategoryTile({
    required this.label,
    required this.icon,
    required this.color,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final Color color;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final bg = selected ? color : AppColors.surface;
    final fg = selected ? Colors.white : color;

    return MinTap(
      onTap: onTap,
      child: Container(
        width: 86,
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 10),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: selected ? color : AppColors.border,
          ),
          boxShadow: selected
              ? [
                  BoxShadow(
                    color: color.withValues(alpha: 0.25),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ]
              : null,
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: fg, size: 24),
            const SizedBox(height: 8),
            Text(
              label,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
              style: TextStyle(
                color: selected ? Colors.white : AppColors.trustBlueDark,
                fontWeight: FontWeight.w700,
                fontSize: 10,
                height: 1.15,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TopDoctorCard extends StatelessWidget {
  const _TopDoctorCard({
    required this.doctor,
    required this.favorite,
    required this.onFavorite,
    required this.onBook,
  });

  final Doctor doctor;
  final bool favorite;
  final VoidCallback onFavorite;
  final VoidCallback onBook;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final reviews = DoctorCatalog.reviewCountFor(doctor);
    final ratingLabel = l
        .t('reviewsCount')
        .replaceAll('{rating}', doctor.rating.toStringAsFixed(1))
        .replaceAll('{count}', '$reviews');

    return Container(
      padding: const EdgeInsets.all(14),
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
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Stack(
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _DoctorPhoto(doctor: doctor),
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
                        const SizedBox(height: 2),
                        Text(
                          doctor.specialty,
                          style: const TextStyle(
                            color: AppColors.trustBlue,
                            fontWeight: FontWeight.w700,
                            fontSize: 13,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          doctor.hospital,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: AppColors.slateMuted,
                            fontSize: 12,
                          ),
                        ),
                        if (doctor.region.isNotEmpty) ...[
                          const SizedBox(height: 2),
                          Text(
                            doctor.region,
                            style: const TextStyle(
                              color: AppColors.slateMuted,
                              fontSize: 11,
                            ),
                          ),
                        ],
                        if (!doctor.isClinicOnly) ...[
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              const Icon(
                                Icons.star_rounded,
                                color: Color(0xFFF59E0B),
                                size: 16,
                              ),
                              const SizedBox(width: 4),
                              Text(
                                ratingLabel,
                                style: const TextStyle(
                                  color: AppColors.trustBlueDark,
                                  fontWeight: FontWeight.w600,
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Row(
                            children: [
                              Container(
                                width: 8,
                                height: 8,
                                decoration: const BoxDecoration(
                                  color: AppColors.onlineGreen,
                                  shape: BoxShape.circle,
                                ),
                              ),
                              const SizedBox(width: 6),
                              Text(
                                l.t('availableToday'),
                                style: const TextStyle(
                                  color: AppColors.emerald,
                                  fontWeight: FontWeight.w700,
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                        ] else ...[
                          const SizedBox(height: 8),
                          Text(
                            doctor.bio,
                            style: const TextStyle(
                              color: AppColors.slateMuted,
                              fontSize: 12,
                              height: 1.35,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(width: 28),
                ],
              ),
              Positioned(
                top: 0,
                right: 0,
                child: IconButton(
                  visualDensity: VisualDensity.compact,
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                  onPressed: onFavorite,
                  icon: Icon(
                    favorite ? Icons.favorite : Icons.favorite_border,
                    color: favorite
                        ? const Color(0xFFEF4444)
                        : AppColors.slateMuted,
                    size: 20,
                  ),
                ),
              ),
            ],
          ),
          if (!doctor.isClinicOnly) ...[
            const SizedBox(height: 12),
            Row(
              children: [
                Text(
                  'Rs. ${doctor.feeLkr}',
                  style: const TextStyle(
                    color: AppColors.trustBlueDark,
                    fontWeight: FontWeight.w800,
                    fontSize: 15,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: LiquidButton(
                    onPressed: onBook,
                    label: l.t('bookSession'),
                    height: 46,
                    icon: Icons.event_available_rounded,
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

class _DoctorPhoto extends StatelessWidget {
  const _DoctorPhoto({required this.doctor});

  final Doctor doctor;

  @override
  Widget build(BuildContext context) {
    final initial = doctor.name.replaceAll(RegExp(r'^Dr\.?\s*'), '').trim();
    final letter = initial.isNotEmpty ? initial[0].toUpperCase() : 'D';

    return ClipRRect(
      borderRadius: BorderRadius.circular(14),
      child: Image.network(
        doctor.displayPhotoUrl,
        width: 72,
        height: 72,
        fit: BoxFit.cover,
        loadingBuilder: (_, child, progress) {
          if (progress == null) return child;
          return _photoFallback(letter);
        },
        errorBuilder: (_, _, _) => _photoFallback(letter),
      ),
    );
  }

  Widget _photoFallback(String letter) {
    return Container(
      width: 72,
      height: 72,
      color: AppColors.trustBlueSoft,
      alignment: Alignment.center,
      child: Text(
        letter,
        style: const TextStyle(
          color: AppColors.trustBlue,
          fontWeight: FontWeight.w800,
          fontSize: 24,
        ),
      ),
    );
  }
}
