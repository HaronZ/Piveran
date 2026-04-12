import { ComingSoonPage } from "@/components/coming-soon-page";
import { Users } from "lucide-react";

export const metadata = {
  title: "Customers | Sir Keith Auto Parts & Garage",
};

export default function CustomersPage() {
  return (
    <ComingSoonPage
      title="Customers"
      description="Manage customer profiles and contact information."
      icon={<Users className="h-10 w-10 text-amber-500" />}
    />
  );
}
