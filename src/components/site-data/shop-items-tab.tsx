import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, Pencil, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { MultiMediaUploadField } from '@/components/site-data/multi-media-upload-field';
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
import { Badge } from '@/components/ui/badge';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { DEFAULT_SHOP_IMAGE } from '@/lib/constants';
import { getErrorMessage } from '@/lib/errors';
import { siteContentService } from '@/services/siteContentService';
import type { SiteMediaItem, SiteShopBrand, SiteShopCategory, SiteShopItem } from '@/types/domain';

interface FormState {
  name: string;
  description: string;
  price: string;
  currency: string;
  media: SiteMediaItem[];
  categoryId: string;
  brandId: string;
  isAvailable: boolean;
  sortOrder: string;
}

const emptyForm: FormState = {
  name: '',
  description: '',
  price: '0',
  currency: 'PKR',
  media: [],
  categoryId: '',
  brandId: '',
  isAvailable: true,
  sortOrder: '0',
};

export function ShopItemsTab() {
  const { profile } = useAuth();
  const [items, setItems] = useState<SiteShopItem[]>([]);
  const [categories, setCategories] = useState<SiteShopCategory[]>([]);
  const [brands, setBrands] = useState<SiteShopBrand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SiteShopItem | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<SiteShopItem | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [nextItems, nextCategories, nextBrands] = await Promise.all([
        siteContentService.listShopItems(),
        siteContentService.listShopCategories(),
        siteContentService.listShopBrands(),
      ]);
      setItems(nextItems);
      setCategories(nextCategories);
      setBrands(nextBrands);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to load shop items.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const brandsForSelectedCategory = useMemo(
    () => brands.filter((brand) => brand.categoryId === form.categoryId),
    [brands, form.categoryId],
  );

  const openCreate = () => {
    setEditingItem(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (item: SiteShopItem) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      description: item.description ?? '',
      price: String(item.price),
      currency: item.currency,
      media: item.media,
      categoryId: item.categoryId ?? '',
      brandId: item.brandId ?? '',
      isAvailable: item.isAvailable,
      sortOrder: String(item.sortOrder),
    });
    setDialogOpen(true);
  };

  const handleCategoryChange = (categoryId: string) => {
    setForm((current) => ({
      ...current,
      categoryId,
      // Reset brand when the category changes since brand options are category-specific
      brandId: brands.some((brand) => brand.id === current.brandId && brand.categoryId === categoryId)
        ? current.brandId
        : '',
    }));
  };

  const handleSubmit = async () => {
    if (!profile || !form.name.trim()) return;
    setIsSubmitting(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        price: Number(form.price) || 0,
        currency: form.currency || 'PKR',
        media: form.media,
        categoryId: form.categoryId || null,
        brandId: form.brandId || null,
        isAvailable: form.isAvailable,
        sortOrder: Number(form.sortOrder) || 0,
      };

      if (editingItem) {
        await siteContentService.updateShopItem(editingItem.id, payload, profile.id);
        toast.success('Shop item updated.');
      } else {
        await siteContentService.createShopItem(payload, profile.id);
        toast.success('Shop item added.');
      }
      setDialogOpen(false);
      await loadData();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to save shop item.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete || !profile) return;
    try {
      await siteContentService.deleteShopItem(itemToDelete.id, profile.id);
      toast.success('Shop item deleted.');
      setItemToDelete(null);
      await loadData();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to delete shop item.'));
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Shop items</CardTitle>
            <p className="text-sm text-muted-foreground">
              Products shown on the SunPulse online shop.
            </p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            New item
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-slate-400" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                <ShoppingBag className="h-7 w-7 text-slate-400" />
              </div>
              <p className="font-medium text-slate-700">No shop items yet</p>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                Add products to populate the SunPulse shop page.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" key={item.id}>
                  {item.media[0]?.type === 'video' ? (
                    <video className="h-36 w-full object-cover" muted src={item.media[0].url} />
                  ) : (
                    <img alt={item.name} className="h-36 w-full object-cover" src={item.imageUrl || DEFAULT_SHOP_IMAGE} />
                  )}
                  <div className="space-y-2 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate font-semibold text-slate-900">{item.name}</p>
                      {item.isAvailable ? (
                        <Badge className="shrink-0" variant="success">Available</Badge>
                      ) : (
                        <Badge className="shrink-0" variant="outline">Hidden</Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {item.category ? <Badge variant="outline">{item.category.name}</Badge> : null}
                      {item.brand ? <Badge variant="outline">{item.brand.name}</Badge> : null}
                    </div>
                    <p className="text-sm font-medium text-green-700">
                      {item.currency} {item.price.toLocaleString()}
                    </p>
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {item.description || 'No description provided.'}
                    </p>
                    <div className="flex gap-2 pt-1">
                      <Button className="flex-1" onClick={() => openEdit(item)} size="sm" variant="outline">
                        <Pencil className="size-3.5" />
                        Edit
                      </Button>
                      <Button onClick={() => setItemToDelete(item)} size="sm" variant="ghost">
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit shop item' : 'New shop item'}</DialogTitle>
            <DialogDescription>Products appear on the public SunPulse shop page.</DialogDescription>
          </DialogHeader>

          <div className="max-h-[70vh] space-y-5 overflow-y-auto pr-1">
            <div className="space-y-2">
              <Label htmlFor="shop-name">Name</Label>
              <Input
                id="shop-name"
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="6kW Hybrid Solar Kit"
                value={form.name}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shop-description">Description</Label>
              <Textarea
                id="shop-description"
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="Product details shown on the shop page"
                value={form.description}
              />
            </div>

            <MultiMediaUploadField
              folder="shop"
              label="Product photos & videos"
              onChange={(media) => setForm((current) => ({ ...current, media }))}
              value={form.media}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="shop-category">Category</Label>
                <Select onValueChange={handleCategoryChange} value={form.categoryId}>
                  <SelectTrigger id="shop-category">
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
                {categories.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No categories yet — add one in the Categories tab first.
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="shop-brand">Brand</Label>
                <Select
                  disabled={!form.categoryId}
                  onValueChange={(value) => setForm((current) => ({ ...current, brandId: value }))}
                  value={form.brandId}
                >
                  <SelectTrigger id="shop-brand">
                    <SelectValue placeholder={form.categoryId ? 'Select brand' : 'Select category first'} />
                  </SelectTrigger>
                  <SelectContent>
                    {brandsForSelectedCategory.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.categoryId && brandsForSelectedCategory.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No brands for this category yet — add one in the Brands tab.
                  </p>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="shop-price">Price</Label>
                <Input
                  id="shop-price"
                  onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
                  type="number"
                  value={form.price}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shop-currency">Currency</Label>
                <Input
                  id="shop-currency"
                  onChange={(event) => setForm((current) => ({ ...current, currency: event.target.value }))}
                  value={form.currency}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 sm:items-end">
              <div className="space-y-2">
                <Label htmlFor="shop-sort">Display order</Label>
                <Input
                  id="shop-sort"
                  onChange={(event) => setForm((current) => ({ ...current, sortOrder: event.target.value }))}
                  type="number"
                  value={form.sortOrder}
                />
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">Available</p>
                  <p className="text-xs text-muted-foreground">Visible in the public shop</p>
                </div>
                <Switch
                  checked={form.isAvailable}
                  onCheckedChange={(checked) => setForm((current) => ({ ...current, isAvailable: checked }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setDialogOpen(false)} type="button" variant="ghost">
              Cancel
            </Button>
            <Button disabled={isSubmitting || !form.name.trim()} onClick={() => void handleSubmit()}>
              {isSubmitting ? 'Saving...' : editingItem ? 'Save changes' : 'Add item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog onOpenChange={(open) => !open && setItemToDelete(null)} open={Boolean(itemToDelete)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this item?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-semibold text-slate-900">{itemToDelete?.name}</span> will be removed
              from the public shop. This performs a soft delete.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleDelete()}>Delete item</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
