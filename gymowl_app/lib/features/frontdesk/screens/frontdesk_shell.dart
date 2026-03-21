import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class FrontdeskShell extends StatefulWidget {
  final Widget child;
  const FrontdeskShell({super.key, required this.child});

  @override
  State<FrontdeskShell> createState() => _FrontdeskShellState();
}

class _FrontdeskShellState extends State<FrontdeskShell> {
  int _getCurrentIndex(BuildContext context) {
    // Currently only /frontdesk is defined which is the scanner
    final location = GoRouterState.of(context).matchedLocation;
    if (location.startsWith('/frontdesk')) return 0;
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    final currentIndex = _getCurrentIndex(context);

    return Scaffold(
      body: widget.child,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: currentIndex,
        backgroundColor: Colors.deepOrange.shade900,
        unselectedItemColor: Colors.orange.shade200,
        selectedItemColor: Colors.white,
        type: BottomNavigationBarType.fixed,
        onTap: (index) {
          switch (index) {
            case 0:
              context.go('/frontdesk');
              break;
            // Add other cases as sub-routes expand
          }
        },
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.qr_code_scanner), label: 'Scanner'),
          BottomNavigationBarItem(icon: Icon(Icons.book), label: 'Visitors'),
          BottomNavigationBarItem(icon: Icon(Icons.edit), label: 'Manual'),
          BottomNavigationBarItem(icon: Icon(Icons.list_alt), label: "Today's Log"),
        ],
      ),
    );
  }
}
