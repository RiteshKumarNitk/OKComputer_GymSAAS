import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/frontdesk_api_service.dart';

/// Provider for searching members based on a query string
final memberSearchQueryProvider = StateProvider<String>((ref) => '');

final memberSearchProvider = FutureProvider<List<Map<String, dynamic>>>((ref) {
  final api = ref.watch(frontdeskApiServiceProvider);
  final query = ref.watch(memberSearchQueryProvider);
  return api.searchMembers(query);
});

/// Provider for frontdesk dashboard KPIs (Capacity, etc)
final frontdeskDashboardStatsProvider = FutureProvider<Map<String, dynamic>>((ref) {
  final api = ref.watch(frontdeskApiServiceProvider);
  return api.getDashboardStats();
});

/// Provider for the recent check-in activity feed
final recentActivityProvider = FutureProvider<List<Map<String, dynamic>>>((ref) {
  final api = ref.watch(frontdeskApiServiceProvider);
  return api.getRecentAttendance();
});
