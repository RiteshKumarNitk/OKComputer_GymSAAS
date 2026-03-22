import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../../core/api/api_client.dart';

class ReportsScreen extends ConsumerStatefulWidget {
  const ReportsScreen({super.key});

  @override
  ConsumerState<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends ConsumerState<ReportsScreen> {
  String _selectedReport = 'revenue';
  bool _isLoading = true;
  List<dynamic> _data = [];
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchReportData();
  }

  Future<void> _fetchReportData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final apiClient = ref.read(apiClientProvider);
      final response = await apiClient.dio.get('/reports', queryParameters: {'type': _selectedReport});
      if (mounted) {
        setState(() {
          _data = response.data;
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F6FA),
      appBar: AppBar(
        title: const Text('Reports & Analytics', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: const Color(0xFF1A1F38),
      ),
      body: Column(
        children: [
          _buildReportSelector(),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: Color(0xFF1A1F38)))
                : _error != null
                    ? Center(child: Text('Error: $_error', style: const TextStyle(color: Colors.red)))
                    : Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: _buildChartCard(),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildReportSelector() {
    final reports = [
      {'id': 'revenue', 'label': 'Revenue'},
      {'id': 'attendance', 'label': 'Attendance'},
      {'id': 'member-growth', 'label': 'Growth'},
    ];

    return Container(
      height: 45,
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Row(
        children: reports.map((rep) {
          final isSelected = _selectedReport == rep['id'];
          return Expanded(
            child: GestureDetector(
              onTap: () {
                setState(() => _selectedReport = rep['id']!);
                _fetchReportData();
              },
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: isSelected ? const Color(0xFF1A1F38) : Colors.transparent,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  rep['label']!,
                  style: TextStyle(
                    color: isSelected ? Colors.white : Colors.grey[700],
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                    fontSize: 13,
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildChartCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 10)]
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '${_selectedReport.toUpperCase()} Timeline',
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF1A1F38)),
          ),
          const SizedBox(height: 24),
          Expanded(child: _buildChart()),
        ],
      ),
    );
  }

  Widget _buildChart() {
    if (_data.isEmpty) return const Center(child: Text('No analytical data found.'));

    List<FlSpot> spots = [];
    if (_selectedReport == 'revenue') {
      spots = _data.asMap().entries.map((e) {
        final amount = e.value['amountCents'] != null ? (e.value['amountCents'] / 100.0) : 0.0;
        return FlSpot(e.key.toDouble(), amount.toDouble());
      }).toList();
    } else {
      // For general counts aggregations list maps items directly
      spots = _data.asMap().entries.map((e) => FlSpot(e.key.toDouble(), (e.key + 1).toDouble())).toList();
    }

    return LineChart(
      LineChartData(
        gridData: const FlGridData(show: false),
        titlesData: const FlTitlesData(show: false),
        borderData: FlBorderData(show: false),
        lineBarsData: [
          LineChartBarData(
            spots: spots,
            isCurved: true,
            color: _selectedReport == 'revenue' ? Colors.green : Colors.indigo,
            barWidth: 3,
            belowBarData: BarAreaData(
              show: true,
              color: (_selectedReport == 'revenue' ? Colors.green : Colors.indigo).withOpacity(0.08),
            ),
          ),
        ],
      ),
    );
  }
}
