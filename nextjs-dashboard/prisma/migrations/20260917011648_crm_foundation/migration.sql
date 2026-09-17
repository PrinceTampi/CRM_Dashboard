/*
  Warnings:

  - You are about to drop the `Customer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Invoice` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Revenue` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'AHASS');

-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('RECEIVED', 'VALIDATING', 'READY', 'PROCESSING', 'COMPLETED', 'COMPLETED_WITH_WARNINGS', 'FAILED');

-- CreateEnum
CREATE TYPE "ImportRowStatus" AS ENUM ('PENDING', 'VALID', 'WARNING', 'REJECTED', 'IMPORTED');

-- CreateEnum
CREATE TYPE "H23TransactionType" AS ENUM ('SERVICE', 'PART', 'PARTSERVICE');

-- DropForeignKey
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_customerId_fkey";

-- DropTable
DROP TABLE "Customer";

-- DropTable
DROP TABLE "Invoice";

-- DropTable
DROP TABLE "Revenue";

-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'AHASS',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dealers" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dealers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalized_name" TEXT NOT NULL,
    "nik" TEXT,
    "birth_date" DATE,
    "phone" TEXT,
    "alternate_phone" TEXT,
    "email" TEXT,
    "contact_identity_status" TEXT NOT NULL DEFAULT 'UNVERIFIED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "engine_number" TEXT NOT NULL,
    "frame_number" TEXT NOT NULL,
    "plate_number" TEXT,
    "model" TEXT,
    "color" TEXT,
    "assembly_year" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_batches" (
    "id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "status" "ImportStatus" NOT NULL DEFAULT 'RECEIVED',
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploaded_by_id" TEXT NOT NULL,
    "dealerId" TEXT,

    CONSTRAINT "import_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_rows" (
    "id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "sheet_name" TEXT NOT NULL,
    "row_number" INTEGER NOT NULL,
    "raw_data" JSONB NOT NULL,
    "status" "ImportRowStatus" NOT NULL DEFAULT 'PENDING',
    "error_message" TEXT,
    "imported_entity" TEXT,
    "imported_entity_id" TEXT,

    CONSTRAINT "import_rows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "import_row_id" TEXT,
    "row_number" INTEGER,
    "field_name" TEXT,
    "error_code" TEXT NOT NULL,
    "raw_value" JSONB,
    "severity" TEXT NOT NULL,
    "system_action" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "h1_sales" (
    "id" TEXT NOT NULL,
    "source_no" INTEGER NOT NULL,
    "dealer_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "invoice_date" DATE NOT NULL,
    "payment_type" TEXT NOT NULL,
    "leasing_code" TEXT,
    "tenor" INTEGER,
    "down_payment" DECIMAL(14,2),
    "verified_down_payment" DECIMAL(14,2),
    "verified_tenor" INTEGER,
    "verified_installment" DECIMAL(14,2),
    "status" TEXT,
    "verification_status" TEXT,
    "ring" TEXT,
    "sales_force_code" TEXT,
    "salesForce" TEXT,
    "sales_name" TEXT,
    "discount_amount" DECIMAL(14,2),
    "import_row_id" TEXT,

    CONSTRAINT "h1_sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "h23_invoices" (
    "id" TEXT NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "work_order_number" TEXT NOT NULL,
    "invoice_date" DATE NOT NULL,
    "dealer_id" TEXT NOT NULL,
    "customer_id" TEXT,
    "vehicle_id" TEXT,
    "import_row_id" TEXT,

    CONSTRAINT "h23_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "h2_service_items" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "customer_id" TEXT,
    "vehicle_id" TEXT,
    "dealer_id" TEXT NOT NULL,
    "item_number" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "transaction_type" "H23TransactionType" NOT NULL DEFAULT 'SERVICE',
    "quantity" INTEGER NOT NULL,
    "price" DECIMAL(14,2) NOT NULL,
    "gross_amount" DECIMAL(14,2) NOT NULL,
    "discount_rate" DECIMAL(6,4),
    "discount_amount" DECIMAL(14,2),
    "mechanic_name" TEXT,
    "service_advisor_id" TEXT,
    "service_advisor_name" TEXT,

    CONSTRAINT "h2_service_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "h3_part_items" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "customer_id" TEXT,
    "vehicle_id" TEXT,
    "dealer_id" TEXT NOT NULL,
    "item_number" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "transaction_type" "H23TransactionType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DECIMAL(14,2) NOT NULL,
    "gross_amount" DECIMAL(14,2) NOT NULL,
    "discount_rate" DECIMAL(6,4),
    "discount_amount" DECIMAL(14,2),
    "group_part" TEXT,

    CONSTRAINT "h3_part_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lov_values" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "lov_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "h3_activation_leads" (
    "source_id" INTEGER NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL,
    "assigned_at" TIMESTAMP(3),
    "customer_id" TEXT,
    "source_data" TEXT NOT NULL,
    "md_code" TEXT NOT NULL,
    "assigned_dealer_id" TEXT,
    "followed_up_at" TIMESTAMP(3),
    "contact_status_lov_id" TEXT,
    "contact_label" TEXT,
    "progress_status" TEXT,
    "prospect_status" TEXT,
    "not_deal_reason_lov_id" TEXT,
    "has_follow_up" TEXT NOT NULL,

    CONSTRAINT "h3_activation_leads_pkey" PRIMARY KEY ("source_id")
);

-- CreateTable
CREATE TABLE "prospect_leads" (
    "lead_id" TEXT NOT NULL,
    "guestbook_id" TEXT,
    "guestbook_at" TIMESTAMP(3),
    "customer_id" TEXT,
    "sales_channel" TEXT,
    "event_code" TEXT,
    "event_description" TEXT,
    "platform" TEXT,
    "contact_status" TEXT,
    "contact_channel" TEXT,
    "next_follow_up" TIMESTAMP(3),
    "sla_deadline" TIMESTAMP(3),
    "prospect_type" TEXT,
    "customer_type" TEXT,
    "assigned_dealer_id" TEXT,
    "status" TEXT NOT NULL,

    CONSTRAINT "prospect_leads_pkey" PRIMARY KEY ("lead_id")
);

-- CreateTable
CREATE TABLE "lcr_campaign_records" (
    "id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "dealer_id" TEXT NOT NULL,
    "campaign_code" TEXT NOT NULL,
    "reference_frame" TEXT,
    "is_treated" BOOLEAN NOT NULL DEFAULT false,
    "treatment_status" TEXT,
    "invoice_date" DATE,

    CONSTRAINT "lcr_campaign_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "niguri_h1_snapshots" (
    "id" TEXT NOT NULL,
    "dealer_id" TEXT NOT NULL,
    "month" DATE NOT NULL,
    "source_category" TEXT NOT NULL,
    "total_data_source" INTEGER NOT NULL,
    "total_data_analysis_result" INTEGER NOT NULL,
    "total_data_followup_phone" INTEGER NOT NULL,
    "total_prospect" INTEGER NOT NULL,
    "total_customer_deal" INTEGER NOT NULL,
    "total_unit_sold" INTEGER NOT NULL,

    CONSTRAINT "niguri_h1_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "niguri_h3_snapshots" (
    "id" TEXT NOT NULL,
    "dealer_id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" TEXT NOT NULL,
    "pipeline" TEXT NOT NULL,
    "total_part_sales" DECIMAL(16,2),
    "total_follow_up" INTEGER NOT NULL,
    "total_prospect" INTEGER NOT NULL,
    "deal_customer" INTEGER NOT NULL,

    CONSTRAINT "niguri_h3_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repair_orders" (
    "id" TEXT NOT NULL,
    "ro_number" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "dealer_id" TEXT NOT NULL,
    "ro_date" DATE NOT NULL,
    "job" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "cost" DECIMAL(14,2),

    CONSTRAINT "repair_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "h2_follow_ups" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "h1_sale_id" TEXT,
    "contact_status" TEXT,
    "result" TEXT,
    "follow_up_date" DATE NOT NULL,

    CONSTRAINT "h2_follow_ups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lcr_follow_ups" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "dealer_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "contact_status" TEXT,
    "result" TEXT,
    "follow_up_date" DATE NOT NULL,

    CONSTRAINT "lcr_follow_ups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "birthday_follow_ups" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "contact_status" TEXT,
    "deal_status" TEXT,
    "follow_up_date" DATE NOT NULL,

    CONSTRAINT "birthday_follow_ups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_registrations" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "dealer_id" TEXT,
    "engine_number" TEXT NOT NULL,
    "location" TEXT,
    "notes" TEXT,
    "event_date" DATE NOT NULL,

    CONSTRAINT "event_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "dealers_code_key" ON "dealers"("code");

-- CreateIndex
CREATE UNIQUE INDEX "customers_nik_key" ON "customers"("nik");

-- CreateIndex
CREATE INDEX "customers_normalized_name_idx" ON "customers"("normalized_name");

-- CreateIndex
CREATE INDEX "customers_phone_idx" ON "customers"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_engine_number_key" ON "vehicles"("engine_number");

-- CreateIndex
CREATE INDEX "vehicles_frame_number_idx" ON "vehicles"("frame_number");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_engine_number_frame_number_key" ON "vehicles"("engine_number", "frame_number");

-- CreateIndex
CREATE INDEX "import_batches_status_uploaded_at_idx" ON "import_batches"("status", "uploaded_at");

-- CreateIndex
CREATE UNIQUE INDEX "import_rows_batch_id_sheet_name_row_number_key" ON "import_rows"("batch_id", "sheet_name", "row_number");

-- CreateIndex
CREATE INDEX "audit_logs_batch_id_severity_idx" ON "audit_logs"("batch_id", "severity");

-- CreateIndex
CREATE UNIQUE INDEX "h1_sales_import_row_id_key" ON "h1_sales"("import_row_id");

-- CreateIndex
CREATE INDEX "h1_sales_customer_id_invoice_date_idx" ON "h1_sales"("customer_id", "invoice_date");

-- CreateIndex
CREATE UNIQUE INDEX "h1_sales_dealer_id_source_no_invoice_date_key" ON "h1_sales"("dealer_id", "source_no", "invoice_date");

-- CreateIndex
CREATE INDEX "h23_invoices_work_order_number_idx" ON "h23_invoices"("work_order_number");

-- CreateIndex
CREATE UNIQUE INDEX "h23_invoices_dealer_id_invoice_number_key" ON "h23_invoices"("dealer_id", "invoice_number");

-- CreateIndex
CREATE UNIQUE INDEX "h2_service_items_invoice_id_item_number_transaction_type_key" ON "h2_service_items"("invoice_id", "item_number", "transaction_type");

-- CreateIndex
CREATE UNIQUE INDEX "h3_part_items_invoice_id_item_number_transaction_type_key" ON "h3_part_items"("invoice_id", "item_number", "transaction_type");

-- CreateIndex
CREATE UNIQUE INDEX "lov_values_category_value_key" ON "lov_values"("category", "value");

-- CreateIndex
CREATE INDEX "h3_activation_leads_assigned_dealer_id_prospect_status_idx" ON "h3_activation_leads"("assigned_dealer_id", "prospect_status");

-- CreateIndex
CREATE INDEX "prospect_leads_assigned_dealer_id_status_idx" ON "prospect_leads"("assigned_dealer_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "lcr_campaign_records_vehicle_id_campaign_code_key" ON "lcr_campaign_records"("vehicle_id", "campaign_code");

-- CreateIndex
CREATE UNIQUE INDEX "niguri_h1_snapshots_dealer_id_month_source_category_key" ON "niguri_h1_snapshots"("dealer_id", "month", "source_category");

-- CreateIndex
CREATE UNIQUE INDEX "niguri_h3_snapshots_dealer_id_year_month_pipeline_key" ON "niguri_h3_snapshots"("dealer_id", "year", "month", "pipeline");

-- CreateIndex
CREATE UNIQUE INDEX "repair_orders_dealer_id_ro_number_key" ON "repair_orders"("dealer_id", "ro_number");

-- CreateIndex
CREATE INDEX "h2_follow_ups_customer_id_follow_up_date_idx" ON "h2_follow_ups"("customer_id", "follow_up_date");

-- CreateIndex
CREATE INDEX "lcr_follow_ups_dealer_id_status_idx" ON "lcr_follow_ups"("dealer_id", "status");

-- CreateIndex
CREATE INDEX "birthday_follow_ups_customer_id_follow_up_date_idx" ON "birthday_follow_ups"("customer_id", "follow_up_date");

-- CreateIndex
CREATE INDEX "event_registrations_customer_id_event_date_idx" ON "event_registrations"("customer_id", "event_date");

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "dealers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_rows" ADD CONSTRAINT "import_rows_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "import_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "import_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_import_row_id_fkey" FOREIGN KEY ("import_row_id") REFERENCES "import_rows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "h1_sales" ADD CONSTRAINT "h1_sales_dealer_id_fkey" FOREIGN KEY ("dealer_id") REFERENCES "dealers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "h1_sales" ADD CONSTRAINT "h1_sales_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "h1_sales" ADD CONSTRAINT "h1_sales_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "h23_invoices" ADD CONSTRAINT "h23_invoices_dealer_id_fkey" FOREIGN KEY ("dealer_id") REFERENCES "dealers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "h23_invoices" ADD CONSTRAINT "h23_invoices_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "h23_invoices" ADD CONSTRAINT "h23_invoices_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "h2_service_items" ADD CONSTRAINT "h2_service_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "h23_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "h2_service_items" ADD CONSTRAINT "h2_service_items_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "h2_service_items" ADD CONSTRAINT "h2_service_items_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "h2_service_items" ADD CONSTRAINT "h2_service_items_dealer_id_fkey" FOREIGN KEY ("dealer_id") REFERENCES "dealers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "h3_part_items" ADD CONSTRAINT "h3_part_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "h23_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "h3_part_items" ADD CONSTRAINT "h3_part_items_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "h3_part_items" ADD CONSTRAINT "h3_part_items_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "h3_part_items" ADD CONSTRAINT "h3_part_items_dealer_id_fkey" FOREIGN KEY ("dealer_id") REFERENCES "dealers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "h3_activation_leads" ADD CONSTRAINT "h3_activation_leads_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "h3_activation_leads" ADD CONSTRAINT "h3_activation_leads_assigned_dealer_id_fkey" FOREIGN KEY ("assigned_dealer_id") REFERENCES "dealers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "h3_activation_leads" ADD CONSTRAINT "h3_activation_leads_contact_status_lov_id_fkey" FOREIGN KEY ("contact_status_lov_id") REFERENCES "lov_values"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "h3_activation_leads" ADD CONSTRAINT "h3_activation_leads_not_deal_reason_lov_id_fkey" FOREIGN KEY ("not_deal_reason_lov_id") REFERENCES "lov_values"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prospect_leads" ADD CONSTRAINT "prospect_leads_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prospect_leads" ADD CONSTRAINT "prospect_leads_assigned_dealer_id_fkey" FOREIGN KEY ("assigned_dealer_id") REFERENCES "dealers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lcr_campaign_records" ADD CONSTRAINT "lcr_campaign_records_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lcr_campaign_records" ADD CONSTRAINT "lcr_campaign_records_dealer_id_fkey" FOREIGN KEY ("dealer_id") REFERENCES "dealers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "niguri_h1_snapshots" ADD CONSTRAINT "niguri_h1_snapshots_dealer_id_fkey" FOREIGN KEY ("dealer_id") REFERENCES "dealers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "niguri_h3_snapshots" ADD CONSTRAINT "niguri_h3_snapshots_dealer_id_fkey" FOREIGN KEY ("dealer_id") REFERENCES "dealers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_orders" ADD CONSTRAINT "repair_orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_orders" ADD CONSTRAINT "repair_orders_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_orders" ADD CONSTRAINT "repair_orders_dealer_id_fkey" FOREIGN KEY ("dealer_id") REFERENCES "dealers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "h2_follow_ups" ADD CONSTRAINT "h2_follow_ups_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "h2_follow_ups" ADD CONSTRAINT "h2_follow_ups_h1_sale_id_fkey" FOREIGN KEY ("h1_sale_id") REFERENCES "h1_sales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lcr_follow_ups" ADD CONSTRAINT "lcr_follow_ups_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lcr_follow_ups" ADD CONSTRAINT "lcr_follow_ups_dealer_id_fkey" FOREIGN KEY ("dealer_id") REFERENCES "dealers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "birthday_follow_ups" ADD CONSTRAINT "birthday_follow_ups_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_dealer_id_fkey" FOREIGN KEY ("dealer_id") REFERENCES "dealers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
