"use client";

/**
 * Word Document Importer Component
 *
 * Allows users to upload .docx files and import content
 * into the BlockNote editor with formatting preserved.
 */

import { useState, useCallback, useRef } from "react";
import {
  Upload,
  FileText,
  X,
  AlertCircle,
  CheckCircle,
  Loader2,
  FileWarning,
} from "lucide-react";
import {
  convertWordToBlocks,
  isValidWordDocument,
  formatFileSize,
  WordConversionResult,
} from "@/lib/word-converter";
import { PartialBlock } from "@blocknote/core";

interface WordImporterProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (blocks: PartialBlock[]) => void;
  apiBase: string;
}

type ImportStatus = "idle" | "validating" | "converting" | "success" | "error";

export function WordImporter({ isOpen, onClose, onImport, apiBase }: WordImporterProps) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<ImportStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [result, setResult] = useState<WordConversionResult | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state
  const reset = useCallback(() => {
    setFile(null);
    setStatus("idle");
    setError(null);
    setWarnings([]);
    setResult(null);
  }, []);

  // Handle file selection
  const handleFileSelect = useCallback(async (selectedFile: File) => {
    reset();
    setFile(selectedFile);

    // Validate file
    setStatus("validating");
    if (!isValidWordDocument(selectedFile)) {
      setStatus("error");
      setError("Please select a valid Word document (.docx or .doc file)");
      return;
    }

    // Convert file
    setStatus("converting");
    try {
      const conversionResult = await convertWordToBlocks(selectedFile, apiBase);
      setResult(conversionResult);
      setWarnings(conversionResult.warnings);
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed to convert document");
    }
  }, [apiBase, reset]);

  // Handle file input change
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        handleFileSelect(selectedFile);
      }
    },
    [handleFileSelect]
  );

  // Handle drag events
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        handleFileSelect(droppedFile);
      }
    },
    [handleFileSelect]
  );

  // Handle import confirmation
  const handleImport = useCallback(() => {
    if (result?.blocks) {
      onImport(result.blocks);
      reset();
      onClose();
    }
  }, [result, onImport, reset, onClose]);

  // Handle close
  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            Import Word Document
          </h2>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Drop Zone */}
          {status === "idle" || status === "error" ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragOver
                  ? "border-emerald-400 bg-emerald-50"
                  : "border-gray-300 hover:border-emerald-400 hover:bg-gray-50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
                onChange={handleInputChange}
                className="hidden"
              />
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 mb-2">
                Drag and drop your Word document here, or{" "}
                <span className="text-emerald-600 font-medium">browse</span>
              </p>
              <p className="text-sm text-gray-400">Supports .docx and .doc files</p>
            </div>
          ) : null}

          {/* Processing State */}
          {(status === "validating" || status === "converting") && file && (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 mx-auto mb-4 text-emerald-600 animate-spin" />
              <p className="text-gray-600 mb-2">
                {status === "validating" ? "Validating document..." : "Converting document..."}
              </p>
              <p className="text-sm text-gray-400">
                {file.name} ({formatFileSize(file.size)})
              </p>
            </div>
          )}

          {/* Error State */}
          {status === "error" && error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-800 font-medium">Import Failed</p>
                  <p className="text-sm text-red-600 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Success State */}
          {status === "success" && result && file && (
            <div className="space-y-4">
              {/* Success message */}
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-green-800 font-medium">Document Ready to Import</p>
                    <p className="text-sm text-green-600 mt-1">
                      {file.name} ({formatFileSize(file.size)})
                    </p>
                  </div>
                </div>
              </div>

              {/* Conversion stats */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">{result.blocks.length}</p>
                  <p className="text-xs text-gray-500">Content blocks</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">{result.images.length}</p>
                  <p className="text-xs text-gray-500">Images found</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">{warnings.length}</p>
                  <p className="text-xs text-gray-500">Warnings</p>
                </div>
              </div>

              {/* Warnings */}
              {warnings.length > 0 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <FileWarning className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-yellow-800 font-medium">Conversion Warnings</p>
                      <ul className="text-sm text-yellow-600 mt-1 space-y-1">
                        {warnings.slice(0, 3).map((warning, i) => (
                          <li key={i}>• {warning}</li>
                        ))}
                        {warnings.length > 3 && (
                          <li>• ...and {warnings.length - 3} more warnings</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Preview hint */}
              <p className="text-xs text-gray-400 text-center">
                The imported content will replace the current editor content
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          {status === "success" && result && (
            <button
              onClick={handleImport}
              className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Import Content
            </button>
          )}
          {(status === "idle" || status === "error") && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Select File
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default WordImporter;
