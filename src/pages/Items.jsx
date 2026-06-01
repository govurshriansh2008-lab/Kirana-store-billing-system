import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Pencil, Trash2, Package, RefreshCw, Save, X } from "lucide-react";
import { toast } from "sonner";

const DEPARTMENTS = ["KIRANA", "SPICES", "FMCG", "GENERAL", "DAIRY", "BEVERAGES", "SNACKS", "PERSONAL CARE", "HOUSEHOLD", "PULSES", "RICE & FLOUR", "OIL & GHEE"];
const UNIT_TYPES = ["PKT", "KG", "PCE", "LTR", "G"];
const SALE_TYPES = ["General Sale", "Offer Sale"];

const emptyTier = { qty: "", mrp: "", sale_rate: "", unit_type: "PKT" };
const emptyForm = {
  name: "", code: "", barcode: "", category: "KIRANA", sale_type: "General Sale",
  mrp: "", sale_price: "", purchase_price: "", gst_percentage: "", stock_qty: "", min_stock: "",
  price_tiers: [{ ...emptyTier }, { ...emptyTier }, { ...emptyTier }, { ...emptyTier }]
};

export default function Items() {
  const qc = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");

  const { data: items = [], isLoading } = useQuery({ queryKey: ["items"], queryFn: () => base44.entities.InventoryItem.list() });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      const payload = {
        ...data,
        name: data.name.toUpperCase(),
        mrp: Number(data.mrp) || 0,
        sale_price: Number(data.sale_price) || 0,
        purchase_price: Number(data.purchase_price) || 0,
        gst_percentage: Number(data.gst_percentage) || 0,
        stock_qty: Number(data.stock_qty) || 0,
        min_stock: Number(data.min_stock) || 0,
        price_tiers: data.price_tiers.map(t => ({
          qty: Number(t.qty) || 0,
          mrp: Number(t.mrp) || 0,
          sale_rate: Number(t.sale_rate) || 0,
          unit_type: t.unit_type
        })).filter(t => t.qty > 0)
      };
      return editId ? base44.entities.InventoryItem.update(editId, payload) : base44.entities.InventoryItem.create(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["items"] });
      setForm(emptyForm); setEditId(null);
      toast.success(editId ? "Item updated" : "Item saved");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.InventoryItem.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["items"] }); toast.success("Item deleted"); },
  });

  const handleEdit = (item) => {
    setEditId(item.id);
    const tiers = item.price_tiers || [];
    const paddedTiers = [...tiers, ...Array(4).fill(null).map(() => ({ ...emptyTier }))].slice(0, 4);
    setForm({
      name: item.name || "", code: item.code || "", barcode: item.barcode || "",
      category: item.category || "KIRANA", sale_type: item.sale_type || "General Sale",
      mrp: item.mrp || "", sale_price: item.sale_price || "", purchase_price: item.purchase_price || "",
      gst_percentage: item.gst_percentage || "", stock_qty: item.stock_qty || "", min_stock: item.min_stock || "",
      price_tiers: paddedTiers.map(t => ({ qty: t.qty || "", mrp: t.mrp || "", sale_rate: t.sale_rate || "", unit_type: t.unit_type || "PKT" }))
    });
  };

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const setTier = (idx, key, val) => setForm(f => {
    const tiers = [...f.price_tiers];
    tiers[idx] = { ...tiers[idx], [key]: val };
    return { ...f, price_tiers: tiers };
  });

  const filtered = items.filter(i =>
    i.name?.toLowerCase().includes(search.toLowerCase()) ||
    i.code?.toLowerCase().includes(search.toLowerCase()) ||
    i.barcode?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Items & Stock</h1>

      <div className="grid grid-cols-1 xl:grid-cols-[480px_1fr] gap-5">
        {/* LEFT PANEL - Form */}
        <div className="bg-card rounded-xl border border-border p-5 space-y-4 h-fit">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
            {editId ? "✏ Edit Item" : "＋ Add New Item"}
          </h2>

          {/* Core Details */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[11px] text-muted-foreground">ITEM CODE</Label>
              <Input value={form.code} onChange={e => setField("code", e.target.value)} placeholder="e.g. 12" className="font-mono" />
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground">BARCODE</Label>
              <Input value={form.barcode} onChange={e => setField("barcode", e.target.value)} placeholder="Scan barcode" className="font-mono" />
            </div>
          </div>

          <div>
            <Label className="text-[11px] text-muted-foreground">ITEM NAME *</Label>
            <Input
              value={form.name}
              onChange={e => setField("name", e.target.value.toUpperCase())}
              placeholder="e.g. JEERA"
              className="font-bold text-base uppercase tracking-wider"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[11px] text-muted-foreground">DEPARTMENT</Label>
              <Select value={form.category} onValueChange={v => setField("category", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{DEPARTMENTS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground">SALE TYPE</Label>
              <Select value={form.sale_type} onValueChange={v => setField("sale_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{SALE_TYPES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-[11px] text-muted-foreground">BASE MRP (₹)</Label>
              <Input type="number" value={form.mrp} onChange={e => setField("mrp", e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground">PURCHASE (₹)</Label>
              <Input type="number" value={form.purchase_price} onChange={e => setField("purchase_price", e.target.value)} />
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground">GST %</Label>
              <Input type="number" value={form.gst_percentage} onChange={e => setField("gst_percentage", e.target.value)} placeholder="5" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-[11px] text-muted-foreground">SALE PRICE (₹) *</Label>
              <Input type="number" value={form.sale_price} onChange={e => setField("sale_price", e.target.value)} />
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground">STOCK QTY *</Label>
              <Input type="number" value={form.stock_qty} onChange={e => setField("stock_qty", e.target.value)} />
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground">MIN STOCK</Label>
              <Input type="number" value={form.min_stock} onChange={e => setField("min_stock", e.target.value)} />
            </div>
          </div>

          {/* Multi-Tier Pricing Matrix */}
          <div>
            <Label className="text-[11px] text-muted-foreground mb-2 block">PRICING / UNIT MATRIX</Label>
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-secondary/60 border-b border-border">
                    <th className="text-center p-2 text-muted-foreground font-medium">#</th>
                    <th className="text-center p-2 text-muted-foreground font-medium">QTY</th>
                    <th className="text-center p-2 text-muted-foreground font-medium">MRP</th>
                    <th className="text-center p-2 text-muted-foreground font-medium">SALE RATE</th>
                    <th className="text-center p-2 text-muted-foreground font-medium">UNIT</th>
                  </tr>
                </thead>
                <tbody>
                  {form.price_tiers.map((tier, i) => (
                    <tr key={i} className="border-b border-border/40 last:border-0">
                      <td className="p-1.5 text-center text-muted-foreground font-mono">{i + 1}</td>
                      <td className="p-1">
                        <Input
                          type="number" step="0.001"
                          value={tier.qty} onChange={e => setTier(i, "qty", e.target.value)}
                          placeholder="0.050" className="h-7 text-xs text-center font-mono px-1"
                        />
                      </td>
                      <td className="p-1">
                        <Input
                          type="number"
                          value={tier.mrp} onChange={e => setTier(i, "mrp", e.target.value)}
                          placeholder="0.00" className="h-7 text-xs text-center px-1"
                        />
                      </td>
                      <td className="p-1">
                        <Input
                          type="number"
                          value={tier.sale_rate} onChange={e => setTier(i, "sale_rate", e.target.value)}
                          placeholder="0.00" className="h-7 text-xs text-center px-1"
                        />
                      </td>
                      <td className="p-1">
                        <Select value={tier.unit_type} onValueChange={v => setTier(i, "unit_type", v)}>
                          <SelectTrigger className="h-7 text-xs px-1"><SelectValue /></SelectTrigger>
                          <SelectContent>{UNIT_TYPES.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                        </Select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-1">
            <Button
              variant="outline" size="sm"
              onClick={() => { setForm(emptyForm); setEditId(null); }}
              className="flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Now
            </Button>
            <Button
              onClick={() => saveMutation.mutate(form)}
              disabled={!form.name || !form.sale_price || saveMutation.isPending}
              className="flex-1 bg-[#00E676] hover:bg-[#00E676]/90 text-black font-bold flex items-center gap-1.5"
              size="sm"
            >
              <Save className="w-3.5 h-3.5" /> {saveMutation.isPending ? "Saving..." : "Save"}
            </Button>
            {editId && (
              <Button
                onClick={() => deleteMutation.mutate(editId)}
                disabled={deleteMutation.isPending}
                size="sm"
                className="bg-destructive hover:bg-destructive/90 text-white flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </Button>
            )}
            <Button
              variant="outline" size="sm"
              onClick={() => { setForm(emptyForm); setEditId(null); }}
              className="flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" /> Close
            </Button>
          </div>
        </div>

        {/* RIGHT PANEL - Inventory Search Grid */}
        <div className="bg-card rounded-xl border border-border overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search items by name, code or barcode..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">{filtered.length} items</span>
          </div>
          <div className="overflow-auto flex-1">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card z-10">
                <tr className="border-b border-border text-xs text-muted-foreground bg-secondary/30">
                  <th className="text-left p-3 font-medium">ID</th>
                  <th className="text-left p-3 font-medium">DEPARTMENT</th>
                  <th className="text-left p-3 font-medium">ITEM NAME</th>
                  <th className="text-right p-3 font-medium">QTY</th>
                  <th className="text-right p-3 font-medium">MRP</th>
                  <th className="text-right p-3 font-medium">RATE</th>
                  <th className="text-center p-3 font-medium">UNIT</th>
                  <th className="text-center p-3 font-medium">EDIT</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={8} className="text-center p-10 text-muted-foreground">Loading inventory...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={8} className="text-center p-10 text-muted-foreground">
                    <Package className="w-10 h-10 mx-auto mb-2 opacity-20" />
                    <p>No items found</p>
                  </td></tr>
                ) : filtered.map((item, i) => (
                  <tr key={item.id} className="border-b border-border/40 hover:bg-secondary/20 transition-colors">
                    <td className="p-3 font-mono text-xs text-muted-foreground">{item.code || `${i + 1}`}</td>
                    <td className="p-3">
                      <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded uppercase">{item.category || "—"}</span>
                    </td>
                    <td className="p-3 font-semibold uppercase tracking-wide">{item.name}</td>
                    <td className="p-3 text-right">
                      <Badge className={
                        item.stock_qty <= 0
                          ? "bg-destructive/20 text-destructive border-0 text-xs"
                          : item.stock_qty <= (item.min_stock || 5)
                          ? "bg-[#FF9100]/20 text-[#FF9100] border-0 text-xs"
                          : "bg-[#00E676]/20 text-[#00E676] border-0 text-xs"
                      }>
                        {item.stock_qty <= 0 ? "OUT" : item.stock_qty <= (item.min_stock || 5) ? `LOW:${item.stock_qty}` : item.stock_qty}
                      </Badge>
                    </td>
                    <td className="p-3 text-right font-mono">₹{item.mrp || 0}</td>
                    <td className="p-3 text-right font-mono text-primary font-medium">₹{item.sale_price}</td>
                    <td className="p-3 text-center text-xs text-muted-foreground uppercase">
                      {item.price_tiers?.length > 0 ? item.price_tiers[0].unit_type : "—"}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-1.5 rounded-md hover:bg-primary/10 text-primary transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}