class ClinicFeeItem {
  const ClinicFeeItem({
    required this.id,
    required this.description,
    required this.privateFeeLkr,
    this.suwasiriService = '',
    this.mbsItemNumber = '',
  });

  final String id;
  final String description;
  final int privateFeeLkr;
  final String suwasiriService;
  final String mbsItemNumber;

  factory ClinicFeeItem.fromMap(Map<String, dynamic> map) {
    return ClinicFeeItem(
      id: map['id'] as String? ?? '',
      description: map['description'] as String? ?? '',
      privateFeeLkr: (map['privateFee'] as num?)?.toInt() ??
          (map['privateFeeLkr'] as num?)?.toInt() ??
          0,
      suwasiriService: map['suwasiriService'] as String? ?? '',
      mbsItemNumber: map['mbsItemNumber'] as String? ?? '',
    );
  }
}

/// Maps a Suwasiri visit-reason chip to a Practice Manager MBS `suwasiriService`.
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
  return null;
}

ClinicFeeItem? feeItemForVisitReason(String reason, List<ClinicFeeItem> fees) {
  final service = suwasiriServiceForVisitReason(reason);
  if (service == null || fees.isEmpty) return null;
  for (final item in fees) {
    if (item.suwasiriService == service && item.privateFeeLkr > 0) return item;
  }
  final needle = switch (service) {
    'medical_certificate' => 'medical certificate',
    'repeat_prescription' => 'repeat prescription',
    'review_results' => 'review result',
    _ => '',
  };
  if (needle.isEmpty) return null;
  for (final item in fees) {
    if (item.description.toLowerCase().contains(needle) &&
        item.privateFeeLkr > 0) {
      return item;
    }
  }
  return null;
}

/// Service-specific bookings (certificate / repeat Rx / review) use only that
/// private fee — not the standard consult fee or venue add-on.
int consultFeeForVisit({
  required String visitReason,
  required int doctorFeeLkr,
  required List<ClinicFeeItem> fees,
}) {
  final match = feeItemForVisitReason(visitReason, fees);
  if (match != null) return match.privateFeeLkr;
  return doctorFeeLkr;
}

bool isServiceOnlyFee(String visitReason, List<ClinicFeeItem> fees) =>
    feeItemForVisitReason(visitReason, fees) != null;
