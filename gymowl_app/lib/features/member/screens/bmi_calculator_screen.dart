import 'package:flutter/material.dart';
import 'dart:math';

class BmiCalculatorScreen extends StatefulWidget {
  const BmiCalculatorScreen({super.key});

  @override
  State<BmiCalculatorScreen> createState() => _BmiCalculatorScreenState();
}

class _BmiCalculatorScreenState extends State<BmiCalculatorScreen> {
  double _height = 170;
  double _weight = 70;
  
  double get _bmi => _weight / pow(_height / 100, 2);
  
  String get _bmiCategory {
    if (_bmi < 18.5) return 'Underweight';
    if (_bmi < 25) return 'Normal';
    if (_bmi < 30) return 'Overweight';
    return 'Obese';
  }

  Color get _bmiColor {
    if (_bmi < 18.5) return Colors.blueAccent;
    if (_bmi < 25) return const Color(0xFF006C46); // Mint Green
    if (_bmi < 30) return Colors.orangeAccent;
    return Colors.redAccent;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F6FA),
      appBar: AppBar(
        title: const Text('BMI Calculator', style: TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF1A1F38))),
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: const Color(0xFF1A1F38),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            _buildResultCard(),
            const SizedBox(height: 32),
            _buildSliderCard('Height', 'cm', _height, 100, 250, (val) => setState(() => _height = val)),
            const SizedBox(height: 20),
            _buildSliderCard('Weight', 'kg', _weight, 30, 150, (val) => setState(() => _weight = val)),
          ],
        ),
      ),
    );
  }

  Widget _buildResultCard() {
    return Container(
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      child: Column(
        children: [
          Text('Your BMI Result', style: TextStyle(color: Colors.grey.shade600, fontSize: 16)),
          const SizedBox(height: 16),
          Text(_bmi.toStringAsFixed(1), style: TextStyle(fontSize: 64, fontWeight: FontWeight.w900, color: _bmiColor)),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: _bmiColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(_bmiCategory, style: TextStyle(color: _bmiColor, fontWeight: FontWeight.bold, fontSize: 16)),
          ),
        ],
      ),
    );
  }

  Widget _buildSliderCard(String title, String unit, double value, double min, double max, ValueChanged<double> onChanged) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(title, style: const TextStyle(fontSize: 18, color: Color(0xFF1A1F38), fontWeight: FontWeight.bold)),
              Row(
                crossAxisAlignment: CrossAxisAlignment.baseline,
                textBaseline: TextBaseline.alphabetic,
                children: [
                  Text(value.round().toString(), style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: Color(0xFF006C46))),
                  const SizedBox(width: 4),
                  Text(unit, style: const TextStyle(fontSize: 16, color: Colors.grey, fontWeight: FontWeight.bold)),
                ],
              ),
            ],
          ),
          const SizedBox(height: 16),
          SliderTheme(
            data: SliderTheme.of(context).copyWith(
              activeTrackColor: const Color(0xFF006C46),
              inactiveTrackColor: Colors.grey.shade200,
              thumbColor: const Color(0xFF006C46),
              overlayColor: const Color(0xFF006C46).withOpacity(0.2),
              trackHeight: 8,
            ),
            child: Slider(
              value: value,
              min: min,
              max: max,
              onChanged: onChanged,
            ),
          ),
        ],
      ),
    );
  }
}
