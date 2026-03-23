import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
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
      final response = await apiClient.dio.get('/members/me'); // Or generic profile endpoint
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
      backgroundColor: const Color(0xFF0A0B10), // Ultra Dark Velocity Theme
      appBar: AppBar(
        title: const Text('Athlete Profile', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
        backgroundColor: Colors.transparent, elevation: 0, foregroundColor: Colors.white,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Colors.deepPurpleAccent))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  _buildProfileHeader(),
                  const SizedBox(height: 32),
                  _buildGridStats(),
                  const SizedBox(height: 32),
                  _buildSectionTitle('Active Membership'),
                  const SizedBox(height: 12),
                  _buildMembershipCard(),
                  const SizedBox(height: 32),
                  _buildSectionTitle('Health Metrics'),
                  const SizedBox(height: 12),
                  _buildHealthMetrics(),
                ],
              ),
            ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Align(alignment: Alignment.centerLeft, child: Text(title, style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)));
  }

  Widget _buildProfileHeader() {
    return Row(
      children: [
        const CircleAvatar(radius: 40, backgroundColor: Colors.deepPurpleAccent, child: Icon(Icons.person, color: Colors.white, size: 40)),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(_profile['fullName'] ?? 'Digital Athlete', style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold)),
              const SizedBox(height: 4),
              const Text('Rank: Platinum Tier', style: TextStyle(color: Colors.purpleAccent, fontSize: 13, fontWeight: FontWeight.w500)),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildGridStats() {
    return GridView.count(
      crossAxisCount: 2,
      childAspectRatio: 1.4,
      crossAxisSpacing: 16,
      mainAxisSpacing: 16,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      children: [
        _buildStatCard('Total Workouts', '42', Icons.fitness_center, Colors.deepPurpleAccent),
        _buildStatCard('Active Days', '18', Icons.calendar_today_outlined, Colors.purple),
        _buildStatCard('Avg BPM', '132', Icons.favorite_border_rounded, Colors.redAccent),
        _buildStatCard('Hot Streak', '5 Days', Icons.local_fire_department_rounded, Colors.orangeAccent),
      ],
    );
  }

  Widget _buildStatCard(String label, String value, IconData icon, Color accentColor) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: const Color(0xFF14151F), borderRadius: BorderRadius.circular(20), border: Border.all(color: accentColor.withOpacity(0.15), width: 1)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Row(
            children: [
              Icon(icon, color: accentColor, size: 20),
              const SizedBox(width: 8),
              Expanded(child: Text(label, style: TextStyle(color: Colors.grey[400], fontSize: 12), overflow: TextOverflow.ellipsis)),
            ],
          ),
          const SizedBox(height: 12),
          Text(value, style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildMembershipCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(colors: [Color(0xFF673AB7), Color(0xFF9C27B0)], begin: Alignment.topLeft, end: Alignment.bottomRight),
        borderRadius: BorderRadius.circular(24),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Elite Membership', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
              Container(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4), decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(12)), child: const Text('ACTIVE', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold))),
            ],
          ),
          const SizedBox(height: 20),
          Text('Expires: Dec 20, 2026', style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 13)),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () {},
            style: ElevatedButton.styleFrom(backgroundColor: Colors.white, foregroundColor: Colors.deepPurple, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)), padding: const EdgeInsets.symmetric(vertical: 14)),
            child: const Text('Upgrade / Renew Plan', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  Widget _buildHealthMetrics() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: const Color(0xFF14151F), borderRadius: BorderRadius.circular(20)),
      child: Column(
        children: [
          _buildDetailRow(Icons.height, 'Height', '180 cm'),
          const Divider(color: Colors.white10, height: 24),
          _buildDetailRow(Icons.monitor_weight_outlined, 'Weight', '75 kg'),
          const Divider(color: Colors.white10, height: 24),
          _buildDetailRow(Icons.opacity, 'Body Fat', '14.5%'),
        ],
      ),
    );
  }

  Widget _buildDetailRow(IconData icon, String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(children: [Icon(icon, color: Colors.purpleAccent, size: 18), const SizedBox(width: 12), Text(label, style: TextStyle(color: Colors.grey[400], fontSize: 14))]),
        Text(value, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
      ],
    );
  }
}
