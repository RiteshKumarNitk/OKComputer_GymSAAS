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
  final List<String> _recentScans = [];

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    ref.listen<ScannerState>(scannerProvider, (previous, next) {
      if (next.isSuccess) {
        setState(() {
          _recentScans.insert(0, next.memberName ?? "Member");
          if (_recentScans.length > 5) _recentScans.removeLast();
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Success: ${next.memberName ?? "Checked in"}'),
            backgroundColor: Colors.green,
            behavior: SnackBarBehavior.floating,
          ),
        );
      } else if (next.error != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed: ${next.error}'),
            backgroundColor: Colors.red,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    });

    return Scaffold(
      backgroundColor: Colors.black,
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
          _buildScannerOverlay(),
          _buildHeader(),
          _buildBottomOverview(),
          if (ref.watch(scannerProvider).isProcessing)
            const Center(child: CircularProgressIndicator(color: Colors.white)),
        ],
      ),
    );
  }

  Widget _buildScannerOverlay() {
    return Positioned.fill(
      child: Stack(
        children: [
          ColorFiltered(
            colorFilter: ColorFilter.mode(
              Colors.black.withOpacity(0.6),
              BlendMode.srcOut,
            ),
            child: Stack(
              children: [
                Positioned.fill(child: Container(color: Colors.transparent)),
                Center(
                  child: Container(
                    width: 260,
                    height: 260,
                    decoration: BoxDecoration(
                      color: Colors.black,
                      borderRadius: BorderRadius.circular(24),
                    ),
                  ),
                ),
              ],
            ),
          ),
          Center(
            child: SizedBox(
              width: 260,
              height: 260,
              child: Stack(
                children: [
                  _buildCorner(topLeft: true),
                  _buildCorner(topRight: true),
                  _buildCorner(bottomLeft: true),
                  _buildCorner(bottomRight: true),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCorner({bool topLeft = false, bool topRight = false, bool bottomLeft = false, bool bottomRight = false}) {
    const double size = 30;
    const double thickness = 4;
    const color = Color(0xFFFF5722);
    
    return Positioned(
      top: (topLeft || topRight) ? 0 : null,
      bottom: (bottomLeft || bottomRight) ? 0 : null,
      left: (topLeft || bottomLeft) ? 0 : null,
      right: (topRight || bottomRight) ? 0 : null,
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          border: Border(
            top: (topLeft || topRight) ? const BorderSide(color: color, width: thickness) : BorderSide.none,
            bottom: (bottomLeft || bottomRight) ? const BorderSide(color: color, width: thickness) : BorderSide.none,
            left: (topLeft || bottomLeft) ? const BorderSide(color: color, width: thickness) : BorderSide.none,
            right: (topRight || bottomRight) ? const BorderSide(color: color, width: thickness) : BorderSide.none,
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Positioned(
      top: 40,
      left: 16,
      right: 16,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: Colors.black.withOpacity(0.5),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.white.withOpacity(0.1)),
        ),
        child: Row(
          children: [
            const CircleAvatar(
              backgroundColor: Color(0xFFFF5722),
              child: Icon(Icons.qr_code_scanner, color: Colors.white),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: const [
                  Text(
                    'Quick Scan Check-in',
                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                  Text(
                    'Place QR inside the box to verify',
                    style: TextStyle(color: Colors.grey, fontSize: 12),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBottomOverview() {
    return Positioned(
      bottom: 20,
      left: 16,
      right: 16,
      child: Container(
        height: 120,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.95),
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 10, offset: const Offset(0, -4))
          ]
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Recent Check-ins', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
            const SizedBox(height: 12),
            Expanded(
              child: _recentScans.isEmpty 
                ? const Center(child: Text('No scans yet', style: TextStyle(color: Colors.grey, fontSize: 13)))
                : ListView.builder(
                    scrollDirection: Axis.horizontal,
                    itemCount: _recentScans.length,
                    itemBuilder: (context, index) => Container(
                       margin: const EdgeInsets.only(right: 8),
                       padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                       decoration: BoxDecoration(
                         color: Colors.green.shade50,
                         borderRadius: BorderRadius.circular(20),
                         border: Border.all(color: Colors.green.shade200)
                       ),
                       child: Row(
                         mainAxisSize: MainAxisSize.min,
                         children: [
                           const Icon(Icons.check_circle, color: Colors.green, size: 16),
                           const SizedBox(width: 6),
                           Text(_recentScans[index], style: const TextStyle(fontWeight: FontWeight.w500)),
                         ],
                       ),
                    ),
                  ),
            ),
          ],
        ),
      ),
    );
  }
}
