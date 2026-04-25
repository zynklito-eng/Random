import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Product, OperationType } from '../lib/types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Trash2, Edit, Plus, Ticket, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';

export function Dashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    subscriptionName: '',
    description: '',
    price: '',
    imageUrl: '',
    status: 'Available' as 'Available' | 'Sold Out'
  });

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      const prods: Product[] = [];
      snap.forEach(d => {
        prods.push({ id: d.id, ...d.data() } as Product);
      });
      setProducts(prods);
    }, err => handleFirestoreError(err, OperationType.LIST, 'products'));
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        name: formData.name,
        subscriptionName: formData.subscriptionName,
        description: formData.description,
        price: Number(formData.price),
        imageUrl: formData.imageUrl,
        status: formData.status,
        updatedAt: Date.now()
      };

      if (editingId) {
        await updateDoc(doc(db, 'products', editingId), data);
      } else {
        const newId = crypto.randomUUID();
        await setDoc(doc(db, 'products', newId), {
          ...data,
          createdAt: Date.now()
        });
      }
      setIsFormOpen(false);
      setEditingId(null);
      resetForm();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'products');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'products');
    }
  };

  const openEdit = (p: Product) => {
    setFormData({
      name: p.name,
      subscriptionName: p.subscriptionName,
      description: p.description,
      price: String(p.price),
      imageUrl: p.imageUrl || '',
      status: p.status
    });
    setEditingId(p.id!);
    setIsFormOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      subscriptionName: '',
      description: '',
      price: '',
      imageUrl: '',
      status: 'Available'
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in ease-out duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
          <p className="text-muted-foreground mt-1">Manage store inventory and operations.</p>
        </div>
        <Button onClick={() => { resetForm(); setEditingId(null); setIsFormOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4"/> Add Product
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
          </CardContent>
        </Card>
        {/* Placeholder cards for analytics */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventory</CardTitle>
          <CardDescription>All products currently listed.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y border rounded-md">
            {products.map(p => (
              <div key={p.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} className="w-12 h-12 rounded object-cover border" />
                  ) : (
                    <div className="w-12 h-12 rounded bg-muted flex items-center justify-center font-bold">{p.name[0]}</div>
                  )}
                  <div>
                    <h4 className="font-semibold">{p.name}</h4>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      {p.subscriptionName} &bull; ₱{p.price}
                      <Badge variant={p.status === 'Available' ? 'default' : 'secondary'} className="text-[10px] h-4 py-0 px-1 ml-2">
                        {p.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => openEdit(p)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="destructive" size="icon" onClick={() => handleDelete(p.id!)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            {products.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">No products added yet.</div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Product' : 'Add Product'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">App/Service Name</Label>
                <Input id="name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Netflix" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subName">Subscription Tier</Label>
                <Input id="subName" required value={formData.subscriptionName} onChange={e => setFormData({...formData, subscriptionName: e.target.value})} placeholder="e.g. 1 Month Premium" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (₱)</Label>
                <Input id="price" type="number" required min="0" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select id="status" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}>
                  <option value="Available">Available</option>
                  <option value="Sold Out">Sold Out</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl">Logo URL (Optional)</Label>
              <Input id="imageUrl" type="url" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} placeholder="https://..." />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" required rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Account details, terms, etc." />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
              <Button type="submit">Save Product</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
