import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, Tag, Loader2, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchBar } from "@/components/shared/SearchBar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/lib/api/categories";
import type { Category } from "@/types";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { createPortal } from "react-dom";

const COLORS = [
  "#3b82f6", "#8b5cf6", "#10b981", "#f59e0b",
  "#ef4444", "#ec4899", "#0891b2", "#65a30d",
];

export default function CategoriesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);

  const queryClient = useQueryClient();

  const { data: categories = [], isLoading, isError } = useQuery({
    queryKey: ["categories", search],
    queryFn: () => getCategories(search),
  });

  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category added successfully!");
      handleCloseModal();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to create category");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Category> }) =>
      updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category updated successfully!");
      handleCloseModal();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to update category");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category deleted successfully!");
      setDeleteId(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to delete category");
    },
  });

  const handleOpenAdd = () => {
    setName("");
    setDescription("");
    setSelectedColor(COLORS[0]);
    setEditCategory(null);
    setAddOpen(true);
  };

  const handleOpenEdit = (category: Category) => {
    setName(category.name);
    setDescription(category.description || "");
    setSelectedColor(category.color);
    setEditCategory(category);
    setAddOpen(true);
  };

  const handleCloseModal = () => {
    setAddOpen(false);
    setTimeout(() => {
      setEditCategory(null);
      setName("");
      setDescription("");
      setSelectedColor(COLORS[0]);
    }, 200);
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("Category name is required");
      return;
    }

    if (editCategory) {
      updateMutation.mutate({
        id: editCategory.id,
        data: { name, description, color: selectedColor },
      });
    } else {
      createMutation.mutate({
        name,
        description,
        color: selectedColor,
      });
    }
  };

  return (
    <div className="space-y-4 md:space-y-5 flex flex-col h-full w-full pb-24 md:pb-0">
      <div className="hidden md:block">
        <PageHeader
          title="Categories"
          description="Organize your products into categories"
          breadcrumbs={[{ label: "Categories" }]}
          actions={
            <Button id="add-category-btn" onClick={handleOpenAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          }
        />
      </div>

      <div className="flex items-center gap-3 w-full">
        <SearchBar
          id="categories-search"
          value={search}
          onChange={setSearch}
          placeholder="Search categories…"
          className="w-full md:flex-1"
        />
      </div>

      {/* Category Cards Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : isError ? (
        <div className="text-center py-16 text-destructive">
          <AlertCircle className="h-10 w-10 mx-auto mb-3 opacity-80" />
          <p className="font-medium">Failed to load categories</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <CategoryCard
              key={cat.id}
              category={cat}
              onEdit={(e) => {
                e.stopPropagation();
                handleOpenEdit(cat);
              }}
              onDelete={(e) => {
                e.stopPropagation();
                setDeleteId(cat.id);
              }}
              onClick={() => navigate(`/products?category=${cat.id}`)}
            />
          ))}
          {categories.length === 0 && (
            <div className="col-span-full rounded-xl border border-border overflow-hidden">
              <div className="bg-card">
                <EmptyState
                  icon={<Tag className="h-8 w-8 text-muted-foreground" />}
                  title="No categories found"
                  description="Get started by adding your first category."
                  action={
                    <Button onClick={handleOpenAdd}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Category
                    </Button>
                  }
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mobile Floating Action Button (FAB) mounted via Portal */}
      {createPortal(
        <Button 
          asChild 
          size="icon" 
          className="fixed right-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] h-14 w-14 rounded-full shadow-xl bg-primary text-primary-foreground hover:bg-primary/90 z-[100] md:hidden"
        >
          <div onClick={handleOpenAdd} className="cursor-pointer flex items-center justify-center">
            <Plus className="h-6 w-6" />
            <span className="sr-only">Add Category</span>
          </div>
        </Button>,
        document.body
      )}

      {/* Add/Edit Category Modal */}
      <Dialog open={addOpen} onOpenChange={(open: boolean) => !open && handleCloseModal()}>
        <DialogContent className="w-[calc(100%-24px)] md:w-full sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editCategory ? "Edit Category" : "Add Category"}</DialogTitle>
            <DialogDescription>
              {editCategory
                ? "Update the details of your category."
                : "Create a new category to organize your products."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="cat-name">Category Name *</Label>
              <Input
                id="cat-name"
                placeholder="e.g. Electronics"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-description">Description</Label>
              <Textarea
                id="cat-description"
                placeholder="Brief description…"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className="h-7 w-7 rounded-full transition-all duration-150"
                    style={{
                      backgroundColor: color,
                      outline: selectedColor === color ? `3px solid ${color}` : "none",
                      outlineOffset: "2px",
                    }}
                    aria-label={`Select color ${color}`}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseModal} disabled={createMutation.isPending || updateMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editCategory ? "Save Changes" : "Add Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open: boolean) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              Deleting this category will also permanently delete all products in this category. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Category
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CategoryCard({
  category,
  onEdit,
  onDelete,
  onClick,
}: {
  category: Category;
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  onClick: () => void;
}) {
  return (
    <Card 
      className="group hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div
            className="h-11 w-11 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm"
            style={{ backgroundColor: category.color }}
          >
            {category.name.charAt(0)}
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon-sm" onClick={onEdit} aria-label="Edit">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={onDelete} aria-label="Delete">
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>
        </div>
        <h3 className="font-semibold text-foreground">{category.name}</h3>
        {category.description && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {category.description}
          </p>
        )}
        <div className="mt-3 flex items-center justify-between">
          <Badge variant="secondary" className="text-xs">
            {category.productCount} products
          </Badge>
          <span className="text-xs text-muted-foreground">
            {formatDate(category.createdAt)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
