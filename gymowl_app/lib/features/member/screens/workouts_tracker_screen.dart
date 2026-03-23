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
      backgroundColor: const Color(0xFF0A0B10), // Ultra Dark Velocity Theme
      appBar: AppBar(
        title: const Text('Workout Tracker', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
        backgroundColor: Colors.transparent, elevation: 0, foregroundColor: Colors.white,
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
        color: const Color(0xFF14151F),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.deepPurpleAccent.withOpacity(0.1), width: 1),
      ),
      child: Column(
        children: [
          const Text('Barbell Bench Press', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 24),
          Text(_formatTime(_seconds), style: const TextStyle(color: Colors.white, fontSize: 44, fontWeight: FontWeight.bold, letterSpacing: 2)),
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
              }, color: Colors.white24),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTimerButton(IconData icon, String label, VoidCallback onTap, {Color color = Colors.deepPurpleAccent}) {
    return ElevatedButton.icon(
      onPressed: onTap,
      icon: Icon(icon, color: Colors.white, size: 20),
      label: Text(label, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      style: ElevatedButton.styleFrom(backgroundColor: color, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)), padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12)),
    );
  }

  Widget _buildWorkoutLog() {
    return Container(
      padding: const EdgeInsets.all(20),
      margin: const EdgeInsets.only(top: 16),
      decoration: const BoxDecoration(color: Color(0xFF14151F), borderRadius: BorderRadius.only(topLeft: Radius.circular(32), topRight: Radius.circular(32))),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text('Track Sets & Reps', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 20),
          Expanded(
            child: ListView.separated(
              itemCount: _setsList.length,
              separatorBuilder: (_, __) => const Divider(color: Colors.white10),
              itemBuilder: (context, index) {
                final set = _setsList[index];
                final isDone = set['isDone'] as bool;

                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('SET ${set['set']}', style: TextStyle(color: Colors.grey[400], fontWeight: FontWeight.bold)),
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
                          decoration: BoxDecoration(color: isDone ? Colors.green : Colors.deepPurpleAccent.withOpacity(0.1), shape: BoxShape.circle),
                          child: Icon(isDone ? Icons.check : Icons.circle_outlined, color: Colors.white, size: 18),
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
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF202232), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)), padding: const EdgeInsets.symmetric(vertical: 16)),
            child: const Text('Add New Set', style: TextStyle(color: Colors.white70, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  Widget _buildLogInput(String value, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(color: const Color(0xFF0A0B10), borderRadius: BorderRadius.circular(12)),
      child: Text('$value $label', style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
    );
  }
}
