import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import {
  IndianRupee, TrendingUp, CalendarDays, Package, AlertTriangle,
  PackageX, BookOpen, Users, ShoppingCart, Plus, BarChart3
} from "lucide-react";
import MetricCard from "@/components/shared/MetricCard";

export default function Dashboard() {
  const { data: items = [] } = useQuery({ queryKey: ["items"], queryFn: () => base44.entities.InventoryItem.list() });
  const { data: bills = [] } = useQuery({ queryKey: ["bills"], queryFn: () => base44.entities.Bill.list() });
  const { data: vendors = [] } = useQuery({ queryKey: ["vendors"], queryFn: () => base44.entities.Vendor.list() });
  const { data: creditCustomers = [] } = useQuery({ queryKey: ["credit"], queryFn: () => base44.entities.CreditCustomer.list() });

  const today = new Date().toISOString().split("T")[0];
  const todayBills = bills.filter(b => b.created_date?.startsWith(today));
  const totalRevenue = bills.reduce((s, b) => s + (b.grand_total || 0), 0);
  const todaySales = todayBills.reduce((s, b) => s + (b.grand_total || 0), 0);

  const now = new Date();
  const monthBills = bills.filter(b => {
    const d = new Date(b.created_date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthlySales = monthBills.reduce((s, b) => s + (b.grand_total || 0), 0);

  const lowStock = items.filter(i => i.stock_qty > 0 && i.stock_qty <= (i.min_stock || 5));
  const outOfStock = items.filter(i => i.stock_qty <= 0);
  const creditPending = creditCustomers.reduce((s, c) => s + (c.total_credit || 0), 0);

  const alertItems = [
    ...outOfStock.map(i => ({ ...i, alertType: "out" })),
    ...lowStock.map(i => ({ ...i, alertType: "low" })),
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Revenue" value={`₹${totalRevenue.toFixed(2)}`} icon={IndianRupee} color="text-[#00E676]" bgColor="bg-[#00E676]/10" />
        <MetricCard title="Today's Sales" value={`₹${todaySales.toFixed(2)}`} icon={TrendingUp} color="text-primary" bgColor="bg-primary/10" />
        <MetricCard title="Monthly Sales" value={`₹${monthlySales.toFixed(2)}`} icon={CalendarDays} color="text-[#FF9100]" bgColor="bg-[#FF9100]/10" />
        <MetricCard title="Total Items" value={`${items.length} items`} icon={Package} color="text-[#A855F7]" bgColor="bg-[#A855F7]/10" />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <AlertTriangle className="w-5 h-5 text-[#FF9100] mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">Low Stock</p>
          <p className="text-lg font-bold text-[#FF9100]">{lowStock.length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <PackageX className="w-5 h-5 text-destructive mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">Out of Stock</p>
          <p className="text-lg font-bold text-destructive">{outOfStock.length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <BookOpen className="w-5 h-5 text-primary mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">Credit Pending</p>
          <p className="text-lg font-bold text-primary">₹{creditPending.toFixed(2)}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <Users className="w-5 h-5 text-[#00E676] mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">Vendors</p>
          <p className="text-lg font-bold text-[#00E676]">{vendors.length}</p>
        </div>
      </div>

      {/* Bottom Two-Column: Quick Actions + Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Quick Actions — 2x2 */}
        <div>
          <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider text-muted-foreground">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/billing" className="flex items-center gap-3 bg-[#00E676]/15 hover:bg-[#00E676]/25 border border-[#00E676]/30 rounded-xl p-4 transition-all group">
              <div className="w-10 h-10 rounded-lg bg-[#00E676]/20 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-[#00E676]" />
              </div>
              <span className="font-semibold text-[#00E676] text-sm">New Bill</span>
            </Link>

            <Link to="/items" className="flex items-center gap-3 bg-primary/15 hover:bg-primary/25 border border-primary/30 rounded-xl p-4 transition-all group">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Plus className="w-5 h-5 text-primary" />
              </div>
              <span className="font-semibold text-primary text-sm">Add Item</span>
            </Link>

            <Link to="/vendors" className="flex items-center gap-3 bg-card hover:bg-secondary/60 border border-border rounded-xl p-4 transition-all group">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <Users className="w-5 h-5 text-muted-foreground" />
              </div>
              <span className="font-semibold text-sm">Vendors</span>
            </Link>

            <Link to="/reports" className="flex items-center gap-3 bg-card hover:bg-secondary/60 border border-border rounded-xl p-4 transition-all group">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-muted-foreground" />
              </div>
              <span className="font-semibold text-sm">Reports</span>
            </Link>
          </div>
        </div>

        {/* Stock Alerts Panel */}
        <div className="bg-card rounded-xl border border-border overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h3 className="text-sm font-semibold uppercase tracking-wider">Stock Alerts</h3>
            {alertItems.length > 0 && (
              <span className="bg-destructive text-destructive-foreground text-xs font-bold px-3 py-1 rounded-full">
                {alertItems.length} ALERT{alertItems.length > 1 ? "S" : ""}
              </span>
            )}
          </div>
          <div className="overflow-y-auto max-h-60 divide-y divide-border/40">
            {alertItems.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                <Package className="w-8 h-8 mx-auto mb-2 opacity-20" />
                All items are well stocked
              </div>
            ) : alertItems.map(item => (
              <div key={item.id} className="flex items-center justify-between px-5 py-3 hover:bg-secondary/20 transition-colors">
                <span className="text-sm font-medium uppercase truncate mr-3">{item.name}</span>
                {item.alertType === "out" ? (
                  <span className="shrink-0 bg-destructive text-white text-xs font-bold px-2.5 py-1 rounded-md">OUT</span>
                ) : (
                  <span className="shrink-0 bg-[#FF9100] text-black text-xs font-bold px-2.5 py-1 rounded-md">LOW: {item.stock_qty}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}