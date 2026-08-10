import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';

import '../../bloc/auth/auth_cubit.dart';
import '../../core/constants/app_constants.dart';
import '../../core/theme/app_colors.dart';
import '../../data/models/patient_health_intake.dart';
import '../../localization/health_intake_l10n.dart';

/// First-login mandatory questionnaire + Profile edit.
class HealthIntakeScreen extends StatefulWidget {
  const HealthIntakeScreen({super.key, this.editing = false});

  /// When true, opened from Profile to edit (pop on save).
  final bool editing;

  @override
  State<HealthIntakeScreen> createState() => _HealthIntakeScreenState();
}

class _HealthIntakeScreenState extends State<HealthIntakeScreen> {
  final _page = PageController();
  int _step = 0;

  late TextEditingController _fullName;
  late TextEditingController _address;
  late TextEditingController _contact;
  late TextEditingController _medicare;
  late TextEditingController _emergency;
  late TextEditingController _nic;
  late TextEditingController _existing;
  late TextEditingController _surgeries;
  late TextEditingController _meds;
  late TextEditingController _medAllergies;
  late TextEditingController _otherAllergies;
  late TextEditingController _family;
  late TextEditingController _serious;
  late TextEditingController _covid;
  late TextEditingController _flu;
  late TextEditingController _otherVax;
  late TextEditingController _smoking;
  late TextEditingController _alcohol;
  late TextEditingController _exercise;
  late TextEditingController _diet;
  late TextEditingController _height;
  late TextEditingController _weight;
  late TextEditingController _symptoms;
  late TextEditingController _mental;
  late TextEditingController _sleep;
  late TextEditingController _pain;
  late TextEditingController _bp;
  late TextEditingController _otherMeas;
  late TextEditingController _safetyEmergency;
  late TextEditingController _importantAllergies;
  late TextEditingController _safetyMeds;
  late TextEditingController _conditionsKnow;
  late TextEditingController _advanceCare;

  DateTime? _dob;
  DateTime? _recentVax;
  String? _sex;
  String? _blood;
  String? _region;

  static const _steps = 6;

  @override
  void initState() {
    super.initState();
    final user = context.read<AuthCubit>().state.user;
    final h = user?.healthIntake ?? const PatientHealthIntake();
    _fullName = TextEditingController(
      text: h.fullName.isNotEmpty ? h.fullName : (user?.name ?? ''),
    );
    _address = TextEditingController(text: h.address);
    _contact = TextEditingController(
      text: h.contactDetails.isNotEmpty
          ? h.contactDetails
          : (user?.mobileNo ?? ''),
    );
    _medicare = TextEditingController(text: h.medicareDetails);
    _emergency = TextEditingController(
      text: h.emergencyContact.isNotEmpty
          ? h.emergencyContact
          : (user?.emergencyContacts.isNotEmpty == true
              ? user!.emergencyContacts.first
              : ''),
    );
    _nic = TextEditingController(text: user?.nic ?? '');
    _existing = TextEditingController(text: h.existingConditions);
    _surgeries = TextEditingController(text: h.previousSurgeries);
    _meds = TextEditingController(text: h.currentMedications);
    _medAllergies = TextEditingController(text: h.medicationAllergies);
    _otherAllergies = TextEditingController(text: h.otherAllergies);
    _family = TextEditingController(text: h.familyHistory);
    _serious = TextEditingController(text: h.previousSeriousIllnesses);
    _covid = TextEditingController(text: h.covidVaccination);
    _flu = TextEditingController(text: h.influenzaVaccination);
    _otherVax = TextEditingController(text: h.otherImmunisations);
    _smoking = TextEditingController(text: h.smokingStatus);
    _alcohol = TextEditingController(text: h.alcoholConsumption);
    _exercise = TextEditingController(text: h.exerciseLevel);
    _diet = TextEditingController(text: h.dietNutrition);
    _height = TextEditingController(text: h.heightCm);
    _weight = TextEditingController(text: h.weightKg);
    _symptoms = TextEditingController(text: h.currentSymptoms);
    _mental = TextEditingController(text: h.mentalWellbeing);
    _sleep = TextEditingController(text: h.sleep);
    _pain = TextEditingController(text: h.painMobility);
    _bp = TextEditingController(text: h.bloodPressure);
    _otherMeas = TextEditingController(text: h.otherMeasurements);
    _safetyEmergency = TextEditingController(
      text: h.safetyEmergencyContact.isNotEmpty
          ? h.safetyEmergencyContact
          : h.emergencyContact,
    );
    _importantAllergies = TextEditingController(text: h.importantAllergies);
    _safetyMeds = TextEditingController(
      text: h.safetyMedications.isNotEmpty
          ? h.safetyMedications
          : h.currentMedications,
    );
    _conditionsKnow =
        TextEditingController(text: h.conditionsProfessionalsShouldKnow);
    _advanceCare = TextEditingController(text: h.advanceCarePreferences);

    _dob = h.dateOfBirth ?? user?.dateOfBirth;
    _recentVax = h.mostRecentVaccinationDate;
    _sex = h.sex.isNotEmpty ? h.sex : null;
    _blood = user?.bloodGroup;
    _region = user?.region;
  }

  @override
  void dispose() {
    _page.dispose();
    for (final c in [
      _fullName,
      _address,
      _contact,
      _medicare,
      _emergency,
      _nic,
      _existing,
      _surgeries,
      _meds,
      _medAllergies,
      _otherAllergies,
      _family,
      _serious,
      _covid,
      _flu,
      _otherVax,
      _smoking,
      _alcohol,
      _exercise,
      _diet,
      _height,
      _weight,
      _symptoms,
      _mental,
      _sleep,
      _pain,
      _bp,
      _otherMeas,
      _safetyEmergency,
      _importantAllergies,
      _safetyMeds,
      _conditionsKnow,
      _advanceCare,
    ]) {
      c.dispose();
    }
    super.dispose();
  }

  String _t(String key) => HealthIntakeL10n.t(context, key);

  PatientHealthIntake _buildIntake({required bool completed}) {
    return PatientHealthIntake(
      fullName: _fullName.text.trim(),
      dateOfBirth: _dob,
      sex: _sex ?? '',
      address: _address.text.trim(),
      contactDetails: _contact.text.trim(),
      medicareDetails: _medicare.text.trim(),
      emergencyContact: _emergency.text.trim(),
      existingConditions: _existing.text.trim(),
      previousSurgeries: _surgeries.text.trim(),
      currentMedications: _meds.text.trim(),
      medicationAllergies: _medAllergies.text.trim(),
      otherAllergies: _otherAllergies.text.trim(),
      familyHistory: _family.text.trim(),
      previousSeriousIllnesses: _serious.text.trim(),
      covidVaccination: _covid.text.trim(),
      influenzaVaccination: _flu.text.trim(),
      otherImmunisations: _otherVax.text.trim(),
      mostRecentVaccinationDate: _recentVax,
      smokingStatus: _smoking.text.trim(),
      alcoholConsumption: _alcohol.text.trim(),
      exerciseLevel: _exercise.text.trim(),
      dietNutrition: _diet.text.trim(),
      heightCm: _height.text.trim(),
      weightKg: _weight.text.trim(),
      currentSymptoms: _symptoms.text.trim(),
      mentalWellbeing: _mental.text.trim(),
      sleep: _sleep.text.trim(),
      painMobility: _pain.text.trim(),
      bloodPressure: _bp.text.trim(),
      otherMeasurements: _otherMeas.text.trim(),
      safetyEmergencyContact: _safetyEmergency.text.trim().isEmpty
          ? _emergency.text.trim()
          : _safetyEmergency.text.trim(),
      importantAllergies: _importantAllergies.text.trim(),
      safetyMedications: _safetyMeds.text.trim().isEmpty
          ? _meds.text.trim()
          : _safetyMeds.text.trim(),
      conditionsProfessionalsShouldKnow: _conditionsKnow.text.trim(),
      advanceCarePreferences: _advanceCare.text.trim(),
      completed: completed,
    );
  }

  bool _validateMandatory() {
    final intake = _buildIntake(completed: false);
    return intake.isMandatoryComplete &&
        _nic.text.trim().isNotEmpty &&
        (_blood != null && _blood!.isNotEmpty);
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

  Future<void> _pickVaxDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _recentVax ?? now,
      firstDate: DateTime(2000),
      lastDate: now,
    );
    if (picked != null) setState(() => _recentVax = picked);
  }

  Future<void> _save({required bool completed}) async {
    if (!_validateMandatory()) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(_t('requiredHint'))),
      );
      setState(() => _step = 0);
      _page.jumpToPage(0);
      return;
    }

    final auth = context.read<AuthCubit>();
    final user = auth.state.user;
    if (user == null) return;

    final intake = _buildIntake(completed: completed);
    var updated = user.copyWith(
      name: intake.fullName,
      nic: _nic.text.trim(),
      mobileNo: intake.contactDetails,
      bloodGroup: _blood,
      region: _region,
      dateOfBirth: intake.dateOfBirth,
      emergencyContacts: [
        if (intake.emergencyContact.isNotEmpty) intake.emergencyContact,
      ],
      healthIntake: intake,
    ).withEnsuredBarcode();

    await auth.updateProfile(updated);
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(_t('saved'))),
    );
    if (widget.editing) {
      Navigator.of(context).pop();
    } else {
      Navigator.of(context).pushReplacementNamed('/main');
    }
  }

  void _next() {
    if (_step < _steps - 1) {
      setState(() => _step++);
      _page.nextPage(
        duration: const Duration(milliseconds: 280),
        curve: Curves.easeOut,
      );
    } else {
      _save(completed: true);
    }
  }

  void _back() {
    if (_step == 0) {
      if (widget.editing) Navigator.of(context).maybePop();
      return;
    }
    setState(() => _step--);
    _page.previousPage(
      duration: const Duration(milliseconds: 280),
      curve: Curves.easeOut,
    );
  }

  @override
  Widget build(BuildContext context) {
    final titles = [
      _t('secBasic'),
      _t('secMedical'),
      _t('secVaccinations'),
      _t('secLifestyle'),
      _t('secCurrent'),
      _t('secSafety'),
    ];

    return Scaffold(
      appBar: AppBar(
        title: Text(_t('intakeTitle')),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: _back,
        ),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _t('intakeSubtitle'),
                  style: TextStyle(
                    color: Colors.grey.shade600,
                    fontSize: 13,
                    height: 1.35,
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: List.generate(_steps, (i) {
                    final on = i <= _step;
                    return Expanded(
                      child: Container(
                        margin: EdgeInsets.only(right: i == _steps - 1 ? 0 : 4),
                        height: 4,
                        decoration: BoxDecoration(
                          color: on
                              ? AppColors.trustBlue
                              : const Color(0xFFE2E8F0),
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                    );
                  }),
                ),
                const SizedBox(height: 10),
                Text(
                  '${_step + 1}/$_steps · ${titles[_step]}',
                  style: const TextStyle(
                    fontWeight: FontWeight.w800,
                    color: AppColors.trustBlueDark,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: PageView(
              controller: _page,
              physics: const NeverScrollableScrollPhysics(),
              children: [
                _basicPage(),
                _medicalPage(),
                _vaxPage(),
                _lifestylePage(),
                _currentPage(),
                _safetyPage(),
              ],
            ),
          ),
          SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
              child: Row(
                children: [
                  if (_step > 0 || widget.editing)
                    Expanded(
                      child: OutlinedButton(
                        onPressed: _back,
                        child: Text(_t('back')),
                      ),
                    ),
                  if (_step > 0 || widget.editing) const SizedBox(width: 10),
                  Expanded(
                    flex: 2,
                    child: FilledButton(
                      onPressed: _next,
                      child: Text(
                        _step == _steps - 1
                            ? (widget.editing
                                ? _t('saveChanges')
                                : _t('saveContinue'))
                            : _t('next'),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _basicPage() {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        _field(_t('fullName'), _fullName, required: true),
        _dateTile(
          label: '${_t('dob')} *',
          value: _dob,
          onTap: _pickDob,
        ),
        const SizedBox(height: 12),
        Text('${_t('sex')} *', style: _labelStyle),
        const SizedBox(height: 6),
        DropdownButtonFormField<String>(
          // ignore: deprecated_member_use
          value: _sex,
          decoration: const InputDecoration(isDense: true),
          items: [
            DropdownMenuItem(value: 'female', child: Text(_t('sexFemale'))),
            DropdownMenuItem(value: 'male', child: Text(_t('sexMale'))),
            DropdownMenuItem(value: 'other', child: Text(_t('sexOther'))),
          ],
          onChanged: (v) => setState(() => _sex = v),
        ),
        const SizedBox(height: 12),
        _field(_t('nicNo'), _nic, required: true),
        DropdownButtonFormField<String>(
          // ignore: deprecated_member_use
          value: _blood,
          decoration: InputDecoration(labelText: '${_t('bloodGroup')} *'),
          items: AppConstants.bloodGroups
              .map((d) => DropdownMenuItem(value: d, child: Text(d)))
              .toList(),
          onChanged: (v) => setState(() => _blood = v),
        ),
        const SizedBox(height: 12),
        DropdownButtonFormField<String>(
          // ignore: deprecated_member_use
          value: _region,
          decoration: InputDecoration(labelText: _t('mohDistrict')),
          items: AppConstants.mohDistricts
              .map((d) => DropdownMenuItem(value: d, child: Text(d)))
              .toList(),
          onChanged: (v) => setState(() => _region = v),
        ),
        const SizedBox(height: 12),
        _field(_t('address'), _address, required: true, maxLines: 2),
        _field(_t('contact'), _contact, required: true,
            keyboard: TextInputType.phone),
        _field(_t('medicare'), _medicare),
        _field(_t('emergencyContact'), _emergency, required: true),
        Text(_t('hintNone'), style: _hintStyle),
      ],
    );
  }

  Widget _medicalPage() {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        _field(_t('existingConditions'), _existing, maxLines: 2),
        _field(_t('previousSurgeries'), _surgeries, maxLines: 2),
        _field(_t('currentMedications'), _meds, maxLines: 2),
        _field(_t('medicationAllergies'), _medAllergies, maxLines: 2),
        _field(_t('otherAllergies'), _otherAllergies, maxLines: 2),
        _field(_t('familyHistory'), _family, maxLines: 2),
        _field(_t('previousSeriousIllnesses'), _serious, maxLines: 2),
        Text(_t('hintNone'), style: _hintStyle),
      ],
    );
  }

  Widget _vaxPage() {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        _field(_t('covidVax'), _covid, maxLines: 2),
        _field(_t('fluVax'), _flu, maxLines: 2),
        _field(_t('otherImmunisations'), _otherVax, maxLines: 2),
        _dateTile(
          label: _t('mostRecentVax'),
          value: _recentVax,
          onTap: _pickVaxDate,
        ),
        const SizedBox(height: 8),
        Text(_t('hintNone'), style: _hintStyle),
      ],
    );
  }

  Widget _lifestylePage() {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        _field(_t('smoking'), _smoking),
        _field(_t('alcohol'), _alcohol),
        _field(_t('exercise'), _exercise),
        _field(_t('diet'), _diet, maxLines: 2),
        _field(_t('height'), _height, keyboard: TextInputType.number),
        _field(_t('weight'), _weight, keyboard: TextInputType.number),
      ],
    );
  }

  Widget _currentPage() {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        _field(_t('currentSymptoms'), _symptoms, maxLines: 3),
        _field(_t('mentalWellbeing'), _mental, maxLines: 2),
        _field(_t('sleep'), _sleep),
        _field(_t('painMobility'), _pain, maxLines: 2),
        _field(_t('bloodPressure'), _bp),
        _field(_t('otherMeasurements'), _otherMeas, maxLines: 2),
      ],
    );
  }

  Widget _safetyPage() {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        _field(_t('safetyEmergency'), _safetyEmergency, required: true),
        _field(_t('importantAllergies'), _importantAllergies, required: true,
            maxLines: 2),
        _field(_t('safetyMeds'), _safetyMeds, required: true, maxLines: 2),
        _field(_t('conditionsKnow'), _conditionsKnow, maxLines: 2),
        _field(_t('advanceCare'), _advanceCare, maxLines: 2),
        Text(_t('hintNone'), style: _hintStyle),
      ],
    );
  }

  TextStyle get _labelStyle => const TextStyle(
        fontWeight: FontWeight.w700,
        fontSize: 12,
        color: Color(0xFF475569),
      );

  TextStyle get _hintStyle => TextStyle(
        color: Colors.grey.shade600,
        fontSize: 12,
        fontStyle: FontStyle.italic,
      );

  Widget _field(
    String label,
    TextEditingController ctrl, {
    bool required = false,
    int maxLines = 1,
    TextInputType? keyboard,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextField(
        controller: ctrl,
        maxLines: maxLines,
        keyboardType: keyboard,
        decoration: InputDecoration(
          labelText: required ? '$label *' : label,
          alignLabelWithHint: maxLines > 1,
        ),
      ),
    );
  }

  Widget _dateTile({
    required String label,
    required DateTime? value,
    required VoidCallback onTap,
  }) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      title: Text(
        value == null
            ? label
            : '$label: ${DateFormat.yMMMd().format(value)}',
      ),
      trailing: const Icon(Icons.calendar_today_outlined),
      onTap: onTap,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: const BorderSide(color: AppColors.border),
      ),
    );
  }
}
