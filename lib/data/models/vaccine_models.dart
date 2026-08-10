import 'package:equatable/equatable.dart';

enum VaccineStatus { pending, scheduled, completed }

class VaccineProtocol extends Equatable {
  const VaccineProtocol({
    required this.id,
    required this.name,
    required this.doseLabel,
    required this.progress,
    required this.nextDue,
    this.productName = '',
    this.status = VaccineStatus.pending,
    this.statusDetail = '',
    this.booked = false,
  });

  final String id;
  final String name;
  final String doseLabel;
  final double progress; // 0.0 – 1.0
  final DateTime? nextDue;
  final String productName;
  final VaccineStatus status;
  final String statusDetail;
  final bool booked;

  @override
  List<Object?> get props => [
        id,
        name,
        doseLabel,
        progress,
        nextDue,
        productName,
        status,
        statusDetail,
        booked,
      ];
}

enum FacilityType { all, mohClinic, hospital, privateHospital }

class ClinicFacility extends Equatable {
  const ClinicFacility({
    required this.id,
    required this.name,
    required this.district,
    required this.type,
    required this.address,
    this.hours = '',
    this.priceLkr,
  });

  final String id;
  final String name;
  final String district;
  final FacilityType type;
  final String address;
  final String hours;
  /// Shown for private hospitals (LKR). MOH / public hospitals are subsidized.
  final int? priceLkr;

  @override
  List<Object?> get props =>
      [id, name, district, type, address, hours, priceLkr];
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
