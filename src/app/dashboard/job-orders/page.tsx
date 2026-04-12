import { ComingSoonPage } from "@/components/coming-soon-page";
import { Wrench } from "lucide-react";

export const metadata = {
  title: "Job Orders | Sir Keith Auto Parts & Garage",
};

export default function JobOrdersPage() {
  return (
    <ComingSoonPage
      title="Job Orders"
      description="Manage job orders, labor, materials, and payment tracking."
      icon={<Wrench className="h-10 w-10 text-amber-500" />}
    />
  );
}
