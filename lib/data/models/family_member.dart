import 'package:equatable/equatable.dart';

import 'user_profile.dart';

/// In-app family member under the signed-in main applicant account.
///
/// Each [profile.id] is a household patient id (`{ownerUid}` or
/// `{ownerUid}_wife` / `_child`) so bookings, vault, vaccines and payments
/// stay isolated while Firestore rules still authorize the owner session.
class FamilyMember extends Equatable {
  const FamilyMember({
    required this.key,
    required this.relationLabel,
    required this.profile,
  });

  final String key;
  final String relationLabel;
  final UserProfile profile;

  Map<String, dynamic> toMap() => {
        'key': key,
        'relationLabel': relationLabel,
        'profile': {
          'id': profile.id,
          ...profile.toMap(),
        },
      };

  factory FamilyMember.fromMap(Map<String, dynamic> map) {
    final raw = map['profile'];
    final profileMap = raw is Map
        ? Map<String, dynamic>.from(raw)
        : <String, dynamic>{};
    final id = profileMap['id'] as String? ?? '';
    return FamilyMember(
      key: map['key'] as String? ?? 'member',
      relationLabel: map['relationLabel'] as String? ?? 'Family',
      profile: UserProfile.fromMap(id, profileMap),
    );
  }

  @override
  List<Object?> get props => [key, relationLabel, profile];
}
