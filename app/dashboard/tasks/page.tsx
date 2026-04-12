//app\dashboard\tasks\page.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { apiFetch } from "@/lib/api"; // ✅ Step 1: Import the helper
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Trash2,
  Wand2,
  CheckCircle,
  Clock,
  Circle
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";

export default function TaskManager() {
  const [userId, setUserId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [aiGoal, setAiGoal] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);

  // ✅ Step 2: Optimized fetchTasks
  const fetchTasks = async (uid?: string) => {
    const id = uid || userId;
    if (!id) return;

    try {
        const data = await apiFetch(`/tasks/${id}`);
        setTasks(Array.isArray(data) ? data : []);
    } catch (error) {
        console.error("Failed to fetch tasks:", error);
    }
  };

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const uid = user?.id ?? null;
      setUserId(uid);

      if (uid) {
        fetchTasks(uid);
      }
    };
    init();
  }, []);

  // ✅ Step 3: Optimized Add Task
  const handleAddTask = async () => {
    if (!newTaskTitle || !userId) return;

    try {
        await apiFetch(`/tasks/add`, {
            method: "POST",
            body: JSON.stringify({
                user_id: userId,
                title: newTaskTitle,
                status: "todo"
            })
        });
        setNewTaskTitle("");
        fetchTasks();
    } catch (error) {
        alert("Failed to add task.");
    }
  };

  // ✅ Step 4: VERY IMPORTANT⚡ Optimized AI Generation (Bulk Add)
  const handleAiGenerate = async () => {
    if (!userId) return;

    setAiLoading(true);
    try {
        // 1. Generate the task list via AI
        const res = await apiFetch(`/tasks/generate`, {
            method: "POST",
            body: JSON.stringify({
                user_id: userId,
                goal: aiGoal
            })
        });

        // 2. Save all tasks at once using the bulk-add endpoint
        if (res.tasks && res.tasks.length > 0) {
            await apiFetch(`/tasks/bulk-add`, {
                method: "POST",
                body: JSON.stringify({
                    user_id: userId,
                    tasks: res.tasks // Array of strings
                })
            });
        }

        setAiLoading(false);
        setIsAiOpen(false);
        setAiGoal("");
        fetchTasks();
    } catch (error) {
        console.error(error);
        alert("AI Generation failed.");
        setAiLoading(false);
    }
  };

  // ✅ Step 5: Optimized Update Status
  const updateStatus = async (id: string, newStatus: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, status: newStatus } : t));
    try {
        await apiFetch(`/tasks/${id}?status=${newStatus}`, { method: "PUT" });
    } catch (error) {
        fetchTasks(); // Rollback on failure
    }
  };

  // ✅ Step 6: Optimized Delete
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this task?")) return;
    setTasks(tasks.filter(t => t.id !== id));
    try {
        await apiFetch(`/tasks/${id}`, { method: "DELETE" });
    } catch (error) {
        fetchTasks(); // Rollback on failure
    }
  };

  return (
    <div className="space-y-10 h-full flex flex-col max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Task Board
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
            AI-powered productivity engine
          </p>
        </div>

        {/* AI Generator */}
        <Dialog open={isAiOpen} onOpenChange={setIsAiOpen}>
          <DialogTrigger asChild>
            <Button className="h-12 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg dark:shadow-purple-900/20">
              <Wand2 className="mr-2 h-5 w-5" />
              AI Task Generator
            </Button>
          </DialogTrigger>

          <DialogContent className="rounded-3xl p-0 overflow-hidden bg-white dark:bg-slate-900 dark:border-slate-700">
            <DialogHeader className="p-6 border-b bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
              <DialogTitle className="text-lg font-semibold">
                Smart Task Generator
              </DialogTitle>
            </DialogHeader>

            <div className="p-6 space-y-5">
              <Input
                placeholder="Describe your goal (e.g. Build a landing page)..."
                value={aiGoal}
                onChange={(e) => setAiGoal(e.target.value)}
                className="h-12 rounded-xl bg-white dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700"
              />

              <Button
                onClick={handleAiGenerate}
                disabled={aiLoading || !aiGoal.trim()}
                className="w-full h-12 rounded-xl bg-purple-600 hover:bg-purple-700 text-white"
              >
                {aiLoading ? "Generating Tasks…" : "Generate Tasks"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Add */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row gap-3 max-w-2xl">
        <Input
          placeholder="Add a high priority task..."
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
          className="h-12 rounded-xl bg-white dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700"
        />
        <Button
          onClick={handleAddTask}
          disabled={!newTaskTitle.trim()}
          className="h-12 px-6 rounded-xl bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-300 text-white shadow-md"
        >
          <Plus className="mr-1 h-5 w-5" />
          Add Task
        </Button>
      </div>

      {/* Board */}
      <div className="flex-1 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 p-4 rounded-3xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">

          {[
            { title: "To Do", status: "todo", Icon: Circle, color: "text-slate-400" },
            { title: "In Progress", status: "in-progress", Icon: Clock, color: "text-blue-600" },
            { title: "Completed", status: "done", Icon: CheckCircle, color: "text-green-600" }
          ].map(({ title, status, Icon, color }) => (
            <div
              key={status}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-3xl p-5 shadow-lg"
            >
              {/* Column Header */}
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-700 mb-4">
                <Icon className={`h-5 w-5 ${color}`} />
                <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-lg">
                  {title}
                </h3>
                <span className="ml-auto text-xs font-bold bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-slate-600 dark:text-slate-300">
                  {tasks.filter(t => t.status === status).length}
                </span>
              </div>

              {/* Tasks */}
              <div className="space-y-4 flex-1">
                {tasks.filter(t => t.status === status).map(task => (
                  <Card
                    key={task.id}
                    className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl hover:shadow-xl transition-all duration-300"
                  >
                    <CardContent className="p-4 flex flex-col gap-4">

                      <div className="flex justify-between">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-snug">
                          {task.title}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(task.id)}
                          className="h-7 w-7 text-slate-300 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>

                      {/* Status Buttons */}
                      <div className="flex gap-1">
                        {status !== "todo" && (
                          <button
                            onClick={() => updateStatus(task.id, "todo")}
                            className="flex-1 py-2 text-[11px] rounded-lg bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium"
                          >
                            To Do
                          </button>
                        )}

                        {status !== "in-progress" && (
                          <button
                            onClick={() => updateStatus(task.id, "in-progress")}
                            className="flex-1 py-2 text-[11px] rounded-lg bg-blue-50 dark:bg-blue-900 hover:bg-blue-100 dark:hover:bg-blue-800 text-blue-600 dark:text-blue-300 font-medium"
                          >
                            In Progress
                          </button>
                        )}

                        {status !== "done" && (
                          <button
                            onClick={() => updateStatus(task.id, "done")}
                            className="flex-1 py-2 text-[11px] rounded-lg bg-green-50 dark:bg-green-900 hover:bg-green-100 dark:hover:bg-green-800 text-green-600 dark:text-green-300 font-medium"
                          >
                            Done
                          </button>
                        )}
                      </div>

                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}

        </div>
      </div>

    </div>
  );
}