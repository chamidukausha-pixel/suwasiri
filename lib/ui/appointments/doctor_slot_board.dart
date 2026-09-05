import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';

import '../../data/catalogs/doctor_schedule_slots.dart';
import '../../data/models/appointment.dart';
import '../../data/repositories/health_repository.dart';
import '../widgets/common_widgets.dart';

/// Live available / booked times for one doctor (same chips as Book Session).
class DoctorSlotBoard extends StatefulWidget {
  const DoctorSlotBoard({
    super.key,
    required this.doctor,
    this.onSelectSlot,
  });

  final Doctor doctor;
  final ValueChanged<DateTime>? onSelectSlot;

  @override
  State<DoctorSlotBoard> createState() => _DoctorSlotBoardState();
}

class _DoctorSlotBoardState extends State<DoctorSlotBoard> {
  static const coral = Color(0xFFE85D4C);
  static const sage = Color(0xFF8FA88E);
  static const sageBorder = Color(0xFF6F8B6E);
  static const ink = Color(0xFF1A1A1A);
  static const muted = Color(0xFF8A8A8A);
  static const chip = Color(0xFFF0EFED);
  static const line = Color(0xFFE4E2DE);

  late DateTime _date;
  List<DateTime> _booked = const [];
  StreamSubscription<List<DateTime>>? _sub;

  List<DateTime> get _dates => DoctorScheduleSlots.upcomingDates();

  List<TimeOfDay> get _times => DoctorScheduleSlots.timesFor(
        widget.doctor,
        _date,
        booked: _booked,
      );

  @override
  void initState() {
    super.initState();
    _date = _dates.first;
    _sub = context
        .read<HealthRepository>()
        .watchDoctorBookedSlots(
          widget.doctor.id,
          doctorName: widget.doctor.name,
        )
        .listen((booked) {
      if (!mounted) return;
      setState(() => _booked = booked);
    }, onError: (_) {});
  }

  @override
  void dispose() {
    unawaited(_sub?.cancel());
    super.dispose();
  }

  bool _taken(TimeOfDay t) => DoctorScheduleSlots.isTaken(
        DoctorScheduleSlots.combine(_date, t),
        _booked,
      );

  String _fmt(TimeOfDay t) {
    final hh = t.hour.toString().padLeft(2, '0');
    final mm = t.minute.toString().padLeft(2, '0');
    return '$hh:$mm';
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'AVAILABLE & BOOKED TIMES',
          style: TextStyle(
            color: muted,
            fontWeight: FontWeight.w700,
            fontSize: 11,
            letterSpacing: 1.1,
          ),
        ),
        const SizedBox(height: 10),
        SizedBox(
          height: 92,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: _dates.length,
            separatorBuilder: (_, _) => const SizedBox(width: 8),
            itemBuilder: (_, i) {
              final d = _dates[i];
              final selected = d.year == _date.year &&
                  d.month == _date.month &&
                  d.day == _date.day;
              final free = DoctorScheduleSlots.freeCountOnDate(
                d,
                _booked,
                doctor: widget.doctor,
              );
              return MinTap(
                enforceMinSize: false,
                onTap: () => setState(() => _date = d),
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
        const SizedBox(height: 12),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: _times.length,
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 3,
            mainAxisSpacing: 10,
            crossAxisSpacing: 10,
            childAspectRatio: 1.9,
          ),
          itemBuilder: (_, i) {
            final t = _times[i];
            final taken = _taken(t);
            return MinTap(
              enforceMinSize: false,
              onTap: taken
                  ? null
                  : () => widget.onSelectSlot?.call(
                        DoctorScheduleSlots.combine(_date, t),
                      ),
              child: Container(
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: taken ? const Color(0xFFF3F2F0) : Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: taken ? const Color(0xFFE8E6E2) : line,
                  ),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      _fmt(t),
                      style: TextStyle(
                        color: taken ? const Color(0xFFB0AEA9) : ink,
                        fontWeight: FontWeight.w700,
                        fontSize: 15,
                        decoration:
                            taken ? TextDecoration.lineThrough : TextDecoration.none,
                      ),
                    ),
                    if (taken)
                      const Text(
                        'BOOKED',
                        style: TextStyle(
                          color: coral,
                          fontWeight: FontWeight.w800,
                          fontSize: 8,
                          letterSpacing: 0.4,
                        ),
                      )
                    else
                      const Text(
                        'AVAILABLE',
                        style: TextStyle(
                          color: Color(0xFF217D4C),
                          fontWeight: FontWeight.w800,
                          fontSize: 8,
                          letterSpacing: 0.4,
                        ),
                      ),
                  ],
                ),
              ),
            );
          },
        ),
      ],
    );
  }
}
