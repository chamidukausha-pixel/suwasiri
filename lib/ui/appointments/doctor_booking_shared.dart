import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/theme/app_colors.dart';
import '../../core/utils/map_launcher.dart';
import '../../data/models/appointment.dart';
import '../../localization/app_localizations.dart';

/// HotDoc-style forest green used for primary booking CTAs.
const bookingGreen = Color(0xFF217D4C);

class DoctorAvatar extends StatelessWidget {
  const DoctorAvatar({
    super.key,
    required this.doctor,
    this.radius = 36,
    this.circular = true,
  });

  final Doctor doctor;
  final double radius;
  final bool circular;

  @override
  Widget build(BuildContext context) {
    final initial = doctor.name.replaceAll(RegExp(r'^Dr\.?\s*'), '').trim();
    final letter = initial.isNotEmpty ? initial[0].toUpperCase() : 'D';
    final size = radius * 2;

    Widget image = ClinicMediaImage(
      url: doctor.displayPhotoUrl,
      width: size,
      height: size,
      fallback: _fallback(size, letter),
    );

    if (circular) {
      return CircleAvatar(radius: radius, backgroundColor: AppColors.trustBlueSoft, child: ClipOval(child: image));
    }
    return ClipRRect(
      borderRadius: BorderRadius.circular(12),
      child: SizedBox(width: size, height: size, child: image),
    );
  }

  Widget _fallback(double size, String letter) {
    return Container(
      width: size,
      height: size,
      color: AppColors.trustBlueSoft,
      alignment: Alignment.center,
      child: Text(
        letter,
        style: TextStyle(
          color: AppColors.trustBlue,
          fontWeight: FontWeight.w800,
          fontSize: radius * 0.65,
        ),
      ),
    );
  }
}

class BookAppointmentButton extends StatelessWidget {
  const BookAppointmentButton({
    super.key,
    required this.onPressed,
    this.labelKey = 'bookAppointment',
  });

  final VoidCallback onPressed;
  final String labelKey;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    return SizedBox(
      width: double.infinity,
      height: 52,
      child: FilledButton(
        onPressed: onPressed,
        style: FilledButton.styleFrom(
          backgroundColor: bookingGreen,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          textStyle: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
        ),
        child: Text(l.t(labelKey)),
      ),
    );
  }
}

class ClinicContactRow extends StatelessWidget {
  const ClinicContactRow({
    super.key,
    required this.label,
    required this.actionLabel,
    required this.onAction,
  });

  final String label;
  final String actionLabel;
  final VoidCallback onAction;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 14),
      child: Row(
        children: [
          Expanded(
            child: Text(
              label,
              style: const TextStyle(
                color: AppColors.trustBlueDark,
                fontSize: 14,
                height: 1.35,
              ),
            ),
          ),
          TextButton(
            onPressed: onAction,
            style: TextButton.styleFrom(
              foregroundColor: AppColors.trustBlue,
              padding: const EdgeInsets.symmetric(horizontal: 8),
              minimumSize: Size.zero,
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
            ),
            child: Text(
              actionLabel,
              style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
            ),
          ),
        ],
      ),
    );
  }
}

Future<void> openClinicMap({
  required String address,
  double? latitude,
  double? longitude,
}) async {
  await MapLauncher.openGoogleMaps(
    address: address,
    latitude: latitude,
    longitude: longitude,
  );
}

Future<void> dialClinicPhone(String raw) async {
  final digits = raw.replaceAll(RegExp(r'[^\d+]'), '');
  if (digits.isEmpty) return;
  final uri = Uri.parse('tel:$digits');
  if (await canLaunchUrl(uri)) {
    await launchUrl(uri);
  }
}

String formatSlotChip(DateTime slot) => DateFormat('h:mma').format(slot).toLowerCase();

String formatNextAvailable(DateTime slot) =>
    DateFormat('d MMM, h:mm a').format(slot);

String clinicPhoneForRegion(String region) {
  final r = region.toLowerCase();
  if (r.contains('kandy')) return '081 222 3456';
  if (r.contains('galle')) return '091 223 4567';
  return '011 234 5678';
}

class ClinicLogoPlaceholder extends StatelessWidget {
  const ClinicLogoPlaceholder({super.key, this.size = 56, this.imageUrl});

  final double size;
  final String? imageUrl;

  @override
  Widget build(BuildContext context) {
    final url = imageUrl?.trim() ?? '';
    return ClipRRect(
      borderRadius: BorderRadius.circular(10),
      child: SizedBox(
        width: size,
        height: size,
        child: url.isEmpty
            ? Container(
                decoration: BoxDecoration(
                  color: AppColors.trustBlueSoft,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: AppColors.border),
                ),
                child: const Icon(
                  Icons.local_hospital_outlined,
                  color: AppColors.trustBlue,
                ),
              )
            : ClinicMediaImage(
                url: url,
                width: size,
                height: size,
                fallback: Container(
                  color: AppColors.trustBlueSoft,
                  alignment: Alignment.center,
                  child: const Icon(
                    Icons.local_hospital_outlined,
                    color: AppColors.trustBlue,
                  ),
                ),
              ),
      ),
    );
  }
}

/// Network URL or `data:image/...;base64,` from GP Care when Storage is unavailable.
class ClinicMediaImage extends StatelessWidget {
  const ClinicMediaImage({
    super.key,
    required this.url,
    required this.width,
    required this.height,
    required this.fallback,
  });

  final String url;
  final double width;
  final double height;
  final Widget fallback;

  @override
  Widget build(BuildContext context) {
    if (url.startsWith('data:image')) {
      try {
        final b64 = url.split(',').last;
        return Image.memory(
          base64Decode(b64),
          width: width,
          height: height,
          fit: BoxFit.cover,
          errorBuilder: (_, _, _) => fallback,
        );
      } catch (_) {
        return fallback;
      }
    }
    return Image.network(
      url,
      width: width,
      height: height,
      fit: BoxFit.cover,
      loadingBuilder: (_, child, progress) {
        if (progress == null) return child;
        return fallback;
      },
      errorBuilder: (_, _, _) => fallback,
    );
  }
}
