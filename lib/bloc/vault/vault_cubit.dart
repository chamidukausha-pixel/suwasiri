import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../data/catalogs/patient_health_samples.dart';
import '../../data/models/vault_report.dart';
import '../../data/repositories/health_repository.dart';

enum HealthHistoryTab { medicines, labs, vaccines, notes }

enum VaultFilter { labs, medicines, history }

class VaultState extends Equatable {
  const VaultState({
    this.reports = const [],
    this.prescriptions = const [],
    this.treatmentNotes = const [],
    this.vaccineHistory = const [],
    this.unlocked = false,
    this.loading = false,
    this.syncingLankaLab = false,
    this.syncingGpCare = false,
    this.lankaLabSynced = false,
    this.gpCareSynced = false,
    this.aiReply,
    this.selectedReport,
    this.filter = VaultFilter.history,
    this.healthTab = HealthHistoryTab.medicines,
  });

  final List<VaultReport> reports;
  final List<Prescription> prescriptions;
  final List<TreatmentNote> treatmentNotes;
  final List<VaccineHistoryEntry> vaccineHistory;
  final bool unlocked;
  final bool loading;
  final bool syncingLankaLab;
  final bool syncingGpCare;
  final bool lankaLabSynced;
  final bool gpCareSynced;
  final String? aiReply;
  final VaultReport? selectedReport;
  final VaultFilter filter;
  final HealthHistoryTab healthTab;

  List<Prescription> get pendingMedicines =>
      prescriptions.where((p) => !p.sentToPharmacare).toList();

  List<Prescription> get historyMedicines =>
      prescriptions.where((p) => p.sentToPharmacare).toList();

  List<VaultReport> get labReports =>
      reports.where((r) => r.kind != VaultRecordKind.vaccine).toList();

  VaultState copyWith({
    List<VaultReport>? reports,
    List<Prescription>? prescriptions,
    List<TreatmentNote>? treatmentNotes,
    List<VaccineHistoryEntry>? vaccineHistory,
    bool? unlocked,
    bool? loading,
    bool? syncingLankaLab,
    bool? syncingGpCare,
    bool? lankaLabSynced,
    bool? gpCareSynced,
    String? aiReply,
    VaultReport? selectedReport,
    VaultFilter? filter,
    HealthHistoryTab? healthTab,
    bool clearAi = false,
    bool clearSelected = false,
  }) {
    return VaultState(
      reports: reports ?? this.reports,
      prescriptions: prescriptions ?? this.prescriptions,
      treatmentNotes: treatmentNotes ?? this.treatmentNotes,
      vaccineHistory: vaccineHistory ?? this.vaccineHistory,
      unlocked: unlocked ?? this.unlocked,
      loading: loading ?? this.loading,
      syncingLankaLab: syncingLankaLab ?? this.syncingLankaLab,
      syncingGpCare: syncingGpCare ?? this.syncingGpCare,
      lankaLabSynced: lankaLabSynced ?? this.lankaLabSynced,
      gpCareSynced: gpCareSynced ?? this.gpCareSynced,
      aiReply: clearAi ? null : (aiReply ?? this.aiReply),
      selectedReport:
          clearSelected ? null : (selectedReport ?? this.selectedReport),
      filter: filter ?? this.filter,
      healthTab: healthTab ?? this.healthTab,
    );
  }

  @override
  List<Object?> get props => [
        reports,
        prescriptions,
        treatmentNotes,
        vaccineHistory,
        unlocked,
        loading,
        syncingLankaLab,
        syncingGpCare,
        lankaLabSynced,
        gpCareSynced,
        aiReply,
        selectedReport,
        filter,
        healthTab,
      ];
}

class VaultCubit extends Cubit<VaultState> {
  VaultCubit(this._health) : super(const VaultState());

  final HealthRepository _health;

  Future<void> unlock(Future<bool> Function() biometric) async {
    final ok = await biometric();
    if (ok) {
      emit(state.copyWith(unlocked: true));
    }
  }

  Future<void> load(String patientId) async {
    emit(state.copyWith(loading: true));

    List<VaultReport> reports = const [];
    List<Prescription> rx = const [];
    try {
      reports = await _health.getVaultReports(patientId);
      rx = await _health.getPrescriptions(patientId);
    } catch (_) {
      // Still show curated Vault samples if network/Firestore fails.
    }

    final sampleRx =
        PatientHealthSamples.allSamplePrescriptions(patientId: patientId);
    final sampleLabs =
        PatientHealthSamples.sampleLabReports(patientId: patientId);

    final rxById = {for (final p in rx) p.id: p};
    final mergedRx = <Prescription>[
      ...rx,
      for (final s in sampleRx)
        if (!rxById.containsKey(s.id)) s,
    ]..sort((a, b) =>
        (b.issuedAt ?? DateTime(0)).compareTo(a.issuedAt ?? DateTime(0)));

    final reportIds = {for (final r in reports) r.id};
    final mergedReports = <VaultReport>[
      ...reports,
      for (final s in sampleLabs)
        if (!reportIds.contains(s.id)) s,
    ]..sort((a, b) => b.date.compareTo(a.date));

    emit(state.copyWith(
      reports: mergedReports,
      prescriptions: mergedRx,
      treatmentNotes:
          List<TreatmentNote>.from(
            PatientHealthSamples.treatmentNotes(patientId: patientId),
          ),
      vaccineHistory: List<VaccineHistoryEntry>.from(
        PatientHealthSamples.vaccineHistory(patientId: patientId),
      ),
      loading: false,
    ));
  }

  Future<void> syncAll(String patientId) async {
    await syncLankaLab(patientId);
    await syncGpCare(patientId);
  }

  Future<void> syncLankaLab(String patientId) async {
    emit(state.copyWith(syncingLankaLab: true));
    try {
      await _health.syncLankaLab(patientId);
    } catch (_) {}
    await load(patientId);
    emit(state.copyWith(syncingLankaLab: false, lankaLabSynced: true));
  }

  Future<void> syncGpCare(String patientId) async {
    emit(state.copyWith(syncingGpCare: true));
    try {
      await _health.syncGpCare(patientId);
    } catch (_) {}
    await load(patientId);
    emit(state.copyWith(syncingGpCare: false, gpCareSynced: true));
  }

  Future<void> sendMedicinesToMediLanka({
    required String patientId,
    required List<Prescription> medicines,
  }) async {
    try {
      await _health.markPrescriptionsSentToPharmacy(
        patientId: patientId,
        medicines: medicines,
      );
    } catch (_) {}
    await load(patientId);
  }

  void setFilter(VaultFilter filter) {
    emit(state.copyWith(filter: filter));
  }

  void setHealthTab(HealthHistoryTab tab) {
    emit(state.copyWith(healthTab: tab));
  }

  void selectReport(VaultReport report) {
    emit(state.copyWith(selectedReport: report, clearAi: true));
  }

  Future<void> askAi(String question) async {
    VaultReport? report = state.selectedReport;
    if (report == null) {
      for (final r in state.labReports) {
        if (r.readyForAi) {
          report = r;
          break;
        }
      }
      report ??= state.labReports.isEmpty ? null : state.labReports.first;
    }
    if (report == null) return;
    emit(state.copyWith(loading: true, selectedReport: report));
    final reply = await _health.askReportAssistant(
      report: report,
      question: question.isEmpty
          ? 'Explain this lab report in simple language for a Sri Lankan patient'
          : question,
    );
    emit(state.copyWith(aiReply: reply, loading: false));
  }
}
