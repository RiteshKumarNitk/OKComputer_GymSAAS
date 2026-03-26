import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/frontdesk_api_service.dart';

class ScannerScreen extends ConsumerStatefulWidget {
  const ScannerScreen({super.key});

  @override
  ConsumerState<ScannerScreen> createState() => _ScannerScreenState();
}

class _ScannerScreenState extends ConsumerState<ScannerScreen> {
  final MobileScannerController controller = MobileScannerController(
    detectionSpeed: DetectionSpeed.noDuplicates,
    formats: [BarcodeFormat.qrCode],
  );

  bool _isProcessing = false;
  bool _showSuccess = false;
  String _lastScanned = '';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
        title: const Text('Access Scanner', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            icon: const Icon(Icons.flash_on_rounded, color: Colors.white70),
            onPressed: () => controller.toggleTorch(),
          ),
        ],
      ),
      body: Stack(
        children: [
          MobileScanner(
            controller: controller,
            onDetect: (capture) {
              final List<Barcode> barcodes = capture.barcodes;
              for (final barcode in barcodes) {
                if (barcode.rawValue != null) {
                  _processScan(barcode.rawValue!);
                  break;
                }
              }
            },
          ),
          // Scanner Overlay graphic
          Center(
            child: Container(
              width: 250,
              height: 250,
              decoration: BoxDecoration(
                border: Border.all(color: _showSuccess ? Colors.greenAccent : const Color(0xFFFF5236), width: 4),
                borderRadius: BorderRadius.circular(24),
              ),
            ),
          ),
          
          if (_isProcessing)
            Container(
              color: Colors.black.withOpacity(0.7),
              child: const Center(
                child: CircularProgressIndicator(color: Color(0xFFFF5236)),
              ),
            ),
            
          if (_showSuccess)
            Container(
              color: Colors.greenAccent.withOpacity(0.9),
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.check_circle_rounded, color: Colors.white, size: 100),
                    const SizedBox(height: 24),
                    const Text('ACCESS GRANTED', style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w900, letterSpacing: 2)),
                    const SizedBox(height: 8),
                    Text(_lastScanned, style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  void _processScan(String memberId) async {
    setState(() {
      _isProcessing = true;
      _lastScanned = memberId;
    });

    try {
      final api = ref.read(frontdeskApiServiceProvider);
      final result = await api.checkInEntity(memberId);
      
      setState(() {
        _isProcessing = false;
        _showSuccess = true;
        _lastScanned = result['member']?['fullName'] ?? result['staff']?['fullName'] ?? 'Access Verified';
      });

      await Future.delayed(const Duration(seconds: 2));
      if (mounted) context.pop();
    } catch (e) {
      setState(() {
        _isProcessing = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('ACCESS DENIED: ${e.toString().replaceAll('Exception: ', '')}', style: const TextStyle(fontWeight: FontWeight.bold)),
            backgroundColor: Colors.redAccent,
            duration: const Duration(seconds: 3),
          )
        );
      }
    }
  }

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }
}
