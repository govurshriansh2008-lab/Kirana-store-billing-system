import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import MetricCard from "@/components/shared/MetricCard";
import {
  IndianRupee, TrendingUp, CalendarDays, Receipt,
  Package, BookOpen, Users, Calculator
} from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = ["#00B4D8", "#00E676", "#FF9100", "#EF4444", "#A855F7", "#F472B6"];

export default function Reports() {
  const { data: items = [] } = useQuery({ queryKey: ["items"], queryFn: () => base44.entities.InventoryItem.list() });
  const { data: bills = [] } = useQuery({ queryKey: ["bills"], queryFn: () => base44.entities.Bill.list() });
  const { data: vendors = [] } = useQuery({ queryKey: ["vendors"], queryFn: () => base44.entities.Vendor.list() });
  const { data: credit = [] } = useQuery({ queryKey: ["credit"], queryFn: () => base44.entities.CreditCustomer.list() });

  const totalRevenue = bills.reduce((s, b) => s + (b.grand_total || 0), 0);
  const today = new Date().toISOString().split("T")[0];
  const todaySales = bills.filter(b => b.created_date?.startsWith(today)).reduce((s, b) => s + (b.grand_total || 0), 0);
  const now = new Date();
  const monthlySales = bills.filter(b => {
    const d = new Date(b.created_date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((s, b) => s + (b.grand_total || 0), 0);
  const totalGST = bills.reduce((s, b) => s + (b.gst_total || 0), 0);
  const totalCredit = credit.reduce((s, c) => s + (c.total_credit || 0), 0);
  const totalVendorPay = vendors.reduce((s, v) => s + (v.total_paid || 0), 0);
  const avgBill = bills.length > 0 ? totalRevenue / bills.length : 0;

  // Payment methods donut
  const payMap = {};
  bills.forEach(b => { payMap[b.payment_mode || "Cash"] = (payMap[b.payment_mode || "Cash"] || 0) + 1; });
  const payData = Object.entries(payMap).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reports & Analytics</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        <MetricCard title="Total Revenue" value={`₹${totalRevenue.toFixed(2)}`} icon={IndianRupee} color="text-[#00E676]" bgColor="bg-[#00E676]/10" />
        <MetricCard title="Today's Sales" value={`₹${todaySales.toFixed(2)}`} icon={TrendingUp} color="text-primary" bgColor="bg-primary/10" />
        <MetricCard title="Monthly Sales" value={`₹${monthlySales.toFixed(2)}`} icon={CalendarDays} color="text-[#FF9100]" bgColor="bg-[#FF9100]/10" />
        <MetricCard title="Total GST" value={`₹${totalGST.toFixed(2)}`} icon={Receipt} color="text-[#A855F7]" bgColor="bg-[#A855F7]/10" />
        <MetricCard title="Inventory" value={`${items.length} items`} icon={Package} color="text-primary" bgColor="bg-primary/10" />
        <MetricCard title="Credit Outstanding" value={`₹${totalCredit.toFixed(2)}`} icon={BookOpen} color="text-destructive" bgColor="bg-destructive/10" />
        <MetricCard title="Vendor Payouts" value={`₹${totalVendorPay.toFixed(2)}`} icon={Users} color="text-[#FF9100]" bgColor="bg-[#FF9100]/10" />
        <MetricCard title="Avg Bill Value" value={`₹${avgBill.toFixed(2)}`} icon={Calculator} color="text-[#00E676]" bgColor="bg-[#00E676]/10" />
      </div>

      {/* Payment Methods Chart — only chart retained */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold mb-4">Payment Methods</h3>
          {payData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={payData}
                  cx="50%" cy="50%"
                  innerRadius={60} outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {payData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(222,41%,11%)", border: "1px solid hsl(222,30%,22%)", borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
          )}
        </div>

        {/* Summary table */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold mb-4">Financial Summary</h3>
          <div className="space-y-3">
            {[
              { label: "Total Bills", value: bills.length, unit: "bills" },
              { label: "Cash Transactions", value: bills.filter(b => b.payment_mode === "Cash").length, unit: "bills" },
              { label: "UPI Transactions", value: bills.filter(b => b.payment_mode === "UPI").length, unit: "bills" },
              { label: "Credit Transactions", value: bills.filter(b => b.payment_mode === "Credit").length, unit: "bills" },
              { label: "Total Items in Stock", value: items.reduce((s, i) => s + (i.stock_qty || 0), 0), unit: "units" },
              { label: "Active Vendors", value: vendors.length, unit: "vendors" },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                <span className="text-sm text-muted-foreground">{row.label}</span>
                <span className="text-sm font-semibold">{row.value} <span className="text-xs text-muted-foreground">{row.unit}</span></span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}