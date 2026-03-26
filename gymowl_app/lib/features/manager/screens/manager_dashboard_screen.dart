import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:go_router/go_router.dart';
import '../providers/manager_providers.dart';

class ManagerDashboardScreen extends ConsumerWidget {
  const ManagerDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final statsAsync = ref.watch(executiveStatsProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF4F6FA),
      appBar: AppBar(
        title: const Text('Executive HQ', style: TextStyle(color: Color(0xFF1A1F38), fontWeight: FontWeight.w900, fontSize: 24)),
        backgroundColor: const Color(0xFFF4F6FA),
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: Color(0xFF1A1F38)), 
            onPressed: () => ref.invalidate(executiveStatsProvider)
          ),
          Padding(
            padding: const EdgeInsets.only(right: 16.0),
            child: CircleAvatar(
              radius: 18,
              backgroundColor: const Color(0xFF1A1F38),
              child: const Icon(Icons.shield_rounded, color: Colors.white, size: 18),
            ),
          )
        ],
      ),
      body: statsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator(color: Color(0xFFFF5236))),
        error: (err, _) => Center(child: Text('Error loading HQ: $err')),
        data: (stats) => RefreshIndicator(
          onRefresh: () async => ref.invalidate(executiveStatsProvider),
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(20.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildRevenueHero(stats),
                const SizedBox(height: 24),
                const Text('Core Metrics', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Color(0xFF1A1F38))),
                const SizedBox(height: 16),
                _buildStatsGrid(stats),
                const SizedBox(height: 32),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Cash Flow Trend', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Color(0xFF1A1F38))),
                    TextButton(onPressed: () {}, child: const Text('Export', style: TextStyle(color: Color(0xFF006C46), fontWeight: FontWeight.bold))),
                  ],
                ),
                const SizedBox(height: 12),
                _buildChartCard(stats['revenueTrend'] ?? []),
                const SizedBox(height: 32),
                const Text('System Management', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Color(0xFF1A1F38))),
                const SizedBox(height: 16),
                _buildAdminMenu(context),
                const SizedBox(height: 40),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildRevenueHero(Map<String, dynamic> stats) {
    final mrr = (stats['monthlyRevenue'] ?? 0) / 100; // Assuming cents
    final totalRevenue = (stats['totalRevenue'] ?? 0) / 100;
    
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: const Color(0xFF1A1F38),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [BoxShadow(color: const Color(0xFF1A1F38).withOpacity(0.3), blurRadius: 20, offset: const Offset(0, 10))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('MONTHLY RECURRING REVENUE (MRR)', style: TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1.2)),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(color: Colors.greenAccent.withOpacity(0.2), borderRadius: BorderRadius.circular(12)),
                child: const Text('LIVE', style: TextStyle(color: Colors.greenAccent, fontSize: 10, fontWeight: FontWeight.w900)),
              )
            ],
          ),
          const SizedBox(height: 12),
          Text('\$${mrr.toStringAsFixed(0)}', style: const TextStyle(color: Colors.white, fontSize: 42, fontWeight: FontWeight.w900, letterSpacing: -1)),
          const SizedBox(height: 24),
          Row(
            children: [
              Expanded(child: _buildMiniStat('Total Revenue', '\$${totalRevenue.toStringAsFixed(0)}', Colors.greenAccent)),
              Container(width: 1, height: 40, color: Colors.white24),
              Expanded(child: _buildMiniStat('Active Members', '${stats['activeMembers'] ?? 0}', Colors.white)),
            ],
          )
        ],
      ),
    );
  }

  Widget _buildMiniStat(String label, String value, Color valueColor) {
    return Column(
      children: [
        Text(value, style: TextStyle(color: valueColor, fontSize: 20, fontWeight: FontWeight.w900)),
        const SizedBox(height: 4),
        Text(label, style: const TextStyle(color: Colors.white54, fontSize: 12, fontWeight: FontWeight.bold)),
      ],
    );
  }

  Widget _buildStatsGrid(Map<String, dynamic> stats) {
    return Row(
      children: [
        Expanded(child: _buildStatCard('Engagement', '${stats['attendanceToday'] ?? 0}', Icons.trending_up_rounded, Colors.blueAccent)),
        const SizedBox(width: 16),
        Expanded(child: _buildStatCard('Growth', '+${stats['newMembersThisMonth'] ?? 0}', Icons.person_add_rounded, const Color(0xFFFF5236))),
      ],
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10, offset: const Offset(0, 4))],
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
          Text(value, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: Color(0xFF1A1F38), height: 1.0)),
          const SizedBox(height: 4),
          Text(title, style: const TextStyle(color: Colors.grey, fontSize: 12, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildChartCard(List<dynamic> trend) {
    if (trend.isEmpty) {
      return const SizedBox(height: 200, child: Center(child: Text('No trend data available')));
    }
    
    final spots = trend.asMap().entries.map((e) {
      final revenue = (e.value['revenue'] ?? 0).toDouble() / 100;
      return FlSpot(e.key.toDouble(), revenue);
    }).toList();

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10, offset: const Offset(0, 4))]
      ),
      child: SizedBox(
        height: 200,
        child: LineChart(
          LineChartData(
            gridData: FlGridData(show: false),
            titlesData: FlTitlesData(
              bottomTitles: AxisTitles(
                sideTitles: SideTitles(
                  showTitles: true,
                  getTitlesWidget: (val, meta) {
                    if (val.toInt() >= 0 && val.toInt() < trend.length) {
                      return Text(trend[val.toInt()]['month'] ?? '', style: const TextStyle(color: Colors.grey, fontSize: 10));
                    }
                    return const SizedBox.shrink();
                  }
                )
              ),
              leftTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
              rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
              topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
            ),
            borderData: FlBorderData(show: false),
            lineBarsData: [
              LineChartBarData(
                spots: spots,
                isCurved: true,
                color: const Color(0xFF006C46),
                barWidth: 4,
                dotData: FlDotData(show: false),
                belowBarData: BarAreaData(
                  show: true, 
                  gradient: LinearGradient(
                    colors: [const Color(0xFF006C46).withOpacity(0.3), Colors.transparent],
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                  )
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAdminMenu(BuildContext context) {
    return Column(
      children: [
        _buildMenuTile(context, 'Edit Membership Tiers', 'Configure pricing and access levels', Icons.layers_rounded, const Color(0xFFFF5236), '/manager/members'),
        const SizedBox(height: 12),
        _buildMenuTile(context, 'Staff & RBAC', 'Manage internal permissions', Icons.admin_panel_settings_rounded, Colors.indigo, '/manager/staff'),
        const SizedBox(height: 12),
        _buildMenuTile(context, 'Financial Reports', 'Export tax and revenue records', Icons.request_quote_rounded, const Color(0xFF006C46), '/manager/reports'),
      ],
    );
  }

  Widget _buildMenuTile(BuildContext context, String title, String subtitle, IconData icon, Color color, String? route) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        leading: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(16)),
          child: Icon(icon, color: color),
        ),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF1A1F38))),
        subtitle: Text(subtitle, style: const TextStyle(color: Colors.grey, fontSize: 13)),
        trailing: const Icon(Icons.chevron_right_rounded, color: Colors.grey),
        onTap: () {
          if (route != null) {
            context.push(route);
          } else {
            ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$title config coming soon')));
          }
        },
      ),
    );
  }
}
