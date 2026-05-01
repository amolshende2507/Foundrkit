import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Service role client — no user session needed for webhooks
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Get the event type and payment details
    const event = body?.event;
    const payment = body?.payload?.payment?.entity;

    if (!event || !payment) {
      return NextResponse.json({ received: true });
    }

    // Map Razorpay events to our status
    const statusMap: Record<string, string> = {
      "payment.captured": "active",
      "payment.failed": "failed",
    };

    const newStatus = statusMap[event];
    if (!newStatus) {
      return NextResponse.json({ received: true });
    }

    // Get user_id from payment notes
    const userId = payment.notes?.user_id;
    if (!userId) {
      return NextResponse.json({ received: true });
    }

    // Update subscription status
    await supabaseAdmin
      .from("subscriptions")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}