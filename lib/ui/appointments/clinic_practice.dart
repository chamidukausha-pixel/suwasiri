import '../../data/models/appointment.dart';

/// One clinic / medical centre grouped from Firestore + catalog doctors.
class ClinicPractice {
  const ClinicPractice({
    required this.key,
    required this.name,
    required this.address,
    required this.region,
    required this.doctors,
    this.hospitalId = '',
    this.branchId = '',
    this.latitude,
    this.longitude,
    this.clinicOnly = false,
    this.logoUrl,
  });

  final String key;
  final String name;
  final String address;
  final String region;
  final List<Doctor> doctors;
  final String hospitalId;
  final String branchId;
  final double? latitude;
  final double? longitude;
  final bool clinicOnly;
  final String? logoUrl;

  List<Doctor> get practitioners =>
      doctors.where((d) => !d.isClinicOnly).toList();

  Doctor? get primaryDoctor {
    final list = practitioners;
    if (list.isEmpty) return doctors.isNotEmpty ? doctors.first : null;
    list.sort((a, b) => b.rating.compareTo(a.rating));
    return list.first;
  }

  String get placeLabel {
    final parts = <String>[name];
    if (address.isNotEmpty) parts.add(address);
    if (region.isNotEmpty) parts.add(region);
    return parts.join(', ');
  }
}

String clinicPracticeKey(Doctor doctor) {
  if (doctor.hospitalId.isNotEmpty) return 'hid:${doctor.hospitalId}';
  if (doctor.id.startsWith('center-')) return doctor.id;
  final name = doctor.hospital.trim().toLowerCase();
  return name.isEmpty ? 'doctor:${doctor.id}' : 'name:$name';
}

List<ClinicPractice> groupDoctorsIntoPractices(List<Doctor> doctors) {
  final buckets = <String, List<Doctor>>{};
  for (final d in doctors) {
    final key = clinicPracticeKey(d);
    buckets.putIfAbsent(key, () => []).add(d);
  }

  final practices = <ClinicPractice>[];
  for (final entry in buckets.entries) {
    final list = List<Doctor>.from(entry.value);
    list.sort((a, b) {
      if (a.isClinicOnly != b.isClinicOnly) {
        return a.isClinicOnly ? 1 : -1;
      }
      return b.rating.compareTo(a.rating);
    });
    final anchor = list.firstWhere(
      (d) => d.hospital.isNotEmpty,
      orElse: () => list.first,
    );
    final clinicOnly = list.every((d) => d.isClinicOnly);
    final logo = list
        .map((d) => d.logoUrl)
        .firstWhere((u) => u != null && u.trim().isNotEmpty, orElse: () => null);
    practices.add(
      ClinicPractice(
        key: entry.key,
        name: anchor.hospital.isNotEmpty ? anchor.hospital : anchor.name,
        address: anchor.address,
        region: anchor.region,
        doctors: list,
        hospitalId: anchor.hospitalId,
        branchId: anchor.branchId,
        latitude: anchor.latitude,
        longitude: anchor.longitude,
        clinicOnly: clinicOnly,
        logoUrl: logo,
      ),
    );
  }

  practices.sort((a, b) {
    if (a.clinicOnly != b.clinicOnly) return a.clinicOnly ? 1 : -1;
    return a.name.toLowerCase().compareTo(b.name.toLowerCase());
  });
  return practices;
}
