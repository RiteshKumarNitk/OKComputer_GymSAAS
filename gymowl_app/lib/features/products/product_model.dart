class Product {
  final String id;
  final String name;
  final String? description;
  final int? priceCents;
  final int? stockQuantity;
  final String? category;
  final String? imageUrl;

  Product({
    required this.id,
    required this.name,
    this.description,
    this.priceCents,
    this.stockQuantity,
    this.category,
    this.imageUrl,
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      priceCents: json['priceCents'] as int?,
      stockQuantity: json['stockQuantity'] as int?,
      category: json['category'] as String?,
      imageUrl: json['imageUrl'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'priceCents': priceCents,
      'stockQuantity': stockQuantity,
      'category': category,
      'imageUrl': imageUrl,
    };
  }
}