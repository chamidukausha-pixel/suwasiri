import 'dart:async';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:local_auth/local_auth.dart';

import '../models/user_profile.dart';
import 'auth_repository.dart';

/// Firebase Auth + Firestore `users/{uid}` profile store.
class FirebaseAuthRepository implements AuthRepository {
  FirebaseAuthRepository({
    FirebaseAuth? auth,
    FirebaseFirestore? firestore,
    GoogleSignIn? googleSignIn,
    LocalAuthentication? localAuth,
  })  : _auth = auth ?? FirebaseAuth.instance,
        _db = firestore ?? FirebaseFirestore.instance,
        _googleSignIn = googleSignIn ?? GoogleSignIn(),
        _localAuth = localAuth ?? LocalAuthentication();

  final FirebaseAuth _auth;
  final FirebaseFirestore _db;
  final GoogleSignIn _googleSignIn;
  final LocalAuthentication _localAuth;

  CollectionReference<Map<String, dynamic>> get _users =>
      _db.collection('users');

  @override
  Stream<UserProfile?> authStateChanges() {
    return _auth.authStateChanges().asyncMap((user) async {
      if (user == null) return null;
      return _loadProfile(user);
    });
  }

  @override
  Future<UserProfile?> currentUser() async {
    final user = _auth.currentUser;
    if (user == null) return null;
    return _loadProfile(user);
  }

  Future<UserProfile> _loadProfile(User user) async {
    final snap = await _users.doc(user.uid).get();
    if (snap.exists && snap.data() != null) {
      return UserProfile.fromMap(user.uid, snap.data()!);
    }
    final profile = UserProfile(
      id: user.uid,
      name: user.displayName ?? 'Patient',
      email: user.email ?? '',
      mobileNo: user.phoneNumber,
      ceylonHealthId: 'CH-${user.uid.hashCode.abs() % 1000000}',
    );
    await _users.doc(user.uid).set(profile.toMap(), SetOptions(merge: true));
    return profile;
  }

  Future<UserProfile> _afterAuth(User user, {String? name}) async {
    final existing = await _users.doc(user.uid).get();
    if (existing.exists && existing.data() != null) {
      return UserProfile.fromMap(user.uid, existing.data()!);
    }
    final profile = UserProfile(
      id: user.uid,
      name: name ?? user.displayName ?? 'Patient',
      email: user.email ?? '',
      mobileNo: user.phoneNumber,
      ceylonHealthId: 'CH-${user.uid.hashCode.abs() % 1000000}',
    );
    await _users.doc(user.uid).set(profile.toMap());
    return profile;
  }

  @override
  Future<UserProfile> signInWithEmail({
    required String email,
    required String password,
  }) async {
    final cred = await _auth.signInWithEmailAndPassword(
      email: email.trim(),
      password: password,
    );
    return _afterAuth(cred.user!);
  }

  @override
  Future<UserProfile> registerWithEmail({
    required String name,
    required String email,
    required String password,
  }) async {
    final cred = await _auth.createUserWithEmailAndPassword(
      email: email.trim(),
      password: password,
    );
    await cred.user!.updateDisplayName(name);
    return _afterAuth(cred.user!, name: name);
  }

  /// Phone flow uses Firebase email/password under a synthetic address until
  /// native Phone Auth / reCAPTCHA is configured. Demo OTP remains `123456`.
  @override
  Future<UserProfile> signInWithPhoneDemo({
    required String phone,
    required String otp,
  }) async {
    if (otp != '123456') {
      throw Exception('Invalid OTP. Use demo code 123456.');
    }
    final normalized = phone.replaceAll(RegExp(r'\s+'), '');
    final email = '$normalized@phone.suwasiri.lk';
    final password = 'Suwasiri!$normalized';
    try {
      final cred = await _auth.signInWithEmailAndPassword(
        email: email,
        password: password,
      );
      return _afterAuth(cred.user!);
    } on FirebaseAuthException catch (e) {
      if (e.code != 'user-not-found' && e.code != 'invalid-credential') {
        rethrow;
      }
      final cred = await _auth.createUserWithEmailAndPassword(
        email: email,
        password: password,
      );
      return _afterAuth(cred.user!, name: 'Patient');
    }
  }

  @override
  Future<UserProfile> signInWithGoogleDemo() async {
    final googleUser = await _googleSignIn.signIn();
    if (googleUser == null) {
      throw Exception('Google sign-in cancelled');
    }
    final googleAuth = await googleUser.authentication;
    final credential = GoogleAuthProvider.credential(
      accessToken: googleAuth.accessToken,
      idToken: googleAuth.idToken,
    );
    final cred = await _auth.signInWithCredential(credential);
    return _afterAuth(cred.user!);
  }

  @override
  Future<void> updateProfile(UserProfile profile) async {
    await _users.doc(profile.id).set(profile.toMap(), SetOptions(merge: true));
    final user = _auth.currentUser;
    if (user != null && profile.name.isNotEmpty) {
      await user.updateDisplayName(profile.name);
    }
  }

  @override
  Future<void> signOut() async {
    await Future.wait([
      _auth.signOut(),
      _googleSignIn.signOut(),
    ]);
  }

  @override
  Future<bool> authenticateBiometrics() async {
    try {
      final can = await _localAuth.canCheckBiometrics ||
          await _localAuth.isDeviceSupported();
      if (!can) return true;
      return _localAuth.authenticate(
        localizedReason: 'Unlock Suwasiri Health Vault',
        options: const AuthenticationOptions(biometricOnly: true),
      );
    } catch (_) {
      return true;
    }
  }
}
