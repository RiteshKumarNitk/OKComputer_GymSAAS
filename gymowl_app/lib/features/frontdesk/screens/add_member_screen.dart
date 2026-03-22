import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:dio/dio.dart';
import '../../../core/api/api_client.dart';

class AddMemberScreen extends ConsumerStatefulWidget {
  const AddMemberScreen({super.key});

  @override
  ConsumerState<AddMemberScreen> createState() => _AddMemberScreenState();
}

class _AddMemberScreenState extends ConsumerState<AddMemberScreen> {
  final _formKey = GlobalKey<FormState>();
  final _fullNameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  final _addressController = TextEditingController();
  final _emergencyNameController = TextEditingController();
  final _emergencyPhoneController = TextEditingController();
  final _emergencyRelationController = TextEditingController();
  final _notesController = TextEditingController();

  bool _isSubmitting = false;
  List<dynamic> _plans = [];
  List<dynamic> _trainers = [];
  String? _selectedPlanId;
  String? _selectedTrainerId;
  String? _gender;
  String _status = 'active';
  DateTime? _dob;
  XFile? _imageFile;

  @override
  void initState() {
    super.initState();
    _fetchPlans();
    _fetchTrainers();
  }

  Future<void> _fetchPlans() async {
    try {
      final apiClient = ref.read(apiClientProvider);
      final response = await apiClient.dio.get('/memberships');
      if (mounted) setState(() => _plans = response.data);
    } catch (e) {}
  }

  Future<void> _fetchTrainers() async {
    try {
      final apiClient = ref.read(apiClientProvider);
      final response = await apiClient.dio.get('/trainers');
      if (mounted) setState(() => _trainers = response.data);
    } catch (e) {}
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final image = await picker.pickImage(source: ImageSource.gallery);
    if (image != null) setState(() => _imageFile = image);
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isSubmitting = true);

    try {
      final apiClient = ref.read(apiClientProvider);
      String? uploadedUrl;

      if (_imageFile != null) {
        FormData uploadData = FormData.fromMap({
          'file': await MultipartFile.fromFile(_imageFile!.path, filename: 'avatar.jpg'),
        });
        final uploadResponse = await apiClient.dio.post('/upload', data: uploadData);
        if (uploadResponse.statusCode == 200 || uploadResponse.statusCode == 201) {
          uploadedUrl = uploadResponse.data['url'];
        }
      }

      final Map<String, dynamic> data = {
        'fullName': _fullNameController.text,
        'phone': _phoneController.text,
        'memberCode': 'MEM${DateTime.now().millisecondsSinceEpoch}',
        'email': _emailController.text.isNotEmpty ? _emailController.text : null,
        'address': _addressController.text.isNotEmpty ? {'street': _addressController.text} : null,
        'gender': _gender,
        'dob': _dob?.toIso8601String(),
        'emergencyContact': {
          'name': _emergencyNameController.text,
          'phone': _emergencyPhoneController.text,
          'relationship': _emergencyRelationController.text,
        },
        'currentPlanId': _selectedPlanId,
        'assignedTrainerId': _selectedTrainerId,
        'status': _status,
        'notes': _notesController.text.isNotEmpty ? _notesController.text : null,
      };

      if (uploadedUrl != null) {
        data['avatarUrl'] = uploadedUrl;
      }

      final response = await apiClient.dio.post('/members', data: data);

      if (response.statusCode == 200 || response.statusCode == 201) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Member added successfully'), backgroundColor: Colors.green));
          Navigator.of(context).pop();
        }
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to add member: $e'), backgroundColor: Colors.red));
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F6FA),
      appBar: AppBar(title: const Text('Add Member', style: TextStyle(fontWeight: FontWeight.bold)), backgroundColor: Colors.transparent, elevation: 0, foregroundColor: const Color(0xFF1A1F38)),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _buildImagePicker(),
              const SizedBox(height: 24),
              _buildSectionHeader('Personal Information'),
              const SizedBox(height: 12),
              _buildTextField(controller: _fullNameController, label: 'Full Name *', icon: Icons.person_outline, validator: (v) => v!.isEmpty ? 'Required' : null),
              const SizedBox(height: 12),
              _buildTextField(controller: _phoneController, label: 'Phone Number *', icon: Icons.phone_outlined, keyboardType: TextInputType.phone, validator: (v) => v!.isEmpty ? 'Required' : null),
              const SizedBox(height: 12),
              _buildTextField(controller: _emailController, label: 'Email Address', icon: Icons.mail_outline, keyboardType: TextInputType.emailAddress),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _buildDropdownField(
                      label: 'Gender',
                      icon: Icons.wc,
                      value: _gender,
                      items: ['male', 'female', 'other'],
                      onChanged: (v) => setState(() => _gender = v),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(child: _buildDatePicker()),
                ],
              ),
              const SizedBox(height: 12),
              _buildTextField(controller: _addressController, label: 'Address', icon: Icons.location_on_outlined),
              const SizedBox(height: 24),
              _buildSectionHeader('Emergency Contact'),
              const SizedBox(height: 12),
              _buildTextField(controller: _emergencyNameController, label: 'Contact Name', icon: Icons.badge_outlined),
              const SizedBox(height: 12),
              _buildTextField(controller: _emergencyPhoneController, label: 'Contact Phone', icon: Icons.phone_android, keyboardType: TextInputType.phone),
              const SizedBox(height: 12),
              _buildTextField(controller: _emergencyRelationController, label: 'Relationship', icon: Icons.people_outline),
              const SizedBox(height: 24),
              _buildSectionHeader('Membership Information'),
              const SizedBox(height: 12),
              _buildPlanDropdown(),
              const SizedBox(height: 12),
              _buildTrainerDropdown(),
              const SizedBox(height: 12),
              _buildDropdownField(
                label: 'Status',
                icon: Icons.toggle_on_outlined,
                value: _status,
                items: ['active', 'inactive', 'paused'],
                onChanged: (v) => setState(() => _status = v!),
              ),
              const SizedBox(height: 12),
              _buildTextField(controller: _notesController, label: 'Notes', icon: Icons.notes, maxLines: 3),
              const SizedBox(height: 40),
              ElevatedButton(
                onPressed: _isSubmitting ? null : _submit,
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF1A1F38), padding: const EdgeInsets.symmetric(vertical: 16), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                child: _isSubmitting ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) : const Text('Create Member', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF1A1F38)));
  }

  Widget _buildImagePicker() {
    return Center(
      child: Stack(
        children: [
          CircleAvatar(
            radius: 50,
            backgroundColor: Colors.grey.shade200,
            backgroundImage: _imageFile != null ? FileImage(File(_imageFile!.path)) : null,
            child: _imageFile == null ? const Icon(Icons.person, size: 50, color: Colors.grey) : null,
          ),
          Positioned(
            bottom: 0,
            right: 0,
            child: GestureDetector(
              onTap: _pickImage,
              child: Container(
                padding: const EdgeInsets.all(6),
                decoration: const BoxDecoration(color: Color(0xFF1A1F38), shape: BoxShape.circle),
                child: const Icon(Icons.camera_alt, color: Colors.white, size: 18),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDatePicker() {
    return Container(
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 10, offset: const Offset(0, 4))]),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16),
        leading: const Icon(Icons.calendar_today, color: Color(0xFF1A1F38)),
        title: Text(_dob != null ? '${_dob!.day}/${_dob!.month}/${_dob!.year}' : 'DOB', style: TextStyle(color: _dob != null ? Colors.black : Colors.grey[600], fontSize: 14)),
        onTap: () async {
          final date = await showDatePicker(context: context, initialDate: DateTime(2000), firstDate: DateTime(1900), lastDate: DateTime.now());
          if (date != null) setState(() => _dob = date);
        },
      ),
    );
  }

  Widget _buildDropdownField({required String label, required IconData icon, required String? value, required List<String> items, required void Function(String?) onChanged}) {
    return Container(
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 10, offset: const Offset(0, 4))]),
      child: DropdownButtonFormField<String>(
        value: value,
        decoration: InputDecoration(labelText: label, prefixIcon: Icon(icon, color: const Color(0xFF1A1F38)), border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none), filled: true, fillColor: Colors.transparent),
        items: items.map((item) => DropdownMenuItem(value: item, child: Text(item.toUpperCase()))).toList(),
        onChanged: onChanged,
      ),
    );
  }

  Widget _buildPlanDropdown() {
    return Container(
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 10, offset: const Offset(0, 4))]),
      child: DropdownButtonFormField<String>(
        value: _selectedPlanId,
        decoration: InputDecoration(labelText: 'Select Membership Plan', prefixIcon: const Icon(Icons.card_membership, color: Color(0xFF1A1F38)), border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none), filled: true, fillColor: Colors.transparent),
        items: _plans.map((p) => DropdownMenuItem(value: p['id'].toString(), child: Text('${p['name']} (\$${p['priceCents'] / 100})'))).toList(),
        onChanged: (v) => setState(() => _selectedPlanId = v),
      ),
    );
  }

  Widget _buildTrainerDropdown() {
    return Container(
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 10, offset: const Offset(0, 4))]),
      child: DropdownButtonFormField<String>(
        value: _selectedTrainerId,
        decoration: InputDecoration(labelText: 'Assign Trainer', prefixIcon: const Icon(Icons.fitness_center, color: Color(0xFF1A1F38)), border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none), filled: true, fillColor: Colors.transparent),
        items: _trainers.map((t) => DropdownMenuItem(value: t['id'].toString(), child: Text(t['fullName'] ?? 'Trainer'))).toList(),
        onChanged: (v) => setState(() => _selectedTrainerId = v),
      ),
    );
  }

  Widget _buildTextField({required TextEditingController controller, required String label, required IconData icon, TextInputType keyboardType = TextInputType.text, String? Function(String?)? validator, int maxLines = 1}) {
    return Container(
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 10, offset: const Offset(0, 4))]),
      child: TextFormField(
        controller: controller,
        keyboardType: keyboardType,
        validator: validator,
        maxLines: maxLines,
        decoration: InputDecoration(labelText: label, prefixIcon: Icon(icon, color: const Color(0xFF1A1F38)), border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none), filled: true, fillColor: Colors.transparent, contentPadding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16)),
      ),
    );
  }
}
