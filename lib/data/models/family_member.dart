import 'package:equatable/equatable.dart';

import 'user_profile.dart';

/// In-app family member selector (prototype).
///
/// Note: For now these members reuse the same `profile.id` (the signed-in
/// user's uid) so all existing Firestore security rules keep working.
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

