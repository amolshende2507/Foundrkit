"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Wand2, CheckCircle, Clock, Circle, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Task {
  id: string;
  title: string;
  status: "todo" | "in-progress" | "done";
}

export default function TaskManager() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [aiGoal, setAiGoal] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);

  // ✅ FETCH TASKS (CACHE BUSTED)
  const fetchTasks = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks/${user.id}?t=${Date.now()}`, { cache: "no-store" });
      const data: Task[] = await res.json();
      setTasks(data);
    } catch (e) {
      console.error("Failed to fetch tasks", e);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // ✅ ADD TASK
  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    const title = newTaskTitle;
    setNewTaskTitle("");

    const { data: { user } } = await supabase.auth.getUser();
    
    // Optimistic Update
    const tempTask: Task = { id: Date.now().toString(), title, status: "todo" };
    setTasks(prev => [...prev, tempTask]);

    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user?.id, title, status: "todo" })
    });
    fetchTasks();
  };

  // ✅ AI GENERATE
  const handleAiGenerate = async () => {
    if (!aiGoal.trim()) return;
    setAiLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user?.id, goal: aiGoal })
      });
      const data = await res.json();

      for (const t of data.tasks) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks/add`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: user?.id, title: t, status: "todo" })
        });
      }
      setIsAiOpen(false);
      setAiGoal("");
      fetchTasks();
    } catch (e) {
      alert("AI Generation failed.");
    } finally {
      setAiLoading(false);
    }
  };

  // ✅ OPTIMISTIC STATUS UPDATE
  const updateStatus = async (id: string, newStatus: Task["status"]) => {
    const originalTasks = [...tasks];
    setTasks(tasks.map(t => t.id === id ? { ...t, status: newStatus } : t));
    
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks/${id}?status=${newStatus}`, { method: "PUT" });
    } catch (e) {
      setTasks(originalTasks);
    }
  };

  // ✅ OPTIMISTIC DELETE
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this task?")) return;
    const originalTasks = [...tasks];
    setTasks(tasks.filter(t => t.id !== id));
    
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks/${id}`, { method: "DELETE" });
    } catch (e) {
      setTasks(originalTasks);
    }
  };

  return (
    <div className="space-y-10 h-full flex flex-col max-w-7xl mx-auto animate-in fade-in duration-500">
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Task Board</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">AI-powered productivity engine</p>
        </div>

        <Dialog open={isAiOpen} onOpenChange={setIsAiOpen}>
          <DialogTrigger asChild>
            <Button className="h-12 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-purple-500/20">
              <Wand2 className="mr-2 h-5 w-5" /> AI Task Generator
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-3xl p-0 overflow-hidden dark:border-slate-800">
            <DialogHeader className="p-6 border-b dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <DialogTitle>Smart Task Generator</DialogTitle>
            </DialogHeader>
            <div className="p-6 space-y-5">
              <Textarea
                placeholder="What project are you working on? (e.g. Launching a new website)"
                value={aiGoal}
                onChange={(e) => setAiGoal(e.target.value)}
                className="h-32 rounded-xl dark:bg-slate-800"
              />
              <Button onClick={handleAiGenerate} disabled={aiLoading} className="w-full h-12 rounded-xl">
                {aiLoading ? <Loader2 className="animate-spin h-5 w-5" /> : "Generate Tasks"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex gap-3 max-w-2xl">
        <Input
          placeholder="Add a high priority task..."
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          className="h-12 rounded-xl"
        />
        <Button onClick={handleAddTask} className="h-12 px-6 rounded-xl bg-slate-900 hover:bg-slate-800">
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
        {[
          { title: "To Do", status: "todo", Icon: Circle, color: "text-slate-400" },
          { title: "In Progress", status: "in-progress", Icon: Clock, color: "text-blue-500" },
          { title: "Completed", status: "done", Icon: CheckCircle, color: "text-emerald-500" }
        ].map(({ title, status, Icon, color }) => (
          <div key={status} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm min-h-[500px]">
            <div className="flex items-center gap-3 pb-4 border-b dark:border-slate-800 mb-4">
              <Icon className={`h-5 w-5 ${color}`} />
              <h3 className="font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
              <span className="ml-auto text-xs font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                {tasks.filter(t => t.status === status).length}
              </span>
            </div>
            
            <div className="space-y-3">
              {tasks.filter(t => t.status === status).map(task => (
                <Card key={task.id} className="border dark:border-slate-800 rounded-2xl shadow-none hover:shadow-sm transition-all">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{task.title}</p>
                      <button onClick={() => handleDelete(task.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={14}/></button>
                    </div>
                    <div className="flex gap-1">
                      {status !== "todo" && <button onClick={() => updateStatus(task.id, "todo")} className="flex-1 text-[10px] uppercase font-bold py-1.5 rounded bg-slate-100 dark:bg-slate-800">To Do</button>}
                      {status !== "in-progress" && <button onClick={() => updateStatus(task.id, "in-progress")} className="flex-1 text-[10px] uppercase font-bold py-1.5 rounded bg-blue-50 text-blue-600 dark:bg-blue-950">Doing</button>}
                      {status !== "done" && <button onClick={() => updateStatus(task.id, "done")} className="flex-1 text-[10px] uppercase font-bold py-1.5 rounded bg-emerald-50 text-emerald-600 dark:bg-emerald-950">Done</button>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}