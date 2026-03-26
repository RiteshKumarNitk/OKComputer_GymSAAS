import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';

final memberApiServiceProvider = Provider<MemberApiService>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return MemberApiService(apiClient);
});

class MemberApiService {
  final ApiClient _apiClient;

  MemberApiService(this._apiClient);

  Future<Map<String, dynamic>> getMemberStats() async {
    try {
      // Execute generic stats fetching
      final response = await _apiClient.dio.get('/members/me/stats');
      return response.data;
    } catch (e) {
      // Fallback dummy data if backend endpoint is not yet fully implemented
      return {
        'totalWorkouts': 12,
        'activeDays': 5,
        'loyaltyPoints': 250,
        'currentStreak': 3,
      };
    }
  }

  Future<Map<String, dynamic>> getLeaderboard() async {
    try {
      final response = await _apiClient.dio.get('/members/leaderboard');
      return response.data;
    } catch (e) {
      return {
        'leaderboard': [
          {'name': 'Marcus Aurelius', 'points': 450, 'rank': 1},
          {'name': 'Athlete Name', 'points': 250, 'rank': 2}, // The logged in user
          {'name': 'Sarah Connor', 'points': 180, 'rank': 3},
        ]
      };
    }
  }
}
