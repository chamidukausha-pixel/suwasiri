import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';

import '../../bloc/auth/auth_cubit.dart';
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
  List<Appointment> _mine = [];
  bool _loading = true;
  String _region = 'All';
  String _category = 'All';

  static const _regions = ['All', 'Colombo', 'Gampaha', 'Kandy'];
  static const _categories = DoctorCatalog.categories;

  @override
  void initState() {
    super.initState();
    _refresh();
  }

  Future<void> _refresh() async {
    final health = context.read<HealthRepository>();
    final user = context.read<AuthCubit>().state.user;
    setState(() => _loading = true);
    final docs = await health.getDoctors(query: _query.text);
    final appts =
        user == null ? <Appointment>[] : await health.getAppointments(user.id);
    if (!mounted) return;
    setState(() {
      _doctors = docs;
      _mine = appts;
      _loading = false;
    });
  }

  List<Doctor> get _filtered {
    return _doctors.where((d) {
      final regionOk = _region == 'All' || d.region == _region;
      final catOk = _category == 'All' || d.specialty == _category;
      return regionOk && catOk;
    }).toList();
  }

  Future<void> _book(Doctor doctor) async {
    await showBookingCheckoutFlow(context, doctor: doctor);
    if (!mounted) return;
    await _refresh();
  }

  @override
  void dispose() {
    _query.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final filtered = _filtered;

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
            onQueryChanged: (_) => _refresh(),
            onRegionChanged: (v) => setState(() => _region = v),
            onCategoryChanged: (v) => setState(() => _category = v),
          ),
          const SizedBox(height: 16),
          const _ClinicsMapCard(),
          if (_mine.isNotEmpty) ...[
            const SizedBox(height: 20),
            Text(
              l.t('upcoming'),
              style: const TextStyle(
                color: AppColors.slateMuted,
                fontWeight: FontWeight.w700,
                fontSize: 12,
                letterSpacing: 1.1,
              ),
            ),
            const SizedBox(height: 10),
            ..._mine.map(
              (a) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: SoftCard(
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              a.doctorName,
                              style: const TextStyle(
                                fontWeight: FontWeight.w700,
                                color: AppColors.trustBlueDark,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '${a.specialty} · ${DateFormat('EEE d MMM · HH:mm').format(a.timeSlot)}',
                              style: Theme.of(context).textTheme.bodyMedium,
                            ),
                          ],
                        ),
                      ),
                      StatusChip(
                        label: a.token ?? a.status.name,
                        color: AppColors.trustBlue,
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
          const SizedBox(height: 20),
          Text(
            l.t('resultsFound').replaceAll('{count}', '${filtered.length}'),
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
          else if (filtered.isEmpty)
            EmptyHint(l.t('noDoctorsFound'))
          else
            ...filtered.map(
              (d) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: _DoctorResultCard(
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

class _ClinicsMapCard extends StatelessWidget {
  const _ClinicsMapCard();

  static const _pins = [
    _MapPin('Durdans - Col 03', Alignment(-0.55, -0.35), Color(0xFF22C55E)),
    _MapPin('Nawaloka - Col 02', Alignment(0.15, -0.55), Color(0xFFF59E0B)),
    _MapPin('Asiri Central - Col 10', Alignment(0.45, 0.05), Color(0xFF60A5FA)),
    _MapPin('Lanka Hosp - Col 05', Alignment(-0.1, 0.45), Color(0xFFA78BFA)),
  ];

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF0B1F3A), Color(0xFF071526)],
        ),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      l.t('liveClinicsMap'),
                      style: const TextStyle(
                        color: AppColors.onlineGreen,
                        fontWeight: FontWeight.w800,
                        fontSize: 11,
                        letterSpacing: 0.9,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      l.t('accreditedMap'),
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w800,
                        fontSize: 16,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Text(
                  l.t('sriLankaHub'),
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.85),
                    fontWeight: FontWeight.w600,
                    fontSize: 11,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Container(
            height: 168,
            decoration: BoxDecoration(
              color: const Color(0xFF0A192F),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(14),
              child: Stack(
                children: [
                  Positioned.fill(
                    child: CustomPaint(painter: _MapLinesPainter()),
                  ),
                  ..._pins.map(
                    (pin) => Align(
                      alignment: pin.alignment,
                      child: _MapPinChip(label: pin.label, color: pin.color),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 14),
          Text(
            l.t('mappedAddressRef'),
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.45),
              fontWeight: FontWeight.w700,
              fontSize: 10,
              letterSpacing: 0.9,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            l.t('mappedAddresses'),
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.7),
              fontStyle: FontStyle.italic,
              fontSize: 12,
              height: 1.45,
            ),
          ),
        ],
      ),
    );
  }
}

class _MapPin {
  const _MapPin(this.label, this.alignment, this.color);
  final String label;
  final Alignment alignment;
  final Color color;
}

class _MapPinChip extends StatelessWidget {
  const _MapPinChip({required this.label, required this.color});

  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.all(6),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
      decoration: BoxDecoration(
        color: const Color(0xFF13233A),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle),
          ),
          const SizedBox(width: 6),
          Text(
            label,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 10,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

class _MapLinesPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFF1E3A5F)
      ..strokeWidth = 1.2
      ..style = PaintingStyle.stroke;

    final path = Path()
      ..moveTo(0, size.height * 0.35)
      ..quadraticBezierTo(
        size.width * 0.35,
        size.height * 0.1,
        size.width * 0.7,
        size.height * 0.4,
      )
      ..quadraticBezierTo(
        size.width * 0.9,
        size.height * 0.55,
        size.width,
        size.height * 0.3,
      );
    canvas.drawPath(path, paint);

    final path2 = Path()
      ..moveTo(0, size.height * 0.7)
      ..quadraticBezierTo(
        size.width * 0.4,
        size.height * 0.55,
        size.width * 0.65,
        size.height * 0.8,
      )
      ..quadraticBezierTo(
        size.width * 0.85,
        size.height * 0.95,
        size.width,
        size.height * 0.65,
      );
    canvas.drawPath(path2, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
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
