import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../providers/member_provider.dart';

class WorkoutsTrackerScreen extends ConsumerWidget {
  const WorkoutsTrackerScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final statsAsync = ref.watch(memberStatsProvider);
    final workoutsAsync = ref.watch(myWorkoutsProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF4F6FA),
      appBar: AppBar(
        title: const Text('Analytics', style: TextStyle(color: Colors.black, fontWeight: FontWeight.w900)),
        backgroundColor: const Color(0xFFF4F6FA),
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.black),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded), 
            onPressed: () {
              ref.invalidate(memberStatsProvider);
              ref.invalidate(myWorkoutsProvider);
            }
          ),
        ],
      ),
      body: statsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator(color: Colors.black)),
        error: (err, _) => Center(child: Text('Error loading stats: $err')),
        data: (stats) => RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(memberStatsProvider);
            ref.invalidate(myWorkoutsProvider);
          },
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Intensity Minutes', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Colors.black)),
                const SizedBox(height: 16),
                _buildChartCard(stats),
                const SizedBox(height: 32),
                const Text('My Routines', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Colors.black)),
                const SizedBox(height: 16),
                workoutsAsync.when(
                  data: (workouts) => _buildAssignedWorkouts(context, ref, workouts),
                  loading: () => const Center(child: LinearProgressIndicator(color: Colors.black)),
                  error: (err, _) => Text('Error: $err'),
                ),
                const SizedBox(height: 32),
                const Text('Recent Sessions', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Colors.black)),
                const SizedBox(height: 16),
                _buildRecentSessions(stats['recentActivity'] ?? []),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildAssignedWorkouts(BuildContext context, WidgetRef ref, List<dynamic> workouts) {
    if (workouts.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20)),
        child: const Center(child: Text('No active routines assigned', style: TextStyle(color: Colors.grey))),
      );
    }

    return Column(
      children: workouts.map((w) {
        final workout = w['workout'] ?? {};
        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10, offset: const Offset(0, 4))]
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(color: Colors.black.withOpacity(0.05), shape: BoxShape.circle),
                child: const Icon(Icons.play_circle_fill_rounded, color: Colors.black),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(workout['name'] ?? 'Workout', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    Text('${workout['difficulty'] ?? 'General'} • ${workout['estimatedDurationMinutes'] ?? 30}m', style: const TextStyle(color: Colors.grey, fontSize: 13)),
                  ],
                ),
              ),
              ElevatedButton(
                onPressed: () => _showCompletionDialog(context, ref, w['id'], workout['name']),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.black,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  elevation: 0,
                ),
                child: const Text('Complete'),
              )
            ],
          ),
        );
      }).toList(),
    );
  }

  void _showCompletionDialog(BuildContext context, WidgetRef ref, String assignmentId, String name) {
    final notesController = TextEditingController();
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Log $name'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Great job! Any notes for your trainer?'),
            const SizedBox(height: 16),
            TextField(
              controller: notesController,
              decoration: const InputDecoration(
                hintText: 'e.g. Felt strong today, increased weight.',
                border: OutlineInputBorder(),
              ),
              maxLines: 3,
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              await ref.read(workoutCompletionProvider.notifier).completeWorkout(
                assignmentId,
                notes: notesController.text,
              );
              if (context.mounted) {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Workout logged successfully! 🎉')),
                );
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.black),
            child: const Text('Save Progress', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  Widget _buildChartCard(Map<String, dynamic> stats) {
    final trend = stats['intensityTrend'] as List? ?? [];
    final spots = trend.asMap().entries.map((e) {
      final minutes = (e.value['minutes'] ?? e.value['value'] ?? 0).toDouble();
      return FlSpot(e.key.toDouble(), minutes);
    }).toList();

    final totalMin = trend.fold<int>(0, (prev, element) => prev + (element['minutes'] as int? ?? 0));

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.black,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.3), blurRadius: 20, offset: const Offset(0, 10))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Weekly Volume', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Text('$totalMin', style: const TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.w900)),
                      const Text(' min', style: TextStyle(color: Colors.white70, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(color: Colors.white.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
                child: const Text('LIVE', style: TextStyle(color: Colors.greenAccent, fontWeight: FontWeight.bold, fontSize: 12)),
              )
            ],
          ),
          const SizedBox(height: 40),
          SizedBox(
            height: 180,
            child: LineChart(
              LineChartData(
                gridData: FlGridData(show: false),
                titlesData: FlTitlesData(
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      getTitlesWidget: (value, meta) {
                        if (value.toInt() >= 0 && value.toInt() < trend.length) {
                          return Padding(
                            padding: const EdgeInsets.only(top: 10),
                            child: Text((trend[value.toInt()]['day'] ?? '').toString(), style: const TextStyle(color: Colors.white70, fontSize: 10, fontWeight: FontWeight.bold)),
                          );
                        }
                        return const Text('');
                      },
                      reservedSize: 30,
                    ),
                  ),
                  leftTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                ),
                borderData: FlBorderData(show: false),
                lineBarsData: [
                  LineChartBarData(
                    spots: spots.isEmpty ? [const FlSpot(0, 0)] : spots,
                    isCurved: true,
                    color: Colors.white,
                    barWidth: 4,
                    dotData: FlDotData(show: false),
                    belowBarData: BarAreaData(
                      show: true,
                      gradient: LinearGradient(
                        colors: [
                          Colors.white.withOpacity(0.3),
                          Colors.white.withOpacity(0.0),
                        ],
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
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

  Widget _buildRecentSessions(List<dynamic> logs) {
    if (logs.isEmpty) {
      return const Center(child: Padding(
        padding: EdgeInsets.symmetric(vertical: 40),
        child: Text('No sessions recorded yet', style: TextStyle(color: Colors.grey)),
      ));
    }

    return Column(
      children: logs.map((log) {
        final title = log['workoutName'] ?? 'General Session';
        final dateStr = log['date'] != null 
            ? DateFormat('EEEE, HH:mm').format(DateTime.parse(log['date'])) 
            : 'Unscheduled';
        final duration = '${log['duration'] ?? 0}m';
        
        return Padding(
          padding: const EdgeInsets.only(bottom: 12.0),
          child: _buildLogCard(title, dateStr, duration, Icons.fitness_center_rounded, Colors.black),
        );
      }).toList(),
    );
  }

  Widget _buildLogCard(String title, String date, String duration, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10, offset: const Offset(0, 4))]
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: color.withOpacity(0.1), shape: BoxShape.circle),
            child: Icon(icon, color: color, size: 24),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.black)),
                const SizedBox(height: 4),
                Text(date, style: const TextStyle(color: Colors.grey, fontSize: 13)),
              ],
            ),
          ),
          Text(duration, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: Colors.black)),
        ],
      ),
    );
  }
}
