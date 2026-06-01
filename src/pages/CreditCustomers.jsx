import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, BookOpen, AlertCircle, Users } from "lucide-react";
import { toast } from "sonner";
import MetricCard from "@/components/shared/MetricCard";

export default function CreditCustomers() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const { data: customers = [] } = useQuery({ queryKey: ["credit"], queryFn: () => base44.entities.CreditCustomer.list() });

  const totalPending = customers.reduce((s, c) => s + (c.total_credit || 0), 0);
  const overdue = customers.filter(c => c.is_overdue).length;

  const createMutation = useMutation({
    mutationFn: () => base44.entities.CreditCustomer.create({ name, phone, total_credit: 0, is_overdue: false }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["credit"] }); setOpen(false); setName(""); setPhone(""); toast.success("Customer added"); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CreditCustomer.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["credit"] }); toast.success("Customer removed"); },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Credit (Katha) Ledger</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Add Customer</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Credit Customer</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label className="text-xs">Name *</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Customer name" /></div>
              <div><Label className="text-xs">Phone *</Label><Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone number" /></div>
              <Button onClick={() => createMutation.mutate()} disabled={!name || !phone || createMutation.isPending} className="w-full">
                {createMutation.isPending ? "Adding..." : "Add Customer"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard title="Total Pending" value={`₹${totalPending.toFixed(2)}`} icon={BookOpen} color="text-destructive" bgColor="bg-destructive/10" />
        <MetricCard title="Overdue Customers" value={overdue} icon={AlertCircle} color="text-[#FF9100]" bgColor="bg-[#FF9100]/10" />
        <MetricCard title="Total Customers" value={customers.length} icon={Users} color="text-primary" bgColor="bg-primary/10" />
      </div>

      {customers.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-16 text-center">
          <BookOpen className="w-14 h-14 mx-auto mb-4 text-muted-foreground/20" />
          <p className="text-lg font-medium text-muted-foreground">No Credit Customers</p>
          <p className="text-sm text-muted-foreground/70 mt-1 mb-6">Add customers who purchase on credit</p>
          <Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-2" />Add Customer</Button>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="text-left p-4">Customer</th>
                <th className="text-left p-4">Phone</th>
                <th className="text-right p-4">Pending (₹)</th>
                <th className="text-left p-4">Last Purchase</th>
                <th className="text-center p-4">Status</th>
                <th className="text-center p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(c => (
                <tr key={c.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="p-4 font-medium">{c.name}</td>
                  <td className="p-4 text-muted-foreground">{c.phone}</td>
                  <td className="p-4 text-right font-bold text-destructive">₹{(c.total_credit || 0).toFixed(2)}</td>
                  <td className="p-4 text-muted-foreground">{c.last_purchase_date || "—"}</td>
                  <td className="p-4 text-center">
                    {c.is_overdue ? (
                      <span className="text-xs bg-destructive/20 text-destructive px-2 py-1 rounded-full">Overdue</span>
                    ) : (
                      <span className="text-xs bg-[#00E676]/20 text-[#00E676] px-2 py-1 rounded-full">Active</span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <button onClick={() => deleteMutation.mutate(c.id)} className="text-xs text-destructive hover:bg-destructive/10 px-2 py-1 rounded-md transition-colors">Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}