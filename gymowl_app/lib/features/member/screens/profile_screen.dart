import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/api/api_client.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  bool _isLoading = true;
  Map<String, dynamic> _profile = {};

  @override
  void initState() {
    super.initState();
    _fetchProfile();
  }

  Future<void> _fetchProfile() async {
    try {
      final apiClient = ref.read(apiClientProvider);
      final response = await apiClient.dio.get('/members/me'); 
      if (mounted) {
        setState(() {
          _profile = response.data;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F6FA), // Light Gray Theme Background
      appBar: AppBar(
        title: const Text('Profile', style: TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF1A1F38))),
        backgroundColor: const Color(0xFFF4F6FA),
        elevation: 0,
        actions: [
          IconButton(
            onPressed: () {},
            icon: const Icon(Icons.edit_rounded, color: Color(0xFF1A1F38)),
          ),
          IconButton(
            onPressed: () {},
            icon: const Icon(Icons.notifications_none_rounded, color: Color(0xFF1A1F38)),
          ),
        ],
      ),
      body: Stack(
        children: [
          // Main Scrollable Content
          _isLoading
              ? const Center(child: CircularProgressIndicator(color: Color(0xFFFF6D43)))
              : SingleChildScrollView(
                  padding: const EdgeInsets.only(left: 16, right: 16, top: 8, bottom: 100), // padding bottom for pill
                  child: Column(
                    children: [
                      _buildProfileHeader(),
                      const SizedBox(height: 16),
                      _buildMenuSection([
                        _MenuItem(
                          title: 'Metric Log',
                          icon: Icons.show_chart_rounded,
                          route: '/member/metric-log',
                        ),
                      ]),
                      const SizedBox(height: 16),
                      _buildMenuSection([
                        _MenuItem(
                          title: 'Membership',
                          icon: Icons.card_membership_rounded,
                          route: '/member/membership',
                        ),
                        _MenuItem(
                          title: 'Payments',
                          icon: Icons.account_balance_wallet_outlined,
                          route: '/member/payment',
                        ),
                        _MenuItem(
                          title: 'Report Card',
                          icon: Icons.assignment_ind_outlined,
                          route: '/member/report-card',
                        ),
                        _MenuItem(
                          title: 'Health Assessment',
                          icon: Icons.favorite_border_rounded,
                          route: '/member/health-assessment',
                        ),
                      ]),
                      const SizedBox(height: 16),
                      _buildMenuSection([
                        _MenuItem(
                          title: 'Help & Support',
                          icon: Icons.help_outline_rounded,
                          route: '/member/help-support',
                        ),
                        _MenuItem(
                          title: 'Business Request',
                          icon: Icons.business_center_outlined,
                          route: '/member/business-request',
                        ),
                        _MenuItem(
                          title: 'Settings',
                          icon: Icons.settings_outlined,
                          route: '/member/settings',
                        ),
                      ]),
                    ],
                  ),
                ),
                
          // Floating Club Pillar
          Align(
            alignment: Alignment.bottomCenter,
            child: Padding(
              padding: const EdgeInsets.only(bottom: 24.0),
              child: _buildFloatingClubPill(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProfileHeader() {
    final String name = _profile['fullName'] ?? 'Athlete Name';
    final String phone = _profile['phone'] ?? '0000000000';
    
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFFF7B54), Color(0xFFFF5236)], 
          begin: Alignment.centerLeft, 
          end: Alignment.centerRight
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFFF5236).withOpacity(0.3), 
            blurRadius: 15, 
            offset: const Offset(0, 8)
          )
        ],
      ),
      child: Stack(
        children: [
          // Faint overlay icon for pattern if needed
          Positioned(
            right: -20,
            bottom: -20,
            child: Icon(Icons.fitness_center_rounded, size: 100, color: Colors.white.withOpacity(0.1)),
          ),
          Row(
            children: [
              Stack(
                children: [
                  CircleAvatar(
                    radius: 36,
                    backgroundColor: Colors.white.withOpacity(0.2),
                    child: const CircleAvatar(
                      radius: 32,
                      backgroundColor: Colors.white,
                      child: Icon(Icons.person, color: Colors.grey, size: 36),
                    ),
                  ),
                  Positioned(
                    bottom: 0,
                    right: 0,
                    child: Container(
                      padding: const EdgeInsets.all(2),
                      decoration: const BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.check_circle_rounded, color: Color(0xFFFF5236), size: 18),
                    ),
                  )
                ],
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(name, style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    Text('Member - $phone', style: TextStyle(color: Colors.white.withOpacity(0.9), fontSize: 13, fontWeight: FontWeight.w500)),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMenuSection(List<_MenuItem> items) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.01), blurRadius: 10, offset: const Offset(0, 4))
        ],
      ),
      child: Column(
        children: items.asMap().entries.map((entry) {
          final index = entry.key;
          final item = entry.value;
          return Column(
            children: [
              ListTile(
                contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
                leading: Icon(item.icon, color: Colors.grey.shade600, size: 22),
                title: Text(item.title, style: const TextStyle(color: Color(0xFF1A1F38), fontSize: 15, fontWeight: FontWeight.bold)),
                trailing: Icon(Icons.chevron_right_rounded, color: Colors.grey.shade400, size: 22),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                onTap: () => context.go(item.route),
              ),
              if (index < items.length - 1)
                Divider(height: 1, thickness: 1, color: Colors.grey.shade100, indent: 56, endIndent: 20),
            ],
          );
        }).toList(),
      ),
    );
  }

  Widget _buildFloatingClubPill() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFFF7B54), Color(0xFFFF5236)], 
          begin: Alignment.centerLeft, 
          end: Alignment.centerRight
        ),
        borderRadius: BorderRadius.circular(30),
        boxShadow: [
          BoxShadow(color: const Color(0xFFFF5236).withOpacity(0.3), blurRadius: 10, offset: const Offset(0, 4))
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(4),
            decoration: const BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.fitness_center_rounded, color: Color(0xFFFF5236), size: 14),
          ),
          const SizedBox(width: 12),
          const Text('Fit Vision Fitness Club', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
          const SizedBox(width: 8),
          const Icon(Icons.keyboard_arrow_down_rounded, color: Colors.white, size: 18),
        ],
      ),
    );
  }
}

class _MenuItem {
  final String title;
  final IconData icon;
  final String route;

  _MenuItem({
    required this.title,
    required this.icon,
    required this.route,
  });
}
