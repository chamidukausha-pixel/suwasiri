import 'package:equatable/equatable.dart';

/// User-created prior medical history folder (surgery, illness, etc.).
class PreviousMedicalFolder extends Equatable {
  const PreviousMedicalFolder({
    required this.id,
    required this.patientId,
    required this.title,
    this.notes = '',
    this.eventYear,
    this.imagePaths = const [],
    this.updatedAt,
  });

  final String id;
  final String patientId;
  final String title;
  final String notes;
  final int? eventYear;
  final List<String> imagePaths;
  final DateTime? updatedAt;

  PreviousMedicalFolder copyWith({
    String? title,
    String? notes,
    int? eventYear,
    List<String>? imagePaths,
    DateTime? updatedAt,
  }) {
    return PreviousMedicalFolder(
      id: id,
      patientId: patientId,
      title: title ?? this.title,
      notes: notes ?? this.notes,
      eventYear: eventYear ?? this.eventYear,
      imagePaths: imagePaths ?? this.imagePaths,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  Map<String, dynamic> toMap() => {
        'id': id,
        'patientId': patientId,
        'title': title,
        'notes': notes,
        'eventYear': eventYear,
        'imagePaths': imagePaths,
        'updatedAt': (updatedAt ?? DateTime.now()).toIso8601String(),
      };

  factory PreviousMedicalFolder.fromMap(Map<String, dynamic> map) {
    return PreviousMedicalFolder(
      id: map['id'] as String? ?? '',
      patientId: map['patientId'] as String? ?? '',
      title: map['title'] as String? ?? '',
      notes: map['notes'] as String? ?? '',
      eventYear: (map['eventYear'] as num?)?.toInt(),
      imagePaths: (map['imagePaths'] as List?)
              ?.map((e) => e.toString())
              .toList() ??
          const [],
      updatedAt: DateTime.tryParse(map['updatedAt'] as String? ?? ''),
    );
  }

  @override
  List<Object?> get props =>
      [id, patientId, title, notes, eventYear, imagePaths, updatedAt];
}
