import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';

import '../../bloc/schedule/schedule_cubit.dart';
import '../../core/theme/app_colors.dart';
import '../../data/catalogs/doctor_catalog.dart';
import '../../data/models/appointment.dart';
import '../../data/repositories/health_repository.dart';
import '../../localization/app_localizations.dart';

const _tagCatalog = <String, String>{
  'rateTagAttentive': 'Attentive',
  'rateTagKnowledgeable': 'Knowledgeable',
  'rateTagPunctual': 'Punctual',
  'rateTagExplained': 'Clearly explained',
  'rateTagKind': 'Kind',
};

bool _ratingSheetVisible = false;
final Set<String> _skippedThisSession = <String>{};

/// After a live video hang-up or a GP-marked completed consult.
Future<void> offerConsultationRating(
  BuildContext context,
  Appointment appointment, {
  bool requireCompletedStatus = false,
}) async {
  if (_ratingSheetVisible || !context.mounted) return;
  if (appointment.id.isEmpty || appointment.doctorName.isEmpty) return;
  if (_skippedThisSession.contains(appointment.id)) return;
  if (requireCompletedStatus &&
      appointment.status != AppointmentStatus.completed) {
    return;
  }
  final age = DateTime.now().difference(appointment.timeSlot);
  if (age > const Duration(days: 7)) return;

  final schedule = context.read<ScheduleCubit>();
  try {
    if (await schedule.hasRatedAppointment(appointment.id)) return;
  } catch (_) {
    return;
  }
  if (!context.mounted) return;

  var photoUrl = DoctorCatalog.doctorById(appointment.doctorId)?.photoUrl;
  if (photoUrl == null || photoUrl.isEmpty) {
    try {
      final doctors = await context.read<HealthRepository>().getDoctors();
      for (final d in doctors) {
        if (d.id == appointment.doctorId || d.name == appointment.doctorName) {
          if (d.photoUrl != null && d.photoUrl!.trim().isNotEmpty) {
            photoUrl = d.photoUrl;
            break;
          }
        }
      }
    } catch (_) {}
  }
  if (!context.mounted) return;

  _ratingSheetVisible = true;
  try {
    await showDoctorRatingSheet(
      context,
      appointment: appointment,
      doctorPhotoUrl: photoUrl,
      onSubmit: (stars, tags) async {
        await schedule.submitDoctorRating(
          appointment: appointment,
          stars: stars,
          tags: tags,
        );
      },
      onLater: () => _skippedThisSession.add(appointment.id),
    );
  } finally {
    _ratingSheetVisible = false;
  }
}

Future<void> showDoctorRatingSheet(
  BuildContext context, {
  required Appointment appointment,
  String? doctorPhotoUrl,
  required Future<void> Function(int stars, List<String> tags) onSubmit,
  VoidCallback? onLater,
}) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    barrierColor: const Color(0xCC0B3D32),
    builder: (ctx) {
      return _DoctorRatingSheet(
        appointment: appointment,
        doctorPhotoUrl: doctorPhotoUrl,
        onSubmit: onSubmit,
        onLater: onLater,
      );
    },
  );
}

class _DoctorRatingSheet extends StatefulWidget {
  const _DoctorRatingSheet({
    required this.appointment,
    required this.onSubmit,
    this.doctorPhotoUrl,
    this.onLater,
  });

  final Appointment appointment;
  final String? doctorPhotoUrl;
  final Future<void> Function(int stars, List<String> tags) onSubmit;
  final VoidCallback? onLater;

  @override
  State<_DoctorRatingSheet> createState() => _DoctorRatingSheetState();
}

class _DoctorRatingSheetState extends State<_DoctorRatingSheet> {
  int _stars = 0;
  final Set<String> _tags = {};
  bool _saving = false;

  (String emoji, String labelKey) get _mood {
    switch (_stars) {
      case 1:
        return ('😞', 'rateLabel1');
      case 2:
        return ('🙁', 'rateLabel2');
      case 3:
        return ('😐', 'rateLabel3');
      case 4:
        return ('🙂', 'rateLabel4');
      case 5:
        return ('😄', 'rateLabel5');
      default:
        return ('🙂', 'ratePickStars');
    }
  }

  Future<void> _submit() async {
    if (_stars < 1 || _saving) return;
    setState(() => _saving = true);
    try {
      final tags = _tagCatalog.entries
          .where((e) => _tags.contains(e.key))
          .map((e) => e.value)
          .toList();
      final messenger = ScaffoldMessenger.maybeOf(context);
      final thanks = AppLocalizations.of(context).t('rateThanks');
      await widget.onSubmit(_stars, tags);
      if (!mounted) return;
      Navigator.of(context).maybePop();
      messenger?.showSnackBar(SnackBar(content: Text(thanks)));
    } catch (e) {
      if (!mounted) return;
      setState(() => _saving = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('$e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final appt = widget.appointment;
    final time = DateFormat('h:mm a').format(appt.timeSlot);
    final mood = _mood;
    final initials = appt.doctorName.trim().isEmpty
        ? 'Dr'
        : appt.doctorName
            .trim()
            .split(RegExp(r'\s+'))
            .where((p) => p.isNotEmpty)
            .take(2)
            .map((p) => p[0].toUpperCase())
            .join();
    final photo = widget.doctorPhotoUrl?.trim();
    final bottom = MediaQuery.viewInsetsOf(context).bottom;

    return Padding(
      padding: EdgeInsets.only(bottom: bottom),
      child: Align(
        alignment: Alignment.bottomCenter,
        child: Container(
          width: double.infinity,
          decoration: BoxDecoration(
            color: AppColors.cardBg(context),
            borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
          ),
          child: SafeArea(
            top: false,
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(24, 12, 24, 16),
              child: Column(
                children: [
                  Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: AppColors.line(context),
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: 88,
                    height: 88,
                    child: Stack(
                      children: [
                        CircleAvatar(
                          radius: 42,
                          backgroundColor: const Color(0xFFE8F3F0),
                          backgroundImage: photo != null && photo.isNotEmpty
                              ? NetworkImage(photo)
                              : null,
                          child: photo != null && photo.isNotEmpty
                              ? null
                              : Text(
                                  initials,
                                  style: const TextStyle(
                                    color: Color(0xFF0F766E),
                                    fontWeight: FontWeight.w800,
                                    fontSize: 26,
                                  ),
                                ),
                        ),
                        Positioned(
                          right: 6,
                          bottom: 6,
                          child: Container(
                            width: 16,
                            height: 16,
                            decoration: BoxDecoration(
                              color: AppColors.onlineGreen,
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: AppColors.cardBg(context),
                                width: 2,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    appt.doctorName,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: AppColors.ink(context),
                      fontWeight: FontWeight.w800,
                      fontSize: 20,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    l
                        .t('rateConsultCompletedAt')
                        .replaceAll('{time}', time),
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: AppColors.muted(context),
                      fontSize: 13,
                    ),
                  ),
                  const SizedBox(height: 22),
                  Text(
                    l.t('rateHowWasConsult'),
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: AppColors.ink(context),
                      fontWeight: FontWeight.w800,
                      fontSize: 22,
                    ),
                  ),
                  const SizedBox(height: 14),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      for (var i = 1; i <= 5; i++)
                        IconButton(
                          onPressed: _saving
                              ? null
                              : () => setState(() => _stars = i),
                          iconSize: 36,
                          padding: const EdgeInsets.symmetric(horizontal: 4),
                          constraints: const BoxConstraints(),
                          icon: Icon(
                            i <= _stars
                                ? Icons.star_rounded
                                : Icons.star_outline_rounded,
                            color: i <= _stars
                                ? const Color(0xFFF5C518)
                                : AppColors.line(context),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(mood.$1, style: const TextStyle(fontSize: 36)),
                  const SizedBox(height: 4),
                  Text(
                    l.t(mood.$2),
                    style: TextStyle(
                      color: AppColors.ink(context),
                      fontWeight: FontWeight.w700,
                      fontSize: 16,
                    ),
                  ),
                  const SizedBox(height: 18),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    alignment: WrapAlignment.center,
                    children: [
                      for (final key in _tagCatalog.keys)
                        FilterChip(
                          selected: _tags.contains(key),
                          showCheckmark: false,
                          label: Text(l.t(key)),
                          labelStyle: TextStyle(
                            fontWeight: FontWeight.w600,
                            color: _tags.contains(key)
                                ? Colors.white
                                : AppColors.ink(context),
                          ),
                          selectedColor: const Color(0xFF0F766E),
                          backgroundColor: AppColors.softFill(context),
                          shape: const StadiumBorder(),
                          side: BorderSide.none,
                          onSelected: _saving
                              ? null
                              : (on) => setState(() {
                                    if (on) {
                                      _tags.add(key);
                                    } else {
                                      _tags.remove(key);
                                    }
                                  }),
                        ),
                    ],
                  ),
                  const SizedBox(height: 22),
                  SizedBox(
                    width: double.infinity,
                    height: 54,
                    child: FilledButton(
                      onPressed: _stars < 1 || _saving ? null : _submit,
                      style: FilledButton.styleFrom(
                        backgroundColor: AppColors.ink(context),
                        foregroundColor: AppColors.cardBg(context),
                        disabledBackgroundColor:
                            AppColors.ink(context).withValues(alpha: 0.35),
                        shape: const StadiumBorder(),
                        textStyle: const TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 16,
                        ),
                      ),
                      child: _saving
                          ? const SizedBox(
                              width: 22,
                              height: 22,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : Text(l.t('rateSubmit')),
                    ),
                  ),
                  TextButton(
                    onPressed: _saving
                        ? null
                        : () {
                            widget.onLater?.call();
                            Navigator.of(context).maybePop();
                          },
                    child: Text(
                      l.t('rateMaybeLater'),
                      style: TextStyle(
                        color: AppColors.muted(context),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
