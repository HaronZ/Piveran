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
import { parts } from "./vendor";

// ========================
//  CASH MANAGEMENT
// ========================
export const cashActions = pgTable("cash_actions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  action: text("action").notNull(),
});

export const expenseTypes = pgTable("expense_types", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  description: text("description"),
});

export const opexTypes = pgTable("opex_types", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  description: text("description"),
});

export const cashLog = pgTable(
  "cash_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    datetime: timestamp("datetime", { withTimezone: true }).notNull(),
    date: date("date").notNull(),
    yearMonth: text("year_month"),
    yearQuarter: text("year_quarter"),
    year: text("year"),
    actionId: integer("action_id")
      .notNull()
      .references(() => cashActions.id),
    amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
    comment: text("comment"),
    expenseTypeId: integer("expense_type_id").references(() => expenseTypes.id),
    opexTypeId: integer("opex_type_id").references(() => opexTypes.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    createdBy: uuid("created_by").references(() => users.id),
    updatedBy: uuid("updated_by").references(() => users.id),
  },
  (table) => [
    index("cash_log_date_idx").on(table.date),
    index("cash_log_action_idx").on(table.actionId),
    index("cash_log_year_month_idx").on(table.yearMonth),
  ]
);

// ========================
//  CUSTOMERS
// ========================
export const customers = pgTable("customers", {
  id: uuid("id").defaultRandom().primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name"),
  middleName: text("middle_name"),
  nickName: text("nick_name"),
  suffix: text("suffix"),
  birthday: date("birthday"),
  primaryContact: text("primary_contact"),
  email: text("email"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
  updatedBy: uuid("updated_by").references(() => users.id),
});

export const customerAddresses = pgTable("customer_addresses", {
  id: uuid("id").defaultRandom().primaryKey(),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  street: text("street"),
  village: text("village"),
  barangay: text("barangay"),
  city: text("city"),
  province: text("province"),
  zipCode: text("zip_code"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
  updatedBy: uuid("updated_by").references(() => users.id),
});

export const customerContacts = pgTable("customer_contacts", {
  id: uuid("id").defaultRandom().primaryKey(),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  contactNumber: text("contact_number").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
  updatedBy: uuid("updated_by").references(() => users.id),
});

// ========================
//  CARS
// ========================
export const cars = pgTable(
  "cars",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    make: text("make"),
    model: text("model"),
    year: text("year"),
    color: text("color"),
    plateNumber: text("plate_number"),
    profilePhotoUrl: text("profile_photo_url"),
    primaryOwnerId: uuid("primary_owner_id").references(() => customers.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    createdBy: uuid("created_by").references(() => users.id),
    updatedBy: uuid("updated_by").references(() => users.id),
  },
  (table) => [index("cars_owner_idx").on(table.primaryOwnerId)]
);

export const carPhotos = pgTable("car_photos", {
  id: uuid("id").defaultRandom().primaryKey(),
  carId: uuid("car_id")
    .notNull()
    .references(() => cars.id, { onDelete: "cascade" }),
  photoUrl: text("photo_url").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
});

// ========================
//  CASHIERS
// ========================
export const cashiers = pgTable("cashiers", {
  id: uuid("id").defaultRandom().primaryKey(),
  firstName: text("first_name").notNull(),
  middleName: text("middle_name"),
  lastName: text("last_name"),
  contactNumber: text("contact_number"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
  updatedBy: uuid("updated_by").references(() => users.id),
});

// ========================
//  JOB ORDERS
// ========================
export const joStatuses = pgTable("jo_statuses", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  status: text("status").notNull(),
});

export const jobOrders = pgTable(
  "job_orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    joNumber: text("jo_number").notNull().unique(),
    customerId: uuid("customer_id").references(() => customers.id),
    carId: uuid("car_id").references(() => cars.id),
    checkinDate: timestamp("checkin_date", { withTimezone: true }),
    checkoutDate: timestamp("checkout_date", { withTimezone: true }),
    statusId: integer("status_id").references(() => joStatuses.id),
    discount: numeric("discount", { precision: 12, scale: 2 }),
    comment: text("comment"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    createdBy: uuid("created_by").references(() => users.id),
    updatedBy: uuid("updated_by").references(() => users.id),
  },
  (table) => [
    index("jo_customer_idx").on(table.customerId),
    index("jo_car_idx").on(table.carId),
    index("jo_status_idx").on(table.statusId),
    index("jo_checkin_idx").on(table.checkinDate),
  ]
);

export const joComments = pgTable("jo_comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  joId: uuid("jo_id")
    .notNull()
    .references(() => jobOrders.id, { onDelete: "cascade" }),
  commentFrom: text("comment_from"),
  comment: text("comment").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
  updatedBy: uuid("updated_by").references(() => users.id),
});

export const joPhotos = pgTable("jo_photos", {
  id: uuid("id").defaultRandom().primaryKey(),
  joId: uuid("jo_id")
    .notNull()
    .references(() => jobOrders.id, { onDelete: "cascade" }),
  photoUrl: text("photo_url").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
});

export const joPayments = pgTable(
  "jo_payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    joId: uuid("jo_id")
      .notNull()
      .references(() => jobOrders.id, { onDelete: "cascade" }),
    orNumber: text("or_number"),
    siNumber: text("si_number"),
    amountPaid: numeric("amount_paid", { precision: 12, scale: 2 }).notNull(),
    datePaid: date("date_paid"),
    cashierId: uuid("cashier_id").references(() => cashiers.id),
    comment: text("comment"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    createdBy: uuid("created_by").references(() => users.id),
    updatedBy: uuid("updated_by").references(() => users.id),
  },
  (table) => [index("jo_payments_jo_idx").on(table.joId)]
);

// ========================
//  JO MATERIALS
// ========================
export const joMaterialStatuses = pgTable("jo_material_statuses", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  status: text("status").notNull(),
});

export const joMaterials = pgTable(
  "jo_materials",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    joId: uuid("jo_id")
      .notNull()
      .references(() => jobOrders.id, { onDelete: "cascade" }),
    partId: uuid("part_id").references(() => parts.id),
    price: numeric("price", { precision: 12, scale: 2 }),
    quantity: integer("quantity"),
    totalPrice: numeric("total_price", { precision: 12, scale: 2 }),
    discount: numeric("discount", { precision: 12, scale: 2 }),
    finalPrice: numeric("final_price", { precision: 12, scale: 2 }),
    statusId: integer("status_id").references(() => joMaterialStatuses.id),
    providedInhouse: boolean("provided_inhouse").default(false),
    includeInTotal: boolean("include_in_total").default(true),
    date: timestamp("date", { withTimezone: true }),
    yearMonth: text("year_month"),
    comment: text("comment"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    createdBy: uuid("created_by").references(() => users.id),
    updatedBy: uuid("updated_by").references(() => users.id),
  },
  (table) => [
    index("jo_materials_jo_idx").on(table.joId),
    index("jo_materials_part_idx").on(table.partId),
  ]
);

export const joMaterialPhotos = pgTable("jo_material_photos", {
  id: uuid("id").defaultRandom().primaryKey(),
  joMaterialId: uuid("jo_material_id")
    .notNull()
    .references(() => joMaterials.id, { onDelete: "cascade" }),
  photoUrl: text("photo_url").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
});

export const joMaterialComments = pgTable("jo_material_comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  joMaterialId: uuid("jo_material_id")
    .notNull()
    .references(() => joMaterials.id, { onDelete: "cascade" }),
  comment: text("comment").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
  updatedBy: uuid("updated_by").references(() => users.id),
});

// ========================
//  JO LABORS
// ========================
export const joLaborStatuses = pgTable("jo_labor_statuses", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  status: text("status").notNull(),
});

export const laborTypes = pgTable("labor_types", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  defaultPrice: numeric("default_price", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
  updatedBy: uuid("updated_by").references(() => users.id),
});

export const joLabors = pgTable(
  "jo_labors",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    joId: uuid("jo_id")
      .notNull()
      .references(() => jobOrders.id, { onDelete: "cascade" }),
    laborTypeId: uuid("labor_type_id").references(() => laborTypes.id),
    price: numeric("price", { precision: 12, scale: 2 }),
    discount: numeric("discount", { precision: 12, scale: 2 }),
    totalPrice: numeric("total_price", { precision: 12, scale: 2 }),
    statusId: integer("status_id").references(() => joLaborStatuses.id),
    targetDate: date("target_date"),
    comment: text("comment"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    createdBy: uuid("created_by").references(() => users.id),
    updatedBy: uuid("updated_by").references(() => users.id),
  },
  (table) => [
    index("jo_labors_jo_idx").on(table.joId),
    index("jo_labors_type_idx").on(table.laborTypeId),
  ]
);

export const joLaborPhotos = pgTable("jo_labor_photos", {
  id: uuid("id").defaultRandom().primaryKey(),
  joLaborId: uuid("jo_labor_id")
    .notNull()
    .references(() => joLabors.id, { onDelete: "cascade" }),
  photoUrl: text("photo_url").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
});

export const joLaborComments = pgTable("jo_labor_comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  joLaborId: uuid("jo_labor_id")
    .notNull()
    .references(() => joLabors.id, { onDelete: "cascade" }),
  comment: text("comment").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
  updatedBy: uuid("updated_by").references(() => users.id),
});

// ========================
//  MECHANICS
// ========================
export const mechanics = pgTable("mechanics", {
  id: uuid("id").defaultRandom().primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name"),
  nickName: text("nick_name"),
  primaryContact: text("primary_contact"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
  updatedBy: uuid("updated_by").references(() => users.id),
});

export const mechanicContacts = pgTable("mechanic_contacts", {
  id: uuid("id").defaultRandom().primaryKey(),
  mechanicId: uuid("mechanic_id")
    .notNull()
    .references(() => mechanics.id, { onDelete: "cascade" }),
  contactNumber: text("contact_number").notNull(),
  label: text("label"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
});

export const joLaborMechanics = pgTable(
  "jo_labor_mechanics",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    joLaborId: uuid("jo_labor_id")
      .notNull()
      .references(() => joLabors.id, { onDelete: "cascade" }),
    mechanicId: uuid("mechanic_id")
      .notNull()
      .references(() => mechanics.id),
    comment: text("comment"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    createdBy: uuid("created_by").references(() => users.id),
    updatedBy: uuid("updated_by").references(() => users.id),
  },
  (table) => [
    index("jo_labor_mech_labor_idx").on(table.joLaborId),
    index("jo_labor_mech_mechanic_idx").on(table.mechanicId),
  ]
);

// ========================
//  QUALITY CHECKLISTS
// ========================
export const qualityChecklists = pgTable("quality_checklists", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
  updatedBy: uuid("updated_by").references(() => users.id),
});

export const laborTypeChecklists = pgTable(
  "labor_type_checklists",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    laborTypeId: uuid("labor_type_id")
      .notNull()
      .references(() => laborTypes.id, { onDelete: "cascade" }),
    checklistId: uuid("checklist_id")
      .notNull()
      .references(() => qualityChecklists.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    createdBy: uuid("created_by").references(() => users.id),
    updatedBy: uuid("updated_by").references(() => users.id),
  },
  (table) => [
    index("ltc_labor_type_idx").on(table.laborTypeId),
    index("ltc_checklist_idx").on(table.checklistId),
  ]
);

export const checklistPhotos = pgTable("checklist_photos", {
  id: uuid("id").defaultRandom().primaryKey(),
  checklistId: uuid("checklist_id")
    .notNull()
    .references(() => qualityChecklists.id, { onDelete: "cascade" }),
  photoUrl: text("photo_url").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
});

export const checklistVideos = pgTable("checklist_videos", {
  id: uuid("id").defaultRandom().primaryKey(),
  checklistId: uuid("checklist_id")
    .notNull()
    .references(() => qualityChecklists.id, { onDelete: "cascade" }),
  videoUrl: text("video_url").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
});

// ========================
//  LABOR PRICES (price history for labor types)
// ========================
export const laborPrices = pgTable("labor_prices", {
  id: uuid("id").defaultRandom().primaryKey(),
  laborTypeId: uuid("labor_type_id")
    .notNull()
    .references(() => laborTypes.id, { onDelete: "cascade" }),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
  updatedBy: uuid("updated_by").references(() => users.id),
});

// ========================
//  SKILLS
// ========================
export const skills = pgTable("skills", {
  id: uuid("id").defaultRandom().primaryKey(),
  skill: text("skill").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
  updatedBy: uuid("updated_by").references(() => users.id),
});

// ========================
//  RELATIONS
// ========================
export const cashLogRelations = relations(cashLog, ({ one }) => ({
  action: one(cashActions, { fields: [cashLog.actionId], references: [cashActions.id] }),
  expenseType: one(expenseTypes, { fields: [cashLog.expenseTypeId], references: [expenseTypes.id] }),
  opexType: one(opexTypes, { fields: [cashLog.opexTypeId], references: [opexTypes.id] }),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  addresses: many(customerAddresses),
  contacts: many(customerContacts),
  cars: many(cars),
  jobOrders: many(jobOrders),
}));

export const customerAddressesRelations = relations(customerAddresses, ({ one }) => ({
  customer: one(customers, { fields: [customerAddresses.customerId], references: [customers.id] }),
}));

export const customerContactsRelations = relations(customerContacts, ({ one }) => ({
  customer: one(customers, { fields: [customerContacts.customerId], references: [customers.id] }),
}));

export const carsRelations = relations(cars, ({ one, many }) => ({
  owner: one(customers, { fields: [cars.primaryOwnerId], references: [customers.id] }),
  photos: many(carPhotos),
  jobOrders: many(jobOrders),
}));

export const carPhotosRelations = relations(carPhotos, ({ one }) => ({
  car: one(cars, { fields: [carPhotos.carId], references: [cars.id] }),
}));

export const jobOrdersRelations = relations(jobOrders, ({ one, many }) => ({
  customer: one(customers, { fields: [jobOrders.customerId], references: [customers.id] }),
  car: one(cars, { fields: [jobOrders.carId], references: [cars.id] }),
  status: one(joStatuses, { fields: [jobOrders.statusId], references: [joStatuses.id] }),
  comments: many(joComments),
  photos: many(joPhotos),
  payments: many(joPayments),
  materials: many(joMaterials),
  labors: many(joLabors),
}));

export const joMaterialsRelations = relations(joMaterials, ({ one, many }) => ({
  jobOrder: one(jobOrders, { fields: [joMaterials.joId], references: [jobOrders.id] }),
  part: one(parts, { fields: [joMaterials.partId], references: [parts.id] }),
  status: one(joMaterialStatuses, { fields: [joMaterials.statusId], references: [joMaterialStatuses.id] }),
  photos: many(joMaterialPhotos),
  comments: many(joMaterialComments),
}));

export const joLaborsRelations = relations(joLabors, ({ one, many }) => ({
  jobOrder: one(jobOrders, { fields: [joLabors.joId], references: [jobOrders.id] }),
  laborType: one(laborTypes, { fields: [joLabors.laborTypeId], references: [laborTypes.id] }),
  status: one(joLaborStatuses, { fields: [joLabors.statusId], references: [joLaborStatuses.id] }),
  photos: many(joLaborPhotos),
  comments: many(joLaborComments),
  mechanics: many(joLaborMechanics),
}));

export const joLaborMechanicsRelations = relations(joLaborMechanics, ({ one }) => ({
  joLabor: one(joLabors, { fields: [joLaborMechanics.joLaborId], references: [joLabors.id] }),
  mechanic: one(mechanics, { fields: [joLaborMechanics.mechanicId], references: [mechanics.id] }),
}));

export const mechanicsRelations = relations(mechanics, ({ many }) => ({
  contacts: many(mechanicContacts),
  laborAssignments: many(joLaborMechanics),
}));

export const laborTypesRelations = relations(laborTypes, ({ many }) => ({
  checklists: many(laborTypeChecklists),
  joLabors: many(joLabors),
  prices: many(laborPrices),
}));

export const qualityChecklistsRelations = relations(qualityChecklists, ({ many }) => ({
  laborTypes: many(laborTypeChecklists),
  photos: many(checklistPhotos),
  videos: many(checklistVideos),
}));

export const laborTypeChecklistsRelations = relations(laborTypeChecklists, ({ one }) => ({
  laborType: one(laborTypes, { fields: [laborTypeChecklists.laborTypeId], references: [laborTypes.id] }),
  checklist: one(qualityChecklists, { fields: [laborTypeChecklists.checklistId], references: [qualityChecklists.id] }),
}));
