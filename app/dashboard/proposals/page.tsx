// "use client";

// import { useState } from "react";
// import { supabase } from "@/lib/supabase";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Label } from "@/components/ui/label";
// import ReactMarkdown from "react-markdown";
// import { Loader2, Wand2 } from "lucide-react";
// import dynamic from "next/dynamic";
// import { ProposalPDF } from "@/components/ui/ProposalPDF";
// import remarkGfm from "remark-gfm";
// import { useRouter } from "next/navigation";
// export default function ProposalGenerator() {
//     const [loading, setLoading] = useState(false);
//     const [clientName, setClientName] = useState("");
//     const [projectDetails, setProjectDetails] = useState("");
//     const [generatedProposal, setGeneratedProposal] = useState("");
//     const [companyName, setCompanyName] = useState("My Company");
//     const [saveLoading, setSaveLoading] = useState(false);

//     const handleGenerate = async () => {
//         if (!clientName || !projectDetails) {
//             alert("Please fill in the client name and project details.");
//             return;
//         }

//         setLoading(true);
//         setGeneratedProposal(""); // Clear previous result

//         try {
//             // 1. Get User ID
//             const { data: { user } } = await supabase.auth.getUser();
//             if (!user) {
//                 alert("Please log in first.");
//                 return;
//             }

//             // 2. Call our Python Backend
//             const response = await fetch("http://localhost:8000/generate-proposal", {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({
//                     user_id: user.id,
//                     client_name: clientName,
//                     project_details: projectDetails,
//                 }),
//             });

//             if (!response.ok) throw new Error("Failed to talk to AI Brain");

//             const data = await response.json();
//             setGeneratedProposal(data.proposal_text);

//         } catch (error) {
//             console.error(error);
//             alert("Something went wrong generating the proposal.");
//         } finally {
//             setLoading(false);
//         }
//     };
//     // This loads the PDF downloader only on the client side (prevents errors)
//     const PDFDownloadLink = dynamic(
//         () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
//         {
//             ssr: false,
//             loading: () => <Button variant="outline" disabled>Loading PDF...</Button>,
//         }
//     );
//     const handleSave = async () => {
//         if (!generatedProposal) return;
//         setSaveLoading(true);

//         try {
//             const { data: { user } } = await supabase.auth.getUser();
//             if (!user) return;

//             const response = await fetch("http://localhost:8000/proposals/save", {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({
//                     user_id: user.id,
//                     client_name: clientName,
//                     project_details: projectDetails,
//                     content: generatedProposal,
//                     status: "Draft"
//                 }),
//             });

//             if (response.ok) {
//                 alert("Proposal saved!");
//                 router.push("/dashboard/proposals/list"); // We will create this page next
//             }
//         } catch (error) {
//             alert("Failed to save");
//         } finally {
//             setSaveLoading(false);
//         }
//     };

//     return (
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[calc(100vh-100px)]">

//             {/* LEFT COLUMN: The Input Form */}
//             <div className="flex flex-col gap-4">
//                 <div>
//                     <h1 className="text-3xl font-bold text-slate-900">Proposal Engine</h1>
//                     <p className="text-slate-600">Generate winning proposals in seconds.</p>
//                 </div>

//                 <Card className="flex-1">
//                     <CardHeader>
//                         <CardTitle>Project Details</CardTitle>
//                     </CardHeader>
//                     <CardContent className="space-y-4">
//                         <div className="space-y-2">
//                             <Label>Client Name</Label>
//                             <Input
//                                 placeholder="e.g. Nike, Local Coffee Shop"
//                                 value={clientName}
//                                 onChange={(e) => setClientName(e.target.value)}
//                             />
//                         </div>

//                         <div className="space-y-2">
//                             <Label>What is the project?</Label>
//                             <Textarea
//                                 placeholder="Describe the scope, timeline, and goals..."
//                                 className="h-40"
//                                 value={projectDetails}
//                                 onChange={(e) => setProjectDetails(e.target.value)}
//                             />
//                         </div>

//                         <Button
//                             onClick={handleGenerate}
//                             disabled={loading}
//                             className="w-full bg-blue-600 hover:bg-blue-700"
//                         >
//                             {loading ? (
//                                 <>
//                                     <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                                     Generating...
//                                 </>
//                             ) : (
//                                 <>
//                                     <Wand2 className="mr-2 h-4 w-4" />
//                                     Generate with AI
//                                 </>
//                             )}
//                         </Button>
//                     </CardContent>
//                 </Card>
//             </div>

//             {/* RIGHT COLUMN: The Result Preview */}
//             <div className="flex flex-col gap-4">
//                 <div className="flex justify-between items-center h-[56px]">
//                     <h2 className="text-xl font-semibold text-slate-900">Preview</h2>
//                     <div className="flex gap-2">
//                         {generatedProposal && (
//                             <>
//                                 <Button variant="outline" onClick={handleSave} disabled={saveLoading}>
//                                     {saveLoading ? "Saving..." : "Save Draft"}
//                                 </Button>
//                                 <PDFDownloadLink
//                                     document={
//                                         <ProposalPDF
//                                             content={generatedProposal}
//                                             companyName={companyName} // You can hardcode "FoundrKit User" for test
//                                             clientName={clientName}
//                                         />
//                                     }
//                                     fileName={`${clientName.replace(/\s+/g, "_")}_Proposal.pdf`}
//                                 >
//                                     {({ loading }) => (
//                                         <Button variant="outline" disabled={loading}>
//                                             {loading ? "Preparing PDF..." : "Download PDF"}
//                                         </Button>
//                                     )}
//                                 </PDFDownloadLink>
//                             </>
//                         )}
//                     </div>
//                 </div>










//                 <CardContent className="h-full overflow-y-auto p-8">
//                     <div className="prose prose-slate max-w-none prose-headings:font-bold prose-h1:text-2xl prose-a:text-blue-600">
//                         {generatedProposal ? (
//                             <ReactMarkdown remarkPlugins={[remarkGfm]}>
//                                 {generatedProposal}
//                             </ReactMarkdown>
//                         ) : (
//                             <div className="flex flex-col items-center justify-center h-full text-slate-400">
//                                 <Wand2 size={48} className="mb-4 opacity-20" />
//                                 <p>Enter details and click generate to see the magic.</p>
//                             </div>
//                         )}
//                     </div>
//                 </CardContent>

//             </div>

//         </div >
//     );
// }
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const clientRes = await fetch(`http://localhost:8000/clients/${user.id}`);
      const clientData = await clientRes.json();
      setClients(clientData);

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
      alert("Please select a client and describe the project.");
      return;
    }

    setLoading(true);
    setGeneratedProposal("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const enrichedDetails = `
Project Scope: ${projectDetails}

Client Industry: ${selectedClient.industry || "General"}
Client Context/Notes: ${selectedClient.notes || "None"}
`;

    const response = await fetch("http://localhost:8000/generate-proposal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: user.id,
        client_name: selectedClient.name,
        project_details: enrichedDetails,
      })
    });

    const data = await response.json();
    setGeneratedProposal(data.proposal_text);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!generatedProposal || !selectedClient) return;

    setSaveLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    await fetch("http://localhost:8000/proposals/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: user?.id,
        client_name: selectedClient.name,
        project_details: projectDetails,
        content: generatedProposal,
        status: "Draft"
      })
    });

    setSaveLoading(false);
    router.push("/dashboard/proposals/list");
  };

  if (pageLoading) return <PageLoader />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[calc(100vh-110px)] max-w-7xl mx-auto">

      {/* LEFT PANEL – CONTROL ZONE */}
      <div className="flex flex-col gap-5">

        {/* Page Title */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Proposal Generator
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Create client-ready proposals using AI precision.
          </p>
        </div>

        {/* Configuration Card */}
        <Card className="flex-1 border border-slate-200 shadow-sm rounded-2xl">
          <CardHeader className="border-b">
            <CardTitle className="text-base font-semibold text-slate-900">
              Configuration Panel
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6 pt-6">

            {/* Client Selector */}
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-slate-500">
                Client
              </Label>

              <Select
                onValueChange={(value) => {
                  const client = clients.find(c => c.id === value);
                  setSelectedClient(client);
                }}
              >
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue placeholder="Select client profile" />
                </SelectTrigger>

                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedClient && (
                <div className="text-xs bg-slate-50 border border-slate-200 p-3 rounded-xl text-slate-600">
                  <strong className="text-slate-800">AI Context:</strong>{" "}
                  {selectedClient.notes || selectedClient.industry}
                </div>
              )}
            </div>

            {/* Scope Input */}
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-slate-500">
                Project Scope
              </Label>

              <Textarea
                placeholder="Describe goals, scope, deliverables and timeline..."
                className="h-44 resize-none rounded-xl text-sm"
                value={projectDetails}
                onChange={(e) => setProjectDetails(e.target.value)}
              />
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={loading}
              className="
              w-full h-14 text-sm font-semibold rounded-xl
              bg-slate-900 hover:bg-slate-800
            "
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Generating proposal…
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

      {/* RIGHT PANEL – PREVIEW ZONE */}
      <div className="flex flex-col gap-5">

        {/* Preview Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-900">
            Live Document Preview
          </h2>

          {generatedProposal && (
            <div className="flex items-center gap-2">

              <Button
                variant="outline"
                onClick={handleSave}
                disabled={saveLoading}
                className="h-11 rounded-xl text-sm"
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
                    className="h-11 rounded-xl text-sm bg-blue-600 hover:bg-blue-700"
                  >
                    Download PDF
                  </Button>
                )}
              </PDFDownloadLink>

            </div>
          )}
        </div>

        {/* Live Preview Card */}
        <Card className="flex-1 border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
          <CardContent className="h-full overflow-y-auto p-10 prose prose-slate max-w-none bg-white">

            {/* Loading Skeleton */}
            {loading && (
              <div className="space-y-4">
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
                <Skeleton className="h-6 w-1/2" />
              </div>
            )}

            {/* AI Output */}
            {!loading && generatedProposal && (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {generatedProposal}
              </ReactMarkdown>
            )}

            {/* Empty State */}
            {!loading && !generatedProposal && (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                <div className="border border-dashed border-slate-300 p-6 rounded-xl text-center">
                  <p className="text-sm font-medium text-slate-600">
                    No proposal generated yet
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
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
