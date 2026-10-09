import Dexie, { type EntityTable } from 'dexie';

export type OrderItem = { productId: string; name: string; unitPrice: number; quantity: number };
export type Order = {
  id: string;
  createdAt: string;
  items: OrderItem[];
  total: number;
  paymentMethod: 'cash';
  syncStatus: 'local-only';
};

const db = new Dexie('posa-starter') as Dexie & { orders: EntityTable<Order, 'id'> };
db.version(1).stores({ orders: 'id, createdAt, syncStatus' });
export { db };

export async function saveOrder(items: OrderItem[]): Promise<Order> {
  if (!items.length) throw new Error('Cannot check out an empty cart');
  const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const order: Order = {
    id: crypto.randomUUID(), createdAt: new Date().toISOString(), items, total,
    paymentMethod: 'cash', syncStatus: 'local-only'
  };
  await db.orders.add(order);
  return order;
}
