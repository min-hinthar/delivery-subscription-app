"use client";

import { useEffect, useMemo, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const MAX_UPLOAD_BYTES = 500 * 1024;
const MAX_DIMENSION = 1600;
const QUALITY_STEPS = [0.9, 0.8, 0.7, 0.6, 0.5];

type PhotoUploadProps = {
  stopId: string;
  value: string | null;
  disabled?: boolean;
  onUpload: (payload: { path: string; previewUrl: string }) => void;
  onError?: (message: string) => void;
  onUploadStateChange?: (isUploading: boolean) => void;
};

async function compressImage(file: File): Promise<Blob> {
  const imageBitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(imageBitmap.width, imageBitmap.height));
  const width = Math.round(imageBitmap.width * scale);
  const height = Math.round(imageBitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Unable to process image.");
  }
  context.drawImage(imageBitmap, 0, 0, width, height);

  for (const quality of QUALITY_STEPS) {
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );

    if (blob && blob.size <= MAX_UPLOAD_BYTES) {
      return blob;
    }

    if (blob && quality === QUALITY_STEPS[QUALITY_STEPS.length - 1]) {
      return blob;
    }
  }

  throw new Error("Unable to compress image.");
}

export function PhotoUpload({
  stopId,
  value,
  disabled,
  onUpload,
  onError,
  onUploadStateChange,
}: PhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!value) {
      setPreviewUrl(null);
      return;
    }
  }, [value]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const fileInputId = useMemo(() => `photo-upload-${stopId}`, [stopId]);

  const handleFile = async (file: File) => {
    setStatusMessage(null);
    if (file.size > 5 * 1024 * 1024) {
      const message = "Photo must be under 5MB before compression.";
      setStatusMessage(message);
      onError?.(message);
      return;
    }

    setIsUploading(true);
    onUploadStateChange?.(true);

    try {
      const compressed = await compressImage(file);
      if (compressed.size > MAX_UPLOAD_BYTES) {
        throw new Error("Compressed photo is still too large.");
      }

      const supabase = createSupabaseBrowserClient();
      const filePath = `route-stops/${stopId}/${Date.now()}.jpg`;

      const { error } = await supabase.storage.from("delivery-proofs").upload(filePath, compressed, {
        upsert: true,
        contentType: "image/jpeg",
      });

      if (error) {
        throw new Error("Photo upload failed. Try again or skip.");
      }

      const preview = URL.createObjectURL(compressed);
      setPreviewUrl(preview);
      onUpload({ path: filePath, previewUrl: preview });
      setStatusMessage("Photo uploaded (optimized under 500KB).");
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Photo upload failed.";
      setStatusMessage(message);
      onError?.(message);
    } finally {
      setIsUploading(false);
      onUploadStateChange?.(false);
    }
  };

  return (
    <div className="space-y-2">
      <label htmlFor={fileInputId} className="text-xs font-semibold text-slate-700 dark:text-slate-200">
        Proof of delivery photo (optional)
      </label>
      <input
        id={fileInputId}
        type="file"
        accept="image/*"
        disabled={disabled || isUploading}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void handleFile(file);
          }
        }}
        className={cn(
          "text-xs text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-slate-700 hover:file:bg-slate-200",
          "dark:text-slate-300 dark:file:bg-slate-800 dark:file:text-slate-200 dark:hover:file:bg-slate-700",
        )}
      />
      {previewUrl ? (
        <img
          src={previewUrl}
          alt="Uploaded delivery proof"
          className="max-h-36 w-full rounded-md border border-slate-200 object-cover dark:border-slate-800"
        />
      ) : null}
      {statusMessage ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">{statusMessage}</p>
      ) : null}
    </div>
  );
}
