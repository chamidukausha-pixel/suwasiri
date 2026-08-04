import 'package:equatable/equatable.dart';

class SosLocation extends Equatable {
  const SosLocation({
    required this.latitude,
    required this.longitude,
    required this.accuracyMeters,
    this.address,
  });

  final double latitude;
  final double longitude;
  final double accuracyMeters;
  final String? address;

  String get coordinateLabel =>
      '${latitude.toStringAsFixed(6)}, ${longitude.toStringAsFixed(6)}';

  @override
  List<Object?> get props => [latitude, longitude, accuracyMeters, address];
}

class ChatMessage extends Equatable {
  const ChatMessage({
    required this.id,
    required this.senderId,
    required this.text,
    required this.timestamp,
    this.isMine = false,
    this.attachmentLabel,
  });

  final String id;
  final String senderId;
  final String text;
  final DateTime timestamp;
  final bool isMine;
  final String? attachmentLabel;

  @override
  List<Object?> get props =>
      [id, senderId, text, timestamp, isMine, attachmentLabel];
}
