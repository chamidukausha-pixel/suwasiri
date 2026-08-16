import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';

import '../../bloc/auth/auth_cubit.dart';
import '../../bloc/vault/vault_cubit.dart';
import '../../core/theme/app_colors.dart';
import '../../data/models/vault_report.dart';
import '../../data/services/prescription_export_service.dart';
import '../../localization/app_localizations.dart';
import '../widgets/sheet_close_bar.dart';

Future<void> showLabReportDetailSheet({
  required BuildContext context,
  required VaultReport report,
}) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: AppColors.canvas,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
    ),
    builder: (ctx) => _LabReportDetailBody(report: report),
  );
}

class _LabReportDetailBody extends StatefulWidget {
  const _LabReportDetailBody({required this.report});

  final VaultReport report;

  @override
  State<_LabReportDetailBody> createState() => _LabReportDetailBodyState();
}

class _LabReportDetailBodyState extends State<_LabReportDetailBody> {
  final _question = TextEditingController();
  String _language = 'English';

  static const _langs = ['English', 'Sinhala', 'Tamil'];

  @override
  void initState() {
    super.initState();
    context.read<VaultCubit>().selectReport(widget.report);
  }

  @override
  void dispose() {
    _question.dispose();
    super.dispose();
  }

  String get _firstName {
    final name = context.read<AuthCubit>().state.user?.name.trim() ?? '';
    if (name.isEmpty) return 'there';
    return name.split(RegExp(r'\s+')).first;
  }

  Future<void> _download() async {
    final l = AppLocalizations.of(context);
    final user = context.read<AuthCubit>().state.user;
    try {
      await PrescriptionExportService.downloadLabReportPdf(
        report: widget.report,
        patient: user,
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(l.t('labPdfReady'))),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('${l.t('rxPdfFailed')}: $e')),
      );
    }
  }

  Future<void> _askAi(String prompt) async {
    await context.read<VaultCubit>().askAi(
          prompt,
          language: _language,
        );
  }

  bool get _allNormal =>
      widget.report.metrics.isNotEmpty &&
      widget.report.metrics.every((m) => m.status == 'normal');

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final report = widget.report;
    final maxH = MediaQuery.sizeOf(context).height * 0.94;

    return SizedBox(
      height: maxH,
      child: Padding(
        padding: EdgeInsets.fromLTRB(
          16,
          8,
          16,
          12 + MediaQuery.paddingOf(context).bottom,
        ),
        child: BlocBuilder<VaultCubit, VaultState>(
          builder: (context, state) {
            return Column(
              children: [
                Expanded(
                  child: SingleChildScrollView(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _ReportHeader(report: report, allNormal: _allNormal),
                        const SizedBox(height: 16),
                        _MarkersSection(report: report),
                        const SizedBox(height: 14),
                        _ClinicalCommentsCard(
                          comments: report.clinicalComments.isEmpty
                              ? l.t('labCommentsFallback')
                              : report.clinicalComments,
                        ),
                        const SizedBox(height: 14),
                        _CopilotCard(
                          report: report,
                          firstName: _firstName,
                          language: _language,
                          languages: _langs,
                          question: _question,
                          loading: state.loading,
                          aiReply: state.aiReply,
                          onLanguage: (lang) =>
                              setState(() => _language = lang),
                          onSummarize: () => _askAi(
                            'Summarize this lab report. Explain my ranges.',
                          ),
                          onRecommend: () => _askAi(
                            'Recommend the best doctor specialty for this report.',
                          ),
                          onSend: () => _askAi(_question.text.trim()),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: SizedBox(
                        height: 48,
                        child: FilledButton.icon(
                          style: FilledButton.styleFrom(
                            backgroundColor: const Color(0xFFE8EEF5),
                            foregroundColor: AppColors.trustBlueDark,
                            elevation: 0,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14),
                            ),
                          ),
                          onPressed: _download,
                          icon: const Icon(Icons.picture_as_pdf_outlined),
                          label: Text(
                            l.t('downloadPdfDocument'),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontWeight: FontWeight.w700),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    SizedBox(
                      height: 48,
                      child: FilledButton(
                        style: FilledButton.styleFrom(
                          backgroundColor: AppColors.trustBlueDark,
                          foregroundColor: Colors.white,
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                        onPressed: () => Navigator.of(context).pop(),
                        child: Text(
                          l.t('close'),
                          style: const TextStyle(fontWeight: FontWeight.w700),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _ReportHeader extends StatelessWidget {
  const _ReportHeader({required this.report, required this.allNormal});

  final VaultReport report;
  final bool allNormal;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final date = DateFormat('MMM d, y').format(report.date);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color: allNormal
                    ? const Color(0xFFD1FAE5)
                    : AppColors.warningSoft,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                allNormal
                    ? l.t('diagnosticNormal')
                    : l.t('diagnosticAttention'),
                style: TextStyle(
                  color: allNormal
                      ? const Color(0xFF065F46)
                      : AppColors.warning,
                  fontWeight: FontWeight.w800,
                  fontSize: 10,
                  letterSpacing: 0.6,
                ),
              ),
            ),
            const Spacer(),
            const SheetCloseActions(),
          ],
        ),
        Text(
          report.title,
          style: const TextStyle(
            color: AppColors.trustBlueDark,
            fontWeight: FontWeight.w800,
            fontSize: 22,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          '${l.t('orderedBy')}: ${report.requestedBy ?? report.issuedBy}  |  ${l.t('reportDate')}: $date',
          style: const TextStyle(
            color: AppColors.slateMuted,
            fontSize: 12,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }
}

class _MarkersSection extends StatelessWidget {
  const _MarkersSection({required this.report});

  final VaultReport report;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(Icons.monitor_heart_outlined,
                color: AppColors.trustBlueLight, size: 18),
            const SizedBox(width: 6),
            Text(
              l.t('biochemicalMarkers'),
              style: const TextStyle(
                color: AppColors.trustBlueLight,
                fontWeight: FontWeight.w800,
                fontSize: 11,
                letterSpacing: 0.8,
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        for (final m in report.metrics)
          _MarkerCard(metric: m),
      ],
    );
  }
}

class _MarkerCard extends StatelessWidget {
  const _MarkerCard({required this.metric});

  final MetricReading metric;

  @override
  Widget build(BuildContext context) {
    final normal = metric.status == 'normal';
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.fromLTRB(12, 12, 12, 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  metric.name,
                  style: const TextStyle(
                    fontWeight: FontWeight.w800,
                    color: AppColors.trustBlueDark,
                    fontSize: 13,
                  ),
                ),
              ),
              if (metric.normalRange.isNotEmpty)
                Text(
                  'Normal: ${metric.normalRange}',
                  style: const TextStyle(
                    color: AppColors.slateMuted,
                    fontSize: 11,
                  ),
                ),
              const SizedBox(width: 8),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: normal
                      ? const Color(0xFFD1FAE5)
                      : AppColors.warningSoft,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  metric.value,
                  style: TextStyle(
                    color: normal
                        ? const Color(0xFF065F46)
                        : AppColors.warning,
                    fontWeight: FontWeight.w800,
                    fontSize: 12,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          _RangeBar(metric: metric),
        ],
      ),
    );
  }
}

class _RangeBar extends StatelessWidget {
  const _RangeBar({required this.metric});

  final MetricReading metric;

  static double _position(MetricReading m) {
    final value = _firstNumber(m.value);
    final range = _range(m.normalRange);
    if (value == null || range == null) {
      return m.status == 'normal' ? 0.5 : 0.18;
    }
    final low = range.$1;
    final high = range.$2;
    if (high <= low) return 0.5;
    if (value < low) {
      return (0.28 * (value / low).clamp(0.0, 1.0)).clamp(0.04, 0.28);
    }
    if (value > high) {
      return (0.72 + 0.24 * ((value - high) / high).clamp(0.0, 1.0))
          .clamp(0.72, 0.96);
    }
    return 0.34 + 0.32 * ((value - low) / (high - low));
  }

  static double? _firstNumber(String s) {
    final m = RegExp(r'(\d+(?:\.\d+)?)').firstMatch(s.replaceAll(',', ''));
    return m == null ? null : double.tryParse(m.group(1)!);
  }

  static (double, double)? _range(String s) {
    final nums = RegExp(r'(\d+(?:\.\d+)?)')
        .allMatches(s.replaceAll(',', ''))
        .map((m) => double.parse(m.group(1)!))
        .toList();
    if (nums.length >= 2) return (nums[0], nums[1]);
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final t = _position(metric);
    return LayoutBuilder(
      builder: (context, c) {
        const dot = 10.0;
        final left = (t * c.maxWidth - dot / 2).clamp(0.0, c.maxWidth - dot);
        return SizedBox(
          height: 12,
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              Positioned(
                left: 0,
                right: 0,
                top: 4,
                child: Row(
                  children: [
                    Expanded(
                      child: Container(
                        height: 5,
                        decoration: const BoxDecoration(
                          color: Color(0xFFE8D5B5),
                          borderRadius: BorderRadius.horizontal(
                            left: Radius.circular(4),
                          ),
                        ),
                      ),
                    ),
                    Expanded(
                      flex: 2,
                      child: Container(
                        height: 5,
                        color: const Color(0xFF86EFAC),
                      ),
                    ),
                    Expanded(
                      child: Container(
                        height: 5,
                        decoration: const BoxDecoration(
                          color: Color(0xFFE8D5B5),
                          borderRadius: BorderRadius.horizontal(
                            right: Radius.circular(4),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              Positioned(
                left: left,
                top: 1,
                child: Container(
                  width: dot,
                  height: dot,
                  decoration: BoxDecoration(
                    color: const Color(0xFF047857),
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 1.5),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _ClinicalCommentsCard extends StatelessWidget {
  const _ClinicalCommentsCard({required this.comments});

  final String comments;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFEFF6FF),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFBFDBFE)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            l.t('laboratoryComments'),
            style: const TextStyle(
              color: AppColors.trustBlueDark,
              fontWeight: FontWeight.w800,
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            comments,
            style: const TextStyle(
              color: AppColors.trustBlue,
              fontSize: 13,
              height: 1.4,
              fontStyle: FontStyle.italic,
            ),
          ),
        ],
      ),
    );
  }
}

class _CopilotCard extends StatelessWidget {
  const _CopilotCard({
    required this.report,
    required this.firstName,
    required this.language,
    required this.languages,
    required this.question,
    required this.loading,
    required this.aiReply,
    required this.onLanguage,
    required this.onSummarize,
    required this.onRecommend,
    required this.onSend,
  });

  final VaultReport report;
  final String firstName;
  final String language;
  final List<String> languages;
  final TextEditingController question;
  final bool loading;
  final String? aiReply;
  final ValueChanged<String> onLanguage;
  final VoidCallback onSummarize;
  final VoidCallback onRecommend;
  final VoidCallback onSend;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final greeting = l
        .t('copilotGreeting')
        .replaceAll('{name}', firstName)
        .replaceAll('{title}', report.title)
        .replaceAll('{category}', report.category ?? report.issuedBy)
        .replaceAll('{count}', '${report.metrics.length}');

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF0B1F3A),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.hexagon_outlined,
                  color: AppColors.trustBlueLight, size: 22),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      l.t('copilotTitle'),
                      style: const TextStyle(
                        color: Color(0xFF86EFAC),
                        fontWeight: FontWeight.w800,
                        fontSize: 12,
                        letterSpacing: 0.6,
                      ),
                    ),
                    Text(
                      l.t('copilotSubtitle'),
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w800,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFF14532D),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  l.t('copilotOnline'),
                  style: const TextStyle(
                    color: Color(0xFF86EFAC),
                    fontWeight: FontWeight.w800,
                    fontSize: 10,
                    letterSpacing: 0.6,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 6,
            children: languages.map((lang) {
              final selected = language == lang;
              return ChoiceChip(
                label: Text(lang),
                selected: selected,
                onSelected: (_) => onLanguage(lang),
                selectedColor: AppColors.trustBlue,
                backgroundColor: const Color(0xFF16324F),
                labelStyle: TextStyle(
                  color: selected ? Colors.white : const Color(0xFFCBD5E1),
                  fontWeight: FontWeight.w700,
                  fontSize: 11,
                ),
                side: BorderSide.none,
                showCheckmark: false,
                visualDensity: VisualDensity.compact,
              );
            }).toList(),
          ),
          const SizedBox(height: 10),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFF071628),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              greeting,
              style: const TextStyle(
                color: Color(0xFFE2E8F0),
                fontSize: 13,
                height: 1.45,
              ),
            ),
          ),
          if (loading) ...[
            const SizedBox(height: 10),
            const LinearProgressIndicator(),
          ],
          if (aiReply != null) ...[
            const SizedBox(height: 10),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFF0F2A4A),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                aiReply!,
                style: const TextStyle(
                  color: Color(0xFFE2E8F0),
                  fontSize: 13,
                  height: 1.45,
                ),
              ),
            ),
          ],
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _QuickChip(
                label: l.t('summarizeReport'),
                onTap: loading ? null : onSummarize,
              ),
              _QuickChip(
                label: l.t('recommendSpecialist'),
                onTap: loading ? null : onRecommend,
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: question,
                  style: const TextStyle(color: Colors.white, fontSize: 13),
                  decoration: InputDecoration(
                    hintText: l.t('askClinicalAssistant'),
                    hintStyle: const TextStyle(
                      color: Color(0xFF94A3B8),
                      fontSize: 13,
                    ),
                    filled: true,
                    fillColor: const Color(0xFF16324F),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 12,
                    ),
                  ),
                  onSubmitted: (_) => onSend(),
                ),
              ),
              const SizedBox(width: 8),
              SizedBox(
                height: 48,
                child: FilledButton(
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.trustBlue,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  onPressed: loading ? null : onSend,
                  child: Text(
                    l.t('send'),
                    style: const TextStyle(fontWeight: FontWeight.w800),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _QuickChip extends StatelessWidget {
  const _QuickChip({required this.label, this.onTap});

  final String label;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return ActionChip(
      onPressed: onTap,
      backgroundColor: const Color(0xFF334155),
      side: BorderSide.none,
      label: Text(
        label,
        style: const TextStyle(
          color: Color(0xFFE2E8F0),
          fontWeight: FontWeight.w700,
          fontSize: 12,
        ),
      ),
    );
  }
}
