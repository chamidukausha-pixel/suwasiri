/// App-wide constants for Suwasiri.
abstract final class AppConstants {
  static const String appName = 'Suwasiri';
  static const String emergencyNumber = '1990';
  static const String emergencyDialUri = 'tel:1990';

  /// Production uses Firebase Auth + Firestore.
  /// Keep `false`. Demo repos remain only for widget tests via [AppServices.forTesting].
  static const bool useDemoBackend = false;

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
