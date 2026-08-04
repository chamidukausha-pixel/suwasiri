import 'package:equatable/equatable.dart';

class UserProfile extends Equatable {
  const UserProfile({
    required this.id,
    required this.name,
    required this.email,
    this.nic,
    this.mobileNo,
    this.bloodGroup,
    this.region,
    this.dateOfBirth,
    this.emergencyContacts = const [],
    this.ceylonHealthId,
  });

  final String id;
  final String name;
  final String email;
  final String? nic;
  final String? mobileNo;
  final String? bloodGroup;
  final String? region;
  final DateTime? dateOfBirth;
  final List<String> emergencyContacts;
  final String? ceylonHealthId;

  bool get isProfileComplete =>
      nic != null &&
      nic!.isNotEmpty &&
      dateOfBirth != null &&
      region != null &&
      region!.isNotEmpty;

  UserProfile copyWith({
    String? id,
    String? name,
    String? email,
    String? nic,
    String? mobileNo,
    String? bloodGroup,
    String? region,
    DateTime? dateOfBirth,
    List<String>? emergencyContacts,
    String? ceylonHealthId,
  }) {
    return UserProfile(
      id: id ?? this.id,
      name: name ?? this.name,
      email: email ?? this.email,
      nic: nic ?? this.nic,
      mobileNo: mobileNo ?? this.mobileNo,
      bloodGroup: bloodGroup ?? this.bloodGroup,
      region: region ?? this.region,
      dateOfBirth: dateOfBirth ?? this.dateOfBirth,
      emergencyContacts: emergencyContacts ?? this.emergencyContacts,
      ceylonHealthId: ceylonHealthId ?? this.ceylonHealthId,
    );
  }

  Map<String, dynamic> toMap() => {
        'name': name,
        'email': email,
        'NIC': nic,
        'mobileNo': mobileNo,
        'bloodGroup': bloodGroup,
        'region': region,
        'dateOfBirth': dateOfBirth?.toIso8601String(),
        'emergencyContacts': emergencyContacts,
        'ceylonHealthId': ceylonHealthId,
      };

  factory UserProfile.fromMap(String id, Map<String, dynamic> map) {
    return UserProfile(
      id: id,
      name: map['name'] as String? ?? '',
      email: map['email'] as String? ?? '',
      nic: map['NIC'] as String?,
      mobileNo: map['mobileNo'] as String?,
      bloodGroup: map['bloodGroup'] as String?,
      region: map['region'] as String?,
      dateOfBirth: map['dateOfBirth'] != null
          ? DateTime.tryParse(map['dateOfBirth'] as String)
          : null,
      emergencyContacts: (map['emergencyContacts'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          const [],
      ceylonHealthId: map['ceylonHealthId'] as String?,
    );
  }

  @override
  List<Object?> get props => [
        id,
        name,
        email,
        nic,
        mobileNo,
        bloodGroup,
        region,
        dateOfBirth,
        emergencyContacts,
        ceylonHealthId,
      ];
}
