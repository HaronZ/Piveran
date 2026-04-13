import { db } from "@/lib/db";
import { jobOrders, joStatuses, customers, cars } from "@/lib/db/schema/garage";
import { eq, sql, desc } from "drizzle-orm";

export type JobOrderRow = {
  id: string;
  joNumber: string;
  customerId: string | null;
  customerName: string | null;
  carId: string | null;
  carLabel: string | null;
  statusId: number | null;
  statusName: string | null;
  checkinDate: string | null;
  checkoutDate: string | null;
  discount: string | null;
  comment: string | null;
  createdAt: string | null;
};

export async function getJobOrders(): Promise<JobOrderRow[]> {
  const rows = await db
    .select({
      id: jobOrders.id,
      joNumber: jobOrders.joNumber,
      customerId: jobOrders.customerId,
      customerName: sql<string>`concat_ws(' ', ${customers.firstName}, ${customers.lastName})`.as("customer_name"),
      carId: jobOrders.carId,
      carLabel: sql<string>`concat_ws(' ', ${cars.make}, ${cars.model}, ${cars.plateNumber})`.as("car_label"),
      statusId: jobOrders.statusId,
      statusName: joStatuses.status,
      checkinDate: sql<string>`${jobOrders.checkinDate}`.as("checkin_date"),
      checkoutDate: sql<string>`${jobOrders.checkoutDate}`.as("checkout_date"),
      discount: jobOrders.discount,
      comment: jobOrders.comment,
      createdAt: sql<string>`${jobOrders.createdAt}`.as("created_at"),
    })
    .from(jobOrders)
    .leftJoin(customers, eq(jobOrders.customerId, customers.id))
    .leftJoin(cars, eq(jobOrders.carId, cars.id))
    .leftJoin(joStatuses, eq(jobOrders.statusId, joStatuses.id))
    .orderBy(desc(jobOrders.createdAt));

  return rows;
}

export type JoStatusRow = { id: number; status: string };

export async function getJoStatuses(): Promise<JoStatusRow[]> {
  return db.select().from(joStatuses);
}
