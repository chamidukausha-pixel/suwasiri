import 'package:flutter/material.dart';

/// New-patient clinic registration — English / Sinhala / Tamil.
abstract final class ClinicRegistrationL10n {
  static String t(BuildContext context, String key) {
    final code = Localizations.localeOf(context).languageCode;
    final entry = _map[key];
    if (entry == null) return key;
    return entry[code] ?? entry['en'] ?? key;
  }

  static const _map = <String, Map<String, String>>{
    'title': {
      'en': 'New patient registration',
      'si': 'නව රෝගි ලියාපදිංචිය',
      'ta': 'புதிய நோயாளி பதிவு',
    },
    'subtitle': {
      'en': 'Complete this form for your first visit. Details sync to Sri Lankan GP Care under your name.',
      'si': 'පළමු සංචාරය සඳහා මෙම පෝරමය සම්පූර්ණ කරන්න. විස්තර GP Care හි ඔබේ නම යට sync වේ.',
      'ta': 'முதல் வருகைக்கு இந்த படிவத்தை நிரப்புங்கள். விவரங்கள் GP Care-இல் உங்கள் பெயரில் ஒத்திசைக்கப்படும்.',
    },
    'sec1': {
      'en': 'Section 1: Personal & identification',
      'si': 'අංශ 1: පersonal හා හඳුනාගැනීම',
      'ta': 'பிரிவு 1: தனிப்பட்ட & அடையாள விவரங்கள்',
    },
    'sec2': {
      'en': 'Section 2: Contact & address',
      'si': 'අංශ 2: සම්බන්ධතා & ලිපිනය',
      'ta': 'பிரிவு 2: தொடர்பு & முகவரி',
    },
    'sec3': {
      'en': 'Section 3: Emergency contact',
      'si': 'අංශ 3: හදිසි සම්බන්ධතාව',
      'ta': 'பிரிவு 3: அவசர தொடர்பு',
    },
    'sec4': {
      'en': 'Section 4: Insurance & payment (optional)',
      'si': 'අංශ 4: රක්ෂණ & ගෙවීම (විකල්ප)',
      'ta': 'பிரிவு 4: காப்பீடு & கட்டணம் (விரும்பினால்)',
    },
    'sec5': {
      'en': 'Section 5: Medical history & current health',
      'si': 'අංශ 5: වෛද්‍ය ඉතිහාසය & වත්මන් සෞඛ්‍යය',
      'ta': 'பிரிவு 5: மருத்துவ வரலாறு & தற்போதைய ஆரோக்கியம்',
    },
    'sec6': {
      'en': 'Section 6: Consent & privacy',
      'si': 'අංශ 6: එකඟතාව & රහස්‍යතාව',
      'ta': 'பிரிவு 6: ஒப்புதல் & தனியுரிமை',
    },
    'patientTitle': {
      'en': 'Title',
      'si': 'ශීර්ෂය',
      'ta': 'பட்டம்',
    },
    'fullName': {
      'en': 'Full name (as per NIC / Passport)',
      'si': 'සම්පූර්ණ නම (ජා.හැ. / Passport)',
      'ta': 'முழு பெயர் (NIC / Passport)',
    },
    'nameInitials': {
      'en': 'Name with initials',
      'si': 'මුලකුරු සහිත නම',
      'ta': 'தொடக்க எழுத்துகளுடன் பெயர்',
    },
    'dob': {'en': 'Date of birth', 'si': 'උපන් දිනය', 'ta': 'பிறந்த தேதி'},
    'nic': {
      'en': 'NIC / Passport number',
      'si': 'ජා.හැ. / Passport අංකය',
      'ta': 'NIC / Passport எண்',
    },
    'gender': {'en': 'Gender', 'si': 'ස්ත්‍රී/පුරුෂ භාවය', 'ta': 'பாலினம்'},
    'civilStatus': {
      'en': 'Civil status',
      'si': 'සivil තත්ත්වය',
      'ta': 'திருமண நிலை',
    },
    'prefLang': {
      'en': 'Preferred language',
      'si': 'කැමති භාෂාව',
      'ta': 'விருப்ப மொழி',
    },
    'mobile': {
      'en': 'Mobile number (+94)',
      'si': 'ජංගම (+94)',
      'ta': 'கைபேசி (+94)',
    },
    'altPhone': {
      'en': 'Alternative / home phone',
      'si': 'විකල්ප / නිවස දුරකථන',
      'ta': 'மாற்று / வீட்டு தொலைபேசி',
    },
    'email': {'en': 'Email address', 'si': 'විද්‍යුත් තැපෑල', 'ta': 'மின்னஞ்சல்'},
    'street': {
      'en': 'Street address',
      'si': 'улица / මාර්ග ලිපිනය',
      'ta': 'தெரு முகவரி',
    },
    'city': {'en': 'City / town', 'si': 'නගරය', 'ta': 'நகரம்'},
    'district': {'en': 'District', 'si': 'දistrict', 'ta': 'மாவட்டம்'},
    'emergencyName': {
      'en': 'Emergency contact name',
      'si': 'හදිසි සම්බන්ධතා නම',
      'ta': 'அவசர தொடர்பு பெயர்',
    },
    'emergencyRelation': {
      'en': 'Relationship',
      'si': 'සම්බන්ධතාව',
      'ta': 'உறவு',
    },
    'emergencyMobile': {
      'en': 'Emergency mobile (+94)',
      'si': 'හදිසි ජංගම (+94)',
      'ta': 'அவசர கைபேசி (+94)',
    },
    'paymentMethod': {
      'en': 'Payment method',
      'si': 'ගෙවීමේ ක්‍රමය',
      'ta': 'கட்டண முறை',
    },
    'insurance': {
      'en': 'Private medical insurance (if any)',
      'si': 'පෞද්ගලික වෛද්‍ය රක්ෂණ',
      'ta': 'தனியார் மருத்துவ காப்பீடு',
    },
    'policyId': {
      'en': 'Policy / membership ID',
      'si': 'Policy / සාමාජික ID',
      'ta': 'காப்பீட்டு / உறுப்பினர் ID',
    },
    'visitReason': {
      'en': 'Primary reason for today\'s visit / symptoms',
      'si': 'අද සංචාරයේ ප්‍රධාන හේතුව / ලක්ෂණ',
      'ta': 'இன்றைய வருகைக்கான முக்கிய காரணம் / அறிகுறிகள்',
    },
    'allergiesQ': {
      'en': 'Known allergies (food / drug / environmental)?',
      'si': 'දන්නා allergies (ආහාර / ඖෂධ / පරිසර)?',
      'ta': 'அறியப்பட்ட ஒAllergieகள்?',
    },
    'allergyDetails': {
      'en': 'If yes, specify (e.g. Penicillin, peanuts)',
      'si': 'ඔව් නම්, specify කරන්න',
      'ta': 'ஆம் என்றால், குறிப்பிடுங்கள்',
    },
    'chronic': {
      'en': 'Pre-existing / chronic conditions',
      'si': 'පවexisting / දිගුකාලීන රෝග',
      'ta': 'ஏற்கனவே உள்ள / நா chronic நிலைகள்',
    },
    'medications': {
      'en': 'Current regular medications',
      'si': 'වර්තමාන නිති medicines',
      'ta': 'தற்போதைய வழக்கமான மருந்துகள்',
    },
    'surgeryQ': {
      'en': 'Previous major surgeries or hospitalisations?',
      'si': 'පෙර විශaal ශල්‍ය ක්‍රියා / hospitalisations?',
      'ta': 'முந்தைய அறுவை சிகிச்சைகள்?',
    },
    'surgeryDetails': {
      'en': 'Surgery / hospitalisation details',
      'si': 'ශල්‍ය / hospitalisation විස්තර',
      'ta': 'அறுவை / hospitalisation விவரங்கள்',
    },
    'consentSms': {
      'en': 'I agree to SMS / WhatsApp appointment reminders and digital tokens.',
      'si': 'SMS / WhatsApp appointment reminders සඳහා එකඟ වෙමි.',
      'ta': 'SMS / WhatsApp நினைவூட்டல்களுக்கு ஒப்புக்கொள்கிறேன்.',
    },
    'consentPrivacy': {
      'en':
          'I consent to storage of my medical notes and personal data for treatment under Sri Lankan PDPA standards.',
      'si':
          'PDPA ප්‍රමිතීන් යටතේ මගේ medical notes සහ personal data storage සඳහා එකඟ වෙමි.',
      'ta':
          'PDPA தரங்களின் கீழ் என் medical notes மற்றும் personal data storage-க்கு ஒப்புக்கொள்கிறேன்.',
    },
    'consentConfirm': {
      'en': 'I confirm the information provided is correct to the best of my knowledge.',
      'si': 'මගේ දැනුමට අනුව තොරතුරු නිවැරදි බව තහවුරු කරමි.',
      'ta': 'எனக்குத் தெரிந்தவரை தகவல்கள் சரியானவை என உறுதிப்படுத்துகிறேன்.',
    },
    'submit': {
      'en': 'Save & continue booking',
      'si': 'සුරකින්න & booking ඉදිරියට',
      'ta': 'சேமித்து booking தொடரவும்',
    },
    'requiredHint': {
      'en': 'Please complete all mandatory fields and consent checkboxes.',
      'si': 'අනිවාර්ය ක්ෂේත්‍ර සහ consent checkboxes සම්පූර්ණ කරන්න.',
      'ta': 'கட்டாய புலங்கள் மற்றும் consent checkboxes நிரப்பவும்.',
    },
    'saved': {
      'en': 'Registration saved and synced to GP Care',
      'si': 'ලියාපදිංචිය GP Care වෙත sync විය',
      'ta': 'பதிவு GP Care-க்கு ஒத்திசைக்கப்பட்டது',
    },
    'yes': {'en': 'Yes', 'si': 'ඔව්', 'ta': 'ஆம்'},
    'no': {'en': 'No', 'si': 'නැත', 'ta': 'இல்லை'},
    'male': {'en': 'Male', 'si': 'පුරුෂ', 'ta': 'ஆண்'},
    'female': {'en': 'Female', 'si': 'ස්ත්‍රී', 'ta': 'பெண்'},
    'other': {'en': 'Other', 'si': 'වෙනත්', 'ta': 'மற்றவை'},
    'single': {'en': 'Single', 'si': 'අවිවාහක', 'ta': 'திருமணமாகாத'},
    'married': {'en': 'Married', 'si': 'විවාහක', 'ta': 'திருமணமான'},
    'sinhala': {'en': 'Sinhala', 'si': 'සිංහල', 'ta': 'சிங்களம்'},
    'tamil': {'en': 'Tamil', 'si': 'දෙමළ', 'ta': 'தமிழ்'},
    'english': {'en': 'English', 'si': 'ඉංග්‍රීසි', 'ta': 'ஆங்கிலம்'},
    'cash': {'en': 'Cash', 'si': 'මුදල්', 'ta': 'பணம்'},
    'card': {'en': 'Credit / Debit card', 'si': 'Card', 'ta': 'Card'},
    'insuranceClaim': {
      'en': 'Insurance claim',
      'si': 'Insurance claim',
      'ta': 'Insurance claim',
    },
    'condDiabetes': {
      'en': 'Diabetes mellitus',
      'si': 'Diabetes mellitus',
      'ta': 'Diabetes mellitus',
    },
    'condHypertension': {
      'en': 'Hypertension',
      'si': 'Hypertension',
      'ta': 'Hypertension',
    },
    'condAsthma': {
      'en': 'Asthma / respiratory',
      'si': 'Asthma / respiratory',
      'ta': 'Asthma / respiratory',
    },
    'condIhd': {
      'en': 'Ischaemic heart disease',
      'si': 'Ischaemic heart disease',
      'ta': 'Ischaemic heart disease',
    },
    'condKidney': {
      'en': 'Kidney disease / CKD',
      'si': 'Kidney disease / CKD',
      'ta': 'Kidney disease / CKD',
    },
    'condThyroid': {
      'en': 'Thyroid disorders',
      'si': 'Thyroid disorders',
      'ta': 'Thyroid disorders',
    },
    'condCholesterol': {
      'en': 'High cholesterol',
      'si': 'High cholesterol',
      'ta': 'High cholesterol',
    },
    'condOther': {'en': 'Other', 'si': 'වෙනත්', 'ta': 'மற்றவை'},
    'relSpouse': {'en': 'Spouse', 'si': 'අභිබව', 'ta': 'ம spouse'},
    'relParent': {'en': 'Parent', 'si': 'දෙමව්පිය', 'ta': 'பெற்றோர்'},
    'relChild': {'en': 'Child', 'si': 'දරුවා', 'ta': 'குழந்தை'},
    'relRelative': {'en': 'Relative', 'si': 'ඥාතිය', 'ta': 'உறவினர்'},
    'insSlic': {'en': 'Sri Lanka Insurance (SLIC)', 'si': 'SLIC', 'ta': 'SLIC'},
    'insCeylinco': {'en': 'Ceylinco VIP Healthcare', 'si': 'Ceylinco', 'ta': 'Ceylinco'},
    'insSoftlogic': {'en': 'Softlogic Life', 'si': 'Softlogic', 'ta': 'Softlogic'},
    'insAllianz': {
      'en': 'Allianz / Janashakthi / Union / Fairfirst',
      'si': 'Allianz group',
      'ta': 'Allianz group',
    },
    'insForeign': {
      'en': 'Foreign / corporate insurance',
      'si': 'Foreign / corporate',
      'ta': 'Foreign / corporate',
    },
    'titleRev': {'en': 'Rev', 'si': 'Rev', 'ta': 'Rev'},
    'titleMr': {'en': 'Mr', 'si': 'Mr', 'ta': 'Mr'},
    'titleMrs': {'en': 'Mrs', 'si': 'Mrs', 'ta': 'Mrs'},
    'titleMiss': {'en': 'Miss', 'si': 'Miss', 'ta': 'Miss'},
    'titleDr': {'en': 'Dr', 'si': 'Dr', 'ta': 'Dr'},
    'titleProf': {'en': 'Prof', 'si': 'Prof', 'ta': 'Prof'},
  };
}
