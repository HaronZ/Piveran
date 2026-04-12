import {
  pgTable,
  uuid,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  date,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./security";

// ========================
//  LOOKUP TABLES
// ========================
export const brands = pgTable("brands", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
});

export const units = pgTable("units", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
});

export const cabinetCodes = pgTable("cabinet_codes", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull(),
  imageUrl: text("image_url"),
  description: text("description"),
});

export const salesTypes = pgTable("sales_types", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  type: text("type").notNull(),
});

export const paymentTypes = pgTable("payment_types", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  type: text("type").notNull(),
});

export const inventoryActions = pgTable("inventory_actions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  addMinus: integer("add_minus").notNull(), // 1 = add, -1 = subtract
});

export const auditStatuses = pgTable("audit_statuses", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  status: text("status").notNull(),
});

export const prStatuses = pgTable("pr_statuses", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  status: text("status").notNull(),
});

export const prLineStatuses = pgTable("pr_line_statuses", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  status: text("status").notNull(),
});

// ========================
//  VENDORS
// ========================
export const vendors = pgTable("vendors", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  address: text("address"),
  contactNumber: text("contact_number"),
  link: text("link"),
  comments: text("comments"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
  updatedBy: uuid("updated_by").references(() => users.id),
});

export const vendorContacts = pgTable("vendor_contacts", {
  id: uuid("id").defaultRandom().primaryKey(),
  vendorId: uuid("vendor_id")
    .notNull()
    .references(() => vendors.id, { onDelete: "cascade" }),
  number: text("number").notNull(),
  label: text("label"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
  updatedBy: uuid("updated_by").references(() => users.id),
});

// ========================
//  PARTS
// ========================
export const parts = pgTable(
  "parts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    brandId: uuid("brand_id").references(() => brands.id),
    partNumber: text("part_number"),
    partCode: text("part_code"),
    description: text("description"),
    cabinetCodeId: uuid("cabinet_code_id").references(() => cabinetCodes.id),
    profilePhotoUrl: text("profile_photo_url"),
    comment: text("comment"),
    criticalCount: integer("critical_count").default(0),
    includeCritical: boolean("include_critical").default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    createdBy: uuid("created_by").references(() => users.id),
    updatedBy: uuid("updated_by").references(() => users.id),
  },
  (table) => [
    index("parts_brand_idx").on(table.brandId),
    index("parts_cabinet_idx").on(table.cabinetCodeId),
  ]
);

export const partsPhotos = pgTable("parts_photos", {
  id: uuid("id").defaultRandom().primaryKey(),
  partId: uuid("part_id")
    .notNull()
    .references(() => parts.id, { onDelete: "cascade" }),
  photoUrl: text("photo_url").notNull(),
  notes: text("notes"),
  date: timestamp("date", { withTimezone: true }),
});

export const partsPrices = pgTable(
  "parts_prices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    partId: uuid("part_id")
      .notNull()
      .references(() => parts.id, { onDelete: "cascade" }),
    price: numeric("price", { precision: 12, scale: 2 }).notNull(),
    comment: text("comment"),
    date: timestamp("date", { withTimezone: true }).defaultNow(),
    createdBy: uuid("created_by").references(() => users.id),
  },
  (table) => [index("parts_prices_part_idx").on(table.partId)]
);

export const partsSuppliers = pgTable(
  "parts_suppliers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    partId: uuid("part_id")
      .notNull()
      .references(() => parts.id, { onDelete: "cascade" }),
    vendorId: uuid("vendor_id")
      .notNull()
      .references(() => vendors.id, { onDelete: "cascade" }),
    price: numeric("price", { precision: 12, scale: 2 }),
    comment: text("comment"),
    link: text("link"),
    lastUpdate: timestamp("last_update", { withTimezone: true }),
    createdBy: uuid("created_by").references(() => users.id),
  },
  (table) => [
    index("parts_suppliers_part_idx").on(table.partId),
    index("parts_suppliers_vendor_idx").on(table.vendorId),
  ]
);

// ========================
//  INVENTORY LOG
// ========================
export const inventoryLog = pgTable(
  "inventory_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    date: timestamp("date", { withTimezone: true }).notNull(),
    vendorId: uuid("vendor_id").references(() => vendors.id),
    partId: uuid("part_id")
      .notNull()
      .references(() => parts.id),
    actionId: integer("action_id")
      .notNull()
      .references(() => inventoryActions.id),
    unitId: integer("unit_id").references(() => units.id),
    quantity: integer("quantity").notNull(),
    unitPrice: numeric("unit_price", { precision: 12, scale: 2 }),
    totalPrice: numeric("total_price", { precision: 12, scale: 2 }),
    comments: text("comments"),
    lastStockPrice: numeric("last_stock_price", { precision: 12, scale: 2 }),
    estimateProfit: numeric("estimate_profit", { precision: 12, scale: 2 }),
    // Computed columns — generated by PostgreSQL
    yearMonth: text("year_month"),
    yearQuarter: text("year_quarter"),
    year: text("year"),
    salesTypeId: integer("sales_type_id").references(() => salesTypes.id),
    paymentTypeId: integer("payment_type_id").references(() => paymentTypes.id),
    payableDueDate: date("payable_due_date"),
    addStockLink: text("add_stock_link"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    createdBy: uuid("created_by").references(() => users.id),
    updatedBy: uuid("updated_by").references(() => users.id),
  },
  (table) => [
    index("inv_log_part_idx").on(table.partId),
    index("inv_log_vendor_idx").on(table.vendorId),
    index("inv_log_action_idx").on(table.actionId),
    index("inv_log_date_idx").on(table.date),
    index("inv_log_year_month_idx").on(table.yearMonth),
  ]
);

// ========================
//  INVENTORY VALUE (periodic snapshots)
// ========================
export const inventoryValue = pgTable("inventory_value", {
  id: uuid("id").defaultRandom().primaryKey(),
  currentValue: numeric("current_value", { precision: 14, scale: 2 }),
  date: date("date"),
  quarter: text("quarter"),
  year: integer("year"),
  yearQuarter: text("year_quarter"),
});

// ========================
//  PARTS AUDIT
// ========================
export const partsAudit = pgTable(
  "parts_audit",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    partId: uuid("part_id")
      .notNull()
      .references(() => parts.id),
    count: integer("count").notNull(),
    statusId: integer("status_id")
      .notNull()
      .references(() => auditStatuses.id),
    currentStock: integer("current_stock"),
    comment: text("comment"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    createdBy: uuid("created_by").references(() => users.id),
    updatedBy: uuid("updated_by").references(() => users.id),
  },
  (table) => [index("parts_audit_part_idx").on(table.partId)]
);

// ========================
//  PURCHASE REQUESTS
// ========================
export const purchaseRequests = pgTable("purchase_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  prNumber: text("pr_number").notNull().unique(),
  date: timestamp("date", { withTimezone: true }),
  statusId: integer("status_id").references(() => prStatuses.id),
  label: text("label"),
  comment: text("comment"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
  updatedBy: uuid("updated_by").references(() => users.id),
});

export const prComments = pgTable("pr_comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  prId: uuid("pr_id")
    .notNull()
    .references(() => purchaseRequests.id, { onDelete: "cascade" }),
  comment: text("comment").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
  updatedBy: uuid("updated_by").references(() => users.id),
});

export const prLines = pgTable(
  "pr_lines",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    prId: uuid("pr_id")
      .notNull()
      .references(() => purchaseRequests.id, { onDelete: "cascade" }),
    partId: uuid("part_id").references(() => parts.id),
    quantity: integer("quantity"),
    unitPrice: numeric("unit_price", { precision: 12, scale: 2 }),
    totalPrice: numeric("total_price", { precision: 12, scale: 2 }),
    targetPrice: numeric("target_price", { precision: 12, scale: 2 }),
    totalTargetPrice: numeric("total_target_price", { precision: 12, scale: 2 }),
    projectedProfit: numeric("projected_profit", { precision: 12, scale: 2 }),
    statusId: integer("status_id").references(() => prLineStatuses.id),
    comment: text("comment"),
    link: text("link"),
    supplierId: uuid("supplier_id").references(() => vendors.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    createdBy: uuid("created_by").references(() => users.id),
    updatedBy: uuid("updated_by").references(() => users.id),
  },
  (table) => [
    index("pr_lines_pr_idx").on(table.prId),
    index("pr_lines_part_idx").on(table.partId),
  ]
);

export const prLineComments = pgTable("pr_line_comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  prLineId: uuid("pr_line_id")
    .notNull()
    .references(() => prLines.id, { onDelete: "cascade" }),
  comment: text("comment").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
  updatedBy: uuid("updated_by").references(() => users.id),
});

export const prLinePhotos = pgTable("pr_line_photos", {
  id: uuid("id").defaultRandom().primaryKey(),
  prLineId: uuid("pr_line_id")
    .notNull()
    .references(() => prLines.id, { onDelete: "cascade" }),
  photoUrl: text("photo_url").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
});

export const prLinesSuppliers = pgTable("pr_lines_suppliers", {
  id: uuid("id").defaultRandom().primaryKey(),
  prLineId: uuid("pr_line_id")
    .notNull()
    .references(() => prLines.id, { onDelete: "cascade" }),
  vendorId: uuid("vendor_id")
    .notNull()
    .references(() => vendors.id),
  link: text("link"),
  price: numeric("price", { precision: 12, scale: 2 }),
  comment: text("comment"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
  updatedBy: uuid("updated_by").references(() => users.id),
});

// ========================
//  RELATIONS
// ========================
export const vendorsRelations = relations(vendors, ({ many }) => ({
  contacts: many(vendorContacts),
  suppliedParts: many(partsSuppliers),
  inventoryLogs: many(inventoryLog),
}));

export const vendorContactsRelations = relations(vendorContacts, ({ one }) => ({
  vendor: one(vendors, { fields: [vendorContacts.vendorId], references: [vendors.id] }),
}));

export const brandsRelations = relations(brands, ({ many }) => ({
  parts: many(parts),
}));

export const partsRelations = relations(parts, ({ one, many }) => ({
  brand: one(brands, { fields: [parts.brandId], references: [brands.id] }),
  cabinetCode: one(cabinetCodes, { fields: [parts.cabinetCodeId], references: [cabinetCodes.id] }),
  photos: many(partsPhotos),
  prices: many(partsPrices),
  suppliers: many(partsSuppliers),
  inventoryLogs: many(inventoryLog),
  audits: many(partsAudit),
}));

export const partsPhotosRelations = relations(partsPhotos, ({ one }) => ({
  part: one(parts, { fields: [partsPhotos.partId], references: [parts.id] }),
}));

export const partsPricesRelations = relations(partsPrices, ({ one }) => ({
  part: one(parts, { fields: [partsPrices.partId], references: [parts.id] }),
}));

export const partsSuppliersRelations = relations(partsSuppliers, ({ one }) => ({
  part: one(parts, { fields: [partsSuppliers.partId], references: [parts.id] }),
  vendor: one(vendors, { fields: [partsSuppliers.vendorId], references: [vendors.id] }),
}));

export const inventoryLogRelations = relations(inventoryLog, ({ one }) => ({
  part: one(parts, { fields: [inventoryLog.partId], references: [parts.id] }),
  vendor: one(vendors, { fields: [inventoryLog.vendorId], references: [vendors.id] }),
  action: one(inventoryActions, { fields: [inventoryLog.actionId], references: [inventoryActions.id] }),
  unit: one(units, { fields: [inventoryLog.unitId], references: [units.id] }),
  salesType: one(salesTypes, { fields: [inventoryLog.salesTypeId], references: [salesTypes.id] }),
  paymentType: one(paymentTypes, { fields: [inventoryLog.paymentTypeId], references: [paymentTypes.id] }),
}));

export const partsAuditRelations = relations(partsAudit, ({ one }) => ({
  part: one(parts, { fields: [partsAudit.partId], references: [parts.id] }),
  status: one(auditStatuses, { fields: [partsAudit.statusId], references: [auditStatuses.id] }),
}));

export const purchaseRequestsRelations = relations(purchaseRequests, ({ one, many }) => ({
  status: one(prStatuses, { fields: [purchaseRequests.statusId], references: [prStatuses.id] }),
  comments: many(prComments),
  lines: many(prLines),
}));

export const prLinesRelations = relations(prLines, ({ one, many }) => ({
  purchaseRequest: one(purchaseRequests, { fields: [prLines.prId], references: [purchaseRequests.id] }),
  part: one(parts, { fields: [prLines.partId], references: [parts.id] }),
  status: one(prLineStatuses, { fields: [prLines.statusId], references: [prLineStatuses.id] }),
  supplier: one(vendors, { fields: [prLines.supplierId], references: [vendors.id] }),
  comments: many(prLineComments),
  photos: many(prLinePhotos),
  suppliers: many(prLinesSuppliers),
}));
