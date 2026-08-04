import '../models/user_profile.dart';

abstract class AuthRepository {
  Stream<UserProfile?> authStateChanges();

  Future<UserProfile?> currentUser();

  Future<UserProfile> signInWithEmail({
    required String email,
    required String password,
  });

  Future<UserProfile> registerWithEmail({
    required String name,
    required String email,
    required String password,
  });

  Future<UserProfile> signInWithPhoneDemo({
    required String phone,
    required String otp,
  });

  Future<UserProfile> signInWithGoogleDemo();

  Future<void> updateProfile(UserProfile profile);

  Future<void> signOut();

  Future<bool> authenticateBiometrics();
}
