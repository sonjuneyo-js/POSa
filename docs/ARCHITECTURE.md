# Architecture and implementation notes

## Prototype versus production

The frontend is a standalone POS prototype. The example Laravel files are **reference snippets** to guide future backend development, and are not executed by this demo.

## Offline-first flow to implement

1. App loads/caches authenticated product snapshot and business-specific settings when online.
2. Register creates an order with a globally unique UUID and a scoped device/business identifier.
3. Save the local order atomically before showing a success state.
4. On reconnect, transmit pending UUID-tagged orders over HTTPS with an authenticated API session.
5. Server validates all products, prices, discounts, payments, device scope, and permissions.
6. Server uses a uniqueness constraint on `(business_id, client_order_id)` to provide idempotency.
7. Server returns acknowledged IDs, canonical totals, inventory deltas, and conflict responses.
8. Client marks local orders synced only on verified server acknowledgment; retry failures with backoff.
9. Expose reconciliation for price, stock, canceled items, split payments, and clock drift.

Never trust frontend-submitted totals for financial reporting. Keep all offline data access scoped per authenticated business, user, and device. Device loss/clear-site-data risk requires a backup strategy.

## IndexedDB data model (implemented)

`orders`: `id`, `createdAt`, `items[{productId,name,unitPrice,quantity}]`, `total`, `paymentMethod`, `syncStatus='local-only'`.

## Security considerations

Always use HTTPS for remote API. Authenticate/authorize API endpoints and use Laravel policies. Do not put secrets in `VITE_*` frontend environment variables. Do not store card data or sensitive personal information in IndexedDB without a reviewed security model. Apply taxes, discounts and rounding rules consistently on server. Add integration and offline-recovery tests.
