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
    'Kalutara',
    'Kandy',
    'Matale',
    'Nuwara Eliya',
    'Galle',
    'Matara',
    'Hambantota',
    'Jaffna',
    'Kilinochchi',
    'Mannar',
    'Vavuniya',
    'Mullaitivu',
    'Batticaloa',
    'Ampara',
    'Trincomalee',
    'Kurunegala',
    'Puttalam',
    'Anuradhapura',
    'Polonnaruwa',
    'Badulla',
    'Monaragala',
    'Ratnapura',
    'Kegalle',
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
