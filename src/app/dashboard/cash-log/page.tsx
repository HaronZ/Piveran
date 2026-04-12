import { ComingSoonPage } from "@/components/coming-soon-page";
import { Wallet } from "lucide-react";

export const metadata = {
  title: "Cash Log | Sir Keith Auto Parts & Garage",
};

export default function CashLogPage() {
  return (
    <ComingSoonPage
      title="Cash Log"
      description="Track cash movements, expenses, and loan records."
      icon={<Wallet className="h-10 w-10 text-amber-500" />}
    />
  );
}
