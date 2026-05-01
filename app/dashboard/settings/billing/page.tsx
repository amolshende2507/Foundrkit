import PricingTable from "@/components/pricing/PricingTable";
import CurrentPlan from "@/components/billing/CurrentPlan";

export default function BillingPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Billing & Plans</h1>
        <p className="text-slate-500 mt-1">
          Manage your subscription and upgrade your plan
        </p>
      </div>

      <div className="mb-10">
        <h2 className="text-base font-semibold text-slate-700 mb-4">
          Current Plan
        </h2>
        <CurrentPlan />
      </div>

      <div>
        <h2 className="text-base font-semibold text-slate-700 mb-4">
          Available Plans
        </h2>
        <PricingTable />
      </div>
    </div>
  );
}