import { ComingSoonPage } from "@/components/coming-soon-page";
import { Car } from "lucide-react";

export const metadata = {
  title: "Cars | Sir Keith Auto Parts & Garage",
};

export default function CarsPage() {
  return (
    <ComingSoonPage
      title="Cars"
      description="Manage vehicle records linked to customers."
      icon={<Car className="h-10 w-10 text-amber-500" />}
    />
  );
}
