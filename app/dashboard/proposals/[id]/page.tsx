"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Download, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import dynamic from "next/dynamic";
import { ProposalPDF } from "@/components/ui/ProposalPDF";

// Dynamic Import for PDF Download
const PDFDownloadLink = dynamic(
    () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
    { ssr: false, loading: () => <Button disabled>Loading PDF...</Button> }
);

export default function ProposalDetail({ params }: { params: { id: string } }) {
    const router = useRouter();

    // 1. UNWRAP PARAMS (The Fix for Next.js 15)
    const { id } = use(params);
    const [proposal, setProposal] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [companyName, setCompanyName] = useState("FoundrKit User");
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState("");

    useEffect(() => {
        async function fetchData() {
            // 1. Get User & Company Info (for the PDF Header)
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

            // 2. Get Proposal Detail from Backend
            const response = await fetch(`http://localhost:8000/proposals/detail/${id}`);
            const data = await response.json();
            setProposal(data);
            setEditContent(data.content);
            setLoading(false);
        }
        fetchData();
    }, [id]);
    const handleUpdate = async () => {
        await fetch(`http://localhost:8000/proposals/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: editContent })
        });
        setProposal({ ...proposal, content: editContent }); // Update local view
        setIsEditing(false); // Turn off edit mode
    };

    if (loading) return <div className="p-10">Loading Proposal...</div>;
    if (!proposal) return <div className="p-10">Proposal not found</div>;

    return (
        <div className="max-w-6xl mx-auto space-y-8">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-6">

                {/* Left */}
                <div className="flex items-start gap-4">
                    <Button
                        variant="ghost"
                        className="h-10 px-3 rounded-xl text-sm"
                        onClick={() => router.back()}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Proposals
                    </Button>

                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                            {proposal.client_name}
                        </h1>
                        <p className="text-sm text-slate-500 mt-1 max-w-2xl line-clamp-2">
                            {proposal.project_details}
                        </p>
                    </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2">
                    <span className="px-4 py-2 rounded-xl text-xs font-bold tracking-wide 
          bg-amber-100 text-amber-800">
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
                                className="h-11 px-5 rounded-xl bg-slate-900 hover:bg-slate-800"
                            >
                                <Download className="mr-2 h-4 w-4" />
                                {loading ? "Generating..." : "Download PDF"}
                            </Button>
                        )}
                    </PDFDownloadLink>
                </div>
            </div>

            {/* Main Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Document Viewer */}
                <Card className="lg:col-span-2 border border-slate-200 rounded-2xl shadow-sm bg-white">
                    <CardContent className="p-12">

                        {isEditing ? (
                            <div className="space-y-4">
                                <textarea
                                    className="w-full min-h-[520px] p-5 border border-slate-200 rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                />

                                <div className="flex justify-end gap-2">
                                    <Button
                                        variant="outline"
                                        className="rounded-xl"
                                        onClick={() => setIsEditing(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        className="rounded-xl bg-slate-900 hover:bg-slate-800"
                                        onClick={handleUpdate}
                                    >
                                        Save Changes
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="prose prose-slate max-w-none">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {proposal.content}
                                </ReactMarkdown>
                            </div>
                        )}

                    </CardContent>
                </Card>

                {/* Right Sidebar */}
                <Card className="border border-slate-200 rounded-2xl shadow-sm bg-white h-fit">
                    <CardContent className="p-6 space-y-6">

                        <div>
                            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                                Document Metadata
                            </h3>
                        </div>

                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Created</span>
                                <span className="font-medium">
                                    {new Date(proposal.created_at).toLocaleDateString()}
                                </span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-slate-500">Format</span>
                                <span className="font-medium">Markdown / PDF</span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-slate-500">Client</span>
                                <span className="font-medium">
                                    {proposal.client_name}
                                </span>
                            </div>
                        </div>

                        <Button
                            variant="outline"
                            className="w-full h-11 rounded-xl"
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