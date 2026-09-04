import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../core/theme/app_colors.dart';
import '../../data/catalogs/doctor_catalog.dart';
import '../../data/models/appointment.dart';
import '../../data/repositories/health_repository.dart';
import '../../localization/app_localizations.dart';
import '../widgets/common_widgets.dart';
import 'booking_checkout_flow.dart';
import 'clinic_hub_screen.dart';
import 'clinic_practice.dart';
import 'doctor_booking_shared.dart';
import 'patient_type_sheet.dart';
import 'practice_availability.dart';

class PracticeListSection extends StatefulWidget {
  const PracticeListSection({
    super.key,
    required this.doctors,
    required this.categoryId,
    this.initialVisitReason,
  });

  final List<Doctor> doctors;
  final String categoryId;
  final String? initialVisitReason;

  @override
  State<PracticeListSection> createState() => _PracticeListSectionState();
}

class _PracticeListSectionState extends State<PracticeListSection> {
  final _previewByKey = <String, PracticeSlotPreview?>{};
  bool _loading = true;

  List<ClinicPractice> get _practices => groupDoctorsIntoPractices(widget.doctors);

  @override
  void initState() {
    super.initState();
    _loadPreviews();
  }

  @override
  void didUpdateWidget(covariant PracticeListSection oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.doctors != widget.doctors) {
      _loadPreviews();
    }
  }

  Future<void> _loadPreviews() async {
    setState(() => _loading = true);
    final health = context.read<HealthRepository>();
    final map = <String, PracticeSlotPreview?>{};
    for (final p in _practices) {
      map[p.key] = await nextAvailabilityForPractice(health, p);
    }
    if (!mounted) return;
    setState(() {
      _previewByKey
        ..clear()
        ..addAll(map);
      _loading = false;
    });
  }

  void _openPractice(ClinicPractice practice) {
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => ClinicHubScreen(
          practice: practice,
          initialVisitReason: widget.initialVisitReason,
        ),
      ),
    );
  }

  Future<void> _bookSlot(PracticeSlotPreview preview) async {
    final visitType = await showPatientTypeSheet(context, doctor: preview.doctor);
    if (visitType == null || !mounted) return;
    await showBookingCheckoutFlow(
      context,
      doctor: preview.doctor,
      initialVisitReason: widget.initialVisitReason,
      initialSlot: preview.slots.first,
    );
    if (mounted) await _loadPreviews();
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final practices = _practices;
    DoctorBrowseCategory? cat;
    for (final c in DoctorCatalog.browseCategories) {
      if (c.id == widget.categoryId) {
        cat = c;
        break;
      }
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (widget.categoryId != 'all' && cat != null) ...[
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _FilterChip(
                  label: cat.selectedLabelKey != null
                      ? l.t(cat.selectedLabelKey!)
                      : l.t(cat.labelKey),
                  onClear: () {},
                  showClear: false,
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
        ],
        Text(
          l.t('practices'),
          style: const TextStyle(
            color: AppColors.trustBlueDark,
            fontWeight: FontWeight.w800,
            fontSize: 18,
          ),
        ),
        const SizedBox(height: 8),
        if (practices.isEmpty)
          EmptyHint(l.t('noDoctorsFound'))
        else if (_loading)
          const Padding(
            padding: EdgeInsets.all(24),
            child: Center(child: CircularProgressIndicator()),
          )
        else
          ...practices.map(
            (p) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: _PracticeCard(
                practice: p,
                preview: _previewByKey[p.key],
                onOpen: () => _openPractice(p),
                onSlot: (preview) => _bookSlot(preview),
              ),
            ),
          ),
      ],
    );
  }
}

class _FilterChip extends StatelessWidget {
  const _FilterChip({
    required this.label,
    required this.onClear,
    this.showClear = true,
  });

  final String label;
  final VoidCallback onClear;
  final bool showClear;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: AppColors.trustBlueSoft,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppColors.trustBlue.withValues(alpha: 0.35)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            label,
            style: const TextStyle(
              color: AppColors.trustBlueDark,
              fontWeight: FontWeight.w700,
              fontSize: 13,
            ),
          ),
          if (showClear) ...[
            const SizedBox(width: 6),
            GestureDetector(
              onTap: onClear,
              child: const Icon(Icons.close_rounded, size: 16, color: AppColors.trustBlue),
            ),
          ],
        ],
      ),
    );
  }
}

class _PracticeCard extends StatelessWidget {
  const _PracticeCard({
    required this.practice,
    required this.preview,
    required this.onOpen,
    required this.onSlot,
  });

  final ClinicPractice practice;
  final PracticeSlotPreview? preview;
  final VoidCallback onOpen;
  final ValueChanged<PracticeSlotPreview> onSlot;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final now = DateTime.now();

    return Material(
      color: AppColors.surface,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onOpen,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.border),
          ),
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const ClinicLogoPlaceholder(size: 52),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                practice.name,
                                style: const TextStyle(
                                  color: AppColors.trustBlueDark,
                                  fontWeight: FontWeight.w800,
                                  fontSize: 16,
                                ),
                              ),
                            ),
                            const Icon(
                              Icons.chevron_right_rounded,
                              color: AppColors.slateMuted,
                            ),
                          ],
                        ),
                        if (practice.placeLabel.isNotEmpty) ...[
                          const SizedBox(height: 4),
                          Text(
                            practice.placeLabel,
                            style: const TextStyle(
                              color: AppColors.slateMuted,
                              fontSize: 12,
                              height: 1.35,
                            ),
                          ),
                        ],
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
                              l.t('clinicOpenHours'),
                              style: const TextStyle(
                                color: AppColors.slateMuted,
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              if (preview != null && preview!.slots.isNotEmpty) ...[
                const SizedBox(height: 14),
                const Divider(height: 1),
                const SizedBox(height: 12),
                Text(
                  dayLabelForSlot(preview!.date, now),
                  style: const TextStyle(
                    color: AppColors.trustBlueDark,
                    fontWeight: FontWeight.w800,
                    fontSize: 13,
                  ),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    ...preview!.slots.take(2).map(
                      (slot) => _TimeChip(
                        label: formatSlotChip(slot),
                        onTap: () => onSlot(
                          PracticeSlotPreview(
                            doctor: preview!.doctor,
                            date: preview!.date,
                            slots: [slot],
                          ),
                        ),
                      ),
                    ),
                    if (preview!.slots.length > 2)
                      _TimeChip(
                        label: l.t('moreTimes'),
                        onTap: onOpen,
                        muted: true,
                      ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _TimeChip extends StatelessWidget {
  const _TimeChip({
    required this.label,
    required this.onTap,
    this.muted = false,
  });

  final String label;
  final VoidCallback onTap;
  final bool muted;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: muted ? AppColors.trustBlueSoft : Colors.white,
      borderRadius: BorderRadius.circular(20),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: AppColors.trustBlue.withValues(alpha: muted ? 0.2 : 0.45),
            ),
          ),
          child: Text(
            muted ? '+ $label' : label,
            style: TextStyle(
              color: AppColors.trustBlueDark,
              fontWeight: FontWeight.w700,
              fontSize: 13,
            ),
          ),
        ),
      ),
    );
  }
}
