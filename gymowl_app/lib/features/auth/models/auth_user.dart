class AuthUser {
  final String id;
  final String fullName;
  final String phone;
  final String role;
  final String? tenantId;

  AuthUser({
    required this.id,
    required this.fullName,
    required this.phone,
    required this.role,
    this.tenantId,
  });

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    return AuthUser(
      id: json['id'] as String,
      fullName: (json['fullName'] ?? json['full_name'] ?? '') as String,
      phone: (json['phone'] ?? '') as String,
      role: (json['role'] ?? 'member') as String,
      tenantId: json['tenantId'] ?? json['tenant_id'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'fullName': fullName,
      'phone': phone,
      'role': role,
      'tenantId': tenantId,
    };
  }
}
