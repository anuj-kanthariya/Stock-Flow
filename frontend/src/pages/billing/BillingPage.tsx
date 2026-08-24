import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Trash2, Receipt, Search, Loader2, X } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { useQuery, useMutation } from "@tanstack/react-query";
import { searchCustomersAndContacts, UnifiedCustomerSearchResponse, createCustomer } from "@/lib/api/customers";
import { getProducts } from "@/lib/api/products";
import { createInvoice, updateInvoice, getInvoice } from "@/lib/api/invoices";

// Custom hook for debouncing search input
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

interface BillingItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  qtyString: string; // The raw input value so we can freely edit it (e.g. empty string)
  unitPrice: number; 
  maxStock: number;
}

export default function BillingPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const [items, setItems] = useState<BillingItem[]>([]);
  
  // Customer Combobox State
  const [customerSearch, setCustomerSearch] = useState("");
  const debouncedCustomerSearch = useDebounce(customerSearch, 300);
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<UnifiedCustomerSearchResponse | null>(null);
  const customerDropdownRef = useRef<HTMLDivElement>(null);

  const [productSearch, setProductSearch] = useState("");
  const debouncedProductSearch = useDebounce(productSearch, 300);
  const [taxRate] = useState(18);
  const [globalDiscountStr, setGlobalDiscountStr] = useState("0");
  
  const [dueDate, setDueDate] = useState(""); // Optional
  const [notes, setNotes] = useState(""); // Optional
  const [invoiceNo, setInvoiceNo] = useState("");

  useEffect(() => {
    if (!invoiceId) {
      setInvoiceNo("Pending Generation");
    }
  }, [invoiceId]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target as Node)) {
        setIsCustomerDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch Customers & Contacts dynamically
  const { data: customerSearchResults = [], isLoading: customersLoading } = useQuery({
    queryKey: ["customers-search", debouncedCustomerSearch],
    queryFn: () => searchCustomersAndContacts(debouncedCustomerSearch),
  });

  // Load Draft Invoice if invoiceId exists
  const { data: draftInvoice } = useQuery({
    queryKey: ["invoice", invoiceId],
    queryFn: () => getInvoice(invoiceId!),
    enabled: !!invoiceId,
  });

  // Hydrate form with draft data
  useEffect(() => {
    if (draftInvoice) {
      setInvoiceNo(draftInvoice.invoiceNumber);
      
      setSelectedCustomer({ 
        id: draftInvoice.customerId, 
        type: "customer",
        name: draftInvoice.customerName, 
        phone: "", 
        email: "" 
      });

      setItems(draftInvoice.items.map(item => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        sku: "-", // Not returned in basic item response, but ok
        qtyString: String(item.quantity),
        unitPrice: item.unitPrice,
        maxStock: 999999, // Allow editing; backend will validate true stock
      })));

      // Reverse calculate discount percentage if discountAmount exists
      // discountAmount = subtotal * (percent / 100) -> percent = (discountAmount / subtotal) * 100
      if (draftInvoice.discountAmount > 0 && draftInvoice.subtotal > 0) {
        const pct = (draftInvoice.discountAmount / draftInvoice.subtotal) * 100;
        setGlobalDiscountStr(pct.toFixed(2));
      } else {
        setGlobalDiscountStr("0");
      }

      if (draftInvoice.dueDate) {
        setDueDate(draftInvoice.dueDate.split("T")[0]);
      }
      if (draftInvoice.notes) {
        setNotes(draftInvoice.notes);
      }
    }
  }, [draftInvoice]);

  // Fetch Products based on search
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ["products-search", debouncedProductSearch],
    queryFn: () => getProducts(1, 10, debouncedProductSearch, "all"),
    enabled: debouncedProductSearch.trim().length > 0,
  });

  const searchResults = productsData?.data || [];

  const parsedGlobalDiscount = Math.min(100, Math.max(0, parseFloat(globalDiscountStr) || 0));

  const subtotal = items.reduce((sum, i) => {
    const qty = parseInt(i.qtyString) || 0;
    return sum + (i.unitPrice * qty);
  }, 0);

  const discountAmount = subtotal * (parsedGlobalDiscount / 100);
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = (taxableAmount * taxRate) / 100;
  const total = taxableAmount + taxAmount;

  // Mutations for Create/Update Invoice
  const invoiceMutation = useMutation({
    mutationFn: async ({ status, customerId }: { status: "pending" | "draft", customerId: string }) => {
      const payload = {
        customer_id: customerId,
        tax_rate: taxRate,
        discount_amount: discountAmount,
        due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
        notes: notes || undefined,
        status,
        items: items.map(item => ({
          product_id: item.productId,
          quantity: parseInt(item.qtyString) || 1, // Fallback to 1 if submitted empty
          unit_price: item.unitPrice,
          discount: 0 // Per-item discount removed
        }))
      };

      if (invoiceId) {
        return updateInvoice(invoiceId, payload);
      } else {
        return createInvoice(payload);
      }
    },
    onSuccess: (data) => {
      toast.success(data.status === "draft" ? "Invoice saved as draft!" : `Invoice ${data.invoiceNumber || invoiceNo} saved successfully!`);
      navigate("/invoices"); 
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to save invoice.");
    }
  });

  const addItem = (product: any) => {
    if ((product.stockQuantity || 0) <= 0) {
      toast.error("This product is out of stock.");
      return;
    }

    const existing = items.find((i) => i.productId === product.id);
    if (existing) {
      const currentQty = parseInt(existing.qtyString) || 0;
      if (currentQty + 1 > product.stockQuantity) {
        toast.error(`Only ${product.stockQuantity} units available.`);
        return;
      }
      setItems((prev) =>
        prev.map((i) =>
          i.productId === product.id ? { ...i, qtyString: String(currentQty + 1) } : i
        )
      );
    } else {
      setItems((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          productId: product.id,
          productName: product.name,
          sku: product.sku || "-",
          qtyString: "1",
          unitPrice: parseFloat(product.sellingPrice),
          maxStock: product.stockQuantity || 0,
        },
      ]);
    }
    setProductSearch("");
  };

  const removeItem = (id: string) =>
    setItems((prev) => prev.filter((i) => i.id !== id));

  const updateItemQtyString = (id: string, value: string) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id === id) {
          // Allow empty string for clearing
          if (value === "") {
            return { ...i, qtyString: "" };
          }
          const parsed = parseInt(value);
          if (isNaN(parsed) || parsed < 0) return i; // Reject non-numbers and negatives

          if (parsed > i.maxStock) {
            toast.error(`Only ${i.maxStock} units available.`);
            return i; // Don't allow typing beyond max stock
          }
          return { ...i, qtyString: value }; // Store raw string (e.g. allows typing "0" before another digit if we wanted, but integer input handles this naturally)
        }
        return i;
      })
    );
  };

  const onQtyBlur = (id: string) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id === id) {
          const parsed = parseInt(i.qtyString);
          if (isNaN(parsed) || parsed <= 0) {
            return { ...i, qtyString: "1" };
          }
        }
        return i;
      })
    );
  };

  const handleCreate = async (status: "pending" | "draft") => {
    if (!selectedCustomer) {
      toast.error("Please select a customer first.");
      return;
    }
    if (items.length === 0) {
      toast.error("Please add at least one product.");
      return;
    }
    
    // Ensure all quantities are > 0 before submit
    const hasInvalidQty = items.some(i => {
       const q = parseInt(i.qtyString);
       return isNaN(q) || q <= 0;
    });
    if (hasInvalidQty) {
      toast.error("All product quantities must be at least 1.");
      return;
    }

    let finalCustomerId = selectedCustomer.id;

    if (selectedCustomer.type === "contact") {
      try {
        const shadowCustomer = await createCustomer({
          name: selectedCustomer.name,
          mobileNumber: selectedCustomer.email || "",
          phone: selectedCustomer.phone || "0000000000",
          showInMainList: false, // Prevents polluting main list
        });
        finalCustomerId = shadowCustomer.id;
      } catch (err) {
        toast.error("Failed to convert contact to customer for billing.");
        return;
      }
    }

    invoiceMutation.mutate({ status, customerId: finalCustomerId });
  };

  return (
    <div className="space-y-4 md:space-y-5 flex flex-col h-full w-full pb-24 md:pb-0">
      <div className="hidden md:block">
        <PageHeader
          title={invoiceId ? "Edit Draft Invoice" : "New Invoice"}
          description={`Invoice #${invoiceNo}`}
          breadcrumbs={[{ label: "Billing" }]}
          actions={
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => handleCreate("draft")} disabled={invoiceMutation.isPending} className="flex-1 sm:flex-none">
                {invoiceMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Draft
              </Button>
              <Button
                onClick={() => handleCreate("pending")}
                disabled={invoiceMutation.isPending}
                className="flex-1 sm:flex-none"
              >
                {invoiceMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Receipt className="h-4 w-4 mr-2" />
                )}
                {invoiceId ? "Finalize Invoice" : "Create Invoice"}
              </Button>
            </div>
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Products & Items */}
        <div className="lg:col-span-2 space-y-4">
          {/* Product Search */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add Products</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="billing-product-search"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search products by name or SKU…"
                  className="pl-9"
                />
              </div>

              {productSearch.trim().length > 0 && (
                <div className="rounded-xl border border-border bg-popover shadow-elevated overflow-hidden max-h-56 overflow-y-auto">
                  {productsLoading ? (
                    <div className="p-4 flex justify-center items-center text-muted-foreground text-sm">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" /> Searching products...
                    </div>
                  ) : searchResults.length === 0 ? (
                    <p className="p-4 text-sm text-muted-foreground text-center">
                      No products found.
                    </p>
                  ) : (
                    searchResults.slice(0, 6).map((product: any) => (
                      <button
                        key={product.id}
                        onClick={() => addItem(product)}
                        className="w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-accent transition-colors text-left"
                      >
                        <div>
                          <p className="font-medium text-foreground">
                            {product.name}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {product.sku || "N/A"}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0 ml-4">
                          <p className="font-semibold text-primary">
                            {formatCurrency(parseFloat(product.sellingPrice))}
                          </p>
                          <Badge
                            variant={
                              (product.stockQuantity || 0) > 0 ? "success" : "destructive"
                            }
                            className="text-[10px]"
                          >
                            Stock: {product.stockQuantity || 0} {product.unit}
                          </Badge>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Items Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Invoice Items{" "}
                {items.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {items.length}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {items.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <Receipt className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">
                    No items added yet. Search for products above.
                  </p>
                </div>
              ) : (
                <>
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          {["Product", "Qty", "Unit Price", "Total", ""].map(
                            (h) => (
                              <th
                                key={h}
                                className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase whitespace-nowrap"
                              >
                                {h}
                              </th>
                            )
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {items.map((item) => {
                          const qty = parseInt(item.qtyString) || 0;
                          const lineTotal = item.unitPrice * qty;
                          return (
                            <tr key={item.id} className="hover:bg-muted/20">
                              <td className="px-4 py-3 text-sm font-medium min-w-[200px] max-w-[250px]">
                                <p className="truncate" title={item.productName}>{item.productName}</p>
                                <p className="text-xs text-muted-foreground font-mono">{item.sku}</p>
                              </td>
                              <td className="px-4 py-3">
                                <Input
                                  type="text"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  value={item.qtyString}
                                  onFocus={(e) => e.target.select()}
                                  onChange={(e) => updateItemQtyString(item.id, e.target.value)}
                                  onBlur={() => onQtyBlur(item.id)}
                                  className="w-20 h-8 text-center"
                                />
                              </td>
                              <td className="px-4 py-3 text-sm whitespace-nowrap">
                                {formatCurrency(item.unitPrice)}
                              </td>
                              <td className="px-4 py-3 text-sm font-semibold whitespace-nowrap">
                                {formatCurrency(lineTotal)}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => removeItem(item.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Items List */}
                  <div className="flex flex-col md:hidden">
                    {items.map((item) => {
                      const qty = parseInt(item.qtyString) || 0;
                      const lineTotal = item.unitPrice * qty;
                      return (
                        <div key={item.id} className="p-4 border-b border-border/50 last:border-0 flex flex-col gap-3">
                          <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-foreground truncate">{item.productName}</p>
                              <p className="text-xs text-muted-foreground font-mono">{item.sku}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => removeItem(item.id)}
                              className="h-7 w-7 text-destructive hover:bg-destructive/10 shrink-0"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                          
                          <div className="flex items-center justify-between mt-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Qty:</span>
                              <Input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={item.qtyString}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => updateItemQtyString(item.id, e.target.value)}
                                onBlur={() => onQtyBlur(item.id)}
                                className="w-16 h-8 text-center text-sm px-2"
                              />
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-primary">{formatCurrency(lineTotal)}</p>
                              <p className="text-xs text-muted-foreground">{formatCurrency(item.unitPrice)} each</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Summary */}
        <div className="space-y-4">
          {/* Customer */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5 relative" ref={customerDropdownRef}>
                <Label htmlFor="billing-customer">Select Customer *</Label>
                
                {selectedCustomer ? (
                  <div className="flex items-center justify-between rounded-lg border border-input bg-muted/20 px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">
                        {selectedCustomer.name}
                        {selectedCustomer.type === "contact" && (
                          <Badge variant="outline" className="ml-2 text-[10px] bg-blue-50 text-blue-600 border-blue-200">Contact</Badge>
                        )}
                        {selectedCustomer.type === "customer" && (
                          <Badge variant="outline" className="ml-2 text-[10px] bg-green-50 text-green-600 border-green-200">Customer</Badge>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {selectedCustomer.phone || selectedCustomer.email || "No contact info"}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon-sm" onClick={() => setSelectedCustomer(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="billing-customer"
                        placeholder="Search customer by name, phone or email..."
                        value={customerSearch}
                        onChange={(e) => {
                          setCustomerSearch(e.target.value);
                          setIsCustomerDropdownOpen(true);
                        }}
                        onFocus={() => setIsCustomerDropdownOpen(true)}
                        className="pl-9"
                      />
                    </div>
                    
                    {isCustomerDropdownOpen && (
                      <div className="absolute top-full mt-1 left-0 right-0 z-50 rounded-xl border border-border bg-popover shadow-elevated overflow-hidden max-h-56 overflow-y-auto">
                        {customersLoading ? (
                          <div className="p-4 flex justify-center items-center text-muted-foreground text-sm">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" /> Searching...
                          </div>
                        ) : customerSearchResults.length === 0 ? (
                          <p className="p-4 text-sm text-muted-foreground text-center">
                            No matching customers or contacts.
                          </p>
                        ) : (
                          customerSearchResults.map((c) => (
                            <button
                              key={c.id}
                              onClick={() => {
                                setSelectedCustomer(c);
                                setIsCustomerDropdownOpen(false);
                                setCustomerSearch("");
                              }}
                              className="w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-accent transition-colors text-left border-b last:border-0 border-border/50"
                            >
                              <div>
                                <p className="font-medium text-foreground flex items-center">
                                  {c.name}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {c.phone ? c.phone : c.email ? c.email : "No phone/email"}
                                </p>
                              </div>
                              <div>
                                {c.type === "contact" ? (
                                  <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-600 border-blue-200">Contact</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-[10px] bg-green-50 text-green-600 border-green-200">Customer</Badge>
                                )}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="billing-due">Due Date (Optional)</Label>
                <Input 
                  id="billing-due" 
                  type="date" 
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)} 
                />
              </div>
            </CardContent>
          </Card>

          {/* Totals */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Discount (%)</span>
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={globalDiscountStr}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                     const val = e.target.value;
                     if (val === "" || /^\d*\.?\d*$/.test(val)) {
                       setGlobalDiscountStr(val);
                     }
                  }}
                  onBlur={() => {
                    const parsed = parseFloat(globalDiscountStr);
                    if (isNaN(parsed) || parsed < 0) setGlobalDiscountStr("0");
                    else if (parsed > 100) setGlobalDiscountStr("100");
                  }}
                  className="w-20 h-8 text-right"
                />
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between items-center text-sm text-green-600 dark:text-green-500">
                  <span>Discount Amount</span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Tax ({taxRate}%)</span>
                <span className="font-medium">{formatCurrency(taxAmount)}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center text-base font-bold">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(total)}</span>
              </div>
              <Button
                className="w-full mt-4"
                size="lg"
                onClick={() => handleCreate("pending")}
                disabled={invoiceMutation.isPending}
              >
                {invoiceMutation.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : (
                  <Receipt className="h-5 w-5 mr-2" />
                )}
                Create Invoice
              </Button>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notes (Optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                id="billing-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                placeholder="Payment terms, delivery notes…"
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mobile action buttons (fixed at bottom on mobile) */}
      <div className="md:hidden fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] left-0 right-0 p-4 bg-background border-t border-border z-40 flex gap-3 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <Button variant="outline" onClick={() => handleCreate("draft")} disabled={invoiceMutation.isPending} className="flex-1">
          {invoiceMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Save Draft
        </Button>
        <Button
          onClick={() => handleCreate("pending")}
          disabled={invoiceMutation.isPending}
          className="flex-1"
        >
          {invoiceMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Receipt className="h-4 w-4 mr-2" />
          )}
          {invoiceId ? "Finalize" : "Create"}
        </Button>
      </div>
    </div>
  );
}
