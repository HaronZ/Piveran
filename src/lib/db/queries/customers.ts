import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export interface CustomerRow {
  id: string;
  firstName: string;
  lastName: string | null;
  middleName: string | null;
  nickName: string | null;
  suffix: string | null;
  birthday: string | null;
  primaryContact: string | null;
  email: string | null;
  carsCount: number;
  address: string | null;
  createdAt: string | null;
}

export interface CustomerDetailRow {
  id: string;
  firstName: string;
  lastName: string | null;
  middleName: string | null;
  nickName: string | null;
  suffix: string | null;
  birthday: string | null;
  primaryContact: string | null;
  email: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  addresses: {
    id: string;
    street: string | null;
    village: string | null;
    barangay: string | null;
    city: string | null;
    province: string | null;
    zipCode: string | null;
  }[];
  contacts: {
    id: string;
    contactNumber: string;
  }[];
  cars: {
    id: string;
    make: string | null;
    model: string | null;
    year: string | null;
    color: string | null;
    plateNumber: string | null;
  }[];
}

export interface CustomerSelectorRow {
  id: string;
  name: string;
}

export async function getCustomers(): Promise<CustomerRow[]> {
  const rows = await db.execute(sql`
    SELECT
      c.id,
      c.first_name    AS "firstName",
      c.last_name     AS "lastName",
      c.middle_name   AS "middleName",
      c.nick_name     AS "nickName",
      c.suffix,
      c.birthday,
      c.primary_contact AS "primaryContact",
      c.email,
      COALESCE(car_cnt.cnt, 0) AS "carsCount",
      addr.full_address AS "address",
      c.created_at AS "createdAt"
    FROM customers c
    LEFT JOIN LATERAL (
      SELECT COUNT(*)::int AS cnt
      FROM cars ca
      WHERE ca.primary_owner_id = c.id
    ) car_cnt ON true
    LEFT JOIN LATERAL (
      SELECT CONCAT_WS(', ',
        NULLIF(a.street, ''),
        NULLIF(a.barangay, ''),
        NULLIF(a.city, ''),
        NULLIF(a.province, '')
      ) AS full_address
      FROM customer_addresses a
      WHERE a.customer_id = c.id
      LIMIT 1
    ) addr ON true
    ORDER BY c.first_name ASC, c.last_name ASC
  `);

  return (rows as unknown as any[]).map((r: any) => ({
    id: r.id,
    firstName: r.firstName,
    lastName: r.lastName,
    middleName: r.middleName,
    nickName: r.nickName,
    suffix: r.suffix,
    birthday: r.birthday ? String(r.birthday) : null,
    primaryContact: r.primaryContact,
    email: r.email,
    carsCount: Number(r.carsCount),
    address: r.address || null,
    createdAt: r.createdAt ? String(r.createdAt) : null,
  }));
}

export async function getCustomerById(id: string): Promise<CustomerDetailRow | null> {
  // Main customer
  const custRows = await db.execute(sql`
    SELECT
      c.id,
      c.first_name    AS "firstName",
      c.last_name     AS "lastName",
      c.middle_name   AS "middleName",
      c.nick_name     AS "nickName",
      c.suffix,
      c.birthday,
      c.primary_contact AS "primaryContact",
      c.email,
      c.created_at AS "createdAt",
      c.updated_at AS "updatedAt"
    FROM customers c
    WHERE c.id = ${id}
    LIMIT 1
  `);

  const custArr = custRows as unknown as any[];
  if (custArr.length === 0) return null;
  const cust = custArr[0];

  // Addresses
  const addrRows = await db.execute(sql`
    SELECT id, street, village, barangay, city, province, zip_code AS "zipCode"
    FROM customer_addresses
    WHERE customer_id = ${id}
    ORDER BY created_at ASC
  `);

  // Contacts
  const contactRows = await db.execute(sql`
    SELECT id, contact_number AS "contactNumber"
    FROM customer_contacts
    WHERE customer_id = ${id}
    ORDER BY created_at ASC
  `);

  // Cars
  const carRows = await db.execute(sql`
    SELECT id, make, model, year, color, plate_number AS "plateNumber"
    FROM cars
    WHERE primary_owner_id = ${id}
    ORDER BY make ASC, model ASC
  `);

  return {
    id: cust.id,
    firstName: cust.firstName,
    lastName: cust.lastName,
    middleName: cust.middleName,
    nickName: cust.nickName,
    suffix: cust.suffix,
    birthday: cust.birthday ? String(cust.birthday) : null,
    primaryContact: cust.primaryContact,
    email: cust.email,
    createdAt: cust.createdAt ? String(cust.createdAt) : null,
    updatedAt: cust.updatedAt ? String(cust.updatedAt) : null,
    addresses: (addrRows as unknown as any[]).map((a: any) => ({
      id: a.id,
      street: a.street,
      village: a.village,
      barangay: a.barangay,
      city: a.city,
      province: a.province,
      zipCode: a.zipCode,
    })),
    contacts: (contactRows as unknown as any[]).map((c: any) => ({
      id: c.id,
      contactNumber: c.contactNumber,
    })),
    cars: (carRows as unknown as any[]).map((c: any) => ({
      id: c.id,
      make: c.make,
      model: c.model,
      year: c.year,
      color: c.color,
      plateNumber: c.plateNumber,
    })),
  };
}

export async function getCustomersForSelector(): Promise<CustomerSelectorRow[]> {
  const rows = await db.execute(sql`
    SELECT
      id,
      CONCAT_WS(' ', first_name, last_name) AS name
    FROM customers
    ORDER BY first_name ASC, last_name ASC
  `);

  return (rows as unknown as any[]).map((r: any) => ({
    id: r.id,
    name: r.name || r.id,
  }));
}
