import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../data/models/vault_report.dart';
import '../../data/repositories/health_repository.dart';

enum VaultFilter { labs, medicines }

class VaultState extends Equatable {
  const VaultState({
    this.reports = const [],
    this.prescriptions = const [],
    this.unlocked = false,
    this.loading = false,
    this.syncingLankaLab = false,
    this.syncingGpCare = false,
    this.lankaLabSynced = false,
    this.gpCareSynced = false,
    this.aiReply,
    this.selectedReport,
    this.filter = VaultFilter.labs,
  });

  final List<VaultReport> reports;
  final List<Prescription> prescriptions;
  final bool unlocked;
  final bool loading;
  final bool syncingLankaLab;
  final bool syncingGpCare;
  final bool lankaLabSynced;
  final bool gpCareSynced;
  final String? aiReply;
  final VaultReport? selectedReport;
  final VaultFilter filter;

  VaultState copyWith({
    List<VaultReport>? reports,
    List<Prescription>? prescriptions,
    bool? unlocked,
    bool? loading,
    bool? syncingLankaLab,
    bool? syncingGpCare,
    bool? lankaLabSynced,
    bool? gpCareSynced,
    String? aiReply,
    VaultReport? selectedReport,
    VaultFilter? filter,
    bool clearAi = false,
    bool clearSelected = false,
  }) {
    return VaultState(
      reports: reports ?? this.reports,
      prescriptions: prescriptions ?? this.prescriptions,
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
    );
  }

  @override
  List<Object?> get props => [
        reports,
        prescriptions,
        unlocked,
        loading,
        syncingLankaLab,
        syncingGpCare,
        lankaLabSynced,
        gpCareSynced,
        aiReply,
        selectedReport,
        filter,
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
    final reports = await _health.getVaultReports(patientId);
    final rx = await _health.getPrescriptions(patientId);
    emit(state.copyWith(
      reports: reports,
      prescriptions: rx,
      loading: false,
    ));
  }

  Future<void> syncAll(String patientId) async {
    await syncLankaLab(patientId);
    await syncGpCare(patientId);
  }

  Future<void> syncLankaLab(String patientId) async {
    emit(state.copyWith(syncingLankaLab: true));
    await _health.syncLankaLab(patientId);
    final reports = await _health.getVaultReports(patientId);
    emit(state.copyWith(
      reports: reports,
      syncingLankaLab: false,
      lankaLabSynced: true,
    ));
  }

  Future<void> syncGpCare(String patientId) async {
    emit(state.copyWith(syncingGpCare: true));
    await _health.syncGpCare(patientId);
    final rx = await _health.getPrescriptions(patientId);
    emit(state.copyWith(
      prescriptions: rx,
      syncingGpCare: false,
      gpCareSynced: true,
    ));
  }

  void setFilter(VaultFilter filter) {
    emit(state.copyWith(filter: filter));
  }

  void selectReport(VaultReport report) {
    emit(state.copyWith(selectedReport: report, clearAi: true));
  }

  Future<void> askAi(String question) async {
    VaultReport? report = state.selectedReport;
    if (report == null) {
      for (final r in state.reports) {
        if (r.readyForAi) {
          report = r;
          break;
        }
      }
      report ??= state.reports.isEmpty ? null : state.reports.first;
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
