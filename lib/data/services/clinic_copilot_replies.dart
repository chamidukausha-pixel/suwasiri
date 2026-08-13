/// Lightweight Call-page clinic co-pilot replies (EN / SI / TA).
abstract final class ClinicCopilotReplies {
  static String reply(String question) {
    final lang = detectLanguage(question);
    final q = question.toLowerCase();

    if (q.contains('pulse') ||
        q.contains('heart') ||
        q.contains('නාඩි') ||
        q.contains('හෘද') ||
        q.contains('நாடி') ||
        q.contains('இதய')) {
      return _pulse(lang);
    }
    if (q.contains('fever') ||
        q.contains('temperature') ||
        q.contains('උණ') ||
        q.contains('காய்ச்சல்')) {
      return _fever(lang);
    }
    if (q.contains('hydrat') ||
        q.contains('water') ||
        q.contains('ජල') ||
        q.contains('நீர்')) {
      return _hydrate(lang);
    }
    if (q.contains('dengue') || q.contains('ඩෙංගු') || q.contains('டெங்கு')) {
      return _dengue(lang);
    }
    return _general(lang, question);
  }

  static String detectLanguage(String question) {
    final q = question.toLowerCase();
    if (RegExp(r'[\u0D80-\u0DFF]').hasMatch(question) ||
        q.contains('sinhala') ||
        q.contains('සිංහල')) {
      return 'si';
    }
    if (RegExp(r'[\u0B80-\u0BFF]').hasMatch(question) ||
        q.contains('tamil') ||
        q.contains('தமிழ்')) {
      return 'ta';
    }
    return 'en';
  }

  static String googleQuery(String question) {
    final q = question.trim();
    if (q.isEmpty) return 'Sri Lanka clinical health guidance';
    return '$q Sri Lanka health guidance';
  }

  static String _pulse(String lang) {
    switch (lang) {
      case 'si':
        return 'වැඩිහිටියන්ගේ සාමාන්‍ය විවේක නාඩි සාමාන්‍යයෙන් 60–100 bpm වේ. '
            'විජලනය හා විවේකය උපකාරී වේ. මෙය අධ්‍යාපනික මගපෙන්වීමකි, රෝග විනිශ්චයක් නොවේ.';
      case 'ta':
        return 'வயது வந்தோரின் சாதாரண ஓய்வு நாடி பொதுவாக 60–100 bpm. '
            'நீர்ச்சத்து மற்றும் ஓய்வு உதவும். இது கல்வி வழிகாட்டல், நோய் கண்டறிதல் அல்ல.';
      default:
        return 'Normal resting pulse for adults is typically 60–100 bpm. '
            'Stay hydrated and rest. This is educational guidance, not a diagnosis.';
    }
  }

  static String _fever(String lang) {
    switch (lang) {
      case 'si':
        return 'ශරීර උෂ්ණත්වය ≥38°C නම් ජලය පානය කර විවේක ගන්න. '
            'දින 3කට වඩා උණ ඇත්නම් හෝ හුස්ම ගැනීම අපහසු නම් වෛද්‍ය උපදෙස් ලබා ගන්න. මෙය රෝග විනිශ්චයක් නොවේ.';
      case 'ta':
        return 'உடல் வெப்பநிலை ≥38°C என்றால் நீர் அருந்தி ஓய்வெடுங்கள். '
            '3 நாட்களுக்கு மேல் காய்ச்சல் அல்லது மூச்சுத்திணறல் இருந்தால் மருத்துவரை அணுகவும். இது நோய் கண்டறிதல் அல்ல.';
      default:
        return 'If temperature is ≥38°C, hydrate and rest. '
            'Seek care if fever lasts over 3 days or breathing worsens. This is not a diagnosis.';
    }
  }

  static String _hydrate(String lang) {
    switch (lang) {
      case 'si':
        return 'දිනකට ජලය ලීටර් 2–3ක් පමණ පානය කිරීම බොහෝ වැඩිහිටියන්ට උචිතයි (වෛද්‍ය උපදෙස් අනුව). '
            'මෙය අධ්‍යාපනික උපදෙසකි.';
      case 'ta':
        return 'பெரும்பாலான வயது வந்தோருக்கு ஒரு நாளைக்கு சுமார் 2–3 லிட்டர் நீர் பரிந்துரைக்கப்படுகிறது '
            '(மருத்துவர் ஆலோசனைப்படி). இது கல்வி வழிகாட்டல்.';
      default:
        return 'Most adults benefit from about 2–3 litres of water daily unless advised otherwise. '
            'This is educational guidance only.';
    }
  }

  static String _dengue(String lang) {
    switch (lang) {
      case 'si':
        return 'ඩෙංගු සැකයක් ඇත්නම් ජලය පානය කරන්න, NSAID (උදා. ibuprofen) වළකින්න, '
            'සහ ශ්‍රී ලංකාවේ රෝහල්/සායනයක වෛද්‍ය උපදෙස් ඉක්මනින් ලබා ගන්න. මෙය රෝග විනිශ්චයක් නොවේ.';
      case 'ta':
        return 'டெங்கு சந்தேகம் இருந்தால் நீர் அருந்துங்கள், NSAID (எ.கா. ibuprofen) தவிருங்கள், '
            'இலங்கை மருத்துவமனை/கிளினிக்கில் விரைவில் ஆலோசனை பெறுங்கள். இது நோய் கண்டறிதல் அல்ல.';
      default:
        return 'If dengue is suspected: hydrate, avoid NSAIDs (e.g. ibuprofen), '
            'and seek prompt clinical care at a Sri Lankan hospital/clinic. Not a diagnosis.';
    }
  }

  static String _general(String lang, String question) {
    final short = question.trim().isEmpty ? 'your question' : question.trim();
    switch (lang) {
      case 'si':
        return 'මම ඔබේ ප්‍රශ්නය සලකා බැලුවෙමි (“$short”). '
            'සාමාන්‍ය සෞඛ්‍ය උපදෙස්: විවේකය, ජලය, සහ රෝග ලක්ෂණ උග්‍ර නම් වෛද්‍යවරයෙකු හමුවන්න. '
            'වැඩි විස්තර සඳහා Google සෙවුම භාවිතා කළ හැක. මෙය රෝග විනිශ්චයක් නොවේ.';
      case 'ta':
        return 'உங்கள் கேள்வியை ஆய்வு செய்தேன் (“$short”). '
            'பொது சுகாதார குறிப்பு: ஓய்வு, நீர்ச்சத்து; அறிகுறிகள் மோசமானால் மருத்துவரை அணுகவும். '
            'மேலும் விவரங்களுக்கு Google தேடலைப் பயன்படுத்தலாம். இது நோய் கண்டறிதல் அல்ல.';
      default:
        return 'I reviewed your question (“$short”). '
            'General guidance: rest, hydrate, and see a clinician if symptoms worsen. '
            'You can also open Google for more detail. This is not a diagnosis.';
    }
  }
}
