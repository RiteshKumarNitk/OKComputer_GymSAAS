import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/member_provider.dart';

class OneRepMaxScreen extends ConsumerStatefulWidget {
  const OneRepMaxScreen({super.key});

  @override
  ConsumerState<OneRepMaxScreen> createState() => _OneRepMaxScreenState();
}

class _OneRepMaxScreenState extends ConsumerState<OneRepMaxScreen> {
  final TextEditingController _weightCtrl = TextEditingController();
  final TextEditingController _repsCtrl = TextEditingController();
  
  double? _oneRepMax;

  void _calculate1RM() {
    final weight = double.tryParse(_weightCtrl.text) ?? 0;
    final reps = int.tryParse(_repsCtrl.text) ?? 0;

    if (weight > 0 && reps > 0) {
      setState(() {
        // Epley formula: w * (1 + r/30)
        _oneRepMax = weight * (1 + (reps / 30.0));
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F6FA),
      appBar: AppBar(
        title: const Text('1RM Calculator', style: TextStyle(color: Color(0xFF1A1F38), fontWeight: FontWeight.w900)),
        backgroundColor: const Color(0xFFF4F6FA),
        elevation: 0,
        iconTheme: const IconThemeData(color: Color(0xFF1A1F38)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'Calculate your 1-Rep Max to dial in your training zones and measure absolute strength limits.',
              style: TextStyle(color: Colors.grey, fontSize: 14, height: 1.4),
            ),
            const SizedBox(height: 32),
            _buildInputField('Weight Lifted (kg/lbs)', _weightCtrl, Icons.fitness_center_rounded),
            const SizedBox(height: 16),
            _buildInputField('Reps Performed', _repsCtrl, Icons.repeat_rounded),
            const SizedBox(height: 32),
            ElevatedButton(
              onPressed: _calculate1RM,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFFF5236),
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                elevation: 0,
              ),
              child: const Text('Calculate 1RM', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
            ),
            const SizedBox(height: 48),
            if (_oneRepMax != null) _buildResultCard(),
          ],
        ),
      ),
    );
  }

  Widget _buildInputField(String label, TextEditingController controller, IconData icon) {
    return TextField(
      controller: controller,
      keyboardType: const TextInputType.numberWithOptions(decimal: true),
      style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF1A1F38)),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: TextStyle(color: Colors.grey.shade500),
        prefixIcon: Icon(icon, color: const Color(0xFF006C46)),
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: Color(0xFF006C46), width: 2)),
      ),
    );
  }

  Widget _buildResultCard() {
    return Container(
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF1A1F38), Color(0xFF2C3258)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [BoxShadow(color: const Color(0xFF1A1F38).withOpacity(0.3), blurRadius: 20, offset: const Offset(0, 10))],
      ),
      child: Column(
        children: [
          const Text('ESTIMATED 1-REP MAX', style: TextStyle(color: Colors.white70, fontWeight: FontWeight.bold, letterSpacing: 1.2, fontSize: 12)),
          const SizedBox(height: 12),
          Text(
            '${_oneRepMax!.toStringAsFixed(1)}',
            style: const TextStyle(color: Colors.white, fontSize: 56, fontWeight: FontWeight.w900, height: 1.0),
          ),
          const SizedBox(height: 32),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildPercentage(90, _oneRepMax! * 0.9),
              _buildPercentage(80, _oneRepMax! * 0.8),
              _buildPercentage(70, _oneRepMax! * 0.7),
            ],
          ),
          const SizedBox(height: 32),
          ElevatedButton.icon(
            onPressed: () async {
              await ref.read(measurementProvider.notifier).logMeasurement(
                type: 'one_rep_max',
                value: _oneRepMax!,
                unit: 'kg',
                notes: 'Calculated 1RM for ${_weightCtrl.text}kg x ${_repsCtrl.text} reps',
              );
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('1RM saved to profile! 💪')),
                );
              }
            },
            icon: const Icon(Icons.save_rounded),
            label: const Text('Save to Profile'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.white,
              foregroundColor: const Color(0xFF1A1F38),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPercentage(int percent, double value) {
    return Column(
      children: [
        Text('$percent%', style: TextStyle(color: Colors.greenAccent.shade400, fontWeight: FontWeight.w900, fontSize: 16)),
        const SizedBox(height: 4),
        Text(value.toStringAsFixed(1), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
      ],
    );
  }
}
