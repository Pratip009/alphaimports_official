"use client";
import { useEffect, useState } from "react";

export interface LatestTestimonial {
  _id: string;
  comment: string;
  name?: string;
}

const CACHE_TTL_MS = 5 * 60 * 1000;
let _cache: { item: LatestTestimonial | null; fetchedAt: number } | null = null;
let _promise: Promise<void> | null = null;

/** Newest visible testimonial, shared (one request) by the sidebar and the home page box. */
export function useLatestTestimonial() {
  const [item, setItem] = useState<LatestTestimonial | null>(() => _cache?.item ?? null);

  useEffect(() => {
    if (_cache && Date.now() - _cache.fetchedAt < CACHE_TTL_MS) return;
    let cancelled = false;
    _promise ??= fetch("/api/testimonials?limit=1")
      .then((r) => r.json())
      .then((res) => {
        const first = Array.isArray(res?.data) && res.data[0] ? res.data[0] : null;
        _cache = { item: first, fetchedAt: Date.now() };
      })
      .catch(() => {})
      .finally(() => {
        _promise = null;
      });
    _promise.then(() => {
      if (!cancelled) setItem(_cache?.item ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return item;
}

export function truncate(text: string, max: number) {
  return text.length > max ? text.slice(0, max).trimEnd() + " ..." : text;
}