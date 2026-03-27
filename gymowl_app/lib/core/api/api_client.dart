import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../storage/storage_service.dart';

import 'dart:io' show Platform;

final apiClientProvider = Provider<ApiClient>((ref) {
  final storage = ref.watch(storageServiceProvider);
  
  // LIVE_URL for production deployment
  const String liveUrl = 'https://ok-computer-gym-saas.vercel.app/api';
  
  // Auto-detect localhost environment
  String localUrl = 'http://localhost:3001/api';
  try {
    if (!kIsWeb && Platform.isAndroid) {
      localUrl = 'http://10.0.2.2:3001/api';
    }
  } catch(e) { /* ignore */ }
  
  // Set to localUrl for dev, liveUrl for production
  final String baseUrl = localUrl;

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
