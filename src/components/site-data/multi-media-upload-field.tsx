import { useRef, useState } from 'react';
import { Film, ImagePlus, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

import { Label } from '@/components/ui/label';
import { getErrorMessage } from '@/lib/errors';
import { siteContentService } from '@/services/siteContentService';
import type { SiteMediaItem } from '@/types/domain';

interface MultiMediaUploadFieldProps {
  label: string;
  value: SiteMediaItem[];
  folder: 'blogs' | 'shop' | 'projects' | 'partners' | 'brands' | 'home-slides';
  onChange: (media: SiteMediaItem[]) => void;
}

export function MultiMediaUploadField({ label, value, folder, onChange }: MultiMediaUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const uploaded: SiteMediaItem[] = [];
      for (const file of Array.from(files)) {
        try {
          uploaded.push(await siteContentService.uploadSiteMedia(file, folder));
        } catch (error) {
          toast.error(getErrorMessage(error, `Unable to upload ${file.name}.`));
        }
      }
      if (uploaded.length > 0) {
        onChange([...value, ...uploaded]);
      }
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const removeAt = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <p className="text-xs text-muted-foreground">
        {value.length > 0
          ? `${value.length} file${value.length === 1 ? '' : 's'} uploaded.`
          : 'No media uploaded — the default SunPulse image will be shown on the site.'}
      </p>
      <div className="flex flex-wrap gap-3">
        {value.map((item, index) => (
          <div
            className="relative size-24 shrink-0 overflow-hidden rounded-2xl border border-border bg-slate-50"
            key={`${item.url}-${index}`}
          >
            {item.type === 'video' ? (
              <video className="size-full object-cover" muted src={item.url} />
            ) : (
              <img alt={`Media ${index + 1}`} className="size-full object-cover" src={item.url} />
            )}
            {item.type === 'video' ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20">
                <Film className="size-5 text-white drop-shadow" />
              </div>
            ) : null}
            <button
              aria-label="Remove media"
              className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
              onClick={() => removeAt(index)}
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        ))}
        <button
          className="flex size-24 shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-border bg-slate-50 text-muted-foreground transition hover:border-primary hover:text-primary disabled:opacity-60"
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
          type="button"
        >
          {isUploading ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <>
              <ImagePlus className="size-5" />
              <span className="text-[11px] font-medium">Add media</span>
            </>
          )}
        </button>
      </div>
      <input
        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml,video/mp4,video/webm,video/quicktime,video/ogg"
        className="hidden"
        multiple
        onChange={(event) => void handleFiles(event.target.files)}
        ref={inputRef}
        type="file"
      />
    </div>
  );
}
