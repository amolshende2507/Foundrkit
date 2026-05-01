"use client";

import { useSubscription } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function CurrentPlan() {
  const { subscription, loading } = useSubscription();
  const [cancelling, setCancelling] = useState(false);

  async function handleCancel() {
    if (!confirm("Cancel at end of billing period?")) return;
    setCancelling(true);
    try {
      await fetch("/api/payments/cancel-subscription", { method: "POST" });
      window.location.reload();
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return <div className="animate-pulse bg-slate-100 rounded-2xl h-32" />;
  }

  if (!subscription || subscription.status !== "active") {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center">
        <p className="text-slate-500 text-sm mb-4">You are on the free plan</p>
        <Button onClick={() => (window.location.href = "/dashboard/settings/billing")}>
          Upgrade now
        </Button>
      </div>
    );
  }

  const planLabel =
    subscription.plan_id.charAt(0).toUpperCase() + subscription.plan_id.slice(1);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg font-bold text-slate-900">{planLabel} Plan</span>
            <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">
              Active
            </span>
          </div>
          <p className="text-sm text-slate-500 capitalize">{subscription.billing_cycle} billing</p>
          {subscription.current_period_end && (
            <p className="text-xs text-slate-400 mt-1">
              Renews {new Date(subscription.current_period_end).toLocaleDateString("en-IN")}
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          disabled={cancelling}
          className="text-red-500 hover:bg-red-50 hover:text-red-600"
        >
          {cancelling ? "Cancelling..." : "Cancel plan"}
        </Button>
      </div>
    </div>
  );
}