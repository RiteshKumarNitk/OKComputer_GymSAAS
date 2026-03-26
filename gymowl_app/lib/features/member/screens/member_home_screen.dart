import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../auth/providers/auth_provider.dart';

class MemberHomeScreen extends ConsumerWidget {
  const MemberHomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final user = authState.user;
    final isStaff = user?.role == 'frontdesk' || user?.role == 'manager';

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FE), // Vitality Mint Background
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 50),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildTopAppBar(),
            const SizedBox(height: 32),
            _buildGreeting(user?.fullName ?? 'Athlete'),
            const SizedBox(height: 24),
            _buildQuickCheckIn(context, isStaff),
            const SizedBox(height: 24),
            _buildUpcomingSession(),
            const SizedBox(height: 24),
            _buildFitnessTools(context),
            const SizedBox(height: 32),
            _buildSectionTitle('Weekly Activity'),
            const SizedBox(height: 12),
            _buildActivityCard(),
            const SizedBox(height: 32),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Classes', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Color(0xFF1A1F38))),
                TextButton(onPressed: () {}, child: const Text('See all', style: TextStyle(color: Colors.green, fontWeight: FontWeight.bold))),
              ],
            ),
            const SizedBox(height: 12),
            _buildClassItem('Advanced Hatha Yoga', '18:30 • Studio A', 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?fit=crop&w=100&q=80'),
            const SizedBox(height: 12),
            _buildClassItem('Metabolic Burn', '20:00 • Performance Lab', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?fit=crop&w=100&q=80'),
          ],
        ),
      ),
    );
  }

  Widget _buildTopAppBar() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: const [
             CircleAvatar(radius: 18, backgroundColor: Colors.orangeAccent, child: Icon(Icons.person, color: Colors.white, size: 20)),
             SizedBox(width: 12),
             Text('Digital Athlete', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: Color(0xFF1A1F38))),
          ],
        ),
        IconButton(onPressed: () {}, icon: const Icon(Icons.notifications_none_rounded, color: Colors.grey)),
      ],
    );
  }

  Widget _buildGreeting(String name) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Welcome back,', style: TextStyle(color: const Color(0xFF1A1F38), fontSize: 28, fontWeight: FontWeight.w900)),
        Text('$name!', style: TextStyle(color: const Color(0xFF1A1F38), fontSize: 28, fontWeight: FontWeight.w900)),
        const SizedBox(height: 4),
        const Text('Your elite performance journey continues today.', style: TextStyle(color: Colors.grey, fontSize: 13)),
      ],
    );
  }

  Widget _buildQuickCheckIn(BuildContext context, bool isStaff) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: const Color(0xFF67FFB9), // Mint Green
        borderRadius: BorderRadius.circular(24),
        boxShadow: [BoxShadow(color: Colors.greenAccent.withOpacity(0.2), blurRadius: 15, offset: const Offset(0, 8))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(isStaff ? 'STAFF DESK' : 'DAILY ACCESS', style: const TextStyle(color: Colors.green, fontWeight: FontWeight.bold, fontSize: 11, letterSpacing: 1.2)),
          const SizedBox(height: 8),
          Text(isStaff ? 'Launch Scanner' : 'Quick Check-In', style: const TextStyle(color: Color(0xFF1A1F38), fontWeight: FontWeight.w900, fontSize: 24)),
          const SizedBox(height: 20),
          ElevatedButton.icon(
            onPressed: () => context.go(isStaff ? '/frontdesk/scanner' : '/member/checkin'),
            icon: Icon(isStaff ? Icons.qr_code_scanner_rounded : Icons.qr_code_2_rounded, color: Colors.white),
            label: Text(isStaff ? 'Open QR Scanner' : 'Generate QR Code', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF006C46), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)), padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14)),
          ),
        ],
      ),
    );
  }

  Widget _buildUpcomingSession() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(24), boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10, offset: const Offset(0, 4))]),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: const [
                    Icon(Icons.circle, color: Colors.red, size: 8),
                    SizedBox(width: 8),
                    Text('UPCOMING SESSION', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold, fontSize: 11)),
                  ],
                ),
                const SizedBox(height: 12),
                const Text('Personal Training', style: TextStyle(color: Color(0xFF1A1F38), fontWeight: FontWeight.w800, fontSize: 16)),
                const SizedBox(height: 12),
                Row(
                   children: const [
                     Icon(Icons.person, color: Colors.grey, size: 16),
                     SizedBox(width: 8),
                     Text('Coach Marcus', style: TextStyle(color: Colors.grey, fontSize: 13)),
                   ],
                ),
              ],
            ),
          ),
          const Text('00:58 min', style: TextStyle(color: Color(0xFF006C46), fontWeight: FontWeight.w900, fontSize: 26)),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(title, style: const TextStyle(color: Color(0xFF1A1F38), fontSize: 18, fontWeight: FontWeight.w900));
  }

  Widget _buildActivityCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(24), boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10, offset: const Offset(0, 4))]),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
               Column(
                 crossAxisAlignment: CrossAxisAlignment.start,
                 children: const [
                   Text('Intensity minutes vs. Goal', style: TextStyle(color: Colors.grey, fontSize: 12)),
                 ],
               ),
               Container(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4), decoration: BoxDecoration(color: Colors.blue.shade50, borderRadius: BorderRadius.circular(12)), child: const Text('THIS WEEK', style: TextStyle(color: Colors.blueAccent, fontSize: 11, fontWeight: FontWeight.bold))),
            ],
          ),
          const SizedBox(height: 32),
          SizedBox(
            height: 100,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                _buildBar(0.4, 'MON'),
                _buildBar(0.6, 'TUE'),
                _buildBar(0.9, 'WED', isActive: true),
                _buildBar(0.5, 'THU'),
                _buildBar(0.3, 'FRI'),
                _buildBar(0.8, 'SAT'),
                _buildBar(0.2, 'SUN'),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBar(double heightFactor, String label, {bool isActive = false}) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.end,
      children: [
        Expanded(
          child: Container(
            width: 16,
            margin: const EdgeInsets.only(bottom: 8),
            decoration: BoxDecoration(
              color: isActive ? const Color(0xFF006C46) : Colors.grey.shade100,
              borderRadius: BorderRadius.circular(8),
            ),
            child: FractionallySizedBox(heightFactor: heightFactor, alignment: Alignment.bottomCenter, child: Container()),
          ),
        ),
        Text(label, style: TextStyle(color: Colors.grey, fontSize: 9, fontWeight: isActive ? FontWeight.bold : FontWeight.normal)),
      ],
    );
  }

  Widget _buildClassItem(String title, String time, String imageUrl) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20), boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.01), blurRadius: 8)]),
      child: Row(
        children: [
          ClipRRect(borderRadius: BorderRadius.circular(16), child: Image.network(imageUrl, width: 50, height: 50, fit: BoxFit.cover)),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF1A1F38))),
                const SizedBox(height: 6),
                Text(time, style: const TextStyle(color: Colors.grey, fontSize: 12)),
              ],
            ),
          ),
          const Icon(Icons.chevron_right_rounded, color: Colors.grey),
        ],
      ),
    );
  }

  Widget _buildFitnessTools(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Fitness Tools', style: TextStyle(color: Color(0xFF1A1F38), fontSize: 18, fontWeight: FontWeight.w900)),
        const SizedBox(height: 12),
        SizedBox(
          height: 120,
          child: ListView(
            scrollDirection: Axis.horizontal,
            children: [
              _buildToolCard(context, 'Calories Calculator', 'Calculate your BMR', Icons.calculate_rounded, Colors.orangeAccent, '/member/calories-calculator'),
              const SizedBox(width: 16),
              _buildToolCard(context, 'BMI Calculator', 'Check your BMI', Icons.monitor_weight_rounded, const Color(0xFF006C46), '/member/bmi-calculator'),
              const SizedBox(width: 16),
              _buildToolCard(context, 'Water Reminder', 'Track daily hydration', Icons.water_drop_rounded, Colors.blueAccent, '/member/water-reminder'),
            ]
          )
        ),
      ],
    );
  }

  Widget _buildToolCard(BuildContext context, String title, String subtitle, IconData icon, Color color, String route) {
    return Container(
      width: 250,
      decoration: BoxDecoration(
        color: Colors.white, 
        borderRadius: BorderRadius.circular(24), 
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10, offset: const Offset(0, 4))]
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(24),
          onTap: () => context.go(route),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(16)),
                  child: Icon(icon, color: color, size: 28),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(title, style: const TextStyle(color: Color(0xFF1A1F38), fontWeight: FontWeight.w800, fontSize: 15)),
                      const SizedBox(height: 4),
                      Text(subtitle, style: const TextStyle(color: Colors.grey, fontSize: 11)),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
