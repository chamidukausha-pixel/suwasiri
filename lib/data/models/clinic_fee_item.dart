class ClinicFeeItem {
  const ClinicFeeItem({
    required this.id,
    required this.description,
    required this.privateFeeLkr,
    this.suwasiriService = '',
    this.mbsItemNumber = '',
    this.category = '',
  });

  final String id;
  final String description;
  final int privateFeeLkr;
  final String suwasiriService;
  final String mbsItemNumber;
  final String category;

  factory ClinicFeeItem.fromMap(Map<String, dynamic> map) {
    var service = (map['suwasiriService'] as String? ?? '').trim();
    final category = map['category'] as String? ?? '';
    if (service.isEmpty && category.toLowerCase() == 'telehealth') {
      service = 'telehealth';
    }
    return ClinicFeeItem(
      id: map['id'] as String? ?? '',
      description: map['description'] as String? ?? '',
      privateFeeLkr: (map['privateFee'] as num?)?.toInt() ??
          (map['privateFeeLkr'] as num?)?.toInt() ??
          0,
      suwasiriService: service,
      mbsItemNumber: map['mbsItemNumber'] as String? ?? '',
      category: category,
    );
  }
}

/// Maps a Suwasiri visit-reason chip / home action to a Practice Manager MBS item.
String? suwasiriServiceForVisitReason(String reason) {
  final n = reason.toLowerCase();
  if (n.contains('medical certificate') ||
      n.contains('වෛද්‍ය සහතික') ||
      n.contains('மருத்துவ சான்றிதழ்')) {
    return 'medical_certificate';
  }
  if (n.contains('repeat prescription') ||
      n.contains('නැවත බෙහෙත්') ||
      n.contains('மீண்டும் மருந்து')) {
    return 'repeat_prescription';
  }
  if (n.contains('review result') ||
      n.contains('ප්‍රතිඵල සමාලෝචන') ||
      n.contains('முடிவுகள் மதிப்பாய்வு')) {
    return 'review_results';
  }
  if (n.contains('video') ||
      n.contains('telehealth') ||
      n.contains('වීඩියෝ') ||
      n.contains('வீடியோ')) {
    return 'telehealth';
  }
  return null;
}

ClinicFeeItem? feeItemForService(String service, List<ClinicFeeItem> fees) {
  if (service.isEmpty || fees.isEmpty) return null;
  for (final item in fees) {
    if (item.suwasiriService == service && item.privateFeeLkr > 0) return item;
  }
  final needle = switch (service) {
    'medical_certificate' => 'medical certificate',
    'repeat_prescription' => 'repeat prescription',
    'review_results' => 'review result',
    'telehealth' => 'telehealth',
    _ => '',
  };
  if (needle.isEmpty) return null;
  for (final item in fees) {
    final hay = '${item.description} ${item.category}'.toLowerCase();
    if (hay.contains(needle) && item.privateFeeLkr > 0) return item;
  }
  if (service == 'telehealth') {
    for (final item in fees) {
      if (item.category.toLowerCase() == 'telehealth' && item.privateFeeLkr > 0) {
        return item;
      }
    }
  }
  return null;
}

ClinicFeeItem? feeItemForVisitReason(String reason, List<ClinicFeeItem> fees) {
  final service = suwasiriServiceForVisitReason(reason);
  if (service == null) return null;
  return feeItemForService(service, fees);
}

/// Service-specific bookings use only that private fee — not consult + venue.
int consultFeeForVisit({
  required String visitReason,
  required int doctorFeeLkr,
  required List<ClinicFeeItem> fees,
  bool videoConsult = false,
}) {
  final match = feeItemForVisitReason(visitReason, fees);
  if (match != null) return match.privateFeeLkr;
  if (videoConsult) {
    final tele = feeItemForService('telehealth', fees);
    if (tele != null) return tele.privateFeeLkr;
  }
  return doctorFeeLkr;
}

bool isServiceOnlyFee(
  String visitReason,
  List<ClinicFeeItem> fees, {
  bool videoConsult = false,
}) {
  if (feeItemForVisitReason(visitReason, fees) != null) return true;
  if (videoConsult && feeItemForService('telehealth', fees) != null) return true;
  return false;
}

String formatFeeLkr(int amount) {
  final digits = amount.toString();
  final buf = StringBuffer();
  for (var i = 0; i < digits.length; i++) {
    final fromEnd = digits.length - i;
    buf.write(digits[i]);
    if (fromEnd > 1 && fromEnd % 3 == 1) buf.write(',');
  }
  return 'LKR ${buf.toString()}';
}
