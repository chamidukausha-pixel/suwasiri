import 'package:equatable/equatable.dart';

enum NotificationPayloadType {
  vaccine,
  labResult,
  appointment,
  sync,
  system,
  dose,
}

class AppNotification extends Equatable {
  const AppNotification({
    required this.id,
    required this.title,
    required this.body,
    required this.timestamp,
    required this.type,
    this.read = false,
    this.patientId = '',
  });

  final String id;
  final String title;
  final String body;
  final DateTime timestamp;
  final NotificationPayloadType type;
  final bool read;
  final String patientId;

  AppNotification copyWith({bool? read}) => AppNotification(
        id: id,
        title: title,
        body: body,
        timestamp: timestamp,
        type: type,
        read: read ?? this.read,
        patientId: patientId,
      );

  Map<String, dynamic> toMap() => {
        'title': title,
        'body': body,
        'timestamp': timestamp.toIso8601String(),
        'type': type.name,
        'read': read,
        if (patientId.isNotEmpty) 'patientId': patientId,
      };

  factory AppNotification.fromMap(String id, Map<String, dynamic> map) {
    return AppNotification(
      id: id,
      title: map['title'] as String? ?? '',
      body: map['body'] as String? ?? '',
      timestamp:
          DateTime.tryParse(map['timestamp'] as String? ?? '') ?? DateTime.now(),
      type: NotificationPayloadType.values.firstWhere(
        (e) => e.name == map['type'],
        orElse: () => NotificationPayloadType.system,
      ),
      read: map['read'] as bool? ?? false,
      patientId: map['patientId'] as String? ?? map['userId'] as String? ?? '',
    );
  }

  @override
  List<Object?> get props => [id, title, body, timestamp, type, read, patientId];
}
