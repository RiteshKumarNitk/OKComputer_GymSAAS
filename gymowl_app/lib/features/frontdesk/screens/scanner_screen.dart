import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../providers/scanner_provider.dart';

class ScannerScreen extends ConsumerStatefulWidget {
  const ScannerScreen({super.key});

  @override
  ConsumerState<ScannerScreen> createState() => _ScannerScreenState();
}

class _ScannerScreenState extends ConsumerState<ScannerScreen> {
  final MobileScannerController _controller = MobileScannerController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    ref.listen<ScannerState>(scannerProvider, (previous, next) {
      if (next.isSuccess) {
        _showFeedbackDialog(context, 'Success', 'Checked in: ${next.memberName ?? "Member"}', Colors.green);
      } else if (next.error != null) {
        _showFeedbackDialog(context, 'Failed', next.error!, Colors.red);
      }
    });

    return Scaffold(
      appBar: AppBar(title: const Text('QR Scanner')),
      body: Stack(
        children: [
          MobileScanner(
            controller: _controller,
            onDetect: (capture) {
              final barcodes = capture.barcodes;
              for (final barcode in barcodes) {
                if (barcode.rawValue != null) {
                  ref.read(scannerProvider.notifier).verifyCheckin(barcode.rawValue!);
                }
              }
            },
          ),
          Center(
            child: Container(
              width: 250,
              height: 250,
              decoration: BoxDecoration(
                border: Border.all(color: Colors.white, width: 3),
                borderRadius: BorderRadius.circular(16),
              ),
            ),
          ),
          if (ref.watch(scannerProvider).isProcessing)
            const Center(child: CircularProgressIndicator()),
        ],
      ),
    );
  }

  void _showFeedbackDialog(BuildContext context, String title, String message, Color color) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) {
        Future.delayed(const Duration(seconds: 2), () {
          if (context.mounted) {
            Navigator.of(context).pop();
            ref.read(scannerProvider.notifier).reset();
          }
        });
        return AlertDialog(
          backgroundColor: color,
          title: Text(title, style: const TextStyle(color: Colors.white)),
          content: Text(message, style: const TextStyle(color: Colors.white)),
        );
      },
    );
  }
}
