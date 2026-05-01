"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Send,
  Bot,
  User,
  Plus,
  MessageSquare,
  Trash2,
  Edit2,
  History,
  Loader2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

// ✅ STRICT TYPESCRIPT INTERFACES
interface ChatSession {
  id: string;
  title: string;
  user_id?: string;
}

interface ChatMessage {
  role: "user" | "ai";
  content: string;
}

export default function AdvancedChat() {
  // States
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // UI States
  const [editTitle, setEditTitle] = useState("");
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [sessionToEdit, setSessionToEdit] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ✅ MEMOIZED API CALLS WITH CACHE BUSTING
  const fetchSessions = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/chat/sessions/${user.id}?t=${Date.now()}`,
        { cache: "no-store" }
      );
      
      if (!res.ok) throw new Error("Failed to fetch sessions");
      const data: ChatSession[] = await res.json();

      setSessions(data);
      if (!activeSessionId && data.length > 0) setActiveSessionId(data[0].id);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setInitialLoading(false);
    }
  }, [activeSessionId]);

  const fetchMessages = useCallback(async (sessionId: string) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/chat/messages/${sessionId}?t=${Date.now()}`,
        { cache: "no-store" }
      );
      if (!res.ok) throw new Error("Failed to fetch messages");
      
      const data: ChatMessage[] = await res.json();
      setMessages(data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  }, []);

  // UseEffects
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    if (activeSessionId) {
      fetchMessages(activeSessionId);
    }
  }, [activeSessionId, fetchMessages]);

  useEffect(() => {
    // Smooth scroll to bottom when messages update
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // ✅ ACTIONS
  const handleNewSession = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, title: "New Strategy Chat" }),
      });

      if (!res.ok) throw new Error("Failed to create session");
      const newSession: ChatSession = await res.json();

      setSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(newSession.id);
      setMessages([]);
      setIsMobileMenuOpen(false);
    } catch (error) {
      console.error("Error creating session:", error);
      alert("Failed to create a new chat.");
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || !activeSessionId) return;

    const userMsg = input.trim();
    setInput("");
    
    // Optimistic UI Update
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user?.id,
          session_id: activeSessionId,
          message: userMsg,
        }),
      });

      if (!res.ok) throw new Error("Failed to send message");

      // Refetch to get the AI's response
      await fetchMessages(activeSessionId);
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message. Please try again.");
      // Rollback optimistic update if failed
      setMessages((prev) => prev.filter((_, i) => i !== prev.length - 1));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Delete this chat?")) return;

    try {
      // Optimistic UI Removal
      setSessions((prev) => prev.filter((s) => s.id !== id));
      if (activeSessionId === id) setActiveSessionId(null);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/sessions/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete session");
    } catch (error) {
      console.error("Error deleting session:", error);
      // Restore if failed
      fetchSessions(); 
    }
  };

  const handleRenameSession = async () => {
    if (!sessionToEdit || !editTitle.trim()) return;

    try {
      // Optimistic UI Update
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionToEdit ? { ...s, title: editTitle } : s))
      );
      setIsRenameOpen(false);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/chat/sessions/${sessionToEdit}?title=${encodeURIComponent(editTitle)}`,
        { method: "PUT" }
      );

      if (!res.ok) throw new Error("Failed to rename session");
    } catch (error) {
      console.error("Error renaming session:", error);
      fetchSessions(); // Restore on failure
    }
  };

  // ✅ HELPER: Render Session List
  const renderSessionList = () => (
    <div className="flex flex-col h-full">
      <Button
        className="w-full mb-4 h-12 rounded-xl bg-slate-900 dark:bg-white dark:text-black shadow-lg transition-transform active:scale-95"
        onClick={handleNewSession}
      >
        <Plus className="mr-2 h-5 w-5" /> New Chat
      </Button>

      <div className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
        {sessions.map((session) => (
          <div
            key={session.id}
            onClick={() => {
              setActiveSessionId(session.id);
              setIsMobileMenuOpen(false);
            }}
            className={`group flex justify-between items-center p-3 
              rounded-xl cursor-pointer transition-all border 
              ${
                activeSessionId === session.id
                  ? "bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-700 shadow-sm"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border-transparent"
              }`}
          >
            <div className="flex items-center gap-2 truncate pr-2">
              <MessageSquare size={16} className="shrink-0 dark:text-slate-300" />
              <span className="truncate text-sm font-medium">{session.title}</span>
            </div>

            <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/50"
                onClick={(e) => {
                  e.stopPropagation();
                  setSessionToEdit(session.id);
                  setEditTitle(session.title);
                  setIsRenameOpen(true);
                }}
              >
                <Edit2 size={14} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50"
                onClick={(e) => handleDeleteSession(e, session.id)}
              >
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
        ))}
        {!initialLoading && sessions.length === 0 && (
          <p className="text-center text-xs text-slate-500 mt-4">No chats found.</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-6">

      {/* Desktop Sidebar */}
      <div className="hidden md:block w-80 shrink-0">
        <Card className="h-full p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm dark:bg-slate-900/50 flex flex-col">
          {renderSessionList()}
        </Card>
      </div>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden dark:bg-slate-900/50">

        {/* Mobile Header */}
        <div className="md:hidden flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 shrink-0">
          <div className="flex items-center gap-2 font-medium text-slate-800 dark:text-slate-100 text-sm">
            <Bot size={20} className="text-blue-600 dark:text-blue-400" />
            Co-Founder AI
          </div>

          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="text-slate-800 dark:text-slate-100 px-2">
                <History size={20} />
              </Button>
            </SheetTrigger>

            <SheetContent
              side="left"
              className="w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col"
            >
              <SheetHeader className="mb-4">
                <SheetTitle className="text-slate-700 dark:text-slate-200 text-left">
                  Chat History
                </SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-hidden">
                {renderSessionList()}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Chat Body */}
        {!activeSessionId ? (
          <div className="flex flex-col items-center justify-center flex-1 bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-500">
            {initialLoading ? (
               <Loader2 size={48} className="animate-spin text-blue-500 opacity-50" />
            ) : (
              <>
                <div className="h-20 w-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                  <Bot size={40} className="text-slate-300 dark:text-slate-600" />
                </div>
                <p className="text-sm font-medium">Select or create a new strategy chat</p>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-white dark:bg-slate-950 transition-colors custom-scrollbar">

              {messages.length === 0 && !loading && (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-70">
                  <MessageSquare size={32} className="mb-3" />
                  <p className="text-sm">This is the start of your conversation.</p>
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-3 max-w-[90%] md:max-w-[80%] ${
                    msg.role === "user" ? "ml-auto justify-end" : "mr-auto"
                  }`}
                >
                  {msg.role === "ai" && (
                    <div className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 flex items-center justify-center bg-blue-600 dark:bg-blue-500 text-white rounded-full shadow-sm mt-1">
                      <Bot size={16} />
                    </div>
                  )}

                  {/* 🛑 FIXED: Wrapped ReactMarkdown in a div with the prose classes */}
                  <div
                    className={`px-4 py-3 rounded-2xl text-sm shadow-sm break-words leading-relaxed overflow-hidden
                      ${
                        msg.role === "user"
                          ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-br-sm"
                          : "bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-800 rounded-bl-sm"
                      }`}
                  >
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-slate-800 prose-pre:text-slate-100 prose-pre:p-3 prose-pre:rounded-lg">
                      <ReactMarkdown>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  </div>

                  {msg.role === "user" && (
                    <div className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 flex items-center justify-center bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full shadow-sm mt-1">
                      <User size={16} />
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex gap-3 max-w-[80%] animate-pulse mr-auto">
                  <div className="w-9 h-9 shrink-0 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mt-1">
                    <Loader2 size={16} className="animate-spin text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="w-24 h-11 bg-slate-100 dark:bg-slate-800/80 rounded-2xl rounded-bl-sm border border-slate-100 dark:border-slate-800"></div>
                </div>
              )}

              <div ref={messagesEndRef} className="h-1" />
            </div>

            {/* Input Box */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
              <form
                onSubmit={handleSend}
                className="flex gap-3 max-w-4xl mx-auto items-end"
              >
                <div className="relative flex-1">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask Co-Founder AI anything..."
                    disabled={loading || !activeSessionId}
                    className="w-full h-12 pl-4 pr-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus-visible:ring-1 focus-visible:ring-blue-500"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading || !input.trim() || !activeSessionId}
                  className="h-12 w-12 shrink-0 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 rounded-xl shadow-sm transition-transform active:scale-95 disabled:opacity-50"
                >
                  <Send size={18} className={input.trim() && !loading ? "text-white" : "text-white/70"} />
                </Button>
              </form>
            </div>
          </>
        )}
      </Card>

      {/* Rename Dialog */}
      <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
        <DialogContent className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-800 dark:text-slate-200">
              Rename Chat
            </DialogTitle>
          </DialogHeader>
          <div className="flex gap-3 pt-4">
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Enter new chat name..."
              className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleRenameSession()}
            />
            <Button
              onClick={handleRenameSession}
              disabled={!editTitle.trim() || editTitle === sessions.find(s => s.id === sessionToEdit)?.title}
              className="bg-slate-900 dark:bg-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-200"
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}