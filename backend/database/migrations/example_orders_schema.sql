-- PostgreSQL schema EXAMPLE only: adapt to Laravel migrations and review for real use.
-- This is not automatically run by the frontend.
CREATE TABLE IF NOT EXISTS posa_orders (
  id UUID PRIMARY KEY,
  business_id UUID NOT NULL,
  device_id UUID NOT NULL,
  client_order_id UUID NOT NULL,
  amount_minor BIGINT NOT NULL CHECK (amount_minor >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (business_id, client_order_id)
);
-- Recommended next: foreign keys, order_items, payments, taxes, voids, audit log,
-- stock ledger, device provisioning, tenant isolation and RBAC.
