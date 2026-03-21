import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';

class ScannerState {
  final bool isProcessing;
  final bool isSuccess;
  final String? memberName;
  final String? error;

  ScannerState({
    this.isProcessing = false,
    this.isSuccess = false,
    this.memberName,
    this.error,
  });

  ScannerState copyWith({
    bool? isProcessing,
    bool? isSuccess,
    String? memberName,
    String? error,
  }) {
    return ScannerState(
      isProcessing: isProcessing ?? this.isProcessing,
      isSuccess: isSuccess ?? this.isSuccess,
      memberName: memberName ?? this.memberName,
      error: error ?? this.error,
    );
  }
}

class ScannerNotifier extends StateNotifier<ScannerState> {
  final ApiClient _apiClient;

  ScannerNotifier(this._apiClient) : super(ScannerState());

  Future<void> verifyCheckin(String qrCodeData) async {
    if (state.isProcessing) return;
    state = state.copyWith(isProcessing: true, error: null, isSuccess: false);

    try {
      final response = await _apiClient.dio.post('/attendance/checkin', data: {
        'qrCode': qrCodeData,
      });

      if (response.statusCode == 200) {
        final name = response.data['memberName'] as String?;
        state = state.copyWith(isProcessing: false, isSuccess: true, memberName: name);
      } else {
        state = state.copyWith(isProcessing: false, error: 'Check-in Failed');
      }
    } catch (e) {
      state = state.copyWith(isProcessing: false, error: 'Error verifying check-in');
    }
  }

  void reset() {
    state = ScannerState();
  }
}

final scannerProvider = StateNotifierProvider<ScannerNotifier, ScannerState>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return ScannerNotifier(apiClient);
});
