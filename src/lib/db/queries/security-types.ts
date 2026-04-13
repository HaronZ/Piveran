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

export type RoleWithViewsRow = {
  id: number;
  name: string;
  description: string | null;
  views: string[];
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
