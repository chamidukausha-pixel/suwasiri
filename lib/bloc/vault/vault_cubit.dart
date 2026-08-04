import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../data/models/vault_report.dart';
import '../../data/repositories/health_repository.dart';

class VaultState extends Equatable {
  const VaultState({
    this.reports = const [],
    this.prescriptions = const [],
    this.unlocked = false,
    this.loading = false,
    this.aiReply,
    this.selectedReport,
  });

  final List<VaultReport> reports;
  final List<Prescription> prescriptions;
  final bool unlocked;
  final bool loading;
  final String? aiReply;
  final VaultReport? selectedReport;

  VaultState copyWith({
    List<VaultReport>? reports,
    List<Prescription>? prescriptions,
    bool? unlocked,
    bool? loading,
    String? aiReply,
    VaultReport? selectedReport,
    bool clearAi = false,
  }) {
    return VaultState(
      reports: reports ?? this.reports,
      prescriptions: prescriptions ?? this.prescriptions,
      unlocked: unlocked ?? this.unlocked,
      loading: loading ?? this.loading,
      aiReply: clearAi ? null : (aiReply ?? this.aiReply),
      selectedReport: selectedReport ?? this.selectedReport,
    );
  }

  @override
  List<Object?> get props =>
      [reports, prescriptions, unlocked, loading, aiReply, selectedReport];
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
    emit(state.copyWith(loading: true));
    await _health.syncLankaLab(patientId);
    await _health.syncGpCare(patientId);
    await load(patientId);
  }

  void selectReport(VaultReport report) {
    emit(state.copyWith(selectedReport: report, clearAi: true));
  }

  Future<void> askAi(String question) async {
    final report = state.selectedReport;
    if (report == null) return;
    emit(state.copyWith(loading: true));
    final reply = await _health.askReportAssistant(
      report: report,
      question: question,
    );
    emit(state.copyWith(aiReply: reply, loading: false));
  }
}
