"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Wand2, CheckCircle, Clock, Circle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function TaskManager() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  
  // AI Generator State
  const [aiGoal, setAiGoal] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);

  // 1. Fetch Tasks
  async function fetchTasks() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const res = await fetch(`http://localhost:8000/tasks/${user.id}`);
    const data = await res.json();
    setTasks(data);
    setLoading(false);
  }

  useEffect(() => { fetchTasks(); }, []);

  // 2. Add Manual Task
  const handleAddTask = async () => {
    if (!newTaskTitle) return;
    const { data: { user } } = await supabase.auth.getUser();
    
    await fetch("http://localhost:8000/tasks/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user?.id, title: newTaskTitle, status: "todo" })
    });
    setNewTaskTitle("");
    fetchTasks();
  };

  // 3. AI Auto-Plan
  const handleAiGenerate = async () => {
    setAiLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    // Get suggestions
    const res = await fetch("http://localhost:8000/tasks/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user?.id, goal: aiGoal })
    });
    const data = await res.json();
    
    // Add them to DB one by one
    for (const taskTitle of data.tasks) {
       await fetch("http://localhost:8000/tasks/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: user?.id, title: taskTitle, status: "todo" })
       });
    }
    
    setAiLoading(false);
    setIsAiOpen(false);
    fetchTasks();
  };

  // 4. Move Status
  const updateStatus = async (id: string, newStatus: string) => {
    // Optimistic Update (Update UI immediately)
    setTasks(tasks.map(t => t.id === id ? { ...t, status: newStatus } : t));
    await fetch(`http://localhost:8000/tasks/${id}?status=${newStatus}`, { method: "PUT" });
  };

  const handleDelete = async (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
    await fetch(`http://localhost:8000/tasks/${id}`, { method: "DELETE" });
  };

  // Helper to render a column
  const TaskColumn = ({ title, status, icon: Icon, color }: any) => (
    <div className="flex-1 min-w-[300px] bg-slate-50/50 rounded-xl p-4 border border-slate-100">
        <div className="flex items-center gap-2 mb-4">
            <Icon className={`w-5 h-5 ${color}`} />
            <h3 className="font-bold text-slate-700">{title}</h3>
            <span className="ml-auto text-xs font-bold bg-slate-200 px-2 py-1 rounded-full text-slate-600">
                {tasks.filter(t => t.status === status).length}
            </span>
        </div>
        <div className="space-y-3">
            {tasks.filter(t => t.status === status).map(task => (
                <Card key={task.id} className="cursor-grab hover:shadow-md transition-all group">
                    <CardContent className="p-4 flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-slate-800">{task.title}</p>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100" onClick={() => handleDelete(task.id)}>
                            <Trash2 size={14} />
                        </Button>
                    </CardContent>
                    {/* Simple Move Buttons */}
                    <div className="flex border-t border-slate-100 divide-x divide-slate-100">
                        {status !== 'todo' && (
                             <button onClick={() => updateStatus(task.id, 'todo')} className="flex-1 py-2 text-[10px] text-slate-500 hover:bg-slate-50 font-medium">To Do</button>
                        )}
                        {status !== 'in-progress' && (
                             <button onClick={() => updateStatus(task.id, 'in-progress')} className="flex-1 py-2 text-[10px] text-slate-500 hover:bg-slate-50 font-medium">In Progress</button>
                        )}
                        {status !== 'done' && (
                             <button onClick={() => updateStatus(task.id, 'done')} className="flex-1 py-2 text-[10px] text-slate-500 hover:bg-slate-50 font-medium">Done</button>
                        )}
                    </div>
                </Card>
            ))}
        </div>
    </div>
  );

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold text-slate-900">Task Board</h1>
            <p className="text-slate-600">Track your progress to launch.</p>
        </div>
        
        <div className="flex gap-2">
            <Dialog open={isAiOpen} onOpenChange={setIsAiOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" className="text-purple-600 border-purple-200 hover:bg-purple-50">
                        <Wand2 className="mr-2 h-4 w-4" /> AI Auto-Plan
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>What is your goal?</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Input placeholder="e.g. Launch a marketing campaign for Nike" value={aiGoal} onChange={e => setAiGoal(e.target.value)} />
                        <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={handleAiGenerate} disabled={aiLoading}>
                            {aiLoading ? "Generating Plan..." : "Generate Tasks"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
      </div>

      {/* Quick Add */}
      <div className="flex gap-2 max-w-md">
        <Input placeholder="Add a new task..." value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} />
        <Button onClick={handleAddTask}><Plus className="h-4 w-4" /></Button>
      </div>

      {/* Columns */}
      <div className="flex-1 flex gap-6 overflow-x-auto pb-4">
        <TaskColumn title="To Do" status="todo" icon={Circle} color="text-slate-400" />
        <TaskColumn title="In Progress" status="in-progress" icon={Clock} color="text-blue-500" />
        <TaskColumn title="Completed" status="done" icon={CheckCircle} color="text-green-500" />
      </div>
    </div>
  );
}