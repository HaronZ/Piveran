CREATE TABLE "role_tables" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role_id" integer NOT NULL,
	"table_name" text NOT NULL,
	"access_method" text
);
--> statement-breakpoint
CREATE TABLE "role_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role_id" integer NOT NULL,
	"view_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "roles_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"description" text,
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"role_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"nick_name" text,
	"photo_url" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	"updated_by" uuid,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "audit_statuses" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "audit_statuses_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"status" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brands" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "brands_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "cabinet_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"image_url" text,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "inventory_actions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "inventory_actions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"add_minus" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"vendor_id" uuid,
	"part_id" uuid NOT NULL,
	"action_id" integer NOT NULL,
	"unit_id" integer,
	"quantity" integer NOT NULL,
	"unit_price" numeric(12, 2),
	"total_price" numeric(12, 2),
	"comments" text,
	"last_stock_price" numeric(12, 2),
	"estimate_profit" numeric(12, 2),
	"year_month" text,
	"year_quarter" text,
	"year" text,
	"sales_type_id" integer,
	"payment_type_id" integer,
	"payable_due_date" date,
	"add_stock_link" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "inventory_value" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"current_value" numeric(14, 2),
	"date" date,
	"quarter" text,
	"year" integer,
	"year_quarter" text
);
--> statement-breakpoint
CREATE TABLE "parts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"brand_id" uuid,
	"part_number" text,
	"part_code" text,
	"description" text,
	"cabinet_code_id" uuid,
	"profile_photo_url" text,
	"comment" text,
	"critical_count" integer DEFAULT 0,
	"include_critical" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "parts_audit" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"part_id" uuid NOT NULL,
	"count" integer NOT NULL,
	"status_id" integer NOT NULL,
	"current_stock" integer,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "parts_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"part_id" uuid NOT NULL,
	"photo_url" text NOT NULL,
	"notes" text,
	"date" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "parts_prices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"part_id" uuid NOT NULL,
	"price" numeric(12, 2) NOT NULL,
	"comment" text,
	"date" timestamp with time zone DEFAULT now(),
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "parts_suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"part_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"price" numeric(12, 2),
	"comment" text,
	"link" text,
	"last_update" timestamp with time zone,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "payment_types" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "payment_types_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"type" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pr_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pr_id" uuid NOT NULL,
	"comment" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "pr_line_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pr_line_id" uuid NOT NULL,
	"comment" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "pr_line_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pr_line_id" uuid NOT NULL,
	"photo_url" text NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "pr_line_statuses" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "pr_line_statuses_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"status" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pr_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pr_id" uuid NOT NULL,
	"part_id" uuid,
	"quantity" integer,
	"unit_price" numeric(12, 2),
	"total_price" numeric(12, 2),
	"target_price" numeric(12, 2),
	"total_target_price" numeric(12, 2),
	"projected_profit" numeric(12, 2),
	"status_id" integer,
	"comment" text,
	"link" text,
	"supplier_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "pr_lines_suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pr_line_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"link" text,
	"price" numeric(12, 2),
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "pr_statuses" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "pr_statuses_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"status" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pr_number" text NOT NULL,
	"date" timestamp with time zone,
	"status_id" integer,
	"label" text,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	"updated_by" uuid,
	CONSTRAINT "purchase_requests_pr_number_unique" UNIQUE("pr_number")
);
--> statement-breakpoint
CREATE TABLE "sales_types" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "sales_types_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"type" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "units" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "units_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendor_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"number" text NOT NULL,
	"label" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "vendors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"contact_number" text,
	"link" text,
	"comments" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "car_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"car_id" uuid NOT NULL,
	"photo_url" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "cars" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"make" text,
	"model" text,
	"year" text,
	"color" text,
	"plate_number" text,
	"profile_photo_url" text,
	"primary_owner_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "cash_actions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "cash_actions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"action" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cash_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"datetime" timestamp with time zone NOT NULL,
	"date" date NOT NULL,
	"year_month" text,
	"year_quarter" text,
	"year" text,
	"action_id" integer NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"comment" text,
	"expense_type_id" integer,
	"opex_type_id" integer,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "cashiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" text NOT NULL,
	"middle_name" text,
	"last_name" text,
	"contact_number" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "checklist_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"checklist_id" uuid NOT NULL,
	"photo_url" text NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "checklist_videos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"checklist_id" uuid NOT NULL,
	"video_url" text NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "customer_addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"street" text,
	"village" text,
	"barangay" text,
	"city" text,
	"province" text,
	"zip_code" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "customer_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"contact_number" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "customer_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"photo_url" text NOT NULL,
	"label" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text,
	"middle_name" text,
	"nick_name" text,
	"suffix" text,
	"birthday" date,
	"primary_contact" text,
	"email" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "expense_types" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "expense_types_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "jo_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"jo_id" uuid NOT NULL,
	"comment_from" text,
	"comment" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "jo_labor_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"jo_labor_id" uuid NOT NULL,
	"comment" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "jo_labor_mechanics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"jo_labor_id" uuid NOT NULL,
	"mechanic_id" uuid NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "jo_labor_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"jo_labor_id" uuid NOT NULL,
	"photo_url" text NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "jo_labor_statuses" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "jo_labor_statuses_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"status" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jo_labors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"jo_id" uuid NOT NULL,
	"labor_type_id" uuid,
	"price" numeric(12, 2),
	"discount" numeric(12, 2),
	"total_price" numeric(12, 2),
	"status_id" integer,
	"target_date" date,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "jo_material_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"jo_material_id" uuid NOT NULL,
	"comment" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "jo_material_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"jo_material_id" uuid NOT NULL,
	"photo_url" text NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "jo_material_statuses" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "jo_material_statuses_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"status" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jo_materials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"jo_id" uuid NOT NULL,
	"part_id" uuid,
	"price" numeric(12, 2),
	"quantity" integer,
	"total_price" numeric(12, 2),
	"discount" numeric(12, 2),
	"final_price" numeric(12, 2),
	"status_id" integer,
	"provided_inhouse" boolean DEFAULT false,
	"include_in_total" boolean DEFAULT true,
	"date" timestamp with time zone,
	"year_month" text,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "jo_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"jo_id" uuid NOT NULL,
	"or_number" text,
	"si_number" text,
	"amount_paid" numeric(12, 2) NOT NULL,
	"date_paid" date,
	"cashier_id" uuid,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "jo_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"jo_id" uuid NOT NULL,
	"photo_url" text NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "jo_statuses" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "jo_statuses_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"status" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"jo_number" text NOT NULL,
	"customer_id" uuid,
	"car_id" uuid,
	"checkin_date" timestamp with time zone,
	"checkout_date" timestamp with time zone,
	"status_id" integer,
	"discount" numeric(12, 2),
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	"updated_by" uuid,
	CONSTRAINT "job_orders_jo_number_unique" UNIQUE("jo_number")
);
--> statement-breakpoint
CREATE TABLE "labor_prices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"labor_type_id" uuid NOT NULL,
	"price" numeric(12, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "labor_type_checklists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"labor_type_id" uuid NOT NULL,
	"checklist_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "labor_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"default_price" numeric(12, 2),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "mechanic_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mechanic_id" uuid NOT NULL,
	"contact_number" text NOT NULL,
	"label" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "mechanic_skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mechanic_id" uuid NOT NULL,
	"skill_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "mechanics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text,
	"nick_name" text,
	"primary_contact" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "opex_types" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "opex_types_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "quality_checklists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"skill" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
ALTER TABLE "role_tables" ADD CONSTRAINT "role_tables_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_views" ADD CONSTRAINT "role_views_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_log" ADD CONSTRAINT "inventory_log_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_log" ADD CONSTRAINT "inventory_log_part_id_parts_id_fk" FOREIGN KEY ("part_id") REFERENCES "public"."parts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_log" ADD CONSTRAINT "inventory_log_action_id_inventory_actions_id_fk" FOREIGN KEY ("action_id") REFERENCES "public"."inventory_actions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_log" ADD CONSTRAINT "inventory_log_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_log" ADD CONSTRAINT "inventory_log_sales_type_id_sales_types_id_fk" FOREIGN KEY ("sales_type_id") REFERENCES "public"."sales_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_log" ADD CONSTRAINT "inventory_log_payment_type_id_payment_types_id_fk" FOREIGN KEY ("payment_type_id") REFERENCES "public"."payment_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_log" ADD CONSTRAINT "inventory_log_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_log" ADD CONSTRAINT "inventory_log_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parts" ADD CONSTRAINT "parts_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parts" ADD CONSTRAINT "parts_cabinet_code_id_cabinet_codes_id_fk" FOREIGN KEY ("cabinet_code_id") REFERENCES "public"."cabinet_codes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parts" ADD CONSTRAINT "parts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parts" ADD CONSTRAINT "parts_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parts_audit" ADD CONSTRAINT "parts_audit_part_id_parts_id_fk" FOREIGN KEY ("part_id") REFERENCES "public"."parts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parts_audit" ADD CONSTRAINT "parts_audit_status_id_audit_statuses_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."audit_statuses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parts_audit" ADD CONSTRAINT "parts_audit_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parts_audit" ADD CONSTRAINT "parts_audit_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parts_photos" ADD CONSTRAINT "parts_photos_part_id_parts_id_fk" FOREIGN KEY ("part_id") REFERENCES "public"."parts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parts_prices" ADD CONSTRAINT "parts_prices_part_id_parts_id_fk" FOREIGN KEY ("part_id") REFERENCES "public"."parts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parts_prices" ADD CONSTRAINT "parts_prices_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parts_suppliers" ADD CONSTRAINT "parts_suppliers_part_id_parts_id_fk" FOREIGN KEY ("part_id") REFERENCES "public"."parts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parts_suppliers" ADD CONSTRAINT "parts_suppliers_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parts_suppliers" ADD CONSTRAINT "parts_suppliers_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pr_comments" ADD CONSTRAINT "pr_comments_pr_id_purchase_requests_id_fk" FOREIGN KEY ("pr_id") REFERENCES "public"."purchase_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pr_comments" ADD CONSTRAINT "pr_comments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pr_comments" ADD CONSTRAINT "pr_comments_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pr_line_comments" ADD CONSTRAINT "pr_line_comments_pr_line_id_pr_lines_id_fk" FOREIGN KEY ("pr_line_id") REFERENCES "public"."pr_lines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pr_line_comments" ADD CONSTRAINT "pr_line_comments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pr_line_comments" ADD CONSTRAINT "pr_line_comments_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pr_line_photos" ADD CONSTRAINT "pr_line_photos_pr_line_id_pr_lines_id_fk" FOREIGN KEY ("pr_line_id") REFERENCES "public"."pr_lines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pr_line_photos" ADD CONSTRAINT "pr_line_photos_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pr_lines" ADD CONSTRAINT "pr_lines_pr_id_purchase_requests_id_fk" FOREIGN KEY ("pr_id") REFERENCES "public"."purchase_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pr_lines" ADD CONSTRAINT "pr_lines_part_id_parts_id_fk" FOREIGN KEY ("part_id") REFERENCES "public"."parts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pr_lines" ADD CONSTRAINT "pr_lines_status_id_pr_line_statuses_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."pr_line_statuses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pr_lines" ADD CONSTRAINT "pr_lines_supplier_id_vendors_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pr_lines" ADD CONSTRAINT "pr_lines_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pr_lines" ADD CONSTRAINT "pr_lines_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pr_lines_suppliers" ADD CONSTRAINT "pr_lines_suppliers_pr_line_id_pr_lines_id_fk" FOREIGN KEY ("pr_line_id") REFERENCES "public"."pr_lines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pr_lines_suppliers" ADD CONSTRAINT "pr_lines_suppliers_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pr_lines_suppliers" ADD CONSTRAINT "pr_lines_suppliers_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pr_lines_suppliers" ADD CONSTRAINT "pr_lines_suppliers_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_requests" ADD CONSTRAINT "purchase_requests_status_id_pr_statuses_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."pr_statuses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_requests" ADD CONSTRAINT "purchase_requests_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_requests" ADD CONSTRAINT "purchase_requests_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_contacts" ADD CONSTRAINT "vendor_contacts_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_contacts" ADD CONSTRAINT "vendor_contacts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_contacts" ADD CONSTRAINT "vendor_contacts_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "car_photos" ADD CONSTRAINT "car_photos_car_id_cars_id_fk" FOREIGN KEY ("car_id") REFERENCES "public"."cars"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "car_photos" ADD CONSTRAINT "car_photos_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cars" ADD CONSTRAINT "cars_primary_owner_id_customers_id_fk" FOREIGN KEY ("primary_owner_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cars" ADD CONSTRAINT "cars_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cars" ADD CONSTRAINT "cars_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_log" ADD CONSTRAINT "cash_log_action_id_cash_actions_id_fk" FOREIGN KEY ("action_id") REFERENCES "public"."cash_actions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_log" ADD CONSTRAINT "cash_log_expense_type_id_expense_types_id_fk" FOREIGN KEY ("expense_type_id") REFERENCES "public"."expense_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_log" ADD CONSTRAINT "cash_log_opex_type_id_opex_types_id_fk" FOREIGN KEY ("opex_type_id") REFERENCES "public"."opex_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_log" ADD CONSTRAINT "cash_log_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_log" ADD CONSTRAINT "cash_log_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cashiers" ADD CONSTRAINT "cashiers_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cashiers" ADD CONSTRAINT "cashiers_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_photos" ADD CONSTRAINT "checklist_photos_checklist_id_quality_checklists_id_fk" FOREIGN KEY ("checklist_id") REFERENCES "public"."quality_checklists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_photos" ADD CONSTRAINT "checklist_photos_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_videos" ADD CONSTRAINT "checklist_videos_checklist_id_quality_checklists_id_fk" FOREIGN KEY ("checklist_id") REFERENCES "public"."quality_checklists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_videos" ADD CONSTRAINT "checklist_videos_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_contacts" ADD CONSTRAINT "customer_contacts_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_contacts" ADD CONSTRAINT "customer_contacts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_contacts" ADD CONSTRAINT "customer_contacts_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_photos" ADD CONSTRAINT "customer_photos_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_photos" ADD CONSTRAINT "customer_photos_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jo_comments" ADD CONSTRAINT "jo_comments_jo_id_job_orders_id_fk" FOREIGN KEY ("jo_id") REFERENCES "public"."job_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jo_comments" ADD CONSTRAINT "jo_comments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jo_comments" ADD CONSTRAINT "jo_comments_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jo_labor_comments" ADD CONSTRAINT "jo_labor_comments_jo_labor_id_jo_labors_id_fk" FOREIGN KEY ("jo_labor_id") REFERENCES "public"."jo_labors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jo_labor_comments" ADD CONSTRAINT "jo_labor_comments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jo_labor_comments" ADD CONSTRAINT "jo_labor_comments_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jo_labor_mechanics" ADD CONSTRAINT "jo_labor_mechanics_jo_labor_id_jo_labors_id_fk" FOREIGN KEY ("jo_labor_id") REFERENCES "public"."jo_labors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jo_labor_mechanics" ADD CONSTRAINT "jo_labor_mechanics_mechanic_id_mechanics_id_fk" FOREIGN KEY ("mechanic_id") REFERENCES "public"."mechanics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jo_labor_mechanics" ADD CONSTRAINT "jo_labor_mechanics_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jo_labor_mechanics" ADD CONSTRAINT "jo_labor_mechanics_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jo_labor_photos" ADD CONSTRAINT "jo_labor_photos_jo_labor_id_jo_labors_id_fk" FOREIGN KEY ("jo_labor_id") REFERENCES "public"."jo_labors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jo_labor_photos" ADD CONSTRAINT "jo_labor_photos_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jo_labors" ADD CONSTRAINT "jo_labors_jo_id_job_orders_id_fk" FOREIGN KEY ("jo_id") REFERENCES "public"."job_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jo_labors" ADD CONSTRAINT "jo_labors_labor_type_id_labor_types_id_fk" FOREIGN KEY ("labor_type_id") REFERENCES "public"."labor_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jo_labors" ADD CONSTRAINT "jo_labors_status_id_jo_labor_statuses_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."jo_labor_statuses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jo_labors" ADD CONSTRAINT "jo_labors_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jo_labors" ADD CONSTRAINT "jo_labors_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jo_material_comments" ADD CONSTRAINT "jo_material_comments_jo_material_id_jo_materials_id_fk" FOREIGN KEY ("jo_material_id") REFERENCES "public"."jo_materials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jo_material_comments" ADD CONSTRAINT "jo_material_comments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jo_material_comments" ADD CONSTRAINT "jo_material_comments_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jo_material_photos" ADD CONSTRAINT "jo_material_photos_jo_material_id_jo_materials_id_fk" FOREIGN KEY ("jo_material_id") REFERENCES "public"."jo_materials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jo_material_photos" ADD CONSTRAINT "jo_material_photos_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jo_materials" ADD CONSTRAINT "jo_materials_jo_id_job_orders_id_fk" FOREIGN KEY ("jo_id") REFERENCES "public"."job_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jo_materials" ADD CONSTRAINT "jo_materials_part_id_parts_id_fk" FOREIGN KEY ("part_id") REFERENCES "public"."parts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jo_materials" ADD CONSTRAINT "jo_materials_status_id_jo_material_statuses_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."jo_material_statuses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jo_materials" ADD CONSTRAINT "jo_materials_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jo_materials" ADD CONSTRAINT "jo_materials_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jo_payments" ADD CONSTRAINT "jo_payments_jo_id_job_orders_id_fk" FOREIGN KEY ("jo_id") REFERENCES "public"."job_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jo_payments" ADD CONSTRAINT "jo_payments_cashier_id_cashiers_id_fk" FOREIGN KEY ("cashier_id") REFERENCES "public"."cashiers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jo_payments" ADD CONSTRAINT "jo_payments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jo_payments" ADD CONSTRAINT "jo_payments_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jo_photos" ADD CONSTRAINT "jo_photos_jo_id_job_orders_id_fk" FOREIGN KEY ("jo_id") REFERENCES "public"."job_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jo_photos" ADD CONSTRAINT "jo_photos_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_orders" ADD CONSTRAINT "job_orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_orders" ADD CONSTRAINT "job_orders_car_id_cars_id_fk" FOREIGN KEY ("car_id") REFERENCES "public"."cars"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_orders" ADD CONSTRAINT "job_orders_status_id_jo_statuses_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."jo_statuses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_orders" ADD CONSTRAINT "job_orders_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_orders" ADD CONSTRAINT "job_orders_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "labor_prices" ADD CONSTRAINT "labor_prices_labor_type_id_labor_types_id_fk" FOREIGN KEY ("labor_type_id") REFERENCES "public"."labor_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "labor_prices" ADD CONSTRAINT "labor_prices_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "labor_prices" ADD CONSTRAINT "labor_prices_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "labor_type_checklists" ADD CONSTRAINT "labor_type_checklists_labor_type_id_labor_types_id_fk" FOREIGN KEY ("labor_type_id") REFERENCES "public"."labor_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "labor_type_checklists" ADD CONSTRAINT "labor_type_checklists_checklist_id_quality_checklists_id_fk" FOREIGN KEY ("checklist_id") REFERENCES "public"."quality_checklists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "labor_type_checklists" ADD CONSTRAINT "labor_type_checklists_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "labor_type_checklists" ADD CONSTRAINT "labor_type_checklists_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "labor_types" ADD CONSTRAINT "labor_types_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "labor_types" ADD CONSTRAINT "labor_types_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mechanic_contacts" ADD CONSTRAINT "mechanic_contacts_mechanic_id_mechanics_id_fk" FOREIGN KEY ("mechanic_id") REFERENCES "public"."mechanics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mechanic_contacts" ADD CONSTRAINT "mechanic_contacts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mechanic_skills" ADD CONSTRAINT "mechanic_skills_mechanic_id_mechanics_id_fk" FOREIGN KEY ("mechanic_id") REFERENCES "public"."mechanics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mechanic_skills" ADD CONSTRAINT "mechanic_skills_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mechanic_skills" ADD CONSTRAINT "mechanic_skills_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mechanics" ADD CONSTRAINT "mechanics_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mechanics" ADD CONSTRAINT "mechanics_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quality_checklists" ADD CONSTRAINT "quality_checklists_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quality_checklists" ADD CONSTRAINT "quality_checklists_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skills" ADD CONSTRAINT "skills_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skills" ADD CONSTRAINT "skills_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "inv_log_part_idx" ON "inventory_log" USING btree ("part_id");--> statement-breakpoint
CREATE INDEX "inv_log_vendor_idx" ON "inventory_log" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "inv_log_action_idx" ON "inventory_log" USING btree ("action_id");--> statement-breakpoint
CREATE INDEX "inv_log_date_idx" ON "inventory_log" USING btree ("date");--> statement-breakpoint
CREATE INDEX "inv_log_year_month_idx" ON "inventory_log" USING btree ("year_month");--> statement-breakpoint
CREATE INDEX "parts_brand_idx" ON "parts" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "parts_cabinet_idx" ON "parts" USING btree ("cabinet_code_id");--> statement-breakpoint
CREATE INDEX "parts_audit_part_idx" ON "parts_audit" USING btree ("part_id");--> statement-breakpoint
CREATE INDEX "parts_prices_part_idx" ON "parts_prices" USING btree ("part_id");--> statement-breakpoint
CREATE INDEX "parts_suppliers_part_idx" ON "parts_suppliers" USING btree ("part_id");--> statement-breakpoint
CREATE INDEX "parts_suppliers_vendor_idx" ON "parts_suppliers" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "pr_lines_pr_idx" ON "pr_lines" USING btree ("pr_id");--> statement-breakpoint
CREATE INDEX "pr_lines_part_idx" ON "pr_lines" USING btree ("part_id");--> statement-breakpoint
CREATE INDEX "cars_owner_idx" ON "cars" USING btree ("primary_owner_id");--> statement-breakpoint
CREATE INDEX "cash_log_date_idx" ON "cash_log" USING btree ("date");--> statement-breakpoint
CREATE INDEX "cash_log_action_idx" ON "cash_log" USING btree ("action_id");--> statement-breakpoint
CREATE INDEX "cash_log_year_month_idx" ON "cash_log" USING btree ("year_month");--> statement-breakpoint
CREATE INDEX "jo_labor_mech_labor_idx" ON "jo_labor_mechanics" USING btree ("jo_labor_id");--> statement-breakpoint
CREATE INDEX "jo_labor_mech_mechanic_idx" ON "jo_labor_mechanics" USING btree ("mechanic_id");--> statement-breakpoint
CREATE INDEX "jo_labors_jo_idx" ON "jo_labors" USING btree ("jo_id");--> statement-breakpoint
CREATE INDEX "jo_labors_type_idx" ON "jo_labors" USING btree ("labor_type_id");--> statement-breakpoint
CREATE INDEX "jo_materials_jo_idx" ON "jo_materials" USING btree ("jo_id");--> statement-breakpoint
CREATE INDEX "jo_materials_part_idx" ON "jo_materials" USING btree ("part_id");--> statement-breakpoint
CREATE INDEX "jo_payments_jo_idx" ON "jo_payments" USING btree ("jo_id");--> statement-breakpoint
CREATE INDEX "jo_customer_idx" ON "job_orders" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "jo_car_idx" ON "job_orders" USING btree ("car_id");--> statement-breakpoint
CREATE INDEX "jo_status_idx" ON "job_orders" USING btree ("status_id");--> statement-breakpoint
CREATE INDEX "jo_checkin_idx" ON "job_orders" USING btree ("checkin_date");--> statement-breakpoint
CREATE INDEX "ltc_labor_type_idx" ON "labor_type_checklists" USING btree ("labor_type_id");--> statement-breakpoint
CREATE INDEX "ltc_checklist_idx" ON "labor_type_checklists" USING btree ("checklist_id");--> statement-breakpoint
CREATE INDEX "mech_skills_mech_idx" ON "mechanic_skills" USING btree ("mechanic_id");--> statement-breakpoint
CREATE INDEX "mech_skills_skill_idx" ON "mechanic_skills" USING btree ("skill_id");