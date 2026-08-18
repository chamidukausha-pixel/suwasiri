import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../data/catalogs/vaccine_catalog.dart';
import '../../data/models/vaccine_models.dart';
import '../../data/repositories/health_repository.dart';

class VaccineState extends Equatable {
  const VaccineState({
    this.protocols = const [],
    this.clinics = const [],
    this.slots = const [],
    this.lastSync,
    this.district = '',
    this.facilityType = FacilityType.all,
    this.query = '',
    this.immunizationTarget = '',
    this.selectedClinic,
    this.selectedDate,
    this.selectedSlot,
    this.bookingStage,
    this.loading = false,
    this.message,
    this.lastBooking,
  });

  final List<VaccineProtocol> protocols;
  final List<ClinicFacility> clinics;
  final List<DateTime> slots;
  final DateTime? lastSync;
  final String? district;
  final FacilityType facilityType;
  final String query;
  final String immunizationTarget;
  final ClinicFacility? selectedClinic;
  final DateTime? selectedDate;
  final DateTime? selectedSlot;
  final String? bookingStage;
  final bool loading;
  final String? message;
  final VaccineBooking? lastBooking;

  /// Unique calendar days from [slots].
  List<DateTime> get availableDates {
    final seen = <String>{};
    final dates = <DateTime>[];
    for (final s in slots) {
      final key = '${s.year}-${s.month}-${s.day}';
      if (seen.add(key)) {
        dates.add(DateTime(s.year, s.month, s.day));
      }
    }
    return dates;
  }

  /// Slots for [selectedDate].
  List<DateTime> get slotsForSelectedDate {
    final d = selectedDate;
    if (d == null) return const [];
    return slots
        .where((s) => s.year == d.year && s.month == d.month && s.day == d.day)
        .toList();
  }

  VaccineState copyWith({
    List<VaccineProtocol>? protocols,
    List<ClinicFacility>? clinics,
    List<DateTime>? slots,
    DateTime? lastSync,
    String? district,
    FacilityType? facilityType,
    String? query,
    String? immunizationTarget,
    ClinicFacility? selectedClinic,
    DateTime? selectedDate,
    DateTime? selectedSlot,
    String? bookingStage,
    bool? loading,
    String? message,
    VaccineBooking? lastBooking,
    bool clearClinic = false,
    bool clearDate = false,
    bool clearSlot = false,
    bool clearMessage = false,
    bool clearLastBooking = false,
  }) {
    return VaccineState(
      protocols: protocols ?? this.protocols,
      clinics: clinics ?? this.clinics,
      slots: slots ?? this.slots,
      lastSync: lastSync ?? this.lastSync,
      district: district ?? this.district,
      facilityType: facilityType ?? this.facilityType,
      query: query ?? this.query,
      immunizationTarget: immunizationTarget ?? this.immunizationTarget,
      selectedClinic:
          clearClinic ? null : (selectedClinic ?? this.selectedClinic),
      selectedDate: clearDate ? null : (selectedDate ?? this.selectedDate),
      selectedSlot: clearSlot ? null : (selectedSlot ?? this.selectedSlot),
      bookingStage: bookingStage,
      loading: loading ?? this.loading,
      message: clearMessage ? null : (message ?? this.message),
      lastBooking:
          clearLastBooking ? null : (lastBooking ?? this.lastBooking),
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
        immunizationTarget,
        selectedClinic,
        selectedDate,
        selectedSlot,
        bookingStage,
        loading,
        message,
        lastBooking,
      ];
}

class VaccineCubit extends Cubit<VaccineState> {
  VaccineCubit(this._health) : super(const VaccineState());

  final HealthRepository _health;
  DateTime? _dateOfBirth;
  String? _patientId;

  Future<void> bootstrap(String patientId, {DateTime? dateOfBirth}) async {
    _patientId = patientId;
    _dateOfBirth = dateOfBirth ?? _dateOfBirth;
    emit(state.copyWith(loading: true));
    await _health.syncMoh();
    final protocols = await _health.getVaccineProtocols(
      patientId,
      dateOfBirth: _dateOfBirth,
    );
    final active = protocols
        .where((p) => p.status != VaccineStatus.completed)
        .toList();
    final sync = await _health.lastMohSync();
    final clinics = await _health.getClinics(
      district: state.district,
      type: state.facilityType,
      query: state.query,
    );
    emit(state.copyWith(
      protocols: active,
      clinics: clinics,
      lastSync: sync,
      loading: false,
      immunizationTarget: _nextTarget(active, state.immunizationTarget),
    ));
  }

  String _nextTarget(List<VaccineProtocol> protocols, String current) {
    if (VaccineCatalog.immunizationTargets.contains(current) &&
        current.isNotEmpty) {
      return current;
    }
    for (final p in protocols) {
      if (VaccineCatalog.immunizationTargets.contains(p.name)) {
        return p.name;
      }
    }
    return VaccineCatalog.immunizationTargets.first;
  }

  Future<void> refreshClinics() async {
    final clinics = await _health.getClinics(
      district: state.district,
      type: state.facilityType,
      query: state.query,
    );
    emit(state.copyWith(
      clinics: clinics,
      clearClinic: true,
      clearDate: true,
      clearSlot: true,
      slots: const [],
    ));
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

  void setImmunization(String target) {
    emit(state.copyWith(immunizationTarget: target));
  }

  Future<void> selectClinic(ClinicFacility clinic) async {
    final slots = await _health.getAvailableSlots(clinic.id);
    final dates = <DateTime>[];
    final seen = <String>{};
    for (final s in slots) {
      final key = '${s.year}-${s.month}-${s.day}';
      if (seen.add(key)) {
        dates.add(DateTime(s.year, s.month, s.day));
      }
    }
    final firstDate = dates.isEmpty ? null : dates.first;
    DateTime? firstSlot;
    if (firstDate != null) {
      for (final s in slots) {
        if (s.year == firstDate.year &&
            s.month == firstDate.month &&
            s.day == firstDate.day) {
          firstSlot = s;
          break;
        }
      }
    }
    emit(state.copyWith(
      selectedClinic: clinic,
      slots: slots,
      selectedDate: firstDate,
      selectedSlot: firstSlot,
      clearDate: firstDate == null,
      clearSlot: firstSlot == null,
    ));
  }

  void selectDate(DateTime date) {
    final day = DateTime(date.year, date.month, date.day);
    DateTime? first;
    for (final s in state.slots) {
      if (s.year == day.year && s.month == day.month && s.day == day.day) {
        first = s;
        break;
      }
    }
    emit(state.copyWith(
      selectedDate: day,
      selectedSlot: first,
      clearSlot: first == null,
    ));
  }

  void selectSlot(DateTime slot) {
    emit(state.copyWith(selectedSlot: slot));
  }

  void prepareBookingSheet({String? immunizationTarget}) {
    String? preferred = immunizationTarget;
    if (preferred == null) {
      for (final p in state.protocols) {
        if (p.status == VaccineStatus.pending &&
            VaccineCatalog.immunizationTargets.contains(p.name)) {
          preferred = p.name;
          break;
        }
      }
    }
    final matched = preferred != null &&
            VaccineCatalog.immunizationTargets.contains(preferred)
        ? preferred
        : VaccineCatalog.immunizationTargets.first;
    emit(state.copyWith(
      immunizationTarget: matched,
      district: '',
      facilityType: FacilityType.all,
      query: '',
      clearClinic: true,
      clearDate: true,
      clearSlot: true,
      slots: const [],
      clearLastBooking: true,
      clearMessage: true,
    ));
    refreshClinics();
  }

  Future<void> book({
    required String patientId,
    required String ceylonHealthId,
  }) async {
    final clinic = state.selectedClinic;
    final slot = state.selectedSlot;
    if (clinic == null || slot == null) return;
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
      vaccineName: state.immunizationTarget,
    );
    List<VaccineProtocol>? protocols;
    try {
      protocols = (await _health.getVaccineProtocols(
        _patientId ?? patientId,
        dateOfBirth: _dateOfBirth,
      ))
          .where((p) => p.status != VaccineStatus.completed)
          .toList();
    } catch (_) {}
    if (isClosed) return;
    emit(state.copyWith(
      bookingStage: null,
      message: 'Booked ${booking.facilityName}',
      lastBooking: booking,
      protocols: protocols,
      clearClinic: true,
      clearDate: true,
      clearSlot: true,
      slots: const [],
    ));
  }
}
