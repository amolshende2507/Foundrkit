"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: new (options: any) => { open: () => void };
  }
}

const plans = [
  {
    id: "starter",
    name: "Starter",
    monthly: 999,
    yearly: 9999,
    description: "For freelancers getting started",
    features: [
      "Up to 10 clients",
      "Basic proposals",
      "Email support",
      "Network access",
    ],
    cta: "Get Starter",
    highlighted: false,
  },
  {
    id: "pro",
    name: "Pro",
    monthly: 2499,
    yearly: 24999,
    description: "For growing freelancers and agencies",
    features: [
      "Unlimited clients",
      "AI-powered proposals",
      "Priority support",
      "Advanced analytics",
      "Custom branding",
      "Team access",
    ],
    cta: "Get Pro",
    highlighted: true,
  },
];

export default function PricingTable() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const { subscription } = useSubscription();

  async function handleSubscribe(planId: string) {
    setLoadingPlan(planId);
    try {
      const res = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, billing }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        order_id: data.orderId,
        name: "FoundrKit",
        description: `${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan — ${billing}`,
        theme: { color: "#0f172a" },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          const verifyRes = await fetch("/api/payments/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...response,
              planId,
              billing,
              amount: data.amount,
            }),
          });

          if (verifyRes.ok) {
            window.location.href = "/dashboard?upgraded=true";
          } else {
            alert("Payment verification failed. Contact support.");
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      alert("Something went wrong. Please try again.");
      console.error(err);
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Billing Toggle */}
      <div className="flex justify-center mb-10">
        <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
          <button
            onClick={() => setBilling("monthly")}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              billing === "monthly"
                ? "bg-white shadow text-slate-900"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling("yearly")}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              billing === "yearly"
                ? "bg-white shadow text-slate-900"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Yearly
            <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              Save 17%
            </span>
          </button>
        </div>
      </div>

      {/* Plan Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {plans.map((plan) => {
          const isCurrentPlan =
            subscription?.plan_id === plan.id &&
            subscription?.status === "active";
          const price =
            billing === "monthly" ? plan.monthly : plan.yearly;

          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl border p-8 flex flex-col ${
                plan.highlighted
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-900"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-bold mb-1">{plan.name}</h3>
                <p className={`text-sm ${plan.highlighted ? "text-slate-300" : "text-slate-500"}`}>
                  {plan.description}
                </p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold">
                  ₹{price.toLocaleString("en-IN")}
                </span>
                <span className={`text-sm ml-1 ${plan.highlighted ? "text-slate-300" : "text-slate-500"}`}>
                  /{billing === "monthly" ? "mo" : "yr"}
                </span>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check
                      size={15}
                      className={plan.highlighted ? "text-green-400" : "text-green-600"}
                    />
                    {feature}
                  </li>
                ))}
              </ul>

              {isCurrentPlan ? (
                <div className={`text-center py-2.5 rounded-xl text-sm font-medium border ${
                  plan.highlighted
                    ? "border-slate-600 text-slate-300"
                    : "border-slate-200 text-slate-400"
                }`}>
                  Current plan
                </div>
              ) : (
                <Button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={!!loadingPlan}
                  className={`w-full ${
                    plan.highlighted
                      ? "bg-white text-slate-900 hover:bg-slate-100"
                      : "bg-slate-900 text-white hover:bg-slate-800"
                  }`}
                >
                  {loadingPlan === plan.id ? "Loading..." : plan.cta}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}