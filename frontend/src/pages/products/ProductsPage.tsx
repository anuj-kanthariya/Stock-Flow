import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Package, Eye, Loader2, ImageOff } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchBar } from "@/components/shared/SearchBar";
import { DataTable } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { Pagination } from "@/components/shared/Pagination";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getProducts, deleteProduct } from "@/lib/api/products";
import { getCategories } from "@/lib/api/categories";
import { formatCurrency, formatNumber } from "@/lib/utils";
import type { Product, Category } from "@/types";
import { toast } from "sonner";
import { ExcelImportModal } from "./ExcelImportModal";
import { Upload } from "lucide-react";
import { createPortal } from "react-dom";

const PAGE_SIZE = 8;

export default function ProductsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [search, setSearch] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategory = searchParams.get("category") || "all";
  
  const handleCategoryChange = (val: string) => {
    setSearchParams(prev => {
      if (val === "all") {
        prev.delete("category");
      } else {
        prev.set("category", val);
      }
      return prev;
    });
    setPage(1);
  };
  const [page, setPage] = useState(1);
  
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Fetch Categories for the dropdown
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories(),
  });

  // Fetch Products
  const { data: response, isLoading, isError } = useQuery({
    queryKey: ["products", page, PAGE_SIZE, search, selectedCategory],
    queryFn: () => getProducts(page, PAGE_SIZE, search, selectedCategory),
  });

  const products = response?.data || [];
  const meta = response?.meta || { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 };

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product deleted successfully");
      setProductToDelete(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to delete product");
    },
  });

  const handleDelete = () => {
    if (productToDelete) {
      deleteMutation.mutate(productToDelete.id);
    }
  };

  const currentCategoryObj = categories.find((c: Category) => c.id === selectedCategory);
  const pageTitle = currentCategoryObj ? `Products > ${currentCategoryObj.name}` : "Products";

  return (
    <div className="space-y-4 md:space-y-5 flex flex-col h-full w-full">
      <div className="hidden md:block">
        <PageHeader
          title={pageTitle}
          description={`${formatNumber(meta.total)} products in your inventory`}
          breadcrumbs={[{ label: "Products" }]}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              {selectedCategory !== "all" && (
                <Button variant="outline" onClick={() => handleCategoryChange("all")}>
                  Clear Filter
                </Button>
              )}
              <Button variant="secondary" onClick={() => setIsImportModalOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Import Excel
              </Button>
              <Button id="add-product-btn" onClick={() => navigate("/products/add")}>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </div>
          }
        />
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-col md:flex-row items-center gap-3 w-full">
        {/* Search */}
        <SearchBar
          id="products-search"
          value={search}
          onChange={(v: string) => { setSearch(v); setPage(1); }}
          placeholder="Search by name or SKU..."
          className="w-full md:flex-1"
        />
        
        {/* Mobile secondary row: Category Filter + Actions */}
        <div className="flex w-full md:w-auto items-center gap-2">
          <Select 
            value={selectedCategory} 
            onValueChange={handleCategoryChange}
          >
            <SelectTrigger className="w-full md:w-48 bg-card h-10">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c: Category) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Mobile Import Excel Icon Button */}
          <Button 
            variant="outline" 
            size="icon" 
            className="md:hidden h-10 w-10 shrink-0" 
            onClick={() => setIsImportModalOpen(true)}
            title="Import Excel"
          >
            <Upload className="h-4.5 w-4.5" />
          </Button>

          {/* Mobile Clear Filter Icon Button */}
          {selectedCategory !== "all" && (
            <Button 
              variant="outline" 
              className="md:hidden h-10 px-3 text-xs shrink-0" 
              onClick={() => handleCategoryChange("all")}
            >
              Clear
            </Button>
          )}

          <Badge variant="secondary" className="h-9 px-3 text-sm font-medium ml-auto hidden md:flex">
            {meta.total} results
          </Badge>
        </div>
      </div>


      {/* Table / Loading State */}
      {isLoading ? (
        <div className="bg-card border border-border rounded-xl h-96 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading products...</p>
        </div>
      ) : isError ? (
        <div className="bg-card border border-border rounded-xl h-96 flex flex-col items-center justify-center space-y-4 text-destructive">
          <p>Failed to load products. Please try again.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <DataTable<Product>
              columns={[
            {
              key: "name",
              header: "Product",
              render: (row) => (
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-md bg-accent flex items-center justify-center flex-shrink-0 border border-border overflow-hidden">
                    {row.imageUrl ? (
                      <img src={row.imageUrl} alt={row.name} className="h-full w-full object-cover" />
                    ) : (
                      <ImageOff className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{row.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{row.sku}</p>
                  </div>
                </div>
              ),
            },
            {
              key: "brand",
              header: "Brand",
              render: (row) => (
                <span className="text-muted-foreground">{row.brand || "-"}</span>
              ),
            },
            {
              key: "categoryName",
              header: "Category",
              render: (row) => (
                <Badge variant="secondary">{row.categoryName}</Badge>
              ),
            },
            {
              key: "stockQuantity",
              header: "Stock",
              render: (row) => (
                <div className="flex items-center gap-1.5">
                  <span
                    className={
                      (row.stockQuantity ?? 0) <= (row.minimumStock ?? 10)
                        ? "text-destructive font-semibold"
                        : "font-medium"
                    }
                  >
                    {(row.stockQuantity ?? 0)}
                  </span>
                  <span className="text-muted-foreground text-xs">{row.unit}</span>
                  {(row.stockQuantity ?? 0) <= (row.minimumStock ?? 10) && (
                    <Badge variant="destructive" className="text-[10px]">
                      Low
                    </Badge>
                  )}
                </div>
              ),
            },

            {
              key: "sellingPrice",
              header: "Selling Price",
              render: (row) => (
                <span className="font-medium">{formatCurrency(row.sellingPrice)}</span>
              ),
            },
            {
              key: "actions",
              header: "",
              render: (row) => (
                <div className="flex items-center gap-1 justify-end">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewProduct(row);
                    }}
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/products/${row.id}/edit`);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setProductToDelete(row);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              ),
              headerClassName: "text-right",
            },
          ]}
          data={products}
          keyExtractor={(row) => row.id}
          emptyState={
            <EmptyState
              icon={<Package className="h-8 w-8 text-muted-foreground" />}
              title="No products found"
              description={
                search
                  ? "No products match your search. Try adjusting it."
                  : selectedCategory !== "all"
                  ? "No products found in this category."
                  : "Get started by adding your first product."
              }
              action={
                !search && selectedCategory === "all" && (
                  <Button onClick={() => navigate("/products/add")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                )
              }
            />
          }
        />
          </div>

          {/* Mobile Card List View */}
          <div className="md:hidden flex flex-col gap-3 pb-24">
            {products.length === 0 ? (
              <EmptyState
                icon={<Package className="h-8 w-8 text-muted-foreground" />}
                title="No products found"
                description={
                  search
                    ? "No products match your search. Try adjusting it."
                    : selectedCategory !== "all"
                    ? "No products found in this category."
                    : "Get started by adding your first product."
                }
                /* Intentionally omitting 'action' on mobile as the FAB is always present */
              />
            ) : (
              products.map((product: Product) => (
                <div key={product.id} className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-md bg-accent flex items-center justify-center flex-shrink-0 border border-border overflow-hidden">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                      ) : (
                        <ImageOff className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground font-mono truncate">SKU: {product.sku}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-[10px]">{product.categoryName}</Badge>
                        {product.brand && <span className="text-[10px] text-muted-foreground truncate">{product.brand}</span>}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-1 pt-3 border-t border-border/50">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">{formatCurrency(product.sellingPrice)}</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs text-muted-foreground">Stock:</span>
                        <span className={`text-sm font-medium ${(product.stockQuantity ?? 0) <= (product.minimumStock ?? 10) ? "text-destructive font-semibold" : ""}`}>
                          {product.stockQuantity ?? 0}
                        </span>
                        {(product.stockQuantity ?? 0) <= (product.minimumStock ?? 10) && (
                          <Badge variant="destructive" className="text-[9px] px-1 h-3.5">Low</Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setViewProduct(product)} className="h-8 w-8">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/products/${product.id}/edit`)} className="h-8 w-8">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setProductToDelete(product)} className="h-8 w-8 text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Pagination wrapper for mobile */}
      <div className="mt-auto pt-4 flex w-full justify-center md:justify-start">
        <Pagination
          page={page}
          totalPages={meta.totalPages}
          total={meta.total}
          limit={PAGE_SIZE}
          onPageChange={setPage}
        />
      </div>

      {/* Mobile Floating Action Button (FAB) mounted via Portal */}
      {createPortal(
        <Button 
          asChild 
          size="icon" 
          className="fixed right-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] h-14 w-14 rounded-full shadow-xl bg-primary text-primary-foreground hover:bg-primary/90 z-[100] md:hidden"
        >
          <div onClick={() => navigate("/products/add")} className="cursor-pointer flex items-center justify-center">
            <Plus className="h-6 w-6" />
            <span className="sr-only">Add Product</span>
          </div>
        </Button>,
        document.body
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the product <strong className="text-foreground">{productToDelete?.name}</strong>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete Product"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Details Modal */}
      <Dialog open={!!viewProduct} onOpenChange={(open) => !open && setViewProduct(null)}>
        <DialogContent className="w-[calc(100%-24px)] md:w-full sm:max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
          </DialogHeader>
          {viewProduct && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-4">
              <div className="col-span-1">
                <div className="aspect-square rounded-xl bg-accent border border-border flex items-center justify-center overflow-hidden">
                  {viewProduct.imageUrl ? (
                    <img src={viewProduct.imageUrl} alt={viewProduct.name} className="w-full h-full object-cover" />
                  ) : (
                    <ImageOff className="h-10 w-10 text-muted-foreground/50" />
                  )}
                </div>
              </div>
              <div className="col-span-2 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{viewProduct.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary">{viewProduct.categoryName}</Badge>
                    <Badge variant={viewProduct.isActive ? "success" : "secondary"}>
                      {viewProduct.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">SKU</p>
                    <p className="font-mono">{viewProduct.sku}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Brand</p>
                    <p>{viewProduct.brand || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Selling Price</p>
                    <p className="font-medium text-primary">{formatCurrency(viewProduct.sellingPrice)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Purchase Price</p>
                    <p>{viewProduct.purchasePrice ? formatCurrency(viewProduct.purchasePrice) : "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Stock</p>
                    <p className={(viewProduct.stockQuantity ?? 0) <= (viewProduct.minimumStock ?? 10) ? "text-destructive font-medium" : ""}>
                      {(viewProduct.stockQuantity ?? 0)} {viewProduct.unit}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">GST %</p>
                    <p>{viewProduct.gstPercentage}%</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ExcelImportModal
        open={isImportModalOpen}
        onOpenChange={setIsImportModalOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["products"] });
          queryClient.invalidateQueries({ queryKey: ["categories"] });
        }}
      />
    </div>
  );
}
