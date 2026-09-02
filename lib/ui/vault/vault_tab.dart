// Analyzer false-positive when this library is the compilation root (circular
// import detection with vault sections). Safe via MainShell → VaultTab → main.
// ignore_for_file: uri_does_not_exist, undefined_method

import 'package:flutter/material.dart';

import 'vault_patient_sections.dart';
import 'vault_screen.dart';

/// Vault tab wired in [MainShell].
class VaultTab extends StatelessWidget {
  const VaultTab({super.key});

  @override
  Widget build(BuildContext context) {
    return VaultScreen(
      eprescriptionBuilder: (state) =>
          VaultEPrescriptionSection(state: state),
      historyBuilder: (state) => IssuedMedicalHistorySection(state: state),
    );
  }
}
