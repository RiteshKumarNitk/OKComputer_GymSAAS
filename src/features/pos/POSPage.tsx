import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { productsApi, paymentsApi } from "@/api/apiClient"
import { useAuth } from "@/features/auth/AuthContext"
import { formatCurrency } from "@/lib/utils"
import { ShoppingCart, Plus, Minus, Trash2, Package, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PageHeader } from "@/components/common"

interface Product {
    id: string
    name: string
    priceCents?: number
    stockQuantity?: number
    category: string
    description: string
}

interface CartItem extends Product {
    quantity: number
}

export const POSPage: React.FC = () => {
    const { user } = useAuth()
    const { toast } = useToast()
    const queryClient = useQueryClient()
    const [cart, setCart] = useState<CartItem[]>([])
    const [isAddProductOpen, setIsAddProductOpen] = useState(false)
    const [, setCheckoutOpen] = useState(false)

    // Fetch Products
    const { data: products } = useQuery({
        queryKey: ["products", user?.tenantId],
        queryFn: async () => {
            const response = await productsApi.list(user?.tenantId || "")
            if (response.error) throw response.error
            return response.data as Product[]
        },
        enabled: !!user?.tenantId,
    })

    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(p => p.id === product.id)
            if (existing) {
                return prev.map(p => p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p)
            }
            return [...prev, { ...product, quantity: 1 }]
        })
    }

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(p => p.id !== productId))
    }

    const updateQuantity = (productId: string, delta: number) => {
        setCart(prev => prev.map(p => {
            if (p.id === productId) {
                const newQty = Math.max(1, p.quantity + delta)
                return { ...p, quantity: newQty }
            }
            return p
        }))
    }

    // Add Product Mutation
    const addProductMutation = useMutation({
        mutationFn: async (formData: FormData) => {
            const data = {
                name: formData.get("name") as string,
                priceCents: Math.round(parseFloat(formData.get("price") as string) * 100),
                stockQuantity: parseInt(formData.get("stock") as string),
                category: formData.get("category") as string,
            }
            const response = await productsApi.create(data)
            if (response.error) throw response.error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] })
            setIsAddProductOpen(false)
            toast({ title: "Product Added" })
        },
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
    })

    // Checkout Mutation
    const checkoutMutation = useMutation({
        mutationFn: async () => {
            for (const item of cart) {
                const updateResponse = await productsApi.update(item.id, {
                    stockQuantity: (item.stockQuantity || 0) - item.quantity
                })
                if (updateResponse.error) console.error("Stock update failed", updateResponse.error)

                await paymentsApi.create({
                    amountCents: (item.priceCents ?? 0) * item.quantity,
                    currency: "INR",
                    status: "paid",
                    provider: "cash",
                    metadata: { type: "pos_sale", product_name: item.name, quantity: item.quantity },
                    memberId: null
                })
            }
        },
        onSuccess: () => {
            setCart([])
            setCheckoutOpen(false)
            queryClient.invalidateQueries({ queryKey: ["products"] })
            toast({ title: "Sale Completed", description: "Stock updated." })
        },
        onError: (err: any) => toast({ title: "Checkout Failed", description: err.message, variant: "destructive" })
    })

    const cartTotal = cart.reduce((sum, item) => sum + ((item.priceCents ?? 0) * item.quantity), 0)

    return (
        <div className="flex h-[calc(100vh-2rem)] gap-4 flex-col md:flex-row">
            {/* Products Grid */}
            <div className="flex-1 space-y-4 overflow-auto">
                <PageHeader
                    title="Point of Sale"
                    actions={
                        <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
                            <DialogTrigger asChild>
                                <Button><Plus className="mr-2 h-4 w-4" /> Add Product</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add New Product</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={(e) => { e.preventDefault(); addProductMutation.mutate(new FormData(e.currentTarget)); }} className="space-y-4">
                                    <Input name="name" placeholder="Product Name (e.g. Whey Protein)" required />
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input name="price" type="number" placeholder="Price (₹)" required />
                                        <Input name="stock" type="number" placeholder="Initial Stock" required />
                                    </div>
                                    <Input name="category" placeholder="Category (e.g. Supplements)" />
                                    <DialogFooter><Button type="submit">Add Product</Button></DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    }
                />

                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
                    {products?.map(product => (
                        <Card key={product.id} className="cursor-pointer hover:border-primary transition-colors" onClick={() => addToCart(product)}>
                            <CardHeader className="p-4 pb-2">
                                <CardTitle className="text-base truncate" title={product.name}>{product.name}</CardTitle>
                                <CardDescription>{product.category}</CardDescription>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                                <div className="flex justify-between items-center mt-2">
                                    <span className="font-bold text-lg">{formatCurrency(product.priceCents ?? 0)}</span>
                                    <Badge variant={(product.stockQuantity ?? 0) > 0 ? "outline" : "destructive"}>
                                        {product.stockQuantity ? `${product.stockQuantity} left` : "Out of Stock"}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {products?.length === 0 && <div className="col-span-full text-center text-muted-foreground py-10">No products found.</div>}
                </div>
            </div>

            {/* Cart Sidebar */}
            <div className="w-full md:w-96 bg-card border rounded-xl shadow-sm flex flex-col h-[600px] md:h-auto">
                <div className="p-4 border-b">
                    <h2 className="font-semibold flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5" /> Current Order
                    </h2>
                </div>

                <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                        {cart.map(item => (
                            <div key={item.id} className="flex justify-between items-center bg-muted/50 p-2 rounded-lg">
                                <div className="flex-1 min-w-0 mr-2">
                                    <p className="font-medium text-sm truncate">{item.name}</p>
                                    <p className="text-xs text-muted-foreground">{formatCurrency(item.priceCents ?? 0)} x {item.quantity}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.id, -1)}><Minus className="h-3 w-3" /></Button>
                                    <span className="w-4 text-center text-sm">{item.quantity}</span>
                                    <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.id, 1)}><Plus className="h-3 w-3" /></Button>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeFromCart(item.id)}><Trash2 className="h-3 w-3" /></Button>
                                </div>
                            </div>
                        ))}
                        {cart.length === 0 && (
                            <div className="text-center text-muted-foreground py-10 flex flex-col items-center">
                                <Package className="h-10 w-10 mb-2 opacity-50" />
                                <p>Cart is empty</p>
                                <p className="text-xs">Click products to add</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                <div className="p-4 border-t bg-muted/20 space-y-4">
                    <div className="flex justify-between items-center text-lg font-bold">
                        <span>Total</span>
                        <span>{formatCurrency(cartTotal)}</span>
                    </div>
                    <Button className="w-full" size="lg" disabled={cart.length === 0 || checkoutMutation.isPending} onClick={() => checkoutMutation.mutate()}>
                        {checkoutMutation.isPending ? "Processing..." : "Complete Sale"}
                        <CreditCard className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
