import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';

final trainerApiServiceProvider = Provider<TrainerApiService>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return TrainerApiService(apiClient);
});

class TrainerApiService {
  final ApiClient _apiClient;

  TrainerApiService(this._apiClient);

  /// Fetch clients assigned to this trainer
  Future<List<Map<String, dynamic>>> getMyClients() async {
    // The backend's createCrudRoutes uses req.userId to filter for members if role is trainer/member
    // or we can pass trainerId explicitly
    final response = await _apiClient.dio.get('/members');
    return List<Map<String, dynamic>>.from(response.data);
  }

  /// Fetch available workout templates
  Future<List<Map<String, dynamic>>> getWorkoutTemplates() async {
    final response = await _apiClient.dio.get('/workouts');
    return List<Map<String, dynamic>>.from(response.data);
  }

  /// Assign a workout plan to a member
  Future<Map<String, dynamic>> assignWorkout({
    required String memberId,
    required String workoutId,
    String? notes,
  }) async {
    final response = await _apiClient.dio.post('/member-workouts', data: {
      'memberId': memberId,
      'workoutId': workoutId,
      if (notes != null) 'notes': notes,
    });
    return Map<String, dynamic>.from(response.data);
  }
}
