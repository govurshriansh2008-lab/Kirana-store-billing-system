import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Printer, Download, Tag } from "lucide-react";

const TEMPLATES = ["Diwali Offer", "Festival Offer", "Flat Discount", "Buy 1 Get 1", "Clearance Sale", "New Arrival"];

const templateColors = {
  "Diwali Offer": { bg: "bg-gradient-to-br from-[#FF9100] to-[#EF4444]", accent: "text-yellow-200" },
  "Festival Offer": { bg: "bg-gradient-to-br from-[#A855F7] to-[#EC4899]", accent: "text-pink-200" },
  "Flat Discount": { bg: "bg-gradient-to-br from-[#00B4D8] to-[#0077B6]", accent: "text-cyan-200" },
  "Buy 1 Get 1": { bg: "bg-gradient-to-br from-[#00E676] to-[#00B4D8]", accent: "text-green-200" },
  "Clearance Sale": { bg: "bg-gradient-to-br from-[#EF4444] to-[#B91C1C]", accent: "text-red-200" },
  "New Arrival": { bg: "bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8]", accent: "text-blue-200" },
};

export default function Stickers() {
  const [productName, setProductName] = useState("");
  const [mrp, setMrp] = useState("");
  const [offerPrice, setOfferPrice] = useState("");
  const [template, setTemplate] = useState("Diwali Offer");

  const colors = templateColors[template] || templateColors["Diwali Offer"];
  const savings = Number(mrp || 0) - Number(offerPrice || 0);
  const savingsPercent = mrp > 0 ? Math.round((savings / Number(mrp)) * 100) : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Sticker / Label Generator</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6">
        {/* Config */}
        <div className="bg-card rounded-xl border border-border p-5 space-y-4 h-fit">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Tag className="w-4 h-4 text-primary" />Configuration
          </h2>
          <div><Label className="text-xs">Product Name</Label><Input value={productName} onChange={e => setProductName(e.target.value)} placeholder="e.g. Toor Dal 1kg" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">MRP (₹)</Label><Input type="number" value={mrp} onChange={e => setMrp(e.target.value)} placeholder="100" /></div>
            <div><Label className="text-xs">Offer Price (₹)</Label><Input type="number" value={offerPrice} onChange={e => setOfferPrice(e.target.value)} placeholder="80" /></div>
          </div>
          <div>
            <Label className="text-xs">Template</Label>
            <Select value={template} onValueChange={setTemplate}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{TEMPLATES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => window.print()} className="flex-1"><Printer className="w-4 h-4 mr-2" />Print</Button>
            <Button variant="outline"><Download className="w-4 h-4" /></Button>
          </div>
        </div>

        {/* Live Preview */}
        <div className="flex items-center justify-center min-h-[400px]">
          <div className={`${colors.bg} rounded-2xl p-8 w-full max-w-sm shadow-2xl text-white`}>
            <div className="text-center space-y-4">
              <div className={`text-xs font-bold uppercase tracking-[0.3em] ${colors.accent}`}>
                ★ {template} ★
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl py-3 px-4">
                <p className="text-lg font-bold">{productName || "Product Name"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm line-through opacity-60">MRP: ₹{mrp || "---"}</p>
                <p className="text-5xl font-extrabold">₹{offerPrice || "---"}</p>
              </div>
              {savings > 0 && (
                <div className="bg-white/20 backdrop-blur-sm rounded-full inline-block px-4 py-1.5">
                  <span className="text-sm font-bold">Save ₹{savings} ({savingsPercent}% OFF)</span>
                </div>
              )}
              <div className="pt-2">
                <p className="text-[10px] opacity-60">kirana shop billing system</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}