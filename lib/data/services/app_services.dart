import 'package:shared_preferences/shared_preferences.dart';

import '../../core/constants/app_constants.dart';
import '../repositories/auth_repository.dart';
import '../repositories/demo_auth_repository.dart';
import '../repositories/demo_health_repository.dart';
import '../repositories/health_repository.dart';
import '../services/sos_service.dart';

/// Service locator — wires demo or Firebase backends.
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

  static Future<AppServices> bootstrap() async {
    final prefs = await SharedPreferences.getInstance();
    // Firebase path reserved for when useDemoBackend == false and options exist.
    if (AppConstants.useDemoBackend) {
      return AppServices._(
        auth: DemoAuthRepository(prefs),
        health: DemoHealthRepository(prefs),
        sos: SosService(),
        prefs: prefs,
      );
    }
    // Fallback still uses demo until Firebase options are generated.
    return AppServices._(
      auth: DemoAuthRepository(prefs),
      health: DemoHealthRepository(prefs),
      sos: SosService(),
      prefs: prefs,
    );
  }
}
