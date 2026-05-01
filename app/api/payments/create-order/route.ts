import { NextRequest, NextResponse } from "next/server";
import { razorpay } from "@/lib/razorpay";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const PLAN_PRICES = {
  starter: { monthly: 99900, yearly: 999900 },   // in paise
  pro:     { monthly: 249900, yearly: 2499900 },
};

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { planId, billing } = await req.json();

    if (!PLAN_PRICES[planId as keyof typeof PLAN_PRICES]) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const amount = PLAN_PRICES[planId as keyof typeof PLAN_PRICES][billing as "monthly" | "yearly"];

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `receipt_${user.id.slice(0, 8)}_${Date.now()}`,
      notes: {
        user_id: user.id,
        plan_id: planId,
        billing_cycle: billing,
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Create order error:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}