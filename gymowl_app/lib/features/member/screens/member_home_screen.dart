import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/member_provider.dart';

class MemberHomeScreen extends ConsumerWidget {
  const MemberHomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final user = authState.user;
    final isStaff = user?.role == 'frontdesk' || user?.role == 'manager';
    
    final statsAsync = ref.watch(memberStatsProvider);
    final sessionsAsync = ref.watch(upcomingSessionsProvider);
    final scheduleAsync = ref.watch(weeklyScheduleProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF4F6FA),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(memberStatsProvider);
          ref.invalidate(upcomingSessionsProvider);
          ref.invalidate(weeklyScheduleProvider);
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildPremiumHeader(context, user?.fullName ?? 'Athlete'),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildQuickCheckIn(context, isStaff),
                    const SizedBox(height: 24),
                    sessionsAsync.when(
                      loading: () => const SizedBox(height: 100, child: Center(child: CircularProgressIndicator())),
                      error: (err, _) => const SizedBox.shrink(),
                      data: (sessions) => sessions.isNotEmpty 
                          ? _buildUpcomingSession(sessions.first) 
                          : _buildNoSessionsCard(context),
                    ),
                    const SizedBox(height: 24),
                    _buildQuickLogActions(context, ref),
                    const SizedBox(height: 32),
                    _buildSectionTitle('Weekly Activity'),
                    const SizedBox(height: 16),
                    statsAsync.when(
                      loading: () => _buildLoadingActivity(),
                      error: (err, _) => Center(child: Text('Error: $err')),
                      data: (stats) => _buildActivityCard(stats),
                    ),
                    const SizedBox(height: 32),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Classes', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Colors.black)),
                        TextButton(
                          onPressed: () => context.push('/member/classes'), 
                          child: const Text('See all', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold))
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    scheduleAsync.when(
                      loading: () => const Center(child: CircularProgressIndicator()),
                      error: (err, _) => const SizedBox.shrink(),
                      data: (slots) {
                        // Filter for today's classes
                        final today = DateTime.now().weekday;
                        // Dart weekday is 1-7 (Mon-Sun), our DB might be 0-6 or 1-7.
                        // Schedules use day_of_week.
                        final todaySlots = slots.where((s) => s['dayOfWeek'] == today || s['day_of_week'] == today).take(2).toList();
                        
                        if (todaySlots.isEmpty) return const Text('No classes today', style: TextStyle(color: Colors.grey));

                        return Column(
                          children: todaySlots.map((s) => Padding(
                            padding: const EdgeInsets.only(bottom: 12),
                            child: _buildClassItem(
                              s['service']?['name'] ?? 'Class', 
                              '${s['startTime']?.toString().substring(0,5) ?? 'TBD'} • ${s['durationMinutes']}m', 
                              'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?fit=crop&w=100&q=80'
                            ),
                          )).toList(),
                        );
                      }
                    ),
                    const SizedBox(height: 40),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPremiumHeader(BuildContext context, String name) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(24, 60, 24, 32),
      decoration: const BoxDecoration(
        color: Colors.black,
        borderRadius: BorderRadius.only(bottomLeft: Radius.circular(32), bottomRight: Radius.circular(32)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('GOOD MORNING,', style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 12, fontWeight: FontWeight.w900, letterSpacing: 1.2)),
                  const SizedBox(height: 4),
                  Text(name.toUpperCase(), style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w900, letterSpacing: -0.5)),
                ],
              ),
              CircleAvatar(
                radius: 24,
                backgroundColor: Colors.white.withOpacity(0.1),
                child: const Icon(Icons.notifications_outlined, color: Colors.white),
              )
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildQuickCheckIn(BuildContext context, bool isStaff) {
    return InkWell(
      onTap: () => context.push(isStaff ? '/frontdesk/scanner' : '/member/checkin'),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          gradient: const LinearGradient(colors: [Color(0xFF2C2C2C), Colors.black], begin: Alignment.topLeft, end: Alignment.bottomRight),
          borderRadius: BorderRadius.circular(24),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.3), blurRadius: 15, offset: const Offset(0, 8))],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), shape: BoxShape.circle),
              child: const Icon(Icons.qr_code_scanner, color: Colors.white, size: 28),
            ),
            const SizedBox(width: 20),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Quick Access', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 18)),
                  Text(isStaff ? 'Scan Incoming Member' : 'Show Membership Pass', style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 13, fontWeight: FontWeight.w500)),
                ],
              ),
            ),
            const Icon(Icons.arrow_forward_ios, color: Colors.white, size: 16),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Colors.black));
  }

  Widget _buildLoadingActivity() {
    return Container(
      height: 160,
      width: double.infinity,
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(24)),
      child: const Center(child: CircularProgressIndicator()),
    );
  }

  Widget _buildNoSessionsCard(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(24), border: Border.all(color: Colors.grey.withOpacity(0.1))),
      child: Row(
        children: [
          const Icon(Icons.calendar_today_outlined, color: Colors.grey),
          const SizedBox(width: 16),
          const Expanded(child: Text('No sessions today. Ready for a workout?', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold))),
          TextButton(onPressed: () => context.push('/member/classes'), child: const Text('Book Now')),
        ],
      ),
    );
  }

  Widget _buildUpcomingSession(Map<String, dynamic> session) {
    final className = (session['class']?['name'] ?? 'Training Session').toString();
    final coach = (session['class']?['trainer']?['fullName'] ?? 'Staff Coach').toString();
    final rawStartTime = session['class']?['startTime']?.toString();
    
    final startTime = rawStartTime != null 
        ? DateFormat('HH:mm').format(DateTime.parse(rawStartTime))
        : 'Starting';

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(24), boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10, offset: const Offset(0, 4))]),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: const [
                    Icon(Icons.circle, color: Colors.red, size: 8),
                    SizedBox(width: 8),
                    Text('UPCOMING SESSION', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold, fontSize: 11)),
                  ],
                ),
                const SizedBox(height: 12),
                Text(className, style: const TextStyle(color: Colors.black, fontWeight: FontWeight.w800, fontSize: 16)),
                const SizedBox(height: 12),
                Row(
                   children: [
                     const Icon(Icons.person, color: Colors.grey, size: 16),
                     const SizedBox(width: 8),
                     Text(coach, style: const TextStyle(color: Colors.grey, fontSize: 13)),
                   ],
                ),
              ],
            ),
          ),
          Text(startTime, style: const TextStyle(color: Colors.black, fontWeight: FontWeight.w900, fontSize: 26)),
        ],
      ),
    );
  }

  Widget _buildActivityCard(Map<String, dynamic> stats) {
    final trend = stats['intensityTrend'] as List? ?? [];
    
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(24), boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10, offset: const Offset(0, 4))]),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
               const Text('Intensity minutes vs. Goal', style: TextStyle(color: Colors.grey, fontSize: 12)),
               Container(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4), decoration: BoxDecoration(color: Colors.blue.shade50, borderRadius: BorderRadius.circular(12)), child: const Text('THIS WEEK', style: TextStyle(color: Colors.blueAccent, fontSize: 11, fontWeight: FontWeight.bold))),
            ],
          ),
          const SizedBox(height: 32),
          SizedBox(
            height: 100,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: trend.map((t) {
                final mins = (t['minutes'] ?? t['value'] ?? 0).toDouble();
                final heightFactor = (mins / 60.0).clamp(0.1, 1.0); 
                final dayLabel = (t['day'] ?? '').toString();
                final currentDay = DateFormat('E').format(DateTime.now()).toUpperCase();
                return _buildBar(heightFactor, dayLabel, isActive: dayLabel == currentDay);
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBar(double heightFactor, String label, {bool isActive = false}) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.end,
      children: [
        Expanded(
          child: Container(
            width: 16,
            margin: const EdgeInsets.only(bottom: 8),
            decoration: BoxDecoration(
              color: isActive ? Colors.black : Colors.grey.shade100,
              borderRadius: BorderRadius.circular(8),
            ),
            child: FractionallySizedBox(heightFactor: heightFactor, alignment: Alignment.bottomCenter, child: Container()),
          ),
        ),
        Text(label, style: TextStyle(color: isActive ? Colors.black : Colors.grey, fontSize: 10, fontWeight: FontWeight.bold)),
      ],
    );
  }

  Widget _buildQuickLogActions(BuildContext context, WidgetRef ref) {
    return Row(
      children: [
        Expanded(
          child: _buildLogButton(
            context,
            'Log Water',
            '💧',
            Colors.black,
            () => _showWaterLog(context, ref),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildLogButton(
            context,
            'Log Activity',
            '🔥',
            Colors.black,
            () => _showActivityLog(context, ref),
          ),
        ),
      ],
    );
  }

  Widget _buildLogButton(BuildContext context, String label, String emoji, Color color, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: color.withOpacity(0.2)),
        ),
        child: Column(
          children: [
            Text(emoji, style: const TextStyle(fontSize: 24)),
            const SizedBox(height: 8),
            Text(label, style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 13)),
          ],
        ),
      ),
    );
  }

  void _showWaterLog(BuildContext context, WidgetRef ref) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (context) => Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Daily Hydration', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900)),
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [250, 500, 750].map((ml) => ElevatedButton(
                onPressed: () async {
                  await ref.read(measurementProvider.notifier).logMeasurement(
                    type: 'water',
                    value: ml.toDouble(),
                    unit: 'ml',
                  );
                  if (context.mounted) Navigator.pop(context);
                },
                style: ElevatedButton.styleFrom(backgroundColor: Colors.blueAccent, shape: const StadiumBorder()),
                child: Text('+$ml ml', style: const TextStyle(color: Colors.white)),
              )).toList(),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  void _showActivityLog(BuildContext context, WidgetRef ref) {
    final noteController = TextEditingController();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (context) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom, left: 24, right: 24, top: 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Log Quick Activity', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900)),
            const SizedBox(height: 16),
            TextField(
              controller: noteController,
              decoration: const InputDecoration(hintText: 'e.g. 30min morning run', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () async {
                await ref.read(workoutLogProvider.notifier).logWorkout({'notes': noteController.text});
                if (context.mounted) {
                  Navigator.pop(context);
                  ref.invalidate(memberStatsProvider);
                }
              },
              style: ElevatedButton.styleFrom(backgroundColor: Colors.orangeAccent, minimumSize: const Size(double.infinity, 50)),
              child: const Text('Add to Activity', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildClassItem(String title, String time, String imageUrl) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20), boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10, offset: const Offset(0, 4))]),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: Image.network(imageUrl, width: 60, height: 60, fit: BoxFit.cover),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.black)),
                const SizedBox(height: 4),
                Text(time, style: const TextStyle(color: Colors.grey, fontSize: 13, fontWeight: FontWeight.w500)),
              ],
            ),
          ),
          IconButton(onPressed: () {}, icon: const Icon(Icons.chevron_right_rounded, color: Colors.grey)),
        ],
      ),
    );
  }
}
