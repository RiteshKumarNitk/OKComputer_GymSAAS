import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/member_api_service.dart';

final memberStatsProvider = FutureProvider<Map<String, dynamic>>((ref) {
  return ref.watch(memberApiServiceProvider).getMemberStats();
});

final leaderboardProvider = FutureProvider<List<dynamic>>((ref) {
  return ref.watch(memberApiServiceProvider).getLeaderboard();
});

final myWorkoutsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) {
  return ref.watch(memberApiServiceProvider).getMyWorkouts();
});

final upcomingSessionsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) {
  return ref.watch(memberApiServiceProvider).getUpcomingSessions();
});

class WorkoutLogNotifier extends StateNotifier<AsyncValue<void>> {
  final MemberApiService _api;
  WorkoutLogNotifier(this._api) : super(const AsyncValue.data(null));

  Future<void> logWorkout(Map<String, dynamic> data) async {
    state = const AsyncValue.loading();
    try {
      await _api.logWorkoutActivity(data);
      state = const AsyncValue.data(null);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }
}

final workoutLogProvider = StateNotifierProvider<WorkoutLogNotifier, AsyncValue<void>>((ref) {
  return WorkoutLogNotifier(ref.watch(memberApiServiceProvider));
});

class WorkoutCompletionNotifier extends StateNotifier<AsyncValue<void>> {
  final MemberApiService _api;
  final Ref _ref;
  WorkoutCompletionNotifier(this._api, this._ref) : super(const AsyncValue.data(null));

  Future<void> completeWorkout(String id, {String? notes, Map<String, dynamic>? progress}) async {
    state = const AsyncValue.loading();
    try {
      await _api.updateWorkoutProgress(id, completed: true, notes: notes, progress: progress);
      _ref.invalidate(myWorkoutsProvider);
      _ref.invalidate(memberStatsProvider);
      state = const AsyncValue.data(null);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }
}

final workoutCompletionProvider = StateNotifierProvider<WorkoutCompletionNotifier, AsyncValue<void>>((ref) {
  return WorkoutCompletionNotifier(ref.watch(memberApiServiceProvider), ref);
});

class MeasurementNotifier extends StateNotifier<AsyncValue<void>> {
  final MemberApiService _api;
  final Ref _ref;
  MeasurementNotifier(this._api, this._ref) : super(const AsyncValue.data(null));

  Future<void> logMeasurement({required String type, required double value, required String unit, String? notes}) async {
    state = const AsyncValue.loading();
    try {
      await _api.logMeasurement(type: type, value: value, unit: unit, notes: notes);
      _ref.invalidate(memberStatsProvider);
      state = const AsyncValue.data(null);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }
}

final measurementProvider = StateNotifierProvider<MeasurementNotifier, AsyncValue<void>>((ref) {
  return MeasurementNotifier(ref.watch(memberApiServiceProvider), ref);
});

final dailyWorkoutProvider = FutureProvider<Map<String, dynamic>?>((ref) {
  return ref.watch(memberApiServiceProvider).getTodayWorkoutPlan();
});

class DailyWorkoutNotifier extends StateNotifier<AsyncValue<void>> {
  final MemberApiService _api;
  final Ref _ref;
  DailyWorkoutNotifier(this._api, this._ref) : super(const AsyncValue.data(null));

  Future<void> updateExerciseStatus(String id, List<dynamic> updatedExercises) async {
    state = const AsyncValue.loading();
    try {
      int total = updatedExercises.length;
      int completed = updatedExercises.where((ex) => ex['status'] == 'completed').length;
      int pct = total == 0 ? 0 : ((completed / total) * 100).round();
      
      Map<String, dynamic> progress = {
        'totalExercises': total,
        'completed': completed,
        'percentage': pct,
      };

      String overallStatus = pct == 100 ? 'completed' : 'in_progress';

      await _api.updateDailyWorkoutPlan(id, {
        'exercises': updatedExercises,
        'progress': progress,
        'status': overallStatus,
      });

      _ref.invalidate(dailyWorkoutProvider);
      state = const AsyncValue.data(null);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }
}

final dailyWorkoutNotifierProvider = StateNotifierProvider<DailyWorkoutNotifier, AsyncValue<void>>((ref) {
  return DailyWorkoutNotifier(ref.watch(memberApiServiceProvider), ref);
});
