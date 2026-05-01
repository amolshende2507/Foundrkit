"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Loader2, Wand2, Save, Download, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { ProposalPDF } from "@/components/ui/ProposalPDF";
import { Skeleton } from "@/components/ui/skeleton";
import { PageLoader } from "@/components/PageLoader";

// ✅ DYNAMIC IMPORT FOR PDF
const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
  { ssr: false, loading: () => <Button disabled className="h-11 px-4 rounded-xl"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Preparing PDF...</Button> }
);

// ✅ TYPESCRIPT INTERFACE
interface Client {
  id: string;
  name: string;
  industry?: string;
  notes?: string;
}

export default function ProposalGenerator() {
  const router = useRouter();

  // Loading States
  const [pageLoading, setPageLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  // Data
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [companyName, setCompanyName] = useState("FoundrKit User");

  // Form Inputs
  const [projectDetails, setProjectDetails] = useState("");
  const [generatedProposal, setGeneratedProposal] = useState("");

  // ✅ FETCH DATA WITH CACHE BUSTING
  useEffect(() => {
    async function fetchData() {
      try {
        setPageLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch Clients
        const clientsRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/clients/${user.id}?t=${Date.now()}`,
          { cache: "no-store" }
        );
        if (clientsRes.ok) {
          const clientsData: Client[] = await clientsRes.json();
          setClients(clientsData);
        }

        // Fetch Brand Name
        const { data: brand } = await supabase
          .from("brand_settings")
          .select("company_name")
          .eq("user_id", user.id)
          .single();

        if (brand?.company_name) setCompanyName(brand.company_name);
      } catch (error) {
        console.error("Error fetching initial data:", error);
      } finally {
        setPageLoading(false);
      }
    }
    fetchData();
  }, []);

  // ✅ GENERATE PROPOSAL
  const handleGenerate = async () => {
    if (!selectedClient || !projectDetails.trim()) {
      alert("Please select a client and enter the project scope.");
      return;
    }

    setLoading(true);
    setGeneratedProposal("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const enrichedDetails = `
Project Scope: ${projectDetails.trim()}

Client Industry: ${selectedClient.industry || "General"}
Client Notes: ${selectedClient.notes || "None"}
      `;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/generate-proposal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          client_name: selectedClient.name,
          project_details: enrichedDetails,
        }),
      });

      if (!res.ok) throw new Error("Failed to generate proposal");

      const data = await res.json();
      setGeneratedProposal(data.proposal_text);
    } catch (error) {
      console.error("Error generating proposal:", error);
      alert("Failed to generate proposal. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ SAVE PROPOSAL
  const handleSave = async () => {
    if (!generatedProposal || !selectedClient) return;

    setSaveLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/proposals/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          client_name: selectedClient.name,
          project_details: projectDetails.trim(),
          content: generatedProposal,
          status: "Draft",
        }),
      });

      if (!res.ok) throw new Error("Failed to save proposal");

      router.push("/dashboard/proposals/list");
    } catch (error) {
      console.error("Error saving proposal:", error);
      alert("Failed to save draft. Please try again.");
      setSaveLoading(false);
    }
  };

  if (pageLoading) return <PageLoader />;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:h-[calc(100vh-110px)] max-w-7xl mx-auto animate-in fade-in duration-500">

      {/* LEFT PANEL */}
      <div className="flex flex-col gap-5">

        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Proposal Generator
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Craft high-impact AI proposals effortlessly.
          </p>
        </div>

        <Card className="flex-1 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col">
          <CardHeader className="border-b border-slate-200 dark:border-slate-800 pb-4">
            <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Configuration Panel
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6 pt-6 flex flex-col flex-1">

            {/* Client Select */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Client
              </Label>

              <Select
                disabled={loading}
                onValueChange={(value) => {
                  const client = clients.find((c) => c.id === value);
                  setSelectedClient(client || null);
                }}
              >
                <SelectTrigger className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 focus-visible:ring-blue-500">
                  <SelectValue placeholder="Select client profile" />
                </SelectTrigger>

                <SelectContent className="dark:bg-slate-900 dark:text-slate-100 dark:border-slate-800">
                  {clients.length === 0 ? (
                    <SelectItem value="none" disabled>No clients found</SelectItem>
                  ) : (
                    clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>

              {selectedClient && (selectedClient.notes || selectedClient.industry) && (
                <div className="text-xs bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 p-3 rounded-xl text-slate-700 dark:text-slate-300 animate-in fade-in zoom-in-95 duration-200">
                  <strong className="text-blue-700 dark:text-blue-400 block mb-1">
                    AI Context Applied:
                  </strong>
                  {selectedClient.notes || selectedClient.industry}
                </div>
              )}
            </div>

            {/* Scope */}
            <div className="space-y-2 flex-1 flex flex-col">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Project Scope & Requirements
              </Label>

              <Textarea
                disabled={loading}
                placeholder="Describe goals, deliverables, timelines, and budget..."
                className="flex-1 min-h-[160px] resize-none rounded-xl bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 placeholder:text-slate-400 focus-visible:ring-blue-500"
                value={projectDetails}
                onChange={(e) => setProjectDetails(e.target.value)}
              />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={loading || !selectedClient || !projectDetails.trim()}
              className="w-full h-14 text-sm font-semibold rounded-xl bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-all active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating Proposal...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-5 w-5" />
                  Generate Proposal
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex flex-col gap-5">

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 lg:mt-0 mt-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Live Document Preview
          </h2>

          {generatedProposal && (
            <div className="flex items-center gap-2">

              <Button
                variant="outline"
                onClick={handleSave}
                disabled={saveLoading}
                className="h-11 px-4 rounded-xl dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                {saveLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="mr-2 h-4 w-4" /> Save Draft</>
                )}
              </Button>

              <PDFDownloadLink
                document={
                  <ProposalPDF
                    content={generatedProposal}
                    companyName={companyName}
                    clientName={selectedClient?.name || "Client"}
                  />
                }
                fileName={`${(selectedClient?.name || "Proposal").replace(/\s+/g, '_')}_Proposal.pdf`}
              >
                {({ loading: pdfLoading }) => (
                  <Button
                    disabled={pdfLoading || saveLoading}
                    className="h-11 px-4 rounded-xl text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all"
                  >
                    {pdfLoading ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Preparing...</>
                    ) : (
                      <><Download className="mr-2 h-4 w-4" /> Download PDF</>
                    )}
                  </Button>
                )}
              </PDFDownloadLink>

            </div>
          )}
        </div>

        <Card className="flex-1 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden bg-white dark:bg-slate-900/50">
          <CardContent className="h-full overflow-y-auto p-6 md:p-10 custom-scrollbar">

            {/* Loading Skeleton */}
            {loading && (
              <div className="space-y-6 animate-pulse">
                <Skeleton className="h-8 w-2/3 dark:bg-slate-800" />
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full dark:bg-slate-800" />
                  <Skeleton className="h-4 w-5/6 dark:bg-slate-800" />
                  <Skeleton className="h-4 w-full dark:bg-slate-800" />
                </div>
                <Skeleton className="h-6 w-1/3 dark:bg-slate-800 mt-8" />
                <div className="space-y-3">
                  <Skeleton className="h-4 w-4/6 dark:bg-slate-800" />
                  <Skeleton className="h-4 w-full dark:bg-slate-800" />
                </div>
              </div>
            )}

            {/* Markdown Preview */}
            {!loading && generatedProposal && (
              <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-p:leading-relaxed prose-a:text-blue-600 animate-in fade-in duration-300">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {generatedProposal}
                </ReactMarkdown>
              </div>
            )}

            {/* Empty State */}
            {!loading && !generatedProposal && (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 gap-3 min-h-[300px]">
                <div className="h-16 w-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-2 shadow-sm border border-slate-100 dark:border-slate-800">
                  <FileText className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                </div>
                <p className="text-base font-medium text-slate-700 dark:text-slate-300">
                  No proposal generated yet
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-[250px] text-center leading-relaxed">
                  Select a client and enter the project scope on the left to begin.
                </p>
              </div>
            )}

          </CardContent>
        </Card>
      </div>

    </div>
  );
}