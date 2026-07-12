import { useCallback, useEffect, useState } from 'react';
import { Layers, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { getErrorMessage } from '@/lib/errors';
import { siteContentService } from '@/services/siteContentService';
import type { SiteShopCategory } from '@/types/domain';

interface FormState {
  name: string;
  sortOrder: string;
}

const emptyForm: FormState = { name: '', sortOrder: '0' };

export function ShopCategoriesTab() {
  const { profile } = useAuth();
  const [categories, setCategories] = useState<SiteShopCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<SiteShopCategory | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<SiteShopCategory | null>(null);

  const loadCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      setCategories(await siteContentService.listShopCategories());
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to load categories.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const openCreate = () => {
    setEditingCategory(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (category: SiteShopCategory) => {
    setEditingCategory(category);
    setForm({ name: category.name, sortOrder: String(category.sortOrder) });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!profile || !form.name.trim()) return;
    setIsSubmitting(true);
    try {
      const payload = { name: form.name, sortOrder: Number(form.sortOrder) || 0 };
      if (editingCategory) {
        await siteContentService.updateShopCategory(editingCategory.id, payload, profile.id);
        toast.success('Category updated.');
      } else {
        await siteContentService.createShopCategory(payload, profile.id);
        toast.success('Category added.');
      }
      setDialogOpen(false);
      await loadCategories();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to save category.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!categoryToDelete || !profile) return;
    try {
      await siteContentService.deleteShopCategory(categoryToDelete.id, profile.id);
      toast.success('Category deleted.');
      setCategoryToDelete(null);
      await loadCategories();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to delete category.'));
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Shop categories</CardTitle>
            <p className="text-sm text-muted-foreground">
              Used to organize shop items and power the category filter on the public site.
            </p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            New category
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-slate-400" />
            </div>
          ) : categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                <Layers className="h-7 w-7 text-slate-400" />
              </div>
              <p className="font-medium text-slate-700">No categories yet</p>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                Add a category like Battery, Inverter, or Panels to organize the shop.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4" key={category.id}>
                  <p className="font-semibold text-slate-900">{category.name}</p>
                  <div className="flex gap-1">
                    <Button onClick={() => openEdit(category)} size="sm" variant="ghost">
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button onClick={() => setCategoryToDelete(category)} size="sm" variant="ghost">
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog onOpenChange={setDialogOpen} open={dialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit category' : 'New category'}</DialogTitle>
            <DialogDescription>Shown as a shop filter and product field on the public site.</DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="category-name">Name</Label>
              <Input
                id="category-name"
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Battery"
                value={form.name}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-sort">Display order</Label>
              <Input
                id="category-sort"
                onChange={(event) => setForm((current) => ({ ...current, sortOrder: event.target.value }))}
                type="number"
                value={form.sortOrder}
              />
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setDialogOpen(false)} type="button" variant="ghost">
              Cancel
            </Button>
            <Button disabled={isSubmitting || !form.name.trim()} onClick={() => void handleSubmit()}>
              {isSubmitting ? 'Saving...' : editingCategory ? 'Save changes' : 'Add category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog onOpenChange={(open) => !open && setCategoryToDelete(null)} open={Boolean(categoryToDelete)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this category?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-semibold text-slate-900">{categoryToDelete?.name}</span> will be removed.
              Shop items and brands using it will keep their existing reference but the category will no
              longer appear in dropdowns or filters.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleDelete()}>Delete category</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
