"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// Requires: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local
// Enable "Places API" in Google Cloud Console for this key.

const SCRIPT_ID = "google-places-script";

function loadGoogleMaps(): Promise<void> {
  return new Promise((resolve) => {
    if ((window as any).google?.maps?.places) {
      resolve();
      return;
    }
    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      return;
    }
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    document.head.appendChild(script);
  });
}

interface Prediction {
  description: string;
  place_id: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
}

export function AddressAutocomplete({
  value,
  onChange,
  placeholder = "123 Rue de la Paix, 75000 Paris",
  className,
  id,
  disabled,
}: AddressAutocompleteProps) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [open, setOpen] = useState(false);
  const serviceRef = useRef<any>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadGoogleMaps().then(() => {
      if ((window as any).google?.maps?.places) {
        serviceRef.current = new (window as any).google.maps.places.AutocompleteService();
      }
    });
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);

    if (val.length > 2 && serviceRef.current) {
      serviceRef.current.getPlacePredictions(
        { input: val, types: ["address"], language: "fr" },
        (preds: any[] | null) => {
          setPredictions(preds ?? []);
          setOpen((preds?.length ?? 0) > 0);
        }
      );
    } else {
      setPredictions([]);
      setOpen(false);
    }
  };

  const handleSelect = (description: string) => {
    onChange(description);
    setPredictions([]);
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <input
        id={id}
        type="text"
        value={value}
        onChange={handleChange}
        onFocus={() => predictions.length > 0 && setOpen(true)}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        className={cn(
          "flex h-10 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-sm text-[var(--brand-dark)]",
          "placeholder:text-gray-400",
          "focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)] focus:border-transparent",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "transition-all duration-150",
          className
        )}
      />

      {open && predictions.length > 0 && (
        <ul className="absolute z-50 top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {predictions.map((pred) => (
            <li
              key={pred.place_id}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(pred.description);
              }}
              className="px-4 py-2.5 text-sm text-[var(--brand-dark)] hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 truncate"
            >
              {pred.description}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
