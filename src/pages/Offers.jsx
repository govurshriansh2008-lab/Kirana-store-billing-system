import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Tag, Trash2, Pencil, Package } from "lucide-react";
import { toast } from "sonner";

const emptyOffer = {
  title: "", description: "", discount_type: "percentage", discount_value: "",
  valid_from: "", valid_until: "", is_active: true,
  combo_items: [], min_qty: "", max_discount: ""
};

export default function Offers() {
  const qc = useQueryClient();
  const [form, setForm] = useState(emptyOffer);
  const [editId, setEditId] = useState(null);
  const [comboItemInput, setComboItemInput] = useState("");
  const [showForm, setShowForm] = useState(false);

  const { data: offers = [] } = useQuery({ queryKey: ["offers"], queryFn: () => base44.entities.Offer.list() });
  const { data: items = [] } = useQuery({ queryKey: ["items"], queryFn: () => base44.entities.InventoryItem.list() });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      const payload = { ...data, discount_value: Number(data.discount_value) || 0, min_qty: Number(data.min_qty) || 0, max_discount: Number(data.max_discount) || 0 };
      return editId ? base44.entities.Offer.update(editId, payload) : base44.entities.Offer.create(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["offers"] });
      setForm(emptyOffer); setEditId(null); setShowForm(false);
      toast.success(editId ? "Offer updated" : "Offer created");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Offer.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["offers"] }); toast.success("Offer deleted"); },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.Offer.update(id, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["offers"] }),
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const addComboItem = () => {
    if (!comboItemInput.trim()) return;
    setForm(f => ({ ...f, combo_items: [...(f.combo_items || []), comboItemInput.trim()] }));
    setComboItemInput("");
  };
  const removeComboItem = (idx) => setForm(f => ({ ...f, combo_items: f.combo_items.filter((_, i) => i !== idx) }));

  const handleEdit = (offer) => {
    setEditId(offer.id);
    setForm({
      title: offer.title || "", description: offer.description || "",
      discount_type: offer.discount_type || "percentage", discount_value: offer.discount_value || "",
      valid_from: offer.valid_from || "", valid_until: offer.valid_until || "",
      is_active: offer.is_active !== false, combo_items: offer.combo_items || [],
      min_qty: offer.min_qty || "", max_discount: offer.max_discount || ""
    });
    setShowForm(true);
  };

  const typeColors = { percentage: "bg-primary/20 text-primary", flat: "bg-[#00E676]/20 text-[#00E676]", bogo: "bg-[#A855F7]/20 text-[#A855F7]" };
  const typeLabels = { percentage: "% OFF", flat: "₹ OFF", bogo: "BOGO" };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Combo Offers Workspace</h1>
        <Button onClick={() => { setForm(emptyOffer); setEditId(null); setShowForm(!showForm); }}>
          <Plus className="w-4 h-4 mr-2" />{showForm ? "Hide Form" : "Create Offer"}
        </Button>
      </div>

      {showForm && (
        <div className="bg-card rounded-xl border border-border p-5">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">
            {editId ? "✏ Edit Offer" : "＋ New Offer / Combo"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Left Column */}
            <div className="space-y-3">
              <div>
                <Label className="text-[11px] text-muted-foreground">OFFER TITLE *</Label>
                <Input value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Diwali Festival Combo" className="mt-1" />
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground">DESCRIPTION</Label>
                <Textarea value={form.description} onChange={e => set("description", e.target.value)} placeholder="Describe the offer or product bundle..." rows={2} className="mt-1 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[11px] text-muted-foreground">DISCOUNT TYPE</Label>
                  <Select value={form.discount_type} onValueChange={v => set("discount_type", v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="flat">Flat Amount (₹)</SelectItem>
                      <SelectItem value="bogo">Buy 1 Get 1 (BOGO)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">DISCOUNT VALUE</Label>
                  <Input type="number" value={form.discount_value} onChange={e => set("discount_value", e.target.value)} placeholder={form.discount_type === "percentage" ? "e.g. 20" : "e.g. 50"} className="mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[11px] text-muted-foreground">MIN QUANTITY</Label>
                  <Input type="number" value={form.min_qty} onChange={e => set("min_qty", e.target.value)} placeholder="e.g. 2" className="mt-1" />
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">MAX DISCOUNT (₹)</Label>
                  <Input type="number" value={form.max_discount} onChange={e => set("max_discount", e.target.value)} placeholder="Optional cap" className="mt-1" />
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[11px] text-muted-foreground">VALID FROM</Label>
                  <Input type="date" value={form.valid_from} onChange={e => set("valid_from", e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">VALID UNTIL</Label>
                  <Input type="date" value={form.valid_until} onChange={e => set("valid_until", e.target.value)} className="mt-1" />
                </div>
              </div>

              {/* Combo Item Pairing */}
              <div>
                <Label className="text-[11px] text-muted-foreground">COMBO PRODUCT PAIRING</Label>
                <div className="flex gap-2 mt-1">
                  <Select value={comboItemInput} onValueChange={setComboItemInput}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select item to bundle..." />
                    </SelectTrigger>
                    <SelectContent>
                      {items.map(i => <SelectItem key={i.id} value={i.name}>{i.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" size="sm" onClick={addComboItem} disabled={!comboItemInput}>
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>
                {form.combo_items?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {form.combo_items.map((item, i) => (
                      <span key={i} className="flex items-center gap-1.5 bg-primary/10 text-primary text-xs px-2.5 py-1 rounded-full">
                        <Package className="w-3 h-3" />{item}
                        <button onClick={() => removeComboItem(i)} className="hover:text-destructive ml-0.5">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between bg-secondary/50 rounded-lg p-3">
                <Label className="text-sm">Offer Active</Label>
                <Switch checked={form.is_active} onCheckedChange={v => set("is_active", v)} />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => saveMutation.mutate(form)}
                  disabled={!form.title || saveMutation.isPending}
                  className="flex-1 bg-[#00E676] hover:bg-[#00E676]/90 text-black font-bold"
                >
                  {saveMutation.isPending ? "Saving..." : editId ? "Update Offer" : "Create Offer"}
                </Button>
                <Button variant="outline" onClick={() => { setForm(emptyOffer); setEditId(null); setShowForm(false); }}>Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Offers Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Tag className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Active Campaigns</h3>
          <span className="ml-auto text-xs text-muted-foreground">{offers.length} offers</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground bg-secondary/20">
                <th className="text-left p-4">OFFER TITLE</th>
                <th className="text-left p-4">DESCRIPTION</th>
                <th className="text-center p-4">TYPE</th>
                <th className="text-center p-4">VALUE</th>
                <th className="text-left p-4">COMBO ITEMS</th>
                <th className="text-left p-4">VALIDITY</th>
                <th className="text-center p-4">STATUS</th>
                <th className="text-center p-4">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {offers.length === 0 ? (
                <tr><td colSpan={8} className="text-center p-10 text-muted-foreground">
                  <Tag className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  <p>No offers yet. Create your first combo offer above.</p>
                </td></tr>
              ) : offers.map(o => (
                <tr key={o.id} className="border-b border-border/40 hover:bg-secondary/20 transition-colors">
                  <td className="p-4 font-semibold">{o.title}</td>
                  <td className="p-4 text-muted-foreground text-xs max-w-[180px] truncate">{o.description || "—"}</td>
                  <td className="p-4 text-center">
                    <Badge className={`${typeColors[o.discount_type] || "bg-secondary"} border-0 text-xs font-bold`}>
                      {typeLabels[o.discount_type] || o.discount_type}
                    </Badge>
                  </td>
                  <td className="p-4 text-center font-bold text-primary">
                    {o.discount_type === "percentage" ? `${o.discount_value}%` : o.discount_type === "flat" ? `₹${o.discount_value}` : "BOGO"}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {o.combo_items?.length > 0 ? o.combo_items.map((item, i) => (
                        <span key={i} className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">{item}</span>
                      )) : <span className="text-xs text-muted-foreground">—</span>}
                    </div>
                  </td>
                  <td className="p-4 text-xs text-muted-foreground">
                    {o.valid_from && o.valid_until ? `${o.valid_from} → ${o.valid_until}` : o.valid_from || o.valid_until || "—"}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Switch
                        checked={o.is_active}
                        onCheckedChange={(v) => toggleMutation.mutate({ id: o.id, is_active: v })}
                        className="scale-75"
                      />
                      <span className={`text-xs font-medium ${o.is_active ? "text-[#00E676]" : "text-muted-foreground"}`}>
                        {o.is_active ? "ON" : "OFF"}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => handleEdit(o)} className="p-1.5 rounded-md hover:bg-primary/10 text-primary transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deleteMutation.mutate(o.id)} className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}