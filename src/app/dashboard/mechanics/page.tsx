import { ComingSoonPage } from "@/components/coming-soon-page";
import { HardHat } from "lucide-react";

export const metadata = {
  title: "Mechanics | Sir Keith Auto Parts & Garage",
};

export default function MechanicsPage() {
  return (
    <ComingSoonPage
      title="Mechanics"
      description="Manage mechanic profiles, labor rates, and assignments."
      icon={<HardHat className="h-10 w-10 text-amber-500" />}
    />
  );
}
