import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, AlertTriangle, PackageX, Package, TrendingUp, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function StockEntry() {
  const qc = useQueryClient();
  const [searchItem, setSearchItem] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [showItemDropdown, setShowItemDropdown] = useState(false);
  const [qtyToAdd, setQtyToAdd] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [stockDate, setStockDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");

  const { data: items = [] } = useQuery({ queryKey: ["items"], queryFn: () => base44.entities.InventoryItem.list() });
  const { data: vendors = [] } = useQuery({ queryKey: ["vendors"], queryFn: () => base44.entities.Vendor.list() });
  const { data: entries = [] } = useQuery({ queryKey: ["stockEntries"], queryFn: () => base44.entities.StockEntry.list("-created_date") });

  const filteredItems = searchItem.length > 0
    ? items.filter(i => i.name?.toLowerCase().includes(searchItem.toLowerCase()) || i.code?.toLowerCase().includes(searchItem.toLowerCase()))
    : [];

  const lowStockItems = items.filter(i => i.stock_qty > 0 && i.stock_qty <= (i.min_stock || 5));
  const outOfStockItems = items.filter(i => i.stock_qty <= 0);
  const inStockItems = items.filter(i => i.stock_qty > (i.min_stock || 5));

  const today = new Date().toISOString().split("T")[0];
  const todayEntries = entries.filter(e => e.created_date?.startsWith(today));

  const addStockMutation = useMutation({
    mutationFn: async () => {
      if (!selectedItem) throw new Error("Select an item");
      const qty = Number(qtyToAdd);
      if (!qty || qty <= 0) throw new Error("Enter valid quantity");
      const newTotal = (selectedItem.stock_qty || 0) + qty;
      const vendor = vendors.find(v => v.id === vendorId);

      await base44.entities.InventoryItem.update(selectedItem.id, { stock_qty: newTotal });
      await base44.entities.StockEntry.create({
        item_id: selectedItem.id,
        item_name: selectedItem.name,
        qty_added: qty,
        purchase_price: Number(purchasePrice) || 0,
        vendor_id: vendorId || "",
        vendor_name: vendor?.name || "",
        stock_date: stockDate,
        notes,
        new_stock_total: newTotal
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: ["stockEntries"] });
      setSelectedItem(null); setSearchItem(""); setQtyToAdd(""); setPurchasePrice(""); setVendorId(""); setNotes("");
      toast.success("Stock added successfully!");
    },
  });

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Stock Entry</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-5">
        {/* LEFT — Entry Form */}
        <div className="space-y-5">
          <div className="bg-card rounded-xl border border-border p-5 space-y-4">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary" /> Add Stock
            </h2>

            {/* Item Search */}
            <div className="relative">
              <Label className="text-[11px] text-muted-foreground">SEARCH & SELECT ITEM</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Type item name or code..."
                  value={selectedItem ? selectedItem.name : searchItem}
                  onChange={e => { setSearchItem(e.target.value); setSelectedItem(null); setShowItemDropdown(true); }}
                  onFocus={() => setShowItemDropdown(true)}
                  onBlur={() => setTimeout(() => setShowItemDropdown(false), 150)}
                />
              </div>
              {showItemDropdown && filteredItems.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-xl z-30 max-h-48 overflow-y-auto">
                  {filteredItems.map(item => (
                    <button
                      key={item.id}
                      onMouseDown={() => { setSelectedItem(item); setSearchItem(item.name); setShowItemDropdown(false); }}
                      className="w-full text-left px-4 py-2.5 hover:bg-secondary/50 transition-colors flex justify-between items-center border-b border-border/40 last:border-0 text-sm"
                    >
                      <div>
                        <span className="font-semibold uppercase">{item.name}</span>
                        <span className="ml-2 text-xs text-muted-foreground">{item.code}</span>
                      </div>
                      <Badge className={item.stock_qty <= 0 ? "bg-destructive/20 text-destructive border-0 text-xs" : "bg-[#00E676]/20 text-[#00E676] border-0 text-xs"}>
                        {item.stock_qty <= 0 ? "OUT" : item.stock_qty}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}
              {selectedItem && (
                <div className="mt-2 p-2.5 bg-primary/10 rounded-lg border border-primary/20 text-xs">
                  <span className="font-semibold text-primary">{selectedItem.name}</span>
                  <span className="text-muted-foreground ml-2">Current: {selectedItem.stock_qty} units</span>
                </div>
              )}
            </div>

            <div>
              <Label className="text-[11px] text-muted-foreground">QUANTITY TO ADD</Label>
              <Input type="number" value={qtyToAdd} onChange={e => setQtyToAdd(e.target.value)} placeholder="e.g. 10" className="mt-1" />
            </div>

            <div>
              <Label className="text-[11px] text-muted-foreground">PURCHASE PRICE (₹)</Label>
              <Input type="number" value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} placeholder="0.00" className="mt-1" />
            </div>

            <div>
              <Label className="text-[11px] text-muted-foreground">SUPPLIER / VENDOR</Label>
              <Select value={vendorId} onValueChange={setVendorId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select vendor..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— No Vendor —</SelectItem>
                  {vendors.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-[11px] text-muted-foreground">STOCK DATE</Label>
              <Input type="date" value={stockDate} onChange={e => setStockDate(e.target.value)} className="mt-1" />
            </div>

            <div>
              <Label className="text-[11px] text-muted-foreground">NOTES</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes..." rows={2} className="mt-1 resize-none" />
            </div>

            <Button
              onClick={() => addStockMutation.mutate()}
              disabled={!selectedItem || !qtyToAdd || addStockMutation.isPending}
              className="w-full bg-[#00E676] hover:bg-[#00E676]/90 text-black font-bold h-11"
            >
              <Plus className="w-4 h-4 mr-2" />
              {addStockMutation.isPending ? "Adding Stock..." : "+ ADD STOCK"}
            </Button>
          </div>
        </div>

        {/* RIGHT — Alerts + Overview */}
        <div className="space-y-5">
          {/* Overview Board */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: "Total Items", value: items.length, icon: Package, color: "text-primary", bg: "bg-primary/10" },
              { label: "In Stock", value: inStockItems.length, icon: TrendingUp, color: "text-[#00E676]", bg: "bg-[#00E676]/10" },
              { label: "Low Stock", value: lowStockItems.length, icon: AlertTriangle, color: "text-[#FF9100]", bg: "bg-[#FF9100]/10" },
              { label: "Out of Stock", value: outOfStockItems.length, icon: PackageX, color: "text-destructive", bg: "bg-destructive/10" },
              { label: "Entries Today", value: todayEntries.length, icon: ClipboardList, color: "text-[#A855F7]", bg: "bg-[#A855F7]/10" },
            ].map(card => (
              <div key={card.label} className="bg-card rounded-xl border border-border p-4 text-center">
                <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center mx-auto mb-2`}>
                  <card.icon className={`w-4.5 h-4.5 ${card.color}`} />
                </div>
                <p className={`text-2xl font-extrabold ${card.color}`}>{card.value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{card.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Low Stock Alert */}
            <div className="bg-card rounded-xl border border-[#FF9100]/30 overflow-hidden">
              <div className="bg-[#FF9100]/10 px-4 py-3 border-b border-[#FF9100]/20 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#FF9100]" />
                <h3 className="text-sm font-semibold text-[#FF9100]">Low Stock Items</h3>
                <span className="ml-auto text-xs bg-[#FF9100]/20 text-[#FF9100] px-2 py-0.5 rounded-full">{lowStockItems.length}</span>
              </div>
              <div className="max-h-56 overflow-y-auto">
                {lowStockItems.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">All items are well stocked</div>
                ) : lowStockItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between px-4 py-2.5 border-b border-border/30 last:border-0 hover:bg-secondary/20">
                    <div>
                      <p className="text-sm font-medium uppercase">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.category}</p>
                    </div>
                    <span className="text-xs font-bold bg-[#FF9100]/20 text-[#FF9100] px-2.5 py-1 rounded-full">LOW: {item.stock_qty}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Out of Stock Alert */}
            <div className="bg-card rounded-xl border border-destructive/30 overflow-hidden">
              <div className="bg-destructive/10 px-4 py-3 border-b border-destructive/20 flex items-center gap-2">
                <PackageX className="w-4 h-4 text-destructive" />
                <h3 className="text-sm font-semibold text-destructive">Out of Stock</h3>
                <span className="ml-auto text-xs bg-destructive/20 text-destructive px-2 py-0.5 rounded-full">{outOfStockItems.length}</span>
              </div>
              <div className="max-h-56 overflow-y-auto">
                {outOfStockItems.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">No out-of-stock items</div>
                ) : outOfStockItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between px-4 py-2.5 border-b border-border/30 last:border-0 hover:bg-secondary/20">
                    <div>
                      <p className="text-sm font-medium uppercase">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.category}</p>
                    </div>
                    <span className="text-xs font-bold bg-destructive/20 text-destructive px-2.5 py-1 rounded-full">OUT</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom — Stock Entry History Log */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Stock Entry Log</h3>
          <span className="text-xs text-muted-foreground ml-auto">{entries.length} total entries</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground bg-secondary/20">
                <th className="text-left p-3">DATE</th>
                <th className="text-left p-3">ITEM</th>
                <th className="text-left p-3">VENDOR</th>
                <th className="text-center p-3">QTY ADDED</th>
                <th className="text-right p-3">PURCHASE ₹</th>
                <th className="text-center p-3">NEW STOCK</th>
                <th className="text-left p-3">NOTES</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr><td colSpan={7} className="text-center p-8 text-muted-foreground">No stock entries yet</td></tr>
              ) : entries.map(entry => (
                <tr key={entry.id} className="border-b border-border/40 hover:bg-secondary/20 transition-colors">
                  <td className="p-3 text-muted-foreground font-mono text-xs">
                    {entry.stock_date || (entry.created_date ? format(new Date(entry.created_date), "dd-MM-yyyy") : "—")}
                  </td>
                  <td className="p-3 font-semibold uppercase">{entry.item_name}</td>
                  <td className="p-3 text-muted-foreground">{entry.vendor_name || "—"}</td>
                  <td className="p-3 text-center">
                    <span className="bg-[#00E676]/15 text-[#00E676] font-bold px-2.5 py-0.5 rounded-full text-xs">+{entry.qty_added}</span>
                  </td>
                  <td className="p-3 text-right font-mono">₹{(entry.purchase_price || 0).toFixed(2)}</td>
                  <td className="p-3 text-center font-bold text-primary">{entry.new_stock_total}</td>
                  <td className="p-3 text-muted-foreground text-xs">{entry.notes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}