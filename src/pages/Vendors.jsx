import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Phone, Plus, Users, QrCode, IndianRupee, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import MetricCard from "@/components/shared/MetricCard";

const emptyVendor = { name: "", business_type: "", phone: "", upi_id: "", total_paid: 0, paid_today: 0 };

export default function Vendors() {
  const qc = useQueryClient();
  const [form, setForm] = useState(emptyVendor);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [payAmounts, setPayAmounts] = useState({});
  const [payingId, setPayingId] = useState(null);

  const { data: vendors = [] } = useQuery({ queryKey: ["vendors"], queryFn: () => base44.entities.Vendor.list() });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      const payload = { ...data, total_paid: Number(data.total_paid) || 0, paid_today: Number(data.paid_today) || 0 };
      return editId ? base44.entities.Vendor.update(editId, payload) : base44.entities.Vendor.create(payload);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["vendors"] }); setOpen(false); setEditId(null); setForm(emptyVendor); toast.success("Vendor saved"); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Vendor.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["vendors"] }); toast.success("Vendor deleted"); },
  });

  const payMutation = useMutation({
    mutationFn: async ({ vendor, amount }) => {
      const amt = Number(amount);
      return base44.entities.Vendor.update(vendor.id, {
        total_paid: (vendor.total_paid || 0) + amt,
        paid_today: (vendor.paid_today || 0) + amt,
      });
    },
    onSuccess: (_, { vendor, amount }) => {
      qc.invalidateQueries({ queryKey: ["vendors"] });
      setPayAmounts(p => ({ ...p, [vendor.id]: "" }));
      setPayingId(null);
      toast.success(`₹${amount} recorded as paid to ${vendor.name}`);
    },
  });

  // Aggregate metrics
  const todayPaid = vendors.reduce((s, v) => s + (v.paid_today || 0), 0);

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  const weekPaid = vendors.reduce((s, v) => s + (v.paid_today || 0), 0); // approximation using paid_today

  const monthPaid = vendors.reduce((s, v) => s + (v.total_paid || 0), 0);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handlePayNow = (vendor) => {
    const amt = Number(payAmounts[vendor.id]);
    if (!amt || amt <= 0) { toast.error("Enter a valid payment amount"); return; }
    if (vendor.upi_id) {
      // Open UPI deep link
      const upiUrl = `upi://pay?pa=${encodeURIComponent(vendor.upi_id)}&pn=${encodeURIComponent(vendor.name)}&am=${amt}&cu=INR`;
      window.open(upiUrl, "_blank");
    }
    payMutation.mutate({ vendor, amount: amt });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Vendors</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditId(null); setForm(emptyVendor); }}><Plus className="w-4 h-4 mr-2" />Add Vendor</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editId ? "Edit Vendor" : "Add Vendor"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label className="text-xs">Name *</Label><Input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Vendor name" /></div>
              <div><Label className="text-xs">Business Type</Label><Input value={form.business_type} onChange={e => set("business_type", e.target.value)} placeholder="e.g. Wholesale" /></div>
              <div><Label className="text-xs">Phone *</Label><Input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="Phone number" /></div>
              <div><Label className="text-xs">UPI ID</Label><Input value={form.upi_id} onChange={e => set("upi_id", e.target.value)} placeholder="e.g. vendor@upi" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Total Paid (₹)</Label><Input type="number" value={form.total_paid} onChange={e => set("total_paid", e.target.value)} /></div>
                <div><Label className="text-xs">Paid Today (₹)</Label><Input type="number" value={form.paid_today} onChange={e => set("paid_today", e.target.value)} /></div>
              </div>
              <Button onClick={() => saveMutation.mutate(form)} disabled={!form.name || !form.phone || saveMutation.isPending} className="w-full">
                {saveMutation.isPending ? "Saving..." : "Save Vendor"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Top 3 Metric Panels */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard title="Today's Payments" value={`₹${todayPaid.toLocaleString()}`} icon={IndianRupee} color="text-primary" bgColor="bg-primary/10" />
        <MetricCard title="This Week" value={`₹${weekPaid.toLocaleString()}`} icon={IndianRupee} color="text-[#00E676]" bgColor="bg-[#00E676]/10" />
        <MetricCard title="This Month" value={`₹${monthPaid.toLocaleString()}`} icon={IndianRupee} color="text-[#FF9100]" bgColor="bg-[#FF9100]/10" />
      </div>

      {/* Vendor Cards */}
      {vendors.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-muted-foreground">No vendors yet. Add your first vendor.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vendors.map(v => {
            const totalDue = (v.total_paid || 0);
            const payAmt = Number(payAmounts[v.id] || 0);
            const remainingAfter = totalDue - payAmt;

            return (
              <div key={v.id} className="bg-card rounded-xl border border-border p-5 hover:border-primary/30 transition-all space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold capitalize">{v.name}</h3>
                    <p className="text-xs text-muted-foreground">{v.business_type || "Vendor"}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditId(v.id); setForm(v); setOpen(true); }} className="p-1.5 rounded-md hover:bg-primary/10 text-primary text-xs">Edit</button>
                    <button onClick={() => deleteMutation.mutate(v.id)} className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive text-xs">Delete</button>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-3.5 h-3.5" />{v.phone}
                </div>
                {v.upi_id && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <QrCode className="w-3.5 h-3.5" />{v.upi_id}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-secondary/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Total Paid</p>
                    <p className="font-bold text-[#00E676]">₹{(v.total_paid || 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Today</p>
                    <p className="font-bold text-primary">₹{(v.paid_today || 0).toLocaleString()}</p>
                  </div>
                </div>

                {/* Partial Payment Settlement */}
                <div className="border-t border-border/50 pt-3 space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">SETTLE PAYMENT</p>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Amount ₹"
                      value={payAmounts[v.id] || ""}
                      onChange={e => setPayAmounts(p => ({ ...p, [v.id]: e.target.value }))}
                      className="h-9 text-sm flex-1"
                    />
                    <Button
                      size="sm"
                      onClick={() => handlePayNow(v)}
                      disabled={payMutation.isPending && payingId === v.id}
                      className="bg-[#00E676] hover:bg-[#00E676]/90 text-black font-bold h-9 px-3 shrink-0"
                    >
                      {v.upi_id ? <><ExternalLink className="w-3.5 h-3.5 mr-1" />Pay</> : "Record"}
                    </Button>
                  </div>
                  {payAmt > 0 && (
                    <p className="text-xs text-[#FF9100]">
                      Remaining Due: ₹{Math.max(0, remainingAfter).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}