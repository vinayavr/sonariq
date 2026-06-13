"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { MetricCard } from "@/components/MetricCard";
import { getAnalyticsOverview } from "@/services/analytics";
import type { AnalyticsOverview } from "@/types/api";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default function DashboardPage() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAnalyticsOverview()
      .then(setOverview)
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <>
      <PageHeader
        eyebrow="Dashboard"
        title="Marketing performance at a glance"
        description="Track customer scale, order activity, campaign volume, and revenue attribution from the CRM engine."
      />

      {error ? <StatusMessage tone="error" message={error} /> : null}
      {!overview && !error ? <StatusMessage message="Loading dashboard..." /> : null}

      {overview ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard label="Total Customers" value={overview.total_customers} tone="leaf" />
          <MetricCard label="Total Orders" value={overview.total_orders} />
          <MetricCard label="Total Campaigns" value={overview.total_campaigns} tone="gold" />
          <MetricCard label="Total Revenue" value={currency.format(overview.total_revenue)} />
          <MetricCard
            label="Attributed Revenue"
            value={currency.format(overview.attributed_revenue)}
            tone="coral"
          />
        </section>
      ) : null}
    </>
  );
}

function StatusMessage({
  message,
  tone = "default",
}: {
  message: string;
  tone?: "default" | "error";
}) {
  return (
    <div
      className={`rounded border p-4 text-sm ${
        tone === "error"
          ? "border-coral/30 bg-coral/10 text-coral"
          : "border-ink/10 bg-white text-ink/65"
      }`}
    >
      {message}
    </div>
  );
}
