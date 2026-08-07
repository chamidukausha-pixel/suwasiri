import 'dart:async';

import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../data/models/sos_location.dart';
import '../../data/repositories/health_repository.dart';
import '../../data/services/sos_service.dart';

enum SosPhase { idle, locating, ready, calling, error }

class SosState extends Equatable {
  const SosState({
    this.phase = SosPhase.idle,
    this.location,
    this.error,
    this.dialed = false,
    this.shareLiveGps = false,
    this.sessionId,
  });

  final SosPhase phase;
  final SosLocation? location;
  final String? error;
  final bool dialed;
  final bool shareLiveGps;
  final String? sessionId;

  SosState copyWith({
    SosPhase? phase,
    SosLocation? location,
    String? error,
    bool clearError = false,
    bool? dialed,
    bool? shareLiveGps,
    String? sessionId,
    bool clearSession = false,
  }) {
    return SosState(
      phase: phase ?? this.phase,
      location: location ?? this.location,
      error: clearError ? null : (error ?? this.error),
      dialed: dialed ?? this.dialed,
      shareLiveGps: shareLiveGps ?? this.shareLiveGps,
      sessionId: clearSession ? null : (sessionId ?? this.sessionId),
    );
  }

  @override
  List<Object?> get props =>
      [phase, location, error, dialed, shareLiveGps, sessionId];
}

class SosCubit extends Cubit<SosState> {
  SosCubit(this._sos, this._health) : super(const SosState());

  final SosService _sos;
  final HealthRepository _health;
  StreamSubscription<SosLocation>? _liveSub;
  String? _patientId;

  /// Open overlay: resolve incident GPS (no dial yet).
  Future<void> prepareEmergency({String? patientId}) async {
    _patientId = patientId;
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
      emit(SosState(phase: SosPhase.ready, location: location));
    } catch (e) {
      emit(SosState(
        phase: SosPhase.ready,
        location: const SosLocation(
          latitude: 6.9271,
          longitude: 79.8612,
          accuracyMeters: 120,
          address: 'Viharamahadevi Park Area, Colombo 07',
        ),
        error: 'Using approximate coordinates: $e',
      ));
    }
  }

  /// When approved, Suwasariya dispatch can read live GPS from Firestore.
  Future<void> setShareLiveGps(bool approved) async {
    final loc = state.location;
    if (loc == null) return;

    if (!approved) {
      await _liveSub?.cancel();
      _liveSub = null;
      final sid = state.sessionId;
      if (sid != null) {
        try {
          await _health.endSosSession(sid);
        } catch (_) {}
      }
      emit(state.copyWith(
        shareLiveGps: false,
        clearSession: true,
        clearError: true,
      ));
      return;
    }

    emit(state.copyWith(shareLiveGps: true, clearError: true));
    await _publish(loc);

    await _liveSub?.cancel();
    _liveSub = _sos.watchLiveLocation().listen(
      (next) async {
        emit(state.copyWith(location: next));
        await _publish(next);
      },
      onError: (_) {},
    );
  }

  Future<void> _publish(SosLocation location) async {
    final uid = _patientId;
    if (uid == null || uid.isEmpty || !state.shareLiveGps) return;
    try {
      final id = await _health.upsertSosSession(
        patientId: uid,
        location: location,
        shareLiveGps: true,
        sessionId: state.sessionId,
      );
      if (state.sessionId != id) {
        emit(state.copyWith(sessionId: id));
      }
    } catch (e) {
      emit(state.copyWith(error: 'Could not share GPS with dispatch: $e'));
    }
  }

  Future<void> callSuwasariya() async {
    emit(state.copyWith(phase: SosPhase.calling, clearError: true));
    final dialed = await _sos.dialEmergency();
    emit(state.copyWith(
      phase: SosPhase.ready,
      dialed: dialed,
      error: dialed ? null : 'Dialer unavailable — call 1990 manually',
    ));
  }

  Future<void> closeSession() async {
    await _liveSub?.cancel();
    _liveSub = null;
    final sid = state.sessionId;
    if (sid != null) {
      try {
        await _health.endSosSession(sid);
      } catch (_) {}
    }
    await _sos.stopLiveWatch();
    emit(const SosState());
  }

  @override
  Future<void> close() async {
    await _liveSub?.cancel();
    await _sos.stopLiveWatch();
    return super.close();
  }
}
