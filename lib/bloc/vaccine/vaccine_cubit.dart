import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../data/models/vaccine_models.dart';
import '../../data/repositories/health_repository.dart';

class VaccineState extends Equatable {
  const VaccineState({
    this.protocols = const [],
    this.clinics = const [],
    this.slots = const [],
    this.lastSync,
    this.district,
    this.facilityType = FacilityType.all,
    this.query = '',
    this.selectedClinic,
    this.bookingStage,
    this.loading = false,
    this.message,
  });

  final List<VaccineProtocol> protocols;
  final List<ClinicFacility> clinics;
  final List<DateTime> slots;
  final DateTime? lastSync;
  final String? district;
  final FacilityType facilityType;
  final String query;
  final ClinicFacility? selectedClinic;
  final String? bookingStage;
  final bool loading;
  final String? message;

  VaccineState copyWith({
    List<VaccineProtocol>? protocols,
    List<ClinicFacility>? clinics,
    List<DateTime>? slots,
    DateTime? lastSync,
    String? district,
    FacilityType? facilityType,
    String? query,
    ClinicFacility? selectedClinic,
    String? bookingStage,
    bool? loading,
    String? message,
    bool clearClinic = false,
    bool clearMessage = false,
  }) {
    return VaccineState(
      protocols: protocols ?? this.protocols,
      clinics: clinics ?? this.clinics,
      slots: slots ?? this.slots,
      lastSync: lastSync ?? this.lastSync,
      district: district ?? this.district,
      facilityType: facilityType ?? this.facilityType,
      query: query ?? this.query,
      selectedClinic: clearClinic ? null : (selectedClinic ?? this.selectedClinic),
      bookingStage: bookingStage,
      loading: loading ?? this.loading,
      message: clearMessage ? null : (message ?? this.message),
    );
  }

  @override
  List<Object?> get props => [
        protocols,
        clinics,
        slots,
        lastSync,
        district,
        facilityType,
        query,
        selectedClinic,
        bookingStage,
        loading,
        message,
      ];
}

class VaccineCubit extends Cubit<VaccineState> {
  VaccineCubit(this._health) : super(const VaccineState());

  final HealthRepository _health;

  Future<void> bootstrap(String patientId) async {
    emit(state.copyWith(loading: true));
    await _health.syncMoh();
    final protocols = await _health.getVaccineProtocols(patientId);
    final sync = await _health.lastMohSync();
    final clinics = await _health.getClinics();
    emit(state.copyWith(
      protocols: protocols,
      clinics: clinics,
      lastSync: sync,
      loading: false,
    ));
  }

  Future<void> refreshClinics() async {
    final clinics = await _health.getClinics(
      district: state.district,
      type: state.facilityType,
      query: state.query,
    );
    emit(state.copyWith(clinics: clinics));
  }

  void setDistrict(String? district) {
    emit(state.copyWith(district: district ?? ''));
    refreshClinics();
  }

  void setType(FacilityType type) {
    emit(state.copyWith(facilityType: type));
    refreshClinics();
  }

  void setQuery(String query) {
    emit(state.copyWith(query: query));
    refreshClinics();
  }

  Future<void> selectClinic(ClinicFacility clinic) async {
    final slots = await _health.getAvailableSlots(clinic.id);
    emit(state.copyWith(selectedClinic: clinic, slots: slots));
  }

  Future<void> book({
    required String patientId,
    required DateTime slot,
    required String ceylonHealthId,
  }) async {
    final clinic = state.selectedClinic;
    if (clinic == null) return;
    emit(state.copyWith(bookingStage: '1. Handshake with MOH Portal…'));
    await Future<void>.delayed(const Duration(milliseconds: 350));
    emit(state.copyWith(bookingStage: '2. Verifying Ceylon Health ID…'));
    await Future<void>.delayed(const Duration(milliseconds: 350));
    emit(state.copyWith(bookingStage: '3. Securing reservation slot…'));
    final booking = await _health.bookVaccine(
      patientId: patientId,
      facilityId: clinic.id,
      facilityName: clinic.name,
      slot: slot,
      ceylonHealthId: ceylonHealthId,
    );
    emit(state.copyWith(
      bookingStage: null,
      message: 'Booked ${booking.facilityName}',
      clearClinic: true,
      slots: const [],
    ));
  }
}
