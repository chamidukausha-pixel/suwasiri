import 'package:flutter/material.dart';

/// Health questionnaire labels — English / Sinhala / Tamil.
abstract final class HealthIntakeL10n {
  static String t(BuildContext context, String key) {
    final code = Localizations.localeOf(context).languageCode;
    final entry = _map[key];
    if (entry == null) return key;
    return entry[code] ?? entry['en'] ?? key;
  }

  static const _map = <String, Map<String, String>>{
    'intakeTitle': {
      'en': 'Health questionnaire',
      'si': 'සෞඛ්‍ය ප්‍රශ්නාවලිය',
      'ta': 'சுகாதார கேள்வித்தாள்',
    },
    'intakeSubtitle': {
      'en':
          'Mandatory details for your Suwasiri Health ID. You can edit these anytime in Profile.',
      'si':
          'ඔබේ සුවසිරි සෞඛ්‍ය හැඳුනුම්පත සඳහා අනිවාර්ය විස්තර. පැතිකඩෙන් ඕනෑම වේලාවක සංස්කරණය කළ හැක.',
      'ta':
          'உங்கள் சுவசிரி சுகாதார அடையாளத்திற்கான கட்டாய விவரங்கள். சுயவிவரத்தில் எப்போதும் திருத்தலாம்.',
    },
    'editIntake': {
      'en': 'Edit health questionnaire',
      'si': 'සෞඛ්‍ය ප්‍රශ්නාවලිය සංස්කරණය',
      'ta': 'சுகாதார கேள்வித்தாளைத் திருத்து',
    },
    'uniqueHealthId': {
      'en': 'Unique Suwasiri Health ID',
      'si': 'අනන්‍ය සුවසිරි සෞඛ්‍ය හැඳුනුම්පත',
      'ta': 'தனித்துவமான சுவசிரி சுகாதார அடையாளம்',
    },
    'barcodeNumber': {
      'en': 'Unique barcode number',
      'si': 'අනන්‍ය තීරු කේත අංකය',
      'ta': 'தனித்துவ பார்கோடு எண்',
    },
    'age': {'en': 'Age', 'si': 'වයස', 'ta': 'வயது'},
    'years': {'en': 'years', 'si': 'වසර', 'ta': 'ஆண்டுகள்'},
    'nicNo': {'en': 'NIC number', 'si': 'ජා.හැ. අංකය', 'ta': 'தேசிய அடையாள எண்'},
    'bloodGroup': {
      'en': 'Blood group',
      'si': 'ලේ වර්ගය',
      'ta': 'இரத்த வகை',
    },
    'saveContinue': {
      'en': 'Save & continue',
      'si': 'සුරකින්න සහ ඉදිරියට',
      'ta': 'சேமித்து தொடரவும்',
    },
    'saveChanges': {
      'en': 'Save changes',
      'si': 'වෙනස්කම් සුරකින්න',
      'ta': 'மாற்றங்களைச் சேமி',
    },
    'next': {'en': 'Next', 'si': 'ඊළඟ', 'ta': 'அடுத்து'},
    'back': {'en': 'Back', 'si': 'ආපසු', 'ta': 'பின்'},
    'requiredHint': {
      'en': 'Please complete all mandatory fields marked *',
      'si': '* ලකුණු කළ අනිවාර්ය ක්ෂේත්‍ර සම්පූර්ණ කරන්න',
      'ta': '* குறிக்கப்பட்ட கட்டாய புலங்களை நிரப்பவும்',
    },
    'saved': {
      'en': 'Health profile saved',
      'si': 'සෞඛ්‍ය පැතිකඩ සුරකින ලදී',
      'ta': 'சுகாதார சுயவிவரம் சேமிக்கப்பட்டது',
    },

    // Sections
    'secBasic': {
      'en': 'Basic health information',
      'si': 'මූලික සෞඛ්‍ය තොරතුරු',
      'ta': 'அடிப்படை சுகாதார தகவல்',
    },
    'secMedical': {
      'en': 'Medical history',
      'si': 'වෛද්‍ය ඉතිහාසය',
      'ta': 'மருத்துவ வரலாறு',
    },
    'secVaccinations': {
      'en': 'Vaccinations',
      'si': 'එන්නත්',
      'ta': 'தடுப்பூசிகள்',
    },
    'secLifestyle': {
      'en': 'Lifestyle information',
      'si': 'ජීවන රටා තොරතුරු',
      'ta': 'வாழ்க்கைமுறை தகவல்',
    },
    'secCurrent': {
      'en': 'Current health',
      'si': 'වත්මන් සෞඛ්‍යය',
      'ta': 'தற்போதைய ஆரோக்கியம்',
    },
    'secSafety': {
      'en': 'Safety / urgent information',
      'si': 'ආරක්ෂාව / හදිසි තොරතුරු',
      'ta': 'பாதுகாப்பு / அவசர தகவல்',
    },

    // Basic fields
    'fullName': {
      'en': 'Full name',
      'si': 'සම්පූර්ණ නම',
      'ta': 'முழு பெயர்',
    },
    'dob': {
      'en': 'Date of birth',
      'si': 'උපන් දිනය',
      'ta': 'பிறந்த தேதி',
    },
    'sex': {
      'en': 'Sex / gender',
      'si': 'ස්ත්‍රී / පුරුෂ භාවය',
      'ta': 'பாலினம்',
    },
    'sexFemale': {'en': 'Female', 'si': 'ස්ත්‍රී', 'ta': 'பெண்'},
    'sexMale': {'en': 'Male', 'si': 'පුරුෂ', 'ta': 'ஆண்'},
    'sexOther': {'en': 'Other / prefer not to say', 'si': 'වෙනත්', 'ta': 'மற்றவை'},
    'addressContact': {
      'en': 'Address and contact details',
      'si': 'ලිපිනය සහ සම්බන්ධතා විස්තර',
      'ta': 'முகவரி மற்றும் தொடர்பு விவரங்கள்',
    },
    'address': {'en': 'Address', 'si': 'ලිපිනය', 'ta': 'முகவரி'},
    'contact': {
      'en': 'Contact number',
      'si': 'දුරකථන අංකය',
      'ta': 'தொடர்பு எண்',
    },
    'medicare': {
      'en': 'Medicare / health card details',
      'si': 'සෞඛ්‍ය කාඩ්පත් විස්තර',
      'ta': 'சுகாதார அட்டை விவரங்கள்',
    },
    'emergencyContact': {
      'en': 'Emergency contact',
      'si': 'හදිසි සම්බන්ධතා',
      'ta': 'அவசர தொடர்பு',
    },
    'mohDistrict': {
      'en': 'MOH district',
      'si': 'සෞ.සේ. කාර්යාල දිස්ත්‍රික්කය',
      'ta': 'சுகாதார மாவட்டம்',
    },

    // Medical
    'existingConditions': {
      'en': 'Existing medical conditions',
      'si': 'පවතින වෛද්‍ය තත්ත්වයන්',
      'ta': 'உள்ள மருத்துவ நிலைமைகள்',
    },
    'previousSurgeries': {
      'en': 'Previous surgeries or hospitalisations',
      'si': 'පෙර ශල්‍යකර්ම හෝ රෝහල්ගතවීම්',
      'ta': 'முந்தைய அறுவை சிகிச்சைகள் அல்லது மருத்துவமனை அனுமதிகள்',
    },
    'currentMedications': {
      'en': 'Current medications',
      'si': 'වත්මන් ඖෂධ',
      'ta': 'தற்போதைய மருந்துகள்',
    },
    'medicationAllergies': {
      'en': 'Medication allergies',
      'si': 'ඖෂධ අසාත්මිකතා',
      'ta': 'மருந்து ஒவ்வாமைகள்',
    },
    'otherAllergies': {
      'en': 'Other allergies',
      'si': 'වෙනත් අසාත්මිකතා',
      'ta': 'பிற ஒவ்வாமைகள்',
    },
    'familyHistory': {
      'en': 'Family medical history',
      'si': 'පවුලේ වෛද්‍ය ඉතිහාසය',
      'ta': 'குடும்ப மருத்துவ வரலாறு',
    },
    'previousSeriousIllnesses': {
      'en': 'Previous serious illnesses',
      'si': 'පෙර බරපතල රෝග',
      'ta': 'முந்தைய கடுமையான நோய்கள்',
    },

    // Vaccinations
    'covidVax': {
      'en': 'COVID-19 vaccination history',
      'si': 'COVID-19 එන්නත් ඉතිහාසය',
      'ta': 'COVID-19 தடுப்பூசி வரலாறு',
    },
    'fluVax': {
      'en': 'Influenza vaccination',
      'si': 'ඉන්ෆ්ලුවෙන්සා එන්නත',
      'ta': 'இன்ஃப்ளூயன்ஸா தடுப்பூசி',
    },
    'otherImmunisations': {
      'en': 'Other immunisations',
      'si': 'වෙනත් එන්නත්',
      'ta': 'பிற தடுப்பூசிகள்',
    },
    'mostRecentVax': {
      'en': 'Date of most recent vaccination',
      'si': 'නවතම එන්නත් දිනය',
      'ta': 'சமீபத்திய தடுப்பூசி தேதி',
    },

    // Lifestyle
    'smoking': {
      'en': 'Smoking status',
      'si': 'දුම්පාන තත්ත්වය',
      'ta': 'புகைபிடிக்கும் நிலை',
    },
    'alcohol': {
      'en': 'Alcohol consumption',
      'si': 'මත්පැන් පානය',
      'ta': 'மது அருந்துதல்',
    },
    'exercise': {
      'en': 'Exercise / activity level',
      'si': 'ව්‍යායාම / ක්‍රියාකාරකම් මට්ටම',
      'ta': 'உடற்பயிற்சி / செயல்பாட்டு நிலை',
    },
    'diet': {
      'en': 'Diet / nutrition',
      'si': 'ආහාර / පෝෂණය',
      'ta': 'உணவு / ஊட்டச்சத்து',
    },
    'height': {'en': 'Height (cm)', 'si': 'උස (සෙ.මී.)', 'ta': 'உயரம் (செ.மீ.)'},
    'weight': {'en': 'Weight (kg)', 'si': 'බර (කි.ග්‍රෑ.)', 'ta': 'எடை (கி.கி.)'},

    // Current
    'currentSymptoms': {
      'en': 'Current symptoms or health concerns',
      'si': 'වත්මන් රෝග ලක්ෂණ හෝ සෞඛ්‍ය ගැටලු',
      'ta': 'தற்போதைய அறிகுறிகள் அல்லது சுகாதார கவலைகள்',
    },
    'mentalWellbeing': {
      'en': 'Mental wellbeing',
      'si': 'මානසික යහපැවැත්ම',
      'ta': 'மன நலம்',
    },
    'sleep': {'en': 'Sleep', 'si': 'නින්ද', 'ta': 'தூக்கம்'},
    'painMobility': {
      'en': 'Pain or mobility issues',
      'si': 'වේදනාව හෝ චලන ගැටලු',
      'ta': 'வலி அல்லது இயக்க பிரச்சினைகள்',
    },
    'bloodPressure': {
      'en': 'Blood pressure (if known)',
      'si': 'රුධිර පීඩනය (දන්නේ නම්)',
      'ta': 'இரத்த அழுத்தம் (தெரிந்தால்)',
    },
    'otherMeasurements': {
      'en': 'Other relevant health measurements',
      'si': 'වෙනත් අදාළ සෞඛ්‍ය මිනුම්',
      'ta': 'பிற தொடர்புடைய சுகாதார அளவீடுகள்',
    },

    // Safety
    'safetyEmergency': {
      'en': 'Emergency contact',
      'si': 'හදිසි සම්බන්ධතා',
      'ta': 'அவசர தொடர்பு',
    },
    'importantAllergies': {
      'en': 'Important allergies',
      'si': 'වැදගත් අසාත්මිකතා',
      'ta': 'முக்கிய ஒவ்வாமைகள்',
    },
    'safetyMeds': {
      'en': 'Current medications',
      'si': 'වත්මන් ඖෂධ',
      'ta': 'தற்போதைய மருந்துகள்',
    },
    'conditionsKnow': {
      'en': 'Conditions healthcare professionals should know',
      'si': 'සෞඛ්‍ය වෘත්තිකයන් දැනගත යුතු තත්ත්වයන්',
      'ta': 'மருத்துவர்கள் அறிய வேண்டிய நிலைமைகள்',
    },
    'advanceCare': {
      'en': 'Advance care / healthcare preferences',
      'si': 'අනාගත සත්කාර / සෞඛ්‍ය මනාපයන්',
      'ta': 'முன்கூட்டிய பராமரிப்பு / சுகாதார விருப்பங்கள்',
    },

    // Summary prompts
    'hintNone': {
      'en': 'Write “None” if not applicable',
      'si': 'අදාළ නැති නම් “නැත” ලියන්න',
      'ta': 'பொருந்தவில்லை என்றால் “இல்லை” என எழுதவும்',
    },
  };
}
