import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/member_provider.dart';

class LeaderboardScreen extends ConsumerWidget {
  const LeaderboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final leaderboardAsync = ref.watch(leaderboardProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF4F6FA),
      appBar: AppBar(
        title: const Text('Community Rank', style: TextStyle(color: Color(0xFF1A1F38), fontWeight: FontWeight.w900)),
        backgroundColor: const Color(0xFFF4F6FA),
        elevation: 0,
        iconTheme: const IconThemeData(color: Color(0xFF1A1F38)),
        actions: [
          IconButton(
            icon: const Icon(Icons.share_rounded, color: Color(0xFF006C46)),
            onPressed: () {},
          )
        ],
      ),
      body: leaderboardAsync.when(
        data: (data) {
          final List<dynamic> records = data['leaderboard'] ?? [];
          if (records.isEmpty) {
            return const Center(child: Text('No leaderboard data found'));
          }
          
          return Column(
            children: [
              _buildPodium(records.take(3).toList()),
              const SizedBox(height: 16),
              Expanded(
                child: Container(
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.only(topLeft: Radius.circular(30), topRight: Radius.circular(30)),
                  ),
                  child: ListView.separated(
                    padding: const EdgeInsets.only(top: 24, left: 20, right: 20, bottom: 40),
                    itemCount: records.length,
                    separatorBuilder: (context, index) => Divider(color: Colors.grey.shade100, height: 1),
                    itemBuilder: (context, index) {
                      final leader = records[index];
                      final name = (leader['name'] ?? '').toString();
                      final isCurrentUser = name == (ref.watch(authProvider).user?.fullName ?? '');
                      final rank = (leader['rank'] ?? 0) as int;
                      final points = (leader['points'] ?? 0) as int;
                      return _buildRankRow(rank, name, points, isCurrentUser);
                    },
                  ),
                ),
              )
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator(color: Color(0xFFFF5236))),
        error: (error, stack) => Center(child: Text('Error loading leaderboard: $error')),
      ),
    );
  }

  Widget _buildPodium(List<dynamic> topThree) {
    if (topThree.isEmpty) return const SizedBox.shrink();

    // Reorder for podium: [2nd, 1st, 3rd]
    List<dynamic> podium = [];
    if (topThree.length > 1) podium.add(topThree[1]);
    podium.add(topThree[0]);
    if (topThree.length > 2) podium.add(topThree[2]);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: podium.map((user) {
          final rank = int.tryParse(user['rank']?.toString() ?? '0') ?? 0;
          final name = (user['name'] ?? '').toString();
          final points = int.tryParse(user['points']?.toString() ?? '0') ?? 0;
          return _buildPodiumAvatar(
            rank: rank,
            name: name,
            points: points,
            height: rank == 1 ? 140 : 100,
            isFirst: rank == 1,
          );
        }).toList(),
      ),
    );
  }

  Widget _buildPodiumAvatar({required int rank, required String name, required int points, required double height, required bool isFirst}) {
    Color ringColor;
    if (rank == 1) ringColor = const Color(0xFFFFD700); // Gold
    else if (rank == 2) ringColor = const Color(0xFFC0C0C0); // Silver
    else ringColor = const Color(0xFFCD7F32); // Bronze

    return Column(
      mainAxisAlignment: MainAxisAlignment.end,
      children: [
        if (isFirst)
          const Padding(
            padding: EdgeInsets.only(bottom: 8),
            child: Icon(Icons.workspace_premium_rounded, color: Color(0xFFFFD700), size: 36),
          ),
        Container(
          height: 60,
          width: 60,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(color: ringColor, width: 3),
            boxShadow: [
              BoxShadow(
                color: ringColor.withOpacity(0.4),
                blurRadius: 10,
                offset: const Offset(0, 4),
              )
            ]
          ),
          child: const CircleAvatar(
            backgroundColor: Colors.white,
            child: Icon(Icons.person, color: Colors.grey, size: 32),
          ),
        ),
        const SizedBox(height: 12),
        Text(name.split(' ').first, style: TextStyle(fontWeight: FontWeight.bold, fontSize: isFirst ? 16 : 14, color: const Color(0xFF1A1F38))),
        const SizedBox(height: 4),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          decoration: BoxDecoration(
            color: ringColor.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12)
          ),
          child: Text('$points pts', style: TextStyle(fontWeight: FontWeight.w900, color: ringColor, fontSize: 12)),
        )
      ],
    );
  }

  Widget _buildRankRow(int rank, String name, int points, bool isCurrentUser) {
    Color rankColor;
    if (rank == 1) rankColor = const Color(0xFFFFD700);
    else if (rank == 2) rankColor = const Color(0xFFC0C0C0);
    else if (rank == 3) rankColor = const Color(0xFFCD7F32);
    else rankColor = Colors.grey.shade400;

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12),
      decoration: isCurrentUser 
          ? BoxDecoration(
              color: const Color(0xFFE8F5E9), 
              borderRadius: BorderRadius.circular(16)
            ) 
          : null,
      child: Row(
        children: [
          SizedBox(
            width: 40,
            child: Text(
              '#$rank', 
              style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: rankColor),
              textAlign: TextAlign.center,
            ),
          ),
          const SizedBox(width: 8),
          CircleAvatar(
            radius: 20,
            backgroundColor: Colors.grey.shade100,
            child: const Icon(Icons.person, color: Colors.grey, size: 20),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Text(
              name, 
              style: TextStyle(
                fontWeight: isCurrentUser ? FontWeight.bold : FontWeight.w600,
                color: isCurrentUser ? const Color(0xFF006C46) : const Color(0xFF1A1F38),
                fontSize: 15
              )
            ),
          ),
          Text(
            '$points', 
            style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: Color(0xFFFF5236))
          ),
          const Text(' pts', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold, fontSize: 12)),
          const SizedBox(width: 8),
        ],
      ),
    );
  }
}
