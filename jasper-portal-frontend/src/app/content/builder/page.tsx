"use client";

import { useState, useEffect } from "react";
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
  Upload,
  Wand2,
  Library,
  Eye,
  Save,
  Send,
  RefreshCw,
  Brain,
  Target,
  Gauge,
  BookOpen,
  Copy,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";

// 11 DFI Sectors aligned with marketing site
const DFI_SECTORS = [
  { id: "renewable-energy", name: "Renewable Energy" },
  { id: "data-centres", name: "Data Centres & Digital" },
  { id: "agri-industrial", name: "Agri-Industrial" },
  { id: "climate-finance", name: "Climate Finance" },
  { id: "technology", name: "Technology & Platforms" },
  { id: "manufacturing", name: "Manufacturing & Processing" },
  { id: "infrastructure", name: "Infrastructure & Transport" },
  { id: "real-estate", name: "Real Estate Development" },
  { id: "water", name: "Water & Sanitation" },
  { id: "healthcare", name: "Healthcare & Life Sciences" },
  { id: "mining", name: "Mining & Critical Minerals" },
  { id: "dfi-insights", name: "DFI Insights" },
];

type ImageDecision = "user_provided" | "auto_select" | "generate" | "skip";
type BuildStatus = "idle" | "analyzing" | "building" | "completed" | "failed";

interface BuildStep {
  id: string;
  name: string;
  status: "pending" | "running" | "completed" | "failed";
  detail?: string;
}

interface QualityScore {
  name: string;
  score: number;
  weight: number;
  feedback: string;
}

interface BuildResult {
  success: boolean;
  build_id: string;
  status: string;
  message: string;
  result?: {
    id: string;
    build_mode: string;
    article_title: string;
    article_content: string;
    article_excerpt: string;
    article_slug?: string;
    evaluation?: {
      overall_score: number;
      quality_level: string;
      meets_threshold: boolean;
      dimensions: QualityScore[];
      critical_issues: string[];
      warnings: string[];
      suggestions: string[];
      publish_recommendation: string;
    };
    image_result?: {
      image_url?: string;
      alt_text?: string;
      decision: string;
    };
    was_auto_published: boolean;
  };
  needs_input: string[];
  input_prompts: Record<string, string>;
  preview_available: boolean;
}

interface InputAnalysis {
  completeness: string;
  completeness_score: number;
  mode: string;
  recommendations: string[];
  missing_fields: string[];
  ready_to_build: boolean;
}

const API_BASE = process.env.NEXT_PUBLIC_CRM_API_URL || "https://api.jasperfinance.org";

export default function ArticleBuilderPage() {
  const router = useRouter();

  // Input state
  const [topic, setTopic] = useState("");
  const [title, setTitle] = useState("");
  const [rawContent, setRawContent] = useState("");
  const [keyPoints, setKeyPoints] = useState("");
  const [category, setCategory] = useState("");
  const [keywords, setKeywords] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [desiredTone, setDesiredTone] = useState("");
  const [targetLength, setTargetLength] = useState(1200);

  // Image options
  const [imageDecision, setImageDecision] = useState<ImageDecision>("auto_select");
  const [imagePrompt, setImagePrompt] = useState("");
  const [selectedImageId, setSelectedImageId] = useState("");

  // Build options
  const [autoPublish, setAutoPublish] = useState(true);
  const [skipResearch, setSkipResearch] = useState(false);
  const [skipEnhancement, setSkipEnhancement] = useState(false);
  const [qualityThreshold, setQualityThreshold] = useState(70);

  // UI state
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showObjectives, setShowObjectives] = useState(false);
  const [buildStatus, setBuildStatus] = useState<BuildStatus>("idle");
  const [steps, setSteps] = useState<BuildStep[]>([]);
  const [analysis, setAnalysis] = useState<InputAnalysis | null>(null);
  const [result, setResult] = useState<BuildResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [blogObjectives, setBlogObjectives] = useState<string>("");

  // Fetch blog objectives on mount
  useEffect(() => {
    fetchObjectives();
  }, []);

  const fetchObjectives = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/builder/objectives`);
      if (response.ok) {
        const data = await response.json();
        setBlogObjectives(data.objectives);
      }
    } catch (err) {
      console.error("Failed to fetch objectives:", err);
    }
  };

  // Analyze input on change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (topic || rawContent) {
        analyzeInput();
      } else {
        setAnalysis(null);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [topic, title, rawContent, keyPoints, category, keywords]);

  const analyzeInput = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/builder/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic || null,
          title: title || null,
          raw_content: rawContent || null,
          key_points: keyPoints ? keyPoints.split("\n").filter(k => k.trim()) : null,
          category: category || null,
          target_keywords: keywords ? keywords.split(",").map(k => k.trim()).filter(Boolean) : null,
          target_audience: targetAudience || null,
          desired_tone: desiredTone || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysis(data);
      }
    } catch (err) {
      console.error("Analysis failed:", err);
    }
  };

  const buildArticle = async () => {
    setBuildStatus("building");
    setError(null);
    setResult(null);

    // Initialize steps
    const initialSteps: BuildStep[] = [
      { id: "analyze", name: "Analyzing Input", status: "running" },
      { id: "research", name: "Research & Context", status: skipResearch ? "completed" : "pending" },
      { id: "enhance", name: "AI Enhancement", status: skipEnhancement ? "completed" : "pending" },
      { id: "image", name: "Hero Image", status: "pending" },
      { id: "evaluate", name: "Quality Evaluation", status: "pending" },
      { id: "publish", name: autoPublish ? "Auto-Publish" : "Save Draft", status: "pending" },
    ];
    setSteps(initialSteps);

    const updateStep = (id: string, status: BuildStep["status"], detail?: string) => {
      setSteps(prev => prev.map(s => s.id === id ? { ...s, status, detail } : s));
    };

    try {
      // Make API call
      updateStep("analyze", "completed", "Input analyzed");
      if (!skipResearch) updateStep("research", "running", "Researching topic...");

      const response = await fetch(`${API_BASE}/api/v1/builder/build`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: {
            topic: topic || null,
            title: title || null,
            raw_content: rawContent || null,
            key_points: keyPoints ? keyPoints.split("\n").filter(k => k.trim()) : null,
            category: category || null,
            target_keywords: keywords ? keywords.split(",").map(k => k.trim()).filter(Boolean) : null,
            target_audience: targetAudience || null,
            desired_tone: desiredTone || null,
            target_length: targetLength,
            auto_publish_if_quality: autoPublish,
            image_prompt: imagePrompt || null,
            hero_image_id: selectedImageId || null,
          },
          skip_research: skipResearch,
          skip_enhancement: skipEnhancement,
          image_decision: imageDecision,
          quality_threshold: qualityThreshold,
          auto_publish: autoPublish,
        }),
      });

      if (!response.ok) {
        throw new Error(`Build failed: ${response.statusText}`);
      }

      const data: BuildResult = await response.json();

      // Update steps based on result
      if (!skipResearch) updateStep("research", "completed", "Research complete");
      if (!skipEnhancement) updateStep("enhance", "completed", "Content enhanced");
      updateStep("image", "completed", data.result?.image_result?.image_url ? "Image selected" : "No image");

      if (data.result?.evaluation) {
        const score = data.result.evaluation.overall_score;
        updateStep("evaluate", "completed", `Score: ${score.toFixed(0)}%`);

        if (data.result.was_auto_published) {
          updateStep("publish", "completed", "Published!");
        } else if (data.result.evaluation.meets_threshold) {
          updateStep("publish", "completed", "Saved as draft");
        } else {
          updateStep("publish", "failed", `Below ${qualityThreshold}% threshold`);
        }
      }

      setResult(data);
      setBuildStatus("completed");
    } catch (err) {
      console.error("Build failed:", err);
      setError(err instanceof Error ? err.message : "Build failed");
      setBuildStatus("failed");

      // Mark current running step as failed
      setSteps(prev => prev.map(s => s.status === "running" ? { ...s, status: "failed" } : s));
    }
  };

  const saveAsDraft = async () => {
    if (!result?.build_id) return;

    try {
      const response = await fetch(`${API_BASE}/api/v1/builder/save/${result.build_id}`, {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/content/${data.slug}`);
      }
    } catch (err) {
      console.error("Save failed:", err);
    }
  };

  const approveAndPublish = async () => {
    if (!result?.result?.article_slug) return;

    try {
      const response = await fetch(`${API_BASE}/api/v1/builder/approve/${result.result.article_slug}`, {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          window.open(`https://jasperfinance.org/insights/${result.result.article_slug}`, "_blank");
        }
      }
    } catch (err) {
      console.error("Publish failed:", err);
    }
  };

  const resetForm = () => {
    setTopic("");
    setTitle("");
    setRawContent("");
    setKeyPoints("");
    setCategory("");
    setKeywords("");
    setTargetAudience("");
    setDesiredTone("");
    setImagePrompt("");
    setSelectedImageId("");
    setAnalysis(null);
    setResult(null);
    setSteps([]);
    setBuildStatus("idle");
    setError(null);
  };

  const getStepIcon = (status: BuildStep["status"]) => {
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

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-green-600";
    if (score >= 70) return "text-emerald-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-4">
        <div className="flex items-center gap-4">
          <Link
            href="/content"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 dark:text-gray-300" />
          </Link>
          <div className="flex items-center gap-3">
            <Wand2 className="w-8 h-8 text-emerald-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Article Builder</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                AI-assisted article creation with 70%+ quality assurance
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Input Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Content Input Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                Content Input
              </h2>

              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Provide as much or as little as you want. AI fills the gaps to reach 70%+ quality.
              </p>

              {/* Topic/Title Row */}
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Topic / Headline Idea
                  </label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., Green Hydrogen Investment in SA"
                    className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                    disabled={buildStatus === "building"}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Exact Title (optional)
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Leave blank for AI to generate"
                    className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                    disabled={buildStatus === "building"}
                  />
                </div>
              </div>

              {/* Raw Content - Main Textarea */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <div className="flex items-center gap-2">
                    <Copy className="w-4 h-4" />
                    Content / Draft / Copy-Paste
                  </div>
                </label>
                <textarea
                  value={rawContent}
                  onChange={(e) => setRawContent(e.target.value)}
                  placeholder="Paste existing content here, write a draft, or leave empty for full AI generation...

The AI will:
• Analyze what you've provided
• Research the topic if needed
• Enhance or generate content to 70%+ quality
• Maintain JASPER's professional voice"
                  rows={10}
                  className="w-full px-4 py-3 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono text-sm dark:bg-gray-700 dark:text-white"
                  disabled={buildStatus === "building"}
                />
                {rawContent && (
                  <p className="text-xs text-gray-500 mt-1">
                    {rawContent.split(/\s+/).filter(Boolean).length} words
                  </p>
                )}
              </div>

              {/* Key Points */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Key Points (one per line, optional)
                </label>
                <textarea
                  value={keyPoints}
                  onChange={(e) => setKeyPoints(e.target.value)}
                  placeholder="• Main point 1&#10;• Main point 2&#10;• Main point 3"
                  rows={3}
                  className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                  disabled={buildStatus === "building"}
                />
              </div>

              {/* Category & Keywords Row */}
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category / Sector
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                    disabled={buildStatus === "building"}
                  >
                    <option value="">Auto-detect or select...</option>
                    {DFI_SECTORS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Target Keywords (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="e.g., green hydrogen, DFI funding, SA"
                    className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                    disabled={buildStatus === "building"}
                  />
                </div>
              </div>

              {/* Advanced Options Toggle */}
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                Advanced Options
              </button>

              {showAdvanced && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Target Audience
                      </label>
                      <input
                        type="text"
                        value={targetAudience}
                        onChange={(e) => setTargetAudience(e.target.value)}
                        placeholder="e.g., DFI professionals, project developers"
                        className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                        disabled={buildStatus === "building"}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Desired Tone
                      </label>
                      <input
                        type="text"
                        value={desiredTone}
                        onChange={(e) => setDesiredTone(e.target.value)}
                        placeholder="e.g., professional, data-driven"
                        className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                        disabled={buildStatus === "building"}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Target Length: {targetLength} words
                    </label>
                    <input
                      type="range"
                      min={400}
                      max={3000}
                      step={100}
                      value={targetLength}
                      onChange={(e) => setTargetLength(parseInt(e.target.value))}
                      className="w-full"
                      disabled={buildStatus === "building"}
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>400 (short)</span>
                      <span>1200 (standard)</span>
                      <span>3000 (long)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Image Options Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-emerald-600" />
                Hero Image
              </h2>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                <button
                  onClick={() => setImageDecision("auto_select")}
                  className={`p-3 border rounded-lg text-left transition-all ${
                    imageDecision === "auto_select"
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                      : "border-gray-200 dark:border-gray-600 hover:border-gray-300"
                  }`}
                  disabled={buildStatus === "building"}
                >
                  <Library className={`w-5 h-5 mb-1 ${imageDecision === "auto_select" ? "text-emerald-600" : "text-gray-400"}`} />
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Auto-Select</p>
                  <p className="text-xs text-gray-500">From library</p>
                </button>

                <button
                  onClick={() => setImageDecision("generate")}
                  className={`p-3 border rounded-lg text-left transition-all ${
                    imageDecision === "generate"
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                      : "border-gray-200 dark:border-gray-600 hover:border-gray-300"
                  }`}
                  disabled={buildStatus === "building"}
                >
                  <Wand2 className={`w-5 h-5 mb-1 ${imageDecision === "generate" ? "text-emerald-600" : "text-gray-400"}`} />
                  <p className="text-sm font-medium text-gray-900 dark:text-white">AI Generate</p>
                  <p className="text-xs text-gray-500">Create new</p>
                </button>

                <button
                  onClick={() => setImageDecision("user_provided")}
                  className={`p-3 border rounded-lg text-left transition-all ${
                    imageDecision === "user_provided"
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                      : "border-gray-200 dark:border-gray-600 hover:border-gray-300"
                  }`}
                  disabled={buildStatus === "building"}
                >
                  <Upload className={`w-5 h-5 mb-1 ${imageDecision === "user_provided" ? "text-emerald-600" : "text-gray-400"}`} />
                  <p className="text-sm font-medium text-gray-900 dark:text-white">I'll Provide</p>
                  <p className="text-xs text-gray-500">Select later</p>
                </button>

                <button
                  onClick={() => setImageDecision("skip")}
                  className={`p-3 border rounded-lg text-left transition-all ${
                    imageDecision === "skip"
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                      : "border-gray-200 dark:border-gray-600 hover:border-gray-300"
                  }`}
                  disabled={buildStatus === "building"}
                >
                  <AlertCircle className={`w-5 h-5 mb-1 ${imageDecision === "skip" ? "text-emerald-600" : "text-gray-400"}`} />
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Skip</p>
                  <p className="text-xs text-gray-500">No image</p>
                </button>
              </div>

              {imageDecision === "generate" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Image Generation Prompt (optional)
                  </label>
                  <input
                    type="text"
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    placeholder="Leave blank for AI to create prompt based on article content"
                    className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                    disabled={buildStatus === "building"}
                  />
                </div>
              )}
            </div>

            {/* Build Options Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-600" />
                Build Options
              </h2>

              <div className="space-y-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoPublish}
                    onChange={(e) => setAutoPublish(e.target.checked)}
                    className="mt-1 w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    disabled={buildStatus === "building"}
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Auto-publish if quality threshold met
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Articles scoring {qualityThreshold}%+ will be published automatically
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={skipResearch}
                    onChange={(e) => setSkipResearch(e.target.checked)}
                    className="mt-1 w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    disabled={buildStatus === "building"}
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Skip research phase
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Use only provided content without additional research
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={skipEnhancement}
                    onChange={(e) => setSkipEnhancement(e.target.checked)}
                    className="mt-1 w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    disabled={buildStatus === "building"}
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Skip AI enhancement
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Keep original content without AI modifications (manual mode)
                    </p>
                  </div>
                </label>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Quality Threshold: {qualityThreshold}%
                  </label>
                  <input
                    type="range"
                    min={50}
                    max={90}
                    step={5}
                    value={qualityThreshold}
                    onChange={(e) => setQualityThreshold(parseInt(e.target.value))}
                    className="w-full"
                    disabled={buildStatus === "building"}
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>50% (low)</span>
                    <span>70% (standard)</span>
                    <span>90% (strict)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Input Analysis Card */}
            {analysis && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-emerald-600" />
                  Input Analysis
                </h3>

                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-400">Completeness</span>
                    <span className={`font-medium ${getScoreColor(analysis.completeness_score)}`}>
                      {analysis.completeness_score.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        analysis.completeness_score >= 70 ? "bg-emerald-500" :
                        analysis.completeness_score >= 50 ? "bg-yellow-500" : "bg-red-500"
                      }`}
                      style={{ width: `${analysis.completeness_score}%` }}
                    />
                  </div>
                </div>

                <div className="text-xs space-y-1 mb-3">
                  <p className="text-gray-600 dark:text-gray-400">
                    Mode: <span className="font-medium text-gray-900 dark:text-white capitalize">{analysis.mode.replace("_", " ")}</span>
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    Status: <span className="font-medium text-gray-900 dark:text-white capitalize">{analysis.completeness}</span>
                  </p>
                </div>

                {analysis.recommendations.length > 0 && (
                  <div className="text-xs">
                    <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">Recommendations:</p>
                    <ul className="list-disc list-inside text-gray-500 dark:text-gray-400 space-y-0.5">
                      {analysis.recommendations.slice(0, 3).map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Blog Objectives Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-4">
              <button
                onClick={() => setShowObjectives(!showObjectives)}
                className="w-full flex items-center justify-between text-sm font-semibold text-gray-900 dark:text-white"
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  Blog Objectives
                </div>
                {showObjectives ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showObjectives && blogObjectives && (
                <pre className="mt-3 text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-sans">
                  {blogObjectives}
                </pre>
              )}
            </div>

            {/* Build Button */}
            <button
              onClick={buildArticle}
              disabled={(!topic && !rawContent) || buildStatus === "building"}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-medium hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
            >
              {buildStatus === "building" ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Building Article...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Build Article
                </>
              )}
            </button>

            {/* Progress Steps */}
            {steps.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Build Progress
                </h3>
                <div className="space-y-2">
                  {steps.map((step) => (
                    <div
                      key={step.id}
                      className={`flex items-center gap-2 p-2 rounded text-sm ${
                        step.status === "running" ? "bg-blue-50 dark:bg-blue-900/20" :
                        step.status === "completed" ? "bg-green-50 dark:bg-green-900/20" :
                        step.status === "failed" ? "bg-red-50 dark:bg-red-900/20" :
                        "bg-gray-50 dark:bg-gray-700"
                      }`}
                    >
                      {getStepIcon(step.status)}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white text-xs">{step.name}</p>
                        {step.detail && (
                          <p className="text-xs text-gray-500 truncate">{step.detail}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Result Card */}
            {result && buildStatus === "completed" && (
              <div className={`bg-white dark:bg-gray-800 rounded-lg border p-4 ${
                result.result?.evaluation?.meets_threshold ? "border-green-200 dark:border-green-800" : "border-yellow-200 dark:border-yellow-800"
              }`}>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-emerald-600" />
                  Quality Score
                </h3>

                {result.result?.evaluation && (
                  <>
                    <div className="text-center mb-4">
                      <p className={`text-4xl font-bold ${getScoreColor(result.result.evaluation.overall_score)}`}>
                        {result.result.evaluation.overall_score.toFixed(0)}%
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                        {result.result.evaluation.quality_level.replace("_", " ")}
                      </p>
                      {result.result.evaluation.meets_threshold ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600 mt-1">
                          <CheckCircle className="w-3 h-3" />
                          Meets threshold
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-yellow-600 mt-1">
                          <AlertCircle className="w-3 h-3" />
                          Below threshold
                        </span>
                      )}
                    </div>

                    {/* Dimension Scores */}
                    <div className="space-y-2 mb-4">
                      {result.result.evaluation.dimensions.map((dim, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-xs text-gray-600 dark:text-gray-400 w-20 truncate">{dim.name}</span>
                          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${
                                dim.score >= 70 ? "bg-emerald-500" :
                                dim.score >= 50 ? "bg-yellow-500" : "bg-red-500"
                              }`}
                              style={{ width: `${dim.score}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium w-8">{dim.score.toFixed(0)}%</span>
                        </div>
                      ))}
                    </div>

                    {/* Issues */}
                    {result.result.evaluation.critical_issues.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-red-600 mb-1">Critical Issues:</p>
                        <ul className="text-xs text-red-500 list-disc list-inside">
                          {result.result.evaluation.critical_issues.map((issue, i) => (
                            <li key={i}>{issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}

                {/* Action Buttons */}
                <div className="space-y-2">
                  {result.result?.was_auto_published ? (
                    <a
                      href={`https://jasperfinance.org/insights/${result.result.article_slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                    >
                      <Globe className="w-4 h-4" />
                      View Published Article
                    </a>
                  ) : (
                    <>
                      <button
                        onClick={saveAsDraft}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                      >
                        <Save className="w-4 h-4" />
                        Save as Draft
                      </button>
                      {result.result?.evaluation?.meets_threshold && (
                        <button
                          onClick={approveAndPublish}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                        >
                          <Send className="w-4 h-4" />
                          Approve & Publish
                        </button>
                      )}
                    </>
                  )}
                  <button
                    onClick={resetForm}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Build Another
                  </button>
                </div>
              </div>
            )}

            {/* Error Card */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="w-5 h-5" />
                  <p className="font-medium">Build Failed</p>
                </div>
                <p className="text-sm text-red-500 mt-1">{error}</p>
                <button
                  onClick={() => {
                    setError(null);
                    setBuildStatus("idle");
                    setSteps([]);
                  }}
                  className="mt-2 text-sm text-red-600 hover:underline"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Preview Section */}
        {result?.result?.article_content && (
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5 text-emerald-600" />
              Article Preview
            </h2>

            <div className="prose dark:prose-invert max-w-none">
              <h1>{result.result.article_title}</h1>
              {result.result.article_excerpt && (
                <p className="lead text-gray-500 dark:text-gray-400 italic">
                  {result.result.article_excerpt}
                </p>
              )}
              {result.result.image_result?.image_url && (
                <img
                  src={result.result.image_result.image_url}
                  alt={result.result.image_result.alt_text || "Hero image"}
                  className="w-full h-64 object-cover rounded-lg"
                />
              )}
              <div dangerouslySetInnerHTML={{ __html: result.result.article_content }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
