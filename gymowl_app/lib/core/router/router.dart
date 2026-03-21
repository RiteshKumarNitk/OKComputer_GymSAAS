import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../features/auth/providers/auth_provider.dart';
import '../../features/auth/screens/login_screen.dart';
import '../../features/member/screens/member_shell.dart';
import '../../features/trainer/screens/trainer_shell.dart';
import '../../features/manager/screens/manager_shell.dart';
import '../../features/frontdesk/screens/frontdesk_shell.dart';
import '../../features/member/screens/member_home_screen.dart';
import '../../features/member/screens/payment_screen.dart';
import '../../features/member/screens/checkin_screen.dart';

import '../../features/frontdesk/screens/scanner_screen.dart';
import '../../features/trainer/screens/member_list_screen.dart';
import '../../features/trainer/screens/workout_assignment_screen.dart';
import '../../features/manager/screens/manager_dashboard_screen.dart';
import '../../features/manager/screens/members_manage_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);

  return GoRouter(
    initialLocation: '/login',
    redirect: (context, state) {
      final loggingIn = state.matchedLocation == '/login';
      final loggedIn = authState.role != null;

      if (!loggedIn && !loggingIn) return '/login';
      if (loggedIn && loggingIn) {
        switch (authState.role) {
          case 'member':
            return '/member';
          case 'trainer':
            return '/trainer';
          case 'manager':
            return '/manager';
          case 'frontdesk':
            return '/frontdesk';
          default:
            return '/login';
        }
      }
      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      ShellRoute(
        builder: (context, state, child) => MemberShell(child: child),
        routes: [
          GoRoute(path: '/member', builder: (context, state) => const MemberHomeScreen()),
          GoRoute(path: '/member/checkin', builder: (context, state) => const CheckinScreen()),
          GoRoute(path: '/member/payment', builder: (context, state) => const PaymentScreen()),
        ],
      ),
      ShellRoute(
        builder: (context, state, child) => TrainerShell(child: child),
        routes: [
          GoRoute(path: '/trainer', builder: (context, state) => const Scaffold(body: Center(child: Text('Trainer Dashboard')))),
          GoRoute(path: '/trainer/members', builder: (context, state) => const MemberListScreen()),
          GoRoute(path: '/trainer/members/:id/assign', builder: (context, state) {
            final id = state.pathParameters['id']!;
            return WorkoutAssignmentScreen(memberId: id);
          }),
        ],
      ),
      ShellRoute(
        builder: (context, state, child) => ManagerShell(child: child),
        routes: [
          GoRoute(path: '/manager', builder: (context, state) => const ManagerDashboardScreen()),
          GoRoute(path: '/manager/members', builder: (context, state) => const MembersManageScreen()),
        ],
      ),
      ShellRoute(
        builder: (context, state, child) => FrontdeskShell(child: child),
        routes: [
          GoRoute(path: '/frontdesk', builder: (context, state) => const ScannerScreen()),
        ],
      ),
    ],
  );
});
