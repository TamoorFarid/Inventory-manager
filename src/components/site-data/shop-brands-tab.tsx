import { useCallback, useEffect, useState } from 'react';
import { Loader2, Pencil, Plus, Tag, Trash2 } from 'lucide-react';
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
import { ImageUploadField } from '@/components/site-data/image-upload-field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import { DEFAULT_BRAND_LOGO } from '@/lib/constants';
import { getErrorMessage } from '@/lib/errors';
import { siteContentService } from '@/services/siteContentService';
import type { SiteShopBrand, SiteShopCategory } from '@/types/domain';

interface FormState {
  name: string;
  logoUrl: string | null;
  categoryId: string;
  sortOrder: string;
}

const emptyForm: FormState = { name: '', logoUrl: null, categoryId: '', sortOrder: '0' };

export function ShopBrandsTab() {
  const { profile } = useAuth();
  const [brands, setBrands] = useState<SiteShopBrand[]>([]);
  const [categories, setCategories] = useState<SiteShopCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<SiteShopBrand | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [brandToDelete, setBrandToDelete] = useState<SiteShopBrand | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [nextBrands, nextCategories] = await Promise.all([
        siteContentService.listShopBrands(),
        siteContentService.listShopCategories(),
      ]);
      setBrands(nextBrands);
      setCategories(nextCategories);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to load brands.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const categoryName = (categoryId: string) =>
    categories.find((category) => category.id === categoryId)?.name ?? 'Uncategorized';

  const openCreate = () => {
    setEditingBrand(null);
    setForm({ ...emptyForm, categoryId: categories[0]?.id ?? '' });
    setDialogOpen(true);
  };

  const openEdit = (brand: SiteShopBrand) => {
    setEditingBrand(brand);
    setForm({
      name: brand.name,
      logoUrl: brand.logoUrl,
      categoryId: brand.categoryId,
      sortOrder: String(brand.sortOrder),
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!profile || !form.name.trim() || !form.categoryId) return;
    setIsSubmitting(true);
    try {
      const payload = {
        name: form.name,
        logoUrl: form.logoUrl,
        categoryId: form.categoryId,
        sortOrder: Number(form.sortOrder) || 0,
      };
      if (editingBrand) {
        await siteContentService.updateShopBrand(editingBrand.id, payload, profile.id);
        toast.success('Brand updated.');
      } else {
        await siteContentService.createShopBrand(payload, profile.id);
        toast.success('Brand added.');
      }
      setDialogOpen(false);
      await loadData();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to save brand.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!brandToDelete || !profile) return;
    try {
      await siteContentService.deleteShopBrand(brandToDelete.id, profile.id);
      toast.success('Brand deleted.');
      setBrandToDelete(null);
      await loadData();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to delete brand.'));
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Shop brands</CardTitle>
            <p className="text-sm text-muted-foreground">
              Each brand belongs to a category and appears as a dropdown option and public filter.
            </p>
          </div>
          <Button disabled={categories.length === 0} onClick={openCreate}>
            <Plus className="size-4" />
            New brand
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
                <Tag className="h-7 w-7 text-slate-400" />
              </div>
              <p className="font-medium text-slate-700">Add a category first</p>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                Brands belong to a category — create one in the Categories tab first.
              </p>
            </div>
          ) : brands.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                <Tag className="h-7 w-7 text-slate-400" />
              </div>
              <p className="font-medium text-slate-700">No brands yet</p>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                Add brands like Longi, GoodWe, or Dyness under their category.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {brands.map((brand) => (
                <div className="rounded-2xl border border-slate-200 bg-white p-4" key={brand.id}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-3">
                      <img
                        alt={brand.name}
                        className="size-10 shrink-0 rounded-lg border border-slate-100 object-contain"
                        src={brand.logoUrl || DEFAULT_BRAND_LOGO}
                      />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">{brand.name}</p>
                        <p className="text-xs text-muted-foreground">{categoryName(brand.categoryId)}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button onClick={() => openEdit(brand)} size="sm" variant="ghost">
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button onClick={() => setBrandToDelete(brand)} size="sm" variant="ghost">
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
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
            <DialogTitle>{editingBrand ? 'Edit brand' : 'New brand'}</DialogTitle>
            <DialogDescription>Shown as a dropdown option and public filter under its category.</DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="brand-name">Name</Label>
              <Input
                id="brand-name"
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Longi"
                value={form.name}
              />
            </div>
            <ImageUploadField
              defaultImage={DEFAULT_BRAND_LOGO}
              folder="brands"
              label="Logo"
              onChange={(url) => setForm((current) => ({ ...current, logoUrl: url }))}
              value={form.logoUrl}
            />
            <div className="space-y-2">
              <Label htmlFor="brand-category">Category</Label>
              <Select
                onValueChange={(value) => setForm((current) => ({ ...current, categoryId: value }))}
                value={form.categoryId}
              >
                <SelectTrigger id="brand-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand-sort">Display order</Label>
              <Input
                id="brand-sort"
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
            <Button disabled={isSubmitting || !form.name.trim() || !form.categoryId} onClick={() => void handleSubmit()}>
              {isSubmitting ? 'Saving...' : editingBrand ? 'Save changes' : 'Add brand'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog onOpenChange={(open) => !open && setBrandToDelete(null)} open={Boolean(brandToDelete)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this brand?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-semibold text-slate-900">{brandToDelete?.name}</span> will be removed
              from dropdowns and filters.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleDelete()}>Delete brand</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
