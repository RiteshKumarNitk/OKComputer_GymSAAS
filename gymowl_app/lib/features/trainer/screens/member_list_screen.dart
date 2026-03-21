import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/workout_provider.dart';

class MemberListScreen extends ConsumerWidget {
  const MemberListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final workoutState = ref.watch(workoutProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('My Members')),
      body: workoutState.isLoading
          ? const Center(child: CircularProgressIndicator())
          : workoutState.error != null && workoutState.members.isEmpty
              ? Center(child: Text(workoutState.error!))
              : ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: workoutState.members.length,
                  separatorBuilder: (context, index) => const Divider(),
                  itemBuilder: (context, index) {
                    final member = workoutState.members[index];
                    return ListTile(
                      title: Text(member.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                      subtitle: Text('Status: ${member.planStatus ?? "Unassigned"}'),
                      trailing: ElevatedButton(
                        onPressed: () {
                          context.go('/trainer/members/${member.id}/assign');
                        },
                        style: ElevatedButton.styleFrom(backgroundColor: Colors.indigo),
                        child: const Text('Assign Plan', style: TextStyle(color: Colors.white)),
                      ),
                    );
                  },
                ),
    );
  }
}
