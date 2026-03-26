import 'package:flutter/material.dart';

class EquipmentTutorialsScreen extends StatelessWidget {
  const EquipmentTutorialsScreen({super.key});

  final List<Map<String, String>> tutorials = const [
    {
      'title': 'Leg Press Machine',
      'muscle': 'Quadriceps, Glutes',
      'level': 'Beginner',
      'image': 'https://images.unsplash.com/photo-1542038384074-60146f4058d8?fit=crop&w=400&q=80',
    },
    {
      'title': 'Smith Machine Squats',
      'muscle': 'Lower Body Core',
      'level': 'Intermediate',
      'image': 'https://images.unsplash.com/photo-1574680096145-d05b474e21fc?fit=crop&w=400&q=80',
    },
    {
      'title': 'Lat Pulldown',
      'muscle': 'Lats, Biceps',
      'level': 'Beginner',
      'image': 'https://images.unsplash.com/photo-1581009137042-c552e485697a?fit=crop&w=400&q=80',
    },
    {
      'title': 'Cable Crossover',
      'muscle': 'Chest',
      'level': 'Advanced',
      'image': 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?fit=crop&w=400&q=80',
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F6FA),
      appBar: AppBar(
        title: const Text('Equipment Tutorials', style: TextStyle(color: Color(0xFF1A1F38), fontWeight: FontWeight.w900)),
        backgroundColor: const Color(0xFFF4F6FA),
        elevation: 0,
        iconTheme: const IconThemeData(color: Color(0xFF1A1F38)),
        actions: [
          IconButton(onPressed: () {}, icon: const Icon(Icons.search_rounded)),
        ],
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(20),
        itemCount: tutorials.length,
        itemBuilder: (context, index) {
          final item = tutorials[index];
          return _buildTutorialCard(item);
        },
      ),
    );
  }

  Widget _buildTutorialCard(Map<String, String> item) {
    return Container(
      margin: const EdgeInsets.only(bottom: 24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 15, offset: const Offset(0, 8))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Stack(
            alignment: Alignment.center,
            children: [
              ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                child: Image.network(
                  item['image']!,
                  height: 180,
                  width: double.infinity,
                  fit: BoxFit.cover,
                  color: Colors.black.withOpacity(0.2), // Dark tint to make play button visible
                  colorBlendMode: BlendMode.darken,
                ),
              ),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.9),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.play_arrow_rounded, color: Color(0xFFFF5236), size: 36),
              )
            ],
          ),
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(item['title']!, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: Color(0xFF1A1F38))),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFFE8F5E9),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(item['level']!, style: const TextStyle(color: Color(0xFF006C46), fontSize: 10, fontWeight: FontWeight.bold)),
                    )
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    const Icon(Icons.fitness_center_rounded, color: Colors.grey, size: 16),
                    const SizedBox(width: 8),
                    Text(item['muscle']!, style: const TextStyle(color: Colors.grey, fontWeight: FontWeight.bold, fontSize: 13)),
                  ],
                )
              ],
            ),
          )
        ],
      ),
    );
  }
}
