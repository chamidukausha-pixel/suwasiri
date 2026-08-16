import '../catalogs/doctor_catalog.dart';
import '../models/appointment.dart';

/// Structured Help Desk answer (text + optional doctor suggestions).
class HelpDeskAnswer {
  const HelpDeskAnswer({
    required this.text,
    this.suggestedDoctors = const [],
    this.specialties = const [],
  });

  final String text;
  final List<Doctor> suggestedDoctors;
  final List<String> specialties;
}

/// On-device Suwasiri Help Desk (EN / Sinhala / Tamil).
/// Educational guidance only — not a medical diagnosis.
abstract final class HelpDeskReplies {
  static HelpDeskAnswer answer(String question, {String? preferredLang}) {
    final detected = detectLanguage(question);
    final lang = switch (detected) {
      'si' || 'ta' => detected,
      _ => (preferredLang == 'si' || preferredLang == 'ta')
          ? preferredLang!
          : 'en',
    };
    final q = question.toLowerCase();

    if (_isAppHelp(q)) {
      return HelpDeskAnswer(text: _appHelp(lang));
    }
    if (_isCert(q)) {
      return HelpDeskAnswer(text: explainCertificate(lang: lang));
    }
    if (_match(q, const [
      'vaccine',
      'vaccination',
      'එන්නත්',
      'தடுப்பூசி',
    ]) && !_looksLikeSymptoms(q)) {
      return HelpDeskAnswer(text: _vaccines(lang));
    }
    if (_match(q, const [
      'vault',
      'prescription',
      'e-rx',
      'වට්ටෝරු',
      'மருந்துச்சீட்டு',
    ]) && !_looksLikeSymptoms(q)) {
      return HelpDeskAnswer(text: _vaultRx(lang));
    }
    if (_match(q, const [
      'call',
      'telehealth',
      'video',
      'වීඩියෝ',
      'வீடியோ',
    ]) && !_looksLikeSymptoms(q)) {
      return HelpDeskAnswer(text: _call(lang));
    }
    if (_match(q, const ['sos', '1990', 'suwasariya', 'සුවසැරිය', 'சுவசரியா'])) {
      return HelpDeskAnswer(text: _sos(lang));
    }

    // Symptom / disease path: explain + suggest doctors.
    final mapped = _mapSymptoms(q);
    if (mapped != null || _looksLikeSymptoms(q) || _isSymptomPrompt(q)) {
      return _symptomAnswer(
        lang: lang,
        question: question,
        mapped: mapped ??
            const _SymptomMap(
              topicKey: 'general',
              specialties: [
                'General Practitioner',
                'Physician / Consultant Physician',
              ],
            ),
      );
    }

    if (_match(q, const [
      'doctor',
      'appointment',
      'book',
      'වෛද්‍ය',
      'හමුවීම',
      'மருத்துவர்',
      'சந்திப்பு',
    ])) {
      return HelpDeskAnswer(
        text: _doctors(lang),
        suggestedDoctors: _sampleDoctors(const [
          'General Practitioner',
          'Physician / Consultant Physician',
        ]),
        specialties: const [
          'General Practitioner',
          'Physician / Consultant Physician',
        ],
      );
    }

    return HelpDeskAnswer(text: _general(lang, question));
  }

  /// Back-compat string API.
  static String reply(String question, {String? preferredLang}) =>
      answer(question, preferredLang: preferredLang).text;

  static String explainCertificate({
    String? fileName,
    String lang = 'en',
  }) {
    final name = (fileName == null || fileName.isEmpty) ? 'document' : fileName;
    switch (lang) {
      case 'si':
        return 'මම ඔබ උඩුගත කළ වෛද්‍ය සහතිකය/ලේඛනය (“$name”) සමාලෝචනය කළෙමි.\n\n'
            'සාමාන්‍යයෙන් මෙවැනි ලේඛනවල අඩංගු වන්නේ: රෝගියාගේ නම, නිකුත් කළ වෛද්‍යවරයා/සායනය, දිනය, සහතික අංකය, සහ සායනික ප්‍රකාශය.\n\n'
            'Vault → Doctor certificates තුළ බාගැනීම/ඊමේල් කළ හැක. මෙය රෝග විනිශ්චයක් නොවේ.';
      case 'ta':
        return 'நீங்கள் பதிவேற்றிய மருத்துவ சான்றிதழ் (“$name”) ஆய்வு செய்யப்பட்டது.\n\n'
            'பொதுவாக நோயாளர் பெயர், மருத்துவர்/கிளினிக், தேதி, சான்றிதழ் எண், மருத்துவ அறிக்கை இருக்கும்.\n\n'
            'Vault → Doctor certificates-இல் பதிவிறக்க/மின்னஞ்சல் செய்யலாம். இது நோய் கண்டறிதல் அல்ல.';
      default:
        return 'I reviewed the medical certificate (“$name”).\n\n'
            'These usually include patient name, issuing doctor/clinic, date, certificate number, and a clinical statement.\n\n'
            'Download or email copies in Vault → Doctor certificates. This is not a diagnosis.';
    }
  }

  static String detectLanguage(String question) {
    if (RegExp(r'[\u0D80-\u0DFF]').hasMatch(question) ||
        question.toLowerCase().contains('sinhala')) {
      return 'si';
    }
    if (RegExp(r'[\u0B80-\u0BFF]').hasMatch(question) ||
        question.toLowerCase().contains('tamil') ||
        question.toLowerCase().contains('தமிழ்')) {
      return 'ta';
    }
    return 'en';
  }

  static bool _match(String q, List<String> keys) =>
      keys.any((k) => q.contains(k.toLowerCase()));

  static bool _isAppHelp(String q) => _match(q, const [
        'how to use',
        'app function',
        'features',
        'suwasiri',
        'help desk',
        'යෙදුම',
        'භාවිතා',
        'பயன்பாடு',
        'எப்படி பயன்படு',
      ]);

  static bool _isCert(String q) => _match(q, const [
        'certificate',
        'medical certificate',
        'upload',
        'සහතික',
        'சான்றிதழ்',
        'பதிவேற்று',
      ]);

  static bool _isSymptomPrompt(String q) => _match(q, const [
        'symptom',
        'symptoms',
        'i have',
        'i feel',
        'pain',
        'ache',
        'රෝග ලක්ෂණ',
        'ලක්ෂණ',
        'මට තියෙනවා',
        'වේදනා',
        'அறிகுறி',
        'எனக்கு',
        'வலி',
      ]);

  static bool _looksLikeSymptoms(String q) => _mapSymptoms(q) != null;

  static _SymptomMap? _mapSymptoms(String q) {
    if (_match(q, const ['dengue', 'ඩෙංගු', 'டெங்கு'])) {
      return const _SymptomMap(
        topicKey: 'dengue',
        specialties: [
          'Physician / Consultant Physician',
          'General Practitioner',
          'Hematologist',
        ],
      );
    }
    if (_match(q, const [
      'chest pain',
      'heart',
      'palpitation',
      'පපුවේ වේදනා',
      'හෘද',
      'மார்பு வலி',
      'இதய',
    ])) {
      return const _SymptomMap(
        topicKey: 'heart',
        specialties: ['Cardiologist', 'Physician / Consultant Physician'],
      );
    }
    if (_match(q, const [
      'headache',
      'migraine',
      'dizzy',
      'seizure',
      'හිසරදය',
      'தலைவலி',
      'மயக்கம்',
    ])) {
      return const _SymptomMap(
        topicKey: 'neuro',
        specialties: ['Neurologist', 'General Practitioner'],
      );
    }
    if (_match(q, const [
      'breath',
      'asthma',
      'wheeze',
      'හුස්ම',
      'ඇදුම',
      'மூச்சு',
      'ஆஸ்துமா',
    ])) {
      return const _SymptomMap(
        topicKey: 'chest',
        specialties: [
          'Chest Physician / Pulmonologist',
          'Physician / Consultant Physician',
        ],
      );
    }
    if (_match(q, const [
      'stomach',
      'abdominal',
      'vomit',
      'diarrhea',
      'diarrhoea',
      'nausea',
      'බඩ',
      'වමනය',
      'வயிற்று',
      'வாந்தி',
    ])) {
      return const _SymptomMap(
        topicKey: 'gastro',
        specialties: ['Gastroenterologist', 'General Practitioner'],
      );
    }
    if (_match(q, const [
      'skin',
      'rash',
      'itch',
      'සම',
      'පැල්ලම්',
      'தோல்',
      'அரிப்பு',
    ])) {
      return const _SymptomMap(
        topicKey: 'skin',
        specialties: ['Dermatologist', 'General Practitioner'],
      );
    }
    if (_match(q, const [
      'joint',
      'back pain',
      'fracture',
      'knee',
      'සන්ධි',
      'කොන්ද',
      'மூட்டு',
      'முதுகு',
    ])) {
      return const _SymptomMap(
        topicKey: 'ortho',
        specialties: ['Orthopedic Surgeon', 'Physiotherapist'],
      );
    }
    if (_match(q, const [
      'ear',
      'throat',
      'nose',
      'sinus',
      'කන',
      'උගුර',
      'නාසය',
      'காது',
      'தொண்டை',
      'மூக்கு',
    ])) {
      return const _SymptomMap(
        topicKey: 'ent',
        specialties: ['ENT Surgeon', 'General Practitioner'],
      );
    }
    if (_match(q, const [
      'eye',
      'vision',
      'ඇස්',
      'කැත',
      'கண்',
      'பார்வை',
    ])) {
      return const _SymptomMap(
        topicKey: 'eye',
        specialties: ['Ophthalmologist', 'General Practitioner'],
      );
    }
    if (_match(q, const [
      'anxiety',
      'depression',
      'stress',
      'sleep',
      'මානසික',
      'ආතතිය',
      'மன',
      'மன அழுத்தம்',
    ])) {
      return const _SymptomMap(
        topicKey: 'mental',
        specialties: ['Psychiatrist', 'General Practitioner'],
      );
    }
    if (_match(q, const [
      'diabetes',
      'sugar',
      'දියවැඩියා',
      'நீரிழிவு',
      'சர்க்கரை',
    ])) {
      return const _SymptomMap(
        topicKey: 'diabetes',
        specialties: ['Endocrinologist', 'Physician / Consultant Physician'],
      );
    }
    if (_match(q, const [
      'blood pressure',
      'hypertension',
      'අධි රුධිර පීඩන',
      'இரத்த அழுத்த',
    ])) {
      return const _SymptomMap(
        topicKey: 'bp',
        specialties: ['Cardiologist', 'Physician / Consultant Physician'],
      );
    }
    if (_match(q, const [
      'child',
      'baby',
      'පුංචි',
      'ළමා',
      'குழந்தை',
      'குழந்தைக்கு',
    ])) {
      return const _SymptomMap(
        topicKey: 'child',
        specialties: ['Pediatrician', 'General Practitioner'],
      );
    }
    if (_match(q, const [
      'fever',
      'temperature',
      'උණ',
      'උෂ්ණත්ව',
      'காய்ச்சல்',
      'வெப்பநிலை',
    ])) {
      return const _SymptomMap(
        topicKey: 'fever',
        specialties: [
          'General Practitioner',
          'Physician / Consultant Physician',
        ],
      );
    }
    if (_match(q, const [
      'cold',
      'cough',
      'flu',
      'සෙම්ප්‍රතිශ්‍යා',
      'කැස්ස',
      'சளி',
      'இருமல்',
    ])) {
      return const _SymptomMap(
        topicKey: 'cold',
        specialties: ['General Practitioner', 'ENT Surgeon'],
      );
    }
    if (_match(q, const [
      'urine',
      'kidney',
      'මුත්‍ර',
      'වකුගඩු',
      'சிறுநீர்',
      'சிறுநீரகம்',
    ])) {
      return const _SymptomMap(
        topicKey: 'renal',
        specialties: ['Nephrologist', 'Urologist'],
      );
    }
    return null;
  }

  static HelpDeskAnswer _symptomAnswer({
    required String lang,
    required String question,
    required _SymptomMap mapped,
  }) {
    final doctors = _sampleDoctors(mapped.specialties);
    final explanation = _explainTopic(lang, mapped.topicKey, question);
    final suggest = _suggestBlock(lang, mapped.specialties, doctors);
    return HelpDeskAnswer(
      text: '$explanation\n\n$suggest',
      suggestedDoctors: doctors,
      specialties: mapped.specialties,
    );
  }

  static List<Doctor> _sampleDoctors(List<String> specialties) {
    final picked = <Doctor>[];
    for (final s in specialties) {
      for (final d in DoctorCatalog.doctors) {
        if (d.specialty == s && !picked.any((x) => x.id == d.id)) {
          picked.add(d);
          break;
        }
      }
      if (picked.length >= 4) break;
    }
    if (picked.isEmpty) {
      picked.addAll(DoctorCatalog.doctors.take(3));
    }
    return picked.take(4).toList();
  }

  static String _explainTopic(String lang, String key, String question) {
    final short = question.trim().isEmpty ? '…' : question.trim();
    switch (key) {
      case 'dengue':
        return _t(
          lang,
          en:
              'Based on what you shared (“$short”), this can fit a viral illness pattern seen in Sri Lanka, including dengue risk: fever, body aches, pain behind the eyes, nausea, or rash.\n\nWhat may be happening: your immune system is reacting to a viral infection. Hydrate, rest, and avoid NSAIDs (ibuprofen/aspirin). Seek urgent care for bleeding, severe pain, or breathing trouble.',
          si:
              'ඔබ කී දේ අනුව (“$short”), ශ්‍රී ලංකාවේ දක්නා වෛරස් රෝග රටාවකට (ඩෙංගු අවදානම ඇතුළුව) ගැළපෙන ලක්ෂණ විය හැක: උණ, ශරීර වේදනා, ඇස් පිටුපස වේදනාව, ඔක්කාරය හෝ පැල්ලම්.\n\nසිදුවිය හැක්කේ: ප්‍රතිශක්තිකරණය වෛරසයකට ප්‍රතිචාර දැක්වීමයි. ජලය පානය කරන්න, විවේක ගන්න, NSAID (ibuprofen/aspirin) වළකින්න. ලේ ගැලීම්/දැඩි වේදනාව/හුස්ම අපහසුතාව ඇත්නම් වහාම රෝහලට යන්න.',
          ta:
              'நீங்கள் கூறியதை வைத்து (“$short”), இலங்கையில் காணப்படும் வைரஸ் நோய் (டெங்கு அபாயம் உட்பட) அறிகுறிகளாக இருக்கலாம்: காய்ச்சல், உடல் வலி, கண்ணுக்குப் பின்னால் வலி, வாந்தி அல்லது தோல் புள்ளிகள்.\n\nஎன்ன நடக்கலாம்: நோய் எதிர்ப்பு அமைப்பு வைரஸுக்கு எதிர்வினையாற்றலாம். நீர் அருந்துங்கள், ஓய்வெடுங்கள், NSAID (ibuprofen/aspirin) தவிருங்கள். இரத்தப்போக்கு/கடும் வலி/மூச்சுத்திணறல் இருந்தால் உடனடி மருத்துவம் தேவை.',
        );
      case 'fever':
        return _t(
          lang,
          en:
              'You mentioned fever-related symptoms (“$short”).\n\nWhat may be happening: fever is usually the body’s response to infection or inflammation. Rest, hydrate, and monitor temperature. If fever lasts >3 days, is very high, or comes with severe headache, rash, or breathing difficulty, see a clinician promptly.',
          si:
              'ඔබ උණ සම්බන්ධ ලක්ෂණ සඳහන් කළා (“$short”).\n\nසිදුවිය හැක්කේ: උණ බොහෝ විට ආසාදනයකට ශරීරයේ ප්‍රතිචාරයකි. විවේකය, ජලය, උෂ්ණත්වය මැනීම. දින 3කට වඩා උණ, ඉහළ උණ, තද හිසරදය, පැල්ලම් හෝ හුස්ම අපහසුතාව ඇත්නම් වහාම වෛද්‍යවරයෙකු හමුවන්න.',
          ta:
              'நீங்கள் காய்ச்சல் தொடர்பான அறிகுறிகளைக் குறிப்பிட்டீர்கள் (“$short”).\n\nஎன்ன நடக்கலாம்: காய்ச்சல் பெரும்பாலும் தொற்றுக்கு உடலின் எதிர்வினை. ஓய்வு, நீர்ச்சத்து, வெப்பநிலை கண்காணிப்பு. 3 நாட்களுக்கு மேல்/அதிக காய்ச்சல், கடும் தலைவலி, தோல் புள்ளிகள் அல்லது மூச்சுத்திணறல் இருந்தால் விரைவில் மருத்துவரை அணுகவும்.',
        );
      case 'heart':
        return _t(
          lang,
          en:
              'Chest/heart-related symptoms (“$short”) need careful attention.\n\nWhat may be happening: this can range from muscle strain or anxiety to heart or lung issues. Sudden pressure-like chest pain, pain to the arm/jaw, severe shortness of breath, or fainting needs emergency care (Suwasariya 1990).',
          si:
              'පපුව/හෘද සම්බන්ධ ලක්ෂණ (“$short”) ඉතා ප්‍රවේශමෙන් සලකන්න.\n\nසිදුවිය හැක්කේ: මාංශපේශි ආතතියේ සිට හෘද/පෙනහළු ගැටලු දක්වා විය හැක. හදිසි තද පපුවේ වේදනාව, අත/හකු වෙත විහිදෙන වේදනාව, දැඩි හුස්ම අපහසුතාව හෝ සිහිසුන්වීම ඇත්නම් හදිසි උපකාර (Suwasariya 1990).',
          ta:
              'மார்பு/இதய அறிகுறிகள் (“$short”) கவனமாக பார்க்க வேண்டும்.\n\nஎன்ன நடக்கலாம்: தசை அழுத்தம் முதல் இதயம்/நுரையீரல் பிரச்சினை வரை இருக்கலாம். திடீர் அழுத்தமான மார்பு வலி, கை/தாடைக்கு பரவும் வலி, கடும் மூச்சுத்திணறல் அல்லது மயக்கம் இருந்தால் அவசர உதவி (Suwasariya 1990).',
        );
      case 'cold':
        return _t(
          lang,
          en:
              'Cold/cough symptoms (“$short”) are often viral upper-airway irritation.\n\nWhat may be happening: inflammation in the nose/throat. Rest, warm fluids, and hygiene help most cases. See a doctor if fever persists, breathing is hard, or symptoms last beyond a week.',
          si:
              'සෙම්ප්‍රතිශ්‍යා/කැස්ස (“$short”) බොහෝ විට වෛරස් ආසාදනයකි.\n\nසිදුවිය හැක්කේ: නාසය/උගුරේ දැවිල්ල. විවේකය සහ උණුසුම් ජලය උපකාරී වේ. උණ දිගටම ඇත්නම්, හුස්ම අපහසු නම් හෝ සතියකට වඩා ඇත්නම් වෛද්‍යවරයෙකු හමුවන්න.',
          ta:
              'சளி/இருமல் (“$short”) பெரும்பாலும் வைரஸ் தொற்று.\n\nஎன்ன நடக்கலாம்: மூக்கு/தொண்டை அழற்சி. ஓய்வு மற்றும் வெதுவெதுப்பான நீர் உதவும். காய்ச்சல் நீடித்தால், மூச்சுத்திணறல் இருந்தால் அல்லது ஒரு வாரத்திற்கு மேல் இருந்தால் மருத்துவரை அணுகவும்.',
        );
      case 'diabetes':
        return _t(
          lang,
          en:
              'About blood-sugar concerns (“$short”):\n\nWhat may be happening: high or unstable glucose can cause thirst, fatigue, or blurred vision. Keep meals balanced and do not change medicines without advice. An endocrinologist or physician can review labs (e.g. HbA1c in Vault).',
          si:
              'රුධිර සීනි සම්බන්ධව (“$short”):\n\nසිදුවිය හැක්කේ: ඉහළ/අස්ථාවර සීනි නිසා පිපාසය, මහන්සිය හෝ පෙනීම නොපැහැදිලි වීම. ආහාර සමබරව තබන්න; උපදෙස් නැතිව ඖෂධ වෙනස් නොකරන්න. Endocrinologist හෝ Physician වෛද්‍යවරයෙකු රසායනාගාර වාර්තා (HbA1c) පරීක්ෂා කළ හැක.',
          ta:
              'இரத்த சர்க்கரை தொடர்பாக (“$short”):\n\nஎன்ன நடக்கலாம்: உயர்/நிலையற்ற சர்க்கரை தாகம், சோர்வு அல்லது மங்கலான பார்வையை ஏற்படுத்தலாம். உணவை சமநிலையில் வையுங்கள்; ஆலோசனையின்றி மருந்து மாற்ற வேண்டாம். Endocrinologist அல்லது Physician ஆய்வக அறிக்கைகளை (HbA1c) பார்க்கலாம்.',
        );
      case 'general':
      default:
        return _t(
          lang,
          en:
              'I reviewed the symptoms you entered (“$short”).\n\nWhat may be happening: your body may be reacting to infection, inflammation, strain, or another medical issue. This chat cannot diagnose you. Track when symptoms started, how strong they are, and any red-flag signs (severe pain, breathing trouble, fainting, heavy bleeding).',
          si:
              'ඔබ ඇතුළත් කළ රෝග ලක්ෂණ සමාලෝචනය කළෙමි (“$short”).\n\nසිදුවිය හැක්කේ: ආසාදනය, දැවිල්ල, ආතතිය හෝ වෙනත් වෛද්‍ය තත්ත්වයකට ශරීරය ප්‍රතිචාර දැක්වීම. මෙම chat එකෙන් රෝග විනිශ්චයක් කළ නොහැක. ලක්ෂණ ආරම්භ වූ වේලාව, තීව්‍රතාව සහ අනතුරු ලකුණු (දැඩි වේදනාව, හුස්ම අපහසුතාව, සිහිසුන්වීම, ලේ ගැලීම්) සටහන් කරන්න.',
          ta:
              'நீங்கள் உள்ளிட்ட அறிகுறிகளை ஆய்வு செய்தேன் (“$short”).\n\nஎன்ன நடக்கலாம்: தொற்று, அழற்சி, அழுத்தம் அல்லது வேறு மருத்துவ நிலைக்கு உடல் எதிர்வினையாற்றலாம். இந்த அரட்டை நோயைக் கண்டறியாது. அறிகுறி தொடங்கிய நேரம், தீவிரம் மற்றும் எச்சரிக்கை அறிகுறிகளை (கடும் வலி, மூச்சுத்திணறல், மயக்கம், இரத்தப்போக்கு) குறித்துக் கொள்ளுங்கள்.',
        );
    }
  }

  static String _suggestBlock(
    String lang,
    List<String> specialties,
    List<Doctor> doctors,
  ) {
    final specs = specialties.map((s) => '• $s').join('\n');
    final docs = doctors
        .map((d) => '• ${d.name} — ${d.specialty}\n  ${d.hospital}')
        .join('\n');
    return _t(
      lang,
      en:
          'Suggested doctor specialties (Suwasiri Doctors):\n$specs\n\n'
          'Sample matching doctors you can book now:\n$docs\n\n'
          'Open the Doctors tab to filter by specialty/region and Book Session. '
          'For video advice, use Call. This is educational guidance — not a diagnosis.',
      si:
          'නිර්දේශිත වෛද්‍ය විශේෂතා (Suwasiri Doctors):\n$specs\n\n'
          'දැන් වෙන්කළ හැකි ගැළපෙන වෛද්‍යවරු (නියැදි):\n$docs\n\n'
          'Doctors ටැබයෙන් විශේෂතා/දිස්ත්‍රික්කයෙන් පෙරහන් කර Book Session කරන්න. '
          'වීඩියෝ උපදෙස් සඳහා Call භාවිතා කරන්න. මෙය රෝග විනිශ්චයක් නොවේ.',
      ta:
          'பரிந்துரைக்கப்படும் மருத்துவ சிறப்புகள் (Suwasiri Doctors):\n$specs\n\n'
          'இப்போது முன்பதிவு செய்யக்கூடிய மாதிரி மருத்துவர்கள்:\n$docs\n\n'
          'Doctors தாவலில் சிறப்பு/மாவட்டம் வடிகட்டி Book Session செய்யுங்கள். '
          'வீடியோ ஆலோசனைக்கு Call பயன்படுத்துங்கள். இது நோய் கண்டறிதல் அல்ல.',
    );
  }

  static String _t(
    String lang, {
    required String en,
    required String si,
    required String ta,
  }) {
    switch (lang) {
      case 'si':
        return si;
      case 'ta':
        return ta;
      default:
        return en;
    }
  }

  static String _appHelp(String lang) => _t(
        lang,
        en:
            'Suwasiri tabs: Home, Doctors, Call, Vault, Vaccines, Profile. Use the yellow Help button anytime. Ask symptoms for an explanation + doctor suggestions.',
        si:
            'Suwasiri ටැබ්: Home, Doctors, Call, Vault, Vaccines, Profile. කහ Help බොත්තමෙන් ඕනෑම වේලාවක අසන්න. රෝග ලක්ෂණ ඇතුළත් කළ විට පැහැදිලි කිරීම සහ වෛද්‍ය නිර්දේශ ලැබේ.',
        ta:
            'Suwasiri தாவல்கள்: Home, Doctors, Call, Vault, Vaccines, Profile. மஞ்சள் Help மூலம் எப்போதும் கேளுங்கள். அறிகுறிகளை உள்ளிட்டால் விளக்கம் + மருத்துவர் பரிந்துரை கிடைக்கும்.',
      );

  static String _vaccines(String lang) => _t(
        lang,
        en:
            'Vaccines tab: pick district, vaccine, and clinic to book. Completed doses appear in Vault → Vaccine History.',
        si:
            'Vaccines ටැබයෙන් දිස්ත්‍රික්කය, එන්නත සහ සායනය තෝරා වෙන්කරන්න. සම්පූර්ණ වූ ඒවා Vault → Vaccine History හි පෙනේ.',
        ta:
            'Vaccines தாவலில் மாவட்டம், தடுப்பூசி, கிளினிக் தேர்ந்தெடுத்து முன்பதிவு செய்யுங்கள். முடிந்தவை Vault → Vaccine History-இல் தோன்றும்.',
      );

  static String _vaultRx(String lang) => _t(
        lang,
        en:
            'Vault stores labs, certificates, and medicine history. On Call, open View digital e-prescription for email / MediLanka / PDF.',
        si:
            'Vault හි රසායනාගාර වාර්තා, සහතික සහ ඖෂධ ඉතිහාසය තබයි. Call හි View digital e-prescription මගින් ඊමේල් / MediLanka / PDF කළ හැක.',
        ta:
            'Vault-இல் ஆய்வகங்கள், சான்றிதழ்கள், மருந்து வரலாறு உள்ளன. Call-இல் View digital e-prescription மூலம் மின்னஞ்சல் / MediLanka / PDF செய்யலாம்.',
      );

  static String _doctors(String lang) => _t(
        lang,
        en:
            'Doctors page lists clinicians with hospital/clinic and address. Filter by category/region, then Book Session.',
        si:
            'Doctors පිටුවේ වෛද්‍ය නම සමඟ රෝහල/සායනය සහ ලිපිනය පෙනේ. කාණ්ඩය/දිස්ත්‍රික්කයෙන් පෙරහන් කර Book Session කරන්න.',
        ta:
            'Doctors பக்கத்தில் மருத்துவர் பெயருடன் மருத்துவமனை/கிளினிக் மற்றும் முகவரி தோன்றும். வகை/மாவட்டம் வடிகட்டி Book Session செய்யுங்கள்.',
      );

  static String _call(String lang) => _t(
        lang,
        en:
            'Call is for video consultation, e-prescription, and MediLanka sync.',
        si:
            'Call ටැබය වීඩියෝ උපදේශනය, ඊ-වට්ටෝරු සහ MediLanka සමමුහුර්තය සඳහාය.',
        ta:
            'Call தாவல் வீடியோ ஆலோசனை, மின் மருந்துச்சீட்டு மற்றும் MediLanka ஒத்திசைவுக்காக.',
      );

  static String _sos(String lang) => _t(
        lang,
        en:
            'Suwasariya (1990) is the national ambulance line. Use in-app SOS for life-threatening emergencies.',
        si:
            'Suwasariya (1990) ජාතික ගිලන්රථ සේවාවයි. ජීවිතාරක්ෂක හදිසි අවස්ථා සඳහා යෙදුමේ SOS භාවිතා කරන්න.',
        ta:
            'Suwasariya (1990) தேசிய ஆம்புலன்ஸ். உயிருக்கு ஆபத்தான அவசரங்களுக்கு செயலி SOS பயன்படுத்துங்கள்.',
      );

  static String _general(String lang, String question) {
    final short = question.trim().isEmpty ? '…' : question.trim();
    return _t(
      lang,
      en:
          'I heard your question (“$short”).\n\n'
          'Here is practical Suwasiri guidance:\n'
          '• App how-to — ask about Home, Doctors, Call, Vault, Vaccines, Profile, SOS\n'
          '• Symptoms — describe what you feel; I explain what may be happening and suggest doctors\n'
          '• Certificates — attach a medical certificate photo for an explanation\n'
          '• Health topics — fever, dengue, diabetes, BP, cough, chest pain, and more\n\n'
          'Ask anything in English, Sinhala, or Tamil by typing or voice (mic). '
          'Use the language chips to switch. Educational guidance only — not a diagnosis. For emergencies use Suwasariya 1990.',
      si:
          'මම ඔබේ ප්‍රශ්නය ලැබුවෙමි (“$short”).\n\n'
          'Suwasiri ප්‍රායෝගික මගපෙන්වීම:\n'
          '• යෙදුම — Home, Doctors, Call, Vault, Vaccines, Profile, SOS\n'
          '• රෝග ලක්ෂණ — විස්තර කරන්න; මම පැහැදිලි කර වෛද්‍යවරු නිර්දේශ කරමි\n'
          '• සහතික — ඡායාරූපයක් ඇමිණීමෙන් පැහැදිලි කිරීම\n'
          '• සෞඛ්‍ය මාතෘකා — උණ, ඩෙංගු, දියවැඩියා, රුධිර පීඩනය, කැස්ස ආදිය\n\n'
          'ටයිප් කිරීමෙන් හෝ mic (කටහඬ) මගින් ඕනෑම දෙයක් අසන්න. '
          'අධ්‍යාපනික මගපෙන්වීම පමණි — රෝග විනිශ්චයක් නොවේ. හදිසි අවස්ථාවකදී Suwasariya 1990.',
      ta:
          'உங்கள் கேள்வியைப் பெற்றேன் (“$short”).\n\n'
          'Suwasiri நடைமுறை வழிகாட்டல்:\n'
          '• செயலி — Home, Doctors, Call, Vault, Vaccines, Profile, SOS\n'
          '• அறிகுறிகள் — விவரிக்கவும்; விளக்கி மருத்துவர்களை பரிந்துரைப்பேன்\n'
          '• சான்றிதழ் — புகைப்படம் இணைத்து விளக்கம் பெறலாம்\n'
          '• சுகாதார தலைப்புகள் — காய்ச்சல், டெங்கு, நீரிழிவு, இரத்த அழுத்தம், இருமல் போன்றவை\n\n'
          'டைப் செய்தோ அல்லது mic (குரல்) மூலமோ எதையும் கேளுங்கள். '
          'கல்வி வழிகாட்டல் மட்டும் — நோய் கண்டறிதல் அல்ல. அவசரத்தில் Suwasariya 1990.',
    );
  }
}

class _SymptomMap {
  const _SymptomMap({
    required this.topicKey,
    required this.specialties,
  });

  final String topicKey;
  final List<String> specialties;
}
