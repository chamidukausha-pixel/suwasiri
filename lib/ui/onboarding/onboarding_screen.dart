import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../localization/app_localizations.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  static const seenKey = 'suwasiri_onboarding_seen';

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final _page = PageController();
  int _index = 0;

  Future<void> _finish() async {
    // Marked via auth flow's SharedPreferences in navigator callback
    Navigator.of(context).pushReplacementNamed('/auth', arguments: true);
  }

  @override
  void dispose() {
    _page.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final cards = [
      _CardData(
        icon: Icons.emergency_rounded,
        color: AppColors.emergencyRed,
        title: l.t('onboardSosTitle'),
        body: l.t('onboardSosBody'),
      ),
      _CardData(
        icon: Icons.vaccines_rounded,
        color: AppColors.emerald,
        title: l.t('onboardVaxTitle'),
        body: l.t('onboardVaxBody'),
      ),
      _CardData(
        icon: Icons.folder_special_rounded,
        color: AppColors.trustBlue,
        title: l.t('onboardVaultTitle'),
        body: l.t('onboardVaultBody'),
      ),
    ];

    return Scaffold(
      backgroundColor: AppColors.canvas,
      body: SafeArea(
        child: Column(
          children: [
            Align(
              alignment: Alignment.centerRight,
              child: TextButton(
                onPressed: _finish,
                child: Text(l.t('skip')),
              ),
            ),
            Expanded(
              child: PageView.builder(
                controller: _page,
                itemCount: cards.length,
                onPageChanged: (i) => setState(() => _index = i),
                itemBuilder: (_, i) {
                  final c = cards[i];
                  return Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 28),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          width: 120,
                          height: 120,
                          decoration: BoxDecoration(
                            color: c.color.withValues(alpha: 0.12),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(c.icon, size: 56, color: c.color),
                        ),
                        const SizedBox(height: 36),
                        Text(
                          c.title,
                          textAlign: TextAlign.center,
                          style: Theme.of(context).textTheme.headlineMedium,
                        ),
                        const SizedBox(height: 16),
                        Text(
                          c.body,
                          textAlign: TextAlign.center,
                          style: Theme.of(context).textTheme.bodyLarge,
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(
                cards.length,
                (i) => AnimatedContainer(
                  duration: const Duration(milliseconds: 250),
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  width: _index == i ? 24 : 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: _index == i
                        ? AppColors.trustBlue
                        : AppColors.border,
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 24, 24, 16),
              child: FilledButton(
                onPressed: () {
                  if (_index < cards.length - 1) {
                    _page.nextPage(
                      duration: const Duration(milliseconds: 350),
                      curve: Curves.easeOut,
                    );
                  } else {
                    _finish();
                  }
                },
                child: Text(
                  _index < cards.length - 1 ? 'Next' : l.t('getStarted'),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CardData {
  const _CardData({
    required this.icon,
    required this.color,
    required this.title,
    required this.body,
  });

  final IconData icon;
  final Color color;
  final String title;
  final String body;
}
