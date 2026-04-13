import { db } from "@/lib/db";
import { users, roles, userRoles, roleViews, roleTables } from "@/lib/db/schema/security";
import { eq, sql, asc, desc } from "drizzle-orm";

// ─── Users with Roles ───
export type UserWithRolesRow = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  nickName: string | null;
  photoUrl: string | null;
  roles: string[];
  createdAt: string | null;
};

export async function getUsersWithRoles(): Promise<UserWithRolesRow[]> {
  // Get all users
  const allUsers = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      nickName: users.nickName,
      photoUrl: users.photoUrl,
      createdAt: sql<string>`${users.createdAt}`.as("created_at"),
    })
    .from(users)
    .orderBy(asc(users.email));

  // Get all user-role mappings
  const allUserRoles = await db
    .select({
      userId: userRoles.userId,
      roleName: roles.name,
    })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id));

  // Merge
  return allUsers.map((u) => ({
    ...u,
    roles: allUserRoles.filter((ur) => ur.userId === u.id).map((ur) => ur.roleName),
  }));
}

// ─── Roles with View Permissions ───
export type RoleWithViewsRow = {
  id: number;
  name: string;
  description: string | null;
  views: string[];
  userCount: number;
};

export async function getRolesWithViews(): Promise<RoleWithViewsRow[]> {
  const allRoles = await db
    .select({
      id: roles.id,
      name: roles.name,
      description: roles.description,
    })
    .from(roles)
    .orderBy(asc(roles.name));

  const allRoleViews = await db
    .select({
      roleId: roleViews.roleId,
      viewName: roleViews.viewName,
    })
    .from(roleViews);

  const allUserRoles = await db
    .select({
      roleId: userRoles.roleId,
      userId: userRoles.userId,
    })
    .from(userRoles);

  return allRoles.map((r) => ({
    ...r,
    views: allRoleViews.filter((rv) => rv.roleId === r.id).map((rv) => rv.viewName),
    userCount: allUserRoles.filter((ur) => ur.roleId === r.id).length,
  }));
}

// ─── All Roles (for selector) ───
export type RoleSelectorRow = { id: number; name: string };

export async function getRolesForSelector(): Promise<RoleSelectorRow[]> {
  return db
    .select({ id: roles.id, name: roles.name })
    .from(roles)
    .orderBy(asc(roles.name));
}

// ─── Available View Names (for checkbox UI) ───
export const AVAILABLE_VIEWS = [
  { value: "dashboard", label: "Dashboard" },
  { value: "parts", label: "Parts" },
  { value: "vendors", label: "Vendors" },
  { value: "purchase-requests", label: "Purchase Requests" },
  { value: "stock-log", label: "Stock Log" },
  { value: "job-orders", label: "Job Orders" },
  { value: "customers", label: "Customers" },
  { value: "cars", label: "Cars" },
  { value: "mechanics", label: "Mechanics" },
  { value: "services", label: "Services" },
  { value: "cash-log", label: "Cash Log" },
  { value: "income-statement", label: "Income Statement" },
  { value: "security", label: "Security (Admin)" },
];
