import { useState, useRef } from "react";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Download, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
// removed Alert import
import { toast } from "sonner";
import {
  downloadImportTemplate,
  uploadExcelPreview,
  executeExcelImport,
  ProductImportPreviewResponse,
  ProductImportExecuteResponse
} from "@/lib/api/products";

interface ExcelImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ExcelImportModal({ open, onOpenChange, onSuccess }: ExcelImportModalProps) {
  const [step, setStep] = useState<"upload" | "loading" | "preview" | "importing" | "result">("upload");
  const [previewData, setPreviewData] = useState<ProductImportPreviewResponse | null>(null);
  const [resultData, setResultData] = useState<ProductImportExecuteResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setStep("upload");
    setPreviewData(null);
    setResultData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && (step === "loading" || step === "importing")) {
      return; // Prevent closing while processing
    }
    if (!newOpen) {
      resetState();
    }
    onOpenChange(newOpen);
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await downloadImportTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "StockFlow_Products_Template.xlsx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast.error("Failed to download template");
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      toast.error("Please upload a valid Excel file (.xlsx or .xls)");
      return;
    }

    setStep("loading");
    try {
      const response = await uploadExcelPreview(file);
      setPreviewData(response);
      setStep("preview");
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to parse Excel file");
      resetState();
    }
  };

  const handleImport = async () => {
    if (!previewData?.rows) return;

    setStep("importing");
    try {
      const response = await executeExcelImport(previewData.rows);
      setResultData(response);
      setStep("result");
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to import products");
      setStep("preview");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[calc(100%-24px)] md:w-full sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Import Products</DialogTitle>
          <DialogDescription>
            {step === "upload" && "Upload an Excel file to bulk import products and categories."}
            {step === "preview" && "Review the parsed data before confirming the import."}
            {step === "result" && "Import completed successfully."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {step === "upload" && (
            <div className="flex flex-col items-center justify-center space-y-6 py-8">
              <div className="flex flex-col items-center space-y-2 text-center">
                <div className="p-4 bg-muted rounded-full">
                  <FileSpreadsheet className="w-12 h-12 text-primary" />
                </div>
                <h3 className="text-lg font-medium">Upload Excel File</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Drag and drop your file here, or click to browse. Supported formats: .xlsx
                </p>
              </div>

              <div className="flex gap-4">
                <Button variant="outline" onClick={handleDownloadTemplate}>
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </Button>
                
                <Button onClick={() => fileInputRef.current?.click()}>
                  <Upload className="w-4 h-4 mr-2" />
                  Select File
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".xlsx, .xls"
                  onChange={handleFileUpload}
                />
              </div>
            </div>
          )}

          {(step === "loading" || step === "importing") && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                {step === "loading" ? "Parsing Excel file..." : "Importing products... This may take a moment."}
              </p>
            </div>
          )}

          {step === "preview" && previewData && (
            <div className="space-y-6">
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-muted p-4 rounded-lg flex flex-col">
                  <span className="text-sm text-muted-foreground">Total Rows</span>
                  <span className="text-2xl font-bold">{previewData.total_rows}</span>
                </div>
                <div className="bg-muted p-4 rounded-lg flex flex-col">
                  <span className="text-sm text-muted-foreground">Valid</span>
                  <span className="text-2xl font-bold text-green-600">{previewData.valid_rows}</span>
                </div>
                <div className="bg-muted p-4 rounded-lg flex flex-col">
                  <span className="text-sm text-muted-foreground">Duplicates (SKU)</span>
                  <span className="text-2xl font-bold text-yellow-600">{previewData.duplicate_rows}</span>
                </div>
                <div className="bg-muted p-4 rounded-lg flex flex-col">
                  <span className="text-sm text-muted-foreground">New Categories</span>
                  <span className="text-2xl font-bold text-blue-600">{previewData.new_categories}</span>
                </div>
              </div>

              {previewData.invalid_rows > 0 && (
                <div className="rounded-lg border border-destructive/50 text-destructive p-4 flex gap-3 bg-destructive/10">
                  <AlertCircle className="h-5 w-5 mt-0.5" />
                  <div className="flex flex-col">
                    <h5 className="font-medium leading-none tracking-tight mb-1">Warning</h5>
                    <div className="text-sm opacity-90">
                      {previewData.invalid_rows} row(s) have validation errors and will be skipped.
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-md border max-h-[400px] overflow-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-muted/50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2">Row</th>
                      <th className="px-4 py-2">Product</th>
                      <th className="px-4 py-2">SKU</th>
                      <th className="px-4 py-2">Category</th>
                      <th className="px-4 py-2">Price</th>
                      <th className="px-4 py-2">Stock</th>
                      <th className="px-4 py-2">Unit</th>
                      <th className="px-4 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.rows.map((row) => (
                      <tr key={row.row_number} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-2">{row.row_number}</td>
                        <td className="px-4 py-2 font-medium">{row.name}</td>
                        <td className="px-4 py-2 text-muted-foreground">{row.sku || "-"}</td>
                        <td className="px-4 py-2">{row.category}</td>
                        <td className="px-4 py-2">{row.selling_price}</td>
                        <td className="px-4 py-2">{row.stock}</td>
                        <td className="px-4 py-2">{row.unit}</td>
                        <td className="px-4 py-2">
                          {row.status === "valid" && <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Valid</Badge>}
                          {row.status === "duplicate" && (
                            <div className="flex flex-col gap-1">
                              <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50 w-fit">Duplicate</Badge>
                              {row.errors.map((err, i) => (
                                <span key={i} className="text-xs text-yellow-700">{err}</span>
                              ))}
                            </div>
                          )}
                          {row.status === "invalid" && (
                            <div className="flex flex-col gap-1">
                              <Badge variant="destructive" className="w-fit">Error</Badge>
                              {row.errors.map((err, i) => (
                                <span key={i} className="text-xs text-destructive">{err}</span>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {step === "result" && resultData && (
            <div className="flex flex-col items-center justify-center space-y-6 py-8">
              <div className="p-4 bg-green-100 dark:bg-green-900/20 rounded-full">
                <CheckCircle2 className="w-16 h-16 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-center">Import Completed Successfully</h3>
              
              <div className="grid grid-cols-2 gap-4 w-full max-w-md mt-6">
                <div className="flex justify-between p-3 bg-muted rounded-md border">
                  <span className="text-muted-foreground">Products Imported</span>
                  <span className="font-bold">{resultData.products_imported}</span>
                </div>
                <div className="flex justify-between p-3 bg-muted rounded-md border">
                  <span className="text-muted-foreground">Categories Created</span>
                  <span className="font-bold">{resultData.categories_created}</span>
                </div>
                <div className="flex justify-between p-3 bg-muted rounded-md border">
                  <span className="text-muted-foreground">Duplicates Skipped</span>
                  <span className="font-bold">{resultData.products_skipped}</span>
                </div>
                <div className="flex justify-between p-3 bg-muted rounded-md border">
                  <span className="text-muted-foreground">Failed Rows</span>
                  <span className="font-bold text-destructive">{resultData.products_failed}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="mt-4 border-t pt-4">
          {step === "preview" && (
            <>
              <Button variant="outline" onClick={resetState}>
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={!previewData || previewData.valid_rows === 0}>
                Import {previewData?.valid_rows || 0} Products
              </Button>
            </>
          )}
          {step === "result" && (
            <Button onClick={() => handleOpenChange(false)}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
