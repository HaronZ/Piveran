import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ========================
//  USERS
// ========================
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  nickName: text("nick_name"),
  photoUrl: text("photo_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by"),
});

// ========================
//  ROLES
// ========================
export const roles = pgTable("roles", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull().unique(),
  description: text("description"),
});

// ========================
//  USER <-> ROLES (many-to-many)
// ========================
export const userRoles = pgTable("user_roles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  roleId: integer("role_id")
    .notNull()
    .references(() => roles.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by"),
});

// ========================
//  ROLE VIEWS (what views each role can access)
// ========================
export const roleViews = pgTable("role_views", {
  id: uuid("id").defaultRandom().primaryKey(),
  roleId: integer("role_id")
    .notNull()
    .references(() => roles.id, { onDelete: "cascade" }),
  viewName: text("view_name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by"),
});

// ========================
//  ROLE TABLES (table-level access per role)
// ========================
export const roleTables = pgTable("role_tables", {
  id: uuid("id").defaultRandom().primaryKey(),
  roleId: integer("role_id")
    .notNull()
    .references(() => roles.id, { onDelete: "cascade" }),
  tableName: text("table_name").notNull(),
  accessMethod: text("access_method"),
});

// ========================
//  RELATIONS
// ========================
export const usersRelations = relations(users, ({ many }) => ({
  userRoles: many(userRoles),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  userRoles: many(userRoles),
  roleViews: many(roleViews),
  roleTables: many(roleTables),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, { fields: [userRoles.userId], references: [users.id] }),
  role: one(roles, { fields: [userRoles.roleId], references: [roles.id] }),
}));

export const roleViewsRelations = relations(roleViews, ({ one }) => ({
  role: one(roles, { fields: [roleViews.roleId], references: [roles.id] }),
}));

export const roleTablesRelations = relations(roleTables, ({ one }) => ({
  role: one(roles, { fields: [roleTables.roleId], references: [roles.id] }),
}));
