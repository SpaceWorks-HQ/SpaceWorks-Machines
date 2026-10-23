import type { Metadata } from "next";
import { Wallet } from "lucide-react";
import { loadPaymentsView } from "@/lib/views/app__dashboard__spaceSlug__payments__page";
import { ComingSoon } from "@/components/dashboard/space/ComingSoon";

export const metadata: Metadata = { title: "Payments", robots: { index: false, follow: false } };

export default async function PaymentsPage({ params }: { params: Promise<{ spaceSlug: string }> }) {
  const { space } = await loadPaymentsView({ params });
  return (
    <ComingSoon space={space} title="Payments" description="Money taken for jobs, online and offline." icon={<Wallet />} heading="Payments for jobs arrive in a later release">
      Gateway settings are ready under Space settings, Payments. Job payments, offline confirmation and refunds are coming in Phase 3.
    </ComingSoon>
  );
}
