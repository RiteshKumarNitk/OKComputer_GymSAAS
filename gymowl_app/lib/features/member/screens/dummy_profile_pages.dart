import 'package:flutter/material.dart';

class DummyProfilePage extends StatelessWidget {
  final String title;
  const DummyProfilePage({super.key, required this.title});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F6FA),
      appBar: AppBar(
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF1A1F38))),
        backgroundColor: Colors.white,
        elevation: 0,
        foregroundColor: const Color(0xFF1A1F38),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.construction_rounded, size: 80, color: Colors.grey),
            const SizedBox(height: 16),
            Text('$title Data', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.grey)),
            const SizedBox(height: 8),
            const Text('This page will be populated later.', style: TextStyle(color: Colors.grey)),
          ],
        ),
      ),
    );
  }
}

class MetricLogScreen extends StatelessWidget { const MetricLogScreen({super.key}); @override Widget build(BuildContext context) => const DummyProfilePage(title: 'Metric Log'); }
class MembershipScreen extends StatelessWidget { const MembershipScreen({super.key}); @override Widget build(BuildContext context) => const DummyProfilePage(title: 'Membership'); }
class ReportCardScreen extends StatelessWidget { const ReportCardScreen({super.key}); @override Widget build(BuildContext context) => const DummyProfilePage(title: 'Report Card'); }
class HealthAssessmentScreen extends StatelessWidget { const HealthAssessmentScreen({super.key}); @override Widget build(BuildContext context) => const DummyProfilePage(title: 'Health Assessment'); }
class HelpSupportScreen extends StatelessWidget { const HelpSupportScreen({super.key}); @override Widget build(BuildContext context) => const DummyProfilePage(title: 'Help & Support'); }
class BusinessRequestScreen extends StatelessWidget { const BusinessRequestScreen({super.key}); @override Widget build(BuildContext context) => const DummyProfilePage(title: 'Business Request'); }
class SettingsScreen extends StatelessWidget { const SettingsScreen({super.key}); @override Widget build(BuildContext context) => const DummyProfilePage(title: 'Settings'); }
