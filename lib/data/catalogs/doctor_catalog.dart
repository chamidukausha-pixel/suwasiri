import '../models/appointment.dart';
import '../../core/constants/app_constants.dart';

/// Curated specialist directory + registered clinics/hospitals by district.
abstract final class DoctorCatalog {
  static const categories = <String>[
    'All',
    'Physician / Consultant Physician',
    'Cardiologist',
    'Neurologist',
    'Pediatrician',
    'Dermatologist',
    'Psychiatrist',
    'Endocrinologist',
    'Nephrologist',
    'Oncologist',
    'Rheumatologist',
    'Hematologist',
    'Chest Physician / Pulmonologist',
    'General Practitioner',
    'Physiotherapist',
    'Orthopedic Surgeon',
    'Gastroenterologist',
    'Ophthalmologist',
    'ENT Surgeon',
    'Obstetrician / Gynecologist',
    'Urologist',
    'Dental Surgeon',
    'General Surgeon',
    'Radiologist',
  ];

  static final List<CatalogFacility> facilities = _buildFacilities();

  static final List<Doctor> doctors = _buildDoctors();

  static Doctor? doctorById(String id) {
    for (final d in doctors) {
      if (d.id == id) return d;
    }
    return null;
  }

  static Doctor? doctorByName(String name) {
    final n = name.trim().toLowerCase();
    if (n.isEmpty) return null;
    for (final d in doctors) {
      if (d.name.toLowerCase() == n) return d;
    }
    return null;
  }

  static List<CatalogFacility> facilitiesInDistrict(String? district) {
    if (district == null || district.isEmpty || district == 'All') {
      return List<CatalogFacility>.from(facilities);
    }
    return facilities.where((f) => f.region == district).toList();
  }

  static List<Doctor> doctorsAtFacility(String facilityName) {
    return doctors.where((d) => d.hospital == facilityName).toList();
  }

  static const _namePool = <String>[
    'Dr. Aruni Perera',
    'Dr. Sandeep Bandara',
    'Dr. Nimali Silva',
    'Dr. Kavinda Jayawardena',
    'Dr. Farah Mohamed',
    'Dr. Chaminda Fernando',
    'Dr. Ishara Wijesinghe',
    'Dr. Melani Gunasekara',
    'Dr. Ruwan Abeysekera',
    'Dr. Tharindu Pathirana',
    'Dr. Anusha Rathnayake',
    'Dr. Dilshan Karunaratne',
    'Dr. Priyanka Mendis',
    'Dr. Nuwan Silva',
    'Ms. Sanduni Herath',
    'Dr. Lakmal Dissanayake',
    'Dr. Hasini Wickramasinghe',
    'Dr. Renuka Jayasuriya',
    'Dr. Asela Perera',
    'Dr. Shalini Fernando',
    'Dr. Kasun Weerasinghe',
    'Dr. Dinithi Cooray',
    'Dr. Mahesh Gunawardena',
    'Dr. Janaki Amarasinghe',
    'Dr. Roshan De Silva',
    'Dr. Thilini Jayasinghe',
    'Dr. Amal Senanayake',
    'Dr. Fathima Razak',
    'Dr. Buddhika Rathnayaka',
    'Dr. Malithi Fonseka',
    'Dr. Harsha Wijeratne',
    'Dr. Nadeesha Kumarasinghe',
    'Dr. Ishan Perera',
    'Dr. Gayani Abeywardena',
    'Dr. Suranga Dias',
    'Dr. Pavithra Gunaratne',
    'Dr. Chamara Liyanage',
    'Dr. Sewwandi Rathnapriya',
    'Dr. Dinesh Samarakoon',
    'Dr. Ayesha Imtiaz',
    'Dr. Praveen Herath',
    'Dr. Niluka Chandrasena',
    'Dr. Sanjeewa Pieris',
    'Dr. Chathuri Wijesekara',
    'Dr. Imran Cassim',
    'Dr. Madhavi Ranasinghe',
    'Dr. Lahiru Ekanayake',
    'Dr. Thushari Peiris',
    'Dr. Gihan Abeykoon',
    'Dr. Ruwani Samaraweera',
    'Dr. Ajith Kumara',
    'Dr. Shehani Alwis',
    'Dr. Nalin Jayatilleke',
    'Dr. Dilhani Siriwardena',
    'Dr. Fazil Ameer',
    'Dr. Waruni Hapuarachchi',
    'Dr. Sameera Pathirage',
    'Dr. Oshadi Tennakoon',
    'Dr. Viraj Hapugoda',
    'Dr. Kaushalya Bandara',
    'Dr. Eranga Wijethunga',
    'Dr. Nirosha Liyanaarachchi',
    'Dr. Hashan Dayaratne',
    'Dr. Subhani Rodrigo',
    'Dr. Amila Hettiarachchi',
    'Dr. Yasara Nanayakkara',
    'Dr. Prasanna Alahakoon',
    'Dr. Shermila Wijesinghe',
    'Dr. Thusitha Ranatunga',
  ];

  /// Flagship hospitals (also used when assigning specialists).
  static const _flagship = <(String, String, String, double, double, String)>[
    (
      'Durdans Hospital',
      '3 Alfred Place, Colombo 03',
      'Colombo',
      6.9147,
      79.8489,
      'Mon–Thu · 09:30–12:00',
    ),
    (
      'Asiri Central Hospital',
      '114 Norris Canal Road, Colombo 10',
      'Colombo',
      6.9278,
      79.8614,
      'Tue–Sat · 10:00–14:00',
    ),
    (
      'Nawaloka Hospitals',
      '23 Deshamanya H K Dharmadasa Mawatha, Colombo 02',
      'Colombo',
      6.9219,
      79.8535,
      'Mon–Wed · 14:00–17:00',
    ),
    (
      'Lanka Hospitals',
      '578 Elvitigala Mawatha, Colombo 05',
      'Colombo',
      6.8915,
      79.8763,
      'Thu–Sat · 09:00–12:30',
    ),
    (
      'NHSL — National Hospital of Sri Lanka',
      'Regent Street, Colombo 10',
      'Colombo',
      6.9190,
      79.8640,
      'Mon–Fri · 08:00–14:00',
    ),
    (
      'Hemas Hospitals Wattala',
      '389 Negombo Road, Wattala',
      'Gampaha',
      6.9892,
      79.8914,
      'Mon–Sat · 09:00–13:00',
    ),
    (
      'Ragama Teaching Hospital',
      'Hospital Road, Ragama',
      'Gampaha',
      7.0270,
      79.9220,
      'Mon–Fri · 08:30–13:00',
    ),
    (
      'Teaching Hospital Kandy',
      'William Gopallawa Mawatha, Kandy',
      'Kandy',
      7.2906,
      80.6337,
      'Mon–Wed · 08:00–12:00',
    ),
    (
      'Karapitiya Teaching Hospital',
      'Karapitiya, Galle',
      'Galle',
      6.0670,
      80.2260,
      'Mon–Fri · 08:00–13:00',
    ),
    (
      'Teaching Hospital Jaffna',
      'Hospital Road, Jaffna',
      'Jaffna',
      9.6680,
      80.0140,
      'Mon–Fri · 08:00–12:30',
    ),
    (
      'Teaching Hospital Batticaloa',
      'Hospital Road, Batticaloa',
      'Batticaloa',
      7.7310,
      81.6740,
      'Mon–Fri · 08:30–12:30',
    ),
    (
      'Teaching Hospital Anuradhapura',
      'Hospital Junction, Anuradhapura',
      'Anuradhapura',
      8.3110,
      80.4030,
      'Mon–Fri · 08:00–13:00',
    ),
  ];

  /// Named medical centres searchable by clinic name.
  static const _featuredClinics =
      <(String, String, String, double, double, String)>[
    (
      'PrimeCare Medical Centre - Colombo Central',
      '42 Ward Place, Colombo 07',
      'Colombo',
      6.9142,
      79.8631,
      'Mon–Sat · 08:30–18:00',
    ),
    (
      'CityHealth Polyclinic - Nugegoda',
      '128 High Level Road, Nugegoda',
      'Colombo',
      6.8649,
      79.8997,
      'Mon–Sat · 09:00–17:00',
    ),
    (
      'LankaCare Specialist Centre - Dehiwala',
      '55 Galle Road, Dehiwala',
      'Colombo',
      6.8560,
      79.8650,
      'Tue–Sun · 09:00–16:30',
    ),
    (
      'GreenLeaf Family Clinic - Battaramulla',
      '12 Robert Gunawardena Mawatha, Battaramulla',
      'Colombo',
      6.8980,
      79.9180,
      'Mon–Fri · 08:00–16:00',
    ),
  ];

  static List<CatalogFacility> _buildFacilities() {
    final list = <CatalogFacility>[];
    var i = 0;
    for (final h in _flagship) {
      list.add(
        CatalogFacility(
          id: 'fac-h-$i',
          name: h.$1,
          address: h.$2,
          region: h.$3,
          latitude: h.$4,
          longitude: h.$5,
          hours: h.$6,
          type: FacilityKind.hospital,
        ),
      );
      i++;
    }

    var c = 0;
    for (final clinic in _featuredClinics) {
      list.add(
        CatalogFacility(
          id: 'fac-clinic-$c',
          name: clinic.$1,
          address: clinic.$2,
          region: clinic.$3,
          latitude: clinic.$4,
          longitude: clinic.$5,
          hours: clinic.$6,
          type: FacilityKind.clinic,
        ),
      );
      c++;
    }

    // District-registered MOH clinics + general hospitals for every district.
    const coords = <String, (double, double)>{
      'Colombo': (6.9271, 79.8612),
      'Gampaha': (7.0917, 79.9999),
      'Kalutara': (6.5854, 79.9607),
      'Kandy': (7.2906, 80.6337),
      'Matale': (7.4675, 80.6234),
      'Nuwara Eliya': (6.9497, 80.7891),
      'Galle': (6.0535, 80.2210),
      'Matara': (5.9549, 80.5550),
      'Hambantota': (6.1240, 81.1185),
      'Jaffna': (9.6615, 80.0255),
      'Kilinochchi': (9.3803, 80.3770),
      'Mannar': (8.9810, 79.9040),
      'Vavuniya': (8.7514, 80.4971),
      'Mullaitivu': (9.2670, 80.8140),
      'Batticaloa': (7.7310, 81.6747),
      'Ampara': (7.2970, 81.6820),
      'Trincomalee': (8.5874, 81.2152),
      'Kurunegala': (7.4863, 80.3620),
      'Puttalam': (8.0362, 79.8283),
      'Anuradhapura': (8.3114, 80.4037),
      'Polonnaruwa': (7.9403, 81.0188),
      'Badulla': (6.9934, 81.0550),
      'Monaragala': (6.8720, 81.3500),
      'Ratnapura': (6.6828, 80.3992),
      'Kegalle': (7.2513, 80.3464),
    };

    for (final district in AppConstants.mohDistricts) {
      final c = coords[district] ?? (7.0, 80.0);
      list.add(
        CatalogFacility(
          id: 'fac-moh-$district',
          name: 'MOH Clinic, $district',
          address: 'MOH Office, $district District',
          region: district,
          latitude: c.$1,
          longitude: c.$2,
          hours: 'Mon–Fri · 08:30–12:30',
          type: FacilityKind.clinic,
        ),
      );
      list.add(
        CatalogFacility(
          id: 'fac-gh-$district',
          name: 'General Hospital, $district',
          address: 'Hospital Road, $district',
          region: district,
          latitude: c.$1 + 0.01,
          longitude: c.$2 + 0.01,
          hours: 'Daily · 08:00–16:00',
          type: FacilityKind.hospital,
        ),
      );
    }

    // Deduplicate by name (flagship may overlap district GH names).
    final seen = <String>{};
    return list.where((f) => seen.add(f.name)).toList();
  }

  static CatalogFacility? _facilityByName(String name) {
    for (final f in facilities) {
      if (f.name == name) return f;
    }
    return null;
  }

  static Doctor _doctorAt({
    required String id,
    required String name,
    required String specialty,
    required CatalogFacility facility,
    required double rating,
    required int yearsExperience,
    required int feeLkr,
    required String bio,
  }) {
    return Doctor(
      id: id,
      name: name,
      specialty: specialty,
      hospital: facility.name,
      address: facility.address,
      region: facility.region,
      latitude: facility.latitude,
      longitude: facility.longitude,
      nextAvailable: facility.hours,
      rating: rating,
      yearsExperience: yearsExperience,
      feeLkr: feeLkr,
      bio: bio,
    );
  }

  static List<Doctor> _buildDoctors() {
    final specialties = categories.where((c) => c != 'All').toList();
    final hubs = facilities
        .where((f) => f.type == FacilityKind.hospital)
        .toList();
    final list = <Doctor>[];
    var nameIdx = 0;
    var id = 1;

    if (hubs.isNotEmpty) {
      final home = hubs.first;
      list.add(
        Doctor(
          id: 'd-samantha',
          name: 'Dr. Samantha Silva',
          specialty: 'Physician / Consultant Physician',
          hospital: home.name,
          address: home.address,
          region: home.region,
          latitude: home.latitude,
          longitude: home.longitude,
          nextAvailable: home.hours,
          rating: 4.9,
          yearsExperience: 16,
          feeLkr: 3500,
          bio:
              'General Medicine specialist providing accredited Sri Lankan hospital care.',
        ),
      );
    }

    // Featured clinic clinicians (searchable by clinic name).
    final primeCare =
        _facilityByName('PrimeCare Medical Centre - Colombo Central');
    if (primeCare != null) {
      list.addAll([
        _doctorAt(
          id: 'd-priyantha-silva',
          name: 'Dr. Priyantha Silva',
          specialty: 'Cardiologist',
          facility: primeCare,
          rating: 4.9,
          yearsExperience: 18,
          feeLkr: 4500,
          bio:
              'Consultant cardiologist at PrimeCare Medical Centre — Colombo Central.',
        ),
        _doctorAt(
          id: 'd-anoja-senanayake',
          name: 'Dr. Anoja Senanayake',
          specialty: 'Dermatologist',
          facility: primeCare,
          rating: 4.8,
          yearsExperience: 14,
          feeLkr: 4000,
          bio:
              'Consultant dermatologist at PrimeCare Medical Centre — Colombo Central.',
        ),
        _doctorAt(
          id: 'd-primecare-gp',
          name: 'Dr. Malsha Jayawardena',
          specialty: 'General Practitioner',
          facility: primeCare,
          rating: 4.7,
          yearsExperience: 11,
          feeLkr: 2500,
          bio: 'Family physician at PrimeCare Medical Centre — Colombo Central.',
        ),
      ]);
    }

    final cityHealth = _facilityByName('CityHealth Polyclinic - Nugegoda');
    if (cityHealth != null) {
      list.addAll([
        _doctorAt(
          id: 'd-cityhealth-pedia',
          name: 'Dr. Ruwanthi Perera',
          specialty: 'Pediatrician',
          facility: cityHealth,
          rating: 4.8,
          yearsExperience: 12,
          feeLkr: 3200,
          bio: 'Pediatric consultant at CityHealth Polyclinic — Nugegoda.',
        ),
        _doctorAt(
          id: 'd-cityhealth-ent',
          name: 'Dr. Suresh Mendis',
          specialty: 'ENT Surgeon',
          facility: cityHealth,
          rating: 4.7,
          yearsExperience: 15,
          feeLkr: 3800,
          bio: 'ENT surgeon at CityHealth Polyclinic — Nugegoda.',
        ),
      ]);
    }

    final lankaCare =
        _facilityByName('LankaCare Specialist Centre - Dehiwala');
    if (lankaCare != null) {
      list.addAll([
        _doctorAt(
          id: 'd-lankacare-endo',
          name: 'Dr. Nimali Fernando',
          specialty: 'Endocrinologist',
          facility: lankaCare,
          rating: 4.8,
          yearsExperience: 16,
          feeLkr: 4200,
          bio: 'Endocrinology consultant at LankaCare Specialist Centre.',
        ),
        _doctorAt(
          id: 'd-lankacare-ortho',
          name: 'Dr. Kasun Abeysekera',
          specialty: 'Orthopedic Surgeon',
          facility: lankaCare,
          rating: 4.7,
          yearsExperience: 13,
          feeLkr: 4800,
          bio: 'Orthopedic surgeon at LankaCare Specialist Centre — Dehiwala.',
        ),
      ]);
    }

    final greenLeaf =
        _facilityByName('GreenLeaf Family Clinic - Battaramulla');
    if (greenLeaf != null) {
      list.add(
        _doctorAt(
          id: 'd-greenleaf-gp',
          name: 'Dr. Tharaka Wickramasinghe',
          specialty: 'General Practitioner',
          facility: greenLeaf,
          rating: 4.6,
          yearsExperience: 9,
          feeLkr: 2200,
          bio: 'Family doctor at GreenLeaf Family Clinic — Battaramulla.',
        ),
      );
    }

    for (final specialty in specialties) {
      for (var slot = 0; slot < 3; slot++) {
        final hospital = hubs[(id + slot) % hubs.length];
        final name = _namePool[nameIdx % _namePool.length];
        nameIdx++;
        final years = 8 + ((id * 3 + slot) % 14);
        final fee = 1500 + ((id + slot * 7) % 21) * 100;
        final rating = 4.5 + ((id + slot) % 5) * 0.1;

        list.add(
          Doctor(
            id: 'd$id',
            name: name,
            specialty: specialty,
            hospital: hospital.name,
            address: hospital.address,
            region: hospital.region,
            latitude: hospital.latitude,
            longitude: hospital.longitude,
            nextAvailable: hospital.hours,
            rating: double.parse(rating.clamp(4.5, 4.9).toStringAsFixed(1)),
            yearsExperience: years,
            feeLkr: fee,
            bio:
                '$specialty providing accredited Sri Lankan hospital care with patient-centred consults.',
          ),
        );
        id++;
      }
    }

    // Ensure every district hospital/clinic has at least one GP for browseability.
    var extra = 9000;
    for (final f in facilities) {
      final already = list.any((d) => d.hospital == f.name);
      if (already) continue;
      final name = _namePool[extra % _namePool.length];
      list.add(
        Doctor(
          id: 'd$extra',
          name: name,
          specialty: f.type == FacilityKind.clinic
              ? 'General Practitioner'
              : 'General Practitioner',
          hospital: f.name,
          address: f.address,
          region: f.region,
          latitude: f.latitude,
          longitude: f.longitude,
          nextAvailable: f.hours,
          rating: 4.6,
          yearsExperience: 10,
          feeLkr: 2000,
          bio: 'Registered clinician at ${f.name}.',
        ),
      );
      extra++;
    }
    return list;
  }
}

enum FacilityKind { clinic, hospital }

class CatalogFacility {
  const CatalogFacility({
    required this.id,
    required this.name,
    required this.address,
    required this.region,
    required this.latitude,
    required this.longitude,
    required this.hours,
    required this.type,
  });

  final String id;
  final String name;
  final String address;
  final String region;
  final double latitude;
  final double longitude;
  final String hours;
  final FacilityKind type;

  String get placeLabel => '$name, $address, $region';
}
