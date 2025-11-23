"use client";

import { useEffect, useState,use } from "react";
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
      setLoading(false);
    }
    fetchData();
  }, [id]);

  if (loading) return <div className="p-10">Loading Proposal...</div>;
  if (!proposal) return <div className="p-10">Proposal not found</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{proposal.client_name}</h1>
            <p className="text-slate-500 text-sm">
                Project: {proposal.project_details?.substring(0, 50)}...
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
            <span className="px-3 py-2 bg-yellow-100 text-yellow-800 rounded-md text-sm font-medium flex items-center">
                Status: {proposal.status}
            </span>
            
            {/* The PDF Download Button */}
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
                <Button className="bg-blue-600 hover:bg-blue-700" disabled={loading}>
                    <Download className="mr-2 h-4 w-4" /> 
                    {loading ? "Preparing..." : "Download PDF"}
                </Button>
                )}
            </PDFDownloadLink>
        </div>
      </div>

      {/* Content Viewer */}
      <div className="grid grid-cols-3 gap-6">
        <Card className="col-span-3 md:col-span-2 bg-white border-slate-200 shadow-sm">
            <CardContent className="p-10 prose prose-slate max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {proposal.content}
                </ReactMarkdown>
            </CardContent>
        </Card>

        {/* Sidebar Info */}
        <Card className="col-span-3 md:col-span-1 h-fit">
            <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold text-slate-900">Meta Data</h3>
                <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                        <span className="text-slate-500">Created:</span>
                        <span>{new Date(proposal.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-500">Type:</span>
                        <span>Markdown / PDF</span>
                    </div>
                </div>
                <Button variant="outline" className="w-full mt-4">
                    Edit (Coming Soon)
                </Button>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}