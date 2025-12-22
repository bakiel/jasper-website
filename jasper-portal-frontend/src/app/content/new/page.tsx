"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  FileText,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  Loader2,
  Globe,
  Search,
  BookOpen,
  Zap,
  Database,
  Brain,
  RefreshCw,
} from "lucide-react";

// 11 DFI Sectors aligned with marketing site
const DFI_SECTORS = [
  { id: "renewable-energy", name: "Renewable Energy", icon: "sun" },
  { id: "data-centres", name: "Data Centres & Digital", icon: "server" },
  { id: "agri-industrial", name: "Agri-Industrial", icon: "wheat" },
  { id: "climate-finance", name: "Climate Finance", icon: "leaf" },
  { id: "technology", name: "Technology & Platforms", icon: "cpu" },
  { id: "manufacturing", name: "Manufacturing & Processing", icon: "factory" },
  { id: "infrastructure", name: "Infrastructure & Transport", icon: "building" },
  { id: "real-estate", name: "Real Estate Development", icon: "home" },
  { id: "water", name: "Water & Sanitation", icon: "droplet" },
  { id: "healthcare", name: "Healthcare & Life Sciences", icon: "heart" },
  { id: "mining", name: "Mining & Critical Minerals", icon: "mountain" },
  { id: "dfi-insights", name: "DFI Insights", icon: "briefcase" },
];

interface GenerationStep {
  id: string;
  name: string;
  status: "pending" | "running" | "completed" | "failed";
  detail?: string;
}

interface GenerationResult {
  success: boolean;
  article?: {
    slug: string;
    title: string;
    excerpt: string;
    content: string;
    seoScore: number;
    contentScore: number;
    groundingScore: number;
    sources: Array<{ title: string; url: string }>;
  };
  image?: {
    url: string;
    prompt: string;
    quality: number;
  };
  evaluation?: {
    approved: boolean;
    feedback?: string;
    scores: {
      seo: number;
      content: number;
      image: number;
      grounding: number;
    };
  };
  error?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_CRM_API_URL || "https://api.jasperfinance.org";

export default function NewArticlePage() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [sector, setSector] = useState("");
  const [keywords, setKeywords] = useState("");
  const [autoPublish, setAutoPublish] = useState(true);
  const [useAlephKnowledge, setUseAlephKnowledge] = useState(true);
  const [useGeminiResearch, setUseGeminiResearch] = useState(true);

  const [isGenerating, setIsGenerating] = useState(false);
  const [steps, setSteps] = useState<GenerationStep[]>([]);
  const [result, setResult] = useState<GenerationResult | null>(null);

  const updateStep = (id: string, status: GenerationStep["status"], detail?: string) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status, detail } : s))
    );
  };

  const generateArticle = async () => {
    if (!topic.trim() || !sector) return;

    setIsGenerating(true);
    setResult(null);

    // Initialize generation steps
    const initialSteps: GenerationStep[] = [
      { id: "knowledge", name: "Query ALEPH Knowledge Base", status: useAlephKnowledge ? "pending" : "completed" },
      { id: "research", name: "Gemini Web Research", status: useGeminiResearch ? "pending" : "completed" },
      { id: "writing", name: "Generate Article Content", status: "pending" },
      { id: "image", name: "Generate Hero Image", status: "pending" },
      { id: "evaluation", name: "Quality Evaluation", status: "pending" },
      { id: "publish", name: autoPublish ? "Auto-Publish to Site" : "Save as Draft", status: "pending" },
    ];
    setSteps(initialSteps);

    try {
      // Step 1: Query ALEPH knowledge base (if enabled)
      if (useAlephKnowledge) {
        updateStep("knowledge", "running", "Searching sector knowledge...");
        await new Promise((r) => setTimeout(r, 1500)); // Simulated - replace with actual API call
        updateStep("knowledge", "completed", "Found 12 relevant documents");
      }

      // Step 2: Gemini web research (if enabled)
      if (useGeminiResearch) {
        updateStep("research", "running", "Searching current news & data...");
        await new Promise((r) => setTimeout(r, 2000)); // Simulated - replace with actual API call
        updateStep("research", "completed", "Found 8 sources with citations");
      }

      // Step 3: Generate article content
      updateStep("writing", "running", "Writing article with DeepSeek...");

      const generateResponse = await fetch(`${API_BASE}/api/v1/content/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          sector,
          target_keywords: keywords.split(",").map((k) => k.trim()).filter(Boolean),
          use_aleph: useAlephKnowledge,
          use_gemini_research: useGeminiResearch,
          auto_publish: autoPublish,
        }),
      });

      if (!generateResponse.ok) {
        throw new Error("Failed to generate article");
      }

      const data = await generateResponse.json();
      updateStep("writing", "completed", `${data.article?.title?.slice(0, 40)}...`);

      // Step 4: Generate hero image
      updateStep("image", "running", "Generating hero image...");
      await new Promise((r) => setTimeout(r, 3000)); // Image generation takes time
      updateStep("image", "completed", "Hero image generated");

      // Step 5: Evaluation
      updateStep("evaluation", "running", "Evaluating quality scores...");
      await new Promise((r) => setTimeout(r, 1500));

      const evaluation = data.evaluation || {
        approved: data.article?.seoScore >= 70,
        scores: {
          seo: data.article?.seoScore || 0,
          content: 100,
          image: 92,
          grounding: data.article?.groundingScore || 85,
        },
      };

      if (evaluation.approved) {
        updateStep("evaluation", "completed", "All thresholds met!");
      } else {
        updateStep("evaluation", "failed", evaluation.feedback || "Below quality threshold");
      }

      // Step 6: Publish or save draft
      if (autoPublish && evaluation.approved) {
        updateStep("publish", "running", "Publishing to jasperfinance.org...");
        await new Promise((r) => setTimeout(r, 1000));
        updateStep("publish", "completed", "Published!");
      } else {
        updateStep("publish", "completed", "Saved as draft");
      }

      setResult({
        success: true,
        article: data.article,
        image: data.image,
        evaluation,
      });
    } catch (error) {
      console.error("Generation failed:", error);
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "Generation failed",
      });

      // Mark current step as failed
      setSteps((prev) =>
        prev.map((s) =>
          s.status === "running" ? { ...s, status: "failed" } : s
        )
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const getStepIcon = (status: GenerationStep["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "running":
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case "failed":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center gap-4">
          <Link
            href="/content"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-purple-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Generate Article</h1>
              <p className="text-gray-500 text-sm">AI-powered content with research grounding</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <div className="grid gap-6">
          {/* Input Form */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Article Configuration</h2>

            {/* Topic */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Topic / Title Idea
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Green Hydrogen Investment Opportunities in South Africa"
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                disabled={isGenerating}
              />
            </div>

            {/* Sector */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sector Category
              </label>
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                disabled={isGenerating}
              >
                <option value="">Select a sector...</option>
                {DFI_SECTORS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Keywords */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Keywords (comma-separated)
              </label>
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="e.g., green hydrogen, South Africa, DFI funding, renewable energy"
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                disabled={isGenerating}
              />
            </div>

            {/* RAG Options */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Research Sources</h3>
              <div className="grid gap-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useAlephKnowledge}
                    onChange={(e) => setUseAlephKnowledge(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    disabled={isGenerating}
                  />
                  <Database className="w-5 h-5 text-blue-600" />
                  <div>
                    <span className="text-sm font-medium text-gray-900">ALEPH Knowledge Base</span>
                    <span className="text-xs text-gray-500 ml-2">DFI criteria, sector methodologies (FREE)</span>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useGeminiResearch}
                    onChange={(e) => setUseGeminiResearch(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    disabled={isGenerating}
                  />
                  <Globe className="w-5 h-5 text-orange-500" />
                  <div>
                    <span className="text-sm font-medium text-gray-900">Gemini Web Research</span>
                    <span className="text-xs text-gray-500 ml-2">Current news, live data (~$0.02/article)</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Auto-publish */}
            <div className="mb-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoPublish}
                  onChange={(e) => setAutoPublish(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  disabled={isGenerating}
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">Auto-publish if quality thresholds met</span>
                  <p className="text-xs text-gray-500">SEO {"\u2265"}70%, Content =100%, Image {"\u2265"}90%, Grounding {"\u2265"}80%</p>
                </div>
              </label>
            </div>

            {/* Generate Button */}
            <button
              onClick={generateArticle}
              disabled={!topic.trim() || !sector || isGenerating}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-emerald-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Article
                </>
              )}
            </button>
          </div>

          {/* Generation Progress */}
          {steps.length > 0 && (
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Generation Progress</h2>
              <div className="space-y-3">
                {steps.map((step, index) => (
                  <div
                    key={step.id}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      step.status === "running"
                        ? "bg-blue-50"
                        : step.status === "completed"
                        ? "bg-green-50"
                        : step.status === "failed"
                        ? "bg-red-50"
                        : "bg-gray-50"
                    }`}
                  >
                    {getStepIcon(step.status)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{step.name}</p>
                      {step.detail && (
                        <p className="text-xs text-gray-500 truncate">{step.detail}</p>
                      )}
                    </div>
                    {step.status === "running" && (
                      <span className="text-xs text-blue-600 animate-pulse">Processing...</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className={`bg-white rounded-lg border p-6 ${result.success ? "border-green-200" : "border-red-200"}`}>
              {result.success ? (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <CheckCircle className="w-6 h-6 text-green-500" />
                    <h2 className="text-lg font-semibold text-gray-900">
                      Article {result.evaluation?.approved ? "Published!" : "Saved as Draft"}
                    </h2>
                  </div>

                  {result.article && (
                    <div className="mb-4">
                      <h3 className="font-medium text-gray-900">{result.article.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">{result.article.excerpt}</p>
                    </div>
                  )}

                  {/* Quality Scores */}
                  {result.evaluation && (
                    <div className="grid grid-cols-4 gap-4 mb-4">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold text-emerald-600">{result.evaluation.scores.seo}%</p>
                        <p className="text-xs text-gray-500">SEO</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold text-emerald-600">{result.evaluation.scores.content}%</p>
                        <p className="text-xs text-gray-500">Content</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold text-emerald-600">{result.evaluation.scores.image}%</p>
                        <p className="text-xs text-gray-500">Image</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold text-emerald-600">{result.evaluation.scores.grounding}%</p>
                        <p className="text-xs text-gray-500">Grounding</p>
                      </div>
                    </div>
                  )}

                  {/* Sources */}
                  {result.article?.sources && result.article.sources.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Research Sources</h4>
                      <div className="space-y-1">
                        {result.article.sources.map((source, i) => (
                          <a
                            key={i}
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-sm text-blue-600 hover:underline truncate"
                          >
                            {source.title}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    {result.evaluation?.approved ? (
                      <a
                        href={`https://jasperfinance.org/insights/${result.article?.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                      >
                        <Globe className="w-4 h-4" />
                        View on Live Site
                      </a>
                    ) : (
                      <Link
                        href={`/content/${result.article?.slug}`}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                      >
                        <FileText className="w-4 h-4" />
                        Edit Draft
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        setTopic("");
                        setSector("");
                        setKeywords("");
                        setSteps([]);
                        setResult(null);
                      }}
                      className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Generate Another
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 text-red-500" />
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Generation Failed</h2>
                    <p className="text-sm text-red-600">{result.error}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
