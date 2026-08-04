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
      'en': 'Good day',
      'si': 'සුභ දවසක්',
      'ta': 'இனிய நாள்',
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
      'en': 'Quick actions',
      'si': 'ඉක්මන් ක්‍රියා',
      'ta': 'விரைவு செயல்கள்',
    },
    'emergencySos': {
      'en': '1990 Emergency',
      'si': '1990 හදිසි',
      'ta': '1990 அவசரம்',
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
