import 'package:flutter/material.dart';

/// Lightweight EN / Sinhala / Tamil string catalog.
class AppLocalizations {
  AppLocalizations(this.locale);

  final Locale locale;

  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations)!;
  }

  static const supportedLocales = [
    Locale('en'),
    Locale('si'),
    Locale('ta'),
  ];

  static const _map = <String, Map<String, String>>{
    'appName': {
      'en': 'Suwasiri',
      'si': 'සුවසිරි',
      'ta': 'சுவசிரி',
    },
    'tagline': {
      'en': 'Your Sri Lankan digital health companion',
      'si': 'ඔබේ ශ්‍රී ලාංකික ඩිජිටල් සෞඛ්‍ය සහායක',
      'ta': 'உங்கள் இலங்கை டிஜிட்டல் சுகாதார துணை',
    },
    'home': {'en': 'Home', 'si': 'මුල් පිටුව', 'ta': 'முகப்பு'},
    'appointments': {'en': 'Doctors', 'si': 'වෛද්‍යවරු', 'ta': 'மருத்துவர்கள்'},
    'telehealth': {'en': 'Care', 'si': 'සත්කාර', 'ta': 'பராமரிப்பு'},
    'vault': {'en': 'Vault', 'si': 'භාණ්ඩාගාරය', 'ta': 'பெட்டகம்'},
    'vaccines': {'en': 'Vaccines', 'si': 'එන්නත්', 'ta': 'தடுப்பூசி'},
    'profile': {'en': 'Profile', 'si': 'පැතිකඩ', 'ta': 'சுயவிவரம்'},
    'greeting': {
      'en': 'Ayubowan',
      'si': 'ආයුබෝවන්',
      'ta': 'வணக்கம்',
    },
    'homeHelp': {
      'en': 'How can we help with your health today?',
      'si': 'අද ඔබේ සෞඛ්‍යයට අපට කෙසේ උදව් විය හැකිද?',
      'ta': 'இன்று உங்கள் ஆரோக்கியத்திற்கு எப்படி உதவலாம்?',
    },
    'searchDoctors': {
      'en': 'Search for doctors, clinics...',
      'si': 'වෛද්‍යවරුන්, සායන සොයන්න...',
      'ta': 'மருத்துவர்கள், கிளினிக்குகளைத் தேடுங்கள்...',
    },
    'healthStatus': {
      'en': 'Health status',
      'si': 'සෞඛ්‍ය තත්ත්වය',
      'ta': 'சுகாதார நிலை',
    },
    'stable': {'en': 'Stable', 'si': 'ස්ථාවර', 'ta': 'நிலையான'},
    'nextAppointment': {
      'en': 'Next appointment',
      'si': 'ඊළඟ හමුවීම',
      'ta': 'அடுத்த சந்திப்பு',
    },
    'activePrescriptions': {
      'en': 'Active prescriptions',
      'si': 'ක්‍රියාකාරී බෙහෙත්',
      'ta': 'செயலில் உள்ள மருந்துகள்',
    },
    'quickActions': {
      'en': 'Quick Actions',
      'si': 'ඉක්මන් ක්‍රියා',
      'ta': 'விரைவு செயல்கள்',
    },
    'bookAppointment': {
      'en': 'Book Appointment',
      'si': 'හමුවීම වෙන්කරන්න',
      'ta': 'சந்திப்பு முன்பதிவு',
    },
    'videoConsultation': {
      'en': 'Video Consultation',
      'si': 'වීඩියෝ උපදේශනය',
      'ta': 'வீடியோ ஆலோசனை',
    },
    'viewVault': {
      'en': 'View Vault',
      'si': 'භාණ්ඩාගාරය බලන්න',
      'ta': 'பெட்டகம் பார்க்க',
    },
    'myLabReports': {
      'en': 'My Lab Reports',
      'si': 'මගේ රසායනාගාර වාර්තා',
      'ta': 'என் ஆய்வக அறிக்கைகள்',
    },
    'upcoming': {
      'en': 'UPCOMING',
      'si': 'ඉදිරියට',
      'ta': 'வரவிருக்கும்',
    },
    'viewDetailsMap': {
      'en': 'View Details & Map',
      'si': 'විස්තර සහ සිතියම',
      'ta': 'விவரங்கள் & வரைபடம்',
    },
    'vaccinationStatus': {
      'en': 'VACCINATION STATUS',
      'si': 'එන්නත් තත්ත්වය',
      'ta': 'தடுப்பூசி நிலை',
    },
    'pending': {
      'en': 'PENDING',
      'si': 'පොරොත්තුවෙන්',
      'ta': 'நிலுவையில்',
    },
    'scheduleNow': {
      'en': 'Schedule Now',
      'si': 'දැන් වෙන්කරන්න',
      'ta': 'இப்போது திட்டமிடு',
    },
    'dueInDays': {
      'en': 'Due in {days} days',
      'si': 'දින {days} කින් නියමිතයි',
      'ta': '{days} நாட்களில் நிலுவை',
    },
    'healthTipTitle': {
      'en': 'Health Tip of the Day',
      'si': 'අද සෞඛ්‍ය උපදෙස',
      'ta': 'இன்றைய சுகாதார குறிப்பு',
    },
    'healthTipBody': {
      'en':
          'Hydrate properly before and after your vaccination. It supports optimal immune response and minimizes potential fatigue.',
      'si':
          'එන්නතට පෙර සහ පසු ජලය ප්‍රමාණවත් ලෙස පානය කරන්න. එය ප්‍රතිශක්තිකරණයට උදව් වන අතර මහන්සිය අඩු කරයි.',
      'ta':
          'தடுப்பூசிக்கு முன்பும் பின்பும் போதிய நீர் அருந்துங்கள். இது நோய் எதிர்ப்பை ஆதரித்து சோர்வைக் குறைக்கும்.',
    },
    'noUpcoming': {
      'en': 'No upcoming appointments',
      'si': 'ඉදිරි හමුවීම් නැත',
      'ta': 'வரவிருக்கும் சந்திப்புகள் இல்லை',
    },
    'inPerson': {
      'en': 'In-Person',
      'si': 'ස්ථානයේ',
      'ta': 'நேரில்',
    },
    'directoryTitle': {
      'en': 'Specialist Medical Directory',
      'si': 'විශේෂඥ වෛද්‍ය නාමාවලිය',
      'ta': 'சிறப்பு மருத்துவ அடைவு',
    },
    'directorySubtitle': {
      'en':
          'Select or clear criteria to find leading consultants registered at top accredited Sri Lankan hospitals.',
      'si':
          'ප්‍රමුඛ රෝහල්වල ලියාපදිංචි විශේෂඥ වෛද්‍යවරුන් සොයා ගැනීමට නිර්ණායක තෝරන්න.',
      'ta':
          'முன்னணி இலங்கை மருத்துவமனைகளில் பதிவுசெய்யப்பட்ட ஆலோசகர்களைக் கண்டறிய அளவுகோல்களைத் தேர்ந்தெடுக்கவும்.',
    },
    'dividedSearchOptions': {
      'en': 'DIVIDED SEARCH OPTIONS',
      'si': 'සෙවුම් විකල්ප',
      'ta': 'தேடல் விருப்பங்கள்',
    },
    'searchByClinician': {
      'en': '1. Search According to Clinicians Name',
      'si': '1. වෛද්‍යවරයාගේ නමින් සොයන්න',
      'ta': '1. மருத்துவர் பெயரால் தேடுங்கள்',
    },
    'clinicianHint': {
      'en': 'e.g. Dr. Perera, Dr',
      'si': 'උදා. Dr. Perera',
      'ta': 'எ.கா. Dr. Perera',
    },
    'filterByRegion': {
      'en': '2. Filter by Area / Region Wise',
      'si': '2. ප්‍රදේශය අනුව පෙරහන් කරන්න',
      'ta': '2. பகுதி / மாவட்டம் வடிகட்டி',
    },
    'allRegions': {
      'en': 'All Sri Lanka Regions',
      'si': 'සියලුම ප්‍රදේශ',
      'ta': 'அனைத்து பகுதிகளும்',
    },
    'browseSpecialties': {
      'en': '3. Browse by Specialties & Categories',
      'si': '3. විශේෂතා අනුව බලන්න',
      'ta': '3. சிறப்புப் பிரிவுகளால் உலாவுங்கள்',
    },
    'allCategories': {
      'en': 'All Categories',
      'si': 'සියලු කාණ්ඩ',
      'ta': 'அனைத்து வகைகள்',
    },
    'generalCategory': {
      'en': 'General',
      'si': 'සාමාන්‍ය',
      'ta': 'பொது',
    },
    'liveClinicsMap': {
      'en': 'LIVE LK CLINICS MAP',
      'si': 'සජීවී LK සායන සිතියම',
      'ta': 'நேரடி LK கிளினிக் வரைபடம்',
    },
    'accreditedMap': {
      'en': 'Accredited Health Venues Map',
      'si': 'අනුමත සෞඛ්‍ය ස්ථාන සිතියම',
      'ta': 'அங்கீகரிக்கப்பட்ட சுகாதார இட வரைபடம்',
    },
    'sriLankaHub': {
      'en': 'Sri Lanka Hub',
      'si': 'ශ්‍රී ලංකා කේන්ද්‍රය',
      'ta': 'இலங்கை மையம்',
    },
    'mappedAddressRef': {
      'en': 'MAPPED ADDRESS REFERENCE',
      'si': 'සිතියම් ලිපින යොමුව',
      'ta': 'வரைபட முகவரி குறிப்பு',
    },
    'mappedAddresses': {
      'en':
          'Durdans Hospital, Colombo 03 · Nawaloka Hospital, Colombo 02 · Asiri Central, Colombo 10 · Lanka Hospitals, Colombo 05',
      'si':
          'Durdans Hospital, Colombo 03 · Nawaloka Hospital, Colombo 02 · Asiri Central, Colombo 10 · Lanka Hospitals, Colombo 05',
      'ta':
          'Durdans Hospital, Colombo 03 · Nawaloka Hospital, Colombo 02 · Asiri Central, Colombo 10 · Lanka Hospitals, Colombo 05',
    },
    'resultsFound': {
      'en': 'Results found: {count} doctors',
      'si': 'ප්‍රතිඵල: වෛද්‍යවරුන් {count}',
      'ta': 'முடிவுகள்: {count} மருத்துவர்கள்',
    },
    'noDoctorsFound': {
      'en': 'No doctors match your filters',
      'si': 'පෙරහන්වලට ගැලපෙන වෛද්‍යවරුන් නැත',
      'ta': 'வடிகட்டிகளுக்கு பொருந்தும் மருத்துவர்கள் இல்லை',
    },
    'yearsExpertise': {
      'en': '{years} Years active expertise',
      'si': 'වසර {years} ක ක්‍රියාකාරී ප්‍රවීණත්වය',
      'ta': '{years} ஆண்டுகள் அனுபவம்',
    },
    'consultationFees': {
      'en': 'CONSULTATION FEES',
      'si': 'උපදේශන ගාස්තු',
      'ta': 'ஆலோசனை கட்டணம்',
    },
    'bookSession': {
      'en': 'Book Session',
      'si': 'සැසිය වෙන්කරන්න',
      'ta': 'அமர்வு முன்பதிவு',
    },
    'emergencySos': {
      'en': '1990',
      'si': '1990',
      'ta': '1990',
    },
    'telehealthTitle': {
      'en': 'Telehealth',
      'si': 'දුරස්ථ සෞඛ්‍ය',
      'ta': 'தொலை சுகாதாரம்',
    },
    'telehealthSubtitle': {
      'en': 'Secure encrypted video consult with registered practitioners.',
      'si': 'ලියාපදිංචි වෛද්‍යවරුන් සමඟ ආරක්ෂිත වීඩියෝ උපදේශනය.',
      'ta': 'பதிவுசெய்யப்பட்ட மருத்துவர்களுடன் பாதுகாப்பான வீடியோ ஆலோசனை.',
    },
    'joinConsultHint': {
      'en': 'Join your Lanka GP Care video consultation',
      'si': 'Lanka GP Care වීඩියෝ උපදේශනයට සම්බන්ධ වන්න',
      'ta': 'Lanka GP Care வீடியோ ஆலோசனையில் சேரவும்',
    },
    'joinCall': {
      'en': 'Join',
      'si': 'සම්බන්ධ වන්න',
      'ta': 'சேர்',
    },
    'recSecure': {
      'en': '● REC SECURE',
      'si': '● REC SECURE',
      'ta': '● REC SECURE',
    },
    'youFeed': {
      'en': 'You',
      'si': 'ඔබ',
      'ta': 'நீங்கள்',
    },
    'aiTranslateTitle': {
      'en': 'REAL-TIME AI TRANSLATE',
      'si': 'තත්‍ය කාලීන AI පරිවර්තනය',
      'ta': 'நேரடி AI மொழிபெயர்ப்பு',
    },
    'aiTranslateBody': {
      'en':
          'Heart rate per minute. Normally this should be between 60-100 beats. Your current vitals show robust stability.',
      'si':
          'විනාඩියකට හෘද ස්පන්දන. සාමාන්‍යයෙන් 60-100 අතර විය යුතුය. ඔබේ වර්තමාන තත්ත්වය ස්ථාවරයි.',
      'ta':
          'நிமிடத்திற்கு இதயத் துடிப்பு. பொதுவாக 60-100. உங்கள் தற்போதைய அறிகுறிகள் நிலையானவை.',
    },
    'gpCareLive': {
      'en': 'Lanka GP Care · live',
      'si': 'Lanka GP Care · සජීවී',
      'ta': 'Lanka GP Care · நேரடி',
    },
    'liveConsultation': {
      'en': 'Live Consultation',
      'si': 'සජීවී උපදේශනය',
      'ta': 'நேரடி ஆலோசனை',
    },
    'secureV3': {
      'en': 'SECURE-V3',
      'si': 'SECURE-V3',
      'ta': 'SECURE-V3',
    },
    'patientProfile': {
      'en': 'PATIENT PROFILE',
      'si': 'රෝගී පැතිකඩ',
      'ta': 'நோயாளி சுயவிவரம்',
    },
    'timeRemaining': {
      'en': 'TIME REMAINING',
      'si': 'ඉතිරි කාලය',
      'ta': 'மீதமுள்ள நேரம்',
    },
    'ePrescription': {
      'en': 'E-Prescription',
      'si': 'ඊ-බෙහෙත් වට්ටෝරුව',
      'ta': 'மின் மருந்துச்சீட்டு',
    },
    'doctorUpdatingRx': {
      'en': 'Doctor is currently updating these records…',
      'si': 'වෛද්‍යවරයා මෙම වාර්තා යාවත්කාලීන කරමින් සිටී…',
      'ta': 'மருத்துவர் இப்பதிவுகளை புதுப்பித்து வருகிறார்…',
    },
    'sendPharmacare': {
      'en': 'Send to PharmaCare Portal',
      'si': 'PharmaCare ද්වාරයට යවන්න',
      'ta': 'PharmaCare போர்ட்டலுக்கு அனுப்பு',
    },
    'pharmacareSent': {
      'en': 'Sent to PharmaCare pharmacist portal',
      'si': 'PharmaCare ඖෂධකරු ද්වාරයට යවන ලදී',
      'ta': 'PharmaCare மருந்தாளர் போர்ட்டலுக்கு அனுப்பப்பட்டது',
    },
    'quickNotes': {
      'en': 'Quick Notes',
      'si': 'ඉක්මන් සටහන්',
      'ta': 'விரைவு குறிப்புகள்',
    },
    'viewAll': {
      'en': 'View All',
      'si': 'සියල්ල බලන්න',
      'ta': 'அனைத்தும்',
    },
    'privateNoteHint': {
      'en': 'Add private note for yourself…',
      'si': 'ඔබ වෙනුවෙන් පෞද්ගලික සටහනක්…',
      'ta': 'உங்களுக்கான தனிப்பட்ட குறிப்பு…',
    },
    'add': {'en': 'Add', 'si': 'එකතු කරන්න', 'ta': 'சேர்'},
    'aiCopilotActive': {
      'en': 'AI CLINIC CO-PILOT ACTIVE',
      'si': 'AI සායන සහායක සක්‍රීයයි',
      'ta': 'AI கிளினிக் உதவியாளர் செயலில்',
    },
    'aiCopilotHint': {
      'en': 'Ask AI Co-Pilot about diagnostics during the call',
      'si': 'ඇමතුම අතරතුර රෝග විනිශ්චය ගැන AI ගෙන් අසන්න',
      'ta': 'அழைப்பின்போது நோயறிதல் பற்றி AI-யிடம் கேளுங்கள்',
    },
    'aiCopilotPlaceholder': {
      'en': 'e.g. explain normal pulse range in Sinhala…',
      'si': 'උදා. සාමාන්‍ය නාඩි පරාසය සිංහලෙන්…',
      'ta': 'எ.கா. சாதாரண நாடி வரம்பை தமிழில்…',
    },
    'aiCopilotReply': {
      'en':
          'Normal resting pulse for adults is typically 60–100 bpm. Stay hydrated and rest.',
      'si':
          'වැඩිහිටියන්ගේ සාමාන්‍ය නාඩි 60–100 bpm වේ. ජලය පානය කර විවේක ගන්න.',
      'ta':
          'வயது வந்தோருக்கு சாதாரண நாடி 60–100 bpm. நீர் அருந்தி ஓய்வெடுங்கள்.',
    },
    'shareSimulated': {
      'en': 'Share / upload simulated for this session',
      'si': 'මෙම සැසිය සඳහා බෙදාගැනීම අනුකරණය කෙරිණි',
      'ta': 'இந்த அமர்வுக்கு பகிர்வு உருவகப்படுத்தப்பட்டது',
    },
    'medicalVault': {
      'en': 'Medical Vault',
      'si': 'වෛද්‍ය භාණ්ඩාගාරය',
      'ta': 'மருத்துவ பெட்டகம்',
    },
    'vaultSubtitle': {
      'en': 'Manage and access your unified health records.',
      'si': 'ඔබේ එක්සත් සෞඛ්‍ය වාර්තා කළමනාකරණය කරන්න.',
      'ta': 'உங்கள் ஒருங்கிணைந்த சுகாதார பதிவுகளை நிர்வகிக்கவும்.',
    },
    'aiLabAssistant': {
      'en': 'AI Lab Assistant',
      'si': 'AI රසායනාගාර සහායක',
      'ta': 'AI ஆய்வக உதவியாளர்',
    },
    'aiLabAssistantBody': {
      'en':
          'Unsure about your results? Our AI can translate complex medical jargon into simple Sinhala or Tamil. Click on any lab report to get an explanation.',
      'si':
          'ප්‍රතිඵල ගැන අවිනිශ්චිතද? AI මගින් වෛද්‍ය භාෂාව සරල සිංහල හෝ දෙමළට පෙරළයි. පැහැදිලි කිරීමට වාර්තාවක් තෝරන්න.',
      'ta':
          'முடிவுகள் குறித்து தெளிவில்லையா? AI மருத்துவ சொற்களை எளிய தமிழ்/சிங்களத்திற்கு மாற்றும். விளக்கத்திற்கு ஒரு அறிக்கையைத் தேர்ந்தெடுக்கவும்.',
    },
    'tryExplainNow': {
      'en': 'Try Explain Now',
      'si': 'දැන් පැහැදිලි කරන්න',
      'ta': 'இப்போது விளக்கு',
    },
    'issuedMedicines': {
      'en': 'Issued Medicines',
      'si': 'නිකුත් කළ බෙහෙත්',
      'ta': 'வழங்கப்பட்ட மருந்துகள்',
    },
    'labReports': {
      'en': 'Lab Reports',
      'si': 'රසායනාගාර වාර්තා',
      'ta': 'ஆய்வக அறிக்கைகள்',
    },
    'recordsCount': {
      'en': '{count} Records',
      'si': 'වාර්තා {count}',
      'ta': '{count} பதிவுகள்',
    },
    'recentTimeline': {
      'en': 'RECENT TIMELINE',
      'si': 'මෑත කාලරේඛාව',
      'ta': 'சமீப காலவரிசை',
    },
    'chronological': {
      'en': 'Chronological',
      'si': 'කාලානුක්‍රමික',
      'ta': 'காலவரிசை',
    },
    'gpCareSynced': {
      'en': 'GP Care Synced (LK-NHD)',
      'si': 'GP Care සමමුහුර්ත (LK-NHD)',
      'ta': 'GP Care ஒத்திசைவு (LK-NHD)',
    },
    'gpCareSyncedHint': {
      'en': 'Authenticated and linked with central health portal.',
      'si': 'මධ්‍යම සෞඛ්‍ය ද්වාරය සමඟ සත්‍යාපිත සම්බන්ධතාව.',
      'ta': 'மத்திய சுகாதார போர்ட்டலுடன் அங்கீகரிக்கப்பட்ட இணைப்பு.',
    },
    'activeBadge': {
      'en': 'ACTIVE',
      'si': 'සක්‍රීය',
      'ta': 'செயலில்',
    },
    'lankaLabPortal': {
      'en': 'LankaLab Portal',
      'si': 'LankaLab ද්වාරය',
      'ta': 'LankaLab போர்டல்',
    },
    'centralLabRegistrar': {
      'en': 'Central Lab Registrar',
      'si': 'මධ්‍යම රසායනාගාර ලේඛනය',
      'ta': 'மத்திய ஆய்வக பதிவாளர்',
    },
    'lankaLabBody': {
      'en':
          'Pulls HbA1c glucose counts & laboratory pathology indexes directly.',
      'si': 'HbA1c සහ රසායනාගාර ව්‍යාධි දර්ශක සෘජුව ලබා ගනී.',
      'ta': 'HbA1c மற்றும் ஆய்வக குறியீடுகளை நேரடியாக இழுக்கும்.',
    },
    'syncLankaLab': {
      'en': 'Sync LankaLab',
      'si': 'LankaLab සමමුහුර්ත',
      'ta': 'LankaLab ஒத்திசை',
    },
    'lankaGpCare': {
      'en': 'Lanka GP Care',
      'si': 'Lanka GP Care',
      'ta': 'Lanka GP Care',
    },
    'practitionerPrescriptions': {
      'en': 'Practitioner Prescriptions',
      'si': 'වෛද්‍ය බෙහෙත් වට්ටෝරු',
      'ta': 'மருத்துவர் மருந்துச்சீட்டுகள்',
    },
    'lankaGpBody': {
      'en':
          'Pulls active medicine lists & doctor e-prescriptions dynamically.',
      'si': 'ක්‍රියාකාරී බෙහෙත් සහ ඊ-වට්ටෝරු ගතිකව ලබා ගනී.',
      'ta': 'செயலில் உள்ள மருந்துகள் மற்றும் மின் மருந்துச்சீட்டுகளை இழுக்கும்.',
    },
    'syncLankaGp': {
      'en': 'Sync Lanka GP Care',
      'si': 'GP Care සමමුහුර්ත',
      'ta': 'GP Care ஒத்திசை',
    },
    'synced': {
      'en': 'SYNCED',
      'si': 'සමමුහුර්ත',
      'ta': 'ஒத்திசைந்தது',
    },
    'selfUploads': {
      'en': 'SELF UPLOADS',
      'si': 'ස්වයං උඩුගත',
      'ta': 'சுய பதிவேற்றங்கள்',
    },
    'readyForAi': {
      'en': 'READY FOR AI',
      'si': 'AI සඳහා සූදානම්',
      'ta': 'AIக்கு தயார்',
    },
    'category': {
      'en': 'Category',
      'si': 'කාණ්ඩය',
      'ta': 'வகை',
    },
    'requestedBy': {
      'en': 'Requested by',
      'si': 'ඉල්ලූ වෛද්‍ය',
      'ta': 'கோரியவர்',
    },
    'unlockVault': {
      'en': 'Unlock Health Vault',
      'si': 'සෞඛ්‍ය භාණ්ඩාගාරය අගුළු හරින්න',
      'ta': 'சுகாதார பெட்டகத்தை திறக்க',
    },
    'unlockVaultHint': {
      'en': 'Use Face ID / Touch ID to access medical records.',
      'si': 'වාර්තා ලබා ගැනීමට Face ID / Touch ID භාවිතා කරන්න.',
      'ta': 'பதிவுகளை அணுக Face ID / Touch ID பயன்படுத்தவும்.',
    },
    'authenticate': {
      'en': 'Authenticate',
      'si': 'සත්‍යාපනය',
      'ta': 'அங்கீகரி',
    },
    'aiSelectReport': {
      'en': 'Select a lab report, then ask a question.',
      'si': 'වාර්තාවක් තෝරා ප්‍රශ්නයක් අසන්න.',
      'ta': 'ஒரு அறிக்கையைத் தேர்ந்தெடுத்து கேள்வி கேளுங்கள்.',
    },
    'askingAbout': {
      'en': 'Asking about',
      'si': 'විමසන වාර්තාව',
      'ta': 'கேட்கும் அறிக்கை',
    },
    'aiExplainHint': {
      'en': 'Explain my HbA1c in simple Sinhala…',
      'si': 'මගේ HbA1c සරලව පැහැදිලි කරන්න…',
      'ta': 'என் HbA1c-ஐ எளிமையாக விளக்கு…',
    },
    'noMedicines': {
      'en': 'No issued medicines yet — sync Lanka GP Care.',
      'si': 'බෙහෙත් නැත — Lanka GP Care සමමුහුර්ත කරන්න.',
      'ta': 'மருந்துகள் இல்லை — Lanka GP Care ஒத்திசைக்கவும்.',
    },
    'noLabReports': {
      'en': 'No lab reports yet — sync LankaLab.',
      'si': 'වාර්තා නැත — LankaLab සමමුහුර්ත කරන්න.',
      'ta': 'ஆய்வக அறிக்கைகள் இல்லை — LankaLab ஒத்திசைக்கவும்.',
    },
    'vaccineRegistryTitle': {
      'en': 'National Immunization & Vaccination Registry',
      'si': 'ජාතික එන්නත් හා ප්‍රතිශක්තිකරණ ලේඛනය',
      'ta': 'தேசிய தடுப்பூசி & நோய்த்தடுப்பு பதிவு',
    },
    'vaccineRegistrySubtitle': {
      'en':
          'Track MOH-certified immunization protocols and book the next dose at accredited clinics.',
      'si':
          'සෞඛ්‍ය අමාත්‍යාංශ සහතික එන්නත් ප්‍රොටෝකෝල නිරීක්ෂණය කර සායනවල මීළඟ මාත්‍රාව වෙන්කරන්න.',
      'ta':
          'சுகாதார அமைச்சு சான்றளித்த தடுப்பூசி நெறிமுறைகளைக் கண்காணித்து அடுத்த டோஸை முன்பதிவு செய்யுங்கள்.',
    },
    'requestBookVaccine': {
      'en': 'Request & Book Vaccine Dose',
      'si': 'එන්නත් මාත්‍රාව ඉල්ලා වෙන්කරන්න',
      'ta': 'தடுப்பூசி டோஸ் கோரி முன்பதிவு',
    },
    'mohPortalLink': {
      'en': 'MOH National Vaccine Portal Link',
      'si': 'සෞඛ්‍ය අමාත්‍යාංශ ජාතික එන්නත් ද්වාරය',
      'ta': 'சுகாதார அமைச்சு தேசிய தடுப்பூசி போர்டல்',
    },
    'mohCentralRegistry': {
      'en': 'Integrated Central Registry (MOH-LK)',
      'si': 'ඒකාබද්ධ මධ්‍යම ලේඛනය (MOH-LK)',
      'ta': 'ஒருங்கிணைந்த மத்திய பதிவு (MOH-LK)',
    },
    'liveSyncedCaps': {
      'en': 'LIVE SYNCED',
      'si': 'සජීවී සමමුහුර්ත',
      'ta': 'நேரடி ஒத்திசைவு',
    },
    'syncTimestamp': {
      'en': 'SYNC TIMESTAMP',
      'si': 'සමමුහුර්ත වේලාව',
      'ta': 'ஒத்திசைவு நேரம்',
    },
    'registryProfile': {
      'en': 'REGISTRY PROFILE',
      'si': 'ලේඛන පැතිකඩ',
      'ta': 'பதிவு சுயவிவரம்',
    },
    'verifiedLankaId': {
      'en': 'Verified Lanka ID',
      'si': 'සත්‍යාපිත Lanka ID',
      'ta': 'சரிபார்க்கப்பட்ட Lanka ID',
    },
    'mohDengueAlert': {
      'en':
          'MOH Alert: Active Dengue preventative dose 2 scheduling currently open.',
      'si': 'සෞඛ්‍ය අමාත්‍යාංශ දැනුම්දීම: ඩෙංගු මාත්‍රා 2 වෙන්කිරීම විවෘතයි.',
      'ta': 'சுகாதார அமைச்சு எச்சரிக்கை: டெங்கு டோஸ் 2 அட்டவணை திறந்துள்ளது.',
    },
    'registryUpdate': {
      'en': 'REGISTRY UPDATE',
      'si': 'ලේඛන යාවත්කාලීනය',
      'ta': 'பதிவு புதுப்பிப்பு',
    },
    'activeDengueProtocol': {
      'en': 'Active Dengue Immuno-Protocol',
      'si': 'සක්‍රීය ඩෙංගු ප්‍රතිශක්ති ප්‍රොටෝකෝලය',
      'ta': 'செயலில் உள்ள டெங்கு நோய் எதிர்ப்பு நெறிமுறை',
    },
    'activeDengueBody': {
      'en':
          'Your second dose (Qdenga Vaccine) is currently pending in {days} days to reach full protective immunity levels.',
      'si':
          'සම්පූර්ණ ප්‍රතිශක්තිය සඳහා ඔබේ දෙවන මාත්‍රාව (Qdenga) දින {days} කින් නියමිතයි.',
      'ta':
          'முழு பாதுகாப்பிற்கு உங்கள் இரண்டாவது டோஸ் (Qdenga) {days} நாட்களில் நிலுவையில் உள்ளது.',
    },
    'registryStatusActive': {
      'en': 'Registry Status: Active Secure',
      'si': 'ලේඛන තත්ත්වය: සක්‍රීය ආරක්ෂිත',
      'ta': 'பதிவு நிலை: செயலில் பாதுகாப்பானது',
    },
    'immunityIndex': {
      'en': 'Immunity Index',
      'si': 'ප්‍රතිශක්ති දර්ශකය',
      'ta': 'நோய் எதிர்ப்பு குறியீடு',
    },
    'registeredProtocols': {
      'en': 'REGISTERED VACCINE PROTOCOLS',
      'si': 'ලියාපදිංචි එන්නත් ප්‍රොටෝකෝල',
      'ta': 'பதிவுசெய்யப்பட்ட தடுப்பூசி நெறிமுறைகள்',
    },
    'immunizationProgress': {
      'en': 'Immunization completion progress',
      'si': 'එන්නත් සම්පූර්ණ කිරීමේ ප්‍රගතිය',
      'ta': 'தடுப்பூசி முன்னேற்றம்',
    },
    'dueDate': {
      'en': 'Due date',
      'si': 'නියමිත දිනය',
      'ta': 'நிலுவை தேதி',
    },
    'scheduleDoseNow': {
      'en': 'Schedule Dose Now',
      'si': 'දැන් මාත්‍රාව වෙන්කරන්න',
      'ta': 'இப்போது டோஸ் திட்டமிடு',
    },
    'fullyImmunised': {
      'en': 'Fully immunised',
      'si': 'සම්පූර්ණයෙන් ප්‍රතිශක්තිකරණය',
      'ta': 'முழுமையாக தடுப்பூசி போடப்பட்டது',
    },
    'mohCertifiedNote': {
      'en':
          'Vaccination schedules are certified directly by the MOH (Ministry of Health Sri Lanka) and verified with national registration files. Contact support for clerical errors.',
      'si':
          'එන්නත් කාලසටහන් සෞඛ්‍ය අමාත්‍යාංශය විසින් සහතික කර ජාතික ලේඛන සමඟ සත්‍යාපනය කෙරේ. ලිපිකාර දෝෂ සඳහා සහාය අමතන්න.',
      'ta':
          'தடுப்பூசி அட்டவணைகள் சுகாதார அமைச்சால் சான்றளிக்கப்பட்டு தேசிய பதிவுகளுடன் சரிபார்க்கப்படுகின்றன. பிழைகளுக்கு ஆதரவைத் தொடர்புகொள்ளுங்கள்.',
    },
    'medicalDistrict': {
      'en': 'Medical district',
      'si': 'වෛද්‍ය දිස්ත්‍රික්කය',
      'ta': 'மருத்துவ மாவட்டம்',
    },
    'allDistricts': {
      'en': 'All districts',
      'si': 'සියලු දිස්ත්‍රික්ක',
      'ta': 'அனைத்து மாவட்டங்கள்',
    },
    'reserve': {
      'en': 'Reserve',
      'si': 'වෙන්කරන්න',
      'ta': 'முன்பதிவு',
    },
    'notSignedIn': {
      'en': 'Not signed in',
      'si': 'පිවිසී නැත',
      'ta': 'உள்நுழையவில்லை',
    },
    'editProfile': {
      'en': 'Edit clinical profile',
      'si': 'සායනික පැතිකඩ සංස්කරණය',
      'ta': 'மருத்துவ சுயவிவரம் திருத்து',
    },
    'communicationReminders': {
      'en': 'Communication & Reminders',
      'si': 'සන්නිවේදනය සහ මතක් කිරීම්',
      'ta': 'தொடர்பு & நினைவூட்டல்கள்',
    },
    'saveSettings': {
      'en': 'SAVE SETTINGS',
      'si': 'සුරකින්න',
      'ta': 'சேமி',
    },
    'settingsSaved': {
      'en': 'Communication settings saved',
      'si': 'සන්නිවේදන සැකසුම් සුරකින ලදී',
      'ta': 'தொடர்பு அமைப்புகள் சேமிக்கப்பட்டன',
    },
    'instantSms': {
      'en': 'Instant SMS notifications',
      'si': 'ක්ෂණික SMS දැනුම්දීම්',
      'ta': 'உடனடி SMS அறிவிப்புகள்',
    },
    'instantSmsHint': {
      'en':
          'Send alerts for appointment slot validation times via Dialog/Mobitel SMS.',
      'si': 'හමුවීම් වෙලාවන් සඳහා Dialog/Mobitel SMS ඇඟවීම් යවන්න.',
      'ta': 'சந்திப்பு நேரங்களுக்கு Dialog/Mobitel SMS விழிப்பூட்டல்கள்.',
    },
    'whatsappNotifications': {
      'en': 'WhatsApp Notifications',
      'si': 'WhatsApp දැනුම්දීම්',
      'ta': 'WhatsApp அறிவிப்புகள்',
    },
    'whatsappHint': {
      'en':
          'Receive reminders, diagnostics notifications, and prescription alerts immediately.',
      'si': 'මතක් කිරීම්, රෝග විනිශ්චය සහ බෙහෙත් ඇඟවීම් වහාම ලබා ගන්න.',
      'ta': 'நினைவூட்டல்கள், பரிசோதனை மற்றும் மருந்து எச்சரிக்கைகளை உடனடியாகப் பெறுங்கள்.',
    },
    'whatsappMobileNumber': {
      'en': 'WHATSAPP MOBILE NUMBER',
      'si': 'WHATSAPP ජංගම අංකය',
      'ta': 'WHATSAPP கைபேசி எண்',
    },
    'reminderOffset': {
      'en': 'Appointment Reminder Offset',
      'si': 'හමුවීම් මතක් කිරීමේ කාලය',
      'ta': 'சந்திப்பு நினைவூட்டல் நேரம்',
    },
    'reminderOffsetHint': {
      'en': 'Determine when reminders are pushed prior to clinicians schedules.',
      'si': 'වෛද්‍ය කාලසටහන්ට පෙර මතක් කිරීම් යවන වේලාව තෝරන්න.',
      'ta': 'மருத்துவர் அட்டவணைக்கு முன் நினைவூட்டல் நேரத்தைத் தேர்ந்தெடுக்கவும்.',
    },
    'emailReports': {
      'en': 'Email Reports updates',
      'si': 'විද්‍යුත් තැපැල් වාර්තා යාවත්කාලීන',
      'ta': 'மின்னஞ்சல் அறிக்கை புதுப்பிப்புகள்',
    },
    'emailReportsHint': {
      'en':
          'Dispatch secured carbon PDF files automatically to your email address: {email}.',
      'si': 'ආරක්ෂිත PDF වාර්තා ස්වයංක්‍රීයව {email} වෙත යවන්න.',
      'ta': 'பாதுகாப்பான PDF அறிக்கைகளை தானாக {email}க்கு அனுப்பவும்.',
    },
    'treatmentHistory': {
      'en': 'Patient Health & Treatment History',
      'si': 'රෝගී සෞඛ්‍ය සහ ප්‍රතිකාර ඉතිහාසය',
      'ta': 'நோயாளி சுகாதாரம் & சிகிச்சை வரலாறு',
    },
    'treatmentHistoryHint': {
      'en':
          'Secure chronological registry of issued medications, laboratory parameters, and specialist consultations synced from the LK GP Care Portal.',
      'si':
          'LK GP Care ද්වාරයෙන් සමමුහුර්ත කළ බෙහෙත්, රසායනාගාර සහ විශේෂඥ උපදේශනවල ආරක්ෂිත කාලානුක්‍රමික ලේඛනය.',
      'ta':
          'LK GP Care போர்ட்டலில் இருந்து ஒத்திசைக்கப்பட்ட மருந்துகள், ஆய்வக அளவுருக்கள் மற்றும் சிறப்பு ஆலோசனைகளின் பாதுகாப்பான காலவரிசை.',
    },
    'treatmentPlan': {
      'en': 'TREATMENT PLAN',
      'si': 'ප්‍රතිකාර සැලැස්ම',
      'ta': 'சிகிச்சை திட்டம்',
    },
    'issuedClinicalMedicines': {
      'en': 'ISSUED CLINICAL MEDICINES:',
      'si': 'නිකුත් කළ සායනික බෙහෙත්:',
      'ta': 'வழங்கப்பட்ட மருத்துவ மருந்துகள்:',
    },
    'securitySupport': {
      'en': 'Security & Support ID Checks',
      'si': 'ආරක්ෂාව සහ සහාය හැඳුනුම් පරීක්ෂා',
      'ta': 'பாதுகாப்பு & ஆதரவு அடையாள சரிபார்ப்பு',
    },
    'logoutSession': {
      'en': 'Log Out Profile Session',
      'si': 'පැතිකඩ සැසියෙන් ඉවත් වන්න',
      'ta': 'சுயவிவர அமர்விலிருந்து வெளியேறு',
    },
    'book': {'en': 'Book', 'si': 'වෙන්කරන්න', 'ta': 'முன்பதிவு'},
    'login': {'en': 'Sign in', 'si': 'පිවිසෙන්න', 'ta': 'உள்நுழை'},
    'register': {'en': 'Create account', 'si': 'ගිණුමක් සාදන්න', 'ta': 'கணக்கு உருவாக்கு'},
    'email': {'en': 'Email', 'si': 'විද්‍යුත් තැපෑල', 'ta': 'மின்னஞ்சல்'},
    'password': {'en': 'Password', 'si': 'මුරපදය', 'ta': 'கடவுச்சொல்'},
    'phone': {'en': 'Mobile number', 'si': 'ජංගම අංකය', 'ta': 'கைபேசி எண்'},
    'continueWithGoogle': {
      'en': 'Continue with Google',
      'si': 'Google සමඟ ඉදිරියට',
      'ta': 'Google உடன் தொடரவும்',
    },
    'notifications': {
      'en': 'Notifications',
      'si': 'දැනුම්දීම්',
      'ta': 'அறிவிப்புகள்',
    },
    'liveSynced': {
      'en': 'Live Synced',
      'si': 'සජීවී සමමුහුර්ත',
      'ta': 'நேரடி ஒத்திசைவு',
    },
    'mohBanner': {
      'en': 'MOH registry sync',
      'si': 'සෞඛ්‍ය අමාත්‍යාංශ ලේඛන සමමුහුර්තය',
      'ta': 'சுகாதார அமைச்சு பதிவு ஒத்திசைவு',
    },
    'searchClinic': {
      'en': 'Search clinics & hospitals',
      'si': 'සායන සහ රෝහල් සොයන්න',
      'ta': 'மருத்துவமனைகளைத் தேடுங்கள்',
    },
    'cprTitle': {
      'en': 'CPR first-aid steps',
      'si': 'CPR මූලික ප්‍රථමාධාර',
      'ta': 'CPR முதலுதவி படிகள்',
    },
    'cprSteps': {
      'en':
          '1. Check responsiveness\n2. Call 1990\n3. Start chest compressions\n4. Open airway & give rescue breaths if trained',
      'si':
          '1. ප්‍රතිචාර පරීක්ෂා කරන්න\n2. 1990 අමතන්න\n3. පපුව මිරිකීම් ආරම්භ කරන්න\n4. පුහුණුව ඇත්නම් ශ්වසන ආධාර ලබා දෙන්න',
      'ta':
          '1. பதிலைச் சரிபார்க்கவும்\n2. 1990 அழைக்கவும்\n3. மார்பு அழுத்தங்களைத் தொடங்கவும்\n4. பயிற்சி இருந்தால் மூச்சு உதவி அளிக்கவும்',
    },
    'streamingGps': {
      'en': 'Streaming GPS to Suwasariya control',
      'si': 'Suwasariya මධ්‍යස්ථානයට GPS යවමින්',
      'ta': 'Suwasariya கட்டுப்பாட்டிற்கு GPS அனுப்புகிறது',
    },
    'aiAssistant': {
      'en': 'AI Report Assistant',
      'si': 'AI වාර්තා සහායක',
      'ta': 'AI அறிக்கை உதவியாளர்',
    },
    'logout': {'en': 'Sign out', 'si': 'ඉවත් වන්න', 'ta': 'வெளியேறு'},
    'onboardSosTitle': {
      'en': 'Emergency 1990 SOS',
      'si': '1990 හදිසි SOS',
      'ta': '1990 அவசர SOS',
    },
    'onboardSosBody': {
      'en': 'One tap dials Suwasariya and streams your live GPS to dispatch.',
      'si': 'එක තට්ටුවකින් Suwasariya අමතා ඔබේ GPS යවයි.',
      'ta': 'ஒரு தட்டலில் Suwasariya அழைத்து உங்கள் GPS அனுப்பும்.',
    },
    'onboardVaxTitle': {
      'en': 'MOH Vaccine Booking',
      'si': 'සෞඛ්‍ය අමාත්‍යාංශ එන්නත් වෙන්කිරීම',
      'ta': 'சுகாதார அமைச்சு தடுப்பூசி முன்பதிவு',
    },
    'onboardVaxBody': {
      'en': 'Book MOH clinics and track national immunization progress.',
      'si': 'සායන වෙන්කර ජාතික එන්නත් ප්‍රගතිය නිරීක්ෂණය කරන්න.',
      'ta': 'மருத்துவமனைகளை முன்பதிவு செய்து தடுப்பூசி முன்னேற்றத்தைக் கண்காணுங்கள்.',
    },
    'onboardVaultTitle': {
      'en': 'Secure Health Vault',
      'si': 'ආරක්ෂිත සෞඛ්‍ය භාණ්ඩාගාරය',
      'ta': 'பாதுகாப்பான சுகாதார பெட்டகம்',
    },
    'onboardVaultBody': {
      'en': 'LankaLab reports and GP prescriptions, synced and encrypted.',
      'si': 'LankaLab වාර්තා සහ වෛද්‍ය බෙහෙත් — සමමුහුර්ත සහ සංකේතිත.',
      'ta': 'LankaLab அறிக்கைகள் மற்றும் மருந்துகள் — ஒத்திசைவு மற்றும் பாதுகாப்பு.',
    },
    'getStarted': {
      'en': 'Get started',
      'si': 'ආරම්භ කරන්න',
      'ta': 'தொடங்கவும்',
    },
    'skip': {'en': 'Skip', 'si': 'මඟ හරින්න', 'ta': 'தவிர்'},
    'noUnread': {
      'en': 'All caught up',
      'si': 'සියල්ල යාවත්කාලීනයි',
      'ta': 'அனைத்தும் புதுப்பிக்கப்பட்டது',
    },
    'takeSelfie': {
      'en': 'Take selfie / photo',
      'si': 'සෙල්ෆි / ඡායාරූපය ගන්න',
      'ta': 'செல்ஃபி / புகைப்படம் எடு',
    },
    'takePhoto': {
      'en': 'Take photo',
      'si': 'ඡායාරූපය ගන්න',
      'ta': 'புகைப்படம் எடு',
    },
    'chooseFromGallery': {
      'en': 'Choose from gallery',
      'si': 'ගැලරියෙන් තෝරන්න',
      'ta': 'கேலரியில் இருந்து தேர்வு',
    },
    'chooseDocument': {
      'en': 'Choose document',
      'si': 'ලේඛනය තෝරන්න',
      'ta': 'ஆவணத்தைத் தேர்வு',
    },
    'changeProfilePhoto': {
      'en': 'Change profile photo',
      'si': 'පැතිකඩ ඡායාරූපය වෙනස් කරන්න',
      'ta': 'சுயவிவரப் புகைப்படம் மாற்று',
    },
    'profilePhotoUpdated': {
      'en': 'Profile photo updated',
      'si': 'පැතිකඩ ඡායාරූපය යාවත්කාලීනයි',
      'ta': 'சுயவிவரப் புகைப்படம் புதுப்பிக்கப்பட்டது',
    },
    'confirmAppointment': {
      'en': 'CONFIRM APPOINTMENT',
      'si': 'හමුවීම තහවුරු කරන්න',
      'ta': 'சந்திப்பை உறுதிப்படுத்து',
    },
    'consultationMode': {
      'en': 'Consultation Mode',
      'si': 'උපදේශන ක්‍රමය',
      'ta': 'ஆலோசனை முறை',
    },
    'clinicConsult': {
      'en': 'Clinic Consult (In-Person)',
      'si': 'සායන උපදේශනය (පුද්ගලික)',
      'ta': 'மருத்துவமனை ஆலோசனை (நேரில்)',
    },
    'onlineVideoConsult': {
      'en': 'Online Video consultation',
      'si': 'මාර්ගගත වීඩියෝ උපදේශනය',
      'ta': 'ஆன்லைன் வீடியோ ஆலோசனை',
    },
    'availableDates': {
      'en': 'Available Scheduled Dates',
      'si': 'ලබා ගත හැකි දින',
      'ta': 'கிடைக்கும் தேதிகள்',
    },
    'nextDays': {
      'en': 'Next 7 Days',
      'si': 'ඊළඟ දින 7',
      'ta': 'அடுத்த 7 நாட்கள்',
    },
    'availableSlots': {
      'en': 'Available Time Slots',
      'si': 'ලබා ගත හැකි වේලාවන්',
      'ta': 'கிடைக்கும் நேரங்கள்',
    },
    'consultationFeesLabel': {
      'en': 'Consultation fees',
      'si': 'උපදේශන ගාස්තු',
      'ta': 'ஆலோசனை கட்டணம்',
    },
    'venueServiceCharge': {
      'en': 'Hospital venue service charge',
      'si': 'රෝහල් ස්ථාන සේවා ගාස්තුව',
      'ta': 'மருத்துவமனை சேவைக் கட்டணம்',
    },
    'estimatedTotal': {
      'en': 'ESTIMATED TOTAL',
      'si': 'ඇස්තමේන්තු මුළු',
      'ta': 'மதிப்பிடப்பட்ட மொத்தம்',
    },
    'proceedSecurePayment': {
      'en': 'Proceed to secure payment',
      'si': 'ආරක්ෂිත ගෙවීමට ඉදිරියට',
      'ta': 'பாதுகாப்பான கட்டணத்திற்கு செல்',
    },
    'changeDateSlot': {
      'en': 'Change Date / Slot',
      'si': 'දිනය / වේලාව වෙනස් කරන්න',
      'ta': 'தேதி / நேரம் மாற்று',
    },
    'secureCheckout': {
      'en': 'SECURE CHECKOUT',
      'si': 'ආරක්ෂිත ගෙවීම',
      'ta': 'பாதுகாப்பான செக்அவுட்',
    },
    'payForAppointment': {
      'en': 'Pay for Appointment Session',
      'si': 'හමුවීම් සැසිය සඳහා ගෙවන්න',
      'ta': 'சந்திப்பு அமர்வுக்கு செலுத்து',
    },
    'doctor': {'en': 'Doctor', 'si': 'වෛද්‍ය', 'ta': 'மருத்துவர்'},
    'slot': {'en': 'Slot', 'si': 'වේලාව', 'ta': 'நேரம்'},
    'paymentDue': {
      'en': 'PAYMENT DUE',
      'si': 'ගෙවිය යුතු මුදල',
      'ta': 'செலுத்த வேண்டியது',
    },
    'consultationSessionFee': {
      'en': 'Consultation Session Fee',
      'si': 'උපදේශන සැසි ගාස්තුව',
      'ta': 'ஆலோசனை அமர்வு கட்டணம்',
    },
    'selectPaymentChannel': {
      'en': 'Select Payment Channel',
      'si': 'ගෙවීම් මාර්ගය තෝරන්න',
      'ta': 'கட்டண வழியைத் தேர்வு',
    },
    'onlineDebitCard': {
      'en': 'Online Debit/Card',
      'si': 'මාර්ගගත ඩෙබිට්/කාඩ්',
      'ta': 'ஆன்லைன் டெபிட்/கார்டு',
    },
    'manualBankSlip': {
      'en': 'Manual Bank Slip',
      'si': 'අතින් බැංකු ලදුපත',
      'ta': 'கைமுறை வங்கி ரசீது',
    },
    'cardholderName': {
      'en': 'CARDHOLDER NAME',
      'si': 'කාඩ් හිමියාගේ නම',
      'ta': 'கார்டு வைத்திருப்பவர் பெயர்',
    },
    'cardNumber': {
      'en': 'CREDIT/DEBIT CARD NUMBER',
      'si': 'ක්‍රෙඩිට්/ඩෙබිට් කාඩ් අංකය',
      'ta': 'கிரெடிட்/டெபிட் கார்டு எண்',
    },
    'expiry': {'en': 'EXPIRY', 'si': 'කල් ඉකුත්', 'ta': 'காலாவதி'},
    'cvv': {'en': 'CSV/CVV', 'si': 'CSV/CVV', 'ta': 'CSV/CVV'},
    'authorizePay': {
      'en': 'Authorize & Pay',
      'si': 'අනුමත කර ගෙවන්න',
      'ta': 'அங்கீகரித்து செலுத்து',
    },
    'depositToAccount': {
      'en': 'DEPOSIT TO LOCAL CEYLON ACCOUNT',
      'si': 'දේශීය ගිණුමට තැන්පත් කරන්න',
      'ta': 'உள்ளூர் கணக்கில் வைப்பு',
    },
    'bank': {'en': 'Bank', 'si': 'බැංකුව', 'ta': 'வங்கி'},
    'accountName': {
      'en': 'Account Name',
      'si': 'ගිණුම් නාමය',
      'ta': 'கணக்கு பெயர்',
    },
    'accountNumber': {
      'en': 'Account Number',
      'si': 'ගිණුම් අංකය',
      'ta': 'கணக்கு எண்',
    },
    'branch': {'en': 'Branch', 'si': 'ශාඛාව', 'ta': 'கிளை'},
    'attachReceiptSlip': {
      'en': 'Click to Attach Receipt Slip',
      'si': 'ලදුපත අමුණන්න',
      'ta': 'ரசீதை இணைக்க அழுத்தவும்',
    },
    'uploadDepositSlip': {
      'en': 'Upload photos of deposit counter slip',
      'si': 'තැන්පතු ලදුපතේ ඡායාරූප උඩුගත කරන්න',
      'ta': 'வைப்பு ரசீது புகைப்படங்களைப் பதிவேற்றுங்கள்',
    },
    'submitReceiptBook': {
      'en': 'Submit Receipt & Book',
      'si': 'ලදුපත ඉදිරිපත් කර වෙන්කරන්න',
      'ta': 'ரசீதை சமர்ப்பித்து முன்பதிவு',
    },
    'bookingConfirmed': {
      'en': 'Booking confirmed',
      'si': 'වෙන්කිරීම තහවුරුයි',
      'ta': 'முன்பதிவு உறுதி',
    },
    'consultationToken': {
      'en': 'Consultation token',
      'si': 'උපදේශන ටෝකනය',
      'ta': 'ஆலோசனை டோக்கன்',
    },
    'attachSlipFirst': {
      'en': 'Please attach your bank slip first',
      'si': 'කරුණාකර පළමුව බැංකු ලදුපත අමුණන්න',
      'ta': 'முதலில் வங்கி ரசீதை இணைக்கவும்',
    },
    'done': {'en': 'Done', 'si': 'අවසන්', 'ta': 'முடிந்தது'},
    'lankaRescueSystem': {
      'en': 'LANKA RESCUE SYSTEM',
      'si': 'ලංකා ගැලවීම් පද්ධතිය',
      'ta': 'இலங்கை மீட்பு அமைப்பு',
    },
    'suwasariyaTitle': {
      'en': 'Suwasariya 1990',
      'si': 'සුවසැරිය 1990',
      'ta': 'சுவசரியா 1990',
    },
    'dispatcherLocationLock': {
      'en': 'DISPATCHER LOCATION LOCK',
      'si': 'ආපදා මධ්‍යස්ථාන ස්ථාන අගුල',
      'ta': 'டிஸ்பாட்சர் இருப்பிட பூட்டு',
    },
    'gpsSafe': {'en': 'GPS SAFE', 'si': 'GPS ආරක්ෂිත', 'ta': 'GPS பாதுகாப்பு'},
    'gpsWeak': {'en': 'GPS WEAK', 'si': 'GPS දුර්වල', 'ta': 'GPS பலவீனம்'},
    'latitude': {'en': 'Latitude', 'si': 'අක්ෂාංශය', 'ta': 'அட்சரேகை'},
    'longitude': {'en': 'Longitude', 'si': 'දේශාංශය', 'ta': 'தீர்க்கரேகை'},
    'approxLocationAddress': {
      'en': 'APPROXIMATE LOCATION ADDRESS',
      'si': 'ආසන්න ස්ථාන ලිපිනය',
      'ta': 'தோராயமான இருப்பிட முகவரி',
    },
    'resolvingAddress': {
      'en': 'Resolving street address…',
      'si': 'වීදි ලිපිනය සොයමින්…',
      'ta': 'தெரு முகவரியைத் தேடுகிறது…',
    },
    'precisionStatus': {
      'en': 'Precision Status',
      'si': 'නිරවද්‍යතා තත්ත්වය',
      'ta': 'துல்லிய நிலை',
    },
    'permitSuwasariyaGps': {
      'en':
          'Permit Suwasariya Paramedic Dispatcher to extract live GPS telemetry coordinates from this phone on call.',
      'si':
          'ඇමතුමේදී මෙම දුරකථනයෙන් සජීවී GPS ඛණ්ඩාංක ලබා ගැනීමට සුවසැරිය පැරාමෙඩික් ආපදා මධ්‍යස්ථානයට අවසර දෙන්න.',
      'ta':
          'அழைப்பின் போது இந்த தொலைபேசியிலிருந்து நேரடி GPS ஆயத்தொலைவுகளைப் பெற சுவசரியா பாராமெடிக் டிஸ்பாட்சருக்கு அனுமதி அளிக்கவும்.',
    },
    'suwasariyaBlurb': {
      'en':
          'Suwasariya (1990) is Sri Lanka\'s free national pre-hospital ambulance care. Calling securely dispatches certified EMT staff and routes them using live server localization.',
      'si':
          'සුවසැරිය (1990) ශ්‍රී ලංකාවේ නොමිලේ ජාතික පෙර-රෝහල් ගිලන්රථ සේවාවයි. ඇමතීමෙන් සහතික EMT කාර්ය මණ්ඩලය යවා සජීවී ස්ථානගත කිරීමෙන් මාර්ගගත කරයි.',
      'ta':
          'சுவசரியா (1990) இலங்கையின் இலவச தேசிய முன்-மருத்துவமனை ஆம்புலன்ஸ் பராமரிப்பு. அழைப்பது சான்றளிக்கப்பட்ட EMT பணியாளர்களை அனுப்பி நேரடி சேவையக இருப்பிடத்துடன் வழிநடத்துகிறது.',
    },
    'directCallSuwasariya': {
      'en': 'DIRECT CALL SUWASARIYA (1990)',
      'si': 'සුවසැරිය (1990) කෙලින්ම අමතන්න',
      'ta': 'சுவசரியாவை நேரடி அழை (1990)',
    },
    'lkNhdFooter': {
      'en': 'LK-NHD SECURED CELLULAR LINK • FREE EMERGENCY HOTLINE',
      'si': 'LK-NHD ආරක්ෂිත සෙලියුලර් සම්බන්ධතාව • නොමිලේ හදිසි ඇමතුම',
      'ta': 'LK-NHD பாதுகாப்பான செல்லுலார் இணைப்பு • இலவச அவசர ஹாட்லைன்',
    },
    'liveGpsStreaming': {
      'en': 'Live GPS streaming to Suwasariya dispatch',
      'si': 'සුවසැරිය මධ්‍යස්ථානයට සජීවී GPS යවමින්',
      'ta': 'சுவசரியா டிஸ்பாட்சுக்கு நேரடி GPS அனுப்பப்படுகிறது',
    },
    'clinicPlace': {
      'en': 'Clinic place',
      'si': 'සායන ස්ථානය',
      'ta': 'மருத்துவமனை இடம்',
    },
    'openClinicInMaps': {
      'en': 'Open clinic address in maps',
      'si': 'සිතියමේ සායන ලිපිනය විවෘත කරන්න',
      'ta': 'வரைபடத்தில் மருத்துவமனை முகவரியைத் திற',
    },
    'openInGoogleMaps': {
      'en': 'Open in Google Maps',
      'si': 'Google Maps හි විවෘත කරන්න',
      'ta': 'Google Maps-இல் திற',
    },
    'openInAppleMaps': {
      'en': 'Open in Apple Maps',
      'si': 'Apple Maps හි විවෘත කරන්න',
      'ta': 'Apple Maps-இல் திற',
    },
    'googleMaps': {
      'en': 'Google Maps',
      'si': 'Google Maps',
      'ta': 'Google Maps',
    },
    'appleMaps': {
      'en': 'Apple Maps',
      'si': 'Apple Maps',
      'ta': 'Apple Maps',
    },
  };

  String t(String key) {
    final entry = _map[key];
    if (entry == null) return key;
    return entry[locale.languageCode] ?? entry['en'] ?? key;
  }
}

class AppLocalizationsDelegate extends LocalizationsDelegate<AppLocalizations> {
  const AppLocalizationsDelegate();

  @override
  bool isSupported(Locale locale) =>
      ['en', 'si', 'ta'].contains(locale.languageCode);

  @override
  Future<AppLocalizations> load(Locale locale) async =>
      AppLocalizations(locale);

  @override
  bool shouldReload(covariant LocalizationsDelegate<AppLocalizations> old) =>
      false;
}
