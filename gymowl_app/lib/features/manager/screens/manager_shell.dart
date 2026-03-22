import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class ManagerShell extends StatefulWidget {
  final Widget child;
  const ManagerShell({super.key, required this.child});

  @override
  State<ManagerShell> createState() => _ManagerShellState();
}

class _ManagerShellState extends State<ManagerShell> {
  int _getCurrentIndex(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;
    if (location.startsWith('/manager/members')) return 1;
    if (location.startsWith('/manager/reports')) return 2;
    return 0; // Default Dashboard
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
            _buildNavItem(0, Icons.insert_chart_rounded, 'Dashboard', currentIndex == 0),
            _buildNavItem(1, Icons.people_rounded, 'Members', currentIndex == 1),
            _buildNavItem(2, Icons.analytics_rounded, 'Analytics', currentIndex == 2),
          ],
        ),
      ),
    );
  }

  Widget _buildNavItem(int index, IconData icon, String label, bool isSelected) {
    return GestureDetector(
      onTap: () {
        switch (index) {
          case 0: context.go('/manager'); break;
          case 1: context.go('/manager/members'); break;
          case 2: context.go('/manager/reports'); break;
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
