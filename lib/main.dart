import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

import 'bloc/auth/auth_cubit.dart';
import 'bloc/locale/locale_cubit.dart';
import 'bloc/notification/notification_cubit.dart';
import 'bloc/schedule/schedule_cubit.dart';
import 'bloc/sos/sos_cubit.dart';
import 'bloc/vaccine/vaccine_cubit.dart';
import 'bloc/vault/vault_cubit.dart';
import 'core/constants/app_constants.dart';
import 'core/theme/app_theme.dart';
import 'data/repositories/health_repository.dart';
import 'data/services/app_services.dart';
import 'localization/app_localizations.dart';
import 'ui/auth/auth_screen.dart';
import 'ui/auth/health_intake_screen.dart';
import 'ui/onboarding/onboarding_screen.dart';
import 'ui/shell/main_shell.dart';
import 'ui/splash/splash_screen.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final services = await AppServices.bootstrap();
  runApp(SuwasiriApp(services: services));
}

class SuwasiriApp extends StatelessWidget {
  const SuwasiriApp({super.key, required this.services});

  final AppServices services;

  @override
  Widget build(BuildContext context) {
    return MultiRepositoryProvider(
      providers: [
        RepositoryProvider<AppServices>.value(value: services),
        RepositoryProvider<HealthRepository>.value(value: services.health),
      ],
      child: MultiBlocProvider(
        providers: [
          BlocProvider(create: (_) => AuthCubit(services.auth, services.prefs)),
          BlocProvider(create: (_) => LocaleCubit(services.prefs)),
          BlocProvider(create: (_) => NotificationCubit(services.health)),
          BlocProvider(create: (_) => SosCubit(services.sos, services.health)),
          BlocProvider(create: (_) => VaccineCubit(services.health)),
          BlocProvider(create: (_) => VaultCubit(services.health, services.prefs)),
          BlocProvider(create: (_) => ScheduleCubit(services.health)),
        ],
        child: BlocBuilder<LocaleCubit, LocaleState>(
          builder: (context, localeState) {
            return MaterialApp(
              title: AppConstants.appName,
              debugShowCheckedModeBanner: false,
              theme: AppTheme.light(),
              darkTheme: AppTheme.dark(),
              themeMode: localeState.themeMode,
              locale: localeState.locale,
              supportedLocales: AppLocalizations.supportedLocales,
              localizationsDelegates: const [
                AppLocalizationsDelegate(),
                GlobalMaterialLocalizations.delegate,
                GlobalWidgetsLocalizations.delegate,
                GlobalCupertinoLocalizations.delegate,
              ],
              initialRoute: '/',
              routes: {
                '/': (_) => const SplashScreen(),
                '/onboarding': (_) => const OnboardingScreen(),
                '/auth': (_) => const AuthScreen(),
                '/register-profile': (_) => const HealthIntakeScreen(),
                '/main': (_) => const MainShell(),
              },
            );
          },
        ),
      ),
    );
  }
}
