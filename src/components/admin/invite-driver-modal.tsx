"use client";

import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input-field";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";

export type InviteDriverPayload = {
  id: string;
  email: string;
  status: string;
  invited_at: string | null;
};

type InviteDriverModalProps = {
  open: boolean;
  onClose: () => void;
  onInvited: (driver: InviteDriverPayload) => void;
};

export function InviteDriverModal({ open, onClose, onInvited }: InviteDriverModalProps) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const emailRef = useRef<HTMLInputElement | null>(null);

  const resetForm = () => {
    setEmail("");
    setMessage("");
    setError(null);
  };

  const handleClose = () => {
    if (isSubmitting) {
      return;
    }
    resetForm();
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    if (!email) {
      setError("Email is required.");
      emailRef.current?.focus();
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/drivers/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, message: message || undefined }),
      });

      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error?.message ?? "Unable to invite driver.");
      }

      onInvited({
        id: payload.data.driver_id,
        email,
        status: "pending",
        invited_at: payload.data.invited_at ?? null,
      });

      toast({
        title: "Invite sent",
        description: `A driver invite was sent to ${email}.`,
      });

      resetForm();
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to invite driver.";
      setError(message);
      toast({
        title: "Invite failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Invite driver"
      description="Send a magic link invite to a new driver."
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <InputField
          label="Driver email"
          type="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setError(null);
          }}
          error={error ?? undefined}
          ref={emailRef}
          required
        />
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Optional message
          </label>
          <Textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Welcome to the team!"
          />
        </div>
        <div className="flex flex-wrap justify-end gap-3">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Send invite
          </Button>
        </div>
      </form>
    </Modal>
  );
}
