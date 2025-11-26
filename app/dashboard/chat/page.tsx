"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, Bot, User, Plus, MessageSquare, Trash2, Edit2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageLoader } from "@/components/PageLoader";

export default function AdvancedChat() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [editTitle, setEditTitle] = useState("");
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [sessionToEdit, setSessionToEdit] = useState<string | null>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (activeSessionId) fetchMessages(activeSessionId);
  }, [activeSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const fetchSessions = async () => {
    try {
      setPageLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const res = await fetch(`http://localhost:8000/chat/sessions/${user.id}`);
      const data = await res.json();

      setSessions(data);
      if (!activeSessionId && data.length > 0) {
        setActiveSessionId(data[0].id);
      }
    } finally {
      setPageLoading(false);
    }
  };

  const fetchMessages = async (sessionId: string) => {
    setMessagesLoading(true);
    const res = await fetch(`http://localhost:8000/chat/messages/${sessionId}`);
    const data = await res.json();
    setMessages(data);
    setMessagesLoading(false);
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
    if (!confirm("Delete this chat history?")) return;

    await fetch(`http://localhost:8000/chat/sessions/${id}`, { method: "DELETE" });

    setSessions(sessions.filter(s => s.id !== id));
    if (activeSessionId === id) setActiveSessionId(null);
  };

  const handleRenameSession = async () => {
    if (!sessionToEdit) return;

    await fetch(`http://localhost:8000/chat/sessions/${sessionToEdit}?title=${editTitle}`, {
      method: "PUT"
    });

    setSessions(
      sessions.map(s =>
        s.id === sessionToEdit ? { ...s, title: editTitle } : s
      )
    );

    setIsRenameOpen(false);
  };

  if (pageLoading) return <PageLoader />;

  return (
    <div className="flex h-[calc(100vh-100px)] gap-4">
      {/* LEFT SIDEBAR */}
      <Card className="w-64 flex flex-col border-slate-200 bg-white">
        <div className="p-4 border-b border-slate-100">
          <Button className="w-full" onClick={handleNewSession}>
            <Plus className="mr-2 h-4 w-4" /> New Chat
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions.map(session => (
            <div
              key={session.id}
              onClick={() => setActiveSessionId(session.id)}
              className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer text-sm font-medium transition-colors ${
                activeSessionId === session.id
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <MessageSquare size={16} />
                <span className="truncate">{session.title}</span>
              </div>

              <div className="hidden group-hover:flex gap-1">
                <Edit2
                  size={14}
                  className="text-slate-400 hover:text-blue-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSessionToEdit(session.id);
                    setEditTitle(session.title);
                    setIsRenameOpen(true);
                  }}
                />
                <Trash2
                  size={14}
                  className="text-slate-400 hover:text-red-600"
                  onClick={(e) => handleDeleteSession(e, session.id)}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* RIGHT MAIN CHAT */}
      <Card className="flex-1 flex flex-col border-slate-200 shadow-sm overflow-hidden">
        {!activeSessionId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <Bot size={64} className="mb-4 opacity-20" />
            <p>Select a chat or start a new one.</p>
          </div>
        ) : (
          <>
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/50">
              {/* ✅ Message Skeleton Loader */}
              {messagesLoading && (
                <>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-2 w-full">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* ✅ Real Messages */}
              {!messagesLoading && messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role === "ai" && (
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <Bot size={18} className="text-blue-600" />
                    </div>
                  )}

                  <div
                    className={`p-4 rounded-2xl max-w-[80%] text-sm leading-relaxed shadow-sm ${
                      msg.role === "user"
                        ? "bg-slate-900 text-white rounded-br-none"
                        : "bg-white text-slate-700 border border-slate-200 rounded-bl-none"
                    }`}
                  >
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>

                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                      <User size={18} className="text-slate-600" />
                    </div>
                  )}
                </div>
              ))}

              {/* ✅ AI Typing Animation */}
              {loading && (
                <div className="flex gap-3 items-center">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <Bot size={18} className="text-blue-600" />
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2 flex gap-1">
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100" />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </CardContent>

            {/* INPUT */}
            <div className="p-4 bg-white border-t border-slate-100">
              <form onSubmit={handleSend} className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  disabled={loading}
                />
                <Button type="submit" disabled={loading}>
                  <Send size={18} />
                </Button>
              </form>
            </div>
          </>
        )}
      </Card>

      {/* RENAME DIALOG */}
      <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Chat</DialogTitle>
          </DialogHeader>

          <div className="flex gap-2 py-4">
            <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} />
            <Button onClick={handleRenameSession}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
