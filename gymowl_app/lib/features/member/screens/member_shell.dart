import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class MemberShell extends StatefulWidget {
  final Widget child;
  const MemberShell({super.key, required this.child});

  @override
  State<MemberShell> createState() => _MemberShellState();
}

class _MemberShellState extends State<MemberShell> {
  int _getCurrentIndex(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;
    if (location.startsWith('/member/checkin')) return 1;
    return 0; // Default Home
  }

  @override
  Widget build(BuildContext context) {
    final currentIndex = _getCurrentIndex(context);

    return Scaffold(
      extendBody: true,
      body: widget.child,
      bottomNavigationBar: Container(
        margin: const EdgeInsets.only(left: 20, right: 20, bottom: 20),
        height: 68,
        decoration: BoxDecoration(
          color: const Color(0xFF1A1F38),
          borderRadius: BorderRadius.circular(30),
          boxShadow: [
            BoxShadow(color: Colors.black.withOpacity(0.15), blurRadius: 10, offset: const Offset(0, 5))
          ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            _buildNavItem(0, Icons.home_rounded, 'Home', currentIndex == 0),
            _buildNavItem(1, Icons.qr_code_scanner_rounded, 'Check-in', currentIndex == 1),
            _buildNavItem(2, Icons.fitness_center_rounded, 'Workouts', currentIndex == 2),
            _buildNavItem(3, Icons.person_rounded, 'Profile', currentIndex == 3),
          ],
        ),
      ),
    );
  }

  Widget _buildNavItem(int index, IconData icon, String label, bool isSelected) {
    return GestureDetector(
      onTap: () {
        switch (index) {
          case 0: context.go('/member'); break;
          case 1: context.go('/member/checkin'); break;
          case 2: context.go('/member/workouts'); break;
          case 3: context.go('/member/profile'); break;
        }
      },
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: isSelected ? const Color(0xFFFF5722) : Colors.white70, size: 24),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              color: isSelected ? const Color(0xFFFF5722) : Colors.white70,
              fontSize: 10,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
            ),
          ),
        ],
      ),
    );
  }
}
