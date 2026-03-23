import 'package:flutter/material.dart';
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
  int _getCurrentIndex(BuildContext context, List<Map<String, dynamic>> items) {
    final location = GoRouterState.of(context).matchedLocation;
    for (int i = 0; i < items.length; i++) {
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
      {'label': 'SCHEDULE', 'icon': Icons.calendar_today_rounded, 'route': '/member/schedule'},
      if (isStaff) {'label': 'OPERATIONS', 'icon': Icons.dashboard_customize_rounded, 'route': '/frontdesk/operations'},
      {'label': 'PROFILE', 'icon': Icons.person_rounded, 'route': isStaff ? '/frontdesk/profile' : '/member/profile'},
    ];

    final currentIndex = _getCurrentIndex(context, navItems);

    return Scaffold(
      backgroundColor: const Color(0xFFF4F6FA),
      extendBody: true,
      body: widget.child,
      bottomNavigationBar: Container(
        margin: const EdgeInsets.only(left: 16, right: 16, bottom: 20),
        height: 68,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(30),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4))],
        ),
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
                padding: EdgeInsets.symmetric(horizontal: isSelected ? 16 : 8, vertical: 8),
                decoration: isSelected
                    ? BoxDecoration(color: const Color(0xFF00E676), borderRadius: BorderRadius.circular(20))
                    : null,
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(item['icon'], color: isSelected ? const Color(0xFF1A1F38) : Colors.grey[500], size: 22),
                    if (isSelected) ...[
                      const SizedBox(width: 8),
                      Text(item['label'], style: const TextStyle(color: Color(0xFF1A1F38), fontSize: 11, fontWeight: FontWeight.bold)),
                    ],
                  ],
                ),
              ),
            );
          }).toList(),
        ),
      ),
    );
  }
}
