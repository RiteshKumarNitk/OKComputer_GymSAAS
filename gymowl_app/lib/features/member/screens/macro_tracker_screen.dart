import 'package:flutter/material.dart';

class MacroTrackerScreen extends StatefulWidget {
  const MacroTrackerScreen({super.key});

  @override
  State<MacroTrackerScreen> createState() => _MacroTrackerScreenState();
}

class _MacroTrackerScreenState extends State<MacroTrackerScreen> {
  final int _calorieGoal = 2400;
  final int _caloriesConsumed = 1650;

  final Map<String, dynamic> _macros = {
    'Protein': {'consumed': 120, 'goal': 160, 'color': Colors.redAccent},
    'Carbs': {'consumed': 180, 'goal': 250, 'color': Colors.blueAccent},
    'Fats': {'consumed': 50, 'goal': 70, 'color': Colors.orangeAccent},
  };

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F6FA),
      appBar: AppBar(
        title: const Text('Macro Tracker', style: TextStyle(color: Color(0xFF1A1F38), fontWeight: FontWeight.w900)),
        backgroundColor: const Color(0xFFF4F6FA),
        elevation: 0,
        iconTheme: const IconThemeData(color: Color(0xFF1A1F38)),
        actions: [
          IconButton(
            icon: const Icon(Icons.calendar_today_rounded, color: Color(0xFF006C46)),
            onPressed: () {},
          )
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildCalorieHeader(),
            const SizedBox(height: 24),
            _buildMacroRings(),
            const SizedBox(height: 32),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Today\'s Meals', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Color(0xFF1A1F38))),
                TextButton(onPressed: () {}, child: const Text('See all', style: TextStyle(color: Color(0xFF006C46), fontWeight: FontWeight.bold))),
              ],
            ),
            const SizedBox(height: 12),
            _buildMealItem('Breakfast', 'Oatmeal & Protein Shake', 450, Icons.breakfast_dining_rounded),
            const SizedBox(height: 12),
            _buildMealItem('Lunch', 'Grilled Chicken Salad', 550, Icons.lunch_dining_rounded),
            const SizedBox(height: 12),
            _buildMealItem('Dinner', 'Salmon & Quinoa', 650, Icons.dinner_dining_rounded),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {},
        backgroundColor: const Color(0xFF006C46),
        icon: const Icon(Icons.add_rounded, color: Colors.white),
        label: const Text('Log Meal', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      ),
    );
  }

  Widget _buildCalorieHeader() {
    int remaining = _calorieGoal - _caloriesConsumed;
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF1A1F38), Color(0xFF2C3258)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [BoxShadow(color: const Color(0xFF1A1F38).withOpacity(0.3), blurRadius: 15, offset: const Offset(0, 8))],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Eaten', style: TextStyle(color: Colors.white70, fontWeight: FontWeight.bold, fontSize: 13)),
              const SizedBox(height: 4),
              Text('$_caloriesConsumed\nkcal', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 22, height: 1.1)),
            ],
          ),
          Stack(
            alignment: Alignment.center,
            children: [
              SizedBox(
                width: 100,
                height: 100,
                child: CircularProgressIndicator(
                  value: _caloriesConsumed / _calorieGoal,
                  backgroundColor: Colors.white.withOpacity(0.1),
                  color: const Color(0xFFFF5236),
                  strokeWidth: 8,
                  strokeCap: StrokeCap.round,
                ),
              ),
              Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text('$remaining', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 24)),
                  const Text('Left', style: TextStyle(color: Colors.white70, fontWeight: FontWeight.bold, fontSize: 11)),
                ],
              ),
            ],
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              const Text('Burned', style: TextStyle(color: Colors.white70, fontWeight: FontWeight.bold, fontSize: 13)),
              const SizedBox(height: 4),
              const Text('450\nkcal', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 22, height: 1.1), textAlign: TextAlign.right),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMacroRings() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10, offset: const Offset(0, 4))]
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: _macros.entries.map((entry) => _buildSingleMacroIndicator(entry.key, entry.value)).toList(),
      ),
    );
  }

  Widget _buildSingleMacroIndicator(String label, Map<String, dynamic> data) {
    int consumed = data['consumed'];
    int goal = data['goal'];
    Color color = data['color'];
    double progress = consumed / goal;

    return Column(
      children: [
        Stack(
          alignment: Alignment.center,
          children: [
            SizedBox(
              width: 70,
              height: 70,
              child: CircularProgressIndicator(
                value: progress,
                backgroundColor: color.withOpacity(0.15),
                color: color,
                strokeWidth: 6,
                strokeCap: StrokeCap.round,
              ),
            ),
            Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text('${goal - consumed}g', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14)),
                const Text('left', style: TextStyle(color: Colors.grey, fontSize: 10, fontWeight: FontWeight.bold)),
              ],
            )
          ],
        ),
        const SizedBox(height: 12),
        Text(label, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF1A1F38))),
        const SizedBox(height: 4),
        Text('$consumed / $goal g', style: const TextStyle(color: Colors.grey, fontSize: 11, fontWeight: FontWeight.bold)),
      ],
    );
  }

  Widget _buildMealItem(String type, String desc, int kcal, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10, offset: const Offset(0, 4))]
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFE8F5E9),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: const Color(0xFF006C46), size: 24),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(type, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF1A1F38))),
                const SizedBox(height: 4),
                Text(desc, style: const TextStyle(color: Colors.grey, fontSize: 13, fontWeight: FontWeight.w500)),
              ],
            ),
          ),
          Text('$kcal', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: Color(0xFF1A1F38))),
          const Text(' kcal', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold, fontSize: 12)),
        ],
      ),
    );
  }
}
