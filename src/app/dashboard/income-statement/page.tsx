import { ComingSoonPage } from "@/components/coming-soon-page";
import { FileBarChart } from "lucide-react";

export const metadata = {
  title: "Income Statement | Sir Keith Auto Parts & Garage",
};

export default function IncomeStatementPage() {
  return (
    <ComingSoonPage
      title="Income Statement"
      description="View revenue, expenses, and profit reports."
      icon={<FileBarChart className="h-10 w-10 text-amber-500" />}
    />
  );
}
