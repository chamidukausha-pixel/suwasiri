import 'package:equatable/equatable.dart';

class DoctorRating extends Equatable {
  const DoctorRating({
    required this.appointmentId,
    required this.patientId,
    required this.doctorId,
    required this.doctorName,
    required this.stars,
    required this.tags,
    required this.createdAt,
    this.consultMode = '',
  });

  final String appointmentId;
  final String patientId;
  final String doctorId;
  final String doctorName;
  final int stars;
  final List<String> tags;
  final DateTime createdAt;
  final String consultMode;

  Map<String, dynamic> toMap() => {
        'appointmentId': appointmentId,
        'patientId': patientId,
        'doctorId': doctorId,
        'doctorName': doctorName,
        'stars': stars,
        'tags': tags,
        'createdAt': createdAt.toIso8601String(),
        if (consultMode.isNotEmpty) 'consultMode': consultMode,
        'source': 'suwasiri_app',
      };

  factory DoctorRating.fromMap(String id, Map<String, dynamic> map) {
    return DoctorRating(
      appointmentId: map['appointmentId'] as String? ?? id,
      patientId: map['patientId'] as String? ?? '',
      doctorId: map['doctorId'] as String? ?? '',
      doctorName: map['doctorName'] as String? ?? '',
      stars: (map['stars'] as num?)?.toInt() ?? 0,
      tags: (map['tags'] as List<dynamic>? ?? const [])
          .map((e) => '$e')
          .where((e) => e.isNotEmpty)
          .toList(),
      createdAt:
          DateTime.tryParse(map['createdAt'] as String? ?? '') ?? DateTime.now(),
      consultMode: map['consultMode'] as String? ?? '',
    );
  }

  @override
  List<Object?> get props => [
        appointmentId,
        patientId,
        doctorId,
        doctorName,
        stars,
        tags,
        createdAt,
        consultMode,
      ];
}
