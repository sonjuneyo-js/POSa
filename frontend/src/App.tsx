import { useEffect, useMemo, useState } from 'react';
import { ChartNoAxesCombined, Coffee, CreditCard, LayoutDashboard, Minus, Plus, Receipt, ShoppingBag, Trash2, Wifi, WifiOff } from 'lucide-react';
import { db, saveOrder, type Order, type OrderItem } from './db';

type Product = { id: string; name: string; category: string; price: number; emoji: string };
const products: Product[] = [
  { id: 'latte', name: 'Iced Latte', category: 'Coffee', price: 150, emoji: '🥛' },
  { id: 'americano', name: 'Americano', category: 'Coffee', price: 110, emoji: '☕' },
  { id: 'caramel', name: 'Caramel Macchiato', category: 'Coffee', price: 175, emoji: '🍯' },
  { id: 'matcha', name: 'Matcha Latte', category: 'Non-coffee', price: 165, emoji: '🍵' },
  { id: 'choco', name: 'Hot Chocolate', category: 'Non-coffee', price: 130, emoji: '🍫' },
  { id: 'croissant', name: 'Butter Croissant', category: 'Pastries', price: 115, emoji: '🥐' },
  { id: 'cookie', name: 'Chocolate Cookie', category: 'Pastries', price: 85, emoji: '🍪' },
  { id: 'cheesecake', name: 'Cheesecake', category: 'Pastries', price: 190, emoji: '🍰' }
];
const money = (n: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(n);

type Page = 'pos' | 'transactions' | 'analytics';
export default function App() {
  const [page, setPage] = useState<Page>('pos');
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [online, setOnline] = useState(navigator.onLine);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const refresh = () => { void db.orders.orderBy('createdAt').reverse().toArray().then(setOrders).catch(() => setMessage('Could not read local orders.')); };
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    refresh();
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => { window.removeEventListener('online', goOnline); window.removeEventListener('offline', goOffline); };
  }, []);
  const filtered = useMemo(() => products.filter(p => (category === 'All' || p.category === category) && p.name.toLowerCase().includes(search.toLowerCase())), [category, search]);
  const total = cart.reduce((s, item) => s + item.quantity * item.unitPrice, 0);
  const count = cart.reduce((s, item) => s + item.quantity, 0);
  const revenue = orders.reduce((s, item) => s + item.total, 0);
  function add(p: Product) {
    setCart(items => {
      const found = items.find(i => i.productId === p.id);
      return found ? items.map(i => i.productId === p.id ? { ...i, quantity: i.quantity + 1 } : i) : [...items, { productId: p.id, name: p.name, unitPrice: p.price, quantity: 1 }];
    });
  }
  function change(id: string, diff: number) {
    setCart(items => items.map(i => i.productId === id ? { ...i, quantity: i.quantity + diff } : i).filter(i => i.quantity > 0));
  }
  async function checkout() {
    if (!cart.length || busy) return;
    setBusy(true);
    try {
      const order = await saveOrder(cart);
      setOrders(orders => [order, ...orders]);
      setCart([]);
      setMessage(`Cash sale ${order.id.slice(0, 8)} saved on this device. Not synced to a server.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save order.');
    } finally { setBusy(false); }
  }
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-icon"><Coffee size={24}/></span><span>POSa<small>Point of Sale & Analytics</small></span></div>
      <div className="menu-label">WORKSPACE</div>
      <nav>
        <button className={page === 'pos' ? 'selected' : ''} onClick={() => setPage('pos')}><ShoppingBag size={19}/> Point of Sale</button>
        <button className={page === 'transactions' ? 'selected' : ''} onClick={() => setPage('transactions')}><Receipt size={19}/> Transactions</button>
        <button className={page === 'analytics' ? 'selected' : ''} onClick={() => setPage('analytics')}><ChartNoAxesCombined size={19}/> Analytics</button>
      </nav>
      <div className="sidebar-bottom"><div className="demo-pill">DEMO MODE</div><p>Local-only cash transactions. Server sync, accounts, and real payments are not implemented.</p></div>
    </aside>
    <main className="main">
      <header className="topbar"><div><div className="eyebrow">YOUR WORKSPACE</div><h1>{page === 'pos' ? 'Point of Sale' : page === 'transactions' ? 'Transactions' : 'Sales Analytics'}</h1><p>{page === 'pos' ? 'Serve customers and manage their orders.' : page === 'transactions' ? 'Orders saved on this device.' : 'Overview of local sample sales data.'}</p></div><div className={'connectivity ' + (online ? 'online' : 'offline')}>{online ? <Wifi size={17}/> : <WifiOff size={17}/>} {online ? 'Browser online' : 'Browser offline'}</div></header>
      {message && <div className="notice" role="status">{message}<button onClick={() => setMessage('')} aria-label="Dismiss">×</button></div>}
      {page === 'pos' && <div className="pos-layout"><section className="products-panel"><div className="section-header"><div><h2>Menu</h2><p>Choose products to add to an order</p></div><span className="count-pill">{products.length} items</span></div>
        <input className="search" aria-label="Search products" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search menu items..." />
        <div className="categories">{['All', 'Coffee', 'Non-coffee', 'Pastries'].map(c => <button key={c} className={category === c ? 'active' : ''} onClick={() => setCategory(c)}>{c}</button>)}</div>
        <div className="products">{filtered.map(p => <button key={p.id} className="product-card" onClick={() => add(p)}><span className="product-emoji">{p.emoji}</span><span className="product-title">{p.name}</span><span className="product-category">{p.category}</span><span className="product-price">{money(p.price)} <Plus size={16}/></span></button>)}</div>
        {!filtered.length && <p className="empty">No products found.</p>}
      </section>
      <section className="order-panel"><div className="section-header"><div><h2>Current Order</h2><p>Cash checkout · Local storage</p></div><span className="count-pill">{count} items</span></div><div className="order-items">{cart.length === 0 ? <div className="empty-cart"><ShoppingBag size={32}/><strong>Your cart is empty</strong><span>Add items from the menu to start an order.</span></div> : cart.map(i => <div className="order-item" key={i.productId}><div><strong>{i.name}</strong><small>{money(i.unitPrice)} each</small></div><div className="qty"><button aria-label={'Remove one ' + i.name} onClick={() => change(i.productId, -1)}><Minus size={15}/></button><span>{i.quantity}</span><button aria-label={'Add one ' + i.name} onClick={() => change(i.productId, 1)}><Plus size={15}/></button></div><strong>{money(i.quantity * i.unitPrice)}</strong></div>)}</div><div className="order-footer"><div className="total"><span>Total</span><strong>{money(total)}</strong></div><button className="checkout" disabled={!cart.length || busy} onClick={() => void checkout()}><CreditCard size={18}/>{busy ? 'Saving...' : 'Complete Cash Sale'}</button><button className="clear" disabled={!cart.length} onClick={() => setCart([])}><Trash2 size={15}/> Clear order</button><p className="helper">Saved only in this browser’s IndexedDB. No cloud sync yet.</p></div></section></div>}
      {page === 'transactions' && <section className="data-panel"><div className="section-header"><div><h2>Local Transactions</h2><p>Persist across reloads in this browser profile</p></div><span className="count-pill">{orders.length} orders</span></div>{orders.length === 0 ? <p className="empty">No transactions yet. Complete a cash sale to get started.</p> : <div className="table-wrap"><table><thead><tr><th>Order ID</th><th>Date</th><th>Items</th><th>Amount</th><th>Status</th></tr></thead><tbody>{orders.map(o => <tr key={o.id}><td className="mono">{o.id.slice(0, 8)}</td><td>{new Date(o.createdAt).toLocaleString()}</td><td>{o.items.reduce((s, i) => s + i.quantity, 0)}</td><td>{money(o.total)}</td><td><span className="status">Local only</span></td></tr>)}</tbody></table></div>}</section>}
      {page === 'analytics' && <><div className="stats"><div className="stat"><LayoutDashboard size={20}/><span>Total Sales (This Device)</span><strong>{money(revenue)}</strong></div><div className="stat"><Receipt size={20}/><span>Transactions</span><strong>{orders.length}</strong></div><div className="stat"><Coffee size={20}/><span>Average Sale</span><strong>{money(orders.length ? revenue / orders.length : 0)}</strong></div></div><section className="data-panel"><h2>Product Performance</h2><p className="helper">Based on local demo orders only (not central business reporting).</p>{products.map(p => { const qty = orders.flatMap(o => o.items).filter(i => i.productId === p.id).reduce((s, i) => s + i.quantity, 0); const max = Math.max(1, ...products.map(x => orders.flatMap(o => o.items).filter(i => i.productId === x.id).reduce((s, i) => s + i.quantity, 0))); return <div className="bar-row" key={p.id}><span>{p.name}</span><div className="bar-track"><div style={{width: `${qty / max * 100}%`}} /></div><strong>{qty}</strong></div>; })}</section></>}
    </main>
  </div>;
}
