import 'package:geocoding/geocoding.dart';
import 'package:geolocator/geolocator.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/constants/app_constants.dart';
import '../models/sos_location.dart';

/// Suwasariya 1990 SOS — GPS + dialer integration.
class SosService {
  Future<bool> ensureLocationPermission() async {
    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.deniedForever ||
        permission == LocationPermission.denied) {
      return false;
    }
    final enabled = await Geolocator.isLocationServiceEnabled();
    return enabled;
  }

  /// Balanced accuracy to limit battery drain during SOS.
  Future<SosLocation> fetchLiveLocation() async {
    final position = await Geolocator.getCurrentPosition(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.medium,
        distanceFilter: 10,
      ),
    );

    String? address;
    try {
      final places = await placemarkFromCoordinates(
        position.latitude,
        position.longitude,
      );
      if (places.isNotEmpty) {
        final p = places.first;
        address = [
          p.street,
          p.subLocality,
          p.locality,
          p.administrativeArea,
        ].whereType<String>().where((e) => e.isNotEmpty).join(', ');
      }
    } catch (_) {
      address = null;
    }

    return SosLocation(
      latitude: position.latitude,
      longitude: position.longitude,
      accuracyMeters: position.accuracy,
      address: address?.isEmpty == true ? null : address,
    );
  }

  Future<bool> dialEmergency() async {
    final uri = Uri.parse(AppConstants.emergencyDialUri);
    if (await canLaunchUrl(uri)) {
      return launchUrl(uri);
    }
    return false;
  }
}
