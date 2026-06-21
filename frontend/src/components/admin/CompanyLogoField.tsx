import * as React from 'react';
import { Label } from '../ui/Base';
import { cn } from '../../lib/utils';
import { resolveAssetUrl } from '../../lib/resolveAssetUrl';
import { ImagePlus, X } from 'lucide-react';

interface CompanyLogoFieldProps {
  companyName: string;
  existingLogoUrl?: string | null;
  file: File | null;
  previewUrl: string | null;
  onFileChange: (file: File | null, previewUrl: string | null) => void;
  removeExisting?: boolean;
  onRemoveExistingChange?: (remove: boolean) => void;
}

export function CompanyLogoField({
  companyName,
  existingLogoUrl,
  file,
  previewUrl,
  onFileChange,
  removeExisting = false,
  onRemoveExistingChange,
}: CompanyLogoFieldProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const displaySrc =
    previewUrl ||
    (!removeExisting && existingLogoUrl ? resolveAssetUrl(existingLogoUrl) : undefined);

  const initials = companyName.trim().substring(0, 2).toUpperCase() || 'CO';

  const handlePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (!picked) return;
    if (!picked.type.startsWith('image/')) return;
    onRemoveExistingChange?.(false);
    onFileChange(picked, URL.createObjectURL(picked));
    e.target.value = '';
  };

  const clearSelection = () => {
    onFileChange(null, null);
    if (existingLogoUrl) onRemoveExistingChange?.(true);
  };

  return (
    <div>
      <Label>Company logo</Label>
      <div className="mt-2 flex items-center gap-4">
        <div
          className={cn(
            'w-16 h-16 rounded-ns-md border border-ns-border bg-ns-gray-bg flex items-center justify-center overflow-hidden shrink-0',
            !displaySrc && 'text-ns-navy/40 font-bold text-sm uppercase',
          )}
        >
          {displaySrc ? (
            <img src={displaySrc} alt="Logo preview" className="h-full w-full object-contain p-1" />
          ) : (
            initials
          )}
        </div>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-2 text-xs font-semibold text-ns-blue hover:underline"
          >
            <ImagePlus size={14} />
            {displaySrc ? 'Change logo' : 'Upload logo'}
          </button>
          {(file || (existingLogoUrl && !removeExisting)) && (
            <button
              type="button"
              onClick={clearSelection}
              className="inline-flex items-center gap-1 text-xs text-ns-text-muted hover:text-status-rejected"
            >
              <X size={12} />
              Remove logo
            </button>
          )}
          <p className="text-[10px] text-ns-text-muted">PNG, JPG, WEBP or GIF · max 2MB</p>
        </div>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handlePick} />
      </div>
    </div>
  );
}
