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
    return 0; // Default Dashboard
  }

  @override
  Widget build(BuildContext context) {
    final currentIndex = _getCurrentIndex(context);

    return Scaffold(
      body: widget.child,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: currentIndex,
        backgroundColor: Colors.brown.shade900,
        unselectedItemColor: Colors.orange.shade200,
        selectedItemColor: Colors.orange,
        type: BottomNavigationBarType.fixed,
        onTap: (index) {
          switch (index) {
            case 0:
              context.go('/manager');
              break;
            case 1:
              context.go('/manager/members');
              break;
            // Add other cases as sub-routes expand
          }
        },
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.analytics), label: 'Dashboard'),
          BottomNavigationBarItem(icon: Icon(Icons.people), label: 'Members'),
          BottomNavigationBarItem(icon: Icon(Icons.check_circle), label: 'Attendance'),
          BottomNavigationBarItem(icon: Icon(Icons.insert_chart), label: 'Reports'),
          BottomNavigationBarItem(icon: Icon(Icons.badge), label: 'Staff'),
        ],
      ),
    );
  }
}
