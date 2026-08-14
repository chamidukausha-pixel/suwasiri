/// On-device Suwasiri Help Desk replies (EN / Sinhala / Tamil + auto-detect).
/// Educational guidance only — not a medical diagnosis.
abstract final class HelpDeskReplies {
  static String reply(String question, {String? preferredLang}) {
    final lang = preferredLang ?? detectLanguage(question);
    final q = question.toLowerCase();

    if (_isAppHelp(q)) return _appHelp(lang);
    if (_isCert(q)) return explainCertificate(lang: lang);
    if (_match(q, const ['dengue', 'ඩෙංගු', 'டெங்கு'])) {
      return _dengue(lang);
    }
    if (_match(q, const [
      'fever',
      'temperature',
      'උණ',
      'උෂ්ණත්ව',
      'காய்ச்சல்',
      'வெப்பநிலை',
    ])) {
      return _fever(lang);
    }
    if (_match(q, const [
      'symptom',
      'symptoms',
      'රෝග ලක්ෂණ',
      'ලක්ෂණ',
      'அறிகுறி',
    ])) {
      return _symptomsGuide(lang);
    }
    if (_match(q, const [
      'diabetes',
      'sugar',
      'දියවැඩියා',
      'நீரிழிவு',
      'சர்க்கரை',
    ])) {
      return _diabetes(lang);
    }
    if (_match(q, const [
      'blood pressure',
      'hypertension',
      'අධි රුධිර පීඩන',
      'இரத்த அழுத்த',
    ])) {
      return _bp(lang);
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
      return _coldCough(lang);
    }
    if (_match(q, const [
      'vaccine',
      'vaccination',
      'එන්නත්',
      'தடுப்பூசி',
    ])) {
      return _vaccines(lang);
    }
    if (_match(q, const [
      'vault',
      'prescription',
      'e-rx',
      'වට්ටෝරු',
      'மருந்துச்சீட்டு',
    ])) {
      return _vaultRx(lang);
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
      return _doctors(lang);
    }
    if (_match(q, const [
      'call',
      'telehealth',
      'video',
      'වීඩියෝ',
      'வீடியோ',
    ])) {
      return _call(lang);
    }
    if (_match(q, const ['sos', '1990', 'suwasariya', 'සුවසැරිය', 'சுவசரியா'])) {
      return _sos(lang);
    }

    return _general(lang, question);
  }

  static String explainCertificate({
    String? fileName,
    String lang = 'en',
  }) {
    final name = (fileName == null || fileName.isEmpty) ? 'document' : fileName;
    switch (lang) {
      case 'si':
        return 'මම ඔබ උඩුගත කළ වෛද්‍ය සහතිකය/ලේඛනය (“$name”) සමාලෝචනය කළෙමි.\n\n'
            'සාමාන්‍යයෙන් මෙවැනි ලේඛනවල අඩංගු වන්නේ: රෝගියාගේ නම, නිකුත් කළ වෛද්‍යවරයා/සායනය, දිනය, සහතික අංකය, සහ සායනික ප්‍රකාශය (උදා. රැකියාවට සුදුසුකම් / රෝග නිවාඩු).\n\n'
            'Suwasiri Vault → Doctor certificates තුළ ඔබට බාගැනීම හෝ ඊමේල් කිරීමට හැකිය. '
            'මෙය අධ්‍යාපනික පැහැදිලි කිරීමකි — නිල වෛද්‍ය තීරණයක් නොවේ. සැකයක් ඇත්නම් නිකුත් කළ සායනයෙන් තහවුරු කරන්න.';
      case 'ta':
        return 'நீங்கள் பதிவேற்றிய மருத்துவ சான்றிதழ்/ஆவணம் (“$name”) ஆய்வு செய்யப்பட்டது.\n\n'
            'பொதுவாக இதில் நோயாளியின் பெயர், வழங்கிய மருத்துவர்/கிளினிக், தேதி, சான்றிதழ் எண், '
            'மருத்துவ அறிக்கை (எ.கா. பணிக்கு தகுதி / நோய் விடுப்பு) இருக்கும்.\n\n'
            'Suwasiri Vault → Doctor certificates-இல் பதிவிறக்க அல்லது மின்னஞ்சல் செய்யலாம். '
            'இது கல்வி விளக்கம் மட்டும் — அதிகாரப்பூர்வ மருத்துவ முடிவு அல்ல. சந்தேகம் இருந்தால் வழங்கிய கிளினிக்கை அணுகவும்.';
      default:
        return 'I reviewed the medical certificate/document you uploaded (“$name”).\n\n'
            'These documents usually include: patient name, issuing doctor/clinic, date, certificate number, '
            'and a clinical statement (e.g. fit for work / sick leave).\n\n'
            'In Suwasiri Vault → Doctor certificates you can download or email your copies. '
            'This is an educational explanation only — not an official medical decision. '
            'If anything looks unclear, confirm with the issuing clinic.';
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
        'எப்படி',
      ]);

  static bool _isCert(String q) => _match(q, const [
        'certificate',
        'medical certificate',
        'upload',
        'සහතික',
        'சான்றிதழ்',
        'பதிவேற்று',
      ]);

  static String _appHelp(String lang) {
    switch (lang) {
      case 'si':
        return 'Suwasiri ශ්‍රී ලාංකික ඩිජිටල් සෞඛ්‍ය යෙදුමකි:\n'
            '• Home — ඉදිරි වෛද්‍ය/එන්නත් වෙන්කිරීම්\n'
            '• Doctors — විශේෂඥයන් සොයා Book Session\n'
            '• Call — වීඩියෝ උපදේශනය, ඊ-වට්ටෝරු, MediLanka\n'
            '• Vault — රසායනාගාර වාර්තා, සහතික, ඉතිහාසය\n'
            '• Vaccines — ජාතික එන්නත් වෙන්කිරීම\n'
            '• Profile — Health ID සහ සැකසුම්\n\n'
            'කහ Help බොත්තමෙන් ඕනෑම භාෂාවකින් අසන්න. මෙය රෝග විනිශ්චයක් නොවේ.';
      case 'ta':
        return 'Suwasiri இலங்கை டிஜிட்டல் சுகாதார செயலி:\n'
            '• Home — வரவிருக்கும் மருத்துவர்/தடுப்பூசி முன்பதிவுகள்\n'
            '• Doctors — நிபுணர்களைத் தேடி Book Session\n'
            '• Call — வீடியோ ஆலோசனை, மின் மருந்துச்சீட்டு, MediLanka\n'
            '• Vault — ஆய்வக அறிக்கைகள், சான்றிதழ்கள், வரலாறு\n'
            '• Vaccines — தேசிய தடுப்பூசி முன்பதிவு\n'
            '• Profile — Health ID மற்றும் அமைப்புகள்\n\n'
            'மஞ்சள் Help பொத்தானில் எந்த மொழியிலும் கேளுங்கள். இது நோய் கண்டறிதல் அல்ல.';
      default:
        return 'Suwasiri is a Sri Lankan digital health app:\n'
            '• Home — upcoming doctor/vaccine bookings\n'
            '• Doctors — find specialists and Book Session\n'
            '• Call — video consult, e-prescription, MediLanka sync\n'
            '• Vault — labs, doctor certificates, history\n'
            '• Vaccines — national immunisation booking\n'
            '• Profile — Health ID and settings\n\n'
            'Ask anything in English, Sinhala, or Tamil via the yellow Help button. '
            'This is guidance only, not a diagnosis.';
    }
  }

  static String _fever(String lang) {
    switch (lang) {
      case 'si':
        return 'උණ (≥38°C): විවේකය, ජලය, පැරසිටමෝල් වෛද්‍ය උපදෙස් අනුව.\n'
            'දින 3කට වඩා උණ, හුස්ම ගැනීමේ අපහසුතාව, තද හිසරදය හෝ ලේ ගැලීම් ඇත්නම් වහාම වෛද්‍ය උපදෙස් ලබා ගන්න.\n'
            'ශ්‍රී ලංකාවේ ඩෙංගු අවදානම සැලකිල්ලට ගන්න. මෙය රෝග විනිශ්චයක් නොවේ.';
      case 'ta':
        return 'காய்ச்சல் (≥38°C): ஓய்வு, நீர்ச்சத்து, மருத்துவர் ஆலோசனையுடன் பாராசிட்டமால்.\n'
            '3 நாட்களுக்கு மேல் காய்ச்சல், மூச்சுத்திணறல், கடுமையான தலைவலி அல்லது இரத்தப்போக்கு இருந்தால் உடனடி மருத்துவம் தேவை.\n'
            'இலங்கையில் டெங்கு அபாயத்தையும் கவனியுங்கள். இது நோய் கண்டறிதல் அல்ல.';
      default:
        return 'Fever (≥38°C): rest, hydrate, and use paracetamol only as advised by a clinician.\n'
            'Seek care urgently if fever lasts >3 days, breathing is hard, severe headache, or bleeding occurs.\n'
            'In Sri Lanka, also consider dengue risk. This is not a diagnosis.';
    }
  }

  static String _dengue(String lang) {
    switch (lang) {
      case 'si':
        return 'ඩෙංගු සැකය: උණ, ශරීර වේදනා, ඇස් පිටුපස වේදනාව, ඔක්කාරය, රතු පැල්ලම්.\n'
            'ජලය පානය කරන්න; ibuprofen/aspirin වැනි NSAID වළකින්න; රෝහල්/සායනයක වෛද්‍ය උපදෙස් ඉක්මනින් ලබා ගන්න.\n'
            'හදිසි අවස්ථාවකදී Suwasariya 1990 භාවිතා කළ හැක. මෙය රෝග විනිශ්චයක් නොවේ.';
      case 'ta':
        return 'டெங்கு சந்தேகம்: காய்ச்சல், உடல் வலி, கண்ணுக்குப் பின்னால் வலி, வாந்தி, சிவப்பு புள்ளிகள்.\n'
            'நீர் அருந்துங்கள்; ibuprofen/aspirin போன்ற NSAID தவிருங்கள்; விரைவில் மருத்துவமனை/கிளினிக் அணுகவும்.\n'
            'அவசரத்தில் Suwasariya 1990 பயன்படுத்தலாம். இது நோய் கண்டறிதல் அல்ல.';
      default:
        return 'Possible dengue signs: fever, body aches, pain behind the eyes, nausea, rash.\n'
            'Hydrate; avoid NSAIDs (ibuprofen/aspirin); seek prompt care at a hospital/clinic.\n'
            'For emergencies you can use Suwasariya 1990 in the app. This is not a diagnosis.';
    }
  }

  static String _symptomsGuide(String lang) {
    switch (lang) {
      case 'si':
        return 'රෝග ලක්ෂණ විස්තර කරන්න (උණ, කැස්ස, වේදනාව, කාලය). '
            'මම සාමාන්‍ය මගපෙන්වීමක් දෙමි. බරපතල ලක්ෂණ (ශක්තිමත් හුස්ම ගැනීමේ අපහසුතාව, පපුවේ වේදනාව, සිහිසුන්වීම) ඇත්නම් හදිසි උපකාර ලබා ගන්න.\n'
            'Doctors ටැබයෙන් විශේෂඥයෙකු වෙන්කරන්න හෝ Call හරහා වීඩියෝ උපදේශනයක් ලබා ගන්න.';
      case 'ta':
        return 'அறிகுறிகளை விவரிக்கவும் (காய்ச்சல், இருமல், வலி, காலம்). '
            'நான் பொது வழிகாட்டல் தருவேன். கடுமையான அறிகுறிகள் (மூச்சுத்திணறல், மார்பு வலி, மயக்கம்) இருந்தால் அவசர உதவி பெறுங்கள்.\n'
            'Doctors தாவலில் நிபுணரை முன்பதிவு செய்யவும் அல்லது Call வழியாக வீடியோ ஆலோசனை பெறவும்.';
      default:
        return 'Describe your symptoms (fever, cough, pain, how long). '
            'I will share general guidance. For severe symptoms (trouble breathing, chest pain, fainting), seek emergency care.\n'
            'You can book a specialist in Doctors or start a video consult in Call.';
    }
  }

  static String _diabetes(String lang) {
    switch (lang) {
      case 'si':
        return 'දියවැඩියාව පිළිබඳ සාමාන්‍ය උපදෙස්: සමබර ආහාර, ව්‍යායාම, ඖෂධ නියමය පරිදි. '
            'Vault හි HbA1c වැනි රසායනාගාර වාර්තා තබා ගන්න. ප්‍රතිකාර වෙනස් කිරීමට පෙර වෛද්‍යවරයෙකු හමුවන්න.';
      case 'ta':
        return 'நீரிழிவு குறித்த பொது ஆலோசனை: சமநிலை உணவு, உடற்பயிற்சி, மருந்து முறையாக. '
            'Vault-இல் HbA1c போன்ற ஆய்வக அறிக்கைகளை வைத்திருங்கள். சிகிச்சை மாற்றுவதற்கு முன் மருத்துவரை அணுகவும்.';
      default:
        return 'General diabetes guidance: balanced diet, activity, and medicines as prescribed. '
            'Keep lab reports such as HbA1c in Vault. See a clinician before changing treatment.';
    }
  }

  static String _bp(String lang) {
    switch (lang) {
      case 'si':
        return 'අධි රුධිර පීඩනය: ලුණු අඩු කරන්න, නිතිපතා මැනීම, වෛද්‍ය උපදෙස් අනුව ඖෂධ. '
            'හදිසි හිසරදය/පපුවේ වේදනාව ඇත්නම් හදිසි උපකාර ලබා ගන්න.';
      case 'ta':
        return 'உயர் இரத்த அழுத்தம்: உப்பைக் குறைக்கவும், அடிக்கடி அளக்கவும், மருத்துவர் ஆலோசனையுடன் மருந்து. '
            'திடீர் தலைவலி/மார்பு வலி இருந்தால் அவசர உதவி பெறுங்கள்.';
      default:
        return 'Blood pressure tips: reduce salt, monitor regularly, take medicines as prescribed. '
            'Seek urgent care for sudden severe headache or chest pain.';
    }
  }

  static String _coldCough(String lang) {
    switch (lang) {
      case 'si':
        return 'සෙම්ප්‍රතිශ්‍යා/කැස්ස: විවේකය, උණුසුම් ජලය, සනීපාරක්ෂාව. '
            'උණ දිගටම ඇත්නම් හෝ හුස්ම ගැනීම අපහසු නම් වෛද්‍ය උපදෙස් ලබා ගන්න.';
      case 'ta':
        return 'சளி/இருமல்: ஓய்வு, வெதுவெதுப்பான நீர், சுகாதாரம். '
            'காய்ச்சல் நீடித்தால் அல்லது மூச்சுத்திணறல் இருந்தால் மருத்துவரை அணுகவும்.';
      default:
        return 'Cold/cough: rest, warm fluids, hand hygiene. '
            'See a clinician if fever persists or breathing is difficult.';
    }
  }

  static String _vaccines(String lang) {
    switch (lang) {
      case 'si':
        return 'Vaccines ටැබයෙන් දිස්ත්‍රික්කය, එන්නත සහ සායනය තෝරා වෙන්කරන්න. '
            'සම්පූර්ණ වූ එන්නත් Vault → Vaccine History හි පෙනේ. Home හි ඉදිරි එන්නත් කාඩ්පත කොළ පාටින් පෙන්වයි.';
      case 'ta':
        return 'Vaccines தாவலில் மாவட்டம், தடுப்பூசி மற்றும் கிளினிக்கைத் தேர்ந்தெடுத்து முன்பதிவு செய்யுங்கள். '
            'முடிந்த தடுப்பூசிகள் Vault → Vaccine History-இல் தோன்றும். Home-இல் வரவிருக்கும் தடுப்பூசி பச்சை அட்டையில் காட்டப்படும்.';
      default:
        return 'In Vaccines, pick district, vaccine, and clinic to book. '
            'Completed doses appear in Vault → Vaccine History. Home shows your upcoming vaccine in a green card.';
    }
  }

  static String _vaultRx(String lang) {
    switch (lang) {
      case 'si':
        return 'Vault හි ඔබේ රසායනාගාර වාර්තා, වෛද්‍ය සහතික සහ නිකුත් කළ ඖෂධ ඉතිහාසය තබයි. '
            'Call හි ඊ-වට්ටෝරුව View digital e-prescription මගින් විවෘත කර ඊමේල් / MediLanka / PDF කළ හැක.';
      case 'ta':
        return 'Vault-இல் ஆய்வக அறிக்கைகள், மருத்துவர் சான்றிதழ்கள் மற்றும் வழங்கப்பட்ட மருந்து வரலாறு உள்ளன. '
            'Call-இல் View digital e-prescription மூலம் மின் மருந்துச்சீட்டைத் திறந்து மின்னஞ்சல் / MediLanka / PDF செய்யலாம்.';
      default:
        return 'Vault stores lab reports, doctor certificates, and issued medicine history. '
            'On Call, open View digital e-prescription to email, sync MediLanka, or download PDF.';
    }
  }

  static String _doctors(String lang) {
    switch (lang) {
      case 'si':
        return 'Doctors පිටුවේ කාණ්ඩය/දිස්ත්‍රික්කයෙන් පෙරහන් කර වෛද්‍ය නම සහ රෝහල/සායන ලිපිනය බලන්න. '
            'Book Session මගින් වෙන්කිරීම සහ ගෙවීම සම්පූර්ණ කරන්න.';
      case 'ta':
        return 'Doctors பக்கத்தில் வகை/மாவட்டம் மூலம் வடிகட்டி மருத்துவர் பெயர் மற்றும் மருத்துவமனை/கிளினிக் முகவரியைப் பாருங்கள். '
            'Book Session மூலம் முன்பதிவு மற்றும் கட்டணத்தை முடிக்கவும்.';
      default:
        return 'On Doctors, filter by category/region to see doctor names with hospital/clinic and address. '
            'Use Book Session to finish booking and payment.';
    }
  }

  static String _call(String lang) {
    switch (lang) {
      case 'si':
        return 'Call ටැබය වීඩියෝ උපදේශනය සඳහාය. කැමරාව on/off කළ හැක. '
            'නිකුත් වූ ඊ-වට්ටෝරුව බලා ඊමේල්, MediLanka සමමුහුර්තය හෝ PDF බාගත කරන්න.';
      case 'ta':
        return 'Call தாவல் வீடியோ ஆலோசனைக்காக. கேமராவை on/off செய்யலாம். '
            'வழங்கப்பட்ட மின் மருந்துச்சீட்டைப் பார்த்து மின்னஞ்சல், MediLanka ஒத்திசைவு அல்லது PDF பதிவிறக்கம் செய்யுங்கள்.';
      default:
        return 'Call is for video consultation. Toggle your camera on/off. '
            'Open the issued e-prescription to email, sync MediLanka, or download PDF.';
    }
  }

  static String _sos(String lang) {
    switch (lang) {
      case 'si':
        return 'Suwasariya (1990) ශ්‍රී ලංකාවේ ජාතික ගිලන්රථ සේවාවයි. '
            'යෙදුමේ SOS මගින් ඇමතීමට සහ සජීවී GPS බෙදාගැනීමට හැකිය. ජීවිතාරක්ෂක හදිසි අවස්ථා සඳහා පමණි.';
      case 'ta':
        return 'Suwasariya (1990) இலங்கையின் தேசிய ஆம்புலன்ஸ் சேவை. '
            'செயலியில் SOS மூலம் அழைத்து நேரடி GPS பகிரலாம். உயிருக்கு ஆபத்தான அவசரங்களுக்கு மட்டும்.';
      default:
        return 'Suwasariya (1990) is Sri Lanka’s national ambulance service. '
            'Use in-app SOS to call and optionally share live GPS. For life-threatening emergencies only.';
    }
  }

  static String _general(String lang, String question) {
    final short = question.trim().isEmpty ? '…' : question.trim();
    switch (lang) {
      case 'si':
        return 'මම ඔබේ ප්‍රශ්නය සලකා බැලුවෙමි (“$short”). '
            'යෙදුමේ විශේෂාංග, රෝග ලක්ෂණ, හෝ වෛද්‍ය සහතික ගැන වැඩිදුර අසන්න. '
            'සහතිකයක් පැහැදිලි කිරීමට 📎 මගින් උඩුගත කරන්න. මෙය රෝග විනිශ්චයක් නොවේ.';
      case 'ta':
        return 'உங்கள் கேள்வியை ஆய்வு செய்தேன் (“$short”). '
            'செயலி அம்சங்கள், அறிகுறிகள் அல்லது மருத்துவ சான்றிதழ் பற்றி மேலும் கேளுங்கள். '
            'சான்றிதழை விளக்க 📎 மூலம் பதிவேற்றவும். இது நோய் கண்டறிதல் அல்ல.';
      default:
        return 'I reviewed your question (“$short”). '
            'Ask about app features, diseases/symptoms, or medical certificates. '
            'Upload a certificate with 📎 for an explanation. This is not a diagnosis.';
    }
  }
}
