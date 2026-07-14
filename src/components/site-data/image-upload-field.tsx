import { useRef, useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { getErrorMessage } from '@/lib/errors';
import { siteContentService } from '@/services/siteContentService';

interface ImageUploadFieldProps {
  label: string;
  value: string | null;
  defaultImage: string;
  folder: 'blogs' | 'shop' | 'projects' | 'partners' | 'brands';
  onChange: (url: string | null) => void;
}

export function ImageUploadField({ label, value, defaultImage, folder, onChange }: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await siteContentService.uploadSiteImage(file, folder);
      onChange(url);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to upload image.'));
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-4">
        <div className="relative size-24 shrink-0 overflow-hidden rounded-2xl border border-border bg-slate-50">
          <img
            alt="Preview"
            className="size-full object-cover"
            src={value || defaultImage}
          />
          {isUploading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70">
              <Loader2 className="size-5 animate-spin text-primary" />
            </div>
          ) : null}
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">
            {value ? 'Custom image uploaded.' : 'No image uploaded — the default SunPulse image will be shown on the site.'}
          </p>
          <div className="flex gap-2">
            <Button
              className="text-xs"
              disabled={isUploading}
              onClick={() => inputRef.current?.click()}
              size="sm"
              type="button"
              variant="outline"
            >
              <ImagePlus className="size-3.5" />
              {value ? 'Replace' : 'Upload'}
            </Button>
            {value ? (
              <Button
                className="text-xs"
                onClick={() => onChange(null)}
                size="sm"
                type="button"
                variant="ghost"
              >
                <X className="size-3.5" />
                Remove
              </Button>
            ) : null}
          </div>
        </div>
      </div>
      <input
        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
        className="hidden"
        onChange={(event) => void handleFile(event.target.files?.[0])}
        ref={inputRef}
        type="file"
      />
    </div>
  );
}
