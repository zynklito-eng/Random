import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuItem, DropdownMenuContent, DropdownMenuSeparator } from './ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { ShieldAlert, LogIn, LayoutDashboard, MessageSquare, Settings as SettingsIcon, LogOut, HelpCircle } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useEffect, useState } from 'react';

export function Navbar() {
  const { user, profile, login, logout } = useAuth();
  
  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <span>Premium Hub</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/faq">
            <Button variant="ghost" size="sm" className="hidden sm:flex gap-1.5 text-muted-foreground">
              <HelpCircle className="h-4 w-4" /> FAQ
            </Button>
          </Link>

          {!user ? (
            <Button onClick={login} className="font-medium">
              <LogIn className="mr-2 h-4 w-4" /> Sign In
            </Button>
          ) : (
            <div className="flex items-center gap-3">
              {profile?.role === 'admin' && (
                <Link to="/dashboard">
                  <Button variant="outline" size="sm" className="hidden md:flex">
                    <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                  </Button>
                </Link>
              )}
              <Link to="/chat">
                <Button variant="ghost" size="sm" className="relative mr-2">
                  <MessageSquare className="h-5 w-5" />
                  {/* Optional unread badge can go here */}
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full border">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
                      <AvatarFallback>{user.email?.[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex flex-col space-y-1 p-2">
                    <p className="text-sm font-medium leading-none">{user.displayName}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  {profile?.role === 'admin' && (
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard" className="cursor-pointer">
                        <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="cursor-pointer">
                      <SettingsIcon className="mr-2 h-4 w-4" /> Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" /> Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
