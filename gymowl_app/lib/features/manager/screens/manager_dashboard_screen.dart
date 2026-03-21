import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fl_chart/fl_chart.dart';
import '../providers/manager_provider.dart';

class ManagerDashboardScreen extends ConsumerWidget {
  const ManagerDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final managerState = ref.watch(managerProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Manager Dashboard')),
      body: managerState.isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Overview', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 16),
                  _buildStatsGrid(managerState.stats),
                  const SizedBox(height: 32),
                  const Text('Revenue Growth', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 16),
                  _buildChart(managerState.stats?.monthlyRevenue ?? []),
                ],
              ),
            ),
    );
  }

  Widget _buildStatsGrid(DashboardStats? stats) {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      crossAxisSpacing: 16,
      mainAxisSpacing: 16,
      childAspectRatio: 1.3,
      children: [
        _buildStatCard('Revenue Today', '\$${stats?.revenueToday ?? 0}', Colors.green),
        _buildStatCard('Active Members', '${stats?.activeMembers ?? 0}', Colors.indigo),
        _buildStatCard('New Leads', '12', Colors.orange),
        _buildStatCard('Staff Count', '5', Colors.purple),
      ],
    );
  }

  Widget _buildStatCard(String title, String value, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(title, style: TextStyle(color: color, fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          Text(value, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildChart(List<double> points) {
    if (points.isEmpty) return const SizedBox(height: 200, child: Center(child: Text('No data')));
    
    final spots = points.asMap().entries.map((e) => FlSpot(e.key.toDouble(), e.value)).toList();

    return SizedBox(
      height: 220,
      child: Padding(
        padding: const EdgeInsets.only(right: 16, top: 12),
        child: LineChart(
          LineChartData(
            gridData: const FlGridData(show: false),
            titlesData: const FlTitlesData(show: false),
            borderData: FlBorderData(show: false),
            lineBarsData: [
              LineChartBarData(
                spots: spots,
                isCurved: true,
                color: Colors.indigo,
                barWidth: 3,
                belowBarData: BarAreaData(show: true, color: Colors.indigo.withOpacity(0.1)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
