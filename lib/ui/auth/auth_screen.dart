import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../bloc/auth/auth_cubit.dart';
import '../../bloc/locale/locale_cubit.dart';
import '../../core/theme/app_colors.dart';
import '../../localization/app_localizations.dart';
import '../onboarding/onboarding_screen.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabs;
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _name = TextEditingController();
  final _phone = TextEditingController();
  final _otp = TextEditingController();

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 3, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final mark = ModalRoute.of(context)?.settings.arguments == true;
      if (mark) {
        context
            .read<LocaleCubit>()
            .prefs
            .setBool(OnboardingScreen.seenKey, true);
      }
    });
  }

  @override
  void dispose() {
    _tabs.dispose();
    _email.dispose();
    _password.dispose();
    _name.dispose();
    _phone.dispose();
    _otp.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    return BlocConsumer<AuthCubit, AuthState>(
      listener: (context, state) {
        if (state.status == AuthStatus.authenticated) {
          final user = state.user!;
          if (!user.isProfileComplete) {
            Navigator.of(context).pushReplacementNamed('/register-profile');
          } else {
            Navigator.of(context).pushReplacementNamed('/main');
          }
        }
        if (state.error != null) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(state.error!)),
          );
        }
      },
      builder: (context, state) {
        return Scaffold(
          body: SafeArea(
            child: ListView(
              padding: const EdgeInsets.all(24),
              children: [
                const SizedBox(height: 12),
                Text(
                  l.t('appName'),
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                        color: AppColors.trustBlue,
                      ),
                ),
                const SizedBox(height: 4),
                Text(l.t('tagline')),
                const SizedBox(height: 24),
                TabBar(
                  controller: _tabs,
                  labelColor: AppColors.trustBlue,
                  tabs: [
                    Tab(text: l.t('login')),
                    const Tab(text: 'OTP'),
                    Tab(text: l.t('register')),
                  ],
                ),
                SizedBox(
                  height: 360,
                  child: TabBarView(
                    controller: _tabs,
                    children: [
                      _EmailForm(
                        email: _email,
                        password: _password,
                        loading: state.loading,
                        isRegister: false,
                        onSubmit: () => context
                            .read<AuthCubit>()
                            .signInEmail(_email.text.trim(), _password.text),
                      ),
                      _PhoneForm(
                        phone: _phone,
                        otp: _otp,
                        loading: state.loading,
                        onSubmit: () => context.read<AuthCubit>().signInPhone(
                              _phone.text.trim(),
                              _otp.text.trim(),
                            ),
                      ),
                      _EmailForm(
                        email: _email,
                        password: _password,
                        name: _name,
                        loading: state.loading,
                        isRegister: true,
                        onSubmit: () => context.read<AuthCubit>().register(
                              _name.text.trim(),
                              _email.text.trim(),
                              _password.text,
                            ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
                OutlinedButton.icon(
                  onPressed: state.loading
                      ? null
                      : () => context.read<AuthCubit>().signInGoogle(),
                  icon: const Icon(Icons.g_mobiledata_rounded, size: 28),
                  label: Text(l.t('continueWithGoogle')),
                ),
                const SizedBox(height: 12),
                Text(
                  'Demo OTP: 123456 · Demo mode (no Firebase config required)',
                  style: Theme.of(context).textTheme.bodyMedium,
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _EmailForm extends StatelessWidget {
  const _EmailForm({
    required this.email,
    required this.password,
    required this.loading,
    required this.isRegister,
    required this.onSubmit,
    this.name,
  });

  final TextEditingController email;
  final TextEditingController password;
  final TextEditingController? name;
  final bool loading;
  final bool isRegister;
  final VoidCallback onSubmit;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    return Padding(
      padding: const EdgeInsets.only(top: 20),
      child: Column(
        children: [
          if (isRegister) ...[
            TextField(
              controller: name,
              decoration: const InputDecoration(
                labelText: 'Full name',
                prefixIcon: Icon(Icons.person_outline),
              ),
            ),
            const SizedBox(height: 12),
          ],
          TextField(
            controller: email,
            keyboardType: TextInputType.emailAddress,
            decoration: InputDecoration(
              labelText: l.t('email'),
              prefixIcon: const Icon(Icons.email_outlined),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: password,
            obscureText: true,
            decoration: InputDecoration(
              labelText: l.t('password'),
              prefixIcon: const Icon(Icons.lock_outline),
            ),
          ),
          const Spacer(),
          FilledButton(
            onPressed: loading ? null : onSubmit,
            child: loading
                ? const SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : Text(isRegister ? l.t('register') : l.t('login')),
          ),
        ],
      ),
    );
  }
}

class _PhoneForm extends StatelessWidget {
  const _PhoneForm({
    required this.phone,
    required this.otp,
    required this.loading,
    required this.onSubmit,
  });

  final TextEditingController phone;
  final TextEditingController otp;
  final bool loading;
  final VoidCallback onSubmit;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    return Padding(
      padding: const EdgeInsets.only(top: 20),
      child: Column(
        children: [
          TextField(
            controller: phone,
            keyboardType: TextInputType.phone,
            decoration: InputDecoration(
              labelText: l.t('phone'),
              prefixIcon: const Icon(Icons.phone_android),
              hintText: '+94 7X XXX XXXX',
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: otp,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(
              labelText: 'OTP code',
              prefixIcon: Icon(Icons.sms_outlined),
            ),
          ),
          const Spacer(),
          FilledButton(
            onPressed: loading ? null : onSubmit,
            child: Text(l.t('login')),
          ),
        ],
      ),
    );
  }
}
