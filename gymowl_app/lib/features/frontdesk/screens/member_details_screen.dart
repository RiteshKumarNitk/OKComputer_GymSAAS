import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../services/frontdesk_api_service.dart';

class MemberDetailsScreen extends ConsumerStatefulWidget {
  final String memberId;
  const MemberDetailsScreen({super.key, required this.memberId});

  @override
  ConsumerState<MemberDetailsScreen> createState() => _MemberDetailsScreenState();
}

class _MemberDetailsScreenState extends ConsumerState<MemberDetailsScreen> {
  bool _isLoading = true;
  Map<String, dynamic> _member = {};
  String? _error;
  List<dynamic> _plans = [];
  String? _selectedPlanId;
  bool _isRenewing = false;
  List<dynamic> _invoices = [];

  @override
  void initState() {
    super.initState();
    _fetchDetails();
    _fetchPlans();
    _fetchInvoices();
  }

  Future<void> _fetchDetails() async {
    try {
      final apiClient = ref.read(apiClientProvider);
      final response = await apiClient.dio.get('/members', queryParameters: {'id': widget.memberId});
      if (mounted) {
        setState(() {
          _member = response.data;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _fetchPlans() async {
    try {
      final apiClient = ref.read(apiClientProvider);
      final response = await apiClient.dio.get('/memberships');
      if (mounted) setState(() => _plans = response.data);
    } catch (e) {}
  }

  Future<void> _fetchInvoices() async {
    try {
      final api = ref.read(frontdeskApiServiceProvider);
      final response = await api.getInvoices(memberId: widget.memberId);
      if (mounted) setState(() => _invoices = response);
    } catch (e) {}
  }

  Future<void> _settleInvoice(Map<String, dynamic> invoice) async {
    try {
      final api = ref.read(frontdeskApiServiceProvider);
      await api.settlePayment(
        memberId: widget.memberId,
        invoiceId: invoice['id'],
        amount: (invoice['totalAmountCents'] ?? 0) / 100.0,
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Payment Settled! 💵'), backgroundColor: Colors.green));
        _fetchDetails();
        _fetchInvoices();
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Settlement failed: $e'), backgroundColor: Colors.red));
    }
  }

  Future<void> _renewMembership() async {
    if (_selectedPlanId == null) return;
    setState(() => _isRenewing = true);

    try {
      final apiClient = ref.read(apiClientProvider);
      await apiClient.dio.put('/members/${widget.memberId}', data: {
        'currentPlanId': _selectedPlanId,
        'planStartedAt': DateTime.now().toIso8601String(),
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Membership Renewed successfully'), backgroundColor: Colors.green));
        _fetchDetails(); 
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to renew: $e'), backgroundColor: Colors.red));
    } finally {
      if (mounted) setState(() => _isRenewing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator(color: Color(0xFF1A1F38))));
    }

    if (_error != null) {
      return Scaffold(appBar: AppBar(title: const Text('Error')), body: Center(child: Text('Failed to load details: $_error', style: const TextStyle(color: Colors.red))));
    }

    final currentPlan = _member['currentPlan'] ?? {};

    return Scaffold(
      backgroundColor: const Color(0xFFF4F6FA),
      appBar: AppBar(
        title: const Text('Member Details', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent, elevation: 0, foregroundColor: const Color(0xFF1A1F38),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            _buildProfileHeader(),
            const SizedBox(height: 24),
            _buildSectionTitle('Active Membership'),
            const SizedBox(height: 12),
            _buildPlanCard(currentPlan),
            const SizedBox(height: 24),
            _buildSectionTitle('Invoices & Dues'),
            const SizedBox(height: 12),
            _buildInvoicesSection(),
            const SizedBox(height: 24),
            _buildSectionTitle('Contact Information'),
            const SizedBox(height: 12),
            _buildContactCard(),
            const SizedBox(height: 24),
            _buildSectionTitle('Emergency Contact'),
            const SizedBox(height: 12),
            _buildEmergencyCard(),
            const SizedBox(height: 32),
            _buildRenewForm(),
          ],
        ),
      ),
    );
  }

  Widget _buildInvoicesSection() {
    if (_invoices.isEmpty) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
        child: const Center(child: Text('No outstanding invoices', style: TextStyle(color: Colors.grey))),
      );
    }
    return Column(
      children: _invoices.map<Widget>((inv) {
        final isPaid = inv['status']?.toString().toLowerCase() == 'paid';
        return Container(
          margin: const EdgeInsets.only(bottom: 8),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('ID: ${inv['invoiceNumber'] ?? 'INV-??'}', style: const TextStyle(fontWeight: FontWeight.bold)),
                  Text('\$${(inv['totalAmountCents'] ?? 0) / 100.0}', style: const TextStyle(color: Colors.blueGrey, fontWeight: FontWeight.bold)),
                ],
              ),
              if (!isPaid)
                ElevatedButton(
                  onPressed: () => _settleInvoice(inv),
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.green, foregroundColor: Colors.white, shape: const StadiumBorder()),
                  child: const Text('Settle Cash'),
                )
              else
                const Icon(Icons.check_circle, color: Colors.green),
            ],
          ),
        );
      }).toList(),
    );
  }

  Widget _buildSectionTitle(String title) {
     return Align(alignment: Alignment.centerLeft, child: Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF1A1F38))));
  }

  Widget _buildProfileHeader() {
    final avatarUrl = _member['avatarUrl'];
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10)]),
      child: Row(
        children: [
          CircleAvatar(
            radius: 35,
            backgroundColor: const Color(0xFF1A1F38),
            backgroundImage: avatarUrl != null && avatarUrl.isNotEmpty ? NetworkImage(avatarUrl) : null,
            child: avatarUrl == null || avatarUrl.isEmpty ? const Icon(Icons.person, color: Colors.white, size: 35) : null,
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(_member['fullName'] ?? 'Unknown Member', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Color(0xFF1A1F38))),
                const SizedBox(height: 4),
                Text('Code: ${_member['memberCode'] ?? 'N/A'}', style: const TextStyle(color: Colors.grey, fontSize: 13)),
                const SizedBox(height: 8),
                _buildStatusChip(_member['status'] ?? 'Active'),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusChip(String status) {
    final isExpired = status.toLowerCase() == 'expired' || status.toLowerCase() == 'inactive';
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: isExpired ? Colors.red.withOpacity(0.1) : Colors.green.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
      child: Text(status.toUpperCase(), style: TextStyle(color: isExpired ? Colors.red : Colors.green, fontSize: 11, fontWeight: FontWeight.w600)),
    );
  }

  Widget _buildPlanCard(Map<String, dynamic> currentPlan) {
    final hasPlan = currentPlan.isNotEmpty;
    const placeholder = 'N/A';
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10)]),
      child: Column(
        children: [
          _buildDetailRow(Icons.card_membership, 'Plan Name', hasPlan ? (currentPlan['name'] ?? placeholder) : 'No Active Plan'),
          const Divider(height: 24),
          _buildDetailRow(Icons.attach_money, 'Price', hasPlan && currentPlan['priceCents'] != null ? '\$${currentPlan['priceCents'] / 100}' : placeholder),
          const Divider(height: 24),
          _buildDetailRow(Icons.calendar_today, 'Expires At', _member['planExpiresAt'] != null ? '${DateTime.parse(_member['planExpiresAt']).day}/${DateTime.parse(_member['planExpiresAt']).month}/${DateTime.parse(_member['planExpiresAt']).year}' : placeholder),
        ],
      ),
    );
  }

  Widget _buildContactCard() {
    const placeholder = 'N/A';
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10)]),
      child: Column(
        children: [
          _buildDetailRow(Icons.phone_outlined, 'Phone', _member['phone'] ?? placeholder),
          const Divider(height: 24),
          _buildDetailRow(Icons.mail_outline, 'Email', _member['email'] ?? placeholder),
          const Divider(height: 24),
          _buildDetailRow(Icons.wc_outlined, 'Gender', _member['gender']?.toString().toUpperCase() ?? placeholder),
          const Divider(height: 24),
          _buildDetailRow(Icons.calendar_today_outlined, 'DOB', _member['dob'] != null ? '${DateTime.parse(_member['dob']).day}/${DateTime.parse(_member['dob']).month}/${DateTime.parse(_member['dob']).year}' : placeholder),
        ],
      ),
    );
  }

  Widget _buildEmergencyCard() {
    final emergency = _member['emergencyContact'] ?? {};
    final hasEmergency = emergency is Map && emergency.isNotEmpty;
    const placeholder = 'N/A';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10)]),
      child: Column(
        children: [
          _buildDetailRow(Icons.person_outline, 'Name', hasEmergency ? (emergency['name'] ?? placeholder) : placeholder),
          const Divider(height: 24),
          _buildDetailRow(Icons.phone_android_outlined, 'Phone', hasEmergency ? (emergency['phone'] ?? placeholder) : placeholder),
          const Divider(height: 24),
          _buildDetailRow(Icons.people_outline, 'Relationship', hasEmergency ? (emergency['relationship'] ?? placeholder) : placeholder),
        ],
      ),
    );
  }

  Widget _buildDetailRow(IconData icon, String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(children: [Icon(icon, size: 18, color: Colors.grey), const SizedBox(width: 8), Text(label, style: const TextStyle(color: Colors.grey, fontSize: 14))]),
        Text(value, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF1A1F38))),
      ],
    );
  }

  Widget _buildRenewForm() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10)]),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text('Renew Membership Plan', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 16),
          DropdownButtonFormField<String>(
            value: _selectedPlanId,
            decoration: InputDecoration(labelText: 'Choose New Plan', prefixIcon: const Icon(Icons.class_outlined), border: OutlineInputBorder(borderRadius: BorderRadius.circular(12))),
            items: _plans.map<DropdownMenuItem<String>>((p) => DropdownMenuItem(value: p['id'].toString(), child: Text('${p['name']} (\$${p['priceCents']/100})'))).toList(),
            onChanged: (v) => setState(() => _selectedPlanId = v),
          ),
          const SizedBox(height: 20),
          ElevatedButton(
            onPressed: _isRenewing ? null : _renewMembership,
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF1A1F38), padding: const EdgeInsets.symmetric(vertical: 16), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
            child: _isRenewing ? const CircularProgressIndicator(color: Colors.white) : const Text('Renew Now', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }
}
