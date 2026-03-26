import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/member_api_service.dart';

final memberStatsProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final apiService = ref.watch(memberApiServiceProvider);
  return await apiService.getMemberStats();
});

final leaderboardProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final apiService = ref.watch(memberApiServiceProvider);
  return await apiService.getLeaderboard();
});
