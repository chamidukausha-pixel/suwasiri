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

  String get latitudeLabel {
    final hemi = latitude >= 0 ? 'N' : 'S';
    return '${latitude.abs().toStringAsFixed(6)}° $hemi';
  }

  String get longitudeLabel {
    final hemi = longitude >= 0 ? 'E' : 'W';
    return '${longitude.abs().toStringAsFixed(6)}° $hemi';
  }

  /// Human precision label for dispatcher UI.
  String get precisionStatus {
    if (accuracyMeters <= 20) return 'GPS Fixed';
    if (accuracyMeters <= 80) return 'GPS Safe';
    return 'Cell-Tower Triangulated';
  }

  bool get isGpsSafe => accuracyMeters <= 80;

  Map<String, dynamic> toMap() => {
        'latitude': latitude,
        'longitude': longitude,
        'accuracyMeters': accuracyMeters,
        'address': address,
      };

  factory SosLocation.fromMap(Map<String, dynamic> map) {
    return SosLocation(
      latitude: (map['latitude'] as num).toDouble(),
      longitude: (map['longitude'] as num).toDouble(),
      accuracyMeters: (map['accuracyMeters'] as num?)?.toDouble() ?? 999,
      address: map['address'] as String?,
    );
  }

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
