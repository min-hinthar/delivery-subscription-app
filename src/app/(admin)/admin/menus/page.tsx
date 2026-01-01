"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  ChefHat,
  Loader2,
  Pencil,
  Plus,
  RefreshCcw,
  Save,
  Trash2,
} from "lucide-react";

import { LogoutButton } from "@/components/auth/logout-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { formatDateYYYYMMDD, getUpcomingWeekStarts, PT_TIME_ZONE } from "@/lib/scheduling";
import { cn } from "@/lib/utils";

type WeeklyMenuItem = {
  id: string;
  weekly_menu_id: string;
  name: string;
  description: string | null;
  price_cents: number;
  sort_order: number;
};

type WeeklyMenu = {
  id: string;
  week_of: string;
  title: string | null;
  is_published: boolean;
  published_at: string | null;
  weekly_menu_items?: WeeklyMenuItem[];
};

type MealCatalogItem = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  is_active: boolean;
};

type ApiResponse<T> = {
  ok: boolean;
  data?: T;
  error?: { message: string };
};

const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

const inputClasses =
  "h-11 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

async function apiFetch<T>(url: string, options?: RequestInit) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });
  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null;
  if (!payload?.ok) {
    const message = payload?.error?.message ?? "Something went wrong.";
    throw new Error(message);
  }
  return payload.data as T;
}

function formatWeekLabel(weekOf: string) {
  const date = new Date(`${weekOf}T00:00:00Z`);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: PT_TIME_ZONE,
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

type ModalProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: (props: { closeButtonRef: RefObject<HTMLButtonElement | null> }) => React.ReactNode;
};

function Modal({ open, title, description, onClose, children }: ModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    previousFocusRef.current = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity motion-reduce:transition-none"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative z-10 w-full max-w-2xl rounded-2xl bg-white shadow-xl transition-transform motion-reduce:transition-none dark:bg-slate-950"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            {description ? (
              <p className="text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
          <Button
            type="button"
            variant="ghost"
            className="h-10 w-10 rounded-full p-0"
            onClick={onClose}
            ref={closeButtonRef}
          >
            ✕
          </Button>
        </div>
        <div className="px-6 py-5">{children({ closeButtonRef })}</div>
      </div>
    </div>
  );
}

export default function AdminMenusPage() {
  const { toast } = useToast();
  const weekOptions = useMemo(() => {
    return getUpcomingWeekStarts(6).map((date) => ({
      value: formatDateYYYYMMDD(date),
      label: formatWeekLabel(formatDateYYYYMMDD(date)),
    }));
  }, []);
  const [selectedWeek, setSelectedWeek] = useState(weekOptions[0]?.value ?? "");
  const [menu, setMenu] = useState<WeeklyMenu | null>(null);
  const [items, setItems] = useState<WeeklyMenuItem[]>([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);
  const [isSavingMenu, setIsSavingMenu] = useState(false);
  const [isCreatingMenu, setIsCreatingMenu] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [catalogItems, setCatalogItems] = useState<MealCatalogItem[]>([]);
  const [catalogQuery, setCatalogQuery] = useState("");
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);
  const [editingItem, setEditingItem] = useState<WeeklyMenuItem | null>(null);
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);
  const [customForm, setCustomForm] = useState({
    name: "",
    description: "",
    price: "",
  });

  const selectedWeekLabel = useMemo(() => {
    const match = weekOptions.find((option) => option.value === selectedWeek);
    return match?.label ?? selectedWeek;
  }, [selectedWeek, weekOptions]);

  const filteredCatalog = useMemo(() => {
    const query = catalogQuery.trim().toLowerCase();
    if (!query) {
      return catalogItems;
    }
    return catalogItems.filter((item) =>
      `${item.name} ${item.description ?? ""}`.toLowerCase().includes(query),
    );
  }, [catalogItems, catalogQuery]);

  useEffect(() => {
    if (!selectedWeek) {
      return;
    }
    void loadMenu();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWeek]);

  async function loadMenu() {
    setIsLoadingMenu(true);
    try {
      const data = await apiFetch<{ menu: WeeklyMenu | null }>(
        `/api/admin/weekly-menus?week_of=${encodeURIComponent(selectedWeek)}`,
      );
      setMenu(data.menu ?? null);
      setItems(data.menu?.weekly_menu_items ?? []);
      setTitleDraft(data.menu?.title ?? "");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load menu.";
      toast({ title: "Menu load failed", description: message, variant: "destructive" });
      setMenu(null);
      setItems([]);
    } finally {
      setIsLoadingMenu(false);
    }
  }

  async function handleCreateMenu() {
    if (!selectedWeek) {
      return;
    }
    setIsCreatingMenu(true);
    try {
      const data = await apiFetch<{ menu: WeeklyMenu }>("/api/admin/weekly-menus", {
        method: "POST",
        body: JSON.stringify({
          week_of: selectedWeek,
          title: `Weekly Menu · Week of ${selectedWeek}`,
        }),
      });
      setMenu(data.menu);
      setItems(data.menu.weekly_menu_items ?? []);
      setTitleDraft(data.menu.title ?? "");
      toast({ title: "Weekly menu created" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create menu.";
      toast({ title: "Menu create failed", description: message, variant: "destructive" });
    } finally {
      setIsCreatingMenu(false);
    }
  }

  async function handleTitleBlur() {
    if (!menu || titleDraft.trim() === "" || titleDraft === menu.title) {
      return;
    }
    setIsSavingMenu(true);
    try {
      const data = await apiFetch<{ menu: WeeklyMenu }>("/api/admin/weekly-menus/update", {
        method: "PATCH",
        body: JSON.stringify({
          menu_id: menu.id,
          title: titleDraft.trim(),
        }),
      });
      setMenu(data.menu);
      setTitleDraft(data.menu.title ?? "");
      toast({ title: "Menu title saved" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save title.";
      toast({ title: "Save failed", description: message, variant: "destructive" });
      setTitleDraft(menu.title ?? "");
    } finally {
      setIsSavingMenu(false);
    }
  }

  async function handlePublishToggle(value: boolean) {
    if (!menu) {
      return;
    }
    setIsSavingMenu(true);
    try {
      const data = await apiFetch<{ menu: WeeklyMenu }>("/api/admin/weekly-menus/update", {
        method: "PATCH",
        body: JSON.stringify({
          menu_id: menu.id,
          is_published: value,
        }),
      });
      setMenu(data.menu);
      toast({
        title: value ? "Menu published" : "Menu unpublished",
        description: value ? "The menu is now visible on the homepage." : "The menu is hidden.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update publish state.";
      toast({ title: "Publish update failed", description: message, variant: "destructive" });
    } finally {
      setIsSavingMenu(false);
    }
  }

  async function handleAddCustomItem() {
    if (!menu) {
      return;
    }
    const priceValue = Number.parseFloat(customForm.price);
    if (!customForm.name.trim() || Number.isNaN(priceValue)) {
      toast({
        title: "Missing details",
        description: "Enter a name and price for the custom item.",
        variant: "destructive",
      });
      return;
    }
    setIsSavingMenu(true);
    try {
      const data = await apiFetch<{ items: WeeklyMenuItem[] }>("/api/admin/weekly-menu-items", {
        method: "POST",
        body: JSON.stringify({
          weekly_menu_id: menu.id,
          name: customForm.name.trim(),
          description: customForm.description.trim() || null,
          price_cents: Math.round(priceValue * 100),
        }),
      });
      setItems(data.items);
      setCustomForm({ name: "", description: "", price: "" });
      setShowCustomModal(false);
      toast({ title: "Custom item added" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to add item.";
      toast({ title: "Add failed", description: message, variant: "destructive" });
    } finally {
      setIsSavingMenu(false);
    }
  }

  async function handleAddCatalogItem(itemId: string) {
    if (!menu) {
      return;
    }
    setPendingItemId(itemId);
    try {
      const data = await apiFetch<{ items: WeeklyMenuItem[] }>("/api/admin/weekly-menu-items", {
        method: "POST",
        body: JSON.stringify({
          weekly_menu_id: menu.id,
          meal_item_id: itemId,
        }),
      });
      setItems(data.items);
      toast({ title: "Catalog item added" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to add catalog item.";
      toast({ title: "Add failed", description: message, variant: "destructive" });
    } finally {
      setPendingItemId(null);
    }
  }

  async function handleUpdateItem(updated: WeeklyMenuItem) {
    setIsSavingMenu(true);
    try {
      const data = await apiFetch<{ items: WeeklyMenuItem[] }>("/api/admin/weekly-menu-items/update", {
        method: "PATCH",
        body: JSON.stringify({
          item_id: updated.id,
          name: updated.name,
          description: updated.description,
          price_cents: updated.price_cents,
        }),
      });
      setItems(data.items);
      setEditingItem(null);
      toast({ title: "Item updated" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update item.";
      toast({ title: "Update failed", description: message, variant: "destructive" });
    } finally {
      setIsSavingMenu(false);
    }
  }

  async function handleDeleteItem(itemId: string) {
    setPendingItemId(itemId);
    try {
      const data = await apiFetch<{ items: WeeklyMenuItem[] }>("/api/admin/weekly-menu-items/update", {
        method: "DELETE",
        body: JSON.stringify({ item_id: itemId }),
      });
      setItems(data.items);
      toast({ title: "Item removed" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to delete item.";
      toast({ title: "Delete failed", description: message, variant: "destructive" });
    } finally {
      setPendingItemId(null);
    }
  }

  async function handleReorder(itemId: string, direction: "up" | "down") {
    if (!menu) {
      return;
    }
    setPendingItemId(itemId);
    try {
      const data = await apiFetch<{ items: WeeklyMenuItem[] }>("/api/admin/weekly-menu-items/reorder", {
        method: "POST",
        body: JSON.stringify({
          weekly_menu_id: menu.id,
          item_id: itemId,
          direction,
        }),
      });
      setItems(data.items);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to reorder item.";
      toast({ title: "Reorder failed", description: message, variant: "destructive" });
    } finally {
      setPendingItemId(null);
    }
  }

  async function handleOpenCatalog() {
    setShowCatalogModal(true);
    if (catalogItems.length > 0 || isLoadingCatalog) {
      return;
    }
    setIsLoadingCatalog(true);
    try {
      const data = await apiFetch<{ meals: MealCatalogItem[] }>("/api/admin/meals");
      setCatalogItems(data.meals ?? []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load catalog.";
      toast({ title: "Catalog load failed", description: message, variant: "destructive" });
    } finally {
      setIsLoadingCatalog(false);
    }
  }

  const menuReady = Boolean(menu);

  return (
    <div className="space-y-6">
      <Card className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-br from-white via-slate-50 to-emerald-50/70 dark:from-slate-950 dark:via-slate-900/70 dark:to-emerald-950/30">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-300">
            <ChefHat className="h-4 w-4" aria-hidden="true" />
            Weekly menus
          </div>
          <h1 className="text-2xl font-semibold">Chef-curated weekly menus</h1>
          <p className="text-sm text-muted-foreground">
            Build the weekly lineup, reorder items, and publish to the homepage.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm transition hover:-translate-y-0.5 hover:border-border/80 hover:bg-muted hover:shadow-md motion-reduce:transition-none motion-reduce:hover:transform-none"
          >
            Back to dashboard
          </Link>
          <LogoutButton />
        </div>
      </Card>

      <Card className="space-y-5 p-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-[220px]">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Week of
            </label>
            <select
              className={inputClasses}
              value={selectedWeek}
              onChange={(event) => setSelectedWeek(event.target.value)}
            >
              {weekOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <Button
            type="button"
            variant="secondary"
            className="gap-2"
            onClick={loadMenu}
            disabled={isLoadingMenu}
          >
            {isLoadingMenu ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
            Load menu
          </Button>
          <Button
            type="button"
            className="gap-2"
            onClick={handleCreateMenu}
            disabled={menuReady || isCreatingMenu}
          >
            {isCreatingMenu ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Create menu
          </Button>
          <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
            <span className="rounded-full border border-border px-3 py-1 text-xs font-semibold">
              {selectedWeekLabel}
            </span>
          </div>
        </div>

        {!menuReady ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/20 p-5 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">No menu created for this week yet.</p>
            <p className="mt-1">
              Click &quot;Create menu&quot; to start building the chef-curated lineup for{" "}
              {selectedWeekLabel}.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Menu title
                </label>
                <input
                  className={inputClasses}
                  value={titleDraft}
                  onChange={(event) => setTitleDraft(event.target.value)}
                  onBlur={handleTitleBlur}
                  placeholder="Weekly menu title"
                  disabled={isSavingMenu}
                />
                <p className="text-xs text-muted-foreground">
                  Title saves on blur. Use a short, descriptive menu name.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/20 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">Publish menu</p>
                  <p className="text-xs text-muted-foreground">
                    Toggle to show this menu on the homepage.
                  </p>
                </div>
                <label className="ml-auto flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    className="h-5 w-5 accent-primary"
                    checked={menu?.is_published ?? false}
                    onChange={(event) => handlePublishToggle(event.target.checked)}
                    disabled={isSavingMenu}
                  />
                  {menu?.is_published ? "Published" : "Draft"}
                </label>
              </div>
            </div>

            <div className="space-y-3 rounded-lg border border-border bg-muted/10 p-4">
              <p className="text-sm font-semibold text-foreground">Menu actions</p>
              <Button type="button" className="w-full gap-2" onClick={() => setShowCustomModal(true)}>
                <Plus className="h-4 w-4" />
                Add custom item
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="w-full gap-2"
                onClick={handleOpenCatalog}
              >
                <ChefHat className="h-4 w-4" />
                Add from catalog
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full gap-2"
                onClick={loadMenu}
                disabled={isLoadingMenu}
              >
                <RefreshCcw className="h-4 w-4" />
                Refresh menu items
              </Button>
            </div>
          </div>
        )}
      </Card>

      {menuReady ? (
        <Card className="space-y-4 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Weekly menu items</h2>
              <p className="text-sm text-muted-foreground">
                Reorder items and make quick edits before publishing.
              </p>
            </div>
            <span className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-muted-foreground">
              {items.length} items
            </span>
          </div>
          {items.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-5 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">No items yet.</p>
              <p className="mt-1">
                Add catalog or custom dishes to build this week&apos;s menu.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-border bg-background p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:transform-none"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{item.name}</p>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                          #{item.sort_order}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {priceFormatter.format(item.price_cents / 100)}
                      </p>
                      {item.description ? (
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-9 w-9 rounded-full p-0"
                        onClick={() => handleReorder(item.id, "up")}
                        disabled={index === 0 || pendingItemId === item.id}
                        aria-label="Move item up"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-9 w-9 rounded-full p-0"
                        onClick={() => handleReorder(item.id, "down")}
                        disabled={index === items.length - 1 || pendingItemId === item.id}
                        aria-label="Move item down"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-9 w-9 rounded-full p-0"
                        onClick={() => setEditingItem(item)}
                        aria-label="Edit item"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className={cn(
                          "h-9 w-9 rounded-full p-0 text-rose-500 hover:text-rose-600",
                          pendingItemId === item.id ? "opacity-60" : "",
                        )}
                        onClick={() => handleDeleteItem(item.id)}
                        disabled={pendingItemId === item.id}
                        aria-label="Delete item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      ) : null}

      <Modal
        open={showCustomModal}
        title="Add custom menu item"
        description="Create a special dish that is unique to this weekly menu."
        onClose={() => setShowCustomModal(false)}
      >
        {() => (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Item name
              </label>
              <input
                className={inputClasses}
                value={customForm.name}
                onChange={(event) => setCustomForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Custom dish name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Description
              </label>
              <Textarea
                value={customForm.description}
                onChange={(event) => setCustomForm((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="Optional details for customers"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Price (USD)
              </label>
              <input
                className={inputClasses}
                type="number"
                step="0.01"
                min="0"
                value={customForm.price}
                onChange={(event) => setCustomForm((prev) => ({ ...prev, price: event.target.value }))}
                placeholder="12.00"
              />
            </div>
            <div className="flex flex-wrap items-center justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setShowCustomModal(false)}>
                Cancel
              </Button>
              <Button type="button" className="gap-2" onClick={handleAddCustomItem} disabled={isSavingMenu}>
                {isSavingMenu ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Add item
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={showCatalogModal}
        title="Add from catalog"
        description="Pick an active meal item and copy it into this weekly menu."
        onClose={() => setShowCatalogModal(false)}
      >
        {() => (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Search catalog
              </label>
              <input
                className={inputClasses}
                value={catalogQuery}
                onChange={(event) => setCatalogQuery(event.target.value)}
                placeholder="Search by name or description"
              />
            </div>
            {isLoadingCatalog ? (
              <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading catalog…
              </div>
            ) : (
              <div className="max-h-[360px] space-y-3 overflow-y-auto pr-2">
                {filteredCatalog.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                    No catalog items found.
                  </div>
                ) : (
                  filteredCatalog.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-border bg-background p-4"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {priceFormatter.format(item.price_cents / 100)}
                        </p>
                        {item.description ? (
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        ) : null}
                      </div>
                      <Button
                        type="button"
                        className="gap-2"
                        onClick={() => handleAddCatalogItem(item.id)}
                        disabled={pendingItemId === item.id}
                      >
                        {pendingItemId === item.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                        Add
                      </Button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(editingItem)}
        title="Edit menu item"
        description="Update the item details for this weekly menu."
        onClose={() => setEditingItem(null)}
      >
        {() =>
          editingItem ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Item name
                </label>
                <input
                  className={inputClasses}
                  value={editingItem.name}
                  onChange={(event) =>
                    setEditingItem((prev) =>
                      prev ? { ...prev, name: event.target.value } : prev,
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Description
                </label>
                <Textarea
                  value={editingItem.description ?? ""}
                  onChange={(event) =>
                    setEditingItem((prev) =>
                      prev ? { ...prev, description: event.target.value } : prev,
                    )
                  }
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Price (USD)
                </label>
                <input
                  className={inputClasses}
                  type="number"
                  step="0.01"
                  min="0"
                  value={(editingItem.price_cents / 100).toFixed(2)}
                  onChange={(event) =>
                    setEditingItem((prev) => {
                      if (!prev) {
                        return prev;
                      }
                      const parsed = Number.parseFloat(event.target.value);
                      return Number.isNaN(parsed)
                        ? prev
                        : { ...prev, price_cents: Math.round(parsed * 100) };
                    })
                  }
                />
              </div>
              <div className="flex flex-wrap items-center justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setEditingItem(null)}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="gap-2"
                  onClick={() => handleUpdateItem(editingItem)}
                  disabled={isSavingMenu}
                >
                  {isSavingMenu ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save changes
                </Button>
              </div>
            </div>
          ) : null
        }
      </Modal>
    </div>
  );
}
