"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Suggestion = {
  placeId: string;
  description: string;
  primary: string;
  secondary: string;
};

type AddressResult = {
  line1: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  formattedAddress: string;
};

type AddressAutocompleteProps = {
  onSelect: (result: AddressResult) => void;
  onStartManual?: () => void;
  className?: string;
};

export function AddressAutocomplete({ onSelect, onStartManual, className }: AddressAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRequestRef = useRef<AbortController | null>(null);

  const hasQuery = query.trim().length >= 3;
  const showSuggestions = expanded && (suggestions.length > 0 || isLoading || error);

  useEffect(() => {
    if (!hasQuery) {
      setSuggestions([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      if (activeRequestRef.current) {
        activeRequestRef.current.abort();
      }
      const controller = new AbortController();
      activeRequestRef.current = controller;
      setIsLoading(true);
      setError(null);

      fetch("/api/maps/places", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          mode: "search",
          query: query.trim(),
        }),
      })
        .then(async (response) => {
          const data = await response.json();
          if (!response.ok || !data.ok) {
            throw new Error(data?.error?.message || "Unable to fetch suggestions.");
          }
          return data.data as { predictions: Suggestion[] };
        })
        .then((data) => {
          setSuggestions(data.predictions ?? []);
        })
        .catch((err) => {
          if (err instanceof DOMException && err.name === "AbortError") {
            return;
          }
          setError(err instanceof Error ? err.message : "Unable to fetch suggestions.");
          setSuggestions([]);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }, 350);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (activeRequestRef.current) {
        activeRequestRef.current.abort();
      }
    };
  }, [hasQuery, query]);

  const helperText = useMemo(() => {
    if (!query) {
      return "Start typing your street address to see suggestions.";
    }
    if (!hasQuery) {
      return "Enter at least 3 characters to search.";
    }
    if (isLoading) {
      return "Searching addresses...";
    }
    if (error) {
      return error;
    }
    if (suggestions.length === 0) {
      return "No matches found. You can enter the address manually.";
    }
    return "Select a suggestion to pre-fill your address.";
  }, [error, hasQuery, isLoading, query, suggestions.length]);

  const handleSelect = async (suggestion: Suggestion) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/maps/places", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "details",
          place_id: suggestion.placeId,
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data?.error?.message || "Unable to fetch address details.");
      }

      const { address, formatted_address } = data.data as {
        formatted_address: string;
        address: {
          line1: string | null;
          city: string | null;
          state: string | null;
          postal_code: string | null;
          country: string | null;
        };
      };

      onSelect({
        line1: address.line1 ?? "",
        city: address.city ?? "",
        state: address.state ?? "",
        postalCode: address.postal_code ?? "",
        country: address.country ?? "US",
        formattedAddress: formatted_address ?? suggestion.description,
      });
      setExpanded(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to fetch address details.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
        Search address
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setExpanded(true);
          }}
          onFocus={() => setExpanded(true)}
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus-visible:ring-slate-100"
          placeholder="Start typing your street address"
          autoComplete="street-address"
        />
      </label>
      <p className="text-xs text-slate-500 dark:text-slate-400">{helperText}</p>

      {showSuggestions ? (
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <ul className="max-h-48 divide-y divide-slate-100 overflow-y-auto text-sm dark:divide-slate-800">
            {suggestions.map((suggestion) => (
              <li key={suggestion.placeId}>
                <button
                  type="button"
                  onClick={() => handleSelect(suggestion)}
                  className="w-full px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-900"
                >
                  <span className="block font-medium text-slate-700 dark:text-slate-200">
                    {suggestion.primary}
                  </span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">
                    {suggestion.secondary || suggestion.description}
                  </span>
                </button>
              </li>
            ))}
            {isLoading ? (
              <li className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400">
                Searching addresses...
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}

      <div>
        <Button
          type="button"
          onClick={() => {
            setExpanded(false);
            onStartManual?.();
          }}
          className="bg-slate-200 text-slate-900 hover:shadow-md dark:bg-slate-800 dark:text-slate-100"
        >
          Enter address manually
        </Button>
      </div>
    </div>
  );
}
