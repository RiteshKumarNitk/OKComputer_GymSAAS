import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../features/member/screens/fitness_tools_screen.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../features/auth/providers/auth_provider.dart';
import '../../features/auth/screens/intro_screen.dart';
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
import '../../features/member/screens/calories_calculator_screen.dart';
import '../../features/member/screens/dummy_profile_pages.dart';
import '../../features/member/screens/bmi_calculator_screen.dart';
import '../../features/member/screens/water_reminder_screen.dart';
import '../../features/member/screens/leaderboard_screen.dart';
import '../../features/member/screens/badges_screen.dart';
import '../../features/member/screens/macro_tracker_screen.dart';
import '../../features/member/screens/one_rep_max_screen.dart';
import '../../features/member/screens/equipment_tutorials_screen.dart';
import '../../features/member/screens/trainer_chat_screen.dart';
import '../../features/member/screens/class_schedule_screen.dart';
import '../../features/member/screens/class_details_screen.dart';


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
import '../../features/manager/screens/memberships_manage_screen.dart';
import '../../features/manager/screens/staff_manage_screen.dart';
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
      final inIntro = state.matchedLocation == '/intro';
      final inOtp = state.matchedLocation == '/otp';
      final inSplash = state.matchedLocation == '/splash';
      final loggedIn = authState.user != null;

      debugPrint('DEBUG: Redirect matchedLocation=${state.matchedLocation} loggingIn=$loggingIn inIntro=$inIntro inOtp=$inOtp inSplash=$inSplash loggedIn=$loggedIn');

      if (inSplash && !loggedIn) return null; // Wait on Splash timer
      if (!loggedIn && !loggingIn && !inOtp && !inSplash && !inIntro) return '/intro';
      if (loggedIn && (loggingIn || inIntro || inOtp || inSplash)) {
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
            return '/intro';
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
        path: '/intro',
        builder: (context, state) => const IntroScreen(),
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
          GoRoute(path: '/member/schedule', builder: (context, state) => const Scaffold(body: Center(child: Text('Schedule Coming Soon')))),
          GoRoute(path: '/member/payment', builder: (context, state) => const PaymentScreen()),
          GoRoute(path: '/member/tools', builder: (context, state) => const FitnessToolsScreen()),
          GoRoute(path: '/member/calories-calculator', builder: (context, state) => const CaloriesCalculatorScreen()),
          GoRoute(path: '/member/bmi-calculator', builder: (context, state) => const BmiCalculatorScreen()),
          GoRoute(path: '/member/water-reminder', builder: (context, state) => const WaterReminderScreen()),
          GoRoute(path: '/member/leaderboard', builder: (context, state) => const LeaderboardScreen()),
          GoRoute(path: '/member/badges', builder: (context, state) => const BadgesScreen()),
          GoRoute(path: '/member/macro-tracker', builder: (context, state) => const MacroTrackerScreen()),
          GoRoute(path: '/member/one-rep-max', builder: (context, state) => const OneRepMaxScreen()),
          GoRoute(path: '/member/equipment-tutorials', builder: (context, state) => const EquipmentTutorialsScreen()),
          GoRoute(path: '/member/trainer-chat', builder: (context, state) => const TrainerChatScreen()),
          GoRoute(path: '/member/classes', builder: (context, state) => const ClassScheduleScreen()),
          GoRoute(
            path: '/member/class-details',
            builder: (context, state) {
              final classData = state.extra as Map<String, dynamic>?;
              if (classData == null) {
                return const Scaffold(body: Center(child: Text('Class data missing')));
              }
              return ClassDetailsScreen(classData: classData);
            },
          ),
          GoRoute(path: '/member/metric-log', builder: (context, state) => const MetricLogScreen()),
          GoRoute(path: '/member/membership', builder: (context, state) => const MembershipScreen()),
          GoRoute(path: '/member/report-card', builder: (context, state) => const ReportCardScreen()),
          GoRoute(path: '/member/health-assessment', builder: (context, state) => const HealthAssessmentScreen()),
          GoRoute(path: '/member/help-support', builder: (context, state) => const HelpSupportScreen()),
          GoRoute(path: '/member/business-request', builder: (context, state) => const BusinessRequestScreen()),
          GoRoute(path: '/member/settings', builder: (context, state) => const SettingsScreen()),
          
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
          GoRoute(path: '/manager/members', builder: (context, state) => const MembershipsManageScreen()),
          GoRoute(path: '/manager/staff', builder: (context, state) => const StaffManageScreen()),
          GoRoute(path: '/manager/reports', builder: (context, state) => const ReportsScreen()),
        ],
      ),

    ],
  );
});
