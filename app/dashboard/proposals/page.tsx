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
import { Loader2, Wand2 } from "lucide-react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { ProposalPDF } from "@/components/ui/ProposalPDF";
import { Skeleton } from "@/components/ui/skeleton";
import { PageLoader } from "@/components/PageLoader";

const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
  { ssr: false, loading: () => <Button disabled>Loading PDF...</Button> }
);

export default function ProposalGenerator() {
  const router = useRouter();

  const [pageLoading, setPageLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<any>(null);

  const [projectDetails, setProjectDetails] = useState("");
  const [generatedProposal, setGeneratedProposal] = useState("");
  const [companyName, setCompanyName] = useState("FoundrKit User");

  useEffect(() => {
    async function fetchData() {
      setPageLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const clientsRes = await fetch(`http://localhost:8000/clients/${user.id}`);
      const clientsData = await clientsRes.json();
      setClients(clientsData);

      const { data: brand } = await supabase
        .from("brand_settings")
        .select("company_name")
        .eq("user_id", user.id)
        .single();

      if (brand) setCompanyName(brand.company_name);

      setPageLoading(false);
    }
    fetchData();
  }, []);

  const handleGenerate = async () => {
    if (!selectedClient || !projectDetails) {
      alert("Please select a client and enter project scope.");
      return;
    }

    setLoading(true);
    setGeneratedProposal("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const enrichedDetails = `
Project Scope: ${projectDetails}

Client Industry: ${selectedClient.industry || "General"}
Client Notes: ${selectedClient.notes || "None"}
`;

    const res = await fetch("http://localhost:8000/generate-proposal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: user?.id,
        client_name: selectedClient.name,
        project_details: enrichedDetails,
      }),
    });

    const data = await res.json();
    setGeneratedProposal(data.proposal_text);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!generatedProposal || !selectedClient) return;

    setSaveLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    await fetch("http://localhost:8000/proposals/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: user?.id,
        client_name: selectedClient.name,
        project_details: projectDetails,
        content: generatedProposal,
        status: "Draft",
      }),
    });

    setSaveLoading(false);
    router.push("/dashboard/proposals/list");
  };

  if (pageLoading) return <PageLoader />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[calc(100vh-110px)] max-w-7xl mx-auto">

      {/* LEFT PANEL */}
      <div className="flex flex-col gap-5">

        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Proposal Generator
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Craft high-impact proposals effortlessly.
          </p>
        </div>

        <Card className="flex-1 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <CardHeader className="border-b dark:border-slate-800">
            <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Configuration Panel
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6 pt-6">

            {/* Client Select */}
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Client
              </Label>

              <Select
                onValueChange={(value) => {
                  const client = clients.find((c) => c.id === value);
                  setSelectedClient(client);
                }}
              >
                <SelectTrigger className="h-12 rounded-xl bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100">
                  <SelectValue placeholder="Select client profile" />
                </SelectTrigger>

                <SelectContent className="dark:bg-slate-900 dark:text-slate-100 dark:border-slate-800">
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedClient && (
                <div className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl text-slate-600 dark:text-slate-300">
                  <strong className="text-slate-800 dark:text-slate-100">
                    AI Context:
                  </strong>{" "}
                  {selectedClient.notes || selectedClient.industry}
                </div>
              )}
            </div>

            {/* Scope */}
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Project Scope
              </Label>

              <Textarea
                placeholder="Describe goals, deliverables, timelines..."
                className="h-44 resize-none rounded-xl bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                value={projectDetails}
                onChange={(e) => setProjectDetails(e.target.value)}
              />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full h-14 text-sm font-semibold rounded-xl bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Generating…
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Wand2 className="h-5 w-5" />
                  Generate Proposal
                </div>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex flex-col gap-5">

        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Live Document Preview
          </h2>

          {generatedProposal && (
            <div className="flex items-center gap-2">

              <Button
                variant="outline"
                onClick={handleSave}
                disabled={saveLoading}
                className="h-11 rounded-xl dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {saveLoading ? "Saving…" : "Save Draft"}
              </Button>

              <PDFDownloadLink
                document={
                  <ProposalPDF
                    content={generatedProposal}
                    companyName={companyName}
                    clientName={selectedClient?.name || "Client"}
                  />
                }
                fileName="proposal.pdf"
              >
                {({ loading }) => (
                  <Button
                    disabled={loading}
                    className="h-11 rounded-xl text-sm bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Download PDF
                  </Button>
                )}
              </PDFDownloadLink>

            </div>
          )}
        </div>

        <Card className="flex-1 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden bg-white dark:bg-slate-900">
          <CardContent className="h-full overflow-y-auto p-10">

            {/* Loading Skeleton */}
            {loading && (
              <div className="space-y-4">
                <Skeleton className="h-6 w-2/3 dark:bg-slate-800" />
                <Skeleton className="h-4 w-full dark:bg-slate-800" />
                <Skeleton className="h-4 w-5/6 dark:bg-slate-800" />
                <Skeleton className="h-4 w-4/6 dark:bg-slate-800" />
                <Skeleton className="h-6 w-1/2 dark:bg-slate-800" />
              </div>
            )}

            {/* Markdown Preview */}
            {!loading && generatedProposal && (
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {generatedProposal}
                </ReactMarkdown>
              </div>
            )}

            {/* Empty State */}
            {!loading && !generatedProposal && (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 gap-2">
                <div className="border border-dashed border-slate-300 dark:border-slate-700 p-6 rounded-xl text-center">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    No proposal generated yet
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Select a client and enter project scope to begin
                  </p>
                </div>
              </div>
            )}

          </CardContent>
        </Card>
      </div>

    </div>
  );
}
