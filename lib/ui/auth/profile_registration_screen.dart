import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../bloc/auth/auth_cubit.dart';
import '../../core/constants/app_constants.dart';
import '../../core/theme/app_colors.dart';

class ProfileRegistrationScreen extends StatefulWidget {
  const ProfileRegistrationScreen({super.key});

  @override
  State<ProfileRegistrationScreen> createState() =>
      _ProfileRegistrationScreenState();
}

class _ProfileRegistrationScreenState extends State<ProfileRegistrationScreen> {
  final _nic = TextEditingController();
  final _mobile = TextEditingController();
  final _emergency = TextEditingController();
  String? _region;
  String? _blood;
  DateTime? _dob;

  @override
  void dispose() {
    _nic.dispose();
    _mobile.dispose();
    _emergency.dispose();
    super.dispose();
  }

  Future<void> _pickDob() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime(now.year - 30),
      firstDate: DateTime(1920),
      lastDate: now,
    );
    if (picked != null) setState(() => _dob = picked);
  }

  Future<void> _save() async {
    final auth = context.read<AuthCubit>();
    final user = auth.state.user;
    if (user == null) return;
    if (_nic.text.isEmpty || _dob == null || _region == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('NIC, date of birth, and MOH district are required.')),
      );
      return;
    }
    await auth.updateProfile(
      user.copyWith(
        nic: _nic.text.trim(),
        mobileNo: _mobile.text.trim().isEmpty ? user.mobileNo : _mobile.text.trim(),
        bloodGroup: _blood,
        region: _region,
        dateOfBirth: _dob,
        emergencyContacts: _emergency.text.trim().isEmpty
            ? user.emergencyContacts
            : [_emergency.text.trim()],
      ),
    );
    if (!mounted) return;
    Navigator.of(context).pushReplacementNamed('/main');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Complete your profile')),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          Text(
            'National Identity & MOH registration',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 8),
          Text(
            'Required for vaccine booking and vault identity binding.',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: 20),
          TextField(
            controller: _nic,
            decoration: const InputDecoration(
              labelText: 'NIC number',
              prefixIcon: Icon(Icons.badge_outlined),
            ),
          ),
          const SizedBox(height: 12),
          ListTile(
            contentPadding: EdgeInsets.zero,
            title: Text(
              _dob == null
                  ? 'Date of birth'
                  : 'DOB: ${_dob!.toLocal().toString().split(' ').first}',
            ),
            trailing: const Icon(Icons.calendar_today_outlined),
            onTap: _pickDob,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: const BorderSide(color: AppColors.border),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _mobile,
            keyboardType: TextInputType.phone,
            decoration: const InputDecoration(
              labelText: 'Mobile number',
              prefixIcon: Icon(Icons.phone),
            ),
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            initialValue: _region,
            decoration: const InputDecoration(labelText: 'MOH district'),
            items: AppConstants.mohDistricts
                .map((d) => DropdownMenuItem(value: d, child: Text(d)))
                .toList(),
            onChanged: (v) => setState(() => _region = v),
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            initialValue: _blood,
            decoration: const InputDecoration(labelText: 'Blood group'),
            items: AppConstants.bloodGroups
                .map((d) => DropdownMenuItem(value: d, child: Text(d)))
                .toList(),
            onChanged: (v) => setState(() => _blood = v),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _emergency,
            decoration: const InputDecoration(
              labelText: 'Emergency contact',
              prefixIcon: Icon(Icons.contact_phone_outlined),
            ),
          ),
          const SizedBox(height: 28),
          FilledButton(
            onPressed: _save,
            child: const Text('Save & continue'),
          ),
        ],
      ),
    );
  }
}
