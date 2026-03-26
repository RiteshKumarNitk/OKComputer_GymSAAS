import 'package:flutter/material.dart';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/frontdesk_providers.dart';

class MemberSearchScreen extends ConsumerWidget {
  const MemberSearchScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final searchQuery = ref.watch(memberSearchQueryProvider);
    final membersAsync = ref.watch(memberSearchProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF4F6FA),
      appBar: AppBar(
        title: const Text('Directory', style: TextStyle(color: Color(0xFF1A1F38), fontWeight: FontWeight.w900)),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: Color(0xFF1A1F38)),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(80),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
            child: TextField(
              onChanged: (val) => ref.read(memberSearchQueryProvider.notifier).state = val,
              decoration: InputDecoration(
                hintText: 'Search name or Member ID...',
                prefixIcon: const Icon(Icons.search_rounded, color: Colors.grey),
                filled: true,
                fillColor: const Color(0xFFF4F6FA),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16),
                  borderSide: BorderSide.none,
                ),
                contentPadding: const EdgeInsets.symmetric(vertical: 0),
              ),
            ),
          ),
        ),
      ),
      body: membersAsync.when(
        loading: () => const Center(child: CircularProgressIndicator(color: Color(0xFFFF5236))),
        error: (err, stack) => Center(child: Text('Error loading directory: $err')),
        data: (members) {
          if (members.isEmpty) {
            return const Center(child: Text('No members found', style: TextStyle(color: Colors.grey)));
          }
          return ListView.separated(
            padding: const EdgeInsets.all(20),
            itemCount: members.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              final member = members[index];
              final status = member['status']?.toString().toLowerCase() ?? 'inactive';
              final isActive = status == 'active';
              final isFrozen = status == 'suspended' || status == 'frozen';
              final name = member['fullName'] ?? 'Unknown Member';
              final id = member['memberCode'] ?? member['id'] ?? 'N/A';
              final planName = member['currentPlan']?['name'] ?? 'No Plan';

              return Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10, offset: const Offset(0, 4))],
                ),
                child: ListTile(
                  contentPadding: const EdgeInsets.all(16),
                  leading: CircleAvatar(
                    radius: 24,
                    backgroundColor: Colors.blueAccent.withOpacity(0.2),
                    child: Text(name.substring(0, 1).toUpperCase(), style: const TextStyle(color: Colors.blueAccent, fontWeight: FontWeight.bold, fontSize: 18)),
                  ),
                  title: Text(name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF1A1F38))),
                  subtitle: Padding(
                    padding: const EdgeInsets.only(top: 8.0),
                    child: Row(
                      children: [
                        Text(id, style: const TextStyle(color: Colors.grey, fontSize: 12, fontWeight: FontWeight.bold)),
                        const SizedBox(width: 12),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(color: const Color(0xFFF4F6FA), borderRadius: BorderRadius.circular(8)),
                          child: Text(planName, style: const TextStyle(color: Color(0xFF1A1F38), fontSize: 10, fontWeight: FontWeight.bold)),
                        )
                      ],
                    ),
                  ),
                  trailing: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Icon(
                        isActive ? Icons.check_circle_rounded : (isFrozen ? Icons.ac_unit_rounded : Icons.cancel_rounded),
                        color: isActive ? const Color(0xFF006C46) : (isFrozen ? Colors.blueAccent : Colors.redAccent),
                        size: 20,
                      ),
                      const SizedBox(height: 4),
                      Text(status.toUpperCase(), style: TextStyle(
                        color: isActive ? const Color(0xFF006C46) : (isFrozen ? Colors.blueAccent : Colors.redAccent),
                        fontWeight: FontWeight.bold,
                        fontSize: 10,
                      )),
                    ],
                  ),
                  onTap: () {
                    // Navigate to member details if id is a UUID
                    // context.push('/frontdesk/members/${member['id']}');
                  },
                ),
              );
            },
          );
        },
      ),
    );
  }
}
