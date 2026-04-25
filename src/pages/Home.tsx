import { useEffect, useState } from 'react';
import { db, handleFirestoreError } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { Product, OperationType } from '../lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { BadgeCheck, ShoppingCart } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '../components/ui/tooltip';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';

export function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const { user, login } = useAuth();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      const prods: Product[] = [];
      snap.forEach(doc => {
        prods.push({ id: doc.id, ...doc.data() } as Product);
      });
      setProducts(prods);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'products'));

    return () => unsubscribe();
  }, [user]);

  const handleBuy = () => {
    if (!selectedProduct) return;
    // Pass the selected product info to chat via navigation state
    navigate('/chat', { state: { intent: 'buy', product: selectedProduct } });
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-4">
        <div className="bg-primary/10 p-4 rounded-full mb-6 text-primary">
          <BadgeCheck className="w-12 h-12" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl mb-4">
          Premium Access. <br/> Instantly Delivered.
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mb-8">
          Secure, verified, and legitimate premium accounts for all your needs. Sign in with Google to view available subscriptions.
        </p>
        <Button size="lg" onClick={login} className="text-lg px-8">
          Sign In to Browse
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in ease-out duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Storefront</h2>
          <p className="text-muted-foreground mt-1">Browse our verified premium subscriptions.</p>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-xl p-8 bg-muted/10">
          <p className="text-muted-foreground">No products are currently available.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(product => (
            <Card key={product.id} className="overflow-hidden flex flex-col group border-primary/10 hover:border-primary/30 transition-all shadow-sm hover:shadow-md">
              <CardHeader className="bg-muted/30 pb-4">
                <div className="flex justify-between items-start gap-4">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-16 h-16 rounded-xl object-cover shadow-sm bg-background border" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xl border">
                      {product.name[0]}
                    </div>
                  )}
                  <Badge variant={product.status === 'Available' ? 'default' : 'secondary'} className="font-medium">
                    {product.status}
                  </Badge>
                </div>
                <CardTitle className="mt-4 flex items-center gap-2">
                  {product.name}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <BadgeCheck className="w-5 h-5 text-blue-500 shrink-0" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Verified Seller — Legitimate account provider.</p>
                    </TooltipContent>
                  </Tooltip>
                </CardTitle>
                <div className="text-sm font-medium text-primary mt-1">{product.subscriptionName}</div>
              </CardHeader>
              <CardContent className="flex-1 pt-4">
                <p className="text-muted-foreground text-sm line-clamp-3">{product.description}</p>
                <div className="text-2xl font-bold mt-4">
                  ₱{product.price.toLocaleString()}
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full font-semibold" 
                  disabled={product.status !== 'Available'}
                  onClick={() => setSelectedProduct(product)}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" /> Buy Now
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Order Summary</DialogTitle>
            <DialogDescription>
              Confirm your purchase details before proceeding.
            </DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <div className="py-4 space-y-4">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="font-medium text-muted-foreground">Product</span>
                <span className="font-semibold">{selectedProduct.name}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="font-medium text-muted-foreground">Subscription</span>
                <span className="font-medium">{selectedProduct.subscriptionName}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="font-medium text-muted-foreground">Price</span>
                <span className="text-xl font-bold text-primary">₱{selectedProduct.price.toLocaleString()}</span>
              </div>
              
              <div className="bg-muted p-4 rounded-lg text-sm text-center mt-4">
                <p>You will be redirected to chat with the Admin after this.</p>
                <p className="font-semibold mt-1">Payment is via GCash only.</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedProduct(null)}>Cancel</Button>
            <Button onClick={handleBuy}>Confirm & Proceed</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
