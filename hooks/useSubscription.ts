"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface Subscription {
  id: string;
  plan_id: string;
  status: string;
  billing_cycle: string;
  current_period_end: string | null;
  razorpay_subscription_id: string;
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSubscription() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .in("status", ["active", "created"])
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      setSubscription(data);
      setLoading(false);
    }

    fetchSubscription();
  }, []);

  const isPro = subscription?.plan_id === "pro" && subscription?.status === "active";
  const isStarter = subscription?.plan_id === "starter" && subscription?.status === "active";
  const hasActivePlan = subscription?.status === "active";

  return { subscription, loading, isPro, isStarter, hasActivePlan };
}