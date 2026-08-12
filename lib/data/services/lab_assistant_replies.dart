import '../models/vault_report.dart';

/// On-device clinical assistant copy for lab reports (EN / SI / TA).
abstract final class LabAssistantReplies {
  static String reply({
    required VaultReport report,
    required String question,
  }) {
    final lang = detectLanguage(question);
    final q = question.toLowerCase();
    final recommend = q.contains('recommend') ||
        q.contains('specialist') ||
        q.contains('doctor') ||
        q.contains('විශේෂඥ') ||
        q.contains('சிறப்பு');

    if (recommend) return _recommend(report, lang);

    if (q.contains('hba1c') || report.title.toLowerCase().contains('hba1c')) {
      return _hba1c(lang);
    }

    return _summarize(report, lang);
  }

  static String detectLanguage(String question) {
    final q = question.toLowerCase();
    if (q.contains('sinhala') ||
        q.contains('සිංහල') ||
        q.contains('in si')) {
      return 'si';
    }
    if (q.contains('tamil') || q.contains('தமிழ்') || q.contains('in ta')) {
      return 'ta';
    }
    return 'en';
  }

  static String _summarize(VaultReport report, String lang) {
    final lines = report.metrics
        .map((m) {
          final range =
              m.normalRange.isEmpty ? '' : ' · ${m.normalRange}';
          return '• ${m.name}: ${m.value}$range (${m.status})';
        })
        .join('\n');
    final comments = report.clinicalComments.isEmpty
        ? ''
        : report.clinicalComments;
    final allNormal =
        report.metrics.isNotEmpty &&
        report.metrics.every((m) => m.status == 'normal');

    switch (lang) {
      case 'si':
        return 'මම ඔබේ "${report.title}" වාර්තාව සමාලෝචනය කළෙමි '
            '(${report.category ?? report.issuedBy}).\n$lines\n\n'
            '${comments.isEmpty ? '' : '$comments\n\n'}'
            '${allNormal ? 'සියලු පරාමිතීන් සාමාන්‍ය සීමා තුළය. ' : 'අවධානය යොමු කළ යුතු අගයන් ඇත. '}'
            'මෙය අධ්‍යාපනික මගපෙන්වීමකි, රෝග විනිශ්චයක් නොවේ. ප්‍රතිකාර වෙනස් කිරීමට පෙර වෛද්‍යවරයෙකු සමඟ සාකච්ඡා කරන්න.';
      case 'ta':
        return 'உங்கள் "${report.title}" அறிக்கையை ஆய்வு செய்தேன் '
            '(${report.category ?? report.issuedBy}).\n$lines\n\n'
            '${comments.isEmpty ? '' : '$comments\n\n'}'
            '${allNormal ? 'அனைத்து அளவுகளும் இயல்பான வரம்பில் உள்ளன. ' : 'கவனம் தேவைப்படும் மதிப்புகள் உள்ளன. '}'
            'இது கல்வி வழிகாட்டல் மட்டுமே, நோய் கண்டறிதல் அல்ல. சிகிச்சையை மாற்றுவதற்கு முன் மருத்துவரை அணுகவும்.';
      default:
        return 'I reviewed your "${report.title}" '
            '(${report.category ?? report.issuedBy}).\n$lines\n\n'
            '${comments.isEmpty ? '' : '$comments\n\n'}'
            '${allNormal ? 'All parameters are within normal clinical thresholds. ' : 'Some values need clinician review. '}'
            'This is educational guidance, not a diagnosis. Ask your doctor before changing any treatment.';
    }
  }

  static String _recommend(VaultReport report, String lang) {
    final allNormal =
        report.metrics.isNotEmpty &&
        report.metrics.every((m) => m.status == 'normal');
    switch (lang) {
      case 'si':
        return allNormal
            ? 'ඔබේ "${report.title}" සාමාන්‍ය පරාසය තුළය. හදිසි විශේෂඥ යොමු කිරීමක් අවශ්‍ය නැත. '
                'රෝග ලක්ෂණ (උණ, මහන්සිය, තැලීම්) ඇත්නම් සාමාන්‍ය වෛද්‍ය හෝ රුධිර රෝග විශේෂඥවරයෙකු හමුවන්න. '
                'ශ්‍රී ලංකා ගැළපීම: Internal Medicine / Haematology — Nawaloka, Durdans, හෝ Asiri.'
            : 'ඔබේ "${report.title}" හි අවධානය යොමු කළ යුතු අගයන් ඇත. '
                'පළමුව සාමාන්‍ය වෛද්‍යවරයෙකු හෝ අදාළ විශේෂඥවරයෙකු (Haematology / Internal Medicine) හමුවන්න. '
                'Nawaloka, Durdans, හෝ Asiri හි ලියාපදිංචි විශේෂඥයන් ගැළපේ. මෙය රෝග විනිශ්චයක් නොවේ.';
      case 'ta':
        return allNormal
            ? 'உங்கள் "${report.title}" இயல்பான வரம்பில் உள்ளது. அவசர சிறப்பு பரிந்துரை தேவையில்லை. '
                'அறிகுறிகள் (காய்ச்சல், சோர்வு, சிராய்ப்பு) இருந்தால் பொது மருத்துவர் அல்லது இரத்தவியல் நிபுணரை அணுகவும். '
                'இலங்கை பொருத்தம்: Internal Medicine / Haematology — Nawaloka, Durdans அல்லது Asiri.'
            : 'உங்கள் "${report.title}"-இல் கவனம் தேவைப்படும் மதிப்புகள் உள்ளன. '
                'முதலில் பொது மருத்துவர் அல்லது Haematology / Internal Medicine நிபுணரை அணுகவும். '
                'Nawaloka, Durdans அல்லது Asiri-இல் பதிவுசெய்யப்பட்ட நிபுணர்கள் பொருந்தும். இது நோய் கண்டறிதல் அல்ல.';
      default:
        return allNormal
            ? 'Your "${report.title}" is within normal ranges. No urgent specialist referral is indicated. '
                'If you have symptoms (fever, fatigue, bruising), see a General Physician or Haematologist. '
                'Matching Sri Lankan experts: Internal Medicine / Haematology at Nawaloka, Durdans, or Asiri.'
            : 'Your "${report.title}" has values that need review. Start with a General Physician or Haematology / Internal Medicine. '
                'Registered specialists at Nawaloka, Durdans, or Asiri are a good match. This is not a diagnosis.';
    }
  }

  static String _hba1c(String lang) {
    switch (lang) {
      case 'si':
        return 'ඔබේ HbA1c 5.9% පෙර-දියවැඩියා පරාසයේ (5.7–6.4%) ඇත. මෙය මාස 3ක සාමාන්‍ය රුධිර සීනි පිළිබිඹු කරයි. '
            'ජීවන රටාව සහ පසු විමසුම ගැන ඔබේ GP සමඟ සාකච්ඡා කරන්න. මෙය රෝග විනිශ්චයක් නොවේ.';
      case 'ta':
        return 'உங்கள் HbA1c 5.9% முன்-நீரிழிவு வரம்பில் (5.7–6.4%) உள்ளது. இது சுமார் 3 மாத சராசரி இரத்த சர்க்கரையைக் காட்டுகிறது. '
            'வாழ்க்கை முறை மற்றும் பின்தொடர்தல் குறித்து உங்கள் GP-யுடன் பேசுங்கள். இது நோய் கண்டறிதல் அல்ல.';
      default:
        return 'Your HbA1c of 5.9% is in the prediabetes attention range '
            '(5.7–6.4%). This reflects average blood glucose over ~3 months. '
            'Discuss lifestyle measures and follow-up with your GP. '
            'This is educational guidance, not a diagnosis.';
    }
  }
}
