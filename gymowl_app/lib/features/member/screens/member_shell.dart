import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../auth/providers/auth_provider.dart';

class MemberShell extends ConsumerStatefulWidget {
  final Widget child;
  const MemberShell({super.key, required this.child});

  @override
  ConsumerState<MemberShell> createState() => _MemberShellState();
}

class _MemberShellState extends ConsumerState<MemberShell> {
  DateTime? _lastPressedAt;

  int _getCurrentIndex(BuildContext context, List<Map<String, dynamic>> items) {
    final location = GoRouterState.of(context).matchedLocation;
    for (int i = items.length - 1; i >= 0; i--) {
         if (location.startsWith(items[i]['route'])) return i;
    }
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final role = authState.user?.role ?? 'member';
    final isStaff = role == 'frontdesk' || role == 'manager';

    final List<Map<String, dynamic>> navItems = [
      {'label': 'HOME', 'icon': Icons.home_rounded, 'route': isStaff ? '/frontdesk' : '/member'},
      {'label': 'WORKOUTS', 'icon': Icons.fitness_center_rounded, 'route': '/member/workouts'},
      {'label': 'TOOLS', 'icon': Icons.grid_view_rounded, 'route': '/member/tools'},
      if (isStaff) {'label': 'OPERATIONS', 'icon': Icons.dashboard_customize_rounded, 'route': '/frontdesk/operations'},
      {'label': 'PROFILE', 'icon': Icons.person_rounded, 'route': isStaff ? '/frontdesk/profile' : '/member/profile'},
    ];

    final currentIndex = _getCurrentIndex(context, navItems);

    return PopScope(
      canPop: false,
      onPopInvoked: (didPop) {
        if (didPop) return;
        final now = DateTime.now();
        if (_lastPressedAt == null || now.difference(_lastPressedAt!) > const Duration(seconds: 2)) {
          _lastPressedAt = now;
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Press back again to exit'),
              duration: Duration(seconds: 2),
            ),
          );
        } else {
          SystemNavigator.pop();
        }
      },
      child: Scaffold(
        backgroundColor: const Color(0xFFF4F6FA),
        body: widget.child,
        bottomNavigationBar: Container(
          decoration: BoxDecoration(
            color: Colors.white,
            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, -4))],
          ),
          child: SafeArea(
            child: Container(
              height: 68,
              padding: const EdgeInsets.symmetric(horizontal: 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: navItems.asMap().entries.map((entry) {
                  final index = entry.key;
                  final item = entry.value;
                  final isSelected = index == currentIndex;

                  return GestureDetector(
                    onTap: () => context.go(item['route']),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      padding: EdgeInsets.symmetric(horizontal: isSelected ? 16 : 12, vertical: 10),
                      decoration: isSelected
                          ? BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(20))
                          : null,
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(item['icon'], color: isSelected ? Colors.black : Colors.grey[400], size: 24),
                          if (isSelected) ...[
                            const SizedBox(width: 8),
                            Text(item['label'], style: const TextStyle(color: Colors.black, fontSize: 12, fontWeight: FontWeight.bold)),
                          ],
                        ],
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
