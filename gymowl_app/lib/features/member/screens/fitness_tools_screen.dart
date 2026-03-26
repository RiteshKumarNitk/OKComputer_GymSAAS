import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class FitnessToolsScreen extends StatelessWidget {
  const FitnessToolsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F6FA), // Light Gray Theme Background
      appBar: AppBar(
        title: const Text('Fitness Tools', style: TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF1A1F38))),
        backgroundColor: const Color(0xFFF4F6FA),
        elevation: 0,
        actions: [
          IconButton(
            onPressed: () {},
            icon: const Icon(Icons.info_outline_rounded, color: Color(0xFF1A1F38)),
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
        child: GridView.count(
          crossAxisCount: 2,
          crossAxisSpacing: 16,
          mainAxisSpacing: 16,
          childAspectRatio: 0.85, // Adjusts the height-to-width ratio making them sleek tall rectangles
          children: [
            _buildGridCard(context, 'Calories Calculator', 'Calculate your BMR', Icons.calculate_rounded, Colors.orangeAccent, '/member/calories-calculator'),
            _buildGridCard(context, 'BMI Calculator', 'Check your BMI', Icons.monitor_weight_rounded, const Color(0xFF006C46), '/member/bmi-calculator'),
            _buildGridCard(context, 'Water Reminder', 'Track daily hydration', Icons.water_drop_rounded, Colors.blueAccent, '/member/water-reminder'),
            _buildGridCard(context, 'Macro Tracker', 'Daily Protein & Carbs', Icons.pie_chart_rounded, Colors.purpleAccent, '/member/macro-tracker'),
            _buildGridCard(context, '1RM Calculator', 'Calculate max strength', Icons.fitness_center_rounded, Colors.redAccent, '/member/one-rep-max'),
          ],
        ),
      ),
    );
  }

  Widget _buildGridCard(BuildContext context, String title, String subtitle, IconData icon, Color color, String route) {
    return GestureDetector(
      onTap: () => context.go(route),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: color.withOpacity(0.1),
              blurRadius: 15,
              offset: const Offset(0, 8),
            )
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: color, size: 28),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      color: Color(0xFF1A1F38),
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      height: 1.2,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    subtitle,
                    style: TextStyle(
                      color: Colors.grey.shade600,
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
