import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { ShieldCheck, Moon, Sun, Monitor, Lock, BadgeCheck } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, getDoc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';

export function Settings() {
  const { user, profile } = useAuth();
  const { theme, setTheme } = useTheme();
  const [isAdminOnline, setIsAdminOnline] = useState(false);

  useEffect(() => {
    if (profile?.role !== 'admin') return;
    const unsub = onSnapshot(doc(db, 'status', 'admin_status'), (d) => {
      if (d.exists()) setIsAdminOnline(d.data().isOnline);
    });
    return () => unsub();
  }, [profile]);

  const toggleAdminStatus = async () => {
    try {
      const ref = doc(db, 'status', 'admin_status');
      const d = await getDoc(ref);
      if (!d.exists()) {
        await setDoc(ref, { isOnline: !isAdminOnline, updatedAt: Date.now() });
      } else {
        await updateDoc(ref, { isOnline: !isAdminOnline, updatedAt: Date.now() });
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in ease-out duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground mt-1">Manage your account and preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
          <CardDescription>We use secure Google authentication to protect you.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-lg border">
            <img src={user.photoURL!} alt="" className="w-12 h-12 rounded-full border shadow-sm" />
            <div>
              <p className="font-semibold">{user.displayName}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            {profile?.role === 'admin' && (
              <div className="ml-auto bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase">
                Admin
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize how the site looks for you.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button variant={theme === 'light' ? 'default' : 'outline'} className="flex-1 gap-2" onClick={() => setTheme('light')}>
              <Sun className="w-4 h-4" /> Light
            </Button>
            <Button variant={theme === 'dark' ? 'default' : 'outline'} className="flex-1 gap-2" onClick={() => setTheme('dark')}>
              <Moon className="w-4 h-4" /> Dark
            </Button>
          </div>
        </CardContent>
      </Card>

      {profile?.role === 'admin' && (
        <Card className="border-primary/50">
          <CardHeader>
            <CardTitle className="text-primary">Admin Preferences</CardTitle>
            <CardDescription>Manage global store presence.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between border p-4 rounded-lg">
              <div>
                <Label className="text-base font-semibold">Live Chat Status</Label>
                <p className="text-sm text-muted-foreground">Toggle to enable/disable automated AI replies.</p>
              </div>
              <Button onClick={toggleAdminStatus} variant={isAdminOnline ? 'default' : 'destructive'} className="w-24">
                {isAdminOnline ? 'Online' : 'Offline'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trust Statements */}
      <div className="pt-8 border-t space-y-4">
        <h3 className="font-semibold text-muted-foreground text-sm uppercase tracking-wider text-center">Security & Trust</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 bg-muted/10 p-3 rounded-md border text-sm">
            <ShieldCheck className="w-5 h-5 text-green-500 shrink-0" />
            <span className="font-medium">100% Legit Transactions</span>
          </div>
          <div className="flex items-center gap-3 bg-muted/10 p-3 rounded-md border text-sm">
            <BadgeCheck className="w-5 h-5 text-blue-500 shrink-0" />
            <span className="font-medium">Verified Seller</span>
          </div>
          <div className="flex items-center gap-3 bg-muted/10 p-3 rounded-md border text-sm">
            <Lock className="w-5 h-5 text-muted-foreground shrink-0" />
            <span className="font-medium">Your data is encrypted</span>
          </div>
          <div className="flex items-center gap-3 bg-muted/10 p-3 rounded-md border text-sm">
            <Monitor className="w-5 h-5 text-muted-foreground shrink-0" />
            <span className="font-medium">Secure Google Login</span>
          </div>
        </div>
      </div>
    </div>
  );
}
