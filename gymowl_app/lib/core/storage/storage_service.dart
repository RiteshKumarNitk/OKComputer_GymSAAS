import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final storageServiceProvider = Provider<StorageService>((ref) => StorageService());

class StorageService {
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  static const String _keyToken = 'auth_token';
  static const String _keyRole = 'user_role';
  static const String _keyTenantId = 'tenant_id';

  Future<void> saveAuthData({
    required String token,
    required String role,
    required String tenantId,
  }) async {
    await _storage.write(key: _keyToken, value: token);
    await _storage.write(key: _keyRole, value: role);
    await _storage.write(key: _keyTenantId, value: tenantId);
  }

  Future<String?> getToken() => _storage.read(key: _keyToken);
  Future<String?> getRole() => _storage.read(key: _keyRole);
  Future<String?> getTenantId() => _storage.read(key: _keyTenantId);

  Future<void> clearAuthData() async {
    await _storage.delete(key: _keyToken);
    await _storage.delete(key: _keyRole);
    await _storage.delete(key: _keyTenantId);
  }
}
