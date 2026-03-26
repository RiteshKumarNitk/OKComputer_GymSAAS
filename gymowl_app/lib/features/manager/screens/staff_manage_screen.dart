import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/manager_api_service.dart';

class StaffManageScreen extends ConsumerStatefulWidget {
  const StaffManageScreen({super.key});

  @override
  ConsumerState<StaffManageScreen> createState() => _StaffManageScreenState();
}

class _StaffManageScreenState extends ConsumerState<StaffManageScreen> {
  bool _isLoading = true;
  List<dynamic> _staff = [];

  @override
  void initState() {
    super.initState();
    _fetchStaff();
  }

  Future<void> _fetchStaff() async {
    try {
      final api = ref.read(managerApiServiceProvider);
      final response = await api.getStaffList();
      if (mounted) {
        setState(() {
          _staff = response;
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
      backgroundColor: const Color(0xFFF4F6FA),
      appBar: AppBar(
        title: const Text('Staff & RBAC', style: TextStyle(color: Color(0xFF1A1F38), fontWeight: FontWeight.w900)),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: Color(0xFF1A1F38)),
        actions: [
          IconButton(
            icon: const Icon(Icons.person_add_alt_1_rounded, color: Color(0xFFFF5236)),
            onPressed: () {
               // Future: Add onboarding form
               ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Staff onboarding tool active')));
            },
          )
        ],
      ),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator())
        : ListView.separated(
            padding: const EdgeInsets.all(20),
            itemCount: _staff.length,
            separatorBuilder: (context, index) => const SizedBox(height: 16),
            itemBuilder: (context, index) {
              final s = _staff[index];
              return _buildStaffCard(
                context,
                name: s['fullName'] ?? 'Loading...',
                role: s['role'] ?? 'staff',
                email: s['email'] ?? '',
                status: s['isActive'] == true ? 'Active' : 'Inactive',
                color: (s['role'] == 'trainer') ? const Color(0xFF006C46) : Colors.blueAccent,
                permissions: [s['role']?.toUpperCase() ?? 'ACCESS'],
              );
            },
          ),
    );
  }

  Widget _buildStaffCard(BuildContext context, {
    required String name,
    required String role,
    required String email,
    required String status,
    required Color color,
    required List<String> permissions,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                CircleAvatar(
                  radius: 24,
                  backgroundColor: color.withOpacity(0.1),
                  child: Text(name.substring(0, 1), style: TextStyle(color: color, fontWeight: FontWeight.w900, fontSize: 18)),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Color(0xFF1A1F38))),
                      const SizedBox(height: 4),
                      Text(email, style: const TextStyle(color: Colors.grey, fontSize: 12)),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
                  child: Text(role.toUpperCase(), style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 0.5)),
                )
              ],
            ),
            const SizedBox(height: 16),
            const Divider(),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: permissions.map((p) => Container(
                    margin: const EdgeInsets.only(right: 8),
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(color: const Color(0xFFF4F6FA), borderRadius: BorderRadius.circular(8)),
                    child: Text(p, style: const TextStyle(color: Color(0xFF1A1F38), fontSize: 10, fontWeight: FontWeight.bold)),
                  )).toList(),
                ),
                OutlinedButton(
                  onPressed: () {},
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFF1A1F38),
                    side: BorderSide(color: Colors.grey.shade300),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    minimumSize: Size.zero,
                  ),
                  child: const Text('Edit Access', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                )
              ],
            )
          ],
        ),
      ),
    );
  }
}
