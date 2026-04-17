import { db } from "@/lib/db";
import { users, roles, userRoles, roleViews, roleTables } from "@/lib/db/schema/security";
import { eq, sql, asc } from "drizzle-orm";
import type { AccessMethod } from "./security-types";

// Re-export types from the shared file (safe for client imports)
export type { UserWithRolesRow, RoleWithViewsRow, RoleSelectorRow, AccessMethod, RoleTablePermission } from "./security-types";
export { AVAILABLE_VIEWS, AVAILABLE_TABLES, ACCESS_METHODS } from "./security-types";

// ─── Users with Roles ───
export async function getUsersWithRoles() {
  const [allUsers, allUserRoles] = await Promise.all([
    db
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
      .orderBy(asc(users.email)),
    db
      .select({
        userId: userRoles.userId,
        roleName: roles.name,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id)),
  ]);

  return allUsers.map((u) => ({
    ...u,
    roles: [...new Set(allUserRoles.filter((ur) => ur.userId === u.id).map((ur) => ur.roleName))],
  }));
}

// ─── Roles with View Permissions ───
export async function getRolesWithViews() {
  const [allRoles, allRoleViews, allRoleTables, allUserRoles] = await Promise.all([
    db
      .select({
        id: roles.id,
        name: roles.name,
        description: roles.description,
      })
      .from(roles)
      .orderBy(asc(roles.name)),
    db
      .select({
        roleId: roleViews.roleId,
        viewName: roleViews.viewName,
      })
      .from(roleViews),
    db
      .select({
        roleId: roleTables.roleId,
        tableName: roleTables.tableName,
        accessMethod: roleTables.accessMethod,
      })
      .from(roleTables),
    db
      .select({
        roleId: userRoles.roleId,
        userId: userRoles.userId,
      })
      .from(userRoles),
  ]);

  return allRoles.map((r) => ({
    ...r,
    views: [...new Set(allRoleViews.filter((rv) => rv.roleId === r.id).map((rv) => rv.viewName))],
    tables: allRoleTables
      .filter((rt) => rt.roleId === r.id)
      .map((rt) => ({
        tableName: rt.tableName,
        accessMethod: (rt.accessMethod as AccessMethod | null) ?? null,
      })),
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
