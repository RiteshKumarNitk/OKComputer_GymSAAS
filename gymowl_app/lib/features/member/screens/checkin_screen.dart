import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/checkin_provider.dart';

class CheckinScreen extends ConsumerWidget {
  const CheckinScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final checkinState = ref.watch(checkinProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Member Check-in'),
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text(
                'Show this QR to the scanner',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w500),
              ),
              const SizedBox(height: 32),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: const [
                    BoxShadow(color: Colors.black12, blurRadius: 10, spreadRadius: 2),
                  ],
                ),
                child: QrImageView(
                  data: ref.watch(authProvider).user?.id ?? 'UNKNOWN',
                  version: QrVersions.auto,
                  size: 200.0,
                ),
              ),
              const SizedBox(height: 48),
              if (checkinState.error != null)
                Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: Text(checkinState.error!, style: const TextStyle(color: Colors.red)),
                ),
              if (checkinState.isSuccess)
                const Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: Text('Check-in Successful!', style: TextStyle(color: Colors.green, fontWeight: FontWeight.bold, fontSize: 16)),
                ),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton.icon(
                  onPressed: checkinState.isLoading
                      ? null
                      : () => ref.read(checkinProvider.notifier).manualCheckin(),
                  icon: checkinState.isLoading
                      ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Icon(Icons.touch_app),
                  label: const Text('Manual Check-in'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.teal,
                    foregroundColor: Colors.white,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
