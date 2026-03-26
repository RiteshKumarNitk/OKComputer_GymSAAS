import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';

final managerApiServiceProvider = Provider<ManagerApiService>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return ManagerApiService(apiClient);
});

class ManagerApiService {
  final ApiClient _apiClient;

  ManagerApiService(this._apiClient);

  /// Fetch full executive dashboard results
  Future<Map<String, dynamic>> getExecutiveStats() async {
    final response = await _apiClient.dio.get('/reports/dashboard');
    return Map<String, dynamic>.from(response.data);
  }

  /// Fetch all membership tiers
  Future<List<Map<String, dynamic>>> getMembershipTiers() async {
    final response = await _apiClient.dio.get('/memberships');
    return List<Map<String, dynamic>>.from(response.data);
  }

  /// Create or update a membership tier
  Future<Map<String, dynamic>> upsertMembershipTier(Map<String, dynamic> data) async {
    if (data['id'] != null) {
      final response = await _apiClient.dio.patch('/memberships', queryParameters: {'id': data['id']}, data: data);
      return Map<String, dynamic>.from(response.data);
    } else {
      final response = await _apiClient.dio.post('/memberships', data: data);
      return Map<String, dynamic>.from(response.data);
    }
  }

  /// Fetch all staff accounts
  Future<List<Map<String, dynamic>>> getStaffList() async {
    final response = await _apiClient.dio.get('/users', queryParameters: {'role': 'trainer,frontdesk,manager'});
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

  /// Fetch invoices for a member or tenant
  Future<List<Map<String, dynamic>>> getInvoices({dynamic memberId}) async {
    final response = await _apiClient.dio.get('/invoices', queryParameters: {
      if (memberId != null) 'memberId': memberId,
    });
    return List<Map<String, dynamic>>.from(response.data);
  }

  /// Onboard new staff with HR details
  Future<Map<String, dynamic>> createStaffProfile(Map<String, dynamic> data) async {
    final response = await _apiClient.dio.post('/staff/profiles', data: data);
    return Map<String, dynamic>.from(response.data);
  }
}
