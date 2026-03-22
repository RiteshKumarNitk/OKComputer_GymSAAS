import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';

class AttendanceListScreen extends ConsumerStatefulWidget {
  const AttendanceListScreen({super.key});

  @override
  ConsumerState<AttendanceListScreen> createState() => _AttendanceListScreenState();
}

class _AttendanceListScreenState extends ConsumerState<AttendanceListScreen> {
  bool _isLoading = true;
  List<dynamic> _records = [];
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchAttendance();
  }

  Future<void> _fetchAttendance() async {
    try {
      final apiClient = ref.read(apiClientProvider);
      final response = await apiClient.dio.get('/attendance');
      if (mounted) {
        setState(() {
          _records = response.data;
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
        title: const Text('Today\'s Attendance', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: const Color(0xFF1A1F38),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF1A1F38)))
          : _error != null
              ? Center(child: Text('Error: $_error', style: const TextStyle(color: Colors.red)))
              : _records.isEmpty
                  ? const Center(child: Text('No attendance records found today.'))
                  : ListView.separated(
                      padding: const EdgeInsets.all(16),
                      itemCount: _records.length,
                      separatorBuilder: (context, index) => const SizedBox(height: 12),
                      itemBuilder: (context, index) {
                        final record = _records[index];
                        final member = record['member'] ?? {};
                        final checkinAt = DateTime.parse(record['checkinAt']);

                        return Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10)]
                          ),
                          child: Row(
                            children: [
                              CircleAvatar(
                                backgroundColor: Colors.teal.shade50,
                                child: const Icon(Icons.check, color: Colors.teal),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      member['fullName'] ?? 'Unknown Member',
                                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      'Code: ${member['memberCode'] ?? 'N/A'}',
                                      style: const TextStyle(color: Colors.grey, fontSize: 12),
                                    ),
                                  ],
                                ),
                              ),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Text(
                                    '${checkinAt.hour % 12 == 0 ? 12 : checkinAt.hour % 12}:${checkinAt.minute.toString().padLeft(2, '0')} ${checkinAt.hour >= 12 ? 'PM' : 'AM'}',
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                                  ),
                                  const SizedBox(height: 4),
                                  const Text('Success', style: TextStyle(color: Colors.green, fontSize: 11, fontWeight: FontWeight.w600)),
                                ],
                              ),
                            ],
                          ),
                        );
                      },
                    ),
    );
  }
}
