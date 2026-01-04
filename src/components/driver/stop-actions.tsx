"use client";

import { useState } from "react";

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

const MAX_UPLOAD_SIZE_MB = 5;

export function StopActions({ stopId, status, driverNotes, photoUrl, onUpdate }: StopActionsProps) {
  const [notes, setNotes] = useState(driverNotes ?? "");
  const [photo, setPhoto] = useState(photoUrl ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  async function uploadPhoto(file: File) {
    setMessage(null);
    if (file.size > MAX_UPLOAD_SIZE_MB * 1024 * 1024) {
      setMessage(`Photo must be under ${MAX_UPLOAD_SIZE_MB}MB.`);
      return;
    }

    setIsUploading(true);
    const supabase = createSupabaseBrowserClient();
    const extension = file.name.split(".").pop() ?? "jpg";
    const filePath = `route-stops/${stopId}/${Date.now()}.${extension}`;

    const { error } = await supabase.storage.from("delivery-proofs").upload(filePath, file, {
      upsert: true,
      contentType: file.type,
    });

    if (error) {
      setMessage("Photo upload failed. Try again or skip.");
      setIsUploading(false);
      return;
    }

    const { data } = supabase.storage.from("delivery-proofs").getPublicUrl(filePath);
    setPhoto(data.publicUrl);
    setIsUploading(false);
  }

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
          photo_url: photo || null,
        }),
      });

      const payload = await response.json();
      if (!payload.ok) {
        setMessage(payload.error?.message ?? "Unable to update stop.");
        setIsSaving(false);
        return;
      }

      onUpdate({ status: nextStatus, driverNotes: notes || null, photoUrl: photo || null });
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

      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
          Proof of delivery photo (optional)
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void uploadPhoto(file);
            }
          }}
          className="text-xs text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-slate-700 hover:file:bg-slate-200 dark:text-slate-300 dark:file:bg-slate-800 dark:file:text-slate-200 dark:hover:file:bg-slate-700"
        />
        {photo ? (
          <a
            href={photo}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-300"
          >
            View uploaded photo
          </a>
        ) : null}
      </div>

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
