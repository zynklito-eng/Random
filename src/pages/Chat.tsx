import React, { useEffect, useState, useRef } from 'react';
import { db, handleFirestoreError } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, setDoc, updateDoc, getDoc, getDocs } from 'firebase/firestore';
import { Conversation, Message, OperationType } from '../lib/types';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ScrollArea } from '../components/ui/scroll-area';
import { format } from 'date-fns';
import { Send, Image as ImageIcon, CheckCircle, ShieldAlert, BadgeCheck, Menu } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '../components/ui/sheet';

export function Chat() {
  const { user, profile } = useAuth();
  const location = useLocation();
  const initialIntent = location.state;
  
  const [conversations, setConversations] = useState<(Conversation & { userEmail?: string })[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isAdminOnline, setIsAdminOnline] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Admin presence listener
    const unsubAdmin = onSnapshot(doc(db, 'status', 'admin_status'), (d) => {
      if (d.exists()) {
        setIsAdminOnline(d.data().isOnline);
      }
    });

    return () => unsubAdmin();
  }, []);

  useEffect(() => {
    if (!user || !profile) return;
    
    if (profile.role === 'admin') {
      const q = query(collection(db, 'conversations'), orderBy('updatedAt', 'desc'));
      const unsub = onSnapshot(q, async (snap) => {
        const convs = snap.docs.map(d => ({id: d.id, ...d.data()}) as Conversation);
        
        // Fetch user emails for admin sidebar
        const convsWithUsers = await Promise.all(convs.map(async (c) => {
          try {
            const uSnap = await getDoc(doc(db, 'users', c.userId));
            return { ...c, userEmail: uSnap.exists() ? uSnap.data().email : 'Unknown User' };
          } catch {
            return { ...c, userEmail: 'Unknown User' };
          }
        }));
        
        setConversations(convsWithUsers);
        if (!activeConvId && convsWithUsers.length > 0) {
          setActiveConvId(convsWithUsers[0].id!);
        }
      });
      return () => unsub();
    } else {
      // Normal User: Find or create their conversation
      const checkOrCreateConv = async () => {
        try {
          const convRef = doc(db, 'conversations', user.uid);
          const snap = await getDoc(convRef);
          if (!snap.exists()) {
            await setDoc(convRef, {
              userId: user.uid,
              createdAt: Date.now(),
              updatedAt: Date.now(),
              lastMessage: ''
            });
          }
          setActiveConvId(user.uid);
        } catch(err) {
          handleFirestoreError(err, OperationType.WRITE, 'conversations');
        }
      };
      checkOrCreateConv();
    }
  }, [user, profile]);

  useEffect(() => {
    if (!activeConvId) return;
    const qMsg = query(
      collection(db, 'conversations', activeConvId, 'messages'),
      orderBy('createdAt', 'asc')
    );
    const unsubMsgs = onSnapshot(qMsg, (snap) => {
      setMessages(snap.docs.map(d => ({id: d.id, ...d.data()}) as Message));
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });
    return () => unsubMsgs();
  }, [activeConvId]);

  // Initial intent (Buy)
  useEffect(() => {
    if (initialIntent?.intent === 'buy' && initialIntent.product && activeConvId && messages.length === 0) {
      handleSend(`I would like to buy: ${initialIntent.product.name} (${initialIntent.product.subscriptionName}) for ₱${initialIntent.product.price}.`);
      // clear state so it doesn't loop
      window.history.replaceState({}, document.title);
    }
  }, [initialIntent, activeConvId]);

  const handleSend = async (text: string, imageUrl?: string) => {
    if ((!text.trim() && !imageUrl) || !activeConvId || !user) return;
    
    const msgId = crypto.randomUUID();
    const now = Date.now();
    const data = {
      senderId: user.uid,
      text: text.trim(),
      ...(imageUrl && { imageUrl }),
      createdAt: now
    };

    try {
      await setDoc(doc(db, 'conversations', activeConvId, 'messages', msgId), data);
      await updateDoc(doc(db, 'conversations', activeConvId), {
        updatedAt: now,
        lastMessage: imageUrl ? '[Image]' : text.trim()
      });
      setNewMessage('');

      // If user sent a message and AI should reply
      if (profile?.role === 'user' && !isAdminOnline) {
        generateAiReply(text.trim(), activeConvId);
      }

    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'messages');
    }
  };

  const generateAiReply = async (userText: string, convId: string) => {
    try {
      // Get brief history for context (last 5 messages)
      const recentMsgs = messages.slice(-5).map(m => ({
        role: m.senderId === user?.uid ? 'user' : 'model',
        parts: [{ text: m.text || '' }]
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, history: recentMsgs })
      });
      const data = await res.json();
      if (data.reply) {
        const msgId = crypto.randomUUID();
        const now = Date.now();
        await setDoc(doc(db, 'conversations', convId, 'messages', msgId), {
          senderId: 'admin_ai',
          text: data.reply,
          createdAt: now
        });
        await updateDoc(doc(db, 'conversations', convId), {
          updatedAt: now,
          lastMessage: data.reply
        });
      }
    } catch (e) {
      console.error("AI reply failed", e);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX = 800;
        
        if (width > height && width > MAX) {
          height *= MAX / width;
          width = MAX;
        } else if (height > MAX) {
          width *= MAX / height;
          height = MAX;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        handleSend('', dataUrl);
        setIsUploading(false);
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  if (!user) return null;

  return (
    <div className="flex h-[calc(100vh-8rem)] rounded-xl border bg-card shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-300">
      {/* Sidebar for Admin (Desktop) */}
      {profile?.role === 'admin' && (
        <div className="w-80 border-r hidden md:flex flex-col bg-muted/10 shrink-0">
          <div className="p-4 border-b font-semibold">Conversations</div>
          <ScrollArea className="flex-1">
            {conversations.map(c => (
              <div 
                key={c.id} 
                onClick={() => setActiveConvId(c.id!)}
                className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${activeConvId === c.id ? 'bg-muted' : ''}`}
              >
                <div className="font-medium text-sm truncate">{c.userEmail}</div>
                <div className="text-xs text-muted-foreground truncate">{c.lastMessage || 'No messages'}</div>
                <div className="text-[10px] text-muted-foreground mt-1">
                  {format(new Date(c.updatedAt), 'MMM d, h:mm a')}
                </div>
              </div>
            ))}
            {conversations.length === 0 && <div className="p-4 text-center text-muted-foreground text-sm">No chats yet</div>}
          </ScrollArea>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full bg-background relative min-w-0">
        {/* Chat Header */}
        <div className="h-16 border-b flex items-center px-4 md:px-6 justify-between shrink-0 bg-background/95 backdrop-blur z-10 shadow-sm">
          <div className="flex items-center gap-3">
            {profile?.role === 'admin' && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="md:hidden mr-2 shrink-0">
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 p-0 flex flex-col">
                  <SheetHeader className="p-4 border-b text-left">
                    <SheetTitle>Conversations</SheetTitle>
                  </SheetHeader>
                  <ScrollArea className="flex-1">
                    {conversations.map(c => (
                      <div 
                        key={c.id} 
                        onClick={() => setActiveConvId(c.id!)}
                        className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${activeConvId === c.id ? 'bg-muted' : ''}`}
                      >
                        <div className="font-medium text-sm truncate">{c.userEmail}</div>
                        <div className="text-xs text-muted-foreground truncate">{c.lastMessage || 'No messages'}</div>
                        <div className="text-[10px] text-muted-foreground mt-1">
                          {format(new Date(c.updatedAt), 'MMM d, h:mm a')}
                        </div>
                      </div>
                    ))}
                    {conversations.length === 0 && <div className="p-4 text-center text-muted-foreground text-sm">No chats yet</div>}
                  </ScrollArea>
                </SheetContent>
              </Sheet>
            )}
            <Avatar className="h-10 w-10 border border-primary/20 shrink-0">
              {profile?.role === 'admin' ? (
                <AvatarFallback>U</AvatarFallback> // Using dynamic user info would be better, but simplified
              ) : (
                <AvatarFallback className="bg-primary/10 text-primary">A</AvatarFallback>
              )}
            </Avatar>
            <div>
              <div className="font-semibold flex items-center gap-1.5">
                {profile?.role === 'admin' ? 'Customer' : 'Admin'}
                {profile?.role === 'user' && <BadgeCheck className="w-4 h-4 text-blue-500" />}
              </div>
              {profile?.role === 'user' && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                  <span className={`w-2 h-2 rounded-full ${isAdminOnline ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  {isAdminOnline ? 'Online - Available' : 'Offline - Automated Support'}
                </div>
              )}
            </div>
          </div>
          {initialIntent?.product && (
            <div className="hidden lg:flex flex-col items-end text-xs text-muted-foreground bg-muted pt-1 pb-1.5 px-3 rounded-md">
              <span className="font-semibold text-foreground">Order Ref:</span>
              {initialIntent.product.name} - ₱{initialIntent.product.price}
            </div>
          )}
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4 md:p-6 pb-20">
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground pt-20">
                <ShieldAlert className="w-12 h-12 mb-4 opacity-50 text-primary"/>
                <p>No messages yet. Say hello!</p>
                <p className="text-sm mt-2 opacity-75 max-w-sm text-center">
                  Payments are exclusively via GCash. After sending payment, please upload the screenshot here.
                </p>
              </div>
            )}
            {messages.map((m) => {
              const isAdmin = m.senderId === 'admin_ai' || m.senderId === 'admin_uid_placeholder' || (profile?.role === 'user' && m.senderId !== user.uid) || (profile?.role === 'admin' && m.senderId === user.uid);
              const isMe = m.senderId === user.uid;
              const isAi = m.senderId === 'admin_ai';
              
              return (
                <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm ${isMe ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-muted/60 text-foreground border rounded-tl-sm'}`}>
                    {isAi && <div className="text-[10px] uppercase font-bold tracking-wider mb-1 opacity-70 flex items-center gap-1">✨ AI Assistant</div>}
                    {m.text && <div className="whitespace-pre-wrap text-sm">{m.text}</div>}
                    {m.imageUrl && (
                      <img src={m.imageUrl} alt="attachment" className="mt-2 rounded-lg max-w-full md:max-w-xs border shadow-sm" />
                    )}
                    <div className={`text-[10px] mt-1.5 text-right ${isMe ? 'text-primary-foreground/75' : 'text-muted-foreground'}`}>
                      {format(new Date(m.createdAt), 'h:mm a')}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="absolute bottom-0 w-full bg-background border-t p-4 z-10">
          <form className="flex items-end gap-2 max-w-4xl mx-auto" onSubmit={(e) => { e.preventDefault(); handleSend(newMessage); }}>
            <div className="relative flex-1">
              <Input 
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="pr-10 bg-muted/30 focus-visible:bg-background border-muted-foreground/20"
              />
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                id="file-upload"
                onChange={handleImageUpload}
              />
              <label htmlFor="file-upload" className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer p-1.5 hover:bg-muted rounded-md text-muted-foreground transition-colors">
                <ImageIcon className="w-4 h-4" />
              </label>
            </div>
            <Button type="submit" size="icon" disabled={!newMessage.trim() && !isUploading} className="shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground transition-colors shadow-sm">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
