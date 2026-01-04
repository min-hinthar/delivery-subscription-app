"use client";

import { useEffect, useState } from "react";

import { PhotoUpload } from "@/components/driver/photo-upload";
import { ButtonV2 } from "@/components/ui/button-v2";
import { Textarea } from "@/components/ui/textarea";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type StopActionsProps = {
  stopId: string;
  status: string;
  driverNotes: string | null;
  photoUrl: string | null;
  onUpdate: (update: { status: string; driverNotes: string | null; photoUrl: string | null }) => void;
};

export function StopActions({ stopId, status, driverNotes, photoUrl, onUpdate }: StopActionsProps) {
  const [notes, setNotes] = useState(driverNotes ?? "");
  const [photoPath, setPhotoPath] = useState(photoUrl ?? "");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!photoPath) {
      setPhotoPreview(null);
      return;
    }

    if (photoPath.startsWith("http")) {
      setPhotoPreview(photoPath);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    supabase.storage
      .from("delivery-proofs")
      .createSignedUrl(photoPath, 60 * 60)
      .then(({ data, error }) => {
        if (error || !data?.signedUrl) {
          return;
        }
        setPhotoPreview(data.signedUrl);
      })
      .catch(() => undefined);
  }, [photoPath]);

  async function submitUpdate(nextStatus: string) {
    setIsSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/driver/stops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stop_id: stopId,
          status: nextStatus,
          driver_notes: notes || null,
          photo_url: photoPath || null,
        }),
      });

      const payload = await response.json();
      if (!payload.ok) {
        setMessage(payload.error?.message ?? "Unable to update stop.");
        setIsSaving(false);
        return;
      }

      onUpdate({ status: nextStatus, driverNotes: notes || null, photoUrl: photoPath || null });
      setMessage(nextStatus === "completed" ? "Marked delivered." : "Issue logged.");
    } catch {
      setMessage("Unable to update stop. Try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-slate-200/70 bg-white/80 p-4 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/40">
      <div>
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
          Driver notes
        </label>
        <Textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Add delivery notes (optional)"
          className="mt-2 min-h-[90px] text-sm"
        />
      </div>

      <PhotoUpload
        stopId={stopId}
        value={photoPath || null}
        disabled={isSaving || status === "completed"}
        onUpload={({ path, previewUrl }) => {
          setPhotoPath(path);
          setPhotoPreview(previewUrl);
        }}
        onError={(errorMessage) => setMessage(errorMessage)}
        onUploadStateChange={setIsUploading}
      />

      {photoPreview ? (
        <a
          href={photoPreview}
          target="_blank"
          rel="noreferrer"
          className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-300"
        >
          View uploaded photo
        </a>
      ) : null}

      {message ? (
        <p className="rounded-md bg-slate-100 px-3 py-2 text-xs text-slate-600 dark:bg-slate-900 dark:text-slate-300">
          {message}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <ButtonV2
          type="button"
          size="sm"
          disabled={isSaving || isUploading || status === "completed"}
          onClick={() => void submitUpdate("completed")}
        >
          Mark delivered
        </ButtonV2>
        <ButtonV2
          type="button"
          variant="outline"
          size="sm"
          disabled={isSaving || isUploading}
          onClick={() => void submitUpdate("issue")}
        >
          Report issue
        </ButtonV2>
        {isUploading ? (
          <span className="text-xs text-slate-500 dark:text-slate-400">Uploading…</span>
        ) : null}
      </div>
    </div>
  );
}
