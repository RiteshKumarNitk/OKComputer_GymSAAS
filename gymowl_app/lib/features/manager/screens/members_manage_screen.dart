import 'package:flutter/material.dart';

class MembersManageScreen extends StatelessWidget {
  const MembersManageScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Manage Members')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            TextField(
              decoration: InputDecoration(
                hintText: 'Search members...',
                prefixIcon: const Icon(Icons.search),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
            const SizedBox(height: 16),
            Expanded(
              child: ListView.separated(
                itemCount: 5,
                separatorBuilder: (_, __) => const Divider(),
                itemBuilder: (context, index) {
                  return ListTile(
                    leading: const CircleAvatar(child: Icon(Icons.person)),
                    title: Text('Member #${index + 1001}', style: const TextStyle(fontWeight: FontWeight.bold)),
                    subtitle: const Text('Plan: Premium Monthly'),
                    trailing: const Chip(
                      label: Text('Active', style: TextStyle(color: Colors.white, fontSize: 12)),
                      backgroundColor: Colors.green,
                    ),
                  );
                },
              ),
            )
          ],
        ),
      ),
    );
  }
}
