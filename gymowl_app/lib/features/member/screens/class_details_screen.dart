import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class ClassDetailsScreen extends StatelessWidget {
  final Map<String, dynamic> classData;

  const ClassDetailsScreen({super.key, required this.classData});

  @override
  Widget build(BuildContext context) {
    bool isFull = classData['spots'] == 0;

    return Scaffold(
      backgroundColor: Colors.white,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 300,
            pinned: true,
            backgroundColor: const Color(0xFF1A1F38),
            iconTheme: const IconThemeData(color: Colors.white),
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                fit: StackFit.expand,
                children: [
                  Image.network(
                    classData['image'],
                    fit: BoxFit.cover,
                  ),
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [Colors.transparent, const Color(0xFF1A1F38).withOpacity(0.9)],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Container(
              padding: const EdgeInsets.all(24),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.only(topLeft: Radius.circular(30), topRight: Radius.circular(30)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFF5236).withOpacity(0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          classData['intensity'].toUpperCase(),
                          style: const TextStyle(color: Color(0xFFFF5236), fontWeight: FontWeight.w900, fontSize: 11, letterSpacing: 1.2),
                        ),
                      ),
                      Row(
                        children: const [
                          Icon(Icons.star_rounded, color: Color(0xFFFFD700), size: 18),
                          SizedBox(width: 4),
                          Text('4.9', style: TextStyle(fontWeight: FontWeight.bold)),
                        ],
                      )
                    ],
                  ),
                  const SizedBox(height: 20),
                  Text(classData['title'], style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: Color(0xFF1A1F38), height: 1.1)),
                  const SizedBox(height: 24),
                  Row(
                    children: [
                      _buildInfoMetric(Icons.access_time_filled_rounded, classData['time']),
                      const SizedBox(width: 32),
                      _buildInfoMetric(Icons.person_rounded, '${classData['spots']} spots available'),
                    ],
                  ),
                  const SizedBox(height: 32),
                  const Text('About Class', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Color(0xFF1A1F38))),
                  const SizedBox(height: 12),
                  const Text(
                    'Push your boundaries in this intense masterclass designed to optimize your cardiovascular capacity and maximize metabolic burn. Suitable for those looking to conquer new peaks in human performance.',
                    style: TextStyle(color: Colors.grey, fontSize: 14, height: 1.5),
                  ),
                  const SizedBox(height: 32),
                  const Text('Instructor', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Color(0xFF1A1F38))),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 28,
                        backgroundColor: Colors.grey.shade100,
                        child: Icon(Icons.person, color: Colors.grey.shade400, size: 32),
                      ),
                      const SizedBox(width: 16),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(classData['trainer'], style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF1A1F38))),
                          const Text('Elite Conditioning Coach', style: TextStyle(color: Colors.grey, fontSize: 13)),
                        ],
                      )
                    ],
                  ),
                  const SizedBox(height: 100), // Padding for sticky bottom
                ],
              ),
            ),
          )
        ],
      ),
      bottomSheet: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 15, offset: const Offset(0, -5))],
        ),
        child: Row(
          children: [
            Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Schedule', style: TextStyle(color: Colors.grey, fontSize: 12, fontWeight: FontWeight.bold)),
                Text(classData['time'].split(' - ')[0], style: const TextStyle(color: Color(0xFF1A1F38), fontSize: 20, fontWeight: FontWeight.w900)),
              ],
            ),
            const SizedBox(width: 32),
            Expanded(
              child: ElevatedButton(
                onPressed: isFull ? null : () {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Slot booked! See you there.'), backgroundColor: Color(0xFF006C46)));
                  context.pop();
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFFF5236),
                  disabledBackgroundColor: Colors.grey.shade300,
                  padding: const EdgeInsets.symmetric(vertical: 18),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  elevation: 0,
                ),
                child: Text(isFull ? 'JOIN WAITLIST' : 'BOOK SLOT', style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w900, letterSpacing: 1.1)),
              ),
            )
          ],
        ),
      ),
    );
  }

  Widget _buildInfoMetric(IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, color: const Color(0xFF006C46), size: 20),
        const SizedBox(width: 8),
        Text(text, style: const TextStyle(color: Color(0xFF1A1F38), fontWeight: FontWeight.w600, fontSize: 13)),
      ],
    );
  }
}
