import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Search, Trash2, X, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import PrintInvoice from "@/components/billing/PrintInvoice";

export default function Billing() {
  const qc = useQueryClient();

  // Active item context
  const [activeItem, setActiveItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  // Cart rows
  const [rows, setRows] = useState([]);

  // Checkout
  const [discount, setDiscount] = useState(0);
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [isCredit, setIsCredit] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [printBill, setPrintBill] = useState(null);

  const { data: items = [] } = useQuery({ queryKey: ["items"], queryFn: () => base44.entities.InventoryItem.list() });
  const { data: bills = [] } = useQuery({ queryKey: ["bills"], queryFn: () => base44.entities.Bill.list() });

  const searchResults = searchQuery.length > 0 ? items.filter(i =>
    i.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.barcode?.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  const selectItem = (item) => {
    setActiveItem(item);
    setSearchQuery("");
    setShowSearch(false);
    // Add blank row for this item
    setRows(prev => {
      const existing = prev.find(r => r.item_id === item.id);
      if (existing) return prev;
      return [...prev, {
        item_id: item.id, name: item.name, category: item.category || "",
        code: item.code || "", barcode: item.barcode || "",
        weight: "", pkt_qty: 1,
        rate: item.sale_price || 0, mrp: item.mrp || 0,
        discount_row: 0, gst: item.gst_percentage || 0,
        price_tiers: item.price_tiers || [],
        amount: item.sale_price || 0
      }];
    });
  };

  const updateRow = (itemId, field, val) => {
    setRows(prev => prev.map(r => {
      if (r.item_id !== itemId) return r;
      const updated = { ...r, [field]: val };
      const qty = Number(updated.pkt_qty) || 1;
      const rate = Number(updated.rate) || 0;
      const disc = Number(updated.discount_row) || 0;
      updated.amount = (rate * qty) - disc;
      return updated;
    }));
  };

  const removeRow = (itemId) => {
    setRows(prev => prev.filter(r => r.item_id !== itemId));
    if (activeItem?.id === itemId) setActiveItem(null);
  };

  const totalItems = rows.length;
  const totalQty = rows.reduce((s, r) => s + (Number(r.pkt_qty) || 1), 0);
  const totalDiscount = rows.reduce((s, r) => s + (Number(r.discount_row) || 0), 0) + Number(discount || 0);
  const subtotal = rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const gstTotal = rows.reduce((s, r) => s + ((Number(r.amount) || 0) * (Number(r.gst) || 0) / 100), 0);
  const grandTotal = subtotal + gstTotal - Number(discount || 0);

  const billMutation = useMutation({
    mutationFn: async () => {
      const today = new Date();
      const year = today.getFullYear();
      const billNum = `SVK-${year}-${String(bills.length + 1).padStart(4, "0")}`;

      const billData = {
        bill_number: billNum,
        items: rows.map(r => ({
          item_id: r.item_id, name: r.name,
          qty: Number(r.pkt_qty) || 1,
          price: Number(r.rate) || 0,
          gst: Number(r.gst) || 0,
          total: Number(r.amount) || 0
        })),
        subtotal, gst_total: gstTotal,
        discount: Number(discount || 0),
        grand_total: grandTotal,
        payment_mode: isCredit ? "Credit" : paymentMode,
        customer_name: customerName, customer_phone: customerPhone,
      };

      const createdBill = await base44.entities.Bill.create(billData);

      // Deduct stock
      for (const r of rows) {
        const item = items.find(i => i.id === r.item_id);
        if (item) await base44.entities.InventoryItem.update(item.id, { stock_qty: Math.max(0, item.stock_qty - (Number(r.pkt_qty) || 1)) });
      }

      // Credit customer
      if (isCredit && customerName) {
        const existingCustomers = await base44.entities.CreditCustomer.filter({ phone: customerPhone });
        if (existingCustomers.length > 0) {
          const cust = existingCustomers[0];
          await base44.entities.CreditCustomer.update(cust.id, { total_credit: (cust.total_credit || 0) + grandTotal, last_purchase_date: today.toISOString().split("T")[0] });
        } else if (customerName) {
          await base44.entities.CreditCustomer.create({ name: customerName, phone: customerPhone, total_credit: grandTotal, last_purchase_date: today.toISOString().split("T")[0], is_overdue: false });
        }
      }

      return { ...billData, created_date: today.toISOString() };
    },
    onSuccess: (billData) => {
      qc.invalidateQueries({ queryKey: ["bills"] });
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: ["credit"] });
      setRows([]); setActiveItem(null); setDiscount(0); setCustomerName(""); setCustomerPhone("");
      toast.success("Bill created! Printing...");
      // Zero-touch: set bill data then auto-trigger print after render
      setPrintBill(billData);
      setTimeout(() => window.print(), 400);
    },
  });

  return (
    <div className="flex flex-col gap-0 h-full">
      {/* Header Context Bar */}
      {activeItem ? (
        <div className="bg-primary/15 border border-primary/30 rounded-xl px-5 py-3 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold bg-primary/20 text-primary px-3 py-1 rounded-full uppercase">{activeItem.category || "GENERAL"}</span>
            <span className="font-bold text-lg uppercase tracking-wider">{activeItem.name}</span>
            <span className="text-muted-foreground text-sm">Item Code: {activeItem.code || "—"}</span>
          </div>
          <button onClick={() => setActiveItem(null)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl px-5 py-3 mb-4 text-muted-foreground text-sm">
          Search and select an item to begin billing
        </div>
      )}

      {/* Pricing Strip */}
      {activeItem && activeItem.price_tiers && activeItem.price_tiers.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {activeItem.price_tiers.filter(t => t.qty > 0).map((tier, i) => (
            <div key={i} className="bg-secondary/60 border border-border rounded-lg px-3 py-2 text-center min-w-[90px]">
              <p className="text-xs text-muted-foreground font-mono">{tier.qty} {tier.unit_type}</p>
              <p className="text-sm font-bold text-primary">₹{tier.sale_rate}</p>
            </div>
          ))}
          <div className="bg-secondary/30 border border-border/50 rounded-lg px-3 py-2 text-center min-w-[90px]">
            <p className="text-xs text-muted-foreground">Stock</p>
            <p className="text-sm font-bold text-[#00E676]">{activeItem.stock_qty}</p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          className="pl-9 text-base"
          placeholder="Barcode / Item Code / Search Item Name..."
          value={searchQuery}
          onChange={e => { setSearchQuery(e.target.value); setShowSearch(true); }}
          onFocus={() => setShowSearch(true)}
          onBlur={() => setTimeout(() => setShowSearch(false), 150)}
        />
        {showSearch && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-xl z-40 max-h-64 overflow-y-auto">
            {searchResults.map(item => (
              <button
                key={item.id}
                onMouseDown={() => selectItem(item)}
                className="w-full text-left px-4 py-3 hover:bg-secondary/50 transition-colors flex justify-between items-center border-b border-border/40 last:border-0"
              >
                <div>
                  <p className="font-semibold text-sm uppercase">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.code || ""} · {item.category || ""} · Stock: {item.stock_qty}</p>
                </div>
                <span className="text-primary font-bold">₹{item.sale_price}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Billing Matrix */}
      <div className="bg-card rounded-xl border border-border overflow-hidden mb-4 flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground bg-secondary/30">
                <th className="text-left p-3">#</th>
                <th className="text-left p-3">ITEM NAME</th>
                <th className="text-center p-3">WEIGHT</th>
                <th className="text-center p-3">PKT/QTY</th>
                <th className="text-right p-3">RATE</th>
                <th className="text-right p-3">M.R.P.</th>
                <th className="text-right p-3">DISC</th>
                <th className="text-right p-3">GST %</th>
                <th className="text-right p-3">AMOUNT</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-16 text-muted-foreground">
                    <Search className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p>Search items above to add them to the bill</p>
                  </td>
                </tr>
              ) : rows.map((r, i) => (
                <tr
                  key={r.item_id}
                  className={`border-b border-border/40 transition-colors cursor-pointer ${activeItem?.id === r.item_id ? "bg-primary/5 border-l-2 border-l-primary" : "hover:bg-secondary/20"}`}
                  onClick={() => setActiveItem(items.find(it => it.id === r.item_id) || null)}
                >
                  <td className="p-2.5 text-muted-foreground text-xs">{i + 1}</td>
                  <td className="p-2.5 font-semibold uppercase text-sm">{r.name}</td>
                  <td className="p-1.5 text-center">
                    <Input
                      type="number" step="0.001"
                      value={r.weight} onChange={e => updateRow(r.item_id, "weight", e.target.value)}
                      placeholder="—" className="h-8 w-20 text-center text-xs font-mono mx-auto px-1"
                      onClick={e => e.stopPropagation()}
                    />
                  </td>
                  <td className="p-1.5 text-center">
                    <Input
                      type="number"
                      value={r.pkt_qty} onChange={e => updateRow(r.item_id, "pkt_qty", e.target.value)}
                      className="h-8 w-16 text-center text-xs font-mono mx-auto px-1"
                      onClick={e => e.stopPropagation()}
                    />
                  </td>
                  <td className="p-1.5 text-right">
                    <Input
                      type="number"
                      value={r.rate} onChange={e => updateRow(r.item_id, "rate", e.target.value)}
                      className="h-8 w-20 text-right text-xs font-mono ml-auto px-1"
                      onClick={e => e.stopPropagation()}
                    />
                  </td>
                  <td className="p-2.5 text-right text-xs font-mono text-muted-foreground">₹{r.mrp}</td>
                  <td className="p-1.5 text-right">
                    <Input
                      type="number"
                      value={r.discount_row} onChange={e => updateRow(r.item_id, "discount_row", e.target.value)}
                      className="h-8 w-16 text-right text-xs font-mono ml-auto px-1"
                      onClick={e => e.stopPropagation()}
                    />
                  </td>
                  <td className="p-2.5 text-right text-xs text-muted-foreground">{r.gst}%</td>
                  <td className="p-2.5 text-right font-bold text-primary">₹{(Number(r.amount) || 0).toFixed(2)}</td>
                  <td className="p-2 text-center">
                    <button onClick={e => { e.stopPropagation(); removeRow(r.item_id); }} className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Settlement Bar */}
      <div className="bg-card border border-border rounded-xl p-4 flex flex-wrap items-center gap-4">
        {/* Left — Summary */}
        <div className="flex gap-5 text-sm">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Total Items</p>
            <p className="font-bold text-lg">{totalItems}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Total Qty</p>
            <p className="font-bold text-lg">{totalQty}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Total Discount</p>
            <p className="font-bold text-lg text-[#FF9100]">₹{totalDiscount.toFixed(2)}</p>
          </div>
        </div>

        {/* Center — Payment + Actions */}
        <div className="flex flex-wrap items-center gap-3 flex-1 justify-center">
          <div className="flex gap-2">
            {["Cash", "UPI"].map(m => (
              <button key={m} onClick={() => { setPaymentMode(m); setIsCredit(false); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${!isCredit && paymentMode === m ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                {m}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-2">
            <span className="text-xs">Credit</span>
            <Switch checked={isCredit} onCheckedChange={setIsCredit} />
          </div>
          {isCredit && (
            <div className="flex gap-2">
              <Input placeholder="Customer Name" value={customerName} onChange={e => setCustomerName(e.target.value)} className="h-9 w-32 text-sm" />
              <Input placeholder="Phone" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="h-9 w-28 text-sm" />
            </div>
          )}
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Discount ₹</Label>
            <Input type="number" value={discount} onChange={e => setDiscount(e.target.value)} className="h-9 w-20 text-right text-sm" />
          </div>
          <Button
            variant="outline"
            onClick={() => { setRows([]); setActiveItem(null); setDiscount(0); setCustomerName(""); setCustomerPhone(""); }}
            className="border-[#FF9100]/50 text-[#FF9100] hover:bg-[#FF9100]/10 h-11 px-6"
          >
            <X className="w-4 h-4 mr-1" /> Cancel
          </Button>
          <Button
            onClick={() => billMutation.mutate()}
            disabled={rows.length === 0 || billMutation.isPending}
            className="h-11 px-8 bg-[#00E676] hover:bg-[#00E676]/90 text-black font-bold"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            {billMutation.isPending ? "Processing..." : "Settle"}
          </Button>
        </div>

        {/* Right — Grand Total */}
        <div className="bg-secondary/50 rounded-xl px-6 py-3 text-center min-w-[140px] border border-border">
          <p className="text-xs text-muted-foreground font-medium">GRAND TOTAL</p>
          <p className="text-3xl font-extrabold text-[#00E676]">₹{grandTotal.toFixed(2)}</p>
        </div>
      </div>

      {/* Print Invoice Dialog */}
      {printBill && <PrintInvoice bill={printBill} onClose={() => setPrintBill(null)} />}
    </div>
  );
}