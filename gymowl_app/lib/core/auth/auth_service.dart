import '../../core/api/api_client.dart';
import '../storage/storage_service.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final authServiceProvider = Provider<AuthService>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  final storage = ref.watch(storageServiceProvider);
  return AuthService(apiClient: apiClient, storageService: storage);
});

class AuthService {
  final ApiClient apiClient;
  final StorageService storageService;

  AuthService({required this.apiClient, required this.storageService});

  Future<bool> login(String email, String password) async {
    try {
      final response = await apiClient.dio.post('/auth/login', data: {
        'email': email,
        'password': password,
      });

      if (response.statusCode == 200) {
        final data = response.data;
        // Specs: { user, role, tenantId, token }
        final token = data['token'] as String;
        final role = data['role'] as String;
        final tenantId = data['tenantId'] as String;

        await storageService.saveAuthData(
          token: token,
          role: role,
          tenantId: tenantId,
        );
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  Future<void> logout() async {
    await storageService.clearAuthData();
  }
}
