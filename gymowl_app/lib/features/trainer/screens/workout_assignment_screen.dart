import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/workout_provider.dart';

class WorkoutAssignmentScreen extends ConsumerStatefulWidget {
  final String memberId;
  const WorkoutAssignmentScreen({super.key, required this.memberId});

  @override
  ConsumerState<WorkoutAssignmentScreen> createState() => _WorkoutAssignmentScreenState();
}

class _WorkoutAssignmentScreenState extends ConsumerState<WorkoutAssignmentScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descController = TextEditingController();
  final List<Map<String, String>> _exercises = [];

  @override
  void initState() {
    super.initState();
    _addExercise(); // Start with one empty exercise block
  }

  void _addExercise() {
    setState(() {
      _exercises.add({'name': '', 'sets': '', 'reps': ''});
    });
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final workoutState = ref.watch(workoutProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF4F6FA),
      appBar: AppBar(
        title: const Text('Prescribe Plan', style: TextStyle(color: Color(0xFF1A1F38), fontWeight: FontWeight.w900)),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: Color(0xFF1A1F38)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10, offset: const Offset(0, 4))],
                ),
                child: Column(
                  children: [
                    TextFormField(
                      controller: _titleController,
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Color(0xFF1A1F38)),
                      decoration: InputDecoration(
                        labelText: 'Plan Title',
                        labelStyle: const TextStyle(color: Colors.grey, fontSize: 14),
                        hintText: 'e.g., Hypertrophy Phase 1',
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: Colors.grey.shade200)),
                        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: Colors.grey.shade200)),
                        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: Color(0xFFFF5236), width: 2)),
                      ),
                      validator: (v) => v != null && v.isNotEmpty ? null : 'Required',
                    ),
                    const SizedBox(height: 20),
                    TextFormField(
                      controller: _descController,
                      maxLines: 3,
                      decoration: InputDecoration(
                        labelText: 'Coach Notes',
                        labelStyle: const TextStyle(color: Colors.grey, fontSize: 14),
                        hintText: 'Focus on eccentric control...',
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: Colors.grey.shade200)),
                        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: Colors.grey.shade200)),
                        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: Color(0xFFFF5236), width: 2)),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Exercise Blocks', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Color(0xFF1A1F38))),
                  TextButton.icon(
                    onPressed: _addExercise,
                    icon: const Icon(Icons.add_circle_outline_rounded, color: Color(0xFF006C46)),
                    label: const Text('Add Block', style: TextStyle(color: Color(0xFF006C46), fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              ..._exercises.asMap().entries.map((entry) {
                final index = entry.key;
                final exercise = entry.value;
                return Container(
                  margin: const EdgeInsets.only(bottom: 16),
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: Colors.grey.shade100, width: 2),
                  ),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(color: const Color(0xFF1A1F38), shape: BoxShape.circle),
                            child: Text('${index + 1}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: TextFormField(
                              initialValue: exercise['name'],
                              style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF1A1F38)),
                              decoration: InputDecoration(
                                hintText: 'Exercise Name (e.g. Barbell Squat)',
                                hintStyle: TextStyle(color: Colors.grey.shade400, fontWeight: FontWeight.normal),
                                border: InputBorder.none,
                              ),
                              onChanged: (v) => exercise['name'] = v,
                            ),
                          ),
                          if (_exercises.length > 1)
                            IconButton(
                              icon: const Icon(Icons.delete_outline_rounded, color: Colors.redAccent),
                              onPressed: () => setState(() => _exercises.removeAt(index)),
                            ),
                        ],
                      ),
                      const Divider(),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Expanded(
                            child: TextFormField(
                              initialValue: exercise['sets'],
                              keyboardType: TextInputType.number,
                              style: const TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF1A1F38)),
                              decoration: InputDecoration(
                                labelText: 'Sets',
                                filled: true,
                                fillColor: const Color(0xFFF4F6FA),
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                              ),
                              onChanged: (v) => exercise['sets'] = v,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: TextFormField(
                              initialValue: exercise['reps'],
                              keyboardType: TextInputType.text,
                              style: const TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF1A1F38)),
                              decoration: InputDecoration(
                                labelText: 'Reps',
                                filled: true,
                                fillColor: const Color(0xFFF4F6FA),
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                              ),
                              onChanged: (v) => exercise['reps'] = v,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                );
              }).toList(),
              
              if (workoutState.error != null)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  child: Text(workoutState.error!, style: const TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold)),
                ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 15, offset: const Offset(0, -5))],
        ),
        child: SafeArea(
          child: ElevatedButton(
            onPressed: workoutState.isLoading ? null : _submitAssignment,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFFF5236),
              disabledBackgroundColor: Colors.grey.shade300,
              padding: const EdgeInsets.symmetric(vertical: 18),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              elevation: 0,
            ),
            child: workoutState.isLoading
                ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                : const Text('PUBLISH PLAN', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w900, letterSpacing: 1.1)),
          ),
        ),
      ),
    );
  }

  Future<void> _submitAssignment() async {
    if (_formKey.currentState!.validate() && _exercises.isNotEmpty) {
      final success = await ref.read(workoutProvider.notifier).assignWorkout(
        widget.memberId,
        {
          'title': _titleController.text,
          'description': _descController.text,
          'exercises': _exercises,
        },
      );
      if (success && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Plan pushed to athlete successfully!'), backgroundColor: Color(0xFF006C46)),
        );
        Navigator.of(context).pop();
      }
    } else if (_exercises.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('You must add at least one exercise block.'), backgroundColor: Colors.redAccent),
      );
    }
  }
}
