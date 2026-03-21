import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';

class CheckinState {
  final bool isLoading;
  final bool isSuccess;
  final String? error;

  CheckinState({this.isLoading = false, this.isSuccess = false, this.error});
}

class CheckinNotifier extends StateNotifier<CheckinState> {
  final ApiClient _apiClient;

  CheckinNotifier(this._apiClient) : super(CheckinState());

  Future<void> manualCheckin() async {
    state = CheckinState(isLoading: true);
    try {
      final response = await _apiClient.dio.post('/attendance/checkin', data: {
        'manual': true,
      });
      if (response.statusCode == 200) {
        state = CheckinState(isSuccess: true);
      } else {
        state = CheckinState(error: 'Check-in failed');
      }
    } catch (e) {
      state = CheckinState(error: e.toString());
    }
  }
}

final checkinProvider = StateNotifierProvider<CheckinNotifier, CheckinState>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return CheckinNotifier(apiClient);
});
