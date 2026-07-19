import { useRef, useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { getErrorMessage } from '@/lib/errors';
import { siteContentService } from '@/services/siteContentService';

interface AspectRatioSpec {
  width: number;
  height: number;
  /** Fraction of allowed deviation from the target ratio, e.g. 0.03 = 3%. */
  tolerance?: number;
}

interface ImageUploadFieldProps {
  label: string;
  value: string | null;
  defaultImage: string;
  folder: 'blogs' | 'shop' | 'projects' | 'partners' | 'brands' | 'home-slides';
  onChange: (url: string | null) => void;
  /** When set, uploads are rejected client-side unless they match this aspect ratio. */
  aspectRatio?: AspectRatioSpec;
}

function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Unable to read that image file.'));
    };
    img.src = url;
  });
}

export function ImageUploadField({
  label,
  value,
  defaultImage,
  folder,
  onChange,
  aspectRatio,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;

    if (aspectRatio) {
      try {
        const { width, height } = await readImageDimensions(file);
        const target = aspectRatio.width / aspectRatio.height;
        const actual = width / height;
        const tolerance = aspectRatio.tolerance ?? 0.03;
        if (Math.abs(actual - target) / target > tolerance) {
          toast.error(
            `That image is ${width}×${height}px. Please upload an image with a ${aspectRatio.width}:${aspectRatio.height} aspect ratio.`,
          );
          if (inputRef.current) inputRef.current.value = '';
          return;
        }
      } catch (error) {
        toast.error(getErrorMessage(error, 'Unable to read that image file.'));
        if (inputRef.current) inputRef.current.value = '';
        return;
      }
    }

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
        <div
          className={
            aspectRatio
              ? 'relative w-40 shrink-0 overflow-hidden rounded-2xl border border-border bg-slate-50'
              : 'relative size-24 shrink-0 overflow-hidden rounded-2xl border border-border bg-slate-50'
          }
          style={aspectRatio ? { aspectRatio: `${aspectRatio.width} / ${aspectRatio.height}` } : undefined}
        >
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
          {aspectRatio ? (
            <p className="text-xs text-muted-foreground">
              Must be a {aspectRatio.width}:{aspectRatio.height} image (e.g. {aspectRatio.width * 400}×
              {aspectRatio.height * 400}px).
            </p>
          ) : null}
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
