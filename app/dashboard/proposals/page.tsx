"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import ReactMarkdown from "react-markdown";
import { Loader2, Wand2 } from "lucide-react";
import dynamic from "next/dynamic";
import { ProposalPDF } from "@/components/ui/ProposalPDF";
import remarkGfm from "remark-gfm";
export default function ProposalGenerator() {
    const [loading, setLoading] = useState(false);
    const [clientName, setClientName] = useState("");
    const [projectDetails, setProjectDetails] = useState("");
    const [generatedProposal, setGeneratedProposal] = useState("");
    const [companyName, setCompanyName] = useState("My Company");

    const handleGenerate = async () => {
        if (!clientName || !projectDetails) {
            alert("Please fill in the client name and project details.");
            return;
        }

        setLoading(true);
        setGeneratedProposal(""); // Clear previous result

        try {
            // 1. Get User ID
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert("Please log in first.");
                return;
            }

            // 2. Call our Python Backend
            const response = await fetch("http://localhost:8000/generate-proposal", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: user.id,
                    client_name: clientName,
                    project_details: projectDetails,
                }),
            });

            if (!response.ok) throw new Error("Failed to talk to AI Brain");

            const data = await response.json();
            setGeneratedProposal(data.proposal_text);

        } catch (error) {
            console.error(error);
            alert("Something went wrong generating the proposal.");
        } finally {
            setLoading(false);
        }
    };
    // This loads the PDF downloader only on the client side (prevents errors)
    const PDFDownloadLink = dynamic(
        () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
        {
            ssr: false,
            loading: () => <Button variant="outline" disabled>Loading PDF...</Button>,
        }
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[calc(100vh-100px)]">

            {/* LEFT COLUMN: The Input Form */}
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Proposal Engine</h1>
                    <p className="text-slate-600">Generate winning proposals in seconds.</p>
                </div>

                <Card className="flex-1">
                    <CardHeader>
                        <CardTitle>Project Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Client Name</Label>
                            <Input
                                placeholder="e.g. Nike, Local Coffee Shop"
                                value={clientName}
                                onChange={(e) => setClientName(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>What is the project?</Label>
                            <Textarea
                                placeholder="Describe the scope, timeline, and goals..."
                                className="h-40"
                                value={projectDetails}
                                onChange={(e) => setProjectDetails(e.target.value)}
                            />
                        </div>

                        <Button
                            onClick={handleGenerate}
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Wand2 className="mr-2 h-4 w-4" />
                                    Generate with AI
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* RIGHT COLUMN: The Result Preview */}
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center h-[56px]">
                    <h2 className="text-xl font-semibold text-slate-900">Preview</h2>
                    {generatedProposal && (
                        <PDFDownloadLink
                            document={
                                <ProposalPDF
                                    content={generatedProposal}
                                    companyName={companyName} // You can hardcode "FoundrKit User" for test
                                    clientName={clientName}
                                />
                            }
                            fileName={`${clientName.replace(/\s+/g, "_")}_Proposal.pdf`}
                        >
                            {({ loading }) => (
                                <Button variant="outline" disabled={loading}>
                                    {loading ? "Preparing PDF..." : "Download PDF"}
                                </Button>
                            )}
                        </PDFDownloadLink>
                    )}
                </div>

                <CardContent className="h-full overflow-y-auto p-8">
                    <div className="prose prose-slate max-w-none prose-headings:font-bold prose-h1:text-2xl prose-a:text-blue-600">
                        {generatedProposal ? (
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {generatedProposal}
                            </ReactMarkdown>
                        ):(
                            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                <Wand2 size={48} className="mb-4 opacity-20" />
                                <p>Enter details and click generate to see the magic.</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            
        </div>

        </div >
    );
}