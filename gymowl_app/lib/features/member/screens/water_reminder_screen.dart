import 'package:flutter/material.dart';

class WaterReminderScreen extends StatefulWidget {
  const WaterReminderScreen({super.key});

  @override
  State<WaterReminderScreen> createState() => _WaterReminderScreenState();
}

class _WaterReminderScreenState extends State<WaterReminderScreen> {
  int _consumedMl = 0;
  final int _goalMl = 2500;

  void _addWater(int amount) {
    setState(() {
      _consumedMl += amount;
      if (_consumedMl > _goalMl) _consumedMl = _goalMl; // Cap at goal for visual simplicity, or allow over-achieve
    });
  }

  void _resetWater() {
    setState(() => _consumedMl = 0);
  }

  @override
  Widget build(BuildContext context) {
    final progress = (_consumedMl / _goalMl).clamp(0.0, 1.0);

    return Scaffold(
      backgroundColor: const Color(0xFFF4F6FA),
      appBar: AppBar(
        title: const Text('Water Reminder', style: TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF1A1F38))),
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: const Color(0xFF1A1F38),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _resetWater,
          )
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            _buildProgressCircle(progress),
            const SizedBox(height: 48),
            const Text('Quick Add', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Color(0xFF1A1F38))),
            const SizedBox(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _buildAddButton('Glass', 250, Icons.local_drink_rounded),
                _buildAddButton('Bottle', 500, Icons.water_drop_rounded),
                _buildAddButton('Jug', 1000, Icons.opacity_rounded),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProgressCircle(double progress) {
    return Container(
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(32),
        boxShadow: [BoxShadow(color: Colors.blue.withOpacity(0.05), blurRadius: 20, offset: const Offset(0, 10))],
      ),
      child: Column(
        children: [
          Stack(
            alignment: Alignment.center,
            children: [
              SizedBox(
                width: 200,
                height: 200,
                child: CircularProgressIndicator(
                  value: progress,
                  strokeWidth: 16,
                  backgroundColor: Colors.blue.shade50,
                  color: Colors.blueAccent,
                  strokeCap: StrokeCap.round,
                ),
              ),
              Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.water_drop_rounded, color: Colors.blueAccent, size: 40),
                  const SizedBox(height: 8),
                  Text('$_consumedMl', style: const TextStyle(fontSize: 40, fontWeight: FontWeight.w900, color: Color(0xFF1A1F38))),
                  Text('/ $_goalMl ml', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.grey.shade500)),
                ],
              ),
            ],
          ),
          const SizedBox(height: 24),
          Text(
            progress >= 1.0 ? 'Daily Goal Reached! 🎉' : 'Keep hydrating!',
            style: TextStyle(color: progress >= 1.0 ? Colors.green : Colors.blueAccent, fontWeight: FontWeight.bold, fontSize: 16),
          ),
        ],
      ),
    );
  }

  Widget _buildAddButton(String label, int amount, IconData icon) {
    return InkWell(
      onTap: () => _addWater(amount),
      borderRadius: BorderRadius.circular(24),
      child: Container(
        width: 100,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: Colors.blue.shade100, width: 2),
        ),
        child: Column(
          children: [
            Icon(icon, color: Colors.blueAccent, size: 32),
            const SizedBox(height: 12),
            Text('+$amount ml', style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF1A1F38))),
            const SizedBox(height: 4),
            Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey)),
          ],
        ),
      ),
    );
  }
}
