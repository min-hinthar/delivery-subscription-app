import Link from "next/link";

import { Card } from "@/components/ui/card";

type PlaceholderPageProps = {
  title: string;
  description: string;
  actions?: Array<{ label: string; href: string }>;
};

export function PlaceholderPage({ title, description, actions }: PlaceholderPageProps) {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-foreground">{title}</h1>
        <p className="text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      <Card className="space-y-4">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          This is a scaffolded page. Wire up live data, auth guards, and actions here.
        </p>
        {actions?.length ? (
          <div className="flex flex-wrap gap-3">
            {actions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="text-sm font-medium text-slate-900 underline-offset-4 hover:underline dark:text-slate-100"
              >
                {action.label}
              </Link>
            ))}
          </div>
        ) : null}
      </Card>
    </div>
  );
}
