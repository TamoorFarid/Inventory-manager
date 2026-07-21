import { useRef, useState } from 'react';
import { Loader2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { getErrorMessage } from '@/lib/errors';
import { siteContentService } from '@/services/siteContentService';
import type { SiteMediaType } from '@/types/domain';

interface SingleMediaUploadFieldProps {
  label: string;
  value: string | null;
  mediaType: SiteMediaType;
  defaultImage: string;
  folder: 'blogs' | 'shop' | 'projects' | 'partners' | 'brands' | 'home-slides';
  onChange: (media: { url: string | null; type: SiteMediaType }) => void;
}

/** Accepts exactly one image OR one video — not both. Uploading a new file replaces the current one. */
export function SingleMediaUploadField({
  label,
  value,
  mediaType,
  defaultImage,
  folder,
  onChange,
}: SingleMediaUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;

    setIsUploading(true);
    try {
      const media = await siteContentService.uploadSiteMedia(file, folder);
      onChange(media);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to upload file.'));
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-4">
        <div className="relative w-40 shrink-0 overflow-hidden rounded-2xl border border-border bg-slate-50 aspect-video">
          {value ? (
            mediaType === 'video' ? (
              <video className="size-full object-cover" controls muted src={value} />
            ) : (
              <img alt="Preview" className="size-full object-cover" src={value} />
            )
          ) : (
            <img alt="Preview" className="size-full object-cover" src={defaultImage} />
          )}
          {isUploading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70">
              <Loader2 className="size-5 animate-spin text-primary" />
            </div>
          ) : null}
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">
            {value
              ? `Custom ${mediaType} uploaded.`
              : 'No image or video uploaded — the default SunPulse image will be shown on the site.'}
          </p>
          <p className="text-xs text-muted-foreground">Upload either an image or a video, not both.</p>
          <div className="flex gap-2">
            <Button
              className="text-xs"
              disabled={isUploading}
              onClick={() => inputRef.current?.click()}
              size="sm"
              type="button"
              variant="outline"
            >
              <Upload className="size-3.5" />
              {value ? 'Replace' : 'Upload'}
            </Button>
            {value ? (
              <Button
                className="text-xs"
                onClick={() => onChange({ url: null, type: 'image' })}
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
        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml,video/mp4,video/webm,video/quicktime,video/ogg"
        className="hidden"
        onChange={(event) => void handleFile(event.target.files?.[0])}
        ref={inputRef}
        type="file"
      />
    </div>
  );
}
