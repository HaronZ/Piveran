import { db } from "@/lib/db";
import {
  jobOrders, joStatuses,
  joMaterials, joMaterialStatuses,
  joLabors, joLaborStatuses, laborTypes, joLaborMechanics,
  joPayments, cashiers,
  customers, cars, mechanics,
  joPhotos, joComments,
} from "@/lib/db/schema/garage";
import { parts } from "@/lib/db/schema/vendor";
import { eq, sql, desc, asc } from "drizzle-orm";

// ─── Job Order Detail ───
export type JoDetailRow = {
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

export async function getJobOrderById(id: string): Promise<JoDetailRow | null> {
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
    .where(eq(jobOrders.id, id))
    .limit(1);

  return rows[0] || null;
}

// ─── JO Materials ───
export type JoMaterialRow = {
  id: string;
  joId: string;
  partId: string | null;
  partName: string | null;
  partNumber: string | null;
  price: string | null;
  quantity: number | null;
  totalPrice: string | null;
  discount: string | null;
  finalPrice: string | null;
  statusId: number | null;
  statusName: string | null;
  providedInhouse: boolean | null;
  includeInTotal: boolean | null;
  comment: string | null;
  date: string | null;
};

export async function getJoMaterials(joId: string): Promise<JoMaterialRow[]> {
  return db
    .select({
      id: joMaterials.id,
      joId: joMaterials.joId,
      partId: joMaterials.partId,
      partName: parts.name,
      partNumber: parts.partNumber,
      price: joMaterials.price,
      quantity: joMaterials.quantity,
      totalPrice: joMaterials.totalPrice,
      discount: joMaterials.discount,
      finalPrice: joMaterials.finalPrice,
      statusId: joMaterials.statusId,
      statusName: joMaterialStatuses.status,
      providedInhouse: joMaterials.providedInhouse,
      includeInTotal: joMaterials.includeInTotal,
      comment: joMaterials.comment,
      date: sql<string>`${joMaterials.date}`.as("mat_date"),
    })
    .from(joMaterials)
    .leftJoin(parts, eq(joMaterials.partId, parts.id))
    .leftJoin(joMaterialStatuses, eq(joMaterials.statusId, joMaterialStatuses.id))
    .where(eq(joMaterials.joId, joId))
    .orderBy(desc(joMaterials.createdAt));
}

// ─── JO Labors ───
export type JoLaborRow = {
  id: string;
  joId: string;
  laborTypeId: string | null;
  laborTypeName: string | null;
  price: string | null;
  discount: string | null;
  totalPrice: string | null;
  statusId: number | null;
  statusName: string | null;
  targetDate: string | null;
  comment: string | null;
};

export async function getJoLabors(joId: string): Promise<JoLaborRow[]> {
  return db
    .select({
      id: joLabors.id,
      joId: joLabors.joId,
      laborTypeId: joLabors.laborTypeId,
      laborTypeName: laborTypes.name,
      price: joLabors.price,
      discount: joLabors.discount,
      totalPrice: joLabors.totalPrice,
      statusId: joLabors.statusId,
      statusName: joLaborStatuses.status,
      targetDate: joLabors.targetDate,
      comment: joLabors.comment,
    })
    .from(joLabors)
    .leftJoin(laborTypes, eq(joLabors.laborTypeId, laborTypes.id))
    .leftJoin(joLaborStatuses, eq(joLabors.statusId, joLaborStatuses.id))
    .where(eq(joLabors.joId, joId))
    .orderBy(desc(joLabors.createdAt));
}

// ─── JO Payments ───
export type JoPaymentRow = {
  id: string;
  joId: string;
  orNumber: string | null;
  siNumber: string | null;
  amountPaid: string;
  datePaid: string | null;
  cashierId: string | null;
  cashierName: string | null;
  comment: string | null;
};

export async function getJoPayments(joId: string): Promise<JoPaymentRow[]> {
  return db
    .select({
      id: joPayments.id,
      joId: joPayments.joId,
      orNumber: joPayments.orNumber,
      siNumber: joPayments.siNumber,
      amountPaid: joPayments.amountPaid,
      datePaid: joPayments.datePaid,
      cashierId: joPayments.cashierId,
      cashierName: sql<string>`concat_ws(' ', ${cashiers.firstName}, ${cashiers.lastName})`.as("cashier_name"),
      comment: joPayments.comment,
    })
    .from(joPayments)
    .leftJoin(cashiers, eq(joPayments.cashierId, cashiers.id))
    .where(eq(joPayments.joId, joId))
    .orderBy(desc(joPayments.createdAt));
}

// ─── Lookup Data ───
export type LaborTypeRow = { id: string; name: string; defaultPrice: string | null };
export type JoMaterialStatusRow = { id: number; status: string };
export type JoLaborStatusRow = { id: number; status: string };
export type CashierRow = { id: string; name: string };

export async function getLaborTypes(): Promise<LaborTypeRow[]> {
  return db
    .select({
      id: laborTypes.id,
      name: laborTypes.name,
      defaultPrice: laborTypes.defaultPrice,
    })
    .from(laborTypes)
    .orderBy(asc(laborTypes.name));
}

export async function getJoMaterialStatuses(): Promise<JoMaterialStatusRow[]> {
  return db.select().from(joMaterialStatuses);
}

export async function getJoLaborStatuses(): Promise<JoLaborStatusRow[]> {
  return db.select().from(joLaborStatuses);
}

export async function getCashiers(): Promise<CashierRow[]> {
  const rows = await db
    .select({
      id: cashiers.id,
      name: sql<string>`concat_ws(' ', ${cashiers.firstName}, ${cashiers.lastName})`.as("name"),
    })
    .from(cashiers);
  return rows;
}

// ─── JO Labor Mechanics ───
export type JoLaborMechanicRow = {
  id: string;
  joLaborId: string;
  mechanicId: string;
  mechanicName: string;
};

export async function getJoLaborMechanics(joId: string): Promise<JoLaborMechanicRow[]> {
  return db
    .select({
      id: joLaborMechanics.id,
      joLaborId: joLaborMechanics.joLaborId,
      mechanicId: joLaborMechanics.mechanicId,
      mechanicName: sql<string>`concat_ws(' ', ${mechanics.firstName}, ${mechanics.lastName})`.as("mech_name"),
    })
    .from(joLaborMechanics)
    .innerJoin(joLabors, eq(joLaborMechanics.joLaborId, joLabors.id))
    .innerJoin(mechanics, eq(joLaborMechanics.mechanicId, mechanics.id))
    .where(eq(joLabors.joId, joId));
}

// ─── JO Photos ───
export type JoPhotoRow = {
  id: string;
  joId: string;
  photoUrl: string;
  comment: string | null;
  createdAt: string | null;
};

export async function getJoPhotos(joId: string): Promise<JoPhotoRow[]> {
  return db
    .select({
      id: joPhotos.id,
      joId: joPhotos.joId,
      photoUrl: joPhotos.photoUrl,
      comment: joPhotos.comment,
      createdAt: sql<string>`${joPhotos.createdAt}`.as("photo_created_at"),
    })
    .from(joPhotos)
    .where(eq(joPhotos.joId, joId))
    .orderBy(desc(joPhotos.createdAt));
}

// ─── JO Comments ───
export type JoCommentRow = {
  id: string;
  joId: string;
  commentFrom: string | null;
  comment: string;
  createdAt: string | null;
};

export async function getJoComments(joId: string): Promise<JoCommentRow[]> {
  return db
    .select({
      id: joComments.id,
      joId: joComments.joId,
      commentFrom: joComments.commentFrom,
      comment: joComments.comment,
      createdAt: sql<string>`${joComments.createdAt}`.as("comment_created_at"),
    })
    .from(joComments)
    .where(eq(joComments.joId, joId))
    .orderBy(desc(joComments.createdAt));
}
