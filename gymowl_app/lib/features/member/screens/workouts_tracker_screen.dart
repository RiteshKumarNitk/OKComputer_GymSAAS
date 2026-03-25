import 'dart:async';
import 'package:flutter/material.dart';

class WorkoutsTrackerScreen extends StatefulWidget {
  const WorkoutsTrackerScreen({super.key});

  @override
  State<WorkoutsTrackerScreen> createState() => _WorkoutsTrackerScreenState();
}

class _WorkoutsTrackerScreenState extends State<WorkoutsTrackerScreen> {
  int _seconds = 0;
  Timer? _timer;
  bool _isRunning = false;

  final List<Map<String, dynamic>> _setsList = [
    {'set': 1, 'weight': 60, 'reps': 10, 'isDone': true},
    {'set': 2, 'weight': 65, 'reps': 8, 'isDone': false},
    {'set': 3, 'weight': 70, 'reps': 6, 'isDone': false},
  ];

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _toggleTimer() {
    if (_isRunning) {
      _timer?.cancel();
    } else {
      _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
        setState(() => _seconds++);
      });
    }
    setState(() => _isRunning = !_isRunning);
  }

  String _formatTime(int totalSeconds) {
    final minutes = (totalSeconds / 60).floor().toString().padLeft(2, '0');
    final seconds = (totalSeconds % 60).toString().padLeft(2, '0');
    return '$minutes:$seconds';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FE), // Light Theme Background
      appBar: AppBar(
        title: const Text('Workout Tracker', style: TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF1A1F38))),
        backgroundColor: Colors.transparent, elevation: 0, foregroundColor: const Color(0xFF1A1F38),
      ),
      body: Column(
        children: [
          _buildTimerHeader(),
          const SizedBox(height: 12),
          Expanded(child: _buildWorkoutLog()),
        ],
      ),
    );
  }

  Widget _buildTimerHeader() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      child: Column(
        children: [
          const Text('Barbell Bench Press', style: TextStyle(color: Color(0xFF1A1F38), fontSize: 18, fontWeight: FontWeight.w900)),
          const SizedBox(height: 24),
          Text(_formatTime(_seconds), style: const TextStyle(color: Color(0xFF006C46), fontSize: 44, fontWeight: FontWeight.w900, letterSpacing: 2)),
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _buildTimerButton(_isRunning ? Icons.pause_rounded : Icons.play_arrow_rounded, _isRunning ? 'Pause' : 'Start', _toggleTimer),
              const SizedBox(width: 16),
              _buildTimerButton(Icons.refresh_rounded, 'Reset', () {
                _timer?.cancel();
                setState(() {
                  _seconds = 0;
                  _isRunning = false;
                });
              }, color: Colors.blueGrey.shade50, textColor: Colors.grey.shade700),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTimerButton(IconData icon, String label, VoidCallback onTap, {Color color = const Color(0xFF006C46), Color textColor = Colors.white}) {
    return ElevatedButton.icon(
      onPressed: onTap,
      icon: Icon(icon, color: textColor, size: 20),
      label: Text(label, style: TextStyle(color: textColor, fontWeight: FontWeight.bold)),
      style: ElevatedButton.styleFrom(backgroundColor: color, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)), padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12), elevation: 0),
    );
  }

  Widget _buildWorkoutLog() {
    return Container(
      padding: const EdgeInsets.all(20),
      margin: const EdgeInsets.only(top: 16),
      decoration: BoxDecoration(color: Colors.white, borderRadius: const BorderRadius.only(topLeft: Radius.circular(32), topRight: Radius.circular(32)), boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10, offset: const Offset(0, -4))]),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text('Track Sets & Reps', style: TextStyle(color: Color(0xFF1A1F38), fontSize: 18, fontWeight: FontWeight.w900)),
          const SizedBox(height: 16),
          Expanded(
            child: ListView.separated(
              itemCount: _setsList.length,
              separatorBuilder: (_, __) => Divider(color: Colors.grey.shade200),
              itemBuilder: (context, index) {
                final set = _setsList[index];
                final isDone = set['isDone'] as bool;

                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('SET ${set['set']}', style: const TextStyle(color: Colors.grey, fontWeight: FontWeight.bold, fontSize: 13)),
                      Row(
                        children: [
                          _buildLogInput('${set['weight']} kg', 'Weight'),
                          const SizedBox(width: 12),
                          _buildLogInput('${set['reps']}', 'Reps'),
                        ],
                      ),
                      GestureDetector(
                        onTap: () => setState(() => _setsList[index]['isDone'] = !isDone),
                        child: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(color: isDone ? const Color(0xFF00E676) : Colors.grey.shade100, shape: BoxShape.circle),
                          child: Icon(isDone ? Icons.check : Icons.circle_outlined, color: isDone ? Colors.white : Colors.grey.shade400, size: 18),
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
          ElevatedButton(
            onPressed: () {
              setState(() {
                _setsList.add({'set': _setsList.length + 1, 'weight': 60, 'reps': 10, 'isDone': false});
              });
            },
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFE8F5E9), elevation: 0, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)), padding: const EdgeInsets.symmetric(vertical: 16)),
            child: const Text('Add New Set', style: TextStyle(color: Color(0xFF006C46), fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  Widget _buildLogInput(String value, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(color: const Color(0xFFF4F6FA), borderRadius: BorderRadius.circular(12)),
      child: Text('$value $label', style: const TextStyle(color: Color(0xFF1A1F38), fontSize: 14, fontWeight: FontWeight.w800)),
    );
  }
}
