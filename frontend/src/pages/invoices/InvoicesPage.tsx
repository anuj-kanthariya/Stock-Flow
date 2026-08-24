import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Download, Receipt, Loader2, AlertCircle, Trash2, ChevronDown, Pencil, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchBar } from "@/components/shared/SearchBar";
import { DataTable } from "@/components/shared/DataTable";
import { Pagination } from "@/components/shared/Pagination";
import { Button } from "@/components/ui/button";
import { InvoiceStatusBadge } from "@/components/shared/InvoiceStatusBadge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Invoice, InvoiceStatus } from "@/types";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { getInvoices, updateInvoiceStatus, deleteInvoice, downloadInvoicePdf } from "@/lib/api/invoices";
import { createPortal } from "react-dom";

const PAGE_SIZE = 8;
const STATUS_FILTERS: { label: string; value: InvoiceStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Paid", value: "paid" },
  { label: "Pending", value: "pending" },
  { label: "Overdue", value: "overdue" },
  { label: "Draft", value: "draft" },
];

export default function InvoicesPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<InvoiceStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [deletingInvoice, setDeletingInvoice] = useState<Invoice | null>(null);
  
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["invoices", page, PAGE_SIZE, search, status],
    queryFn: () => getInvoices(page, PAGE_SIZE, search, status),
    placeholderData: keepPreviousData,
  });

  const handleDownloadPdf = async (invoiceId: string, invoiceNumber: string) => {
    try {
      const toastId = toast.loading(`Generating PDF for ${invoiceNumber}...`);
      const blob = await downloadInvoicePdf(invoiceId);
      
      const url = window.URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `${invoiceNumber}.pdf`;
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success(`Downloaded ${invoiceNumber}.pdf`, { id: toastId });
    } catch (error: any) {
      console.error("Failed to download invoice PDF", error);
      toast.error(error.response?.data?.detail || "Failed to download invoice PDF.");
    }
  };

  const invoices: Invoice[] = data?.data || [];
  const totalPages = data?.totalPages || 0;
  const total = data?.total || 0;

  const statusMutation = useMutation({
    mutationFn: ({ id, newStatus }: { id: string; newStatus: InvoiceStatus }) =>
      updateInvoiceStatus(id, newStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Invoice status updated");
    },
    onError: () => {
      toast.error("Failed to update status");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Invoice deleted successfully");
      setDeletingInvoice(null);
    },
    onError: () => {
      toast.error("Failed to delete invoice");
      setDeletingInvoice(null);
    },
  });

  return (
    <div className="space-y-4 md:space-y-5 flex flex-col h-full w-full pb-24 md:pb-0">
      <div className="hidden md:block">
        <PageHeader
          title="Invoices"
          description="Manage and track all your invoices"
          breadcrumbs={[{ label: "Invoices" }]}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-3 w-full">
        <SearchBar
          id="invoices-search"
          value={search}
          onChange={(v: string) => { setSearch(v); setPage(1); }}
          placeholder="Search by invoice # or customer…"
          className="w-full md:w-80"
        />
        <div className="flex gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-hide">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => { setStatus(f.value); setPage(1); }}
              className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                status === f.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 rounded-xl border border-border bg-card shadow-soft">
          <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
          <p className="font-medium text-foreground">Loading invoices...</p>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-12 rounded-xl border border-destructive/20 bg-destructive/10 text-destructive">
          <AlertCircle className="h-10 w-10 mb-3" />
          <p className="font-medium">Failed to load invoices.</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : invoices.length === 0 ? (
        <div className="py-12 text-center rounded-xl border border-border bg-card shadow-soft">
          <Receipt className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-40" />
          <p className="font-medium text-foreground">No invoices found</p>
          <p className="text-sm text-muted-foreground mt-1">
            Create your first invoice to see it here.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop/Tablet Table View */}
          <div className="hidden md:block">
            <DataTable<Invoice>
              columns={[
                {
                  key: "invoiceNumber",
                  header: "Invoice #",
                  render: (row) => (
                    <span className="font-semibold text-primary text-sm font-mono">
                      {row.invoiceNumber}
                    </span>
                  ),
                },
                {
                  key: "customerName",
                  header: "Customer",
                  render: (row) => <span className="font-medium">{row.customerName}</span>,
                },
                {
                  key: "createdAt",
                  header: "Date",
                  render: (row) => (
                    <span className="text-muted-foreground">{formatDate(row.createdAt)}</span>
                  ),
                },
                {
                  key: "dueDate",
                  header: "Due Date",
                  render: (row) => (
                    <span className="text-muted-foreground">{formatDate(row.dueDate)}</span>
                  ),
                },
                {
                  key: "total",
                  header: "Amount",
                  render: (row) => (
                    <span className="font-bold text-foreground">{formatCurrency(row.total)}</span>
                  ),
                },
                {
                  key: "status",
                  header: "Status",
                  render: (row) => (
                    <div onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="flex items-center gap-1 focus:outline-none transition-opacity hover:opacity-80" disabled={statusMutation.isPending}>
                            <InvoiceStatusBadge status={row.status} />
                            <ChevronDown className="h-3 w-3 text-muted-foreground" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          {STATUS_FILTERS.filter(f => f.value !== "all").map(f => (
                            <DropdownMenuItem 
                              key={f.value}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (row.status !== f.value) {
                                  statusMutation.mutate({ id: row.id, newStatus: f.value as InvoiceStatus });
                                }
                              }}
                            >
                              {f.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ),
                },
                {
                  key: "actions",
                  header: "",
                  render: (row) => (
                    <div className="flex items-center gap-1 justify-end">
                      {row.status === "draft" && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={(e) => { e.stopPropagation(); navigate(`/billing/edit/${row.id}`); }}
                          aria-label="Edit draft"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => { e.stopPropagation(); setSelectedInvoice(row); }}
                        aria-label="View invoice"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => { e.stopPropagation(); handleDownloadPdf(row.id, row.invoiceNumber); }}
                        aria-label="Download invoice"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => { e.stopPropagation(); setDeletingInvoice(row); }}
                        aria-label="Delete invoice"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ),
                  headerClassName: "text-right",
                },
              ]}
              data={invoices}
              keyExtractor={(row) => row.id}
              onRowClick={(row) => setSelectedInvoice(row)}
            />
          </div>

          {/* Mobile Card View */}
          <div className="flex flex-col gap-3 md:hidden">
            {invoices.map((row) => (
              <div 
                key={row.id}
                onClick={() => setSelectedInvoice(row)}
                className="bg-card border border-border rounded-xl p-4 shadow-soft cursor-pointer hover:bg-muted/40 transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="font-semibold text-primary text-sm font-mono block mb-0.5">
                      {row.invoiceNumber}
                    </span>
                    <span className="font-medium text-foreground text-base">
                      {row.customerName}
                    </span>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-1 focus:outline-none transition-opacity hover:opacity-80" disabled={statusMutation.isPending}>
                          <InvoiceStatusBadge status={row.status} />
                          <ChevronDown className="h-3 w-3 text-muted-foreground" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {STATUS_FILTERS.filter(f => f.value !== "all").map(f => (
                          <DropdownMenuItem 
                            key={f.value}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (row.status !== f.value) {
                                statusMutation.mutate({ id: row.id, newStatus: f.value as InvoiceStatus });
                              }
                            }}
                          >
                            {f.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                  <div>
                    <span className="text-muted-foreground block mb-0.5">Date</span>
                    <span className="font-medium text-foreground">{formatDate(row.createdAt)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-0.5">Amount</span>
                    <span className="font-semibold text-primary">{formatCurrency(row.total)}</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-3 border-t border-border">
                  <div className="text-xs text-muted-foreground">
                    Due: {row.dueDate ? formatDate(row.dueDate) : "N/A"}
                  </div>
                  <div className="flex gap-2">
                    {row.status === "draft" && (
                      <Button
                        variant="secondary"
                        size="icon-sm"
                        className="h-8 w-8 rounded-full"
                        onClick={(e) => { e.stopPropagation(); navigate(`/billing/edit/${row.id}`); }}
                        aria-label="Edit draft"
                      >
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      size="icon-sm"
                      className="h-8 w-8 rounded-full"
                      onClick={(e) => { e.stopPropagation(); setSelectedInvoice(row); }}
                      aria-label="View invoice"
                    >
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon-sm"
                      className="h-8 w-8 rounded-full"
                      onClick={(e) => { e.stopPropagation(); handleDownloadPdf(row.id, row.invoiceNumber); }}
                      aria-label="Download invoice"
                    >
                      <Download className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon-sm"
                      className="h-8 w-8 rounded-full text-destructive hover:bg-destructive/10"
                      onClick={(e) => { e.stopPropagation(); setDeletingInvoice(row); }}
                      aria-label="Delete invoice"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {total > PAGE_SIZE && (
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          limit={PAGE_SIZE}
          onPageChange={setPage}
        />
      )}

      {/* Invoice Detail Modal */}
      <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
        {selectedInvoice && (
          <DialogContent className="w-[calc(100%-24px)] md:w-[95vw] max-w-xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-xl sm:rounded-lg mx-auto top-[5%] translate-y-0 sm:top-[50%] sm:-translate-y-[50%]">
            <DialogHeader>
              <DialogTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pr-6">
                <span>{selectedInvoice.invoiceNumber}</span>
                <InvoiceStatusBadge status={selectedInvoice.status} />
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4 text-sm bg-muted/20 p-3 rounded-lg">
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Customer</p>
                  <p className="font-semibold break-words">{selectedInvoice.customerName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Date</p>
                  <p className="font-semibold">{formatDate(selectedInvoice.createdAt)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Due Date</p>
                  <p className="font-semibold">{formatDate(selectedInvoice.dueDate)}</p>
                </div>
                {selectedInvoice.paidAt && (
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Paid On</p>
                    <p className="font-semibold text-emerald-600">{formatDate(selectedInvoice.paidAt)}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">Items</p>
                <div className="bg-muted/10 rounded-lg p-2 space-y-1">
                  {selectedInvoice.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center py-2 px-1 border-b border-border/40 last:border-0">
                      <div className="flex-1 pr-2 min-w-0">
                        <p className="text-sm font-medium truncate">{item.productName}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.quantity} × {formatCurrency(item.unitPrice)}
                          {item.discount > 0 && ` (${item.discount}% off)`}
                        </p>
                      </div>
                      <p className="font-semibold text-sm whitespace-nowrap">{formatCurrency(item.total)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2 text-sm bg-muted/20 p-3 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(selectedInvoice.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax ({selectedInvoice.taxRate}%)</span>
                  <span>{formatCurrency(selectedInvoice.taxAmount)}</span>
                </div>
                <Separator className="my-1" />
                <div className="flex justify-between text-base font-bold pt-1">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(selectedInvoice.total)}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button variant="outline" className="flex-1 h-10" onClick={() => toast.info("Download coming soon!")}>
                  <Download className="h-4 w-4 mr-2" /> Download PDF
                </Button>
                <Button variant="outline" className="flex-1 h-10" onClick={() => toast.info("Print coming soon!")}>
                  Print
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
      {/* Delete Confirmation Modal */}
      <AlertDialog open={!!deletingInvoice} onOpenChange={(open) => !open && setDeletingInvoice(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete invoice {deletingInvoice?.invoiceNumber}? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                if (deletingInvoice) {
                  deleteMutation.mutate(deletingInvoice.id);
                }
              }}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Invoice"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Mobile Floating Action Button (FAB) mounted via Portal */}
      {createPortal(
        <Button 
          asChild 
          size="icon" 
          className="fixed right-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] h-14 w-14 rounded-full shadow-xl bg-primary text-primary-foreground hover:bg-primary/90 z-[100] md:hidden"
        >
          <div onClick={() => navigate("/billing")} className="cursor-pointer flex items-center justify-center">
            <Plus className="h-6 w-6" />
            <span className="sr-only">New Invoice</span>
          </div>
        </Button>,
        document.body
      )}
    </div>
  );
}
