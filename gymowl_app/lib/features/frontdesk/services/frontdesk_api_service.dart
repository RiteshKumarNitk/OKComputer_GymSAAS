import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';

final frontdeskApiServiceProvider = Provider<FrontdeskApiService>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return FrontdeskApiService(apiClient);
});

class FrontdeskApiService {
  final ApiClient _apiClient;

  FrontdeskApiService(this._apiClient);

  /// Fetch all members with optional search query
  Future<List<Map<String, dynamic>>> searchMembers(String query) async {
    final response = await _apiClient.dio.get('/members', queryParameters: {
      if (query.isNotEmpty) 'search': query,
    });
    return List<Map<String, dynamic>>.from(response.data);
  }

  /// Log attendance for a specific member or staff
  Future<Map<String, dynamic>> checkInEntity(dynamic id) async {
    final response = await _apiClient.dio.post('/attendance', data: {
      'userId': id,
    });
    return Map<String, dynamic>.from(response.data);
  }

  /// Get recent activity feed (Members & Staff)
  Future<List<Map<String, dynamic>>> getOverallActivity() async {
    final response = await _apiClient.dio.get('/reports/activity');
    return List<Map<String, dynamic>>.from(response.data);
  }

  /// Get stats for the frontdesk dashboard
  Future<Map<String, dynamic>> getDashboardStats() async {
    final response = await _apiClient.dio.get('/dashboard/stats');
    return Map<String, dynamic>.from(response.data);
  }

  /// Get recent activity feed
  Future<List<Map<String, dynamic>>> getRecentAttendance() async {
    final response = await _apiClient.dio.get('/attendance', queryParameters: {
      'limit': 10,
    });
    return List<Map<String, dynamic>>.from(response.data);
  }

  /// Fetch invoices for a member
  Future<List<Map<String, dynamic>>> getInvoices({required dynamic memberId}) async {
    final response = await _apiClient.dio.get('/invoices', queryParameters: {
      'memberId': memberId,
    });
    return List<Map<String, dynamic>>.from(response.data);
  }

  /// Settle a pending invoice
  Future<Map<String, dynamic>> settlePayment({required dynamic memberId, required dynamic invoiceId, required double amount, String method = 'cash'}) async {
    final response = await _apiClient.dio.post('/payments/settle', data: {
      'memberId': memberId,
      'invoiceId': invoiceId,
      'amount': amount,
      'method': method,
    });
    return Map<String, dynamic>.from(response.data);
  }
}
