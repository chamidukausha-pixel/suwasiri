import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';

import '../../bloc/auth/auth_cubit.dart';
import '../../core/constants/app_constants.dart';
import '../../core/theme/app_colors.dart';
import '../../data/catalogs/gp_care_clinic_map.dart';
import '../../data/models/appointment.dart';
import '../../data/models/clinic_patient_registration.dart';
import '../../data/models/patient_health_intake.dart';
import '../../data/repositories/health_repository.dart';
import '../../localization/clinic_registration_l10n.dart';
import 'doctor_booking_shared.dart';

/// New-patient questionnaire before booking — syncs to GP Care patient profile.
class ClinicPatientRegistrationScreen extends StatefulWidget {
  const ClinicPatientRegistrationScreen({
    super.key,
    required this.doctor,
  });

  final Doctor doctor;

  @override
  State<ClinicPatientRegistrationScreen> createState() =>
      _ClinicPatientRegistrationScreenState();
}

class _ClinicPatientRegistrationScreenState
    extends State<ClinicPatientRegistrationScreen> {
  final _fullName = TextEditingController();
  final _initials = TextEditingController();
  final _nic = TextEditingController();
  final _mobile = TextEditingController();
  final _altPhone = TextEditingController();
  final _email = TextEditingController();
  final _street = TextEditingController();
  final _city = TextEditingController();
  final _emergencyName = TextEditingController();
  final _emergencyMobile = TextEditingController();
  final _policyId = TextEditingController();
  final _visitReason = TextEditingController();
  final _allergyDetails = TextEditingController();
  final _chronicOther = TextEditingController();
  final _medications = TextEditingController();
  final _surgeryDetails = TextEditingController();

  DateTime? _dob;
  String? _title;
  String? _gender;
  String? _civilStatus;
  String? _prefLang;
  String? _district;
  String? _emergencyRelation;
  String? _paymentMethod;
  bool _hasAllergies = false;
  bool _hadSurgery = false;
  bool _consentSms = false;
  bool _consentPrivacy = false;
  bool _consentConfirm = false;
  final _conditions = <String>{};
  final _insurers = <String>{};
  bool _saving = false;

  String _t(String key) => ClinicRegistrationL10n.t(context, key);

  @override
  void initState() {
    super.initState();
    final user = context.read<AuthCubit>().state.user;
    final h = user?.healthIntake;
    _fullName.text = h?.fullName.isNotEmpty == true
        ? h!.fullName
        : (user?.displayName ?? '');
    _initials.text = '';
    _nic.text = user?.nic ?? '';
    _mobile.text = user?.mobileNo ?? h?.contactDetails ?? '';
    _email.text = user?.email ?? '';
    _street.text = h?.address ?? '';
    _district = AppConstants.mohDistricts.contains(user?.region)
        ? user?.region
        : null;
    _dob = user?.dateOfBirth ?? h?.dateOfBirth;
    _gender = const {'male', 'female', 'other'}.contains(h?.sex) ? h!.sex : null;
    _medications.text = h?.currentMedications ?? '';
    _allergyDetails.text = h?.importantAllergies ?? '';
    _hasAllergies = _allergyDetails.text.trim().isNotEmpty;
    _visitReason.text = h?.currentSymptoms ?? '';
    _emergencyName.text = '';
    _emergencyMobile.text = '';
  }

  @override
  void dispose() {
    for (final c in [
      _fullName,
      _initials,
      _nic,
      _mobile,
      _altPhone,
      _email,
      _street,
      _city,
      _emergencyName,
      _emergencyMobile,
      _policyId,
      _visitReason,
      _allergyDetails,
      _chronicOther,
      _medications,
      _surgeryDetails,
    ]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _pickDob() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _dob ?? DateTime(now.year - 30),
      firstDate: DateTime(1920),
      lastDate: now,
    );
    if (picked != null) setState(() => _dob = picked);
  }

  ClinicPatientRegistration _buildRegistration() {
    final gp = GpCareClinicMap.resolve(widget.doctor.hospital);
    return ClinicPatientRegistration(
      title: _title ?? '',
      fullName: _fullName.text.trim(),
      nameWithInitials: _initials.text.trim(),
      dateOfBirth: _dob,
      nicOrPassport: _nic.text.trim(),
      gender: _gender ?? '',
      civilStatus: _civilStatus ?? '',
      preferredLanguage: _prefLang ?? '',
      mobile: _mobile.text.trim(),
      altPhone: _altPhone.text.trim(),
      email: _email.text.trim(),
      streetAddress: _street.text.trim(),
      city: _city.text.trim(),
      district: _district ?? '',
      emergencyName: _emergencyName.text.trim(),
      emergencyRelationship: _emergencyRelation ?? '',
      emergencyMobile: _emergencyMobile.text.trim(),
      paymentMethod: _paymentMethod ?? '',
      insuranceProviders: _insurers.toList(),
      policyId: _policyId.text.trim(),
      visitReason: _visitReason.text.trim(),
      hasAllergies: _hasAllergies,
      allergyDetails: _allergyDetails.text.trim(),
      chronicConditions: _conditions.toList(),
      chronicOther: _chronicOther.text.trim(),
      currentMedications: _medications.text.trim(),
      hadSurgery: _hadSurgery,
      surgeryDetails: _surgeryDetails.text.trim(),
      consentSms: _consentSms,
      consentPrivacy: _consentPrivacy,
      consentConfirmed: _consentConfirm,
      hospitalId: widget.doctor.hospitalId.isNotEmpty
          ? widget.doctor.hospitalId
          : gp.hospitalId,
      hospitalName: widget.doctor.hospital,
      branchId: widget.doctor.branchId.isNotEmpty
          ? widget.doctor.branchId
          : gp.branchId,
      registeredAt: DateTime.now(),
    );
  }

  PatientHealthIntake _toHealthIntake(ClinicPatientRegistration r) {
    final allergy = r.hasAllergies ? r.allergyDetails : 'None recorded';
    final conditions = [
      ...r.chronicConditions,
      if (r.chronicOther.trim().isNotEmpty) r.chronicOther.trim(),
    ].join('; ');
    return PatientHealthIntake(
      fullName: r.fullName,
      dateOfBirth: r.dateOfBirth,
      sex: r.gender,
      address: r.fullAddress,
      contactDetails: r.mobile,
      medicareDetails: r.nicOrPassport,
      emergencyContact: r.emergencyContactLabel,
      existingConditions: conditions,
      previousSurgeries:
          r.hadSurgery ? r.surgeryDetails : 'No major surgery recorded',
      currentMedications: r.currentMedications,
      medicationAllergies: r.hasAllergies ? r.allergyDetails : '',
      otherAllergies: r.hasAllergies ? r.allergyDetails : '',
      importantAllergies: allergy,
      safetyMedications: r.currentMedications,
      currentSymptoms: r.visitReason,
      completed: true,
    );
  }

  Future<void> _submit() async {
    final reg = _buildRegistration();
    if (!reg.isComplete) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(_t('requiredHint'))),
      );
      return;
    }

    final auth = context.read<AuthCubit>();
    final user = auth.state.user;
    if (user == null) return;

    setState(() => _saving = true);
    try {
      final intake = _toHealthIntake(reg);
      final regKey = reg.hospitalId.isNotEmpty
          ? reg.hospitalId
          : reg.hospitalName.toLowerCase().replaceAll(RegExp(r'[^a-z0-9]+'), '-');
      final existingRegs = Map<String, dynamic>.from(
        user.clinicRegistrations ?? const {},
      );
      existingRegs[regKey] = reg.toMap();
      final updated = user
          .copyWith(
            name: reg.fullName,
            nic: reg.nicOrPassport,
            mobileNo: reg.mobile,
            region: reg.district,
            dateOfBirth: reg.dateOfBirth,
            emergencyContacts: [
              if (reg.emergencyContactLabel.isNotEmpty)
                reg.emergencyContactLabel,
            ],
            healthIntake: intake,
            clinicAllergies: reg.hasAllergies ? reg.allergyDetails : 'NKDA',
            clinicRegistrations: existingRegs,
          )
          .withEnsuredBarcode();

      final health = context.read<HealthRepository>();
      await auth.updateProfile(updated);
      try {
        await health.registerPatientAtClinic(
          patientId: user.id,
          registration: reg,
        );
      } catch (_) {
        // Profile is saved; clinic registration doc may retry on next booking.
      }
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(_t('saved'))),
      );
      Navigator.of(context).pop(true);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString())),
      );
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        foregroundColor: AppColors.trustBlueDark,
        title: Text(
          _t('title'),
          style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 17),
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
              children: [
                Row(
                  children: [
                    DoctorAvatar(doctor: widget.doctor, radius: 24),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        widget.doctor.hospital,
                        style: const TextStyle(
                          color: AppColors.slateMuted,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  _t('subtitle'),
                  style: const TextStyle(
                    color: AppColors.trustBlue,
                    fontSize: 13,
                    height: 1.4,
                  ),
                ),
                const SizedBox(height: 20),
                _section(_t('sec1')),
                _dropdown(
                  label: _t('patientTitle'),
                  value: _title,
                  items: const [
                    'Rev',
                    'Mr',
                    'Mrs',
                    'Miss',
                    'Dr',
                    'Prof',
                    'Other',
                  ],
                  onChanged: (v) => setState(() => _title = v),
                ),
                _field(_fullName, _t('fullName'), required: true),
                _field(_initials, _t('nameInitials')),
                _dateField(),
                _field(_nic, _t('nic'), required: true),
                _choiceRow(
                  _t('gender'),
                  [
                    ('male', _t('male')),
                    ('female', _t('female')),
                    ('other', _t('other')),
                  ],
                  _gender,
                  (v) => setState(() => _gender = v),
                ),
                _choiceRow(
                  _t('civilStatus'),
                  [
                    ('single', _t('single')),
                    ('married', _t('married')),
                    ('other', _t('other')),
                  ],
                  _civilStatus,
                  (v) => setState(() => _civilStatus = v),
                ),
                _choiceRow(
                  _t('prefLang'),
                  [
                    ('sinhala', _t('sinhala')),
                    ('tamil', _t('tamil')),
                    ('english', _t('english')),
                  ],
                  _prefLang,
                  (v) => setState(() => _prefLang = v),
                ),
                _section(_t('sec2')),
                _field(_mobile, _t('mobile'),
                    keyboard: TextInputType.phone, required: true),
                _field(_altPhone, _t('altPhone'), keyboard: TextInputType.phone),
                _field(_email, _t('email'), keyboard: TextInputType.emailAddress),
                _field(_street, _t('street'), required: true),
                _field(_city, _t('city'), required: true),
                _dropdown(
                  label: _t('district'),
                  value: _district,
                  items: AppConstants.mohDistricts,
                  onChanged: (v) => setState(() => _district = v),
                ),
                _section(_t('sec3')),
                _field(_emergencyName, _t('emergencyName'), required: true),
                _choiceRow(
                  _t('emergencyRelation'),
                  [
                    ('spouse', _t('relSpouse')),
                    ('parent', _t('relParent')),
                    ('child', _t('relChild')),
                    ('relative', _t('relRelative')),
                    ('other', _t('other')),
                  ],
                  _emergencyRelation,
                  (v) => setState(() => _emergencyRelation = v),
                ),
                _field(_emergencyMobile, _t('emergencyMobile'),
                    keyboard: TextInputType.phone, required: true),
                _section(_t('sec4')),
                _choiceRow(
                  _t('paymentMethod'),
                  [
                    ('cash', _t('cash')),
                    ('card', _t('card')),
                    ('insurance', _t('insuranceClaim')),
                  ],
                  _paymentMethod,
                  (v) => setState(() => _paymentMethod = v),
                ),
                Text(_t('insurance'),
                    style: const TextStyle(fontWeight: FontWeight.w700)),
                _checkTile(_t('insSlic'), 'slic'),
                _checkTile(_t('insCeylinco'), 'ceylinco'),
                _checkTile(_t('insSoftlogic'), 'softlogic'),
                _checkTile(_t('insAllianz'), 'allianz'),
                _checkTile(_t('insForeign'), 'foreign'),
                _field(_policyId, _t('policyId')),
                _section(_t('sec5')),
                _field(_visitReason, _t('visitReason'),
                    maxLines: 3, required: true),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  title: Text(_t('allergiesQ')),
                  value: _hasAllergies,
                  onChanged: (v) => setState(() => _hasAllergies = v),
                ),
                if (_hasAllergies)
                  _field(_allergyDetails, _t('allergyDetails'), maxLines: 2),
                Text(_t('chronic'),
                    style: const TextStyle(fontWeight: FontWeight.w700)),
                _checkTile(_t('condDiabetes'), 'diabetes'),
                _checkTile(_t('condHypertension'), 'hypertension'),
                _checkTile(_t('condAsthma'), 'asthma'),
                _checkTile(_t('condIhd'), 'ihd'),
                _checkTile(_t('condKidney'), 'kidney'),
                _checkTile(_t('condThyroid'), 'thyroid'),
                _checkTile(_t('condCholesterol'), 'cholesterol'),
                _field(_chronicOther, _t('condOther')),
                _field(_medications, _t('medications'), maxLines: 3),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  title: Text(_t('surgeryQ')),
                  value: _hadSurgery,
                  onChanged: (v) => setState(() => _hadSurgery = v),
                ),
                if (_hadSurgery)
                  _field(_surgeryDetails, _t('surgeryDetails'), maxLines: 2),
                _section(_t('sec6')),
                CheckboxListTile(
                  contentPadding: EdgeInsets.zero,
                  value: _consentSms,
                  onChanged: (v) => setState(() => _consentSms = v ?? false),
                  title: Text(_t('consentSms'), style: const TextStyle(fontSize: 13)),
                  controlAffinity: ListTileControlAffinity.leading,
                ),
                CheckboxListTile(
                  contentPadding: EdgeInsets.zero,
                  value: _consentPrivacy,
                  onChanged: (v) => setState(() => _consentPrivacy = v ?? false),
                  title: Text(_t('consentPrivacy'), style: const TextStyle(fontSize: 13)),
                  controlAffinity: ListTileControlAffinity.leading,
                ),
                CheckboxListTile(
                  contentPadding: EdgeInsets.zero,
                  value: _consentConfirm,
                  onChanged: (v) => setState(() => _consentConfirm = v ?? false),
                  title: Text(_t('consentConfirm'), style: const TextStyle(fontSize: 13)),
                  controlAffinity: ListTileControlAffinity.leading,
                ),
              ],
            ),
          ),
          SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
              child: SizedBox(
                width: double.infinity,
                height: 52,
                child: FilledButton(
                  onPressed: _saving ? null : _submit,
                  style: FilledButton.styleFrom(
                    backgroundColor: bookingGreen,
                    foregroundColor: Colors.white,
                  ),
                  child: _saving
                      ? const SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : Text(
                          _t('submit'),
                          style: const TextStyle(fontWeight: FontWeight.w800),
                        ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _section(String title) {
    return Padding(
      padding: const EdgeInsets.only(top: 20, bottom: 10),
      child: Text(
        title,
        style: const TextStyle(
          color: AppColors.trustBlueDark,
          fontWeight: FontWeight.w800,
          fontSize: 16,
        ),
      ),
    );
  }

  Widget _field(
    TextEditingController ctrl,
    String label, {
    bool required = false,
    int maxLines = 1,
    TextInputType? keyboard,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: TextField(
        controller: ctrl,
        maxLines: maxLines,
        keyboardType: keyboard,
        decoration: InputDecoration(
          labelText: required ? '$label *' : label,
          filled: true,
          fillColor: AppColors.surface,
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
        ),
      ),
    );
  }

  Widget _dateField() {
    final label = _dob == null
        ? '${_t('dob')} *'
        : '${_t('dob')}: ${DateFormat('dd/MM/yyyy').format(_dob!)}';
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: OutlinedButton.icon(
        onPressed: _pickDob,
        icon: const Icon(Icons.calendar_today_outlined, size: 18),
        label: Align(alignment: Alignment.centerLeft, child: Text(label)),
        style: OutlinedButton.styleFrom(
          minimumSize: const Size(double.infinity, 48),
          alignment: Alignment.centerLeft,
        ),
      ),
    );
  }

  Widget _dropdown({
    required String label,
    required String? value,
    required List<String> items,
    required ValueChanged<String?> onChanged,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: DropdownButtonFormField<String>(
        key: ValueKey('$label-$value'),
        initialValue: value,
        isExpanded: true,
        decoration: InputDecoration(
          labelText: label,
          filled: true,
          fillColor: AppColors.surface,
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
        ),
        items: items
            .map((e) => DropdownMenuItem<String>(value: e, child: Text(e)))
            .toList(),
        onChanged: onChanged,
      ),
    );
  }

  Widget _choiceRow(
    String label,
    List<(String, String)> options,
    String? selected,
    ValueChanged<String> onChanged,
  ) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label,
              style: const TextStyle(
                fontWeight: FontWeight.w700,
                color: AppColors.trustBlueDark,
              )),
          const SizedBox(height: 6),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: options.map((opt) {
              final sel = selected == opt.$1;
              return FilterChip(
                label: Text(opt.$2),
                selected: sel,
                onSelected: (_) => onChanged(opt.$1),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _checkTile(String label, String key) {
    final selected = _conditions.contains(key) || _insurers.contains(key);
    return CheckboxListTile(
      dense: true,
      contentPadding: EdgeInsets.zero,
      value: selected,
      onChanged: (v) {
        setState(() {
          if (['slic', 'ceylinco', 'softlogic', 'allianz', 'foreign']
              .contains(key)) {
            if (v == true) {
              _insurers.add(key);
            } else {
              _insurers.remove(key);
            }
          } else {
            if (v == true) {
              _conditions.add(key);
            } else {
              _conditions.remove(key);
            }
          }
        });
      },
      title: Text(label, style: const TextStyle(fontSize: 13)),
      controlAffinity: ListTileControlAffinity.leading,
    );
  }
}
