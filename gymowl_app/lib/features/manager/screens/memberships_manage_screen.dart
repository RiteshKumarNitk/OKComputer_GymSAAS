import 'package:flutter/material.dart';

class MembershipsManageScreen extends StatelessWidget {
  const MembershipsManageScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F6FA),
      appBar: AppBar(
        title: const Text('Tier Configurator', style: TextStyle(color: Color(0xFF1A1F38), fontWeight: FontWeight.w900)),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: Color(0xFF1A1F38)),
        actions: [
          IconButton(
            icon: const Icon(Icons.add_circle_outline_rounded, color: Color(0xFFFF5236)),
            onPressed: () {
               ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Create New Tier tool opening...')));
            },
          )
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            _buildTierCard(
              context,
              name: 'Basic Access',
              price: '\$29.99',
              period: '/mo',
              color: Colors.blueAccent,
              isActive: true,
              features: ['24/7 Facility Access', 'Standard Floor Equipment', 'Locker Room Usage'],
            ),
            const SizedBox(height: 24),
            _buildTierCard(
              context,
              name: 'Elite Pro',
              price: '\$79.00',
              period: '/mo',
              color: const Color(0xFF1A1F38), // Navy
              isActive: true,
              isPopular: true,
              features: ['24/7 Facility Access', 'Unlimited Studio Classes', '1 PT Session / month', 'Priority Support'],
            ),
            const SizedBox(height: 24),
            _buildTierCard(
              context,
              name: 'Guest Day Pass',
              price: '\$15.00',
              period: '/day',
              color: Colors.grey.shade600,
              isActive: false,
              features: ['12-Hour Access Window', 'Standard Floor Equipment'],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTierCard(BuildContext context, {
    required String name,
    required String price,
    required String period,
    required Color color,
    required bool isActive,
    bool isPopular = false,
    required List<String> features,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: isPopular ? Border.all(color: const Color(0xFFFF5236), width: 3) : Border.all(color: Colors.transparent),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 20, offset: const Offset(0, 10))],
      ),
      child: Column(
        children: [
          if (isPopular)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 8),
              decoration: const BoxDecoration(
                color: Color(0xFFFF5236), // Vibrant Orange
                borderRadius: BorderRadius.only(topLeft: Radius.circular(20), topRight: Radius.circular(20)),
              ),
              child: const Center(
                child: Text('MOST POPULAR PLAN', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 12, letterSpacing: 1.5)),
              ),
            ),
          Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: isActive ? const Color(0xFF006C46).withOpacity(0.1) : Colors.grey.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12)
                      ),
                      child: Text(
                        isActive ? 'ACTIVE PLAN' : 'DRAFT PLAN', 
                        style: TextStyle(color: isActive ? const Color(0xFF006C46) : Colors.grey, fontWeight: FontWeight.w900, fontSize: 10, letterSpacing: 1.2)
                      ),
                    ),
                    IconButton(icon: const Icon(Icons.edit_rounded, color: Colors.grey), onPressed: () {})
                  ],
                ),
                const SizedBox(height: 16),
                Text(name, style: TextStyle(color: color, fontSize: 24, fontWeight: FontWeight.w900)),
                const SizedBox(height: 8),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(price, style: const TextStyle(color: Color(0xFF1A1F38), fontSize: 36, fontWeight: FontWeight.w900, height: 1.0)),
                    Padding(
                      padding: const EdgeInsets.only(bottom: 6.0, left: 4.0),
                      child: Text(period, style: const TextStyle(color: Colors.grey, fontSize: 16, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                const Divider(),
                const SizedBox(height: 16),
                ...features.map((f) => Padding(
                  padding: const EdgeInsets.only(bottom: 12.0),
                  child: Row(
                    children: [
                      Icon(Icons.check_circle_rounded, color: color, size: 20),
                      const SizedBox(width: 12),
                      Expanded(child: Text(f, style: const TextStyle(color: Color(0xFF1A1F38), fontWeight: FontWeight.w600))),
                    ],
                  ),
                )).toList(),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
