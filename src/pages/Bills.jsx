import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, FileText, Eye, Printer } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PrintInvoice from "@/components/billing/PrintInvoice";

const modeColor = {
  Cash: "bg-[#00E676]/20 text-[#00E676]",
  UPI: "bg-primary/20 text-primary",
  Credit: "bg-[#FF9100]/20 text-[#FF9100]"
};

// Always use IST for this store (Asia/Kolkata = UTC+5:30)
const STORE_TZ = "Asia/Kolkata";

const fmtDate = (ts) => {
  if (!ts) return "—";
  // Ensure the timestamp is treated as UTC by appending Z if missing
  const normalized = ts.endsWith("Z") || ts.includes("+") ? ts : ts + "Z";
  return new Date(normalized).toLocaleString("en-IN", {
    timeZone: STORE_TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
};

export default function Bills() {
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [selectedBill, setSelectedBill] = useState(null);
  const [printBill, setPrintBill] = useState(null);

  const { data: bills = [], isLoading } = useQuery({
    queryKey: ["bills"],
    queryFn: () => base44.entities.Bill.list("-created_date")
  });

  const filtered = bills.filter(b => {
    const matchSearch = !search ||
      b.bill_number?.toLowerCase().includes(search.toLowerCase()) ||
      b.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      b.payment_mode?.toLowerCase().includes(search.toLowerCase());

    let matchDate = true;
    const billDate = b.created_date?.split("T")[0] || "";
    if (dateFrom) matchDate = matchDate && billDate >= dateFrom;
    if (dateTo) matchDate = matchDate && billDate <= dateTo;

    const amount = b.grand_total || 0;
    const matchMin = !minAmount || amount >= Number(minAmount);
    const matchMax = !maxAmount || amount <= Number(maxAmount);

    return matchSearch && matchDate && matchMin && matchMax;
  });

  const totalRevenue = filtered.reduce((s, b) => s + (b.grand_total || 0), 0);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Bills History</h1>

      {/* Search & Filter Bar */}
      <div className="bg-card rounded-xl border border-border p-4 space-y-3">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search bill no, customer, mode..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Date:</span>
            <Input type="date" className="w-40 text-sm" value={dateFrom} onChange={e => setDateFrom(e.target.value)} placeholder="dd-mm-yyyy" />
            <span className="text-xs text-muted-foreground">to</span>
            <Input type="date" className="w-40 text-sm" value={dateTo} onChange={e => setDateTo(e.target.value)} placeholder="dd-mm-yyyy" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Amount ₹:</span>
            <Input type="number" placeholder="Min" className="w-24 text-sm" value={minAmount} onChange={e => setMinAmount(e.target.value)} />
            <span className="text-xs text-muted-foreground">—</span>
            <Input type="number" placeholder="Max" className="w-24 text-sm" value={maxAmount} onChange={e => setMaxAmount(e.target.value)} />
          </div>
          {(search || dateFrom || dateTo || minAmount || maxAmount) && (
            <Button variant="outline" size="sm" onClick={() => { setSearch(""); setDateFrom(""); setDateTo(""); setMinAmount(""); setMaxAmount(""); }}>
              Clear Filters
            </Button>
          )}
        </div>

        <div className="flex items-center gap-6 text-sm pt-1">
          <span className="text-muted-foreground">{filtered.length} bills</span>
          <span className="font-semibold text-[#00E676]">Total: ₹{totalRevenue.toFixed(2)}</span>
        </div>
      </div>

      {/* Grid */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground bg-secondary/30">
                <th className="text-left p-4">BILL NO</th>
                <th className="text-left p-4">DATE & TIME</th>
                <th className="text-right p-4">AMOUNT (₹)</th>
                <th className="text-center p-4">PAYMENT MODE</th>
                <th className="text-left p-4">CUSTOMER</th>
                <th className="text-center p-4">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="text-center p-10 text-muted-foreground">Loading bills...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center p-10 text-muted-foreground">
                  <FileText className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  <p>No bills found</p>
                </td></tr>
              ) : filtered.map(bill => (
                <tr key={bill.id} className="border-b border-border/40 hover:bg-secondary/20 transition-colors">
                  <td className="p-4 font-mono font-bold text-primary">{bill.bill_number}</td>
                  <td className="p-4 text-muted-foreground text-xs">
                    {fmtDate(bill.created_date)}
                  </td>
                  <td className="p-4 text-right font-bold text-base">₹{(bill.grand_total || 0).toFixed(2)}</td>
                  <td className="p-4 text-center">
                    <Badge className={`${modeColor[bill.payment_mode] || "bg-secondary text-muted-foreground"} border-0 text-xs`}>
                      {bill.payment_mode}
                    </Badge>
                  </td>
                  <td className="p-4 text-muted-foreground">{bill.customer_name || "Walk-in Customer"}</td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => setSelectedBill(bill)}
                        className="p-1.5 rounded-md hover:bg-primary/10 text-primary transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setPrintBill(bill)}
                        className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                        title="Print Invoice"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Dialog */}
      <Dialog open={!!selectedBill} onOpenChange={() => setSelectedBill(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-mono text-primary">{selectedBill?.bill_number}</DialogTitle>
          </DialogHeader>
          {selectedBill && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div><span className="text-muted-foreground">Date: </span>{fmtDate(selectedBill.created_date)}</div>
                <div><span className="text-muted-foreground">Customer: </span>{selectedBill.customer_name || "Walk-in"}</div>
              </div>
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-secondary/50 border-b border-border">
                      <th className="p-2.5 text-left">Item</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">Price</th>
                      <th className="p-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedBill.items?.map((item, i) => (
                      <tr key={i} className="border-t border-border/40">
                        <td className="p-2.5 font-medium uppercase">{item.name}</td>
                        <td className="p-2.5 text-center">{item.qty}</td>
                        <td className="p-2.5 text-right">₹{Number(item.price || 0).toFixed(2)}</td>
                        <td className="p-2.5 text-right font-medium">₹{Number(item.total || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>₹{Number(selectedBill.subtotal || 0).toFixed(2)}</span></div>
                <div className="flex justify-between text-muted-foreground"><span>GST</span><span>₹{Number(selectedBill.gst_total || 0).toFixed(2)}</span></div>
                {Number(selectedBill.discount || 0) > 0 && <div className="flex justify-between text-muted-foreground"><span>Discount</span><span className="text-[#FF9100]">-₹{Number(selectedBill.discount || 0).toFixed(2)}</span></div>}
                <div className="flex justify-between font-bold text-lg border-t border-border pt-2">
                  <span>Grand Total</span>
                  <span className="text-[#00E676]">₹{Number(selectedBill.grand_total || 0).toFixed(2)}</span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-1">
                <Badge className={`${modeColor[selectedBill.payment_mode] || ""} border-0`}>{selectedBill.payment_mode}</Badge>
                <Button size="sm" variant="outline" onClick={() => { setPrintBill(selectedBill); setSelectedBill(null); }}>
                  <Printer className="w-3.5 h-3.5 mr-1.5" /> Print
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Print Invoice */}
      {printBill && <PrintInvoice bill={printBill} onClose={() => setPrintBill(null)} />}
    </div>
  );
}