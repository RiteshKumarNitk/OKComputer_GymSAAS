import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/trainer_api_service.dart';

/// Provider for the list of clients assigned to the trainer
final myClientsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) {
  final api = ref.watch(trainerApiServiceProvider);
  return api.getMyClients();
});

/// Provider for available workout templates to assign
final workoutTemplatesProvider = FutureProvider<List<Map<String, dynamic>>>((ref) {
  final api = ref.watch(trainerApiServiceProvider);
  return api.getWorkoutTemplates();
});

/// Notifier for managing workout assignment status
class WorkoutAssignmentNotifier extends StateNotifier<AsyncValue<void>> {
  final TrainerApiService _api;

  WorkoutAssignmentNotifier(this._api) : super(const AsyncValue.data(null));

  Future<bool> assignWorkout({
    required String memberId,
    required String workoutId,
    String? notes,
  }) async {
    state = const AsyncValue.loading();
    try {
      await _api.assignWorkout(
        memberId: memberId,
        workoutId: workoutId,
        notes: notes,
      );
      state = const AsyncValue.data(null);
      return true;
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      return false;
    }
  }
}

final workoutAssignmentProvider = StateNotifierProvider<WorkoutAssignmentNotifier, AsyncValue<void>>((ref) {
  final api = ref.watch(trainerApiServiceProvider);
  return WorkoutAssignmentNotifier(api);
});
