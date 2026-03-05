"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Send, Bot, User, Plus, MessageSquare, Trash2, Edit2, History } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";

// ⚡ Lazy load Markdown for better initial load speed
const ReactMarkdown = dynamic(() => import("react-markdown"), { ssr: false });

export default function AdvancedChat() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [editTitle, setEditTitle] = useState("");
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [sessionToEdit, setSessionToEdit] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/sessions/${user.id}`);
        const data = await res.json();
        setSessions(data);
        if (data.length > 0) setActiveSessionId(data[0].id);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (activeSessionId) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/messages/${activeSessionId}`)
        .then(res => res.json())
        .then(setMessages);
    }
  }, [activeSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || !activeSessionId || !userId) return;

    const userMsg = input;
    setInput("");
    
    // ⚡ Optimistic Update: Add user message immediately
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, session_id: activeSessionId, message: userMsg }),
      });
      
      // Instead of refetching everything, we just wait for the next set of messages
      // This part depends on your backend returning the single AI message or full list
      const updatedMessages = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/messages/${activeSessionId}`).then(r => r.json());
      setMessages(updatedMessages);
    } finally {
      setLoading(false);
    }
  };

  const handleNewSession = async () => {
    if (!userId) return;
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, title: "New Chat" }),
    });
    const newSession = await res.json();
    setSessions([newSession, ...sessions]);
    setActiveSessionId(newSession.id);
    setMessages([]);
    setIsMobileMenuOpen(false);
  };

  const handleDeleteSession = async (id: string) => {
    if (!confirm("Delete?")) return;
    setSessions(prev => prev.filter(s => s.id !== id));
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/sessions/${id}`, { method: "DELETE" });
    if (activeSessionId === id) setActiveSessionId(null);
  };

  const SessionList = useMemo(() => () => (
    <div className="flex flex-col h-full space-y-2">
      <Button className="w-full mb-2 h-12 rounded-xl" onClick={handleNewSession}><Plus className="mr-2 h-5 w-5" /> New Chat</Button>
      <div className="flex-1 overflow-y-auto space-y-1">
        {sessions.map((s) => (
          <div key={s.id} onClick={() => {setActiveSessionId(s.id); setIsMobileMenuOpen(false);}}
            className={`group flex justify-between items-center p-3 rounded-xl cursor-pointer transition-all border ${activeSessionId === s.id ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200" : "border-transparent hover:bg-slate-100 dark:hover:bg-slate-800"}`}>
            <div className="flex items-center gap-2 truncate text-sm">
              <MessageSquare size={14} /> <span className="truncate">{s.title}</span>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
              <Edit2 size={12} className="hover:text-blue-500" onClick={(e) => { e.stopPropagation(); setSessionToEdit(s.id); setEditTitle(s.title); setIsRenameOpen(true); }} />
              <Trash2 size={12} className="hover:text-red-500" onClick={(e) => { e.stopPropagation(); handleDeleteSession(s.id); }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  ), [sessions, activeSessionId]);

  return (
    <div className="flex h-[calc(100vh-6rem)] gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <Card className="hidden md:block w-72 p-4 border-slate-200 dark:border-slate-800 shadow-sm"><SessionList /></Card>
      
      <Card className="flex-1 flex flex-col shadow-xl overflow-hidden border-slate-200 dark:border-slate-800">
        <div className="md:hidden flex justify-between p-4 border-b">
          <div className="flex items-center gap-2 font-bold"><Bot className="text-blue-500" /> AI Co-Founder</div>
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild><Button variant="ghost"><History /></Button></SheetTrigger>
            <SheetContent side="left" className="w-72"><SessionList /></SheetContent>
          </Sheet>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30 dark:bg-slate-950/20">
          {!activeSessionId ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400"><Bot size={48} /><p>Select or start a chat</p></div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role !== "user" && <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white shrink-0"><Bot size={14} /></div>}
                <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm shadow-sm ${msg.role === "user" ? "bg-slate-900 text-white dark:bg-white dark:text-black" : "bg-white dark:bg-slate-900 border"}`}>
                  <ReactMarkdown className="prose dark:prose-invert prose-sm">{msg.content}</ReactMarkdown>
                </div>
              </div>
            ))
          )}
          {loading && <div className="flex gap-2 animate-pulse"><div className="w-8 h-8 bg-slate-200 rounded-full" /><div className="w-32 h-8 bg-slate-200 rounded-xl" /></div>}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border-t">
          <form onSubmit={handleSend} className="flex gap-2 max-w-4xl mx-auto">
            <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message..." disabled={loading} className="rounded-xl h-11" />
            <Button type="submit" disabled={loading || !input.trim()} className="h-11 px-6 rounded-xl bg-blue-600"><Send size={18} /></Button>
          </form>
        </div>
      </Card>

      <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Rename Chat</DialogTitle></DialogHeader>
          <div className="flex gap-2 mt-4">
            <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            <Button onClick={async () => {
              await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/sessions/${sessionToEdit}?title=${editTitle}`, { method: "PUT" });
              setSessions(s => s.map(x => x.id === sessionToEdit ? {...x, title: editTitle} : x));
              setIsRenameOpen(false);
            }}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}