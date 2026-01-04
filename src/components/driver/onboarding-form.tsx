"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input-field";
import { toast } from "@/components/ui/use-toast";
import {
  driverProfileSchema,
  type DriverProfileInput,
} from "@/lib/validation/driver";

const DEFAULT_VALUES: DriverProfileInput = {
  full_name: "",
  phone: "",
  vehicle_make: "",
  vehicle_model: "",
  vehicle_color: "",
  license_plate: "",
};

type DriverOnboardingFormProps = {
  initialValues?: Partial<DriverProfileInput>;
};

type FieldErrors = Partial<Record<keyof DriverProfileInput, string>>;

export function DriverOnboardingForm({ initialValues }: DriverOnboardingFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<DriverProfileInput>({
    ...DEFAULT_VALUES,
    ...initialValues,
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const title = useMemo(
    () => (initialValues?.full_name ? "Update your driver profile" : "Complete your driver profile"),
    [initialValues?.full_name],
  );

  const handleChange = (field: keyof DriverProfileInput, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const parsed = driverProfileSchema.safeParse(values);

    if (!parsed.success) {
      const nextErrors: FieldErrors = {};
      parsed.error.errors.forEach((issue) => {
        const key = issue.path[0] as keyof DriverProfileInput | undefined;
        if (key) {
          nextErrors[key] = issue.message;
        }
      });
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/driver/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error?.message ?? "Unable to update profile.");
      }

      toast({
        title: "Profile saved",
        description: "Your driver profile is ready."
      });
      router.push("/driver/dashboard");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to update profile.";
      toast({
        title: "Profile update failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Add the details we need to keep deliveries on schedule.
        </p>
      </div>

      <div className="space-y-4">
        <InputField
          label="Full name"
          required
          value={values.full_name}
          onChange={(event) => handleChange("full_name", event.target.value)}
          error={errors.full_name}
        />
        <InputField
          label="Phone number"
          required
          value={values.phone}
          onChange={(event) => handleChange("phone", event.target.value)}
          error={errors.phone}
          helperText="Use a US phone number like (555) 123-4567."
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-base font-semibold text-foreground">Vehicle details (optional)</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <InputField
            label="Make"
            value={values.vehicle_make}
            onChange={(event) => handleChange("vehicle_make", event.target.value)}
            error={errors.vehicle_make}
          />
          <InputField
            label="Model"
            value={values.vehicle_model}
            onChange={(event) => handleChange("vehicle_model", event.target.value)}
            error={errors.vehicle_model}
          />
          <InputField
            label="Color"
            value={values.vehicle_color}
            onChange={(event) => handleChange("vehicle_color", event.target.value)}
            error={errors.vehicle_color}
          />
          <InputField
            label="License plate"
            value={values.license_plate}
            onChange={(event) => handleChange("license_plate", event.target.value)}
            error={errors.license_plate}
          />
        </div>
      </div>

      <Button type="submit" className="h-11" disabled={isSubmitting}>
        {isSubmitting ? "Saving profile..." : "Save profile"}
      </Button>
    </form>
  );
}
