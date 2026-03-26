import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/workout_provider.dart';

class TrainerDashboardScreen extends ConsumerWidget {
  const TrainerDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final workoutState = ref.watch(workoutProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF4F6FA),
      appBar: AppBar(
        title: const Text('Ops Center', style: TextStyle(color: Color(0xFF1A1F38), fontWeight: FontWeight.w900, fontSize: 24)),
        backgroundColor: const Color(0xFFF4F6FA),
        elevation: 0,
        actions: [
          IconButton(icon: const Icon(Icons.notifications_none_rounded, color: Color(0xFF1A1F38)), onPressed: () {}),
          Padding(
            padding: const EdgeInsets.only(right: 16.0),
            child: CircleAvatar(
              radius: 18,
              backgroundColor: const Color(0xFFFF5236),
              child: const Icon(Icons.sports, color: Colors.white, size: 20),
            ),
          )
        ],
      ),
      body: workoutState.isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFFFF5236)))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildWelcomeCard(),
                  const SizedBox(height: 32),
                  const Text('Overview', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Color(0xFF1A1F38))),
                  const SizedBox(height: 16),
                  _buildStatsGrid(workoutState.members.length),
                  const SizedBox(height: 32),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('My Athletes', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Color(0xFF1A1F38))),
                      TextButton(
                        onPressed: () => context.go('/trainer/members'),
                        child: const Text('View Directory', style: TextStyle(color: Color(0xFF006C46), fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  _buildMemberList(context, workoutState),
                  const SizedBox(height: 40),
                ],
              ),
            ),
    );
  }

  Widget _buildWelcomeCard() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: const Color(0xFF1A1F38),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(color: const Color(0xFF1A1F38).withOpacity(0.3), blurRadius: 20, offset: const Offset(0, 10))
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Welcome Back, Coach!',
                  style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w900),
                ),
                const SizedBox(height: 8),
                Text(
                  'You have 3 classes and 4 PT sessions scheduled today.',
                  style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 13, height: 1.4),
                ),
              ],
            ),
          ),
          const SizedBox(width: 16),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.timer_outlined, color: Colors.white, size: 32),
          ),
        ],
      ),
    );
  }

  Widget _buildStatsGrid(int memberCount) {
    return Row(
      children: [
        Expanded(
          child: _buildStatCard('Active Athletes', memberCount.toString(), Icons.groups_rounded, const Color(0xFF006C46)),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: _buildStatCard('Pending Plans', '2', Icons.assignment_rounded, const Color(0xFFFF5236)),
        ),
      ],
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10, offset: const Offset(0, 4))
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
            child: Icon(icon, color: color, size: 24),
          ),
          const SizedBox(height: 20),
          Text(value, style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: Color(0xFF1A1F38), height: 1.0)),
          const SizedBox(height: 4),
          Text(title, style: const TextStyle(color: Colors.grey, fontSize: 12, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildMemberList(BuildContext context, WorkoutState state) {
    final members = state.members.take(4).toList(); // Show top 4 on dashboard

    if (members.isEmpty) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(32),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20)),
        child: Column(
          children: const [
            Icon(Icons.person_off_rounded, color: Colors.grey, size: 48),
            SizedBox(height: 16),
            Text('No athletes assigned yet.', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold)),
          ],
        ),
      );
    }

    return Column(
      children: members.map((member) {
        final needsPlan = member.planStatus == null || member.planStatus == "Unassigned";

        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10, offset: const Offset(0, 4))],
          ),
          child: ListTile(
            contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            leading: CircleAvatar(
              radius: 24,
              backgroundColor: needsPlan ? const Color(0xFFFF5236).withOpacity(0.1) : const Color(0xFF006C46).withOpacity(0.1),
              child: Text(
                member.name.substring(0, 1).toUpperCase(),
                style: TextStyle(color: needsPlan ? const Color(0xFFFF5236) : const Color(0xFF006C46), fontWeight: FontWeight.w900, fontSize: 18),
              ),
            ),
            title: Text(member.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF1A1F38))),
            subtitle: Padding(
              padding: const EdgeInsets.only(top: 4.0),
              child: Row(
                children: [
                  Icon(needsPlan ? Icons.warning_rounded : Icons.check_circle_rounded, size: 14, color: needsPlan ? const Color(0xFFFF5236) : const Color(0xFF006C46)),
                  const SizedBox(width: 4),
                  Text(
                    needsPlan ? "Needs Plan" : "Active Plan",
                    style: TextStyle(color: needsPlan ? const Color(0xFFFF5236) : const Color(0xFF006C46), fontSize: 12, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
            ),
            trailing: Container(
              decoration: BoxDecoration(
                color: const Color(0xFF1A1F38),
                borderRadius: BorderRadius.circular(12),
              ),
              child: IconButton(
                icon: const Icon(Icons.add_chart_rounded, color: Colors.white, size: 20),
                onPressed: () => context.go('/trainer/members/${member.id}/assign'),
                tooltip: 'Assign Workout',
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}
