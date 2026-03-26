import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../providers/frontdesk_providers.dart';

class FrontdeskDashboardScreen extends ConsumerWidget {
  const FrontdeskDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final statsAsync = ref.watch(frontdeskDashboardStatsProvider);
    final activityAsync = ref.watch(recentActivityProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF4F6FA),
      appBar: AppBar(
        title: const Text('Ops Center', style: TextStyle(color: Color(0xFF1A1F38), fontWeight: FontWeight.w900, fontSize: 24)),
        backgroundColor: const Color(0xFFF4F6FA),
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: Color(0xFF1A1F38)), 
            onPressed: () {
              ref.invalidate(frontdeskDashboardStatsProvider);
              ref.invalidate(recentActivityProvider);
            }
          ),
          Padding(
            padding: const EdgeInsets.only(right: 16.0),
            child: CircleAvatar(
              radius: 18,
              backgroundColor: const Color(0xFF1A1F38),
              child: const Icon(Icons.support_agent_rounded, color: Colors.white, size: 20),
            ),
          )
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(frontdeskDashboardStatsProvider);
          ref.invalidate(recentActivityProvider);
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(20),
          child: Column(
            children: [
              statsAsync.when(
                loading: () => _buildLoadingCapacity(),
                error: (err, _) => Center(child: Text('Error: $err')),
                data: (stats) => _buildCapacityMeter(stats),
              ),
              const SizedBox(height: 24),
              _buildQuickActions(context),
              const SizedBox(height: 32),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Live Check-ins', style: TextStyle(color: Color(0xFF1A1F38), fontWeight: FontWeight.w900, fontSize: 18)),
                  TextButton(onPressed: () {}, child: const Text('View All', style: TextStyle(color: Color(0xFF006C46), fontWeight: FontWeight.bold))),
                ],
              ),
              const SizedBox(height: 16),
              activityAsync.when(
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (err, _) => Center(child: Text('Error: $err')),
                data: (activity) => _buildCheckinFeed(activity),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLoadingCapacity() {
    return Container(
      height: 160,
      width: double.infinity,
      decoration: BoxDecoration(color: const Color(0xFF1A1F38), borderRadius: BorderRadius.circular(24)),
      child: const Center(child: CircularProgressIndicator(color: Colors.white24)),
    );
  }

  Widget _buildCapacityMeter(Map<String, dynamic> stats) {
    final activeCount = stats['totalMembers'] ?? 0; // Or attendanceToday if available
    final totalMembers = stats['totalMembers'] ?? 150;
    final progress = (totalMembers > 0) ? activeCount / totalMembers : 0.0;
    
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
              const Text('CURRENT CAPACITY', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1.2)),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: (progress < 0.8) ? Colors.greenAccent.withOpacity(0.2) : Colors.orangeAccent.withOpacity(0.2), 
                  borderRadius: BorderRadius.circular(12)
                ),
                child: Text(
                  (progress < 0.8) ? 'OPTIMAL' : 'HIGH LOAD', 
                  style: TextStyle(color: (progress < 0.8) ? Colors.greenAccent : Colors.orangeAccent, fontSize: 10, fontWeight: FontWeight.w900)
                ),
              )
            ],
          ),
          const SizedBox(height: 16),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text('$activeCount', style: const TextStyle(color: Colors.white, fontSize: 48, fontWeight: FontWeight.w900, height: 1.0)),
              const SizedBox(width: 8),
              Padding(
                padding: const EdgeInsets.only(bottom: 8.0),
                child: Text('/ $totalMembers members', style: const TextStyle(color: Colors.white54, fontSize: 16, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
          const SizedBox(height: 24),
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: LinearProgressIndicator(
              value: progress.toDouble(),
              backgroundColor: Colors.white.withOpacity(0.1),
              valueColor: AlwaysStoppedAnimation<Color>(progress > 0.9 ? Colors.redAccent : const Color(0xFFFF5236)),
              minHeight: 8,
            ),
          )
        ],
      ),
    );
  }

  Widget _buildQuickActions(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Quick Actions', style: TextStyle(color: Color(0xFF1A1F38), fontWeight: FontWeight.w900, fontSize: 18)),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: _buildActionBtn(
                context, 
                title: 'Scan QR\nPass', 
                icon: Icons.qr_code_scanner_rounded, 
                color: const Color(0xFFFF5236),
                route: '/frontdesk/scanner',
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: _buildActionBtn(
                context, 
                title: 'Member\nDirectory', 
                icon: Icons.people_alt_rounded, 
                color: const Color(0xFF006C46),
                route: '/frontdesk/search',
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: _buildActionBtn(
                context, 
                title: 'Sell Day\nPass', 
                icon: Icons.point_of_sale_rounded, 
                color: Colors.blueAccent,
                route: null,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildActionBtn(BuildContext context, {required String title, required IconData icon, required Color color, required String? route}) {
    return GestureDetector(
      onTap: () {
        if (route != null) {
          context.push(route);
        } else {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$title coming soon')));
        }
      },
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 10, offset: const Offset(0, 4))],
        ),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: color.withOpacity(0.1), shape: BoxShape.circle),
              child: Icon(icon, color: color, size: 28),
            ),
            const SizedBox(height: 12),
            Text(title, textAlign: TextAlign.center, style: const TextStyle(color: Color(0xFF1A1F38), fontSize: 13, fontWeight: FontWeight.bold, height: 1.2)),
          ],
        ),
      ),
    );
  }

  Widget _buildCheckinFeed(List<Map<String, dynamic>> activity) {
    if (activity.isEmpty) {
      return const Center(child: Text('No activity today', style: TextStyle(color: Colors.grey)));
    }
    return Column(
      children: activity.map((a) {
        final memberName = a['member']?['fullName'] ?? 'Unknown';
        final memberId = a['member']?['memberCode'] ?? 'ID';
        final checkinTime = a['checkinAt'] != null 
            ? DateFormat('hh:mm a').format(DateTime.parse(a['checkinAt']))
            : 'Now';
            
        return Padding(
          padding: const EdgeInsets.only(bottom: 12.0),
          child: _buildFeedItem(memberName, memberId, checkinTime, true),
        );
      }).toList(),
    );
  }

  Widget _buildFeedItem(String name, String id, String time, bool success) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: success ? Colors.transparent : Colors.redAccent.withOpacity(0.3), width: 2),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(color: success ? const Color(0xFF006C46).withOpacity(0.1) : Colors.redAccent.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
            child: Icon(success ? Icons.check_circle_rounded : Icons.cancel_rounded, color: success ? const Color(0xFF006C46) : Colors.redAccent),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: const TextStyle(color: Color(0xFF1A1F38), fontWeight: FontWeight.bold, fontSize: 15)),
                const SizedBox(height: 4),
                Text(success ? id : 'Billing Failed - $id', style: TextStyle(color: success ? Colors.grey : Colors.redAccent, fontSize: 13, fontWeight: success ? FontWeight.normal : FontWeight.bold)),
              ],
            ),
          ),
          Text(time, style: const TextStyle(color: Color(0xFF1A1F38), fontWeight: FontWeight.w900, fontSize: 13)),
        ],
      ),
    );
  }
}
