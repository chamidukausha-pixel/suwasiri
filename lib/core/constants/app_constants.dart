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

  /// Maps stored / typed blood groups onto [bloodGroups], or null if unknown.
  static String? canonicalBloodGroup(String? raw) {
    if (raw == null) return null;
    final n = raw.trim().toUpperCase().replaceAll(RegExp(r'\s+'), '');
    if (n.isEmpty) return null;
    for (final g in bloodGroups) {
      if (g.toUpperCase() == n) return g;
    }
    return null;
  }
}
