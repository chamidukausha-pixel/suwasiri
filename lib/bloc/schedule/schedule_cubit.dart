import 'dart:async';

import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../data/models/appointment.dart';
import '../../data/models/vaccine_models.dart';
import '../../data/repositories/health_repository.dart';

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
    final list = appointments.where((a) => a.isActiveSlot).toList()
      ..sort((a, b) => a.timeSlot.compareTo(b.timeSlot));
    return list;
  }

  Appointment? get nextDoctor =>
      activeDoctors.isEmpty ? null : activeDoctors.first;

  Appointment? get nextVideo {
    for (final a in activeDoctors) {
      if (a.isVideo) return a;
    }
    return null;
  }

  VaccineBooking? get nextVaccine {
    final list = vaccineBookings
        .where((b) =>
            b.status == 'confirmed' && b.slot.isAfter(DateTime.now()))
        .toList()
      ..sort((a, b) => a.slot.compareTo(b.slot));
    return list.isEmpty ? null : list.first;
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
      emit(state.copyWith(appointments: appts, vaccineBookings: vax));
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
    emit(state.copyWith(appointments: appts, vaccineBookings: vax));
  }

  @override
  Future<void> close() {
    _sub?.cancel();
    _expiryTick?.cancel();
    return super.close();
  }
}
