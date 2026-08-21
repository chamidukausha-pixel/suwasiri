import 'package:equatable/equatable.dart';

class MetricReading extends Equatable {
  const MetricReading({
    required this.name,
    required this.value,
    required this.status,
    this.normalRange = '',
  });

  final String name;
  final String value;
  final String status; // normal | attention | critical
  final String normalRange;

  Map<String, dynamic> toMap() => {
        'name': name,
        'value': value,
        'status': status,
        'normalRange': normalRange,
      };

  factory MetricReading.fromMap(Map<String, dynamic> map) => MetricReading(
        name: map['name'] as String? ?? '',
        value: map['value'] as String? ?? '',
        status: map['status'] as String? ?? 'normal',
        normalRange: map['normalRange'] as String? ?? '',
      );

  @override
  List<Object?> get props => [name, value, status, normalRange];
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
    this.clinicalComments = '',
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
  final String clinicalComments;

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
        'clinicalComments': clinicalComments,
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
      clinicalComments: map['clinicalComments'] as String? ?? '',
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
        clinicalComments,
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
    this.prescriberNumber = '1234567',
    this.source = '',
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
  /// Doctor registration / issued number shown on the formal script.
  final String prescriberNumber;
  /// `gp_care` when issued from Sri Lankan GP Care; empty for in-app samples.
  final String source;

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
    String? prescriberNumber,
    String? source,
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
      prescriberNumber: prescriberNumber ?? this.prescriberNumber,
      source: source ?? this.source,
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
        'prescriberNumber': prescriberNumber,
        if (source.isNotEmpty) 'source': source,
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
      prescriberNumber: map['prescriberNumber'] as String? ?? '1234567',
      source: map['source'] as String? ?? '',
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
        prescriberNumber,
        source,
      ];
}

/// Latest doctor-issued script that is not yet sent to MediLanka.
List<Prescription> latestPendingPrescription(List<Prescription> all) {
  final pending = all.where((p) => !p.sentToPharmacare).toList();
  final gpCare = pending.where((p) => p.source == 'gp_care').toList();
  final pool = gpCare.isNotEmpty ? gpCare : pending;
  pool.sort(
    (a, b) =>
        (b.issuedAt ?? DateTime(0)).compareTo(a.issuedAt ?? DateTime(0)),
  );
  if (pool.isEmpty) return const [];
  final code = pool.first.code;
  return pool.where((p) => p.code == code).toList();
}

String prescriptionScriptNumber(List<Prescription> medicines) {
  final raw = medicines.isNotEmpty ? medicines.first.code : '';
  final digits = raw.replaceAll(RegExp(r'[^0-9]'), '');
  if (digits.isEmpty) return '00003194';
  final padded = digits.padLeft(8, '0');
  return padded.substring(padded.length - 8);
}
