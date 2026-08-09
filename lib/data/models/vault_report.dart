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
    this.category,
    this.facility,
    this.requestedBy,
    this.fileSizeMb,
    this.kind = VaultRecordKind.lab,
    this.batchCode,
  });

  final String id;
  final String patientId;
  final String title;
  final String issuedBy; // LankaLab | GP | MOH | …
  final DateTime date;
  final String? fileUrl;
  final List<MetricReading> metrics;
  final String? category;
  final String? facility;
  final String? requestedBy;
  final double? fileSizeMb;
  final VaultRecordKind kind;
  final String? batchCode;

  bool get readyForAi => metrics.isNotEmpty || kind == VaultRecordKind.lab;

  Map<String, dynamic> toMap() => {
        'patientId': patientId,
        'title': title,
        'issuedBy': issuedBy,
        'date': date.toIso8601String(),
        'fileUrl': fileUrl,
        'metrics': metrics.map((m) => m.toMap()).toList(),
        'category': category,
        'facility': facility,
        'requestedBy': requestedBy,
        'fileSizeMb': fileSizeMb,
        'kind': kind.name,
        'batchCode': batchCode,
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
      category: map['category'] as String?,
      facility: map['facility'] as String?,
      requestedBy: map['requestedBy'] as String?,
      fileSizeMb: (map['fileSizeMb'] as num?)?.toDouble(),
      kind: VaultRecordKind.values.firstWhere(
        (k) => k.name == map['kind'],
        orElse: () => VaultRecordKind.lab,
      ),
      batchCode: map['batchCode'] as String?,
    );
  }

  @override
  List<Object?> get props => [
        id,
        patientId,
        title,
        issuedBy,
        date,
        fileUrl,
        metrics,
        category,
        facility,
        requestedBy,
        fileSizeMb,
        kind,
        batchCode,
      ];
}

enum VaultRecordKind { lab, vaccine, upload }

class Prescription extends Equatable {
  const Prescription({
    required this.id,
    required this.medicine,
    required this.doctor,
    required this.code,
    required this.active,
    this.patientId = '',
    this.schedule = '',
    this.doseBadge = '',
    this.sessionId,
    this.sentToPharmacare = false,
    this.updating = false,
    this.issuedAt,
    this.clinicName = 'Lanka GP Care Virtual Clinic',
  });

  final String id;
  final String medicine;
  final String doctor;
  final String code;
  final bool active;
  final String patientId;
  final String schedule;
  final String doseBadge;
  final String? sessionId;
  final bool sentToPharmacare;
  final bool updating;
  final DateTime? issuedAt;
  final String clinicName;

  Prescription copyWith({
    String? id,
    String? medicine,
    String? doctor,
    String? code,
    bool? active,
    String? patientId,
    String? schedule,
    String? doseBadge,
    String? sessionId,
    bool? sentToPharmacare,
    bool? updating,
    DateTime? issuedAt,
    String? clinicName,
  }) {
    return Prescription(
      id: id ?? this.id,
      medicine: medicine ?? this.medicine,
      doctor: doctor ?? this.doctor,
      code: code ?? this.code,
      active: active ?? this.active,
      patientId: patientId ?? this.patientId,
      schedule: schedule ?? this.schedule,
      doseBadge: doseBadge ?? this.doseBadge,
      sessionId: sessionId ?? this.sessionId,
      sentToPharmacare: sentToPharmacare ?? this.sentToPharmacare,
      updating: updating ?? this.updating,
      issuedAt: issuedAt ?? this.issuedAt,
      clinicName: clinicName ?? this.clinicName,
    );
  }

  Map<String, dynamic> toMap() => {
        'patientId': patientId,
        'medicine': medicine,
        'doctor': doctor,
        'code': code,
        'active': active,
        'schedule': schedule,
        'doseBadge': doseBadge,
        'sessionId': sessionId,
        'sentToPharmacare': sentToPharmacare,
        'updating': updating,
        'issuedAt': (issuedAt ?? DateTime.now()).toIso8601String(),
        'clinicName': clinicName,
      };

  factory Prescription.fromMap(String id, Map<String, dynamic> map) {
    return Prescription(
      id: id,
      medicine: map['medicine'] as String? ?? '',
      doctor: map['doctor'] as String? ?? '',
      code: map['code'] as String? ?? '',
      active: map['active'] as bool? ?? true,
      patientId: map['patientId'] as String? ?? '',
      schedule: map['schedule'] as String? ?? '',
      doseBadge: map['doseBadge'] as String? ?? '',
      sessionId: map['sessionId'] as String?,
      sentToPharmacare: map['sentToPharmacare'] as bool? ?? false,
      updating: map['updating'] as bool? ?? false,
      issuedAt: map['issuedAt'] != null
          ? DateTime.tryParse(map['issuedAt'] as String)
          : null,
      clinicName: map['clinicName'] as String? ?? 'Lanka GP Care Virtual Clinic',
    );
  }

  @override
  List<Object?> get props => [
        id,
        medicine,
        doctor,
        code,
        active,
        patientId,
        schedule,
        doseBadge,
        sessionId,
        sentToPharmacare,
        updating,
        issuedAt,
        clinicName,
      ];
}
