"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Send, Bot, User, Plus, MessageSquare, Trash2, Edit2, Menu, History } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export default function AdvancedChat() {
  // State
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Rename State
  const [editTitle, setEditTitle] = useState("");
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [sessionToEdit, setSessionToEdit] = useState<string | null>(null);

  // Mobile Menu State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => { fetchSessions(); }, []);
  useEffect(() => { if (activeSessionId) fetchMessages(activeSessionId); }, [activeSessionId]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const fetchSessions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const res = await fetch(`http://localhost:8000/chat/sessions/${user.id}`);
    const data = await res.json();
    setSessions(data);
    if (!activeSessionId && data.length > 0) setActiveSessionId(data[0].id);
  };

  const fetchMessages = async (sessionId: string) => {
    const res = await fetch(`http://localhost:8000/chat/messages/${sessionId}`);
    const data = await res.json();
    setMessages(data);
  };

  const handleNewSession = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const res = await fetch("http://localhost:8000/chat/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, title: "New Strategy Chat" })
    });
    const newSession = await res.json();
    setSessions([newSession, ...sessions]);
    setActiveSessionId(newSession.id);
    setMessages([]);
    setIsMobileMenuOpen(false); // Close mobile menu on new chat
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || !activeSessionId) return;

    const userMsg = input;
    setInput("");
    
    const tempMsg = { role: "user", content: userMsg, id: "temp" };
    setMessages(prev => [...prev, tempMsg]);
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    await fetch("http://localhost:8000/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            user_id: user?.id,
            session_id: activeSessionId,
            message: userMsg
        })
    });

    await fetchMessages(activeSessionId);
    setLoading(false);
  };

  const handleDeleteSession = async (e: any, id: string) => {
    e.stopPropagation();
    if(!confirm("Delete this chat?")) return;
    await fetch(`http://localhost:8000/chat/sessions/${id}`, { method: "DELETE" });
    setSessions(sessions.filter(s => s.id !== id));
    if(activeSessionId === id) setActiveSessionId(null);
  };

  const handleRenameSession = async () => {
    if(!sessionToEdit) return;
    await fetch(`http://localhost:8000/chat/sessions/${sessionToEdit}?title=${editTitle}`, { method: "PUT" });
    setSessions(sessions.map(s => s.id === sessionToEdit ? {...s, title: editTitle} : s));
    setIsRenameOpen(false);
  };

  // Reusable Session List Component
  const SessionList = () => (
    <div className="flex flex-col h-full">
        <Button className="w-full mb-4 bg-slate-900 hover:bg-slate-800" onClick={handleNewSession}>
            <Plus className="mr-2 h-4 w-4" /> New Chat
        </Button>
        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {sessions.map(session => (
                <div 
                    key={session.id} 
                    onClick={() => {
                        setActiveSessionId(session.id);
                        setIsMobileMenuOpen(false);
                    }}
                    className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer text-sm font-medium transition-all ${
                        activeSessionId === session.id 
                        ? "bg-blue-50 text-blue-700 border border-blue-100 shadow-sm" 
                        : "text-slate-600 hover:bg-slate-100 border border-transparent"
                    }`}
                >
                    <div className="flex items-center gap-3 overflow-hidden">
                        <MessageSquare size={16} className={activeSessionId === session.id ? "text-blue-500" : "text-slate-400"} />
                        <span className="truncate">{session.title}</span>
                    </div>
                    
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Edit2 size={14} className="text-slate-400 hover:text-blue-600 p-1 box-content" onClick={(e) => {
                            e.stopPropagation();
                            setSessionToEdit(session.id);
                            setEditTitle(session.title);
                            setIsRenameOpen(true);
                        }} />
                        <Trash2 size={14} className="text-slate-400 hover:text-red-600 p-1 box-content" onClick={(e) => handleDeleteSession(e, session.id)} />
                    </div>
                </div>
            ))}
        </div>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-6rem)] md:h-[calc(100vh-3rem)] gap-6">
      
      {/* --- DESKTOP SIDEBAR (Hidden on Mobile) --- */}
      <div className="hidden md:block w-72 shrink-0">
         <Card className="h-full p-4 border-slate-200 shadow-sm bg-white">
             <SessionList />
         </Card>
      </div>

      {/* --- MAIN CHAT AREA --- */}
      <Card className="flex-1 flex flex-col border-slate-200 shadow-sm overflow-hidden bg-white">
        
        {/* MOBILE HEADER (Visible only on Mobile) */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-100 bg-white sticky top-0 z-10">
            <div className="flex items-center gap-2">
                <Bot size={20} className="text-blue-600"/>
                <span className="font-bold text-slate-800">Co-Founder Chat</span>
            </div>
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <History size={20} className="text-slate-600" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80">
                    <SheetHeader className="mb-4 text-left">
                        <SheetTitle>Chat History</SheetTitle>
                    </SheetHeader>
                    <div className="h-full pb-6">
                        <SessionList />
                    </div>
                </SheetContent>
            </Sheet>
        </div>

        {!activeSessionId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/30">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                    <Bot size={32} className="text-slate-300" />
                </div>
                <p>Select a chat or start a new strategy session.</p>
                <Button className="mt-4 md:hidden" onClick={handleNewSession}>Start New Chat</Button>
            </div>
        ) : (
            <>
                <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/50">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                            {msg.role === "ai" && (
                                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0 shadow-sm mt-1">
                                    <Bot size={16} className="text-white" />
                                </div>
                            )}
                            
                            <div className={`px-5 py-3 rounded-2xl max-w-[85%] md:max-w-[75%] text-sm leading-relaxed shadow-sm ${
                                msg.role === "user" 
                                ? "bg-slate-900 text-white rounded-br-none" 
                                : "bg-white text-slate-700 border border-slate-200 rounded-bl-none prose prose-sm max-w-none"
                            }`}>
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </div>

                            {msg.role === "user" && (
                                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0 mt-1">
                                    <User size={16} className="text-slate-500" />
                                </div>
                            )}
                        </div>
                    ))}
                    {loading && (
                        <div className="flex gap-3 animate-pulse">
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0 opacity-50">
                                <Bot size={16} className="text-white" />
                            </div>
                            <div className="bg-slate-200 h-10 w-24 rounded-2xl rounded-bl-none"></div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-4 bg-white border-t border-slate-100">
                    <form onSubmit={handleSend} className="flex gap-3 max-w-4xl mx-auto">
                        <Input 
                            value={input} 
                            onChange={(e) => setInput(e.target.value)} 
                            placeholder="Ask strategy, marketing, or pricing questions..." 
                            className="flex-1 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                            disabled={loading} 
                        />
                        <Button type="submit" disabled={loading || !input.trim()} className="bg-blue-600 hover:bg-blue-700 w-12 px-0">
                            <Send size={18} />
                        </Button>
                    </form>
                </div>
            </>
        )}
      </Card>

      {/* Rename Dialog */}
      <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
        <DialogContent>
            <DialogHeader><DialogTitle>Rename Chat</DialogTitle></DialogHeader>
            <div className="flex gap-2 py-4">
                <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} />
                <Button onClick={handleRenameSession}>Save</Button>
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}