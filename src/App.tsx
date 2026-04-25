import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';
import { Chat } from './pages/Chat';
import { Settings } from './pages/Settings';
import { Legal } from './pages/Legal';
import { FAQ } from './pages/FAQ';
import { Navbar } from './components/Navbar';
import { TooltipProvider } from './components/ui/tooltip';
import { ShieldCheck } from 'lucide-react';
import { ADMIN_EMAIL } from './lib/firebase';

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center p-4">Loading...</div>;
  if (!user || !profile) return <Navigate to="/" />;
  if (adminOnly && profile.role !== 'admin') return <Navigate to="/" />;
  return <>{children}</>;
}

function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen border-none bg-background text-foreground flex-col w-full selection:bg-primary selection:text-primary-foreground font-sans antialiased">
      <Navbar />
      <main className="flex-1 overflow-x-hidden md:px-0">
        <div className="mx-auto w-full max-w-5xl p-4 md:p-8">
          {children}
        </div>
      </main>
      <footer className="border-t py-6 text-center text-sm text-muted-foreground w-full bg-muted/20">
        <div className="mx-auto max-w-5xl px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-primary" /> Premium Accounts Hub &copy; {new Date().getFullYear()}
          </p>
          <div className="flex gap-4">
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link to="/refund" className="hover:text-foreground transition-colors">Refund Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider delay={0}>
          <BrowserRouter>
            <MainLayout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/dashboard" element={<ProtectedRoute adminOnly><Dashboard /></ProtectedRoute>} />
                <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/terms" element={<Legal page="terms" />} />
                <Route path="/privacy" element={<Legal page="privacy" />} />
                <Route path="/refund" element={<Legal page="refund" />} />
                <Route path="/faq" element={<FAQ />} />
              </Routes>
            </MainLayout>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
