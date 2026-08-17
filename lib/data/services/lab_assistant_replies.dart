import '../catalogs/doctor_catalog.dart';
import '../models/appointment.dart';
import '../models/vault_report.dart';

class LabMetricExplain {
  const LabMetricExplain({
    required this.heading,
    required this.rangeLabel,
    required this.body,
  });

  final String heading;
  final String rangeLabel;
  final String body;
}

class LabSpecialtyRec {
  const LabSpecialtyRec({
    required this.heading,
    required this.body,
  });

  final String heading;
  final String body;
}

/// Structured Vault copilot review (EN / SI / TA) with bookable doctors.
class LabAiReview {
  const LabAiReview({
    required this.lang,
    required this.greeting,
    required this.intro,
    required this.summaryHeadline,
    required this.languageNote,
    required this.evidenceTitle,
    required this.evidenceLead,
    required this.metrics,
    required this.recsTitle,
    required this.recsIntro,
    required this.recsBeforeDoctor,
    required this.recsAfterDoctor,
    this.featuredDoctor,
    required this.specialties,
    required this.doctors,
    required this.adviceTitle,
    required this.habits,
    required this.disclaimer,
  });

  final String lang;
  final String greeting;
  final String intro;
  final String summaryHeadline;
  final String languageNote;
  final String evidenceTitle;
  final String evidenceLead;
  final List<LabMetricExplain> metrics;
  final String recsTitle;
  final String recsIntro;
  final String recsBeforeDoctor;
  final String recsAfterDoctor;
  final Doctor? featuredDoctor;
  final List<LabSpecialtyRec> specialties;
  final List<Doctor> doctors;
  final String adviceTitle;
  final String habits;
  final String disclaimer;
}

/// On-device clinical assistant for Vault lab reports.
abstract final class LabAssistantReplies {
  static LabAiReview review({
    required VaultReport report,
    required String question,
    String language = 'en',
    String patientName = '',
  }) {
    final lang = detectLanguage(question, fallback: _langCode(language));
    final name = patientName.trim().isEmpty ? 'there' : patientName.trim();
    final allNormal = report.metrics.isNotEmpty &&
        report.metrics.every((m) => m.status == 'normal');
    final doctors = doctorsForReport(report);
    final featured = _featuredDoctor(report, doctors);
    final specs = _specialtyKeysFor(report);

    return LabAiReview(
      lang: lang,
      greeting: _greeting(lang, name),
      intro: _intro(lang, report),
      summaryHeadline: _summaryHeadline(lang, allNormal),
      languageNote: _languageNote(lang),
      evidenceTitle: _t(lang, {
        'en': '### 1. SUMMARY OF EVIDENCE (වාර්තා සාරාංශය / அறிக்கை சுருக்கம்)',
        'si': '### 1. SUMMARY OF EVIDENCE (වාර්තා සාරාංශය)',
        'ta': '### 1. SUMMARY OF EVIDENCE (அறிக்கை சுருக்கம்)',
      }),
      evidenceLead: _evidenceLead(lang, allNormal),
      metrics: report.metrics.map((m) => _explainMetric(m, lang)).toList(),
      recsTitle: _t(lang, {
        'en':
            '### 2. RECOMMENDATIONS (නිර්දේශ සහ විශේෂඥ වෛද්‍යවරුන් / பரிந்துரைகள்)',
        'si': '### 2. RECOMMENDATIONS (නිර්දේශ සහ විශේෂඥ වෛද්‍යවරුන්)',
        'ta': '### 2. RECOMMENDATIONS (பரிந்துரைகளும் சிறப்பு மருத்துவர்களும்)',
      }),
      recsIntro: _recsIntro(lang, allNormal),
      recsBeforeDoctor: _recsBeforeDoctor(lang, featured),
      recsAfterDoctor: _recsAfterDoctor(lang, featured),
      featuredDoctor: featured,
      specialties: [
        for (final key in specs) _specialtyCopy(key, lang, allNormal),
      ],
      doctors: doctors,
      adviceTitle: _t(lang, {
        'en':
            '### 3. CLINICAL ADVICE & DISCLAIMER (සායනික උපදෙස් සහ වගකීම් ප්‍රකාශය)',
        'si':
            '### 3. CLINICAL ADVICE & DISCLAIMER (සායනික උපදෙස් සහ වගකීම් ප්‍රකාශය)',
        'ta':
            '### 3. CLINICAL ADVICE & DISCLAIMER (மருத்துவ ஆலோசனை மற்றும் பொறுப்புத் துறப்பு)',
      }),
      habits: _habits(lang),
      disclaimer: _disclaimer(lang),
    );
  }

  /// Legacy string reply — used only if a caller still expects text.
  static String reply({
    required VaultReport report,
    required String question,
    String language = 'en',
    String patientName = '',
  }) {
    final r = review(
      report: report,
      question: question,
      language: language,
      patientName: patientName,
    );
    final buf = StringBuffer()
      ..writeln(r.greeting)
      ..writeln(r.intro)
      ..writeln(r.summaryHeadline)
      ..writeln(r.languageNote)
      ..writeln()
      ..writeln('### ${r.evidenceTitle}');
    for (final m in r.metrics) {
      buf
        ..writeln('* **${m.heading}** (${m.rangeLabel}):')
        ..writeln(m.body)
        ..writeln();
    }
    buf
      ..writeln('---')
      ..writeln('### ${r.recsTitle}')
      ..writeln(r.recsIntro);
    for (final s in r.specialties) {
      buf
        ..writeln('* **${s.heading}**')
        ..writeln(s.body);
    }
    for (final d in r.doctors) {
      buf.writeln('* **${d.name}** (${d.specialty}) — ${d.hospital}');
    }
    buf
      ..writeln('---')
      ..writeln('### ${r.adviceTitle}')
      ..writeln('* **${r.habits}**')
      ..writeln('* **${r.disclaimer}**');
    return buf.toString();
  }

  static String explainPrompt(String lang) => _t(_langCode(lang), {
        'en':
            'Explain my lab report in English. Cover every biomarker and recommend a doctor.',
        'si':
            'මගේ රසායනාගාර වාර්තාව සිංහලෙන් පැහැදිලි කරන්න. සෑම සලකුණක්ම සාරාංශ කර වෛද්‍යවරයෙකු නිර්දේශ කරන්න.',
        'ta':
            'என் ஆய்வக அறிக்கையை தமிழில் விளக்கு. ஒவ்வொரு குறியையும் சுருக்கி மருத்துவரை பரிந்துரை.',
      });

  static String recommendPrompt(String lang) => _t(_langCode(lang), {
        'en':
            'Recommend specialist doctors I can book for this lab report, and explain the report in English.',
        'si':
            'මෙම වාර්තාවට ගැළපෙන විශේෂඥ වෛද්‍යවරුන් නිර්දේශ කර සිංහලෙන් පැහැදිලි කරන්න.',
        'ta':
            'இந்த அறிக்கைக்கு பொருந்தும் சிறப்பு மருத்துவர்களை பரிந்துரைத்து தமிழில் விளக்கு.',
      });

  static String detectLanguage(String question, {String fallback = 'en'}) {
    final q = question.toLowerCase();
    if (RegExp(r'[\u0D80-\u0DFF]').hasMatch(question) ||
        q.contains('sinhala') ||
        q.contains('සිංහල') ||
        q.contains('in si') ||
        q.contains('by sinhala')) {
      return 'si';
    }
    if (RegExp(r'[\u0B80-\u0BFF]').hasMatch(question) ||
        q.contains('tamil') ||
        q.contains('தமிழ்') ||
        q.contains('in ta') ||
        q.contains('by tamil')) {
      return 'ta';
    }
    if (q.contains('english') || q.contains('in en') || q.contains('by english')) {
      return 'en';
    }
    return fallback;
  }

  static String _langCode(String language) {
    final l = language.toLowerCase();
    if (l.startsWith('si') || l.contains('sinhala')) return 'si';
    if (l.startsWith('ta') || l.contains('tamil')) return 'ta';
    if (l.startsWith('en') || l.contains('english')) return 'en';
    return 'en';
  }

  static String _t(String lang, Map<String, String> map) =>
      map[lang] ?? map['en']!;

  static String _greeting(String lang, String name) {
    switch (lang) {
      case 'si':
        return 'ආයුබෝවන් $name! (Hello $name!)';
      case 'ta':
        return 'வணக்கம் $name! (Hello $name!)';
      default:
        return 'Hello $name! (ආයුබෝවන් / வணக்கம்)';
    }
  }

  static String _reportTitle(VaultReport report, String lang) {
    final t = report.title.toLowerCase();
    if (t.contains('cbc') ||
        t.contains('complete blood') ||
        t.contains('fbc') ||
        t.contains('full blood')) {
      return _t(lang, {
        'en': 'Complete Blood Count (CBC)',
        'si': 'සම්පූර්ණ රුධිර පරීක්ෂණ වාර්තාව (Complete Blood Count - CBC)',
        'ta': 'முழு இரத்தப் பரிசோதனை (Complete Blood Count - CBC)',
      });
    }
    return report.title;
  }

  static String _intro(String lang, VaultReport report) {
    final title = _reportTitle(report, lang);
    switch (lang) {
      case 'si':
        return 'ඔබගේ $title මා නිරීක්ෂණය කළා.';
      case 'ta':
        return 'உங்கள் $title அறிக்கையை நான் பார்த்தேன்.';
      default:
        return 'I observed your $title report.';
    }
  }

  static String _summaryHeadline(String lang, bool allNormal) {
    if (allNormal) {
      return _t(lang, {
        'en':
            'Good news: all biomarker values in your blood report are at very normal and healthy levels.',
        'si':
            'ශුභ ආරංචියක් තිබෙන්නේ, ඔබගේ රුධිර වාර්තාවේ සියලුම අගයන් (biomarkers) ඉතාමත් සාමාන්‍ය සහ නිරෝගී මට්ටමක පවතී.',
        'ta':
            'நல்ல செய்தி: உங்கள் இரத்த அறிக்கையில் உள்ள அனைத்து உயிர்குறிகளும் மிக இயல்பான, ஆரோக்கியமான அளவில் உள்ளன.',
      });
    }
    return _t(lang, {
      'en':
          'Most values look stable, but some markers need clinician review. This is educational guidance, not a diagnosis.',
      'si':
          'බොහෝ අගයන් ස්ථාවරය, නමුත් සමහර සලකුණු වෛද්‍ය සමාලෝචනයට යොමු කළ යුතුය. මෙය අධ්‍යාපනික මගපෙන්වීමකි, රෝග විනිශ්චයක් නොවේ.',
      'ta':
          'பெரும்பாலான மதிப்புகள் நிலையாக உள்ளன, சில குறிகள் மருத்துவர் பார்வை தேவை. இது கல்வி வழிகாட்டல் மட்டுமே, நோய் கண்டறிதல் அல்ல.',
    });
  }

  static String _languageNote(String lang) {
    return _t(lang, {
      'en':
          'As you requested, this report is explained in English below:',
      'si':
          'ඔබේ ඉල්ලීම පරිදි, මෙම වාර්තාව සිංහල භාෂාවෙන් පැහැදිලි කර පහතින් දක්වා ඇත:',
      'ta':
          'நீங்கள் கேட்டபடி, இந்த அறிக்கை தமிழில் விளக்கி கீழே தரப்பட்டுள்ளது:',
    });
  }

  static String _evidenceLead(String lang, bool allNormal) {
    if (allNormal) {
      return _t(lang, {
        'en': 'The condition of your blood cells is at a very good level:',
        'si': 'ඔබේ රුධිර සෛලවල තත්ත්වය ඉතා යහපත් මට්ටමක පවතී:',
        'ta': 'உங்கள் இரத்த அணுக்களின் நிலை மிக நன்றாக உள்ளது:',
      });
    }
    return _t(lang, {
      'en': 'Here is each biomarker from your report:',
      'si': 'ඔබේ වාර්තාවේ සෑම සලකුණක්ම පහත දැක්වේ:',
      'ta': 'உங்கள் அறிக்கையின் ஒவ்வொரு குறியும் கீழே உள்ளது:',
    });
  }

  static String _recsIntro(String lang, bool allNormal) {
    if (allNormal) {
      return _t(lang, {
        'en':
            'Your report is fully within normal ranges, so there is no urgent need to see a specialist for a specific disease. However, for a routine health checkup, or if you feel unwell, you can refer to the medical departments below:',
        'si':
            'ඔබේ රුධිර වාර්තාව සම්පූර්ණයෙන්ම සාමාන්‍ය අගයන් ගන්නා බැවින් විශේෂිත රෝගී තත්ත්වයක් සඳහා විශේෂඥ වෛද්‍යවරයකු හමුවීමට ක්ෂණික අවශ්‍යතාවයක් නොමැත. කෙසේ වෙතත්, සාමාන්‍ය සෞඛ්‍ය පරීක්ෂාවක් (Routine Health Checkup) සඳහා හෝ ඔබට යම්කිසි අපහසුතාවයක් ඇත්නම් පහත සඳහන් වෛද්‍ය අංශ වෙත යොමු විය හැක:',
        'ta':
          'உங்கள் அறிக்கை முழுவதும் இயல்பான வரம்பில் உள்ளதால் குறிப்பிட்ட நோய்க்காக அவசரமாக சிறப்பு மருத்துவரை பார்க்க வேண்டியதில்லை. வழக்கமான உடல் பரிசோதனை (Routine Health Checkup) அல்லது அசௌகரியம் இருந்தால் கீழே உள்ள மருத்துவ பிரிவுகளை நாடலாம்:',
      });
    }
    return _t(lang, {
      'en':
          'Some markers are outside the usual range. Book a matching specialist below for review. Tap a doctor name to start the normal booking flow.',
      'si':
          'සමහර සලකුණු සාමාන්‍ය පරාසයෙන් බැහැරය. පහත ගැළපෙන විශේෂඥවරයෙකු හමුවී සමාලෝචනය කරන්න. වෛද්‍ය නම තට්ටු කර සාමාන්‍ය booking එක අරඹන්න.',
      'ta':
          'சில குறிகள் வழக்கமான வரம்பிற்கு வெளியே உள்ளன. கீழே பொருந்தும் நிபுணரை பதிவு செய்து பார்வையிடுங்கள். மருத்துவர் பெயரை தொட்டு வழக்கமான முன்பதிவை தொடங்குங்கள்.',
    });
  }

  static String _recsBeforeDoctor(String lang, Doctor? doctor) {
    if (doctor == null) return '';
    return _t(lang, {
      'en': 'You can book a session with ',
      'si': 'විශේෂඥ වෛද්‍ය ',
      'ta': 'சிறப்பு மருத்துவர் ',
    });
  }

  static String _recsAfterDoctor(String lang, Doctor? doctor) {
    if (doctor == null) return '';
    return _t(lang, {
      'en':
          ' (General Medicine Specialist) or your family doctor (GP). Tap the name to book the same way as Doctors.',
      'si':
          ' (General Medicine Specialist) හෝ ඔබේ පවුලේ වෛද්‍යවරයා (GP) හමුවන්න. නම තට්ටු කර Doctors පිටුවේ මෙන් session එකක් වෙන්කරගන්න.',
      'ta':
          ' (General Medicine Specialist) அல்லது உங்கள் குடும்ப மருத்துவரை (GP) பாருங்கள். பெயரை தொட்டு Doctors பக்கம் போல அமர்வை பதிவு செய்யுங்கள்.',
    });
  }

  static Doctor? _featuredDoctor(VaultReport report, List<Doctor> recs) {
    final requested = DoctorCatalog.doctorByName(report.requestedBy ?? '');
    if (requested != null) return requested;
    return DoctorCatalog.doctorByName('Dr. Samantha Silva') ??
        (recs.isEmpty ? null : recs.first);
  }

  static String _habits(String lang) {
    return _t(lang, {
      'en':
          'drink enough water daily (adequate hydration), eat balanced meals, rest well, and keep your family doctor informed of new symptoms.',
      'si':
          'ඔබේ සිරුර නිරෝගීව තබා ගැනීමට දිනකට ප්‍රමාණවත් පරිදි ජලය පානය කරන්න (Adequate hydration), සමබර ආහාර ගන්න, විවේක ගන්න, නව රෝග ලක්ෂණ පවුලේ වෛද්‍යවරයාට දන්වන්න.',
      'ta':
          'தினமும் போதிய நீர் குடியுங்கள் (Adequate hydration), சமச்சீர் உணவு, ஓய்வு, புதிய அறிகுறிகளை குடும்ப மருத்துவரிடம் தெரிவியுங்கள்.',
    });
  }

  static String _disclaimer(String lang) {
    return _t(lang, {
      'en':
          'This is an explanation by Suwasiri AI only and is not a substitute for professional medical advice. For final medical advice, consult your family doctor (GP) or a registered Sri Lankan doctor.',
      'si':
          'මෙය Suwasiri AI විසින් සපයන පැහැදිලි කිරීමක් පමණි. වෘත්තීය වෛද්‍ය උපදෙස් වෙනුවට මෙය යොදා නොගන්න. අවසාන වෛද්‍ය උපදෙස් සඳහා ඔබේ පවුලේ වෛද්‍යවරයා (GP) හෝ ලියාපදිංචි ශ්‍රී ලාංකික වෛද්‍යවරයෙකු සමඟ සාකච්ඡා කරන්න.',
      'ta':
          'இது Suwasiri AI விளக்கம் மட்டுமே; தொழில்முறை மருத்துவ ஆலோசனைக்கு பதிலல்ல. இறுதி ஆலோசனைக்கு உங்கள் குடும்ப மருத்துவர் (GP) அல்லது பதிவுபெற்ற இலங்கை மருத்துவரை அணுகவும்.',
    });
  }

  static LabMetricExplain _explainMetric(MetricReading m, String lang) {
    final info = _lookupMetric(m.name);
    late final String title;
    if (info == null) {
      title = '${m.name} — ${m.value}';
    } else if (lang == 'en') {
      title = '${info.en} (${info.abbrev}) — ${m.value}';
    } else {
      final local = lang == 'si' ? info.si : info.ta;
      title = '${info.en} ($local - ${info.abbrev}) — ${m.value}';
    }
    final range = m.normalRange.isNotEmpty
        ? m.normalRange
        : (info?.defaultRange ?? '');
    final rangeLabel = _t(lang, {
      'en': range.isEmpty ? 'reference range on report' : 'Normal range: $range',
      'si': range.isEmpty
          ? 'වාර්තාවේ සාමාන්‍ය පරාසය'
          : 'සාමාන්‍ය පරාසය: $range',
      'ta': range.isEmpty
          ? 'அறிக்கையில் உள்ள இயல்பான வரம்பு'
          : 'இயல்பான வரம்பு: $range',
    });

    final status = m.status.toLowerCase();
    String body;
    if (info != null) {
      if (status == 'attention' || status == 'critical') {
        body = lang == 'si'
            ? info.attentionSi
            : lang == 'ta'
                ? info.attentionTa
                : info.attentionEn;
      } else {
        body = lang == 'si'
            ? info.normalSi
            : lang == 'ta'
                ? info.normalTa
                : info.normalEn;
      }
    } else {
      body = _genericBody(lang, m);
    }
    return LabMetricExplain(
      heading: title,
      rangeLabel: rangeLabel,
      body: body,
    );
  }

  static String _genericBody(String lang, MetricReading m) {
    final ok = m.status == 'normal';
    return _t(lang, {
      'en': ok
          ? 'Your ${m.name} is ${m.value}, which is within the expected range. This supports overall health for this marker.'
          : 'Your ${m.name} is ${m.value}, which is outside the usual range. Discuss this value with a doctor before changing any treatment.',
      'si': ok
          ? 'ඔබේ ${m.name} අගය ${m.value} වන අතර එය සාමාන්‍ය පරාසය තුළය. මෙය මෙම සලකුණ සඳහා නිරෝගී තත්ත්වයක් පෙන්වයි.'
          : 'ඔබේ ${m.name} අගය ${m.value} වන අතර එය සාමාන්‍ය පරාසයෙන් බැහැරය. ප්‍රතිකාර වෙනස් කිරීමට පෙර වෛද්‍යවරයෙකු සමඟ සාකච්ඡා කරන්න.',
      'ta': ok
          ? 'உங்கள் ${m.name} மதிப்பு ${m.value}; இது எதிர்பார்க்கப்படும் வரம்பில் உள்ளது. இந்த குறிக்கு நல்ல ஆரோக்கியத்தை காட்டுகிறது.'
          : 'உங்கள் ${m.name} மதிப்பு ${m.value}; இது வழக்கமான வரம்பிற்கு வெளியே உள்ளது. சிகிச்சையை மாற்றுவதற்கு முன் மருத்துவரை அணுகவும்.',
    });
  }

  static _MetricInfo? _lookupMetric(String raw) {
    final key = raw.toLowerCase();
    for (final m in _metrics) {
      if (key.contains(m.match)) return m;
    }
    return null;
  }

  static List<String> _specialtyKeysFor(VaultReport report) {
    final blob =
        '${report.title} ${report.category ?? ''} ${report.metrics.map((m) => m.name).join(' ')}'
            .toLowerCase();
    if (blob.contains('lipid') ||
        blob.contains('ldl') ||
        blob.contains('cholesterol')) {
      return const ['cardiology', 'physician'];
    }
    if (blob.contains('lft') ||
        blob.contains('liver') ||
        blob.contains('alt') ||
        blob.contains('bilirubin')) {
      return const ['gastro', 'physician'];
    }
    if (blob.contains('tsh') ||
        blob.contains('thyroid') ||
        blob.contains('hba1c') ||
        blob.contains('glucose')) {
      return const ['endo', 'physician'];
    }
    if (blob.contains('creatinine') || blob.contains('kidney')) {
      return const ['nephro', 'physician'];
    }
    return const ['physician', 'haematology'];
  }

  static LabSpecialtyRec _specialtyCopy(
    String key,
    String lang,
    bool allNormal,
  ) {
    switch (key) {
      case 'cardiology':
        return LabSpecialtyRec(
          heading: _t(lang, {
            'en': 'Cardiologist (හෘද රෝග විශේෂඥ / இதய மருத்துவர்)',
            'si': 'හෘද රෝග විශේෂඥ වෛද්‍ය (Cardiologist)',
            'ta': 'இதய மருத்துவர் (Cardiologist)',
          }),
          body: _t(lang, {
            'en': allNormal
                ? 'A cardiologist can review cholesterol trends and heart-risk habits even when today\'s numbers look acceptable.'
                : 'A cardiologist should review this lipid pattern and advise diet, activity, and whether medicines are needed.',
            'si': allNormal
                ? 'අගයන් සාමාන්‍ය වුවද, කොලෙස්ටරෝල් ප්‍රවණතා සහ හෘද අවදානම් පුරුදු සමාලෝචනයට හෘද විශේෂඥවරයෙකු උපකාරී වේ.'
                : 'මෙම ලිපිඩ රටාව හෘද විශේෂඥවරයෙකු සමඟ සාකච්ඡා කර ආහාර, ව්‍යායාම සහ ඖෂධ අවශ්‍යදැයි විමසන්න.',
            'ta': allNormal
                ? 'இன்றைய எண்கள் இயல்பாக இருந்தாலும் கொழுப்பு போக்கு மற்றும் இதய ஆபத்து பழக்கங்களை இதய மருத்துவர் பார்க்கலாம்.'
                : 'இந்த கொழுப்பு முறையை இதய மருத்துவரிடம் காட்டி உணவு, உடற்பயிற்சி, மருந்து தேவையா என கேளுங்கள்.',
          }),
        );
      case 'gastro':
        return LabSpecialtyRec(
          heading: _t(lang, {
            'en': 'Gastroenterologist (අක්මා/ආහාර මාර්ග විශේෂඥ)',
            'si': 'අක්මා හා ආහාර මාර්ග විශේෂඥ (Gastroenterologist)',
            'ta': 'இரைப்பை குடல் / கல்லீரல் மருத்துவர் (Gastroenterologist)',
          }),
          body: _t(lang, {
            'en':
                'Liver enzymes and bilirubin are best interpreted with a gastroenterologist if you have abdominal symptoms, jaundice, or alcohol/medicine exposure.',
            'si':
                'උදර රෝග ලක්ෂණ, කහිල, හෝ මත්පැන්/ඖෂධ නිරාවරණය ඇත්නම් අක්මා එන්සයිම gastroenterologist කෙනෙකු සමඟ අර්ථකථනය කරන්න.',
            'ta':
                'வயிற்று அறிகுறி, மஞ்சள் காமாலை அல்லது மது/மருந்து பயன்பாடு இருந்தால் கல்லீரல் என்சைம்களை gastroenterologist உடன் பாருங்கள்.',
          }),
        );
      case 'endo':
        return LabSpecialtyRec(
          heading: _t(lang, {
            'en': 'Endocrinologist (හෝමෝන/දියවැඩියා විශේෂඥ)',
            'si': 'හෝමෝන හා දියවැඩියා විශේෂඥ (Endocrinologist)',
            'ta': 'ஹார்மோன் / நீரிழிவு மருத்துவர் (Endocrinologist)',
          }),
          body: _t(lang, {
            'en':
                'Thyroid and glucose markers are followed by an endocrinologist when symptoms, family history, or repeat tests need specialist input.',
            'si':
                'රෝග ලක්ෂණ, පවුල් ඉතිහාසය, හෝ නැවත පරීක්ෂණ සඳහා endocrinologist කෙනෙකු තයිරොයිඩ්/ග්ලූකෝස් සලකුණු අනුගමනය කරයි.',
            'ta':
                'அறிகுறிகள், குடும்ப வரலாறு அல்லது மீண்டும் பரிசோதனை தேவைப்பட்டால் தைராய்டு/குளுக்கோஸ் குறிகளை endocrinologist பார்ப்பார்.',
          }),
        );
      case 'nephro':
        return LabSpecialtyRec(
          heading: _t(lang, {
            'en': 'Nephrologist (වකුගඩු විශේෂඥ)',
            'si': 'වකුගඩු විශේෂඥ (Nephrologist)',
            'ta': 'சிறுநீரக மருத்துவர் (Nephrologist)',
          }),
          body: _t(lang, {
            'en':
                'Kidney markers should be reviewed by a nephrologist if they stay abnormal or you have swelling, high blood pressure, or diabetes.',
            'si':
                'වකුගඩු සලකුණු අසාමාන්‍යව රැඳෙනවා නම් හෝ ඉදිමුම්, ඉහළ රුධිර පීඩනය, දියවැඩියාව ඇත්නම් nephrologist කෙනෙකු හමුවන්න.',
            'ta':
                'சிறுநீரக குறிகள் தொடர்ந்து மாறினால் அல்லது வீக்கம், உயர் அழுத்தம், நீரிழிவு இருந்தால் nephrologist-ஐ அணுகவும்.',
          }),
        );
      case 'haematology':
        return LabSpecialtyRec(
          heading: _t(lang, {
            'en': 'Haematologist (රුධිර රෝග විශේෂඥ)',
            'si': 'රුධිර රෝග විශේෂඥ (Haematologist)',
            'ta': 'இரத்தவியல் நிபுணர் (Haematologist)',
          }),
          body: _t(lang, {
            'en': allNormal
                ? 'A haematologist can explain blood-count patterns if you later develop fever, unusual bruising, or fatigue.'
                : 'A haematologist should interpret this blood count if values stay out of range or you have fever, bruising, or unusual tiredness.',
            'si': allNormal
                ? 'පසුව උණ, තැලීම්, හෝ මහන්සිය ඇතිවුවහොත් රුධිර ගණන අර්ථකථනයට haematologist කෙනෙකු උපකාරී වේ.'
                : 'අගයන් පරාසයෙන් බැහැරව රැඳෙනවා නම් හෝ උණ, තැලීම්, අසාමාන්‍ය මහන්සිය ඇත්නම් haematologist කෙනෙකු හමුවන්න.',
            'ta': allNormal
                ? 'பின்னர் காய்ச்சல், சிராய்ப்பு அல்லது சோர்வு வந்தால் இரத்த எண்ணிக்கையை haematologist விளக்கலாம்.'
                : 'மதிப்புகள் வரம்பிற்கு வெளியே நிற்கிறதென்றால் அல்லது காய்ச்சல், சிராய்ப்பு, அசாதாரண சோர்வு இருந்தால் haematologist-ஐ பாருங்கள்.',
          }),
        );
      default:
        return LabSpecialtyRec(
          heading: _t(lang, {
            'en': 'Physician / General Medicine (කායික රෝග විශේෂඥ වෛද්‍ය)',
            'si': 'කායික රෝග පිළිබඳ විශේෂඥ වෛද්‍ය (General Medicine)',
            'ta': 'பொது மருத்துவம் / மருத்துவர் (General Medicine)',
          }),
          body: _t(lang, {
            'en':
                'A consultant physician is the best first stop for general health, professional medical advice, and whether any other specialty is needed.',
            'si':
                'ඔබේ සාමාන්‍ය සෞඛ්‍ය තත්ත්වය පවත්වාගෙන යාමට සහ වෘත්තීය වෛද්‍ය උපදෙස් සඳහා කායික රෝග විශේෂඥ වෛද්‍යවරයෙකු පළමු තේරීමයි. අවශ්‍ය නම් තවත් විශේෂඥයෙකුට යොමු කරයි.',
            'ta':
                'பொது சுகாதாரம் மற்றும் தொழில்முறை ஆலோசனைக்கு பொது மருத்துவ நிபுணரே முதல் தேர்வு. தேவைப்பட்டால் மற்ற சிறப்புக்கு பரிந்துரைப்பார்.',
          }),
        );
    }
  }

  static List<Doctor> doctorsForReport(VaultReport report) {
    final keys = _specialtyKeysFor(report);
    const catalog = {
      'physician': 'Physician / Consultant Physician',
      'haematology': 'Hematologist',
      'cardiology': 'Cardiologist',
      'gastro': 'Gastroenterologist',
      'endo': 'Endocrinologist',
      'nephro': 'Nephrologist',
    };
    final out = <Doctor>[];
    final seen = <String>{};
    final featured = _featuredDoctor(report, const []);
    if (featured != null && seen.add(featured.id)) {
      out.add(featured);
    }
    for (final key in keys) {
      final spec = catalog[key];
      if (spec == null) continue;
      for (final d in DoctorCatalog.doctors) {
        if (d.specialty == spec && seen.add(d.id)) {
          out.add(d);
          break;
        }
      }
    }
    if (out.isEmpty) {
      for (final d in DoctorCatalog.doctors) {
        if (d.specialty == 'General Practitioner' && seen.add(d.id)) {
          out.add(d);
          break;
        }
      }
    }
    return out.take(2).toList();
  }

  static const _metrics = <_MetricInfo>[
    _MetricInfo(
      match: 'hemoglobin',
      en: 'Hemoglobin',
      si: 'හෙමොග්ලොබින්',
      ta: 'ஹீமோகுளோபின்',
      abbrev: 'Hb',
      defaultRange: '13.5 - 17.5 g/dL',
      normalEn:
          'Your haemoglobin is in a healthy range. This protein carries oxygen in red cells, so a normal level supports good energy and shows no anaemia on this report.',
      normalSi:
          'ඔබේ හෙමොග්ලොබින් මට්ටම නිරෝගී පරාසයක ඇත. මෙම ප්‍රෝටීනය රතු රුධිරාණු තුළ ඔක්සිජන් රැගෙන යයි. සාමාන්‍ය මට්ටමකින් ශක්තිය හොඳින් තිබෙන බවත්, මෙම වාර්තාවේ රක්තහීනතාවයක් (anaemia) නොමැති බවත් පෙනේ.',
      normalTa:
          'உங்கள் ஹீமோகுளோபின் ஆரோக்கியமான வரம்பில் உள்ளது. இது சிவப்பணுக்களில் ஆக்சிஜனை சுமக்கும் புரதம். இயல்பான அளவு நல்ல சக்தியையும் இந்த அறிக்கையில் இரத்தசோகை இல்லை என்பதையும் காட்டுகிறது.',
      attentionEn:
          'Your haemoglobin is outside the usual range. Low levels can mean anaemia; high levels need another cause checked. Please review this with a physician or haematologist.',
      attentionSi:
          'ඔබේ හෙමොග්ලොබින් සාමාන්‍ය පරාසයෙන් බැහැරය. අඩු මට්ටම් රක්තහීනතාවයට සම්බන්ධ විය හැක. වෛද්‍යවරයෙකු හෝ haematologist කෙනෙකු සමඟ මෙය සමාලෝචනය කරන්න.',
      attentionTa:
          'உங்கள் ஹீமோகுளோபின் வழக்கமான வரம்பிற்கு வெளியே உள்ளது. குறைவு இரத்தசோகையை குறிக்கலாம். மருத்துவர் அல்லது haematologist உடன் இதை பாருங்கள்.',
    ),
    _MetricInfo(
      match: 'white',
      en: 'White Blood Cells',
      si: 'ශ්වේත රුධිරාණු',
      ta: 'வெள்ளையணுக்கள்',
      abbrev: 'WBC',
      defaultRange: '4500 - 11000',
      normalEn:
          'Your white blood cell count is normal. This means your immune system is working healthily and there is no lab sign of an active infection on this report.',
      normalSi:
          'ඔබේ ශ්වේත රුධිරාණු ප්‍රමාණය සාමාන්‍ය වේ. මෙයින් පෙනී යන්නේ ඔබේ සිරුරේ ප්‍රතිශක්තිකරණ පද්ධතිය නිරෝගීව ක්‍රියා කරන බවත්, සිරුර තුළ කිසිදු ආසාදනයක් (infection) නොමැති බවත්ය.',
      normalTa:
          'உங்கள் வெள்ளையணு எண்ணிக்கை இயல்பானது. நோயெதிர்ப்பு அமைப்பு ஆரோக்கியமாக செயல்படுகிறது என்றும் இந்த அறிக்கையில் செயல்படும் தொற்று இல்லை என்றும் இது காட்டுகிறது.',
      attentionEn:
          'Your white cell count is outside the usual range. High counts can occur with infection or inflammation; low counts need immune review. See a physician promptly if you have fever.',
      attentionSi:
          'ඔබේ ශ්වේත රුධිරාණු ප්‍රමාණය සාමාන්‍ය පරාසයෙන් බැහැරය. ඉහළ අගයන් ආසාදනය හෝ දැවිල්ල සමඟ බැඳෙයි. උණ ඇත්නම් ඉක්මනින් වෛද්‍යවරයෙකු හමුවන්න.',
      attentionTa:
          'உங்கள் வெள்ளையணு எண்ணிக்கை வரம்பிற்கு வெளியே உள்ளது. உயர்வு தொற்று அல்லது அழற்சியுடன் வரலாம். காய்ச்சல் இருந்தால் உடனே மருத்துவரை பாருங்கள்.',
    ),
    _MetricInfo(
      match: 'wbc',
      en: 'White Blood Cells',
      si: 'ශ්වේත රුධිරාණු',
      ta: 'வெள்ளையணுக்கள்',
      abbrev: 'WBC',
      defaultRange: '4500 - 11000',
      normalEn:
          'Your white blood cell count is normal. This means your immune system is working healthily and there is no lab sign of an active infection on this report.',
      normalSi:
          'ඔබේ ශ්වේත රුධිරාණු ප්‍රමාණය සාමාන්‍ය වේ. මෙයින් පෙනී යන්නේ ඔබේ සිරුරේ ප්‍රතිශක්තිකරණ පද්ධතිය නිරෝගීව ක්‍රියා කරන බවත්, සිරුර තුළ කිසිදු ආසාදනයක් (infection) නොමැති බවත්ය.',
      normalTa:
          'உங்கள் வெள்ளையணு எண்ணிக்கை இயல்பானது. நோயெதிர்ப்பு அமைப்பு ஆரோக்கியமாக செயல்படுகிறது என்றும் இந்த அறிக்கையில் செயல்படும் தொற்று இல்லை என்றும் இது காட்டுகிறது.',
      attentionEn:
          'Your white cell count is outside the usual range. High counts can occur with infection or inflammation; low counts need immune review. See a physician promptly if you have fever.',
      attentionSi:
          'ඔබේ ශ්වේත රුධිරාණු ප්‍රමාණය සාමාන්‍ය පරාසයෙන් බැහැරය. ඉහළ අගයන් ආසාදනය හෝ දැවිල්ල සමඟ බැඳෙයි. උණ ඇත්නම් ඉක්මනින් වෛද්‍යවරයෙකු හමුවන්න.',
      attentionTa:
          'உங்கள் வெள்ளையணு எண்ணிக்கை வரம்பிற்கு வெளியே உள்ளது. உயர்வு தொற்று அல்லது அழற்சியுடன் வரலாம். காய்ச்சல் இருந்தால் உடனே மருத்துவரை பாருங்கள்.',
    ),
    _MetricInfo(
      match: 'platelet',
      en: 'Platelets',
      si: 'රුධිර පට්ටිකා',
      ta: 'பிளேட்லெட்டுகள்',
      abbrev: 'PLT',
      defaultRange: '150,000 - 450,000',
      normalEn:
          'Your platelet count is normal. Platelets help blood clot, so a healthy count means bleeding and clotting are likely well balanced on this test.',
      normalSi:
          'ඔබේ රුධිර පට්ටිකා ප්‍රමාණය සාමාන්‍යයි. පට්ටිකා රුධිරය කැටි ගැසීමට උපකාරී වේ. නිරෝගී ගණනකින් ලේ ගැලීම සහ කැටි ගැසීම සමබරව තිබෙන බව මෙම පරීක්ෂණයෙන් පෙනේ.',
      normalTa:
          'உங்கள் பிளேட்லெட் எண்ணிக்கை இயல்பானது. இவை இரத்தம் உறைவதற்கு உதவுகின்றன. ஆரோக்கியமான அளவு இரத்தப்போக்கு மற்றும் உறைதல் சமநிலையில் உள்ளதை காட்டுகிறது.',
      attentionEn:
          'Your platelet count is outside the usual range. Low platelets raise bleeding risk; high counts need another cause checked. Please see a haematologist or physician.',
      attentionSi:
          'ඔබේ පට්ටිකා ගණන සාමාන්‍ය පරාසයෙන් බැහැරය. අඩු අගයන් ලේ ගැලීමේ අවදානම වැඩි කරයි. haematologist හෝ වෛද්‍යවරයෙකු හමුවන්න.',
      attentionTa:
          'உங்கள் பிளேட்லெட் எண்ணிக்கை வரம்பிற்கு வெளியே உள்ளது. குறைவு இரத்தப்போக்கு அபாயத்தை உயர்த்தும். haematologist அல்லது மருத்துவரை பாருங்கள்.',
    ),
    _MetricInfo(
      match: 'red',
      en: 'Red Blood Cells',
      si: 'රතු රුධිරාණු',
      ta: 'சிவப்பணுக்கள்',
      abbrev: 'RBC',
      defaultRange: '4.3 - 5.9',
      normalEn:
          'Your red blood cell count is within the normal range. This supports healthy oxygen delivery and energy levels.',
      normalSi:
          'ඔබේ රතු රුධිරාණු ප්‍රමාණය සාමාන්‍ය පරාසය තුළය. මෙය ඔක්සිජන් හොඳින් රැගෙන යන බවත්, ශක්තිය නිරෝගී මට්ටමක තිබෙන බවත් තහවුරු කරයි.',
      normalTa:
          'உங்கள் சிவப்பணு எண்ணிக்கை இயல்பான வரம்பில் உள்ளது. இது நல்ல ஆக்சிஜன் விநியோகத்தையும் சக்தி அளவையும் உறுதிப்படுத்துகிறது.',
      attentionEn:
          'Your red cell count is outside the usual range. This can relate to anaemia, dehydration, or other causes and should be reviewed with a doctor.',
      attentionSi:
          'ඔබේ රතු රුධිරාණු ගණන සාමාන්‍ය පරාසයෙන් බැහැරය. මෙය රක්තහීනතාවය, ජලහීනතාවය හෝ වෙනත් හේතු සමඟ බැඳෙනු හැක. වෛද්‍යවරයෙකු සමඟ සමාලෝචනය කරන්න.',
      attentionTa:
          'உங்கள் சிவப்பணு எண்ணிக்கை வரம்பிற்கு வெளியே உள்ளது. இரத்தசோகை, நீர்ச்சத்து குறைவு அல்லது பிற காரணங்களுடன் தொடர்புடையதாக இருக்கலாம். மருத்துவரை அணுகவும்.',
    ),
    _MetricInfo(
      match: 'rbc',
      en: 'Red Blood Cells',
      si: 'රතු රුධිරාණු',
      ta: 'சிவப்பணுக்கள்',
      abbrev: 'RBC',
      defaultRange: '4.3 - 5.9',
      normalEn:
          'Your red blood cell count is within the normal range. This supports healthy oxygen delivery and energy levels.',
      normalSi:
          'ඔබේ රතු රුධිරාණු ප්‍රමාණය සාමාන්‍ය පරාසය තුළය. මෙය ඔක්සිජන් හොඳින් රැගෙන යන බවත්, ශක්තිය නිරෝගී මට්ටමක තිබෙන බවත් තහවුරු කරයි.',
      normalTa:
          'உங்கள் சிவப்பணு எண்ணிக்கை இயல்பான வரம்பில் உள்ளது. இது நல்ல ஆக்சிஜன் விநியோகத்தையும் சக்தி அளவையும் உறுதிப்படுத்துகிறது.',
      attentionEn:
          'Your red cell count is outside the usual range. This can relate to anaemia, dehydration, or other causes and should be reviewed with a doctor.',
      attentionSi:
          'ඔබේ රතු රුධිරාණු ගණන සාමාන්‍ය පරාසයෙන් බැහැරය. මෙය රක්තහීනතාවය, ජලහීනතාවය හෝ වෙනත් හේතු සමඟ බැඳෙනු හැක. වෛද්‍යවරයෙකු සමඟ සමාලෝචනය කරන්න.',
      attentionTa:
          'உங்கள் சிவப்பணு எண்ணிக்கை வரம்பிற்கு வெளியே உள்ளது. இரத்தசோகை, நீர்ச்சத்து குறைவு அல்லது பிற காரணங்களுடன் தொடர்புடையதாக இருக்கலாம். மருத்துவரை அணுகவும்.',
    ),
    _MetricInfo(
      match: 'ldl',
      en: 'LDL Cholesterol',
      si: 'LDL කොලෙස්ටරෝල්',
      ta: 'LDL கொழுப்பு',
      abbrev: 'LDL',
      defaultRange: '< 100 mg/dL',
      normalEn:
          'Your LDL (bad cholesterol) is in an acceptable range on this report. Keep heart-healthy food and activity habits.',
      normalSi:
          'ඔබේ LDL (අහිතකර කොලෙස්ටරෝල්) මෙම වාර්තාවේ පිළිගත හැකි පරාසයක ඇත. හෘදයට හිතකර ආහාර සහ ව්‍යායාම රැකගන්න.',
      normalTa:
          'உங்கள் LDL (கெட்ட கொழுப்பு) இந்த அறிக்கையில் ஏற்கத்தக்க வரம்பில் உள்ளது. இதய நல உணவு மற்றும் உடற்பயிற்சியை தொடருங்கள்.',
      attentionEn:
          'Your LDL is higher than the preferred target. A cardiologist or physician can advise diet, activity, and whether medicine is needed.',
      attentionSi:
          'ඔබේ LDL ඉලක්කයට වඩා ඉහළය. හෘද විශේෂඥවරයෙකු හෝ වෛද්‍යවරයෙකු ආහාර, ව්‍යායාම සහ ඖෂධ අවශ්‍යදැයි උපදෙස් දෙයි.',
      attentionTa:
          'உங்கள் LDL விருப்ப இலக்கை விட உயர்வாக உள்ளது. இதய மருத்துவர் உணவு, உடற்பயிற்சி, மருந்து தேவையா என அறிவுறுத்துவார்.',
    ),
    _MetricInfo(
      match: 'hdl',
      en: 'HDL Cholesterol',
      si: 'HDL කොලෙස්ටරෝල්',
      ta: 'HDL கொழுப்பு',
      abbrev: 'HDL',
      defaultRange: '> 40 mg/dL',
      normalEn:
          'Your HDL (protective cholesterol) is in a helpful range. It supports clearing cholesterol from the bloodstream.',
      normalSi:
          'ඔබේ HDL (ආරක්ෂිත කොලෙස්ටරෝල්) උපකාරී පරාසයක ඇත. එය රුධිරයෙන් කොලෙස්ටරෝල් ඉවත් කිරීමට උපකාරී වේ.',
      normalTa:
          'உங்கள் HDL (பாதுகாப்பு கொழுப்பு) உதவும் வரம்பில் உள்ளது. இரத்தத்திலிருந்து கொழுப்பை அகற்ற உதவுகிறது.',
      attentionEn:
          'Your HDL is lower than preferred. Activity and diet changes, reviewed with a physician, can help raise protective cholesterol.',
      attentionSi:
          'ඔබේ HDL ඉලක්කයට වඩා අඩුය. ව්‍යායාම සහ ආහාර වෙනස්කම් වෛද්‍යවරයෙකු සමඟ සාකච්ඡා කරන්න.',
      attentionTa:
          'உங்கள் HDL விருப்ப அளவை விட குறைவு. உடற்பயிற்சி மற்றும் உணவு மாற்றங்களை மருத்துவருடன் பேசுங்கள்.',
    ),
    _MetricInfo(
      match: 'trigly',
      en: 'Triglycerides',
      si: 'ට්‍රයිග්ලිසරයිඩ',
      ta: 'டிரைகிளிசரைடுகள்',
      abbrev: 'TG',
      defaultRange: '< 150 mg/dL',
      normalEn:
          'Your triglycerides are in the usual range. These fats in blood stay healthier with regular meals and limited sugary drinks.',
      normalSi:
          'ඔබේ ට්‍රයිග්ලිසරයිඩ සාමාන්‍ය පරාසයේ ඇත. සීනි බීම අඩු කිරීමෙන් සහ නිතිපතා ආහාර වලින් මෙම මේද තවදුරටත් නිරෝගීව තබා ගත හැක.',
      normalTa:
          'உங்கள் டிரைகிளிசரைடுகள் வழக்கமான வரம்பில் உள்ளன. சர்க்கரை பானங்களை குறைத்து முறையான உணவால் இவை ஆரோக்கியமாக இருக்கும்.',
      attentionEn:
          'Your triglycerides are higher than usual. A physician or cardiologist can advise on diet, activity, and follow-up testing.',
      attentionSi:
          'ඔබේ ට්‍රයිග්ලිසරයිඩ සාමාන්‍යයට වඩා ඉහළය. වෛද්‍යවරයෙකු හෝ හෘද විශේෂඥවරයෙකු ආහාර සහ පසු පරීක්ෂණ ගැන උපදෙස් දෙයි.',
      attentionTa:
          'உங்கள் டிரைகிளிசரைடுகள் வழக்கத்தை விட உயர்வாக உள்ளன. மருத்துவர் அல்லது இதய மருத்துவர் உணவு மற்றும் பின்தொடர்தல் பரிசோதனைக்கு அறிவுறுத்துவார்.',
    ),
    _MetricInfo(
      match: 'alt',
      en: 'ALT',
      si: 'ALT (අක්මා එන්සයිමය)',
      ta: 'ALT (கல்லீரல் என்சைம்)',
      abbrev: 'ALT',
      defaultRange: '< 40 U/L',
      normalEn:
          'Your ALT liver enzyme is within the usual range, which supports healthy liver cell activity on this test.',
      normalSi:
          'ඔබේ ALT අක්මා එන්සයිමය සාමාන්‍ය පරාසය තුළය. මෙය මෙම පරීක්ෂණයේ අක්මා සෛල ක්‍රියාකාරිත්වය නිරෝගී බවට සහාය දක්වයි.',
      normalTa:
          'உங்கள் ALT கல்லீரல் என்சைம் வழக்கமான வரம்பில் உள்ளது. இந்த பரிசோதனையில் கல்லீரல் செல்கள் ஆரோக்கியமாக செயல்படுவதை காட்டுகிறது.',
      attentionEn:
          'Your ALT is outside the usual range. Alcohol, medicines, or liver inflammation can raise it. Please review with a physician or gastroenterologist.',
      attentionSi:
          'ඔබේ ALT සාමාන්‍ය පරාසයෙන් බැහැරය. මත්පැන්, ඖෂධ හෝ අක්මා දැවිල්ල මෙය ඉහළ නැංවිය හැක. වෛද්‍යවරයෙකු සමඟ සමාලෝචනය කරන්න.',
      attentionTa:
          'உங்கள் ALT வரம்பிற்கு வெளியே உள்ளது. மது, மருந்துகள் அல்லது கல்லீரல் அழற்சி உயர்த்தலாம். மருத்துவரை அணுகவும்.',
    ),
    _MetricInfo(
      match: 'ast',
      en: 'AST',
      si: 'AST (අක්මා එන්සයිමය)',
      ta: 'AST (கல்லீரல் என்சைம்)',
      abbrev: 'AST',
      defaultRange: '< 40 U/L',
      normalEn:
          'Your AST liver enzyme is within the usual range on this report.',
      normalSi:
          'ඔබේ AST අක්මා එන්සයිමය මෙම වාර්තාවේ සාමාන්‍ය පරාසය තුළය.',
      normalTa:
          'உங்கள் AST கல்லீரல் என்சைம் இந்த அறிக்கையில் வழக்கமான வரம்பில் உள்ளது.',
      attentionEn:
          'Your AST is outside the usual range and should be interpreted with other liver tests by a doctor.',
      attentionSi:
          'ඔබේ AST සාමාන්‍ය පරාසයෙන් බැහැරය. අනෙකුත් අක්මා පරීක්ෂණ සමඟ වෛද්‍යවරයෙකු අර්ථකථනය කළ යුතුය.',
      attentionTa:
          'உங்கள் AST வரம்பிற்கு வெளியே உள்ளது. பிற கல்லீரல் பரிசோதனைகளுடன் மருத்துவர் விளக்க வேண்டும்.',
    ),
    _MetricInfo(
      match: 'bilirubin',
      en: 'Bilirubin',
      si: 'බිලිරුබින්',
      ta: 'பிலிரூபின்',
      abbrev: 'Bili',
      defaultRange: '0.1 - 1.2 mg/dL',
      normalEn:
          'Your bilirubin is in the usual range, which means this pigment from red-cell breakdown is being cleared normally.',
      normalSi:
          'ඔබේ බිලිරුබින් සාමාන්‍ය පරාසයේ ඇත. රතු සෛල බිඳීමෙන් එන මෙම වර්ණකය සාමාන්‍ය පරිදි ඉවත් වේ.',
      normalTa:
          'உங்கள் பிலிரூபின் வழக்கமான வரம்பில் உள்ளது. சிவப்பணு சிதைவிலிருந்து வரும் இந்த நிறமி இயல்பாக அகற்றப்படுகிறது.',
      attentionEn:
          'Your bilirubin is outside the usual range. Jaundice or liver/bile issues may be involved — please see a doctor.',
      attentionSi:
          'ඔබේ බිලිරුබින් සාමාන්‍ය පරාසයෙන් බැහැරය. කහිල හෝ අක්මා/පිත ගැටළු විය හැක. වෛද්‍යවරයෙකු හමුවන්න.',
      attentionTa:
          'உங்கள் பிலிரூபின் வரம்பிற்கு வெளியே உள்ளது. மஞ்சள் காமாலை அல்லது கல்லீரல்/பித்த பிரச்சினை இருக்கலாம். மருத்துவரை பாருங்கள்.',
    ),
    _MetricInfo(
      match: 'tsh',
      en: 'TSH',
      si: 'TSH (තයිරොයිඩ් හෝමෝනය)',
      ta: 'TSH (தைராய்டு ஹார்மோன்)',
      abbrev: 'TSH',
      defaultRange: '0.4 - 4.0 mIU/L',
      normalEn:
          'Your TSH is in the usual range, which suggests the thyroid-stimulating signal is balanced on this test.',
      normalSi:
          'ඔබේ TSH සාමාන්‍ය පරාසයේ ඇත. මෙය තයිරොයිඩ් උත්තේජක සංඥාව මෙම පරීක්ෂණයේ සමබර බවට ඉඟි කරයි.',
      normalTa:
          'உங்கள் TSH வழக்கமான வரம்பில் உள்ளது. இந்த பரிசோதனையில் தைராய்டு தூண்டல் சமிக்ஞை சமநிலையில் உள்ளதை காட்டுகிறது.',
      attentionEn:
          'Your TSH is outside the usual range. An endocrinologist can decide if the thyroid is under- or over-active and whether treatment is needed.',
      attentionSi:
          'ඔබේ TSH සාමාන්‍ය පරාසයෙන් බැහැරය. තයිරොයිඩය අඩුවෙන් හෝ වැඩිවෙන් ක්‍රියා කරන්නේදැයි endocrinologist කෙනෙකු තීරණය කරයි.',
      attentionTa:
          'உங்கள் TSH வரம்பிற்கு வெளியே உள்ளது. தைராய்டு குறைவா அல்லது அதிகமா செயல்படுகிறது என endocrinologist முடிவு செய்வார்.',
    ),
    _MetricInfo(
      match: 't4',
      en: 'Free T4',
      si: 'Free T4',
      ta: 'Free T4',
      abbrev: 'FT4',
      defaultRange: '0.8 - 1.8 ng/dL',
      normalEn:
          'Your free T4 is in the usual range, which supports a balanced thyroid hormone level on this report.',
      normalSi:
          'ඔබේ Free T4 සාමාන්‍ය පරාසයේ ඇත. මෙය මෙම වාර්තාවේ තයිරොයිඩ් හෝමෝන මට්ටම සමබර බවට සහාය දක්වයි.',
      normalTa:
          'உங்கள் Free T4 வழக்கமான வரம்பில் உள்ளது. இந்த அறிக்கையில் தைராய்டு ஹார்மோன் சமநிலையில் உள்ளதை காட்டுகிறது.',
      attentionEn:
          'Your free T4 is outside the usual range and should be reviewed with TSH by an endocrinologist.',
      attentionSi:
          'ඔබේ Free T4 සාමාන්‍ය පරාසයෙන් බැහැරය. TSH සමඟ endocrinologist කෙනෙකු සමාලෝචනය කළ යුතුය.',
      attentionTa:
          'உங்கள் Free T4 வரம்பிற்கு வெளியே உள்ளது. TSH உடன் endocrinologist பார்வையிட வேண்டும்.',
    ),
    _MetricInfo(
      match: 'hba1c',
      en: 'HbA1c',
      si: 'HbA1c (සාමාන්‍ය රුධිර සීනි)',
      ta: 'HbA1c (சராசரி இரத்த சர்க்கரை)',
      abbrev: 'HbA1c',
      defaultRange: '< 5.7%',
      normalEn:
          'Your HbA1c is in a non-diabetic range on this report. It reflects average blood sugar over about three months.',
      normalSi:
          'ඔබේ HbA1c මෙම වාර්තාවේ දියවැඩියා නොවන පරාසයක ඇත. එය මාස තුනක පමණ සාමාන්‍ය රුධිර සීනි පෙන්වයි.',
      normalTa:
          'உங்கள் HbA1c இந்த அறிக்கையில் நீரிழிவு அல்லாத வரம்பில் உள்ளது. சுமார் மூன்று மாத சராசரி இரத்த சர்க்கரையை காட்டுகிறது.',
      attentionEn:
          'Your HbA1c is in an attention range (often 5.7–6.4% is prediabetes). Discuss lifestyle and follow-up with a GP or endocrinologist. This is not a diagnosis.',
      attentionSi:
          'ඔබේ HbA1c අවධානය යොමු කළ යුතු පරාසයක ඇත (බොහෝ විට 5.7–6.4% පෙර-දියවැඩියාවයි). ජීවන රටාව සහ පසු විමසුම GP හෝ endocrinologist සමඟ සාකච්ඡා කරන්න. මෙය රෝග විනිශ්චයක් නොවේ.',
      attentionTa:
          'உங்கள் HbA1c கவன வரம்பில் உள்ளது (பெரும்பாலும் 5.7–6.4% முன்-நீரிழிவு). வாழ்க்கை முறை மற்றும் பின்தொடர்தலை GP அல்லது endocrinologist உடன் பேசுங்கள். இது நோய் கண்டறிதல் அல்ல.',
    ),
  ];
}

class _MetricInfo {
  const _MetricInfo({
    required this.match,
    required this.en,
    required this.si,
    required this.ta,
    required this.abbrev,
    required this.defaultRange,
    required this.normalEn,
    required this.normalSi,
    required this.normalTa,
    required this.attentionEn,
    required this.attentionSi,
    required this.attentionTa,
  });

  final String match;
  final String en;
  final String si;
  final String ta;
  final String abbrev;
  final String defaultRange;
  final String normalEn;
  final String normalSi;
  final String normalTa;
  final String attentionEn;
  final String attentionSi;
  final String attentionTa;
}
