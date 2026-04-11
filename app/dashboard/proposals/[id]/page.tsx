// app\dashboard\proposals\[id]\page.tsx
"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Download } from "lucide-react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import dynamic from "next/dynamic";
import { ProposalPDF } from "@/components/ui/ProposalPDF";

const PDFDownloadLink = dynamic(
    () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
    { ssr: false, loading: () => <Button disabled>Loading PDF...</Button> }
);

export default function ProposalDetail({ params }: { params: Promise<{ id: string }> }){
    const router = useRouter();

    const { id } = use(params);
    const [proposal, setProposal] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [companyName, setCompanyName] = useState("FoundrKit User");
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState("");

    useEffect(() => {
        async function fetchData() {
            if (!id || id === "undefined") return;

            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: brand } = await supabase
                    .from("brand_settings")
                    .select("company_name")
                    .eq("user_id", user.id)
                    .single();
                if (brand) setCompanyName(brand.company_name);
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/proposals/detail/${id}`);
            const data = await response.json();
            setProposal(data);
            setEditContent(data.content);
            setLoading(false);
        }
        fetchData();
    }, [id]);

    const handleUpdate = async () => {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/proposals/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: editContent })
        });
        setProposal({ ...proposal, content: editContent });
        setIsEditing(false);
    };

    if (loading) return <div className="p-10 dark:text-slate-300">Loading Proposal...</div>;
    if (!proposal) return <div className="p-10 dark:text-slate-300">Proposal not found</div>;

    return (
        <div className="max-w-6xl mx-auto space-y-8">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 
                border-b border-slate-200 dark:border-slate-700 pb-6">

                <div className="flex items-start gap-4">
                    <Button
                        variant="ghost"
                        className="h-10 px-3 rounded-xl text-sm 
                        text-slate-700 dark:text-slate-300"
                        onClick={() => router.back()}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Proposals
                    </Button>

                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                            {proposal.client_name}
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl line-clamp-2">
                            {proposal.project_details}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="
                        px-4 py-2 rounded-xl text-xs font-bold tracking-wide
                        bg-amber-100 text-amber-800
                        dark:bg-amber-900/40 dark:text-amber-300
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
                        fileName={`${proposal.client_name}_Proposal.pdf`}
                    >
                        {({ loading }) => (
                            <Button
                                disabled={loading}
                                className="
                                    h-11 px-5 rounded-xl 
                                    bg-slate-900 text-white hover:bg-slate-800
                                    dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200
                                "
                            >
                                <Download className="mr-2 h-4 w-4" />
                                {loading ? "Generating..." : "Download PDF"}
                            </Button>
                        )}
                    </PDFDownloadLink>
                </div>
            </div>

            {/* MAIN GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* MAIN DOCUMENT */}
                <Card className="
                    lg:col-span-2 border border-slate-200 dark:border-slate-700 
                    rounded-2xl shadow-sm 
                    bg-white dark:bg-slate-900
                ">
                    <CardContent className="p-12">

                        {isEditing ? (
                            <div className="space-y-4">
                                <textarea
                                    className="
                                        w-full min-h-[520px] p-5 
                                        border border-slate-200 dark:border-slate-700 
                                        rounded-xl 
                                        bg-white dark:bg-slate-800 
                                        text-slate-900 dark:text-slate-100 
                                        font-mono text-sm
                                    "
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                />

                                <div className="flex justify-end gap-2">
                                    <Button
                                        variant="outline"
                                        className="
                                            rounded-xl 
                                            dark:border-slate-600 dark:text-slate-200
                                        "
                                        onClick={() => setIsEditing(false)}
                                    >
                                        Cancel
                                    </Button>

                                    <Button
                                        className="
                                            rounded-xl bg-slate-900 hover:bg-slate-800 
                                            text-white 
                                            dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200
                                        "
                                        onClick={handleUpdate}
                                    >
                                        Save Changes
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="
                                prose prose-slate max-w-none 
                                dark:prose-invert dark:text-slate-100
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
                    border border-slate-200 dark:border-slate-700 
                    rounded-2xl shadow-sm 
                    bg-white dark:bg-slate-900
                    h-fit
                ">
                    <CardContent className="p-6 space-y-6">

                        <div>
                            <h3 className="text-sm font-bold uppercase tracking-wide 
                            text-slate-500 dark:text-slate-400">
                                Document Metadata
                            </h3>
                        </div>

                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-500 dark:text-slate-400">Created</span>
                                <span className="font-medium dark:text-slate-200">
                                    {new Date(proposal.created_at).toLocaleDateString()}
                                </span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-slate-500 dark:text-slate-400">Format</span>
                                <span className="font-medium dark:text-slate-200">Markdown / PDF</span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-slate-500 dark:text-slate-400">Client</span>
                                <span className="font-medium dark:text-slate-200">
                                    {proposal.client_name}
                                </span>
                            </div>
                        </div>

                        <Button
                            variant="outline"
                            className="
                                w-full h-11 rounded-xl
                                dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800
                            "
                            onClick={() => setIsEditing(true)}
                        >
                            Edit Proposal
                        </Button>

                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
