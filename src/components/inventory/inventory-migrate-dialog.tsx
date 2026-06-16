import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
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
import { useAuth } from '@/hooks/use-auth';
import { getErrorMessage } from '@/lib/errors';
import { companyService } from '@/services/companyService';
import { inventoryService } from '@/services/inventoryService';
import type { InventoryItem } from '@/types/domain';

interface Props {
  item: InventoryItem | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function InventoryMigrateDialog({ item, isOpen, onOpenChange, onSuccess }: Props) {
  const { profile } = useAuth();
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([]);
  const [targetCompanyId, setTargetCompanyId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);

  useEffect(() => {
    if (!isOpen || !item) return;
    setTargetCompanyId('');
    setQuantity('');
    setIsLoadingCompanies(true);
    companyService
      .listCompaniesSimple()
      .then((all) => setCompanies(all.filter((c) => c.id !== item.companyId)))
      .catch((err) => toast.error(getErrorMessage(err, 'Failed to load companies.')))
      .finally(() => setIsLoadingCompanies(false));
  }, [isOpen, item]);

  const handleSubmit = async () => {
    if (!item || !profile || !targetCompanyId) return;
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0 || qty > item.quantity) {
      toast.error(`Enter a valid quantity between 1 and ${item.quantity}.`);
      return;
    }
    setIsSubmitting(true);
    try {
      await inventoryService.migrateInventoryItem(item.id, targetCompanyId, qty, profile.id);
      toast.success('Inventory migrated successfully.');
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to migrate inventory.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!item) return null;

  const qty = parseInt(quantity, 10);
  const isValid = Boolean(targetCompanyId) && !isNaN(qty) && qty > 0 && qty <= item.quantity;

  return (
    <Dialog onOpenChange={onOpenChange} open={isOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Migrate Inventory</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Item</Label>
            <Input disabled value={item.title} />
          </div>
          <div className="space-y-1.5">
            <Label>Current quantity</Label>
            <Input disabled value={item.quantity} />
          </div>
          <div className="space-y-1.5">
            <Label>Quantity to migrate</Label>
            <Input
              max={item.quantity}
              min={1}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder={`1 – ${item.quantity}`}
              type="number"
              value={quantity}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Migrate to company</Label>
            <Select
              disabled={isLoadingCompanies || companies.length === 0}
              onValueChange={setTargetCompanyId}
              value={targetCompanyId}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    isLoadingCompanies
                      ? 'Loading companies…'
                      : companies.length === 0
                        ? 'No other companies'
                        : 'Select a company'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {companies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button onClick={() => onOpenChange(false)} variant="outline">
              Cancel
            </Button>
            <Button disabled={!isValid || isSubmitting} onClick={() => void handleSubmit()}>
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Migrating…
                </>
              ) : (
                'Migrate'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
