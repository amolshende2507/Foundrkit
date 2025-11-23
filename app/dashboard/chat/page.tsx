"use client";

import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Send, Bot, User } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "ai";
  text: string;
}

export default function CoFounderChat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", text: "Hey! I'm ready to work. What's on your mind?" }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const userMessage = input;
    setInput(""); // Clear input
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const response = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          message: userMessage,
        }),
      });

      const data = await response.json();
      
      setMessages((prev) => [...prev, { role: "ai", text: data.reply }]);

    } catch (error) {
      setMessages((prev) => [...prev, { role: "ai", text: "I lost connection. Try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-100px)] flex flex-col">
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-slate-900">Co-Founder Chat</h1>
        <p className="text-slate-600">Brainstorm strategy with your AI partner.</p>
      </div>

      {/* Chat Window */}
      <Card className="flex-1 flex flex-col overflow-hidden border-slate-200 shadow-sm">
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex gap-3 ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {/* Icon for AI */}
              {msg.role === "ai" && (
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <Bot size={18} className="text-blue-600" />
                </div>
              )}

              {/* Message Bubble */}
              <div
                className={`p-4 rounded-2xl max-w-[80%] text-sm leading-relaxed shadow-sm ${
                  msg.role === "user"
                    ? "bg-slate-900 text-white rounded-br-none"
                    : "bg-white text-slate-700 border border-slate-200 rounded-bl-none"
                }`}
              >
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>

              {/* Icon for User */}
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                  <User size={18} className="text-slate-600" />
                </div>
              )}
            </div>
          ))}
          
          {loading && (
            <div className="flex gap-3">
               <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Bot size={18} className="text-blue-600" />
               </div>
               <div className="p-4 bg-white border border-slate-200 rounded-2xl rounded-bl-none">
                  <span className="animate-pulse">Thinking...</span>
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </CardContent>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-100">
          <form onSubmit={handleSend} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about strategy, pricing, or marketing..."
              className="flex-1"
              disabled={loading}
            />
            <Button type="submit" disabled={loading || !input.trim()}>
              <Send size={18} />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}