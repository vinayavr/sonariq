"use client";

import { FormEvent, useState } from "react";
import { FormField, inputClass } from "@/components/FormField";
import { PageHeader } from "@/components/PageHeader";
import { previewSegment } from "@/services/segments";
import type { SegmentPreviewRequest, SegmentPreviewResponse } from "@/types/api";

type SegmentFormState = {
  city: string;
  recent_signup_days: string;
  lifetime_spend_greater_than: string;
  dormant_days: string;
  minimum_order_count: string;
  recent_product_purchase: string;
};

const initialState: SegmentFormState = {
  city: "",
  recent_signup_days: "",
  lifetime_spend_greater_than: "",
  dormant_days: "",
  minimum_order_count: "",
  recent_product_purchase: "",
};

export default function SegmentationPage() {
  const [form, setForm] = useState(initialState);
  const [result, setResult] = useState<SegmentPreviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      setResult(await previewSegment(toSegmentRequest(form)));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const plainLanguageExplanation = buildPlainLanguageExplanation(form);

  return (
    <>
      <PageHeader
        eyebrow="Segmentation"
        title="Preview audiences before you launch"
        description="Combine behavioral and profile filters to estimate audience size and inspect how the segment was built."
      />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <form onSubmit={onSubmit} className="rounded border border-ink/10 bg-white p-5 shadow-soft">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="City">
              <input
                className={inputClass}
                value={form.city}
                onChange={(event) => setForm({ ...form, city: event.target.value })}
                placeholder="Chennai"
              />
            </FormField>
            <FormField label="Recent signup days">
              <input
                className={inputClass}
                type="number"
                min="0"
                value={form.recent_signup_days}
                onChange={(event) =>
                  setForm({ ...form, recent_signup_days: event.target.value })
                }
              />
            </FormField>
            <FormField label="Lifetime spend greater than">
              <input
                className={inputClass}
                type="number"
                min="0"
                value={form.lifetime_spend_greater_than}
                onChange={(event) =>
                  setForm({ ...form, lifetime_spend_greater_than: event.target.value })
                }
                placeholder="5000"
              />
            </FormField>
            <FormField label="Dormant days">
              <input
                className={inputClass}
                type="number"
                min="0"
                value={form.dormant_days}
                onChange={(event) => setForm({ ...form, dormant_days: event.target.value })}
              />
            </FormField>
            <FormField label="Minimum order count">
              <input
                className={inputClass}
                type="number"
                min="0"
                value={form.minimum_order_count}
                onChange={(event) =>
                  setForm({ ...form, minimum_order_count: event.target.value })
                }
              />
            </FormField>
            <FormField label="Recent product purchase">
              <input
                className={inputClass}
                value={form.recent_product_purchase}
                onChange={(event) =>
                  setForm({ ...form, recent_product_purchase: event.target.value })
                }
                placeholder="Running shoes"
              />
            </FormField>
          </div>

          <button
            className="mt-5 h-11 rounded bg-leaf px-5 text-sm font-semibold text-white transition hover:bg-leaf/90 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Previewing..." : "Preview Segment"}
          </button>
          {error ? <p className="mt-4 text-sm text-coral">{error}</p> : null}
        </form>

        <section className="rounded border border-ink/10 bg-white p-5 shadow-soft">
          <p className="text-sm font-medium text-ink/60">Audience Count</p>
          <p className="mt-2 text-5xl font-semibold text-ink">{result?.audience_count ?? 0}</p>
          <div className="mt-6 rounded bg-mint/60 p-3">
            <p className="text-sm font-semibold text-ink">Plain Language Segment</p>
            <p className="mt-2 text-sm text-ink/70">{plainLanguageExplanation}</p>
          </div>
          <div className="mt-6">
            <p className="text-sm font-semibold text-ink">Explanations</p>
            <ul className="mt-3 grid gap-2">
              {(result?.explanation.length
                ? result.explanation
                : ["Choose filters and click Preview Segment to estimate audience size."]
              ).map((item) => (
                <li key={item} className="rounded bg-cloud px-3 py-2 text-sm text-ink/70">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </>
  );
}

function toSegmentRequest(form: SegmentFormState): SegmentPreviewRequest {
  return removeEmpty({
    city: form.city.trim() || undefined,
    recent_signup_days: toNumber(form.recent_signup_days),
    lifetime_spend_greater_than: toNumber(form.lifetime_spend_greater_than),
    dormant_days: toNumber(form.dormant_days),
    minimum_order_count: toNumber(form.minimum_order_count),
    recent_product_purchase: form.recent_product_purchase.trim() || undefined,
  });
}

function toNumber(value: string) {
  return value === "" ? undefined : Number(value);
}

function removeEmpty<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined && entry !== ""),
  ) as T;
}

function buildPlainLanguageExplanation(form: SegmentFormState) {
  const parts: string[] = [];

  if (form.lifetime_spend_greater_than) {
    parts.push(
      `high-value customers who have spent more than ${currency.format(
        Number(form.lifetime_spend_greater_than),
      )}`,
    );
  }
  if (form.city.trim()) {
    parts.push(`${form.city.trim()} customers`);
  }
  if (form.recent_signup_days) {
    parts.push(`customers who signed up in the last ${form.recent_signup_days} days`);
  }
  if (form.dormant_days) {
    parts.push(`customers inactive for at least ${form.dormant_days} days`);
  }
  if (form.minimum_order_count) {
    parts.push(`customers with at least ${form.minimum_order_count} orders`);
  }
  if (form.recent_product_purchase.trim()) {
    parts.push(`customers who recently bought ${form.recent_product_purchase.trim()}`);
  }

  if (!parts.length) {
    return "This segment is not filtered yet. Choose filters and click Preview Segment to estimate audience size.";
  }

  return `This segment targets ${joinParts(parts)}.`;
}

function joinParts(parts: string[]) {
  if (parts.length === 1) {
    return parts[0];
  }

  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});
