import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../data/models/appointment.dart';
import '../../localization/app_localizations.dart';
import '../theme/app_colors.dart';

/// Opens Google Maps or Apple Maps for a clinic place.
abstract final class MapLauncher {
  static Future<void> openGoogleMaps({
    required String address,
    double? latitude,
    double? longitude,
  }) async {
    final query = (latitude != null && longitude != null)
        ? '$latitude,$longitude'
        : Uri.encodeComponent(address);
    final uri = Uri.parse(
      'https://www.google.com/maps/search/?api=1&query=$query',
    );
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  static Future<void> openAppleMaps({
    required String address,
    double? latitude,
    double? longitude,
  }) async {
    final uri = (latitude != null && longitude != null)
        ? Uri.parse(
            'https://maps.apple.com/?ll=$latitude,$longitude&q=${Uri.encodeComponent(address)}',
          )
        : Uri.parse(
            'https://maps.apple.com/?q=${Uri.encodeComponent(address)}',
          );
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  static Future<void> showMapChoice(
    BuildContext context, {
    required Doctor doctor,
  }) {
    return showPlaceMapChoice(
      context,
      title: doctor.hospital,
      address: doctor.placeLabel,
      latitude: doctor.latitude,
      longitude: doctor.longitude,
    );
  }

  static Future<void> showPlaceMapChoice(
    BuildContext context, {
    required String title,
    required String address,
    double? latitude,
    double? longitude,
  }) {
    final l = AppLocalizations.of(context);

    return showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                l.t('openClinicInMaps'),
                style: const TextStyle(
                  fontWeight: FontWeight.w800,
                  fontSize: 16,
                  color: AppColors.trustBlueDark,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                title,
                style: const TextStyle(
                  fontWeight: FontWeight.w700,
                  color: AppColors.trustBlueDark,
                  fontSize: 14,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                address,
                style: const TextStyle(
                  color: AppColors.slateMuted,
                  fontSize: 13,
                  height: 1.35,
                ),
              ),
              const SizedBox(height: 14),
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const CircleAvatar(
                  backgroundColor: AppColors.trustBlueSoft,
                  child: Icon(Icons.map_outlined, color: AppColors.trustBlue),
                ),
                title: Text(l.t('openInGoogleMaps')),
                trailing: const Icon(Icons.chevron_right),
                onTap: () async {
                  Navigator.pop(ctx);
                  await openGoogleMaps(
                    address: address,
                    latitude: latitude,
                    longitude: longitude,
                  );
                },
              ),
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const CircleAvatar(
                  backgroundColor: Color(0xFFE8F5E9),
                  child: Icon(Icons.map, color: Color(0xFF2E7D32)),
                ),
                title: Text(l.t('openInAppleMaps')),
                trailing: const Icon(Icons.chevron_right),
                onTap: () async {
                  Navigator.pop(ctx);
                  await openAppleMaps(
                    address: address,
                    latitude: latitude,
                    longitude: longitude,
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}
