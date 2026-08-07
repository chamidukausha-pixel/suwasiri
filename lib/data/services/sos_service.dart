import 'dart:async';

import 'package:geocoding/geocoding.dart';
import 'package:geolocator/geolocator.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/constants/app_constants.dart';
import '../models/sos_location.dart';

/// Suwasariya 1990 SOS — GPS + dialer integration.
class SosService {
  StreamSubscription<Position>? _liveSub;

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

  /// High accuracy for emergency incident pin.
  Future<SosLocation> fetchLiveLocation() async {
    final position = await Geolocator.getCurrentPosition(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: 5,
        timeLimit: Duration(seconds: 20),
      ),
    );
    return _fromPosition(position);
  }

  /// Continuous updates while dispatcher share is approved.
  Stream<SosLocation> watchLiveLocation() {
    return Geolocator.getPositionStream(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: 8,
      ),
    ).asyncMap(_fromPosition);
  }

  Future<SosLocation> _fromPosition(Position position) async {
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

  Future<void> stopLiveWatch() async {
    await _liveSub?.cancel();
    _liveSub = null;
  }
}
