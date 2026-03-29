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
    final response = await _apiClient.dio.get('/members/me/stats');
    return response.data;
  }

  Future<List<dynamic>> getLeaderboard() async {
    final response = await _apiClient.dio.get('/members/leaderboard');
    return response.data as List<dynamic>;
  }

  Future<List<Map<String, dynamic>>> getMyWorkouts() async {
    final response = await _apiClient.dio.get('/members/me/workouts');
    return List<Map<String, dynamic>>.from(response.data);
  }

  Future<List<Map<String, dynamic>>> getUpcomingSessions() async {
    final response = await _apiClient.dio.get('/members/me/bookings?status=active');
    return List<Map<String, dynamic>>.from(response.data);
  }

  Future<void> logWorkoutActivity(Map<String, dynamic> data) async {
    await _apiClient.dio.post('/members/me/workout-logs', data: data);
  }

  Future<void> updateWorkoutProgress(dynamic workoutId, {required bool completed, String? notes, Map<String, dynamic>? progress}) async {
    await _apiClient.dio.patch('/members/me/workouts/$workoutId', data: {
      'completed': completed,
      'notes': notes,
      'progress': progress,
    });
  }

  Future<void> logMeasurement({required String type, required double value, required String unit, String? notes}) async {
    await _apiClient.dio.post('/members/me/measurements', data: {
      'type': type,
      'value': value,
      'unit': unit,
      'notes': notes,
    });
  }

  Future<void> updateHealthProfile(Map<String, dynamic> data) async {
    await _apiClient.dio.patch('/members/me/health-profile', data: data);
  }
}
