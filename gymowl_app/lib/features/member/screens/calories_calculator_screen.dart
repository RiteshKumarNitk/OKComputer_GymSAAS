import 'package:flutter/material.dart';

class CaloriesCalculatorScreen extends StatefulWidget {
  const CaloriesCalculatorScreen({super.key});

  @override
  State<CaloriesCalculatorScreen> createState() => _CaloriesCalculatorScreenState();
}

class _CaloriesCalculatorScreenState extends State<CaloriesCalculatorScreen> {
  final _formKey = GlobalKey<FormState>();
  
  String? _selectedActivity;
  String? _selectedGender;
  final TextEditingController _ageController = TextEditingController();
  final TextEditingController _weightController = TextEditingController();
  final TextEditingController _heightController = TextEditingController();

  final List<String> _activities = [
    'Basal Metabolic Rate(BMR)',
    'Sedentary: little or no exercise',
    'Light: exercise 1-3 times/week',
    'Moderate: exercise 4-5 times/week',
    'Active: daily exercise or intense exercise 3-4 times/week',
    'Very Active: intense exercise 6-7 times/week',
    'Extra Active: very intense exercise daily, or physical job',
  ];

  final List<String> _genders = ['Male', 'Female'];

  void _calculate() {
    if (!_formKey.currentState!.validate() || _selectedActivity == null || _selectedGender == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fill all fields')),
      );
      return;
    }

    final double weight = double.parse(_weightController.text);
    final double height = double.parse(_heightController.text);
    final int age = int.parse(_ageController.text);

    double bmr = 0;
    if (_selectedGender == 'Male') {
      bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
    } else {
      bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
    }

    double multiplier = 1.2;
    if (_selectedActivity!.contains('Sedentary')) multiplier = 1.2;
    if (_selectedActivity!.contains('Light')) multiplier = 1.375;
    if (_selectedActivity!.contains('Moderate')) multiplier = 1.55;
    if (_selectedActivity!.contains('Active: daily')) multiplier = 1.725;
    if (_selectedActivity!.contains('Very Active')) multiplier = 1.9;
    if (_selectedActivity!.contains('Extra Active')) multiplier = 1.9;

    final double calories = bmr * multiplier;

    _showResultDialog(bmr, calories);
  }

  void _showResultDialog(double bmr, double calories) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Your Daily Needs', style: TextStyle(fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Basal Metabolic Rate (BMR): ${bmr.toStringAsFixed(0)} kcal/day', style: const TextStyle(fontSize: 16)),
            const SizedBox(height: 12),
            Text('Maintenance Calories: ${calories.toStringAsFixed(0)} kcal/day', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.green)),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('Calories Calculator', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        elevation: 0,
        foregroundColor: Colors.black,
        actions: [
          IconButton(onPressed: () {}, icon: const Icon(Icons.info_outline)),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildDropdownField(
                label: 'Activity',
                icon: Icons.bolt_rounded,
                value: _selectedActivity,
                hint: 'Select Activity',
                items: _activities,
                onChanged: (val) => setState(() => _selectedActivity = val),
              ),
              const SizedBox(height: 24),
              _buildDropdownField(
                label: 'Gender',
                icon: Icons.wc_rounded,
                value: _selectedGender,
                hint: 'Select Gender',
                items: _genders,
                onChanged: (val) => setState(() => _selectedGender = val),
              ),
              const SizedBox(height: 24),
              _buildInputField(
                label: 'Age',
                icon: Icons.calendar_today_rounded,
                controller: _ageController,
                hint: 'Enter Age',
                keyboardType: TextInputType.number,
              ),
              const SizedBox(height: 24),
              _buildInputField(
                label: 'Weight',
                icon: Icons.scale_rounded,
                controller: _weightController,
                hint: 'Enter Weight',
                suffix: 'KG',
                keyboardType: TextInputType.number,
              ),
              const SizedBox(height: 24),
              _buildInputField(
                label: 'Height',
                icon: Icons.height_rounded,
                controller: _heightController,
                hint: 'Enter Height',
                suffix: 'CM',
                keyboardType: TextInputType.number,
              ),
              const SizedBox(height: 48),
              SizedBox(
                width: double.infinity,
                height: 54,
                child: ElevatedButton(
                  onPressed: _calculate,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFFF6D43), // Inspired by screenshot orange
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    elevation: 0,
                  ),
                  child: const Text('Calculate', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDropdownField({
    required String label,
    required IconData icon,
    required String? value,
    required String hint,
    required List<String> items,
    required Function(String?) onChanged,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, color: const Color(0xFFFF6D43), size: 20),
            const SizedBox(width: 8),
            Text(label, style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.grey, fontSize: 13)),
          ],
        ),
        const SizedBox(height: 8),
        DropdownButtonFormField<String>(
          value: value,
          hint: Text(hint, style: TextStyle(color: Colors.grey[400])),
          isExpanded: true,
          decoration: const InputDecoration(
            border: UnderlineInputBorder(),
            contentPadding: EdgeInsets.symmetric(vertical: 12),
          ),
          items: items.map((String value) {
            return DropdownMenuItem<String>(
              value: value,
              child: Text(value, style: const TextStyle(fontSize: 15)),
            );
          }).toList(),
          onChanged: onChanged,
        ),
      ],
    );
  }

  Widget _buildInputField({
    required String label,
    required IconData icon,
    required TextEditingController controller,
    required String hint,
    String? suffix,
    TextInputType keyboardType = TextInputType.text,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, color: const Color(0xFFFF6D43), size: 20),
            const SizedBox(width: 8),
            Text(label, style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.grey, fontSize: 13)),
          ],
        ),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          keyboardType: keyboardType,
          style: const TextStyle(fontSize: 15),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: TextStyle(color: Colors.grey[400]),
            suffixText: suffix,
            suffixStyle: const TextStyle(color: Colors.green, fontWeight: FontWeight.bold),
            border: const UnderlineInputBorder(),
            contentPadding: const EdgeInsets.symmetric(vertical: 12),
          ),
          validator: (value) {
            if (value == null || value.isEmpty) return 'Required';
            if (double.tryParse(value) == null) return 'Invalid number';
            return null;
          },
        ),
      ],
    );
  }
}
