import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/manager_api_service.dart';

/// Provider for high-level executive financial and growth stats
final executiveStatsProvider = FutureProvider<Map<String, dynamic>>((ref) {
  final api = ref.watch(managerApiServiceProvider);
  return api.getExecutiveStats();
});

/// Provider for all available membership pricing tiers
final membershipTiersProvider = FutureProvider<List<Map<String, dynamic>>>((ref) {
  final api = ref.watch(managerApiServiceProvider);
  return api.getMembershipTiers();
});

/// Provider for all gym staff profiles and RBAC
final staffListProvider = FutureProvider<List<Map<String, dynamic>>>((ref) {
  final api = ref.watch(managerApiServiceProvider);
  return api.getStaffList();
});
