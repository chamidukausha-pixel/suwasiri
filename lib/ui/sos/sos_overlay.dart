import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../bloc/sos/sos_cubit.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_theme.dart';
import '../../localization/app_localizations.dart';

Future<void> showSosOverlay(BuildContext context) {
  return showGeneralDialog(
    context: context,
    barrierDismissible: false,
    barrierLabel: 'SOS',
    barrierColor: Colors.black54,
    pageBuilder: (_, animation, secondaryAnimation) => const SosOverlay(),
  );
}

class SosOverlay extends StatelessWidget {
  const SosOverlay({super.key});

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    return Material(
      color: Colors.transparent,
      child: SafeArea(
        child: Center(
          child: Container(
            margin: const EdgeInsets.all(20),
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppColors.emergencyRed, width: 2),
            ),
            child: BlocBuilder<SosCubit, SosState>(
              builder: (context, state) {
                final loc = state.location;
                return Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.emergency, color: AppColors.emergencyRed),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Suwasariya 1990',
                            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                  color: AppColors.emergencyRed,
                                ),
                          ),
                        ),
                        IconButton(
                          onPressed: () {
                            context.read<SosCubit>().reset();
                            Navigator.of(context).pop();
                          },
                          icon: const Icon(Icons.close),
                        ),
                      ],
                    ),
                    if (state.phase == SosPhase.locating)
                      const Padding(
                        padding: EdgeInsets.all(24),
                        child: Center(child: CircularProgressIndicator()),
                      )
                    else ...[
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppColors.emergencyRedSoft,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              l.t('streamingGps'),
                              style: const TextStyle(fontWeight: FontWeight.w700),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              loc?.coordinateLabel ?? '—',
                              style: AppTheme.mono(
                                fontSize: 14,
                                color: AppColors.cosmicSlate,
                              ),
                            ),
                            Text(
                              '±${loc?.accuracyMeters.toStringAsFixed(0) ?? '—'} m',
                              style: AppTheme.mono(
                                fontSize: 12,
                                color: AppColors.slateMuted,
                              ),
                            ),
                            if (loc?.address != null) ...[
                              const SizedBox(height: 6),
                              Text(loc!.address!),
                            ],
                            const SizedBox(height: 8),
                            Text(
                              state.dialed
                                  ? 'Dialer opened for 1990'
                                  : 'Dialer unavailable — call 1990 manually',
                              style: Theme.of(context).textTheme.bodyMedium,
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        l.t('cprTitle'),
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      const SizedBox(height: 8),
                      Text(l.t('cprSteps')),
                    ],
                  ],
                );
              },
            ),
          ),
        ),
      ),
    );
  }
}
