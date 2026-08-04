import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../data/models/user_profile.dart';
import '../../data/repositories/auth_repository.dart';

enum AuthStatus { unknown, authenticated, unauthenticated }

class AuthState extends Equatable {
  const AuthState({
    this.status = AuthStatus.unknown,
    this.user,
    this.error,
    this.loading = false,
  });

  final AuthStatus status;
  final UserProfile? user;
  final String? error;
  final bool loading;

  AuthState copyWith({
    AuthStatus? status,
    UserProfile? user,
    String? error,
    bool? loading,
    bool clearUser = false,
    bool clearError = false,
  }) {
    return AuthState(
      status: status ?? this.status,
      user: clearUser ? null : (user ?? this.user),
      error: clearError ? null : (error ?? this.error),
      loading: loading ?? this.loading,
    );
  }

  @override
  List<Object?> get props => [status, user, error, loading];
}

class AuthCubit extends Cubit<AuthState> {
  AuthCubit(this._auth) : super(const AuthState()) {
    _auth.authStateChanges().listen((user) {
      if (user == null) {
        emit(const AuthState(status: AuthStatus.unauthenticated));
      } else {
        emit(AuthState(status: AuthStatus.authenticated, user: user));
      }
    });
  }

  final AuthRepository _auth;

  Future<void> bootstrap() async {
    final user = await _auth.currentUser();
    if (user == null) {
      emit(const AuthState(status: AuthStatus.unauthenticated));
    } else {
      emit(AuthState(status: AuthStatus.authenticated, user: user));
    }
  }

  Future<void> signInEmail(String email, String password) async {
    emit(state.copyWith(loading: true, clearError: true));
    try {
      final user =
          await _auth.signInWithEmail(email: email, password: password);
      emit(AuthState(status: AuthStatus.authenticated, user: user));
    } catch (e) {
      emit(state.copyWith(loading: false, error: e.toString()));
    }
  }

  Future<void> register(String name, String email, String password) async {
    emit(state.copyWith(loading: true, clearError: true));
    try {
      final user = await _auth.registerWithEmail(
        name: name,
        email: email,
        password: password,
      );
      emit(AuthState(status: AuthStatus.authenticated, user: user));
    } catch (e) {
      emit(state.copyWith(loading: false, error: e.toString()));
    }
  }

  Future<void> signInPhone(String phone, String otp) async {
    emit(state.copyWith(loading: true, clearError: true));
    try {
      final user =
          await _auth.signInWithPhoneDemo(phone: phone, otp: otp);
      emit(AuthState(status: AuthStatus.authenticated, user: user));
    } catch (e) {
      emit(state.copyWith(loading: false, error: e.toString()));
    }
  }

  Future<void> signInGoogle() async {
    emit(state.copyWith(loading: true, clearError: true));
    try {
      final user = await _auth.signInWithGoogleDemo();
      emit(AuthState(status: AuthStatus.authenticated, user: user));
    } catch (e) {
      emit(state.copyWith(loading: false, error: e.toString()));
    }
  }

  Future<void> updateProfile(UserProfile profile) async {
    emit(state.copyWith(loading: true, clearError: true));
    try {
      await _auth.updateProfile(profile);
      emit(AuthState(status: AuthStatus.authenticated, user: profile));
    } catch (e) {
      emit(state.copyWith(loading: false, error: e.toString()));
    }
  }

  Future<bool> unlockVault() => _auth.authenticateBiometrics();

  Future<void> signOut() => _auth.signOut();
}
