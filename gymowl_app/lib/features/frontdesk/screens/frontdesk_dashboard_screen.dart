import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class FrontdeskDashboardScreen extends StatefulWidget {
  const FrontdeskDashboardScreen({super.key});

  @override
  State<FrontdeskDashboardScreen> createState() => _FrontdeskDashboardScreenState();
}

class _FrontdeskDashboardScreenState extends State<FrontdeskDashboardScreen> {
  String _selectedCategory = 'frontdesk';

  final List<Map<String, dynamic>> _modules = [
    {
      'title': 'Member Check-In',
      'icon': Icons.check_circle_outline,
      'description': 'Check-in members for workout',
      'action': 'check-in',
      'color': Colors.green,
      'category': 'frontdesk'
    },
    {
      'title': 'Add Member',
      'icon': Icons.person_add_outlined,
      'description': 'Register a new member',
      'path': '/frontdesk/add-member',
      'color': Colors.blue,
      'category': 'frontdesk'
    },
    {
      'title': 'Member Search',
      'icon': Icons.search,
      'description': 'Find member details',
      'path': '/frontdesk/search',
      'color': Colors.indigo,
      'category': 'frontdesk'
    },
    {
      'title': 'Renew Membership',
      'icon': Icons.autorenew,
      'description': 'Renew expired memberships',
      'color': Colors.orange,
      'category': 'frontdesk'
    },
    {
      'title': 'Today\'s Attendance',
      'icon': Icons.list_alt,
      'description': 'View daily attendance log',
      'path': '/frontdesk/attendance',
      'color': Colors.teal,
      'category': 'frontdesk'
    },
    {
      'title': 'Visitor Entry',
      'icon': Icons.person_search_outlined,
      'description': 'Log non-member visitors',
      'color': Colors.lime,
      'category': 'frontdesk'
    },
    {
      'title': 'Leads / Walk-in',
      'icon': Icons.people_outline,
      'description': 'Manage walk-ins and leads',
      'color': Colors.purple,
      'category': 'operations'
    },
    {
      'title': 'Payments & Billing',
      'icon': Icons.credit_card,
      'description': 'Collect payments and invoices',
      'path': '/frontdesk/payments',
      'color': Colors.teal,
      'category': 'operations'
    },
    {
      'title': 'POS Sales',
      'icon': Icons.shopping_cart_outlined,
      'description': 'Sell products & supplements',
      'color': Colors.amber,
      'category': 'operations'
    },
    {
      'title': 'Class Booking',
      'icon': Icons.calendar_today,
      'description': 'Book slots, classes & PT',
      'color': Colors.cyan,
      'category': 'trainer'
    },
  ];

  @override
  Widget build(BuildContext context) {
    final filteredModules = _modules.where((m) => m['category'] == _selectedCategory).toList();

    return Scaffold(
      backgroundColor: const Color(0xFFF4F6FA),
      appBar: AppBar(
        title: const Text('Front Desk Dashboard', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: const Color(0xFF1A1F38),
      ),
      body: Column(
        children: [
          _buildCategorySelector(),
          Expanded(
            child: GridView.builder(
              padding: const EdgeInsets.all(16),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                childAspectRatio: 1.1,
              ),
              itemCount: filteredModules.length,
              itemBuilder: (context, index) {
                final item = filteredModules[index];
                return _buildModuleCard(context, item);
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCategorySelector() {
    final categories = [
      {'id': 'frontdesk', 'label': 'Core'},
      {'id': 'operations', 'label': 'Operations'},
      {'id': 'trainer', 'label': 'Schedules'},
    ];

    return Container(
      height: 45,
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Row(
        children: categories.map((cat) {
          final isSelected = _selectedCategory == cat['id'];
          return Expanded(
            child: GestureDetector(
              onTap: () => setState(() => _selectedCategory = cat['id']!),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: isSelected ? const Color(0xFF1A1F38) : Colors.transparent,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  cat['label']!,
                  style: TextStyle(
                    color: isSelected ? Colors.white : Colors.grey[700],
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                    fontSize: 13,
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildModuleCard(BuildContext context, Map<String, dynamic> item) {
    final Color color = item['color'];
    
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      color: Colors.white,
      child: InkWell(
        onTap: () {
          if (item['action'] == 'check-in') {
             context.push('/frontdesk/scanner');
          } else if (item['path'] != null) {
             context.push(item['path']);
          } else {
             ScaffoldMessenger.of(context).showSnackBar(
               SnackBar(content: Text('${item['title']} is coming soon inside the mobile shell.')),
             );
          }
        },
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(item['icon'], color: color, size: 24),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item['title'],
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF1A1F38)),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    item['description'],
                    style: TextStyle(color: Colors.grey[600], fontSize: 11),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
