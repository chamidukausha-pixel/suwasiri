import 'dart:async';
import 'dart:convert';

import 'package:local_auth/local_auth.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';

import '../models/user_profile.dart';
import 'auth_repository.dart';

/// Local demo auth — works without Firebase configuration.
class DemoAuthRepository implements AuthRepository {
  DemoAuthRepository(this._prefs);

  final SharedPreferences _prefs;
  final _controller = StreamController<UserProfile?>.broadcast();
  final _uuid = const Uuid();
  final _localAuth = LocalAuthentication();

  static const _keyUser = 'suwasiri_demo_user';
  static const _keySession = 'suwasiri_demo_session';

  @override
  Stream<UserProfile?> authStateChanges() async* {
    yield await currentUser();
    yield* _controller.stream;
  }

  @override
  Future<UserProfile?> currentUser() async {
    final session = _prefs.getBool(_keySession) ?? false;
    if (!session) return null;
    final raw = _prefs.getString(_keyUser);
    if (raw == null) return null;
    final map = jsonDecode(raw) as Map<String, dynamic>;
    return UserProfile.fromMap(map['id'] as String, map);
  }

  Future<void> _persist(UserProfile user, {bool signedIn = true}) async {
    final map = user.toMap()..['id'] = user.id;
    await _prefs.setString(_keyUser, jsonEncode(map));
    await _prefs.setBool(_keySession, signedIn);
    _controller.add(signedIn ? user : null);
  }

  @override
  Future<UserProfile> signInWithEmail({
    required String email,
    required String password,
  }) async {
    if (password.length < 6) {
      throw Exception('Password must be at least 6 characters');
    }
    final existing = await currentUser();
    if (existing != null && existing.email == email) {
      await _prefs.setBool(_keySession, true);
      _controller.add(existing);
      return existing;
    }
    final raw = _prefs.getString(_keyUser);
    if (raw != null) {
      final map = jsonDecode(raw) as Map<String, dynamic>;
      if (map['email'] == email) {
        final user = UserProfile.fromMap(map['id'] as String, map);
        await _prefs.setBool(_keySession, true);
        _controller.add(user);
        return user;
      }
    }
    throw Exception('No account found. Please register first.');
  }

  @override
  Future<UserProfile> registerWithEmail({
    required String name,
    required String email,
    required String password,
  }) async {
    if (password.length < 6) {
      throw Exception('Password must be at least 6 characters');
    }
    final user = UserProfile(
      id: _uuid.v4(),
      name: name,
      email: email,
      ceylonHealthId: 'CH-${DateTime.now().millisecondsSinceEpoch % 1000000}',
    );
    await _persist(user);
    return user;
  }

  @override
  Future<UserProfile> signInWithPhoneDemo({
    required String phone,
    required String otp,
  }) async {
    if (otp != '123456') {
      throw Exception('Invalid OTP. Use demo code 123456.');
    }
    final user = UserProfile(
      id: _uuid.v4(),
      name: 'Patient',
      email: '$phone@phone.suwasiri.lk',
      mobileNo: phone,
      ceylonHealthId: 'CH-${phone.hashCode.abs() % 1000000}',
    );
    await _persist(user);
    return user;
  }

  @override
  Future<UserProfile> signInWithGoogleDemo() async {
    final user = UserProfile(
      id: _uuid.v4(),
      name: 'Google Patient',
      email: 'patient@gmail.com',
      ceylonHealthId: 'CH-GOOGLE',
    );
    await _persist(user);
    return user;
  }

  @override
  Future<void> updateProfile(UserProfile profile) async {
    await _persist(profile);
  }

  @override
  Future<void> signOut() async {
    await _prefs.setBool(_keySession, false);
    _controller.add(null);
  }

  @override
  Future<bool> authenticateBiometrics() async {
    try {
      final can = await _localAuth.canCheckBiometrics ||
          await _localAuth.isDeviceSupported();
      if (!can) return true; // allow vault in demo/simulator
      return _localAuth.authenticate(
        localizedReason: 'Unlock Suwasiri Health Vault',
        options: const AuthenticationOptions(biometricOnly: true),
      );
    } catch (_) {
      return true;
    }
  }
}
