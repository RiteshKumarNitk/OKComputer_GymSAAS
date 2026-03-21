import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';

class PaymentState {
  final bool isLoading;
  final double amountDue;
  final bool isSuccess;
  final String? error;

  PaymentState({
    this.isLoading = false,
    this.amountDue = 0,
    this.isSuccess = false,
    this.error,
  });

  PaymentState copyWith({
    bool? isLoading,
    double? amountDue,
    bool? isSuccess,
    String? error,
  }) {
    return PaymentState(
      isLoading: isLoading ?? this.isLoading,
      amountDue: amountDue ?? this.amountDue,
      isSuccess: isSuccess ?? this.isSuccess,
      error: error ?? this.error,
    );
  }
}

class PaymentNotifier extends StateNotifier<PaymentState> {
  final ApiClient _apiClient;

  PaymentNotifier(this._apiClient) : super(PaymentState()) {
    fetchDues();
  }

  Future<void> fetchDues() async {
    state = state.copyWith(isLoading: true);
    await Future.delayed(const Duration(milliseconds: 800));
    state = state.copyWith(isLoading: false, amountDue: 49.99);
  }

  Future<bool> simulatePaymentSuccess() async {
    state = state.copyWith(isLoading: true, isSuccess: false, error: null);
    try {
      final response = await _apiClient.dio.post('/payment/verify', data: {
        'razorpayPaymentId': 'pay_dummy_12345',
        'status': 'success',
      });
      if (response.statusCode == 200 || response.statusCode == 201) {
         state = state.copyWith(isLoading: false, isSuccess: true, amountDue: 0);
         return true;
      }
    } catch (e) {
      state = state.copyWith(isLoading: false, isSuccess: true, amountDue: 0);
      return true;
    }
    return true;
  }
}

final paymentProvider = StateNotifierProvider<PaymentNotifier, PaymentState>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return PaymentNotifier(apiClient);
});
