import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gymowl_app/core/api/api_client.dart';
import 'package:gymowl_app/core/storage/storage_service.dart';
import 'product_model.dart';

class ProductService {
  final ApiClient _apiClient;
  final StorageService _storageService;

  ProductService(this._apiClient, this._storageService);

  Future<List<Product>> getProducts({String? tenantId}) async {
    try {
      final userTenantId = await _storageService.getTenantId();
      final targetTenantId = tenantId ?? userTenantId;
      
      final response = await _apiClient.get('/products', queryParameters: {
        'tenantId': targetTenantId,
      });
      
      if (response.data != null) {
        final List<dynamic> jsonData = response.data as List<dynamic>;
        return jsonData.map((json) => Product.fromJson(json)).toList();
      } else {
        return [];
      }
    } catch (e) {
      throw Exception('Error fetching products: $e');
    }
  }
}

final productServiceProvider = Provider<ProductService>((ref) {
  return ProductService(ref.read(apiClientProvider), ref.read(storageServiceProvider));
});