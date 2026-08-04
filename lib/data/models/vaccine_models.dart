import 'package:equatable/equatable.dart';

class VaccineProtocol extends Equatable {
  const VaccineProtocol({
    required this.id,
    required this.name,
    required this.doseLabel,
    required this.progress,
    required this.nextDue,
  });

  final String id;
  final String name;
  final String doseLabel;
  final double progress; // 0.0 – 1.0
  final DateTime? nextDue;

  @override
  List<Object?> get props => [id, name, doseLabel, progress, nextDue];
}

enum FacilityType { all, mohClinic, hospital }

class ClinicFacility extends Equatable {
  const ClinicFacility({
    required this.id,
    required this.name,
    required this.district,
    required this.type,
    required this.address,
  });

  final String id;
  final String name;
  final String district;
  final FacilityType type;
  final String address;

  @override
  List<Object?> get props => [id, name, district, type, address];
}

class VaccineBooking extends Equatable {
  const VaccineBooking({
    required this.id,
    required this.facilityId,
    required this.facilityName,
    required this.slot,
    required this.ceylonHealthId,
    required this.status,
  });

  final String id;
  final String facilityId;
  final String facilityName;
  final DateTime slot;
  final String ceylonHealthId;
  final String status;

  @override
  List<Object?> get props =>
      [id, facilityId, facilityName, slot, ceylonHealthId, status];
}
