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
import '../../features/member/screens/profile_screen.dart';
import '../../features/member/screens/workouts_tracker_screen.dart';

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
  final notifier = ValueNotifier<int>(0);
  
  ref.listen(authProvider, (previous, next) {
    if (previous?.user != next.user) {
      notifier.value++;
    }
  });

  return GoRouter(
    initialLocation: '/splash',
    refreshListenable: notifier,
    redirect: (context, state) {
      final authState = ref.read(authProvider);
      final loggingIn = state.matchedLocation == '/login';
      final inOtp = state.matchedLocation == '/otp';
      final inSplash = state.matchedLocation == '/splash';
      final loggedIn = authState.user != null;

      debugPrint('DEBUG: Redirect matchedLocation=${state.matchedLocation} loggingIn=$loggingIn inOtp=$inOtp inSplash=$inSplash loggedIn=$loggedIn');

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
          GoRoute(path: '/member/workouts', builder: (context, state) => const WorkoutsTrackerScreen()),
          GoRoute(path: '/member/profile', builder: (context, state) => const ProfileScreen()),
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
        builder: (context, state, child) => MemberShell(child: child),
        routes: [
          GoRoute(path: '/frontdesk', builder: (context, state) => const MemberHomeScreen()),
          GoRoute(path: '/frontdesk/operations', builder: (context, state) => const FrontdeskDashboardScreen()),
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
      ShellRoute(
        builder: (context, state, child) => MemberShell(child: child),
        routes: [
          GoRoute(path: '/member', builder: (context, state) => const MemberHomeScreen()),
          GoRoute(path: '/member/checkin', builder: (context, state) => const CheckinScreen()),
          GoRoute(path: '/member/workouts', builder: (context, state) => const WorkoutsTrackerScreen()),
          GoRoute(path: '/member/profile', builder: (context, state) => const ProfileScreen()),
          GoRoute(path: '/member/schedule', builder: (context, state) => const Scaffold(body: Center(child: Text('Schedule Coming Soon')))),
          GoRoute(path: '/member/payment', builder: (context, state) => const PaymentScreen()),
        ],
      ),
    ],
  );
});
