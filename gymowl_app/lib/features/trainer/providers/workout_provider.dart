import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';

class Member {
  final String id;
  final String name;
  final String? planStatus;

  Member({required this.id, required this.name, this.planStatus});
}

class WorkoutState {
  final bool isLoading;
  final List<Member> members;
  final bool isSuccess;
  final String? error;

  WorkoutState({
    this.isLoading = false,
    this.members = const [],
    this.isSuccess = false,
    this.error,
  });

  WorkoutState copyWith({
    bool? isLoading,
    List<Member>? members,
    bool? isSuccess,
    String? error,
  }) {
    return WorkoutState(
      isLoading: isLoading ?? this.isLoading,
      members: members ?? this.members,
      isSuccess: isSuccess ?? this.isSuccess,
      error: error ?? this.error,
    );
  }
}

class WorkoutNotifier extends StateNotifier<WorkoutState> {
  final ApiClient _apiClient;

  WorkoutNotifier(this._apiClient) : super(WorkoutState()) {
    fetchMembers();
  }

  Future<void> fetchMembers() async {
    state = state.copyWith(isLoading: true);
    try {
      final response = await _apiClient.dio.get('/trainer/members');
      if (response.statusCode == 200) {
        final List data = response.data;
        final members = data.map((e) => Member(
          id: e['id'].toString(),
          name: e['name'] ?? 'Unknown',
          planStatus: e['planStatus'],
        )).toList();
        state = state.copyWith(members: members, isLoading: false);
      } else {
        state = state.copyWith(isLoading: false, error: 'Failed to load members');
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        members: [
          Member(id: '1', name: 'John Doe', planStatus: 'No Plan'),
          Member(id: '2', name: 'Jane Smith', planStatus: 'Active Plan'),
        ],
      );
    }
  }

  Future<bool> assignWorkout(String memberId, Map<String, dynamic> data) async {
    state = state.copyWith(isLoading: true, isSuccess: false, error: null);
    try {
      final response = await _apiClient.dio.post('/workouts/assign', data: {
        'memberId': memberId,
        ...data,
      });
      if (response.statusCode == 200 || response.statusCode == 201) {
        state = state.copyWith(isLoading: false, isSuccess: true);
        return true;
      } else {
        state = state.copyWith(isLoading: false, error: 'Failed to assign workout');
        return false;
      }
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Failed to assign workout');
      return false;
    }
  }
}

final workoutProvider = StateNotifierProvider<WorkoutNotifier, WorkoutState>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return WorkoutNotifier(apiClient);
});
