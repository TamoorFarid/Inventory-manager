import { useCallback, useEffect, useState } from 'react';
import { GalleryHorizontal, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
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
import { ImageUploadField } from '@/components/site-data/image-upload-field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/use-auth';
import { DEFAULT_HOME_SLIDE_IMAGE, HOME_SLIDE_ASPECT_RATIO } from '@/lib/constants';
import { getErrorMessage } from '@/lib/errors';
import { siteContentService } from '@/services/siteContentService';
import type { SiteHomeSlide } from '@/types/domain';

interface FormState {
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: string;
}

const emptyForm: FormState = {
  imageUrl: null,
  isActive: true,
  sortOrder: '0',
};

export function HomeSliderTab() {
  const { profile } = useAuth();
  const [slides, setSlides] = useState<SiteHomeSlide[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<SiteHomeSlide | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slideToDelete, setSlideToDelete] = useState<SiteHomeSlide | null>(null);

  const loadSlides = useCallback(async () => {
    setIsLoading(true);
    try {
      setSlides(await siteContentService.listHomeSlides());
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to load home slider images.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSlides();
  }, [loadSlides]);

  const openCreate = () => {
    setEditingSlide(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (slide: SiteHomeSlide) => {
    setEditingSlide(slide);
    setForm({
      imageUrl: slide.imageUrl,
      isActive: slide.isActive,
      sortOrder: String(slide.sortOrder),
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!profile || !form.imageUrl) return;
    setIsSubmitting(true);
    try {
      const payload = {
        imageUrl: form.imageUrl,
        isActive: form.isActive,
        sortOrder: Number(form.sortOrder) || 0,
      };

      if (editingSlide) {
        await siteContentService.updateHomeSlide(editingSlide.id, payload, profile.id);
        toast.success('Slide updated.');
      } else {
        await siteContentService.createHomeSlide(payload, profile.id);
        toast.success('Slide added.');
      }
      setDialogOpen(false);
      await loadSlides();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to save slide.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!slideToDelete || !profile) return;
    try {
      await siteContentService.deleteHomeSlide(slideToDelete.id, profile.id);
      toast.success('Slide removed.');
      setSlideToDelete(null);
      await loadSlides();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to remove slide.'));
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Home slider</CardTitle>
            <p className="text-sm text-muted-foreground">
              Images shown in the rotating slider on the SunPulse homepage header. Every image must be a{' '}
              {HOME_SLIDE_ASPECT_RATIO.width}:{HOME_SLIDE_ASPECT_RATIO.height} aspect ratio so the slider stays
              consistent.
            </p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            New slide
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-slate-400" />
            </div>
          ) : slides.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                <GalleryHorizontal className="h-7 w-7 text-slate-400" />
              </div>
              <p className="font-medium text-slate-700">No slides yet</p>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                Add an image to start filling the homepage slider.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {slides.map((slide) => (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" key={slide.id}>
                  <img
                    alt="Home slide"
                    className="aspect-[4/3] w-full object-cover"
                    src={slide.imageUrl}
                  />
                  <div className="space-y-2 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-muted-foreground">Order {slide.sortOrder}</p>
                      {slide.isActive ? (
                        <Badge className="shrink-0" variant="success">Active</Badge>
                      ) : (
                        <Badge className="shrink-0" variant="outline">Hidden</Badge>
                      )}
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button className="flex-1" onClick={() => openEdit(slide)} size="sm" variant="outline">
                        <Pencil className="size-3.5" />
                        Edit
                      </Button>
                      <Button onClick={() => setSlideToDelete(slide)} size="sm" variant="ghost">
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
            <DialogTitle>{editingSlide ? 'Edit slide' : 'New slide'}</DialogTitle>
            <DialogDescription>
              Rendered full-bleed in the homepage header slider — requires a{' '}
              {HOME_SLIDE_ASPECT_RATIO.width}:{HOME_SLIDE_ASPECT_RATIO.height} image.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <ImageUploadField
              aspectRatio={HOME_SLIDE_ASPECT_RATIO}
              defaultImage={DEFAULT_HOME_SLIDE_IMAGE}
              folder="home-slides"
              label="Slide image"
              onChange={(url) => setForm((current) => ({ ...current, imageUrl: url }))}
              value={form.imageUrl}
            />

            <div className="grid gap-4 sm:grid-cols-2 sm:items-end">
              <div className="space-y-2">
                <Label htmlFor="slide-sort">Display order</Label>
                <Input
                  id="slide-sort"
                  onChange={(event) => setForm((current) => ({ ...current, sortOrder: event.target.value }))}
                  type="number"
                  value={form.sortOrder}
                />
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">Active</p>
                  <p className="text-xs text-muted-foreground">Shown in the slider</p>
                </div>
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(checked) => setForm((current) => ({ ...current, isActive: checked }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setDialogOpen(false)} type="button" variant="ghost">
              Cancel
            </Button>
            <Button disabled={isSubmitting || !form.imageUrl} onClick={() => void handleSubmit()}>
              {isSubmitting ? 'Saving...' : editingSlide ? 'Save changes' : 'Add slide'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog onOpenChange={(open) => !open && setSlideToDelete(null)} open={Boolean(slideToDelete)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this slide?</AlertDialogTitle>
            <AlertDialogDescription>
              This image will be removed from the homepage slider.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleDelete()}>Remove slide</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
