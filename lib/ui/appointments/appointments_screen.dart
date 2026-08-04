import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';

import '../../bloc/auth/auth_cubit.dart';
import '../../bloc/notification/notification_cubit.dart';
import '../../core/theme/app_colors.dart';
import '../../data/models/appointment.dart';
import '../../data/repositories/health_repository.dart';
import '../widgets/common_widgets.dart';

class AppointmentsScreen extends StatefulWidget {
  const AppointmentsScreen({super.key});

  @override
  State<AppointmentsScreen> createState() => _AppointmentsScreenState();
}

class _AppointmentsScreenState extends State<AppointmentsScreen> {
  final _query = TextEditingController();
  List<Doctor> _doctors = [];
  List<Appointment> _mine = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _refresh();
  }

  Future<void> _refresh() async {
    final health = context.read<HealthRepository>();
    final user = context.read<AuthCubit>().state.user;
    setState(() => _loading = true);
    final docs = await health.getDoctors(query: _query.text);
    final appts =
        user == null ? <Appointment>[] : await health.getAppointments(user.id);
    if (!mounted) return;
    setState(() {
      _doctors = docs;
      _mine = appts;
      _loading = false;
    });
  }

  Future<void> _book(Doctor doctor) async {
    final health = context.read<HealthRepository>();
    final user = context.read<AuthCubit>().state.user!;
    final now = DateTime.now();
    final slots = List.generate(4, (i) {
      final d = now.add(Duration(days: i + 1));
      return DateTime(d.year, d.month, d.day, 10 + i);
    });

    final slot = await showModalBottomSheet<DateTime>(
      context: context,
      builder: (ctx) => ListView(
        shrinkWrap: true,
        children: [
          const ListTile(title: Text('Select slot · mock payment')),
          ...slots.map(
            (s) => ListTile(
              title: Text(DateFormat('EEE d MMM · HH:mm').format(s)),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => Navigator.pop(ctx, s),
            ),
          ),
        ],
      ),
    );
    if (slot == null || !mounted) return;

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Confirm booking'),
        content: Text(
          '${doctor.name}\n${DateFormat('EEE d MMM · HH:mm').format(slot)}\n\n'
          'Mock payment: LKR 2,500',
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Pay & book')),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;

    final appt = await health.bookAppointment(
      patientId: user.id,
      doctor: doctor,
      slot: slot,
    );
    if (!mounted) return;
    final notifCubit = context.read<NotificationCubit>();
    await notifCubit.load();
    if (!mounted) return;
    await showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Consultation token'),
        content: Text('Token ${appt.token} issued for ${doctor.name}.'),
        actions: [
          FilledButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Done'),
          ),
        ],
      ),
    );
    await _refresh();
  }

  @override
  void dispose() {
    _query.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        SectionHeader('Your upcoming'),
        if (_mine.isEmpty)
          const EmptyHint('No upcoming appointments')
        else
          ..._mine.map((a) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: SoftCard(
                  child: ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: Text(a.doctorName),
                    subtitle: Text(
                      '${a.specialty}\n${DateFormat('EEE d MMM · HH:mm').format(a.timeSlot)}',
                    ),
                    isThreeLine: true,
                    trailing: StatusChip(
                      label: a.token ?? a.status.name,
                      color: AppColors.trustBlue,
                    ),
                  ),
                ),
              )),
        const SizedBox(height: 12),
        SectionHeader('Find a doctor'),
        TextField(
          controller: _query,
          decoration: const InputDecoration(
            hintText: 'Name, specialty, or hospital',
            prefixIcon: Icon(Icons.search),
          ),
          onChanged: (_) => _refresh(),
        ),
        const SizedBox(height: 12),
        if (_loading)
          const Center(child: CircularProgressIndicator())
        else
          ..._doctors.map((d) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: SoftCard(
                  child: ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: CircleAvatar(
                      backgroundColor:
                          AppColors.trustBlue.withValues(alpha: 0.12),
                      child: Text(d.name.split(' ').last[0]),
                    ),
                    title: Text(d.name),
                    subtitle: Text('${d.specialty} · ${d.hospital}'),
                    trailing: FilledButton(
                      onPressed: () => _book(d),
                      child: const Text('Book'),
                    ),
                  ),
                ),
              )),
      ],
    );
  }
}
