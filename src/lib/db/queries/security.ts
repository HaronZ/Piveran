import { db } from "@/lib/db";
import { users, roles, userRoles, roleViews } from "@/lib/db/schema/security";
import { eq, sql, asc, desc } from "drizzle-orm";

// Re-export types from the shared file (safe for client imports)
export type { UserWithRolesRow, RoleWithViewsRow, RoleSelectorRow } from "./security-types";
export { AVAILABLE_VIEWS } from "./security-types";

// ─── Users with Roles ───
export async function getUsersWithRoles() {
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

  const allUserRoles = await db
    .select({
      userId: userRoles.userId,
      roleName: roles.name,
    })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id));

  return allUsers.map((u) => ({
    ...u,
    roles: [...new Set(allUserRoles.filter((ur) => ur.userId === u.id).map((ur) => ur.roleName))],
  }));
}

// ─── Roles with View Permissions ───
export async function getRolesWithViews() {
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
    views: [...new Set(allRoleViews.filter((rv) => rv.roleId === r.id).map((rv) => rv.viewName))],
    userCount: new Set(allUserRoles.filter((ur) => ur.roleId === r.id).map((ur) => ur.userId)).size,
  }));
}

// ─── All Roles (for selector) ───
export async function getRolesForSelector() {
  return db
    .select({ id: roles.id, name: roles.name })
    .from(roles)
    .orderBy(asc(roles.name));
}
