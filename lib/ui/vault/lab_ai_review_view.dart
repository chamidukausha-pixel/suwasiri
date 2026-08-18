import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../data/models/appointment.dart';
import '../../data/services/lab_assistant_replies.dart';
import '../appointments/booking_checkout_flow.dart';

/// Dark markdown-style lab explanation with tappable doctor names.
class LabAiReviewView extends StatefulWidget {
  const LabAiReviewView({super.key, required this.review});

  final LabAiReview review;

  @override
  State<LabAiReviewView> createState() => _LabAiReviewViewState();
}

class _LabAiReviewViewState extends State<LabAiReviewView> {
  final _scroll = ScrollController();

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  Future<void> _book(BuildContext context, Doctor doctor) {
    return showBookingCheckoutFlow(context, doctor: doctor);
  }

  @override
  Widget build(BuildContext context) {
    final review = widget.review;
    const body = TextStyle(
      color: Color(0xFFE2E8F0),
      fontSize: 13,
      height: 1.5,
    );
    const muted = TextStyle(
      color: Color(0xFF94A3B8),
      fontSize: 12.5,
      height: 1.45,
    );

    return Container(
      width: double.infinity,
      constraints: const BoxConstraints(maxHeight: 420),
      decoration: BoxDecoration(
        color: const Color(0xFF071628),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF1E3A5F)),
      ),
      child: Scrollbar(
        controller: _scroll,
        thumbVisibility: true,
        child: SingleChildScrollView(
          controller: _scroll,
          padding: const EdgeInsets.fromLTRB(12, 12, 14, 14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '${review.greeting} ${review.intro}',
                style: body.copyWith(fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 8),
              Text(
                review.summaryHeadline,
                style: body.copyWith(fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 6),
              Text(review.languageNote, style: muted),
              const _MdRule(),
              _MdH3(review.evidenceTitle),
              if (review.evidenceLead.isNotEmpty) ...[
                const SizedBox(height: 8),
                Text(review.evidenceLead, style: body),
              ],
              const SizedBox(height: 8),
              for (final m in review.metrics) ...[
                Text.rich(
                  TextSpan(
                    children: [
                      const TextSpan(
                        text: '* ',
                        style: TextStyle(color: Color(0xFFE2E8F0), fontSize: 13),
                      ),
                      TextSpan(
                        text: m.heading,
                        style: body.copyWith(fontWeight: FontWeight.w800),
                      ),
                      TextSpan(
                        text: ' (${m.rangeLabel}):',
                        style: muted,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 4),
                Padding(
                  padding: const EdgeInsets.only(left: 14, bottom: 12),
                  child: Text(m.body, style: body),
                ),
              ],
              const _MdRule(),
              _MdH3(review.recsTitle),
              const SizedBox(height: 8),
              Text(review.recsIntro, style: body),
              if (review.featuredDoctor != null) ...[
                const SizedBox(height: 10),
                Text.rich(
                  TextSpan(
                    style: body,
                    children: [
                      TextSpan(text: review.recsBeforeDoctor),
                      WidgetSpan(
                        alignment: PlaceholderAlignment.baseline,
                        baseline: TextBaseline.alphabetic,
                        child: GestureDetector(
                          onTap: () =>
                              _book(context, review.featuredDoctor!),
                          child: Text(
                            review.featuredDoctor!.name,
                            style: const TextStyle(
                              color: Color(0xFF93C5FD),
                              fontWeight: FontWeight.w800,
                              fontSize: 13,
                              decoration: TextDecoration.underline,
                              decorationColor: Color(0xFF93C5FD),
                              height: 1.5,
                            ),
                          ),
                        ),
                      ),
                      TextSpan(text: review.recsAfterDoctor),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 10),
              for (final s in review.specialties) ...[
                Text.rich(
                  TextSpan(
                    children: [
                      const TextSpan(
                        text: '* ',
                        style: TextStyle(color: Color(0xFFE2E8F0), fontSize: 13),
                      ),
                      TextSpan(
                        text: s.heading,
                        style: body.copyWith(fontWeight: FontWeight.w800),
                      ),
                    ],
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.only(left: 14, top: 4, bottom: 10),
                  child: Text(s.body, style: body),
                ),
              ],
              Text(
                LabAssistantReplies.bookHint(review.lang),
                style: muted.copyWith(fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 8),
              for (final d in review.doctors)
                _DoctorBookRow(
                  doctor: d,
                  specialty: LabAssistantReplies.specialtyLabel(
                    d.specialty,
                    review.lang,
                  ),
                  onName: () => _book(context, d),
                  onBook: () => _book(context, d),
                  bookLabel: LabAssistantReplies.bookLabel(review.lang),
                ),
              const _MdRule(),
              _MdH3(review.adviceTitle),
              const SizedBox(height: 8),
              Text.rich(
                TextSpan(
                  children: [
                    const TextSpan(
                      text: '• ',
                      style: TextStyle(color: Color(0xFFE2E8F0), fontSize: 13),
                    ),
                    TextSpan(
                      text: '${_habitLabel(review.lang)}: ',
                      style: body.copyWith(fontWeight: FontWeight.w800),
                    ),
                    TextSpan(text: review.habits, style: body),
                  ],
                ),
              ),
              const SizedBox(height: 10),
              Text.rich(
                TextSpan(
                  children: [
                    const TextSpan(
                      text: '• ',
                      style: TextStyle(color: Color(0xFFE2E8F0), fontSize: 13),
                    ),
                    TextSpan(
                      text: '${_disclaimerLabel(review.lang)}: ',
                      style: body.copyWith(fontWeight: FontWeight.w800),
                    ),
                    TextSpan(text: review.disclaimer, style: body),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  static String _habitLabel(String lang) {
    switch (lang) {
      case 'si':
        return 'යහපත් සෞඛ්‍ය පුරුදු';
      case 'ta':
        return 'நல்ல சுகாதார பழக்கங்கள்';
      default:
        return 'Good health habits';
    }
  }

  static String _disclaimerLabel(String lang) {
    switch (lang) {
      case 'si':
        return 'වගකීම් ප්‍රකාශය';
      case 'ta':
        return 'பொறுப்புத் துறப்பு';
      default:
        return 'Disclaimer';
    }
  }
}

class _MdH3 extends StatelessWidget {
  const _MdH3(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: const TextStyle(
        color: Colors.white,
        fontWeight: FontWeight.w800,
        fontSize: 13.5,
        height: 1.35,
      ),
    );
  }
}

class _MdRule extends StatelessWidget {
  const _MdRule();

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.symmetric(vertical: 12),
      child: Divider(color: Color(0xFF334155), height: 1),
    );
  }
}

class _DoctorBookRow extends StatelessWidget {
  const _DoctorBookRow({
    required this.doctor,
    required this.specialty,
    required this.onName,
    required this.onBook,
    required this.bookLabel,
  });

  final Doctor doctor;
  final String specialty;
  final VoidCallback onName;
  final VoidCallback onBook;
  final String bookLabel;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.fromLTRB(10, 10, 10, 8),
      decoration: BoxDecoration(
        color: const Color(0xFF0F2A4A),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFF1E4976)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          GestureDetector(
            onTap: onName,
            child: Text(
              doctor.name,
              style: const TextStyle(
                color: Color(0xFF93C5FD),
                fontWeight: FontWeight.w800,
                fontSize: 14,
                decoration: TextDecoration.underline,
                decorationColor: Color(0xFF93C5FD),
              ),
            ),
          ),
          const SizedBox(height: 2),
          Text(
            '${specialty} · ${doctor.hospital}',
            style: const TextStyle(
              color: Color(0xFFCBD5E1),
              fontSize: 12,
              height: 1.35,
            ),
          ),
          Align(
            alignment: Alignment.centerRight,
            child: TextButton(
              onPressed: onBook,
              child: Text(
                bookLabel,
                style: const TextStyle(
                  color: AppColors.trustBlueLight,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
