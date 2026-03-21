import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/auth/auth_service.dart';
import '../../../core/storage/storage_service.dart';

class AuthState {
  final bool isLoading;
  final String? role;
  final String? error;

  AuthState({this.isLoading = false, this.role, this.error});
}

class AuthNotifier extends StateNotifier<AuthState> {
  final AuthService _authService;
  final StorageService _storageService;

  AuthNotifier(this._authService, this._storageService) : super(AuthState()) {
    _checkInitStatus();
  }

  Future<void> _checkInitStatus() async {
    final role = await _storageService.getRole();
    if (role != null) {
      state = AuthState(role: role);
    }
  }

  Future<bool> login(String email, String password) async {
    state = AuthState(isLoading: true);
    final success = await _authService.login(email, password);
    if (success) {
      final role = await _storageService.getRole();
      state = AuthState(role: role);
      return true;
    } else {
      state = AuthState(error: 'Login failed', isLoading: false);
      return false;
    }
  }

  Future<void> logout() async {
    await _authService.logout();
    state = AuthState();
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final authService = ref.watch(authServiceProvider);
  final storage = ref.watch(storageServiceProvider);
  return AuthNotifier(authService, storage);
});
