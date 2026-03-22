import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../storage/storage_service.dart';

final apiClientProvider = Provider<ApiClient>((ref) {
  final storage = ref.watch(storageServiceProvider);
  
  // Port 3001 matches server/index.ts
  final baseUrl = kIsWeb 
      ? 'http://localhost:3001/api' 
      : 'http://10.0.2.2:3001/api';

  return ApiClient(
    baseUrl: baseUrl,
    storageService: storage,
  );
});

class ApiClient {
  final Dio dio;
  final StorageService storageService;

  ApiClient({
    required String baseUrl,
    required this.storageService,
  }) : dio = Dio(BaseOptions(baseUrl: baseUrl)) {
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await storageService.getToken();
          final tenantId = await storageService.getTenantId();

          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          if (tenantId != null) {
            options.headers['x-tenant-id'] = tenantId;
          }

          return handler.next(options);
        },
      ),
    );
  }
}
