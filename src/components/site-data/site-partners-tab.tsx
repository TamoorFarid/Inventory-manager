import { useCallback, useEffect, useState } from 'react';
import { Handshake, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/use-auth';
import { getErrorMessage } from '@/lib/errors';
import { siteContentService } from '@/services/siteContentService';
import type { SitePartner } from '@/types/domain';

interface FormState {
  name: string;
  isActive: boolean;
  sortOrder: string;
}

const emptyForm: FormState = {
  name: '',
  isActive: true,
  sortOrder: '0',
};

export function SitePartnersTab() {
  const { profile } = useAuth();
  const [partners, setPartners] = useState<SitePartner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<SitePartner | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [partnerToDelete, setPartnerToDelete] = useState<SitePartner | null>(null);

  const loadPartners = useCallback(async () => {
    setIsLoading(true);
    try {
      setPartners(await siteContentService.listPartners());
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to load partners.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPartners();
  }, [loadPartners]);

  const openCreate = () => {
    setEditingPartner(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (partner: SitePartner) => {
    setEditingPartner(partner);
    setForm({
      name: partner.name,
      isActive: partner.isActive,
      sortOrder: String(partner.sortOrder),
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!profile || !form.name.trim()) return;
    setIsSubmitting(true);
    try {
      const payload = {
        name: form.name,
        isActive: form.isActive,
        sortOrder: Number(form.sortOrder) || 0,
      };

      if (editingPartner) {
        await siteContentService.updatePartner(editingPartner.id, payload, profile.id);
        toast.success('Partner updated.');
      } else {
        await siteContentService.createPartner(payload, profile.id);
        toast.success('Partner added.');
      }
      setDialogOpen(false);
      await loadPartners();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to save partner.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!partnerToDelete || !profile) return;
    try {
      await siteContentService.deletePartner(partnerToDelete.id, profile.id);
      toast.success('Partner removed.');
      setPartnerToDelete(null);
      await loadPartners();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to remove partner.'));
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Official partners</CardTitle>
            <p className="text-sm text-muted-foreground">
              Names shown as bold, styled text in the scrolling marquee on the SunPulse homepage.
            </p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            New partner
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-slate-400" />
            </div>
          ) : partners.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                <Handshake className="h-7 w-7 text-slate-400" />
              </div>
              <p className="font-medium text-slate-700">No partners yet</p>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                Add a partner name to feature it in the homepage marquee.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {partners.map((partner) => (
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" key={partner.id}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-slate-900">{partner.name}</p>
                    {partner.isActive ? (
                      <Badge className="shrink-0" variant="success">Active</Badge>
                    ) : (
                      <Badge className="shrink-0" variant="outline">Hidden</Badge>
                    )}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button className="flex-1" onClick={() => openEdit(partner)} size="sm" variant="outline">
                      <Pencil className="size-3.5" />
                      Edit
                    </Button>
                    <Button onClick={() => setPartnerToDelete(partner)} size="sm" variant="ghost">
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
            <DialogTitle>{editingPartner ? 'Edit partner' : 'New partner'}</DialogTitle>
            <DialogDescription>Shown as styled text in the homepage marquee.</DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="partner-name">Partner name</Label>
              <Input
                id="partner-name"
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Longi Solar"
                value={form.name}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 sm:items-end">
              <div className="space-y-2">
                <Label htmlFor="partner-sort">Display order</Label>
                <Input
                  id="partner-sort"
                  onChange={(event) => setForm((current) => ({ ...current, sortOrder: event.target.value }))}
                  type="number"
                  value={form.sortOrder}
                />
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">Active</p>
                  <p className="text-xs text-muted-foreground">Shown in the marquee</p>
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
            <Button disabled={isSubmitting || !form.name.trim()} onClick={() => void handleSubmit()}>
              {isSubmitting ? 'Saving...' : editingPartner ? 'Save changes' : 'Add partner'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog onOpenChange={(open) => !open && setPartnerToDelete(null)} open={Boolean(partnerToDelete)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this partner?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-semibold text-slate-900">{partnerToDelete?.name}</span> will be removed
              from the homepage marquee.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleDelete()}>Remove partner</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
