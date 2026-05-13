import { useState } from 'react';
import type { FieldValues, Path, UseFormRegister } from 'react-hook-form';
import { Eye, EyeOff } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface BaseFieldProps<T extends FieldValues> {
  label: string;
  name: Path<T>;
  register: UseFormRegister<T>;
  error?: {
    message?: string;
  };
  placeholder?: string;
  type?: React.HTMLInputTypeAttribute;
}

export function FormInput<T extends FieldValues>({
  label,
  name,
  register,
  error,
  placeholder,
  type = 'text',
}: BaseFieldProps<T>) {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordField = type === 'password';
  const inputType = isPasswordField && showPassword ? 'text' : type;

  return (
    <div className="space-y-2">
      <Label htmlFor={String(name)}>{label}</Label>
      <div className="relative">
        <Input
          id={String(name)}
          type={inputType}
          placeholder={placeholder}
          className={cn(isPasswordField && 'pr-10')}
          {...register(name)}
        />
        {isPasswordField && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className="size-4 text-muted-foreground" />
            ) : (
              <Eye className="size-4 text-muted-foreground" />
            )}
          </Button>
        )}
      </div>
      {error ? <p className="text-sm text-destructive">{error.message}</p> : null}
    </div>
  );
}

export function FormTextarea<T extends FieldValues>({
  label,
  name,
  register,
  error,
  placeholder,
}: Omit<BaseFieldProps<T>, 'type'>) {
  return (
    <div className="space-y-2">
      <Label htmlFor={String(name)}>{label}</Label>
      <Textarea id={String(name)} placeholder={placeholder} {...register(name)} />
      {error ? <p className="text-sm text-destructive">{error.message}</p> : null}
    </div>
  );
}

export function FieldHint({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return <p className={cn('text-xs text-muted-foreground', className)}>{children}</p>;
}
