import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../storage/storage_service.dart';

final apiClientProvider = Provider<ApiClient>((ref) {
  final storage = ref.watch(storageServiceProvider);
  return ApiClient(
    baseUrl: 'https://api.gymowl.com', // Replace with staging/prod later
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
