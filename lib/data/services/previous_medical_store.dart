import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';

import '../models/previous_medical_folder.dart';

/// Local persistence for Previous Medical History folders (per patient).
abstract final class PreviousMedicalStore {
  static const _uuid = Uuid();

  static String _key(String patientId) => 'suwasiri_prev_med_$patientId';

  static Future<List<PreviousMedicalFolder>> load(
    SharedPreferences prefs,
    String patientId,
  ) async {
    final raw = prefs.getString(_key(patientId));
    if (raw == null || raw.isEmpty) return const [];
    try {
      final list = jsonDecode(raw) as List<dynamic>;
      return list
          .whereType<Map>()
          .map((e) => PreviousMedicalFolder.fromMap(
                Map<String, dynamic>.from(e),
              ))
          .where((f) => f.patientId == patientId)
          .toList()
        ..sort((a, b) =>
            (b.updatedAt ?? DateTime(0)).compareTo(a.updatedAt ?? DateTime(0)));
    } catch (_) {
      return const [];
    }
  }

  static Future<void> save(
    SharedPreferences prefs,
    String patientId,
    List<PreviousMedicalFolder> folders,
  ) async {
    final encoded = jsonEncode(folders.map((f) => f.toMap()).toList());
    await prefs.setString(_key(patientId), encoded);
  }

  static PreviousMedicalFolder create({
    required String patientId,
    required String title,
    String notes = '',
    int? eventYear,
  }) {
    return PreviousMedicalFolder(
      id: _uuid.v4(),
      patientId: patientId,
      title: title.trim().isEmpty ? 'Medical history' : title.trim(),
      notes: notes,
      eventYear: eventYear,
      imagePaths: const [],
      updatedAt: DateTime.now(),
    );
  }
}
