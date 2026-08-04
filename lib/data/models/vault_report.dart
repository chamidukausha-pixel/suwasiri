import 'package:equatable/equatable.dart';

class MetricReading extends Equatable {
  const MetricReading({
    required this.name,
    required this.value,
    required this.status,
  });

  final String name;
  final String value;
  final String status; // normal | attention | critical

  Map<String, dynamic> toMap() => {
        'name': name,
        'value': value,
        'status': status,
      };

  factory MetricReading.fromMap(Map<String, dynamic> map) => MetricReading(
        name: map['name'] as String? ?? '',
        value: map['value'] as String? ?? '',
        status: map['status'] as String? ?? 'normal',
      );

  @override
  List<Object?> get props => [name, value, status];
}

class VaultReport extends Equatable {
  const VaultReport({
    required this.id,
    required this.patientId,
    required this.title,
    required this.issuedBy,
    required this.date,
    this.fileUrl,
    this.metrics = const [],
  });

  final String id;
  final String patientId;
  final String title;
  final String issuedBy; // LankaLab | GP
  final DateTime date;
  final String? fileUrl;
  final List<MetricReading> metrics;

  Map<String, dynamic> toMap() => {
        'patientId': patientId,
        'title': title,
        'issuedBy': issuedBy,
        'date': date.toIso8601String(),
        'fileUrl': fileUrl,
        'metrics': metrics.map((m) => m.toMap()).toList(),
      };

  factory VaultReport.fromMap(String id, Map<String, dynamic> map) {
    return VaultReport(
      id: id,
      patientId: map['patientId'] as String? ?? '',
      title: map['title'] as String? ?? '',
      issuedBy: map['issuedBy'] as String? ?? '',
      date: DateTime.tryParse(map['date'] as String? ?? '') ?? DateTime.now(),
      fileUrl: map['fileUrl'] as String?,
      metrics: (map['metrics'] as List<dynamic>?)
              ?.map((e) => MetricReading.fromMap(e as Map<String, dynamic>))
              .toList() ??
          const [],
    );
  }

  @override
  List<Object?> get props =>
      [id, patientId, title, issuedBy, date, fileUrl, metrics];
}

class Prescription extends Equatable {
  const Prescription({
    required this.id,
    required this.medicine,
    required this.doctor,
    required this.code,
    required this.active,
  });

  final String id;
  final String medicine;
  final String doctor;
  final String code;
  final bool active;

  @override
  List<Object?> get props => [id, medicine, doctor, code, active];
}
