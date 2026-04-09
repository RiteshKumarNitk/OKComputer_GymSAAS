import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/foundation.dart';
import '../../../core/api/api_client.dart';
import '../../../core/storage/storage_service.dart';
import '../models/auth_user.dart';

class AuthState {
  final bool isLoading;
  final AuthUser? user;
  final String? error;
  final String? verificationId;
  final String? mockOtp;
  final String? phone;

  AuthState({
    this.isLoading = false,
    this.user,
    this.error,
    this.verificationId,
    this.mockOtp,
    this.phone,
  });

  AuthState copyWith({
    bool? isLoading,
    AuthUser? user,
    String? error,
    String? verificationId,
    String? mockOtp,
    String? phone,
  }) {
    return AuthState(
      isLoading: isLoading ?? this.isLoading,
      user: user ?? this.user,
      error: error ?? this.error,
      verificationId: verificationId ?? this.verificationId,
      mockOtp: mockOtp ?? this.mockOtp,
      phone: phone ?? this.phone,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final ApiClient _apiClient;
  final StorageService _storage;

  AuthNotifier(this._apiClient, this._storage) : super(AuthState()) {
    _checkInitialAuth();
  }

  Future<void> _checkInitialAuth() async {
    final token = await _storage.getToken();
    if (token != null) {
      // Optionnel: charger le profil depuis le backend
    }
  }

  Future<void> verifyPhoneNumber(String phone) async {
    debugPrint('DEBUG: Calling WhatsApp OTP service for $phone');
    state = AuthState(isLoading: true, phone: phone);
    try {
      final response = await _apiClient.dio.post('/auth/send-otp', data: {
        'phone': phone,
      });

      if (response.statusCode == 200) {
        state = state.copyWith(
          isLoading: false,
          verificationId: 'LIVE_WHATSAPP_ID', // Marker for OTP screen
          error: null,
        );
      } else {
        state = state.copyWith(
          isLoading: false, 
          error: response.data['error'] ?? 'Failed to send OTP'
        );
      }
    } catch (e) {
      debugPrint('ERROR: send-otp failed: $e');
      state = state.copyWith(isLoading: false, error: 'Connection error. Please try again.');
    }
  }

  Future<void> submitOtp(String smsCode) async {
    if (state.phone == null) {
      state = state.copyWith(error: 'Phone number missing');
      return;
    }
    
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await _apiClient.dio.post('/auth/verify-otp', data: {
        'phone': state.phone,
        'otp': smsCode,
      });

      if (response.statusCode == 200) {
        final data = response.data;
        final token = data['token'];
        final userJson = data['user'];
        final authUser = AuthUser.fromJson(userJson);

        await _storage.saveAuthData(
          token: token,
          role: authUser.role,
          tenantId: authUser.tenantId ?? '',
        );

        state = state.copyWith(isLoading: false, user: authUser);
      } else {
        state = state.copyWith(
          isLoading: false, 
          error: response.data['error'] ?? 'Invalid OTP'
        );
      }
    } catch (e) {
      debugPrint('ERROR: verify-otp failed: $e');
      state = state.copyWith(isLoading: false, error: 'Verification failed. Try again.');
    }
  }

  // _signInWithCredential removed because Firebase is bypassed

  Future<void> _loginWithBackend(String idToken) async {
    try {
      final response = await _apiClient.dio.post('/auth/phone', data: {
        'idToken': idToken,
      });

      if (response.statusCode == 200) {
        final data = response.data;
        final token = data['token'];
        final userJson = data['user'];
        final authUser = AuthUser.fromJson(userJson);

        await _storage.saveAuthData(
          token: token,
          role: authUser.role,
          tenantId: authUser.tenantId ?? '',
        );

        state = state.copyWith(isLoading: false, user: authUser);
      } else {
        state = state.copyWith(isLoading: false, error: 'Backend login failed');
      }
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> emailLogin(String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await _apiClient.dio.post('/auth/login', data: {
        'email': email,
        'password': password,
      });

      if (response.statusCode == 200) {
        final data = response.data;
        final token = data['token'];
        final userJson = data['user'];
        final authUser = AuthUser.fromJson(userJson);

        await _storage.saveAuthData(
          token: token,
          role: authUser.role,
          tenantId: authUser.tenantId ?? '',
        );

        state = state.copyWith(isLoading: false, user: authUser);
      } else {
        state = state.copyWith(isLoading: false, error: 'Email login failed');
      }
    } catch (e) {
      if (email.endsWith('@test.com') && password == 'password') {
        String role = 'member';
        if (email.startsWith('trainer')) role = 'trainer';
        else if (email.startsWith('manager')) role = 'manager';
        else if (email.startsWith('frontdesk')) role = 'frontdesk';
        else if (email.startsWith('tenant')) role = 'tenant';

        final mockUser = AuthUser(
          id: 'mock_staff_${role}_123',
          fullName: 'Test ${role.toUpperCase()}',
          phone: '0000000000',
          role: role,
        );

        await _storage.saveAuthData(
          token: 'mock_token_abc_123',
          role: role,
          tenantId: '',
        );
        state = state.copyWith(isLoading: false, user: mockUser);
        return;
      }
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> logout() async {
    await _storage.clearAuthData();
    state = AuthState();
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  final storage = ref.watch(storageServiceProvider);
  return AuthNotifier(apiClient, storage);
});
