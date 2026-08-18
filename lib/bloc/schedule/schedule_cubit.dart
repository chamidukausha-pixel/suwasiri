import 'dart:async';

import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../data/models/appointment.dart';
import '../../data/models/vaccine_models.dart';
import '../../data/repositories/health_repository.dart';
import '../../core/utils/booking_expiry.dart';

class ScheduleState extends Equatable {
  const ScheduleState({
    this.appointments = const [],
    this.vaccineBookings = const [],
    this.tick = 0,
  });

  final List<Appointment> appointments;
  final List<VaccineBooking> vaccineBookings;
  /// Bumped on a timer so expired slots drop off without a tab change.
  final int tick;

  List<Appointment> get activeDoctors {
    final list = appointments.where((a) => a.isVisibleOnHome()).toList()
      ..sort((a, b) => b.bookedStamp.compareTo(a.bookedStamp));
    return list;
  }

  Appointment? get nextDoctor =>
      activeDoctors.isEmpty ? null : activeDoctors.first;

  Appointment? get nextClinic => _latestWhere((a) => !a.isVideo);

  Appointment? get nextVideo => _latestWhere((a) => a.isVideo);

  Appointment? _latestWhere(bool Function(Appointment) test) {
    Appointment? best;
    for (final a in appointments) {
      if (!a.isVisibleOnHome() || !test(a)) continue;
      if (best == null || a.bookedStamp.isAfter(best.bookedStamp)) {
        best = a;
      }
    }
    return best;
  }

  VaccineBooking? get nextVaccine =>
      upcomingVaccines.isEmpty ? null : upcomingVaccines.first;

  /// Confirmed vaccine sessions still visible on Home (until next midnight).
  List<VaccineBooking> get upcomingVaccines {
    final list = vaccineBookings.where((b) => b.isVisibleOnHome()).toList()
      ..sort((a, b) => a.slot.compareTo(b.slot));
    return list;
  }

  ScheduleState copyWith({
    List<Appointment>? appointments,
    List<VaccineBooking>? vaccineBookings,
    int? tick,
  }) {
    return ScheduleState(
      appointments: appointments ?? this.appointments,
      vaccineBookings: vaccineBookings ?? this.vaccineBookings,
      tick: tick ?? this.tick,
    );
  }

  @override
  List<Object?> get props => [appointments, vaccineBookings, tick];
}

/// Live Home / Call schedule. Video consults → Call + Home; clinic → Home only.
class ScheduleCubit extends Cubit<ScheduleState> {
  ScheduleCubit(this._health) : super(const ScheduleState());

  final HealthRepository _health;
  StreamSubscription<List<Appointment>>? _sub;
  Timer? _expiryTick;
  Timer? _midnightTick;
  String? _patientId;

  Future<void> watch(String patientId) async {
    if (_patientId == patientId && _sub != null) {
      await refresh();
      return;
    }
    _patientId = patientId;
    await _sub?.cancel();
    _expiryTick?.cancel();
    await refresh();
    _sub = _health.watchAppointments(patientId).listen((appts) async {
      List<VaccineBooking> vax = state.vaccineBookings;
      try {
        vax = await _health.getVaccineBookings(patientId);
      } catch (_) {}
      if (isClosed) return;
      emit(state.copyWith(
        appointments: _mergePending(appts),
        vaccineBookings: _mergePendingVaccines(vax),
        tick: state.tick + 1,
      ));
      _armMidnightTick();
    });
    _expiryTick = Timer.periodic(const Duration(seconds: 20), (_) {
      if (isClosed) return;
      emit(state.copyWith(tick: state.tick + 1));
    });
  }

  Future<void> refresh() async {
    final id = _patientId;
    if (id == null) return;
    final appts = await _health.getAppointments(id);
    List<VaccineBooking> vax = const [];
    try {
      vax = await _health.getVaccineBookings(id);
    } catch (_) {}
    if (isClosed) return;
    emit(state.copyWith(
      appointments: _mergePending(appts),
      vaccineBookings: _mergePendingVaccines(vax),
      tick: state.tick + 1,
    ));
    _armMidnightTick();
  }

  /// Keep a booking just written locally if Firestore lag drops it for a moment.
  List<Appointment> _mergePending(List<Appointment> remote) {
    final ids = remote.map((a) => a.id).toSet();
    final extras = state.appointments.where((a) {
      if (ids.contains(a.id)) return false;
      final booked = a.bookedAt;
      if (booked == null) return false;
      return DateTime.now().difference(booked) < const Duration(seconds: 20);
    });
    return [...remote, ...extras];
  }

  /// Instantly show the booking on Home / Call, then Firestore stream confirms.
  void recordBooking(Appointment appt) {
    final others = state.appointments.where((a) => a.id != appt.id).toList();
    emit(state.copyWith(
      appointments: [appt, ...others],
      tick: state.tick + 1,
    ));
    _armMidnightTick();
  }

  /// Instantly show vaccine sessions on the Home green cards.
  void recordVaccineBooking(VaccineBooking booking) {
    final others =
        state.vaccineBookings.where((b) => b.id != booking.id).toList();
    emit(state.copyWith(
      vaccineBookings: [booking, ...others],
      tick: state.tick + 1,
    ));
    _armMidnightTick();
  }

  List<VaccineBooking> _mergePendingVaccines(List<VaccineBooking> remote) {
    final ids = remote.map((b) => b.id).toSet();
    final extras = state.vaccineBookings.where((b) {
      if (ids.contains(b.id)) return false;
      final booked = b.bookedAt;
      if (booked == null) return false;
      return DateTime.now().difference(booked) < const Duration(seconds: 20);
    });
    return [...remote, ...extras];
  }

  void _armMidnightTick() {
    _midnightTick?.cancel();
    final now = DateTime.now();
    DateTime? next;
    void consider(DateTime slot) {
      final hide = BookingExpiry.hidesAt(slot);
      if (!hide.isAfter(now)) return;
      if (next == null || hide.isBefore(next!)) next = hide;
    }

    for (final a in state.appointments) {
      if (a.status == AppointmentStatus.upcoming) consider(a.timeSlot);
    }
    for (final b in state.vaccineBookings) {
      if (b.status == 'confirmed') consider(b.slot);
    }
    if (next == null) return;
    var wait = next!.difference(now) + const Duration(milliseconds: 300);
    if (wait.isNegative) wait = const Duration(milliseconds: 300);
    _midnightTick = Timer(wait, () {
      if (isClosed) return;
      emit(state.copyWith(tick: state.tick + 1));
      _armMidnightTick();
    });
  }

  @override
  Future<void> close() {
    _sub?.cancel();
    _expiryTick?.cancel();
    _midnightTick?.cancel();
    return super.close();
  }
}
