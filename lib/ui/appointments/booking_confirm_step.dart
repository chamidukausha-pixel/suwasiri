import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../data/catalogs/doctor_schedule_slots.dart';
import '../../data/models/appointment.dart';
import '../widgets/common_widgets.dart';

/// Booking confirm UI matching the product mockup (dates, times, reason, CTA).
class BookingConfirmStep extends StatelessWidget {
  const BookingConfirmStep({
    super.key,
    required this.doctor,
    required this.mode,
    required this.dates,
    required this.times,
    required this.selectedDate,
    required this.selectedTime,
    required this.bookedSlots,
    required this.slotsLoading,
    required this.visitReason,
    required this.consultFee,
    required this.onClose,
    required this.onMode,
    required this.onDate,
    required this.onTime,
    required this.onReason,
    required this.onProceed,
  });

  static const bg = Color(0xFFFAF9F7);
  static const coral = Color(0xFFE85D4C);
  static const sage = Color(0xFF8FA88E);
  static const sageBorder = Color(0xFF6F8B6E);
  static const reasonBlue = Color(0xFF5C9CEC);
  static const ink = Color(0xFF1A1A1A);
  static const muted = Color(0xFF8A8A8A);
  static const chip = Color(0xFFF0EFED);
  static const line = Color(0xFFE4E2DE);

  final Doctor doctor;
  final ConsultMode mode;
  final List<DateTime> dates;
  final List<TimeOfDay> times;
  final DateTime selectedDate;
  final TimeOfDay selectedTime;
  final List<DateTime> bookedSlots;
  final bool slotsLoading;
  final String visitReason;
  final int consultFee;
  final VoidCallback onClose;
  final ValueChanged<ConsultMode> onMode;
  final ValueChanged<DateTime> onDate;
  final ValueChanged<TimeOfDay> onTime;
  final ValueChanged<String> onReason;
  final VoidCallback onProceed;

  String _fmtTime24(TimeOfDay t) {
    final hh = t.hour.toString().padLeft(2, '0');
    final mm = t.minute.toString().padLeft(2, '0');
    return '$hh:$mm';
  }

  bool _taken(TimeOfDay t) {
    final slot = DoctorScheduleSlots.combine(selectedDate, t);
    return DoctorScheduleSlots.isTaken(slot, bookedSlots);
  }

  int get _openCount => times.where((t) => !_taken(t)).length;

  String get _initials {
    final clean = doctor.name.replaceAll(RegExp(r'^Dr\.?\s*', caseSensitive: false), '').trim();
    final parts = clean.split(RegExp(r'\s+')).where((w) => w.isNotEmpty).toList();
    if (parts.isEmpty) return 'D';
    if (parts.length == 1) return parts.first.substring(0, 1).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    final money = NumberFormat('#,###');
    final summaryDate =
        '${DateFormat('EEE d MMMM').format(selectedDate)} at ${_fmtTime24(selectedTime)}';
    final modeLabel =
        mode == ConsultMode.video ? 'Video consult' : 'Clinic visit';

    return ColoredBox(
      color: bg,
      child: Column(
        children: [
          Expanded(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 16),
              children: [
                Row(
                  children: [
                    IconButton(
                      onPressed: onClose,
                      icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 18),
                      color: ink,
                    ),
                    const Expanded(
                      child: Text(
                        'Book an appointment',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: ink,
                          fontWeight: FontWeight.w700,
                          fontSize: 17,
                          letterSpacing: -0.2,
                        ),
                      ),
                    ),
                    IconButton(
                      onPressed: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('Clinic: ${doctor.hospital}')),
                        );
                      },
                      icon: const Icon(Icons.phone_outlined, size: 22),
                      color: ink,
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    CircleAvatar(
                      radius: 34,
                      backgroundColor: chip,
                      child: Text(
                        _initials,
                        style: const TextStyle(
                          color: ink,
                          fontWeight: FontWeight.w800,
                          fontSize: 18,
                        ),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            doctor.name,
                            style: const TextStyle(
                              color: ink,
                              fontWeight: FontWeight.w800,
                              fontSize: 22,
                              height: 1.15,
                              letterSpacing: -0.4,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '${doctor.specialty} · ${doctor.hospital}',
                            style: const TextStyle(
                              color: muted,
                              fontSize: 13,
                              height: 1.3,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Wrap(
                            spacing: 12,
                            runSpacing: 4,
                            crossAxisAlignment: WrapCrossAlignment.center,
                            children: [
                              Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(
                                    Icons.star_rounded,
                                    size: 16,
                                    color: Color(0xFFE11D48),
                                  ),
                                  const SizedBox(width: 2),
                                  Text(
                                    doctor.rating.toStringAsFixed(1),
                                    style: const TextStyle(
                                      color: ink,
                                      fontWeight: FontWeight.w700,
                                      fontSize: 13,
                                    ),
                                  ),
                                ],
                              ),
                              Text(
                                '${doctor.yearsExperience} yrs',
                                style: const TextStyle(
                                  color: muted,
                                  fontWeight: FontWeight.w600,
                                  fontSize: 13,
                                ),
                              ),
                              Text(
                                'Rs ${money.format(consultFee)}',
                                style: const TextStyle(
                                  color: ink,
                                  fontWeight: FontWeight.w700,
                                  fontSize: 13,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 18),
                Row(
                  children: [
                    _ModePill(
                      label: 'Clinic',
                      selected: mode == ConsultMode.clinic,
                      onTap: () => onMode(ConsultMode.clinic),
                    ),
                    const SizedBox(width: 8),
                    _ModePill(
                      label: 'Video',
                      selected: mode == ConsultMode.video,
                      onTap: () => onMode(ConsultMode.video),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                SizedBox(
                  height: 92,
                  child: Row(
                    children: [
                      SizedBox(
                        width: 28,
                        child: RotatedBox(
                          quarterTurns: 3,
                          child: Text(
                            DateFormat('MMMM').format(selectedDate).toUpperCase(),
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              color: muted,
                              fontWeight: FontWeight.w700,
                              fontSize: 11,
                              letterSpacing: 1.4,
                            ),
                          ),
                        ),
                      ),
                      Expanded(
                        child: ListView.separated(
                          scrollDirection: Axis.horizontal,
                          itemCount: dates.length,
                          separatorBuilder: (_, _) => const SizedBox(width: 8),
                          itemBuilder: (_, i) {
                            final d = dates[i];
                            final selected = d.year == selectedDate.year &&
                                d.month == selectedDate.month &&
                                d.day == selectedDate.day;
                            final free = DoctorScheduleSlots.freeCountOnDate(
                              d,
                              bookedSlots,
                            );
                            return MinTap(
                              enforceMinSize: false,
                              onTap: () => onDate(d),
                              child: AnimatedContainer(
                                duration: const Duration(milliseconds: 180),
                                width: 64,
                                padding: const EdgeInsets.symmetric(vertical: 10),
                                decoration: BoxDecoration(
                                  color: selected ? sage : chip,
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(
                                    color: selected ? sageBorder : line,
                                    width: selected ? 1.4 : 1,
                                  ),
                                ),
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Text(
                                      DateFormat('EEE').format(d),
                                      style: TextStyle(
                                        color: selected
                                            ? Colors.white.withValues(alpha: 0.9)
                                            : muted,
                                        fontWeight: FontWeight.w600,
                                        fontSize: 12,
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      '${d.day}',
                                      style: TextStyle(
                                        color: selected ? Colors.white : ink,
                                        fontWeight: FontWeight.w800,
                                        fontSize: 22,
                                        height: 1.05,
                                      ),
                                    ),
                                    Text(
                                      '$free free',
                                      style: TextStyle(
                                        color: selected
                                            ? Colors.white.withValues(alpha: 0.85)
                                            : muted,
                                        fontWeight: FontWeight.w600,
                                        fontSize: 10,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 22),
                Row(
                  children: [
                    const Text(
                      'AVAILABLE TIMES',
                      style: TextStyle(
                        color: muted,
                        fontWeight: FontWeight.w700,
                        fontSize: 11,
                        letterSpacing: 1.1,
                      ),
                    ),
                    const Spacer(),
                    Text(
                      slotsLoading ? 'Syncing…' : '$_openCount open',
                      style: const TextStyle(
                        color: muted,
                        fontWeight: FontWeight.w600,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                if (slotsLoading)
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 24),
                    child: Center(
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: coral,
                      ),
                    ),
                  )
                else
                  GridView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: times.length,
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 3,
                      mainAxisSpacing: 10,
                      crossAxisSpacing: 10,
                      childAspectRatio: 2.35,
                    ),
                    itemBuilder: (_, i) {
                      final t = times[i];
                      final taken = _taken(t);
                      final selected = !taken &&
                          t.hour == selectedTime.hour &&
                          t.minute == selectedTime.minute;
                      return MinTap(
                        enforceMinSize: false,
                        onTap: taken ? null : () => onTime(t),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 160),
                          alignment: Alignment.center,
                          decoration: BoxDecoration(
                            color: selected
                                ? coral
                                : taken
                                    ? const Color(0xFFF3F2F0)
                                    : Colors.white,
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(
                              color: selected
                                  ? coral
                                  : taken
                                      ? const Color(0xFFE8E6E2)
                                      : line,
                            ),
                          ),
                          child: Text(
                            _fmtTime24(t),
                            style: TextStyle(
                              color: selected
                                  ? Colors.white
                                  : taken
                                      ? const Color(0xFFB0AEA9)
                                      : ink,
                              fontWeight: FontWeight.w700,
                              fontSize: 15,
                              decoration: taken
                                  ? TextDecoration.lineThrough
                                  : TextDecoration.none,
                              decorationColor: const Color(0xFFB0AEA9),
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                const SizedBox(height: 22),
                const Text(
                  'REASON FOR VISIT',
                  style: TextStyle(
                    color: muted,
                    fontWeight: FontWeight.w700,
                    fontSize: 11,
                    letterSpacing: 1.1,
                  ),
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    _ReasonChip(
                      label: 'Follow up',
                      icon: Icons.sync_rounded,
                      selected: visitReason == 'Follow up',
                      onTap: () => onReason('Follow up'),
                    ),
                    _ReasonChip(
                      label: 'New symptom',
                      icon: Icons.favorite_border_rounded,
                      selected: visitReason == 'New symptom',
                      onTap: () => onReason('New symptom'),
                    ),
                    _ReasonChip(
                      label: 'Test results',
                      icon: Icons.science_outlined,
                      selected: visitReason == 'Test results',
                      onTap: () => onReason('Test results'),
                    ),
                    _ReasonChip(
                      label: 'Prescription',
                      icon: Icons.medical_services_outlined,
                      selected: visitReason == 'Prescription',
                      onTap: () => onReason('Prescription'),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  'Dates open for the next 6 months · slots sync with Lanka GP Care',
                  style: TextStyle(
                    color: muted.withValues(alpha: 0.9),
                    fontSize: 11,
                    height: 1.35,
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: EdgeInsets.fromLTRB(
              20,
              12,
              20,
              12 + MediaQuery.paddingOf(context).bottom,
            ),
            decoration: const BoxDecoration(
              color: bg,
              border: Border(top: BorderSide(color: Color(0xFFEDEBE7))),
            ),
            child: Column(
              children: [
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 14,
                  ),
                  decoration: BoxDecoration(
                    color: chip,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              summaryDate,
                              style: const TextStyle(
                                color: ink,
                                fontWeight: FontWeight.w700,
                                fontSize: 15,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '$visitReason · $modeLabel · 15 minute slot',
                              style: const TextStyle(
                                color: muted,
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Text(
                        'Rs ${money.format(consultFee)}',
                        style: const TextStyle(
                          color: coral,
                          fontWeight: FontWeight.w800,
                          fontSize: 16,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  height: 54,
                  child: FilledButton.icon(
                    onPressed: onProceed,
                    style: FilledButton.styleFrom(
                      backgroundColor: coral,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                    icon: const Icon(Icons.check_rounded, size: 22),
                    label: const Text(
                      'Confirm booking',
                      style: TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 16,
                      ),
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

class _ModePill extends StatelessWidget {
  const _ModePill({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return MinTap(
      enforceMinSize: false,
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: selected ? BookingConfirmStep.reasonBlue : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: selected
                ? BookingConfirmStep.reasonBlue
                : BookingConfirmStep.line,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: selected ? Colors.white : BookingConfirmStep.muted,
            fontWeight: FontWeight.w700,
            fontSize: 12,
          ),
        ),
      ),
    );
  }
}

class _ReasonChip extends StatelessWidget {
  const _ReasonChip({
    required this.label,
    required this.icon,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return MinTap(
      enforceMinSize: false,
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: selected ? BookingConfirmStep.reasonBlue : Colors.white,
          borderRadius: BorderRadius.circular(22),
          border: Border.all(
            color: selected
                ? BookingConfirmStep.reasonBlue
                : BookingConfirmStep.line,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 16,
              color: selected ? Colors.white : BookingConfirmStep.muted,
            ),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                color: selected ? Colors.white : const Color(0xFF5A5A5A),
                fontWeight: FontWeight.w700,
                fontSize: 13,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
