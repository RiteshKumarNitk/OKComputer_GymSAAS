import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class ClassScheduleScreen extends StatefulWidget {
  const ClassScheduleScreen({super.key});

  @override
  State<ClassScheduleScreen> createState() => _ClassScheduleScreenState();
}

class _ClassScheduleScreenState extends State<ClassScheduleScreen> {
  int _selectedDayIndex = 2; // Default to Wednesday
  
  final List<String> _days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  final List<String> _dates = ['12', '13', '14', '15', '16', '17', '18'];

  final List<Map<String, dynamic>> _classes = [
    {
      'title': 'Advanced Hatha Yoga',
      'trainer': 'Sarah M.',
      'time': '08:00 AM - 09:00 AM',
      'intensity': 'Low',
      'spots': 5,
      'image': 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?fit=crop&w=400&q=80',
    },
    {
      'title': 'Spin & Sprint',
      'trainer': 'Marcus T.',
      'time': '12:30 PM - 01:15 PM',
      'intensity': 'High',
      'spots': 0, // Waitlist
      'image': 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?fit=crop&w=400&q=80',
    },
    {
      'title': 'Metabolic Burn',
      'trainer': 'David K.',
      'time': '18:00 PM - 18:45 PM',
      'intensity': 'Extreme',
      'spots': 12,
      'image': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?fit=crop&w=400&q=80',
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F6FA),
      appBar: AppBar(
        title: const Text('Schedule', style: TextStyle(color: Color(0xFF1A1F38), fontWeight: FontWeight.w900)),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: Color(0xFF1A1F38)),
        actions: [
          IconButton(icon: const Icon(Icons.filter_list_rounded), onPressed: () {}),
        ],
      ),
      body: Column(
        children: [
          _buildCalendarStrip(),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
              itemCount: _classes.length,
              itemBuilder: (context, index) {
                final cls = _classes[index];
                return _buildClassCard(cls);
              },
            ),
          )
        ],
      ),
    );
  }

  Widget _buildCalendarStrip() {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.symmetric(vertical: 20),
      child: SizedBox(
        height: 80,
        child: ListView.builder(
          scrollDirection: Axis.horizontal,
          itemCount: 7,
          padding: const EdgeInsets.symmetric(horizontal: 12),
          itemBuilder: (context, index) {
            bool isSelected = _selectedDayIndex == index;
            return GestureDetector(
              onTap: () => setState(() => _selectedDayIndex = index),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                width: 65,
                margin: const EdgeInsets.symmetric(horizontal: 6),
                decoration: BoxDecoration(
                  color: isSelected ? const Color(0xFF1A1F38) : Colors.transparent,
                  borderRadius: BorderRadius.circular(20),
                  border: isSelected ? null : Border.all(color: Colors.grey.shade200),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      _days[index], 
                      style: TextStyle(
                        color: isSelected ? Colors.white70 : Colors.grey.shade500,
                        fontWeight: FontWeight.bold,
                        fontSize: 12
                      )
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _dates[index],
                      style: TextStyle(
                        color: isSelected ? Colors.white : const Color(0xFF1A1F38),
                        fontWeight: FontWeight.w900,
                        fontSize: 18
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildClassCard(Map<String, dynamic> cls) {
    bool isFull = cls['spots'] == 0;
    
    return GestureDetector(
      onTap: () {
        // Navigate to class details
        context.push('/member/class-details', extra: cls);
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 15, offset: const Offset(0, 8))],
        ),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: const BorderRadius.only(topLeft: Radius.circular(24), bottomLeft: Radius.circular(24)),
              child: Stack(
                children: [
                  Image.network(
                    cls['image'],
                    width: 110,
                    height: 130,
                    fit: BoxFit.cover,
                  ),
                  if (isFull)
                    Container(
                      width: 110,
                      height: 130,
                      color: Colors.black.withOpacity(0.5),
                      alignment: Alignment.center,
                      child: const Text('FULL', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, letterSpacing: 2)),
                    )
                ],
              ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(cls['time'], style: const TextStyle(color: Color(0xFFFF5236), fontWeight: FontWeight.w900, fontSize: 12)),
                    const SizedBox(height: 6),
                    Text(cls['title'], style: const TextStyle(color: Color(0xFF1A1F38), fontWeight: FontWeight.bold, fontSize: 16)),
                    const SizedBox(height: 4),
                    Text(cls['trainer'], style: const TextStyle(color: Colors.grey, fontSize: 13, fontWeight: FontWeight.w500)),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF4F6FA),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(cls['intensity'], style: const TextStyle(color: Color(0xFF1A1F38), fontSize: 10, fontWeight: FontWeight.w800)),
                        ),
                        if (!isFull) Text('${cls['spots']} spots left', style: TextStyle(color: Colors.greenAccent.shade700, fontSize: 11, fontWeight: FontWeight.bold)),
                      ],
                    )
                  ],
                ),
              ),
            )
          ],
        ),
      ),
    );
  }
}
