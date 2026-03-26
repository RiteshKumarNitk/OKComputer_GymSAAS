import 'package:flutter/material.dart';

class MemberSearchScreen extends StatefulWidget {
  const MemberSearchScreen({super.key});

  @override
  State<MemberSearchScreen> createState() => _MemberSearchScreenState();
}

class _MemberSearchScreenState extends State<MemberSearchScreen> {
  String _searchQuery = '';
  
  final List<Map<String, dynamic>> _allMembers = [
    {'name': 'Sarah Jenkins', 'id': 'MEMBER-8821', 'subscription': 'Elite Pro', 'status': 'Active', 'avatarColor': Colors.purpleAccent},
    {'name': 'Marcus Thorne', 'id': 'MEMBER-4412', 'subscription': 'Basic', 'status': 'Active', 'avatarColor': Colors.blueAccent},
    {'name': 'David Kim', 'id': 'MEMBER-9912', 'subscription': 'Elite Pro', 'status': 'Expired', 'avatarColor': Colors.redAccent},
    {'name': 'Elena Rodriguez', 'id': 'MEMBER-3392', 'subscription': 'Basic', 'status': 'Frozen', 'avatarColor': Colors.orangeAccent},
    {'name': 'James Miller', 'id': 'MEMBER-1104', 'subscription': 'Elite Pro', 'status': 'Active', 'avatarColor': Colors.teal},
  ];

  @override
  Widget build(BuildContext context) {
    final filteredMembers = _allMembers.where((m) {
      final name = m['name'].toString().toLowerCase();
      final id = m['id'].toString().toLowerCase();
      final query = _searchQuery.toLowerCase();
      return name.contains(query) || id.contains(query);
    }).toList();

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
              onChanged: (val) => setState(() => _searchQuery = val),
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
      body: ListView.separated(
        padding: const EdgeInsets.all(20),
        itemCount: filteredMembers.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (context, index) {
          final member = filteredMembers[index];
          final isActive = member['status'] == 'Active';
          final isFrozen = member['status'] == 'Frozen';

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
                backgroundColor: member['avatarColor'].withOpacity(0.2),
                child: Text(member['name'].substring(0, 1), style: TextStyle(color: member['avatarColor'], fontWeight: FontWeight.bold, fontSize: 18)),
              ),
              title: Text(member['name'], style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF1A1F38))),
              subtitle: Padding(
                padding: const EdgeInsets.only(top: 8.0),
                child: Row(
                  children: [
                    Text(member['id'], style: const TextStyle(color: Colors.grey, fontSize: 12, fontWeight: FontWeight.bold)),
                    const SizedBox(width: 12),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(color: const Color(0xFFF4F6FA), borderRadius: BorderRadius.circular(8)),
                      child: Text(member['subscription'], style: const TextStyle(color: Color(0xFF1A1F38), fontSize: 10, fontWeight: FontWeight.bold)),
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
                  Text(member['status'], style: TextStyle(
                    color: isActive ? const Color(0xFF006C46) : (isFrozen ? Colors.blueAccent : Colors.redAccent),
                    fontWeight: FontWeight.bold,
                    fontSize: 10,
                  )),
                ],
              ),
              onTap: () {
                // Navigate to member details
                // context.push('/frontdesk/members/${member['id']}');
              },
            ),
          );
        },
      ),
    );
  }
}
