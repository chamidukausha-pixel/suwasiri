/// App-wide constants for Suwasiri.
abstract final class AppConstants {
  static const String appName = 'Suwasiri';
  static const String emergencyNumber = '1990';
  static const String emergencyDialUri = 'tel:1990';

  /// When true, uses local demo repositories (no Firebase project required).
  /// Set to false after adding Firebase config (google-services.json / GoogleService-Info.plist).
  static const bool useDemoBackend = true;

  static const List<String> mohDistricts = [
    'Colombo',
    'Gampaha',
    'Kandy',
    'Galle',
  ];

  static const List<String> bloodGroups = [
    'A+',
    'A-',
    'B+',
    'B-',
    'AB+',
    'AB-',
    'O+',
    'O-',
  ];
}
