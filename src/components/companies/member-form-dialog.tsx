import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { FormInput } from '@/components/shared/form-field';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { memberSchema, type MemberValues } from '@/lib/validators';

interface MemberFormDialogProps {
  isOpen: boolean;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: MemberValues) => Promise<void> | void;
}

const defaultValues: MemberValues = {
  email: '',
  username: '',
  password: '',
};

export function MemberFormDialog({
  isOpen,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: MemberFormDialogProps) {
  const form = useForm<MemberValues>({
    resolver: zodResolver(memberSchema),
    defaultValues,
  });

  useEffect(() => {
    if (isOpen) {
      form.reset(defaultValues);
    }
  }, [form, isOpen]);

  return (
    <Dialog onOpenChange={onOpenChange} open={isOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add company member</DialogTitle>
          <DialogDescription>
            This creates the Supabase auth user, profile, and company membership in one secure flow.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-5"
          onSubmit={form.handleSubmit(async (values) => {
            await onSubmit(values);
          })}
        >
          <FormInput
            error={form.formState.errors.email}
            label="Email"
            name="email"
            placeholder="member@sunpulse.com"
            register={form.register}
            type="email"
          />
          <FormInput
            error={form.formState.errors.username}
            label="Username"
            name="username"
            placeholder="Amina"
            register={form.register}
          />
          <FormInput
            error={form.formState.errors.password}
            label="Temporary password"
            name="password"
            placeholder="Create a secure password"
            register={form.register}
            type="password"
          />

          <DialogFooter>
            <Button onClick={() => onOpenChange(false)} type="button" variant="ghost">
              Cancel
            </Button>
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? 'Creating...' : 'Create member'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
