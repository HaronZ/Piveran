// Shared types and constants for security module
// This file is safe to import from both server and client components

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

export type AccessMethod = "read" | "write" | "admin";

export type RoleTablePermission = {
  tableName: string;
  accessMethod: AccessMethod | null;
};

export type RoleWithViewsRow = {
  id: number;
  name: string;
  description: string | null;
  views: string[];
  tables: RoleTablePermission[];
  userCount: number;
};

export type RoleSelectorRow = { id: number; name: string };

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

// Data tables that can have per-role access controls. Grouped by feature.
export const AVAILABLE_TABLES: { value: string; label: string }[] = [
  { value: "users", label: "users" },
  { value: "roles", label: "roles" },
  { value: "user_roles", label: "user_roles" },
  { value: "role_views", label: "role_views" },
  { value: "role_tables", label: "role_tables" },
  { value: "parts", label: "parts" },
  { value: "parts_prices", label: "parts_prices" },
  { value: "parts_suppliers", label: "parts_suppliers" },
  { value: "inventory_log", label: "inventory_log" },
  { value: "parts_audit", label: "parts_audit" },
  { value: "vendors", label: "vendors" },
  { value: "vendor_contacts", label: "vendor_contacts" },
  { value: "purchase_requests", label: "purchase_requests" },
  { value: "pr_lines", label: "pr_lines" },
  { value: "customers", label: "customers" },
  { value: "customer_addresses", label: "customer_addresses" },
  { value: "customer_contacts", label: "customer_contacts" },
  { value: "cars", label: "cars" },
  { value: "job_orders", label: "job_orders" },
  { value: "jo_materials", label: "jo_materials" },
  { value: "jo_labors", label: "jo_labors" },
  { value: "jo_payments", label: "jo_payments" },
  { value: "mechanics", label: "mechanics" },
  { value: "labor_types", label: "labor_types" },
  { value: "labor_prices", label: "labor_prices" },
  { value: "cash_log", label: "cash_log" },
];

export const ACCESS_METHODS: { value: AccessMethod; label: string }[] = [
  { value: "read", label: "Read" },
  { value: "write", label: "Write" },
  { value: "admin", label: "Admin" },
];
