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
      {/* LEFT */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Proposal Engine</h1>
          <p className="text-slate-500">Generate client-ready proposals with AI.</p>
        </div>

        <Card className="flex-1 shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Select Client</Label>
              <Select onValueChange={(value) => {
                const client = clients.find(c => c.id === value);
                setSelectedClient(client);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a client..." />
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
                <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded-lg">
                  AI Context: {selectedClient.notes || selectedClient.industry}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Project Scope</Label>
              <Textarea
                placeholder="Describe the project goals, scope, and deliverables..."
                className="h-44 resize-none"
                value={projectDetails}
                onChange={(e) => setProjectDetails(e.target.value)}
              />
            </div>

            <Button
              type="button"
              onClick={handleGenerate}
              disabled={loading}
              className="w-full text-base py-6 bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating Proposal...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-5 w-5" />
                  Generate Smart Proposal
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* RIGHT */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Live Preview</h2>

          {generatedProposal && (
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleSave}
                disabled={saveLoading}
              >
                {saveLoading ? "Saving..." : "Save Draft"}
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
                  <Button type="button" disabled={loading}>
                    Download PDF
                  </Button>
                )}
              </PDFDownloadLink>
            </div>
          )}
        </div>

        <Card className="flex-1 bg-white border-slate-200 shadow-sm overflow-hidden">
          <CardContent className="h-full overflow-y-auto p-8 prose prose-slate max-w-none">
            {/* Skeleton during generation */}
            {loading && (
              <div className="space-y-4">
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
                <Skeleton className="h-6 w-1/2" />
              </div>
            )}

            {/* Render proposal */}
            {!loading && generatedProposal && (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {generatedProposal}
              </ReactMarkdown>
            )}

            {/* Empty state */}
            {!loading && !generatedProposal && (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                <p>Start by selecting a client</p>
                <p className="text-xs">Your proposal will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
