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
    this.vaccineName = '',
    this.address = '',
    this.latitude,
    this.longitude,
  });

  final String id;
  final String facilityId;
  final String facilityName;
  final DateTime slot;
  final String ceylonHealthId;
  final String status;
  final String vaccineName;
  final String address;
  final double? latitude;
  final double? longitude;

  String get placeLabel {
    final parts = [
      facilityName,
      if (address.isNotEmpty) address,
    ];
    return parts.join(', ');
  }

  Map<String, dynamic> toMap() => {
        'facilityId': facilityId,
        'facilityName': facilityName,
        'slot': slot.toIso8601String(),
        'ceylonHealthId': ceylonHealthId,
        'status': status,
        'vaccineName': vaccineName,
        'address': address,
        'latitude': latitude,
        'longitude': longitude,
      };

  factory VaccineBooking.fromMap(String id, Map<String, dynamic> map) {
    return VaccineBooking(
      id: id,
      facilityId: map['facilityId'] as String? ?? '',
      facilityName: map['facilityName'] as String? ?? '',
      slot: DateTime.tryParse(map['slot'] as String? ?? '') ?? DateTime.now(),
      ceylonHealthId: map['ceylonHealthId'] as String? ?? '',
      status: map['status'] as String? ?? 'confirmed',
      vaccineName: map['vaccineName'] as String? ?? '',
      address: map['address'] as String? ?? '',
      latitude: (map['latitude'] as num?)?.toDouble(),
      longitude: (map['longitude'] as num?)?.toDouble(),
    );
  }

  @override
  List<Object?> get props => [
        id,
        facilityId,
        facilityName,
        slot,
        ceylonHealthId,
        status,
        vaccineName,
        address,
        latitude,
        longitude,
      ];
}
