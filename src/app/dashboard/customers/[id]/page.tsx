import { notFound } from "next/navigation";
import Link from "next/link";
import { getCustomerById } from "@/lib/db/queries/customers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Phone,
  Mail,
  Cake,
  Car,
  Calendar,
} from "lucide-react";
import { CustomerDetailClient } from "@/components/customer-detail-client";
import { CustomerPhotosSection } from "@/components/customer-photos-section";
import { EmptyState } from "@/components/empty-state";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CustomerDetailPage({ params }: Props) {
  const { id } = await params;
  const customer = await getCustomerById(id);

  if (!customer) return notFound();

  const fullName = [
    customer.firstName,
    customer.middleName,
    customer.lastName,
    customer.suffix,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        href="/dashboard/customers"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Customers
      </Link>

      {/* Profile Card */}
      <Card className="border-border/40 bg-card/60 backdrop-blur-md overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-blue-500 to-cyan-500" />
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-6">
            {/* Avatar */}
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500 text-2xl font-bold">
              {customer.firstName.charAt(0)}
              {customer.lastName ? customer.lastName.charAt(0) : ""}
            </div>

            {/* Info */}
            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-2xl font-bold">{fullName}</h1>
                {customer.nickName && (
                  <p className="text-sm text-muted-foreground">
                    aka &ldquo;{customer.nickName}&rdquo;
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {customer.primaryContact && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{customer.primaryContact}</span>
                  </div>
                )}
                {customer.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{customer.email}</span>
                  </div>
                )}
                {customer.birthday && (
                  <div className="flex items-center gap-2 text-sm">
                    <Cake className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {new Date(customer.birthday).toLocaleDateString("en-PH", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Meta */}
            <div className="text-xs text-muted-foreground space-y-1">
              {customer.createdAt && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3 w-3" />
                  Added {new Date(customer.createdAt).toLocaleDateString("en-PH")}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contacts & Addresses — Interactive */}
      <CustomerDetailClient
        customerId={customer.id}
        contacts={customer.contacts}
        addresses={customer.addresses}
      />

      {/* Photos */}
      <CustomerPhotosSection
        customerId={customer.id}
        photos={customer.photos}
      />

      {/* Linked Cars */}
      <Card className="border-border/40 bg-card/60 backdrop-blur-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Car className="h-4 w-4 text-teal-500" />
            Vehicles
            <Badge
              variant="secondary"
              className="bg-teal-500/10 text-teal-500 border-teal-500/20 text-[10px]"
            >
              {customer.cars.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {customer.cars.length === 0 ? (
            <EmptyState
              icon={Car}
              title="No vehicles linked"
              description="Cars assigned to this customer will appear here."
              iconClassName="bg-teal-500/10 text-teal-500"
            />
          ) : (
            <div className="rounded-lg border border-border/40 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/40 hover:bg-transparent">
                    <TableHead>Plate #</TableHead>
                    <TableHead>Make</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead className="hidden sm:table-cell">Year</TableHead>
                    <TableHead className="hidden sm:table-cell">Color</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customer.cars.map((car) => (
                    <TableRow
                      key={car.id}
                      className="border-border/40 hover:bg-teal-500/5"
                    >
                      <TableCell className="font-mono font-semibold text-sm">
                        {car.plateNumber || "—"}
                      </TableCell>
                      <TableCell className="text-sm">{car.make || "—"}</TableCell>
                      <TableCell className="text-sm">{car.model || "—"}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {car.year || "—"}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {car.color ? (
                          <div className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded-full border border-border/40"
                              style={{ backgroundColor: car.color.toLowerCase() }}
                            />
                            <span className="text-sm text-muted-foreground">
                              {car.color}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
