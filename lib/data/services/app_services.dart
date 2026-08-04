import 'package:firebase_core/firebase_core.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../core/constants/app_constants.dart';
import '../../firebase_options.dart';
import '../repositories/auth_repository.dart';
import '../repositories/demo_auth_repository.dart';
import '../repositories/demo_health_repository.dart';
import '../repositories/firebase_auth_repository.dart';
import '../repositories/firebase_health_repository.dart';
import '../repositories/health_repository.dart';
import '../services/sos_service.dart';

/// Service locator — Firebase in production; demo only via [forTesting].
class AppServices {
  AppServices._({
    required this.auth,
    required this.health,
    required this.sos,
    required this.prefs,
  });

  final AuthRepository auth;
  final HealthRepository health;
  final SosService sos;
  final SharedPreferences prefs;

  /// Local-only wiring for widget/unit tests (no Firebase).
  factory AppServices.forTesting(SharedPreferences prefs) {
    return AppServices._(
      auth: DemoAuthRepository(prefs),
      health: DemoHealthRepository(prefs),
      sos: SosService(),
      prefs: prefs,
    );
  }

  static Future<AppServices> bootstrap() async {
    final prefs = await SharedPreferences.getInstance();

    // Escape hatch for local offline demos — must stay false in production builds.
    if (AppConstants.useDemoBackend) {
      return AppServices.forTesting(prefs);
    }

    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );

    return AppServices._(
      auth: FirebaseAuthRepository(),
      health: FirebaseHealthRepository(prefs),
      sos: SosService(),
      prefs: prefs,
    );
  }
}
