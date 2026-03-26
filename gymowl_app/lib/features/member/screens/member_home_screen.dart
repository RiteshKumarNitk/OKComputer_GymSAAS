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
      backgroundColor: const Color(0xFFF4F6FA), // Match profile screen light gray
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildPremiumHeader(context, user?.fullName ?? 'Athlete'),
            Padding( // Content below header
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildQuickCheckIn(context, isStaff),
                  const SizedBox(height: 24),
                  _buildUpcomingSession(),
                  const SizedBox(height: 32),
                  _buildSectionTitle('Weekly Activity'),
                  const SizedBox(height: 16),
                  _buildActivityCard(),
                  const SizedBox(height: 32),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Classes', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Color(0xFF1A1F38))),
                      TextButton(
                        onPressed: () => context.push('/member/classes'), 
                        child: const Text('See all', style: TextStyle(color: Color(0xFF006C46), fontWeight: FontWeight.bold))
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  _buildClassItem('Advanced Hatha Yoga', '18:30 • Studio A', 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?fit=crop&w=100&q=80'),
                  const SizedBox(height: 12),
                  _buildClassItem('Metabolic Burn', '20:00 • Performance Lab', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?fit=crop&w=100&q=80'),
                  const SizedBox(height: 40), // Bottom padding
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPremiumHeader(BuildContext context, String name) {
    return Container(
      padding: const EdgeInsets.only(top: 60, left: 24, right: 24, bottom: 32),
      decoration: const BoxDecoration(
        color: Color(0xFF1A1F38), // Deep navy background for the header
        borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(30),
          bottomRight: Radius.circular(30),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.all(2),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white.withOpacity(0.2), width: 2),
                ),
                child: const CircleAvatar(
                  radius: 20,
                  backgroundColor: Color(0xFFFF5236), // Vibrant Orange
                  child: Icon(Icons.person, color: Colors.white, size: 24),
                ),
              ),
              IconButton(onPressed: () {}, icon: const Icon(Icons.notifications_none_rounded, color: Colors.white)),
            ],
          ),
          const SizedBox(height: 24),
          const Text('Welcome back,', style: TextStyle(color: Colors.white70, fontSize: 16)),
          const SizedBox(height: 4),
          Text(name, style: const TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.w900, height: 1.1)),
        ],
      ),
    );
  }

  Widget _buildQuickCheckIn(BuildContext context, bool isStaff) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFFF7B54), Color(0xFFFF5236)], 
          begin: Alignment.centerLeft, 
          end: Alignment.centerRight
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [BoxShadow(color: const Color(0xFFFF5236).withOpacity(0.3), blurRadius: 15, offset: const Offset(0, 8))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(isStaff ? 'STAFF DESK' : 'DAILY ACCESS', style: const TextStyle(color: Colors.white70, fontWeight: FontWeight.bold, fontSize: 11, letterSpacing: 1.2)),
          const SizedBox(height: 8),
          Text(isStaff ? 'Launch Scanner' : 'Quick Check-In', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 24)),
          const SizedBox(height: 20),
          ElevatedButton.icon(
            onPressed: () => context.go(isStaff ? '/frontdesk/scanner' : '/member/checkin'),
            icon: Icon(isStaff ? Icons.qr_code_scanner_rounded : Icons.qr_code_2_rounded, color: const Color(0xFFFF5236)),
            label: Text(isStaff ? 'Open QR Scanner' : 'Generate QR Code', style: const TextStyle(color: Color(0xFFFF5236), fontWeight: FontWeight.bold)),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)), padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14)),
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
        Text(label, style: TextStyle(color: isActive ? const Color(0xFF006C46) : Colors.grey, fontSize: 10, fontWeight: FontWeight.bold)),
      ],
    );
  }

  Widget _buildClassItem(String title, String time, String imageUrl) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20), boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10, offset: const Offset(0, 4))]),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: Image.network(imageUrl, width: 60, height: 60, fit: BoxFit.cover),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF1A1F38))),
                const SizedBox(height: 4),
                Text(time, style: const TextStyle(color: Colors.grey, fontSize: 13, fontWeight: FontWeight.w500)),
              ],
            ),
          ),
          IconButton(onPressed: () {}, icon: const Icon(Icons.chevron_right_rounded, color: Colors.grey)),
        ],
      ),
    );
  }
}
