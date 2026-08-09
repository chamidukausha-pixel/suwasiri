import '../models/appointment.dart';

/// Curated specialist directory for Doctors tab filters + catalog.
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

  static final List<Doctor> doctors = _buildDoctors();

  static const _hospitals = <(String, String, String, double, double, String)>[
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
      'Hemas Hospitals Wattala',
      '389 Negombo Road, Wattala',
      'Gampaha',
      6.9892,
      79.8914,
      'Mon–Sat · 09:00–13:00',
    ),
    (
      'Teaching Hospital Kandy',
      'William Gopallawa Mawatha, Kandy',
      'Kandy',
      7.2906,
      80.6337,
      'Mon–Wed · 08:00–12:00',
    ),
  ];

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

  static List<Doctor> _buildDoctors() {
    final specialties = categories.where((c) => c != 'All').toList();
    final list = <Doctor>[];
    var nameIdx = 0;
    var id = 1;

    for (final specialty in specialties) {
      for (var slot = 0; slot < 3; slot++) {
        final hospital = _hospitals[(id + slot) % _hospitals.length];
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
            hospital: hospital.$1,
            address: hospital.$2,
            region: hospital.$3,
            latitude: hospital.$4,
            longitude: hospital.$5,
            nextAvailable: hospital.$6,
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
    return list;
  }
}
