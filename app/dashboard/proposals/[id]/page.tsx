"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Download, Loader2, Calendar, FileText, User } from "lucide-react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import dynamic from "next/dynamic";
import { ProposalPDF } from "@/components/ui/ProposalPDF";
import { Skeleton } from "@/components/ui/skeleton";

// ✅ DYNAMIC IMPORT FOR PDF
const PDFDownloadLink = dynamic(
    () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
    { ssr: false, loading: () => <Button disabled className="h-11 px-5 rounded-xl"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Preparing PDF...</Button> }
);

// ✅ TYPESCRIPT INTERFACE
interface Proposal {
    id: string;
    client_name: string;
    project_details: string;
    status: string;
    content: string;
    created_at: string;
}

export default function ProposalDetail({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);
    
    // States
    const [proposal, setProposal] = useState<Proposal | null>(null);
    const [loading, setLoading] = useState(true);
    const [companyName, setCompanyName] = useState("FoundrKit User");
    
    // Edit States
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // ✅ FETCH DATA WITH CACHE BUSTING
    useEffect(() => {
        async function fetchData() {
            if (!id || id === "undefined") return;

            try {
                // 1. Fetch Company Name
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: brand } = await supabase
                        .from("brand_settings")
                        .select("company_name")
                        .eq("user_id", user.id)
                        .single();
                    if (brand?.company_name) setCompanyName(brand.company_name);
                }

                // 2. Fetch Proposal
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/proposals/detail/${id}?t=${Date.now()}`,
                    { cache: "no-store" }
                );
                
                if (!response.ok) throw new Error("Failed to fetch proposal");
                
                const data: Proposal = await response.json();
                setProposal(data);
                setEditContent(data.content);
            } catch (error) {
                console.error("Error fetching proposal:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [id]);

    // ✅ UPDATE LOGIC
    const handleUpdate = async () => {
        if (!proposal) return;
        setIsSaving(true);
        
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/proposals/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: editContent })
            });
            
            if (!res.ok) throw new Error("Failed to update proposal");

            setProposal({ ...proposal, content: editContent });
            setIsEditing(false);
        } catch (error) {
            console.error("Error updating proposal:", error);
            alert("Failed to save changes. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    // ✅ SKELETON LOADING UI
    if (loading) {
        return (
            <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
                    <div className="space-y-3">
                        <Skeleton className="h-10 w-32 rounded-xl dark:bg-slate-800" />
                        <Skeleton className="h-8 w-64 dark:bg-slate-800" />
                        <Skeleton className="h-4 w-96 dark:bg-slate-800" />
                    </div>
                    <div className="flex gap-2">
                        <Skeleton className="h-10 w-24 rounded-xl dark:bg-slate-800" />
                        <Skeleton className="h-10 w-36 rounded-xl dark:bg-slate-800" />
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Skeleton className="lg:col-span-2 h-[600px] rounded-2xl dark:bg-slate-800" />
                    <Skeleton className="h-[300px] rounded-2xl dark:bg-slate-800" />
                </div>
            </div>
        );
    }

    // ✅ NOT FOUND UI
    if (!proposal) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <FileText className="h-16 w-16 text-slate-300 dark:text-slate-700 mb-4" />
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Proposal not found</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-2 mb-6">This proposal may have been deleted or doesn't exist.</p>
                <Button onClick={() => router.back()} variant="outline">Go Back</Button>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 
                border-b border-slate-200 dark:border-slate-800 pb-6">

                <div className="flex items-start gap-4 flex-1">
                    <Button
                        variant="ghost"
                        className="h-9 px-3 rounded-xl text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 mt-1 shrink-0"
                        onClick={() => router.back()}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>

                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
                            {proposal.client_name}
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-2xl leading-relaxed">
                            {proposal.project_details}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 mt-4 md:mt-0">
                    <span className="
                        px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider uppercase
                        bg-amber-50 text-amber-600 border border-amber-200
                        dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20
                    ">
                        {proposal.status}
                    </span>

                    <PDFDownloadLink
                        document={
                            <ProposalPDF
                                content={proposal.content}
                                companyName={companyName}
                                clientName={proposal.client_name}
                            />
                        }
                        fileName={`${proposal.client_name.replace(/\s+/g, '_')}_Proposal.pdf`}
                    >
                        {({ loading: pdfLoading }) => (
                            <Button
                                disabled={pdfLoading || isEditing}
                                className="
                                    h-11 px-5 rounded-xl shadow-sm
                                    bg-slate-900 text-white hover:bg-slate-800
                                    dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 transition-all active:scale-95
                                "
                            >
                                {pdfLoading ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
                                ) : (
                                    <><Download className="mr-2 h-4 w-4" /> Download PDF</>
                                )}
                            </Button>
                        )}
                    </PDFDownloadLink>
                </div>
            </div>

            {/* MAIN GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                {/* MAIN DOCUMENT */}
                <Card className="
                    lg:col-span-2 border border-slate-200 dark:border-slate-800 
                    rounded-2xl shadow-sm overflow-hidden
                    bg-white dark:bg-slate-900/50
                ">
                    <CardContent className="p-6 md:p-12">

                        {isEditing ? (
                            <div className="space-y-4 animate-in fade-in duration-300">
                                <textarea
                                    className="
                                        w-full min-h-[600px] p-6 
                                        border border-slate-200 dark:border-slate-700 
                                        rounded-xl 
                                        bg-slate-50 dark:bg-slate-950 
                                        text-slate-900 dark:text-slate-100 
                                        font-mono text-sm leading-relaxed
                                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
                                        resize-y
                                    "
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    disabled={isSaving}
                                />

                                <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                                    <Button
                                        variant="outline"
                                        className="rounded-xl dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                                        onClick={() => {
                                            setEditContent(proposal.content); // Reset on cancel
                                            setIsEditing(false);
                                        }}
                                        disabled={isSaving}
                                    >
                                        Cancel
                                    </Button>

                                    <Button
                                        className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
                                        onClick={handleUpdate}
                                        disabled={isSaving || !editContent.trim()}
                                    >
                                        {isSaving ? (
                                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                                        ) : (
                                            "Save Changes"
                                        )}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="
                                prose prose-slate max-w-none 
                                dark:prose-invert dark:text-slate-200 
                                prose-headings:font-bold prose-headings:tracking-tight
                                prose-p:leading-relaxed prose-a:text-blue-600
                                prose-li:marker:text-slate-400
                                animate-in fade-in duration-300
                            ">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {proposal.content}
                                </ReactMarkdown>
                            </div>
                        )}

                    </CardContent>
                </Card>

                {/* RIGHT SIDEBAR */}
                <Card className="
                    border border-slate-200 dark:border-slate-800 
                    rounded-2xl shadow-sm 
                    bg-white dark:bg-slate-900/50
                    sticky top-6
                ">
                    <CardContent className="p-6 space-y-6">

                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider 
                            text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-3">
                                Document Metadata
                            </h3>
                        </div>

                        <div className="space-y-5 text-sm">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center text-slate-500 dark:text-slate-400">
                                    <Calendar className="mr-2 h-4 w-4" /> Created
                                </div>
                                <span className="font-medium text-slate-900 dark:text-slate-200">
                                    {new Date(proposal.created_at).toLocaleDateString(undefined, {
                                        month: 'short', day: 'numeric', year: 'numeric'
                                    })}
                                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center text-slate-500 dark:text-slate-400">
                                    <FileText className="mr-2 h-4 w-4" /> Format
                                </div>
                                <span className="font-medium text-slate-900 dark:text-slate-200">
                                    Markdown / PDF
                                </span>
                            </div>

                            <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex items-center text-slate-500 dark:text-slate-400">
                                    <User className="mr-2 h-4 w-4" /> Client
                                </div>
                                <span className="font-medium text-slate-900 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">
                                    {proposal.client_name}
                                </span>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                            <Button
                                variant="outline"
                                className={`w-full h-11 rounded-xl transition-colors ${
                                    isEditing 
                                        ? "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800" 
                                        : "dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                                }`}
                                onClick={() => setIsEditing(!isEditing)}
                                disabled={isSaving}
                            >
                                {isEditing ? "Close Editor" : "Edit Proposal"}
                            </Button>
                        </div>

                    </CardContent>
                </Card>

            </div>
        </div>
    );
}