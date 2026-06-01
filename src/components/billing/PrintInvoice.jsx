import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";
import { format } from "date-fns";

export default function PrintInvoice({ bill, onClose }) {
  const handlePrint = () => window.print();

  const dateStr = bill.created_date
    ? format(new Date(bill.created_date), "dd MMM yyyy, hh:mm aa")
    : format(new Date(), "dd MMM yyyy, hh:mm aa");

  return (
    <Dialog open={!!bill} onOpenChange={onClose}>
      <DialogContent className="max-w-sm p-0 bg-white text-black border-0 overflow-hidden">
        <div id="print-invoice" className="bg-white text-black p-6 font-mono text-xs">
          {/* Store Header */}
          <div className="text-center mb-4 border-b border-black pb-4">
            <h1 className="font-extrabold text-base leading-tight uppercase">kirana shop billing system</h1>
            <p className="text-[10px] mt-1 text-gray-600">Main Road, Near Bus Stand</p>
            <p className="text-[10px] text-gray-600">GST: 37AAAAA0000A1Z5</p>
          </div>

          {/* Bill Meta */}
          <div className="mb-3 space-y-0.5">
            <div className="flex justify-between">
              <span className="text-gray-600">Bill No:</span>
              <span className="font-bold">{bill.bill_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Date:</span>
              <span>{dateStr}</span>
            </div>
            {bill.customer_name && (
              <div className="flex justify-between">
                <span className="text-gray-600">Customer:</span>
                <span>{bill.customer_name}</span>
              </div>
            )}
          </div>

          {/* Line Items */}
          <div className="border-t border-b border-dashed border-black py-3 mb-3">
            <div className="flex justify-between text-[10px] font-bold mb-2 text-gray-600 uppercase">
              <span className="flex-1">Item Name</span>
              <span className="w-8 text-center">Qty</span>
              <span className="w-16 text-right">Price</span>
              <span className="w-16 text-right">Amount</span>
            </div>
            {bill.items?.map((item, i) => (
              <div key={i} className="flex justify-between py-0.5">
                <span className="flex-1 truncate pr-1 uppercase">{item.name}</span>
                <span className="w-8 text-center">{item.qty}</span>
                <span className="w-16 text-right">₹{Number(item.price || 0).toFixed(2)}</span>
                <span className="w-16 text-right font-medium">₹{Number(item.total || 0).toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* Financial Summary */}
          <div className="space-y-0.5 mb-4">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>₹{Number(bill.subtotal || 0).toFixed(2)}</span>
            </div>
            {Number(bill.gst_total || 0) > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>GST</span>
                <span>₹{Number(bill.gst_total || 0).toFixed(2)}</span>
              </div>
            )}
            {Number(bill.discount || 0) > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Discount</span>
                <span>-₹{Number(bill.discount || 0).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-black pt-1.5 mt-1.5">
              <span className="font-extrabold text-sm">TOTAL</span>
              <span className="font-extrabold text-sm">₹{Number(bill.grand_total || 0).toFixed(2)}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center border-t border-dashed border-black pt-3 space-y-1">
            <p className="font-bold uppercase">Payment: {bill.payment_mode || "CASH"}</p>
            <p className="text-gray-600">Thank You! Visit Again.</p>
            <p className="text-[9px] text-gray-400">*This is a computer generated bill*</p>
          </div>
        </div>

        {/* Controls (hidden on print) */}
        <div className="no-print flex gap-3 p-4 bg-background border-t border-border">
          <Button onClick={handlePrint} className="flex-1 bg-[#00E676] hover:bg-[#00E676]/90 text-black font-bold">
            <Printer className="w-4 h-4 mr-2" /> Print Invoice
          </Button>
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}