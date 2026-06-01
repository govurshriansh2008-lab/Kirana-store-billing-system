import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Store, Receipt, Palette, Save } from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const qc = useQueryClient();
  const { data: settingsList = [] } = useQuery({ queryKey: ["settings"], queryFn: () => base44.entities.StoreSettings.list() });
  const settings = settingsList[0] || {};

  const [form, setForm] = useState({
    store_name: "kirana shop billing system",
    gst_number: "", phone: "", email: "", upi_id: "", address: "", logo_url: "",
    bill_prefix: "SVK", bill_footer: "Thank you for your purchase!", default_gst: 5,
  });

  useEffect(() => {
    if (settings.id) {
        setForm({
        store_name: settings.store_name || "kirana shop billing system",
        gst_number: settings.gst_number || "", phone: settings.phone || "",
        email: settings.email || "", upi_id: settings.upi_id || "",
        address: settings.address || "", logo_url: settings.logo_url || "",
        bill_prefix: settings.bill_prefix || "SVK", bill_footer: settings.bill_footer || "",
        default_gst: settings.default_gst || 5,
      });
    }
  }, [settings.id]);

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = { ...form, default_gst: Number(form.default_gst) || 0 };
      return settings.id
        ? base44.entities.StoreSettings.update(settings.id, payload)
        : base44.entities.StoreSettings.create(payload);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["settings"] }); toast.success("Settings saved"); },
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Tabs defaultValue="store" className="space-y-6">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="store" className="flex items-center gap-2"><Store className="w-3.5 h-3.5" />Store Profile</TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2"><Receipt className="w-3.5 h-3.5" />Billing Settings</TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2"><Palette className="w-3.5 h-3.5" />Appearance</TabsTrigger>
        </TabsList>

        <TabsContent value="store">
          <div className="bg-card rounded-xl border border-border p-6 space-y-5 max-w-2xl">
            <h2 className="text-base font-semibold">Store Profile</h2>
            <div><Label className="text-xs">Store Logo URL</Label><Input value={form.logo_url} onChange={e => set("logo_url", e.target.value)} placeholder="https://..." /></div>
            <div><Label className="text-xs">Store Name *</Label><Input value={form.store_name} onChange={e => set("store_name", e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-xs">GST Number</Label><Input value={form.gst_number} onChange={e => set("gst_number", e.target.value)} placeholder="22AAAAA0000A1Z5" /></div>
              <div><Label className="text-xs">Phone</Label><Input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+91 XXXXX XXXXX" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-xs">Email</Label><Input value={form.email} onChange={e => set("email", e.target.value)} placeholder="store@email.com" /></div>
              <div><Label className="text-xs">UPI ID</Label><Input value={form.upi_id} onChange={e => set("upi_id", e.target.value)} placeholder="store@upi" /></div>
            </div>
            <div><Label className="text-xs">Address</Label><Textarea value={form.address} onChange={e => set("address", e.target.value)} placeholder="Full store address" rows={3} /></div>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              <Save className="w-4 h-4 mr-2" />{saveMutation.isPending ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="billing">
          <div className="bg-card rounded-xl border border-border p-6 space-y-5 max-w-2xl">
            <h2 className="text-base font-semibold">Billing Settings</h2>
            <div><Label className="text-xs">Bill Number Prefix</Label><Input value={form.bill_prefix} onChange={e => set("bill_prefix", e.target.value)} placeholder="SVK" /></div>
            <div><Label className="text-xs">Default GST (%)</Label><Input type="number" value={form.default_gst} onChange={e => set("default_gst", e.target.value)} /></div>
            <div><Label className="text-xs">Bill Footer Text</Label><Textarea value={form.bill_footer} onChange={e => set("bill_footer", e.target.value)} rows={2} /></div>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              <Save className="w-4 h-4 mr-2" />{saveMutation.isPending ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="appearance">
          <div className="bg-card rounded-xl border border-border p-6 space-y-5 max-w-2xl">
            <h2 className="text-base font-semibold">Appearance</h2>
            <p className="text-sm text-muted-foreground">Theme is controlled via the Light/Dark mode toggle in the sidebar.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}