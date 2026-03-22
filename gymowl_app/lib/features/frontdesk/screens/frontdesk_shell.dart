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
    final location = GoRouterState.of(context).matchedLocation;
    if (location == '/frontdesk/scanner') return 1;
    return 0; // Default to Dashboard (/frontdesk)
  }

  @override
  Widget build(BuildContext context) {
    final currentIndex = _getCurrentIndex(context);

    return Scaffold(
      extendBody: true,
      body: widget.child,
      bottomNavigationBar: Container(
        margin: const EdgeInsets.fromLTRB(16, 0, 16, 16),
        decoration: BoxDecoration(
          color: const Color(0xFF1A1F38),
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.2),
              blurRadius: 15,
              offset: const Offset(0, 5),
            )
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(24),
          child: BottomNavigationBar(
            currentIndex: currentIndex,
            backgroundColor: Colors.transparent,
            elevation: 0,
            selectedItemColor: Colors.orangeAccent,
            unselectedItemColor: Colors.grey[400],
            type: BottomNavigationBarType.fixed,
            onTap: (index) {
              switch (index) {
                case 0:
                  context.go('/frontdesk');
                  break;
                case 1:
                  context.go('/frontdesk/scanner');
                  break;
              }
            },
            items: const [
              BottomNavigationBarItem(icon: Icon(Icons.dashboard_outlined), label: 'Operations'),
              BottomNavigationBarItem(icon: Icon(Icons.qr_code_scanner), label: 'Scanner'),
            ],
          ),
        ),
      ),
    );
  }
}
