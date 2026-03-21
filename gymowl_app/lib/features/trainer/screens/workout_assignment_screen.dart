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
      appBar: AppBar(title: const Text('Assign Workout')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              TextFormField(
                controller: _titleController,
                decoration: const InputDecoration(labelText: 'Plan Title', border: OutlineInputBorder()),
                validator: (v) => v != null && v.isNotEmpty ? null : 'Required',
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _descController,
                maxLines: 2,
                decoration: const InputDecoration(labelText: 'Description', border: OutlineInputBorder()),
              ),
              const SizedBox(height: 24),
              const Text('Exercises', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              ..._exercises.asMap().entries.map((entry) {
                final index = entry.key;
                final exercise = entry.value;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Row(
                    children: [
                      Expanded(
                        flex: 3,
                        child: TextFormField(
                          decoration: const InputDecoration(labelText: 'Exercise Name', isDense: true),
                          onChanged: (v) => exercise['name'] = v,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: TextFormField(
                          decoration: const InputDecoration(labelText: 'Sets', isDense: true),
                          keyboardType: TextInputType.number,
                          onChanged: (v) => exercise['sets'] = v,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: TextFormField(
                          decoration: const InputDecoration(labelText: 'Reps', isDense: true),
                          keyboardType: TextInputType.number,
                          onChanged: (v) => exercise['reps'] = v,
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.delete, color: Colors.red),
                        onPressed: () => setState(() => _exercises.removeAt(index)),
                      )
                    ],
                  ),
                );
              }).toList(),
              TextButton.icon(
                onPressed: _addExercise,
                icon: const Icon(Icons.add),
                label: const Text('Add Exercise'),
              ),
              const SizedBox(height: 32),
              if (workoutState.error != null)
                Text(workoutState.error!, style: const TextStyle(color: Colors.red)),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  onPressed: workoutState.isLoading
                      ? null
                      : () async {
                          if (_formKey.currentState!.validate() && _exercises.isNotEmpty) {
                            final success = await ref.read(workoutProvider.notifier).assignWorkout(
                              widget.memberId,
                              {
                                'title': _titleController.text,
                                'description': _descController.text,
                                'exercises': _exercises,
                              },
                            );
                            if (success && context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Workout Assigned successfully!')),
                              );
                              Navigator.of(context).pop();
                            }
                          } else if (_exercises.isEmpty) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Add at least one exercise')),
                            );
                          }
                        },
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.indigo),
                  child: workoutState.isLoading
                      ? const CircularProgressIndicator(color: Colors.white)
                      : const Text('Submit Assignment', style: TextStyle(color: Colors.white)),
                ),
              )
            ],
          ),
        ),
      ),
    );
  }
}
