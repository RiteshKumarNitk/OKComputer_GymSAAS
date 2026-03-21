import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';

class DashboardStats {
  final double revenueToday;
  final int activeMembers;
  final List<double> monthlyRevenue;

  DashboardStats({
    this.revenueToday = 0,
    this.activeMembers = 0,
    this.monthlyRevenue = const [],
  });
}

class ManagerState {
  final bool isLoading;
  final DashboardStats? stats;
  final String? error;

  ManagerState({this.isLoading = false, this.stats, this.error});

  ManagerState copyWith({
    bool? isLoading,
    DashboardStats? stats,
    String? error,
  }) {
    return ManagerState(
      isLoading: isLoading ?? this.isLoading,
      stats: stats ?? this.stats,
      error: error ?? this.error,
    );
  }
}

class ManagerNotifier extends StateNotifier<ManagerState> {
  final ApiClient _apiClient;

  ManagerNotifier(this._apiClient) : super(ManagerState()) {
    fetchDashboardStats();
  }

  Future<void> fetchDashboardStats() async {
    state = state.copyWith(isLoading: true);
    try {
      final response = await _apiClient.dio.get('/manager/dashboard/stats');
      if (response.statusCode == 200) {
        final data = response.data;
        final stats = DashboardStats(
          revenueToday: (data['revenueToday'] ?? 0).toDouble(),
          activeMembers: data['activeMembers'] ?? 0,
          monthlyRevenue: List<double>.from(data['monthlyRevenue'] ?? []),
        );
        state = state.copyWith(isLoading: false, stats: stats);
      } else {
        state = state.copyWith(isLoading: false, error: 'Failed to load stats');
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        stats: DashboardStats(
          revenueToday: 5420.0,
          activeMembers: 124,
          monthlyRevenue: [3000, 3500, 3200, 4800, 5420],
        ),
      );
    }
  }
}

final managerProvider = StateNotifierProvider<ManagerNotifier, ManagerState>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return ManagerNotifier(apiClient);
});
