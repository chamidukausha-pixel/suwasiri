import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:suwasiri/data/services/app_services.dart';
import 'package:suwasiri/main.dart';
import 'package:suwasiri/ui/splash/splash_screen.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('Suwasiri boots to splash', (tester) async {
    SharedPreferences.setMockInitialValues({});
    final services = await AppServices.bootstrap();
    await tester.pumpWidget(SuwasiriApp(services: services));
    await tester.pump();
    expect(find.byType(SplashScreen), findsOneWidget);
    // Flush splash delay + animation timers.
    await tester.pump(const Duration(seconds: 3));
  });
}
