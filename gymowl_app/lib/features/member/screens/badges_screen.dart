import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class BadgesScreen extends ConsumerWidget {
  const BadgesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F6FA),
      appBar: AppBar(
        title: const Text('Achievements', style: TextStyle(color: Color(0xFF1A1F38), fontWeight: FontWeight.w900)),
        backgroundColor: const Color(0xFFF4F6FA),
        elevation: 0,
        iconTheme: const IconThemeData(color: Color(0xFF1A1F38)),
      ),
      body: GridView.count(
        padding: const EdgeInsets.all(20),
        crossAxisCount: 2,
        crossAxisSpacing: 16,
        mainAxisSpacing: 16,
        childAspectRatio: 0.85,
        children: [
          _buildBadgeCard('Early Bird', 'Checked in before 7 AM', Icons.wb_twilight_rounded, const Color(0xFFFFB74D), true),
          _buildBadgeCard('Iron Pumper', 'Logged 10 Workouts', Icons.fitness_center_rounded, const Color(0xFF78909C), true),
          _buildBadgeCard('Hydration Hero', 'Logged 3L water for 7 days', Icons.water_drop_rounded, const Color(0xFF64B5F6), false),
          _buildBadgeCard('Nutritionist', 'Tracked macros for 14 days', Icons.pie_chart_rounded, const Color(0xFFBA68C8), false),
          _buildBadgeCard('Elite Member', 'Attained Top 5 in Leaderboard', Icons.workspace_premium_rounded, const Color(0xFFFFD700), false),
          _buildBadgeCard('Consistent', 'Workout 5 days a week', Icons.local_fire_department_rounded, const Color(0xFFFF5236), true),
        ],
      ),
    );
  }

  Widget _buildBadgeCard(String title, String desc, IconData icon, Color badgeColor, bool isEarned) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          if (isEarned) BoxShadow(color: badgeColor.withOpacity(0.2), blurRadius: 15, offset: const Offset(0, 8))
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isEarned ? badgeColor.withOpacity(0.1) : Colors.grey.shade100,
                border: Border.all(color: isEarned ? badgeColor : Colors.grey.shade300, width: 2),
              ),
              child: Icon(icon, size: 36, color: isEarned ? badgeColor : Colors.grey.shade400),
            ),
            const SizedBox(height: 16),
            Text(
              title,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 15,
                color: isEarned ? const Color(0xFF1A1F38) : Colors.grey.shade500,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              desc,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 11,
                color: isEarned ? Colors.grey.shade600 : Colors.grey.shade400,
                height: 1.2
              ),
            ),
            if (!isEarned) ...[
              const SizedBox(height: 12),
              const Icon(Icons.lock_rounded, size: 14, color: Colors.grey)
            ]
          ],
        ),
      ),
    );
  }
}
