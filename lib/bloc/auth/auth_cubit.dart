import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../data/models/user_profile.dart';
import '../../data/models/family_member.dart';
import '../../data/repositories/auth_repository.dart';

enum AuthStatus { unknown, authenticated, unauthenticated }

class AuthState extends Equatable {
  const AuthState({
    this.status = AuthStatus.unknown,
    this.user,
    this.error,
    this.loading = false,
    this.familyMembers = const [],
    this.activeFamilyKey,
    this.ownerUid,
  });

  final AuthStatus status;
  /// Active profile (Chamidu / Sakuni / Denuk). `user.id` is the data patientId.
  final UserProfile? user;
  final String? error;
  final bool loading;
  final List<FamilyMember> familyMembers;
  final String? activeFamilyKey;
  /// Firebase Auth uid of the main applicant (Chamidu). SOS / account ownership.
  final String? ownerUid;

  AuthState copyWith({
    AuthStatus? status,
    UserProfile? user,
    String? error,
    bool? loading,
    bool clearUser = false,
    bool clearError = false,
    List<FamilyMember>? familyMembers,
    String? activeFamilyKey,
    String? ownerUid,
  }) {
    return AuthState(
      status: status ?? this.status,
      user: clearUser ? null : (user ?? this.user),
      error: clearError ? null : (error ?? this.error),
      loading: loading ?? this.loading,
      familyMembers: familyMembers ?? this.familyMembers,
      activeFamilyKey: activeFamilyKey ?? this.activeFamilyKey,
      ownerUid: ownerUid ?? this.ownerUid,
    );
  }

  @override
  List<Object?> get props => [
        status,
        user,
        error,
        loading,
        familyMembers,
        activeFamilyKey,
        ownerUid,
      ];
}

class AuthCubit extends Cubit<AuthState> {
  AuthCubit(this._auth) : super(const AuthState()) {
    _auth.authStateChanges().listen((user) async {
      if (user == null) {
        emit(const AuthState(status: AuthStatus.unauthenticated));
        return;
      }

      await _initFamilyMembers(owner: user);
    });
  }

  final AuthRepository _auth;

  // Prototype keys for in-app family member selection.
  static const String _kOwner = 'owner';
  static const String _kWife = 'wife';
  static const String _kChild = 'child';

  Future<void> _initFamilyMembers({required UserProfile owner}) async {
    // Family profiles under Chamidu's Firebase account.
    // Each member has a unique patientId `{ownerUid}_{key}` so Home / Doctors /
    // Call / Vault / Vaccines / Billing stay fully isolated — Firestore rules
    // allow these household ids for the signed-in owner.
    final wifeId = '${owner.id}_wife';
    final childId = '${owner.id}_child';

    final wife = UserProfile(
      id: wifeId,
      name: 'Sakuni Pathirana',
      email: owner.email,
      nic: '199456789V',
      mobileNo: owner.mobileNo,
      bloodGroup: 'B+',
      region: owner.region,
      dateOfBirth: DateTime(1994, 5, 20),
      ceylonHealthId: 'CH-WIFE-${wifeId.hashCode.abs() % 1000000}',
    ).withEnsuredBarcode();

    final child = UserProfile(
      id: childId,
      name: 'Denuk Rathnayake',
      email: owner.email,
      nic: null,
      mobileNo: null,
      bloodGroup: owner.bloodGroup,
      region: owner.region,
      dateOfBirth: DateTime(2026, 4, 1),
      ceylonHealthId: 'CH-CHILD-${childId.hashCode.abs() % 1000000}',
    ).withEnsuredBarcode();

    final members = <FamilyMember>[
      FamilyMember(
        key: _kOwner,
        relationLabel: 'Main Applicant',
        profile: owner,
      ),
      FamilyMember(
        key: _kWife,
        relationLabel: 'Wife',
        profile: wife,
      ),
      FamilyMember(
        key: _kChild,
        relationLabel: 'Child',
        profile: child,
      ),
    ];

    emit(AuthState(
      status: AuthStatus.authenticated,
      user: members.firstWhere((m) => m.key == _kOwner).profile,
      familyMembers: members,
      activeFamilyKey: _kOwner,
      ownerUid: owner.id,
      loading: false,
    ));
  }

  bool get _isFamilyOwner =>
      state.activeFamilyKey == null || state.activeFamilyKey == _kOwner;

  bool get isActiveOwner => _isFamilyOwner;

  /// Active profile patient id (Chamidu / Sakuni / Denuk) for bookings & vault.
  String? get activePatientId => state.user?.id;

  /// Main applicant Firebase uid (always Chamidu for SOS / account ownership).
  String? get ownerUid {
    if (state.ownerUid != null) return state.ownerUid;
    for (final m in state.familyMembers) {
      if (m.key == _kOwner) return m.profile.id;
    }
    return state.user?.id;
  }

  Future<void> selectFamilyMember(String key) async {
    if (state.familyMembers.isEmpty) return;
    final found = state.familyMembers.where((m) => m.key == key).toList();
    if (found.isEmpty) return;
    final member = found.first;
    emit(state.copyWith(
      user: member.profile,
      activeFamilyKey: key,
      ownerUid: state.ownerUid,
      clearError: true,
    ));
  }

  /// Prototype: adds/updates family member inside in-memory list.
  Future<void> upsertFamilyMember({
    required String key,
    required String relationLabel,
    required UserProfile profile,
    bool selectAfter = true,
  }) async {
    final current = state.familyMembers;
    final ensured = profile.withEnsuredBarcode();
    final updated = <FamilyMember>[];
    var touched = false;
    for (final m in current) {
      if (m.key == key) {
        updated.add(FamilyMember(key: key, relationLabel: relationLabel, profile: ensured));
        touched = true;
      } else {
        updated.add(m);
      }
    }
    if (!touched) {
      updated.add(FamilyMember(key: key, relationLabel: relationLabel, profile: ensured));
    }

    emit(state.copyWith(
      familyMembers: updated,
      user: selectAfter ? ensured : state.user,
      activeFamilyKey: selectAfter ? key : state.activeFamilyKey,
    ));
  }

  Future<void> bootstrap() async {
    final user = await _auth.currentUser();
    if (user == null) {
      emit(const AuthState(status: AuthStatus.unauthenticated));
    } else {
      await _initFamilyMembers(owner: user);
    }
  }

  Future<void> signInEmail(String email, String password) async {
    emit(state.copyWith(loading: true, clearError: true));
    try {
      final user =
          await _auth.signInWithEmail(email: email, password: password);
      await _initFamilyMembers(owner: user);
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
      await _initFamilyMembers(owner: user);
    } catch (e) {
      emit(state.copyWith(loading: false, error: e.toString()));
    }
  }

  Future<void> signInPhone(String phone, String otp) async {
    emit(state.copyWith(loading: true, clearError: true));
    try {
      final user =
          await _auth.signInWithPhoneDemo(phone: phone, otp: otp);
      await _initFamilyMembers(owner: user);
    } catch (e) {
      emit(state.copyWith(loading: false, error: e.toString()));
    }
  }

  Future<void> signInGoogle() async {
    emit(state.copyWith(loading: true, clearError: true));
    try {
      final user = await _auth.signInWithGoogleDemo();
      await _initFamilyMembers(owner: user);
    } catch (e) {
      emit(state.copyWith(loading: false, error: e.toString()));
    }
  }

  Future<void> updateProfile(UserProfile profile) async {
    emit(state.copyWith(loading: true, clearError: true));
    try {
      final ensured = profile.withEnsuredBarcode();
      await _auth.updateProfile(ensured);
      // Keep prototype family in-memory, but update the owner profile values.
      if (state.familyMembers.isNotEmpty) {
        final updated = state.familyMembers.map((m) {
          if (m.key != _kOwner) return m;
          return FamilyMember(key: _kOwner, relationLabel: m.relationLabel, profile: ensured);
        }).toList();

        emit(state.copyWith(
          user: state.activeFamilyKey == _kOwner ? ensured : state.user,
          familyMembers: updated,
        ));
      } else {
        // Fallback: rebuild family.
        await _initFamilyMembers(owner: ensured);
      }
    } catch (e) {
      emit(state.copyWith(loading: false, error: e.toString()));
    }
  }

  Future<bool> unlockVault() => _auth.authenticateBiometrics();

  Future<void> signOut() => _auth.signOut();
}
