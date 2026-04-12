//app\dashboard\chat\page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { apiFetch } from "@/lib/api"; // ✅ Step 1: Import helper
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

export default function AdvancedChat() {
  const [userId, setUserId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [editTitle, setEditTitle] = useState("");
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [sessionToEdit, setSessionToEdit] = useState<string | null>(null);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const uid = user?.id ?? null;
      setUserId(uid);

      if (uid) {
        fetchSessions(uid);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (activeSessionId) fetchMessages(activeSessionId);
  }, [activeSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ✅ Step 2: Optimized fetchSessions
  const fetchSessions = async (uid?: string) => {
    const id = uid || userId;
    if (!id) return;

    try {
        const data = await apiFetch(`/chat/sessions/${id}`);
        setSessions(Array.isArray(data) ? data : []);
        if (!activeSessionId && data.length > 0) setActiveSessionId(data[0].id);
    } catch (error) {
        console.error("Failed to fetch sessions", error);
    }
  };

  // ✅ Step 3: Optimized fetchMessages
  const fetchMessages = async (sessionId: string) => {
    try {
        const data = await apiFetch(`/chat/messages/${sessionId}`);
        setMessages(Array.isArray(data) ? data : []);
    } catch (error) {
        console.error("Failed to fetch messages", error);
    }
  };

  // ✅ Step 4: Optimized handleNewSession
  const handleNewSession = async () => {
    if (!userId) return;

    try {
        const newSession = await apiFetch(`/chat/sessions`, {
            method: "POST",
            body: JSON.stringify({ user_id: userId, title: "New Strategy Chat" }),
        });

        setSessions([newSession, ...sessions]);
        setActiveSessionId(newSession.id);
        setMessages([]);
        setIsMobileMenuOpen(false);
    } catch (error) {
        alert("Failed to start new chat.");
    }
  };

  // ✅ Step 5: Optimized handleSend
  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || !activeSessionId || !userId) return;

    const userMsg = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
        await apiFetch(`/chat/send`, {
            method: "POST",
            body: JSON.stringify({
                user_id: userId,
                session_id: activeSessionId,
                message: userMsg,
            }),
        });
        await fetchMessages(activeSessionId);
    } catch (error) {
        alert("AI failed to respond.");
    } finally {
        setLoading(false);
    }
  };

  // ✅ Step 6: Optimized Delete
  const handleDeleteSession = async (e: any, id: string) => {
    e.stopPropagation();
    if (!confirm("Delete this chat?")) return;

    try {
        await apiFetch(`/chat/sessions/${id}`, { method: "DELETE" });
        setSessions(sessions.filter((s) => s.id !== id));
        if (activeSessionId === id) setActiveSessionId(null);
    } catch (error) {
        alert("Delete failed.");
    }
  };

  // ✅ Step 7: Optimized Rename (Sends JSON body to match backend fix)
  const handleRenameSession = async () => {
    if (!sessionToEdit) return;

    try {
        await apiFetch(`/chat/sessions/${sessionToEdit}`, { 
            method: "PUT",
            body: JSON.stringify({ title: editTitle }) 
        });

        setSessions(
            sessions.map((s) =>
                s.id === sessionToEdit ? { ...s, title: editTitle } : s
            )
        );
        setIsRenameOpen(false);
    } catch (error) {
        alert("Rename failed.");
    }
  };

  const SessionList = () => (
    <div className="flex flex-col h-full">
      <Button
        className="w-full mb-4 h-12 rounded-xl bg-slate-900 dark:bg-white dark:text-black shadow-lg"
        onClick={handleNewSession}
      >
        <Plus className="mr-2 h-5 w-5" /> New Chat
      </Button>

      <div className="flex-1 space-y-2 overflow-y-auto pr-2">
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
                  ? "bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-700 shadow-md"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border-transparent"
              }`}
          >
            <div className="flex items-center gap-2 truncate">
              <MessageSquare size={16} className="dark:text-slate-300" />
              <span className="truncate">{session.title}</span>
            </div>

            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
              <Edit2
                size={14}
                className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
                onClick={(e) => {
                  e.stopPropagation();
                  setSessionToEdit(session.id);
                  setEditTitle(session.title);
                  setIsRenameOpen(true);
                }}
              />
              <Trash2
                size={14}
                className="text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                onClick={(e) => handleDeleteSession(e, session.id)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-6">
      <div className="hidden md:block w-80">
        <Card className="h-full p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl dark:bg-slate-900/50">
          <SessionList />
        </Card>
      </div>

      <Card className="flex-1 flex flex-col rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden dark:bg-slate-900/50">
        <div className="md:hidden flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70">
          <div className="flex items-center gap-2 font-medium text-slate-800 dark:text-slate-100 text-xs sm:text-sm">
            <Bot size={18} className="text-blue-600 dark:text-blue-400" />
            Co-Founder AI
          </div>

          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" className="text-slate-800 dark:text-slate-100">
                <History size={20} />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
              <SheetHeader><SheetTitle className="text-slate-700 dark:text-slate-200">History</SheetTitle></SheetHeader>
              <SessionList />
            </SheetContent>
          </Sheet>
        </div>

        {!activeSessionId ? (
          <div className="flex flex-col items-center justify-center flex-1 bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-500">
            <Bot size={48} />
            <p className="mt-4 text-sm">Start a new intelligent session</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 bg-white dark:bg-slate-950 transition-colors">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                  {msg.role === "ai" && (
                    <div className="w-9 h-9 flex items-center justify-center bg-blue-600 dark:bg-blue-500 text-white rounded-full shadow-md">
                      <Bot size={16} />
                    </div>
                  )}
                  <div className={`px-4 py-2 rounded-2xl text-xs sm:text-sm max-w-[80%] shadow-md ${
                        msg.role === "user"
                          ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-br-none"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-none"
                      }`}>
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                  {msg.role === "user" && (
                    <div className="w-9 h-9 flex items-center justify-center bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-200 rounded-full shadow-md">
                      <User size={16} />
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex gap-3 animate-pulse">
                  <div className="w-9 h-9 rounded-full bg-blue-600 dark:bg-blue-400"></div>
                  <div className="w-24 h-10 bg-slate-200 dark:bg-slate-700 rounded-2xl"></div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <form onSubmit={handleSend} className="flex gap-3 max-w-4xl mx-auto">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask anything..."
                  disabled={loading}
                  className="flex-1 h-10 sm:h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
                <Button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="h-12 w-12 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 rounded-xl"
                >
                  <Send size={18} />
                </Button>
              </form>
            </div>
          </>
        )}
      </Card>

      <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
        <DialogContent className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <DialogHeader><DialogTitle className="text-slate-800 dark:text-slate-200">Rename Chat</DialogTitle></DialogHeader>
          <div className="flex gap-2 pt-4">
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700"
            />
            <Button onClick={handleRenameSession} className="bg-slate-900 dark:bg-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-200">Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}