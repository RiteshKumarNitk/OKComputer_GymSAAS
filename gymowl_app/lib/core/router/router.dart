import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../features/auth/providers/auth_provider.dart';
import '../../features/auth/screens/login_screen.dart';
import '../../features/auth/screens/otp_screen.dart';
import '../../features/auth/screens/splash_screen.dart';
import '../../features/member/screens/member_shell.dart';
import '../../features/trainer/screens/trainer_shell.dart';
import '../../features/manager/screens/manager_shell.dart';
import '../../features/frontdesk/screens/frontdesk_shell.dart';
import '../../features/member/screens/member_home_screen.dart';
import '../../features/member/screens/payment_screen.dart';
import '../../features/member/screens/checkin_screen.dart';

import '../../features/frontdesk/screens/scanner_screen.dart';
import '../../features/frontdesk/screens/frontdesk_dashboard_screen.dart';
import '../../features/frontdesk/screens/member_search_screen.dart';
import '../../features/frontdesk/screens/add_member_screen.dart';
import '../../features/frontdesk/screens/attendance_list_screen.dart';
import '../../features/frontdesk/screens/payments_list_screen.dart';
import '../../features/frontdesk/screens/member_details_screen.dart';
import '../../features/trainer/screens/member_list_screen.dart';
import '../../features/trainer/screens/trainer_dashboard_screen.dart';
import '../../features/trainer/screens/workout_assignment_screen.dart';
import '../../features/manager/screens/manager_dashboard_screen.dart';
import '../../features/manager/screens/members_manage_screen.dart';
import '../../features/manager/screens/reports_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);

  return GoRouter(
    initialLocation: '/splash',
    redirect: (context, state) {
      final loggingIn = state.matchedLocation == '/login';
      final inOtp = state.matchedLocation == '/otp';
      final inSplash = state.matchedLocation == '/splash';
      final loggedIn = authState.user != null;

      if (inSplash && !loggedIn) return null; // Wait on Splash timer
      if (!loggedIn && !loggingIn && !inOtp && !inSplash) return '/login';
      if (loggedIn && (loggingIn || inOtp || inSplash)) {
        switch (authState.user?.role) {
          case 'member':
            return '/member';
          case 'trainer':
            return '/trainer';
          case 'manager':
            return '/manager';
          case 'frontdesk':
            return '/frontdesk';
          case 'tenant':
          case 'gym_owner':
          case 'super_admin':
            return '/manager'; // Map to manager dashboard or similar testing shell
          default:
            return '/login';
        }
      }
      return null;
    },
    routes: [
      GoRoute(
        path: '/splash',
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/otp',
        builder: (context, state) => const OtpScreen(),
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
          GoRoute(path: '/trainer', builder: (context, state) => const TrainerDashboardScreen()),
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
          GoRoute(path: '/manager/reports', builder: (context, state) => const ReportsScreen()),
        ],
      ),
      ShellRoute(
        builder: (context, state, child) => FrontdeskShell(child: child),
        routes: [
          GoRoute(path: '/frontdesk', builder: (context, state) => const FrontdeskDashboardScreen()),
          GoRoute(path: '/frontdesk/scanner', builder: (context, state) => const ScannerScreen()),
          GoRoute(path: '/frontdesk/search', builder: (context, state) => const MemberSearchScreen()),
          GoRoute(path: '/frontdesk/add-member', builder: (context, state) => const AddMemberScreen()),
          GoRoute(path: '/frontdesk/attendance', builder: (context, state) => const AttendanceListScreen()),
          GoRoute(path: '/frontdesk/payments', builder: (context, state) => const PaymentsListScreen()),
          GoRoute(path: '/frontdesk/members/:id', builder: (context, state) {
            final id = state.pathParameters['id']!;
            return MemberDetailsScreen(memberId: id);
          }),
        ],
      ),
    ],
  );
});
