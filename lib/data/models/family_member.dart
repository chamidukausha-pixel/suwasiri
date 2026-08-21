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

  @override
  List<Object?> get props => [key, relationLabel, profile];
}

