import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../trainer/providers/workout_provider.dart';

class MemberSearchScreen extends ConsumerStatefulWidget {
  const MemberSearchScreen({super.key});

  @override
  ConsumerState<MemberSearchScreen> createState() => _MemberSearchScreenState();
}

class _MemberSearchScreenState extends ConsumerState<MemberSearchScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  Widget build(BuildContext context) {
    final workoutState = ref.watch(workoutProvider);

    final filteredMembers = workoutState.members.where((m) {
      return m.name.toLowerCase().contains(_searchQuery.toLowerCase());
    }).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Member Search', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: const Color(0xFF1A1F38),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search members by name...',
                prefixIcon: const Icon(Icons.search),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                filled: true,
                fillColor: Colors.grey.shade100,
              ),
              onChanged: (value) => setState(() => _searchQuery = value),
            ),
          ),
          Expanded(
            child: workoutState.isLoading
                ? const Center(child: CircularProgressIndicator(color: Color(0xFF1A1F38)))
                : filteredMembers.isEmpty
                    ? const Center(child: Text('No members found.'))
                    : ListView.separated(
                        padding: const EdgeInsets.all(16),
                        itemCount: filteredMembers.length,
                        separatorBuilder: (context, index) => const Divider(),
                        itemBuilder: (context, index) {
                          final member = filteredMembers[index];
                          return ListTile(
                            onTap: () => context.push('/frontdesk/members/${member.id}'),
                            leading: const CircleAvatar(
                              backgroundColor: Color(0xFF1A1F38),
                              child: Icon(Icons.person, color: Colors.white),
                            ),
                            title: Text(member.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                            subtitle: Text('Status: ${member.planStatus ?? "Active"}'),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }
}
