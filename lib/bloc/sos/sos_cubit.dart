import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../data/models/sos_location.dart';
import '../../data/services/sos_service.dart';

enum SosPhase { idle, locating, active, error }

class SosState extends Equatable {
  const SosState({
    this.phase = SosPhase.idle,
    this.location,
    this.error,
    this.dialed = false,
  });

  final SosPhase phase;
  final SosLocation? location;
  final String? error;
  final bool dialed;

  SosState copyWith({
    SosPhase? phase,
    SosLocation? location,
    String? error,
    bool? dialed,
  }) {
    return SosState(
      phase: phase ?? this.phase,
      location: location ?? this.location,
      error: error,
      dialed: dialed ?? this.dialed,
    );
  }

  @override
  List<Object?> get props => [phase, location, error, dialed];
}

class SosCubit extends Cubit<SosState> {
  SosCubit(this._sos) : super(const SosState());

  final SosService _sos;

  Future<void> triggerEmergency() async {
    emit(const SosState(phase: SosPhase.locating));
    final ok = await _sos.ensureLocationPermission();
    if (!ok) {
      emit(const SosState(
        phase: SosPhase.error,
        error: 'Location permission required for 1990 SOS.',
      ));
      return;
    }
    try {
      final location = await _sos.fetchLiveLocation();
      final dialed = await _sos.dialEmergency();
      emit(SosState(
        phase: SosPhase.active,
        location: location,
        dialed: dialed,
      ));
    } catch (e) {
      // Demo fallback coordinates (Colombo) if GPS unavailable
      emit(SosState(
        phase: SosPhase.active,
        location: const SosLocation(
          latitude: 6.9271,
          longitude: 79.8612,
          accuracyMeters: 25,
          address: 'Colombo, Sri Lanka (demo fallback)',
        ),
        dialed: false,
        error: 'Using demo coordinates: $e',
      ));
    }
  }

  void reset() => emit(const SosState());
}
