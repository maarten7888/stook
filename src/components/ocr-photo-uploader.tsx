"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, Upload, Loader2, AlertCircle, CheckCircle, X } from "lucide-react";

interface OcrPhotoUploaderProps {
  onOcrComplete: (result: { rawText: string; path: string; confidence: number }) => void;
  onError: (error: string) => void;
}

type UploadStatus = "idle" | "uploading" | "processing" | "complete" | "error";

interface StatusState {
  status: UploadStatus;
  message: string;
  progress?: number;
}

export function OcrPhotoUploader({ onOcrComplete, onError }: OcrPhotoUploaderProps) {
  const [state, setState] = useState<StatusState>({ status: "idle", message: "" });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const resetState = useCallback(() => {
    setState({ status: "idle", message: "" });
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
  }, [previewUrl]);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];

    // Valideer bestand
    if (!file.type.startsWith("image/")) {
      onError("Selecteer een afbeelding (JPG, PNG of WebP)");
      return;
    }

    const maxSize = 8 * 1024 * 1024; // 8MB
    if (file.size > maxSize) {
      onError("De afbeelding is te groot. Maximum grootte is 8MB.");
      return;
    }

    // Preview tonen
    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);

    try {
      // Stap 1: Presign URL ophalen
      setState({ status: "uploading", message: "Uploaden...", progress: 25 });

      const presignResponse = await fetch("/api/import/photo/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
        }),
      });

      if (!presignResponse.ok) {
        const error = await presignResponse.json();
        throw new Error(error.error || "Kon geen upload URL genereren");
      }

      const { path, signedUrl, token } = await presignResponse.json();

      // Stap 2: Upload naar Storage
      setState({ status: "uploading", message: "Uploaden...", progress: 50 });

      const uploadResponse = await fetch(signedUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
          ...(token ? { "x-upsert": "true" } : {}),
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error("Upload mislukt");
      }

      // Stap 3: OCR uitvoeren
      setState({ status: "processing", message: "Tekst herkennen...", progress: 75 });

      const ocrResponse = await fetch("/api/import/photo/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      });

      if (!ocrResponse.ok) {
        const error = await ocrResponse.json();
        throw new Error(error.error || "OCR mislukt");
      }

      const ocrResult = await ocrResponse.json();

      // Succes!
      setState({ status: "complete", message: "Tekst herkend!", progress: 100 });

      onOcrComplete({
        rawText: ocrResult.rawText,
        path,
        confidence: ocrResult.confidence,
      });
    } catch (error) {
      console.error("OCR error:", error);
      setState({ 
        status: "error", 
        message: error instanceof Error ? error.message : "Er is een fout opgetreden" 
      });
      onError(error instanceof Error ? error.message : "Er is een fout opgetreden");
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCameraInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }
  };

  const isProcessing = state.status === "uploading" || state.status === "processing";

  return (
    <Card className="bg-coals border-ash">
      <div className="p-6 space-y-4">
        {/* Status indicator */}
        {state.status !== "idle" && (
          <div className={`flex items-center gap-3 p-4 rounded-lg ${
            state.status === "error" ? "bg-red-500/10 border border-red-500/20" :
            state.status === "complete" ? "bg-green-500/10 border border-green-500/20" :
            "bg-ember/10 border border-ember/20"
          }`}>
            {isProcessing && (
              <Loader2 className="h-5 w-5 text-ember animate-spin" />
            )}
            {state.status === "error" && (
              <AlertCircle className="h-5 w-5 text-red-500" />
            )}
            {state.status === "complete" && (
              <CheckCircle className="h-5 w-5 text-green-500" />
            )}
            <div className="flex-1">
              <p className={`text-sm font-medium ${
                state.status === "error" ? "text-red-400" :
                state.status === "complete" ? "text-green-400" :
                "text-ash"
              }`}>
                {state.message}
              </p>
              {isProcessing && state.progress && (
                <div className="mt-2 h-1.5 bg-charcoal rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-ember transition-all duration-300"
                    style={{ width: `${state.progress}%` }}
                  />
                </div>
              )}
            </div>
            {(state.status === "error" || state.status === "complete") && (
              <button 
                onClick={resetState}
                className="p-1 hover:bg-white/10 rounded"
              >
                <X className="h-4 w-4 text-smoke" />
              </button>
            )}
          </div>
        )}

        {/* Preview */}
        {previewUrl && (
          <div className="relative aspect-video max-h-64 rounded-lg overflow-hidden bg-charcoal">
            <img
              src={previewUrl}
              alt="Foto preview"
              className="w-full h-full object-contain"
            />
          </div>
        )}

        {/* Upload area */}
        {state.status === "idle" && !previewUrl && (
          <div 
            className="border-2 border-dashed border-ash rounded-lg p-8 text-center hover:border-ember transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera className="h-12 w-12 mx-auto text-smoke mb-4" />
            <p className="text-ash font-medium mb-2">
              Maak een foto of selecteer een afbeelding
            </p>
            <p className="text-smoke text-sm">
              Ondersteunt JPG, PNG en WebP tot 8MB
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 flex-wrap">
          <Button
            type="button"
            variant="outline"
            onClick={() => cameraInputRef.current?.click()}
            disabled={isProcessing}
            className="border-ember text-ember hover:bg-ember hover:text-white flex-1 sm:flex-none"
          >
            <Camera className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Maak foto</span>
            <span className="sm:hidden">Camera</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="border-ash text-ash hover:bg-coals flex-1 sm:flex-none"
          >
            <Upload className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Kies bestand</span>
            <span className="sm:hidden">Bestand</span>
          </Button>

          {(previewUrl || state.status !== "idle") && state.status !== "complete" && (
            <Button
              type="button"
              variant="ghost"
              onClick={resetState}
              disabled={isProcessing}
              className="text-smoke hover:text-ash"
            >
              Opnieuw
            </Button>
          )}
        </div>

        {/* Hidden inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileInputChange}
          className="hidden"
        />
        
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          onChange={handleCameraInputChange}
          className="hidden"
        />

        {/* Tips */}
        <div className="text-smoke text-xs space-y-1 pt-2 border-t border-ash">
          <p>💡 <strong>Tips voor beste resultaten:</strong></p>
          <ul className="list-disc list-inside space-y-0.5 ml-4">
            <li>Zorg voor goede belichting</li>
            <li>Houd de camera stil en recht boven de tekst</li>
            <li>Gedrukte tekst werkt beter dan handgeschreven</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}

