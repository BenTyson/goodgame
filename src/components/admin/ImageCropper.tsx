'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Cropper from 'react-easy-crop';
import type { Area, Point } from 'react-easy-crop';
import { Crop, ZoomIn, ZoomOut, Link2, Copyright, FileCheck, Image, RectangleHorizontal, Images } from 'lucide-react';
import { cn } from '@/lib/utils';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

import {
  getCroppedImg,
  ASPECT_RATIOS,
  IMAGE_TYPE_RATIOS,
  type ImageType,
} from '@/lib/utils/image-crop';

export type ImageSource = 'publisher' | 'wikimedia' | 'bgg' | 'user_upload' | 'press_kit' | 'promotional';

export interface ImageAttribution {
  source?: ImageSource;
  source_url?: string;
  attribution?: string;
  license?: string;
}

interface ImageCropperProps {
  /** The image source (base64 or URL) to crop */
  image: string;
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog is closed */
  onOpenChange: (open: boolean) => void;
  /** Initial image type (for re-cropping existing images) */
  initialImageType?: ImageType;
  /** Callback when crop is complete */
  onCropComplete: (blob: Blob, attribution: ImageAttribution, imageType: ImageType) => void;
  /** Optional: original filename for output naming */
  fileName?: string;
}

const SOURCE_OPTIONS: { value: ImageSource; label: string; defaultAttribution?: string }[] = [
  { value: 'publisher', label: 'Publisher Website', defaultAttribution: '© Publisher Name' },
  { value: 'press_kit', label: 'Press Kit / Media Kit', defaultAttribution: 'Used with permission' },
  { value: 'promotional', label: 'Promotional Material', defaultAttribution: '© Publisher Name' },
  { value: 'wikimedia', label: 'Wikimedia Commons', defaultAttribution: 'CC BY-SA 4.0' },
  { value: 'user_upload', label: 'Personal Photo', defaultAttribution: 'User uploaded' },
  { value: 'bgg', label: 'BoardGameGeek (dev only)', defaultAttribution: '© BoardGameGeek' },
];

const LICENSE_OPTIONS = [
  { value: 'fair_use', label: 'Fair Use (editorial)' },
  { value: 'with_permission', label: 'Used with Permission' },
  { value: 'cc_by_sa_4', label: 'CC BY-SA 4.0' },
  { value: 'cc_by_4', label: 'CC BY 4.0' },
  { value: 'cc0', label: 'CC0 (Public Domain)' },
  { value: 'proprietary', label: 'Proprietary' },
];

export function ImageCropper({
  image,
  open,
  onOpenChange,
  initialImageType,
  onCropComplete,
}: ImageCropperProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAttribution, setShowAttribution] = useState(false);

  // Image type selection - null means "original" (no crop constraint)
  const [selectedImageType, setSelectedImageType] = useState<ImageType | null>(initialImageType || null);

  // Original image aspect ratio (calculated when media loads)
  const [originalAspect, setOriginalAspect] = useState<number | undefined>(undefined);

  // Attribution fields
  const [source, setSource] = useState<ImageSource | ''>('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [attribution, setAttribution] = useState('');
  const [license, setLicense] = useState('');

  // Determine aspect ratio: use type-specific ratio if selected, otherwise original
  const getAspectRatio = (): number | undefined => {
    if (!selectedImageType) return originalAspect; // Original ratio
    const typeRatio = IMAGE_TYPE_RATIOS[selectedImageType];
    if (typeRatio === null) return originalAspect; // Gallery = original
    return ASPECT_RATIOS[typeRatio];
  };

  // Track media loaded state
  const [mediaLoaded, setMediaLoaded] = useState(false);

  // Key to force Cropper remount when aspect changes
  const [cropperKey, setCropperKey] = useState(0);

  // Ref to track if we've done initial aspect setup (prevents infinite remount loop)
  const initialAspectSet = useRef(false);

  // Reset state when dialog opens (useEffect because onOpenChange doesn't fire on prop changes)
  useEffect(() => {
    if (open) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setMediaLoaded(false);
      setOriginalAspect(undefined);
      setSelectedImageType(initialImageType || null);
      setSource('');
      setSourceUrl('');
      setAttribution('');
      setLicense('');
      setShowAttribution(false);
      initialAspectSet.current = false; // Reset for new image
      // Increment key to force Cropper remount with fresh state
      setCropperKey(k => k + 1);
    }
  }, [open, initialImageType]);

  // Update aspect ratio when image type changes
  const handleImageTypeChange = (type: ImageType | null) => {
    setSelectedImageType(type);
    // Reset crop position when changing type
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    // Force remount to recalculate crop area
    setCropperKey(k => k + 1);
  };

  // Calculate original aspect ratio when media loads
  const handleMediaLoaded = useCallback((mediaSize: { naturalWidth: number; naturalHeight: number }) => {
    const aspect = mediaSize.naturalWidth / mediaSize.naturalHeight;
    setOriginalAspect(aspect);
    setMediaLoaded(true);

    // Force one remount after initial aspect is set (but not on subsequent loads)
    if (!initialAspectSet.current) {
      initialAspectSet.current = true;
      // Use setTimeout to ensure state is updated before remount
      setTimeout(() => setCropperKey(k => k + 1), 0);
    }
  }, []);

  const onCropAreaChange = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleSourceChange = (value: ImageSource) => {
    setSource(value);
    const option = SOURCE_OPTIONS.find(o => o.value === value);
    if (option?.defaultAttribution && !attribution) {
      setAttribution(option.defaultAttribution);
    }
    // Auto-set license for known sources
    if (value === 'wikimedia' && !license) {
      setLicense('cc_by_sa_4');
    } else if ((value === 'publisher' || value === 'promotional') && !license) {
      setLicense('fair_use');
    } else if (value === 'press_kit' && !license) {
      setLicense('with_permission');
    }
  };

  const handleApplyCrop = useCallback(async () => {
    setIsProcessing(true);
    try {
      const attributionData: ImageAttribution = {};
      if (source) attributionData.source = source;
      if (sourceUrl) attributionData.source_url = sourceUrl;
      if (attribution) attributionData.attribution = attribution;
      if (license) attributionData.license = license;

      let outputBlob: Blob;

      // If Original is selected and zoom is 1 (no changes), skip cropping entirely
      const isOriginalUnchanged = !selectedImageType && zoom === 1;

      if (isOriginalUnchanged) {
        // Convert base64/URL image to blob without cropping
        const response = await fetch(image);
        outputBlob = await response.blob();
      } else {
        // Apply crop
        if (!croppedAreaPixels) {
          setIsProcessing(false);
          return;
        }
        outputBlob = await getCroppedImg(image, croppedAreaPixels);
      }

      // Default to 'gallery' if no type selected (original ratio)
      const imageType: ImageType = selectedImageType || 'gallery';
      onCropComplete(outputBlob, attributionData, imageType);
      onOpenChange(false);
    } catch (error) {
      console.error('Error cropping image:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [croppedAreaPixels, image, onCropComplete, onOpenChange, source, sourceUrl, attribution, license, selectedImageType, zoom]);

  const handleCancel = useCallback(() => {
    onOpenChange(false);
    // Reset state for next use
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  }, [onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crop className="h-5 w-5" />
            Crop Image
          </DialogTitle>
          <DialogDescription>
            Adjust the crop area and add source attribution.
          </DialogDescription>
        </DialogHeader>

        {/* Crop Area */}
        <div className="relative h-72 w-full overflow-hidden rounded-lg bg-muted">
          <Cropper
            key={`${cropperKey}-${selectedImageType || 'original'}`}
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={getAspectRatio()}
            onCropChange={setCrop}
            onCropComplete={onCropAreaChange}
            onZoomChange={setZoom}
            onMediaLoaded={handleMediaLoaded}
            showGrid
            objectFit="contain"
            classes={{
              containerClassName: 'rounded-lg',
            }}
          />
        </div>

        {/* Controls */}
        <div className="space-y-4">
          {/* Zoom Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Zoom</Label>
              <span className="text-sm text-muted-foreground">
                {Math.round(zoom * 100)}%
              </span>
            </div>
            <div className="flex items-center gap-3">
              <ZoomOut className="h-4 w-4 text-muted-foreground" />
              <Slider
                value={[zoom]}
                onValueChange={([value]) => setZoom(value)}
                min={1}
                max={3}
                step={0.1}
                className="flex-1"
              />
              <ZoomIn className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          {/* Image Type Selector */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Crop Ratio (optional)</Label>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleImageTypeChange(null)}
                className={cn(
                  'flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-colors',
                  selectedImageType === null
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <Images className="h-4 w-4" />
                <span className="text-sm font-medium">Original</span>
                <span className="text-xs text-muted-foreground">As-is</span>
              </button>
              <button
                type="button"
                onClick={() => handleImageTypeChange('cover')}
                className={cn(
                  'flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-colors',
                  selectedImageType === 'cover'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <Image className="h-4 w-4" />
                <span className="text-sm font-medium">Cover</span>
                <span className="text-xs text-muted-foreground">4:3</span>
              </button>
              <button
                type="button"
                onClick={() => handleImageTypeChange('hero')}
                className={cn(
                  'flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-colors',
                  selectedImageType === 'hero'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <RectangleHorizontal className="h-4 w-4" />
                <span className="text-sm font-medium">Hero</span>
                <span className="text-xs text-muted-foreground">16:9</span>
              </button>
              <button
                type="button"
                onClick={() => handleImageTypeChange('gallery')}
                className={cn(
                  'flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-colors',
                  selectedImageType === 'gallery'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <Crop className="h-4 w-4" />
                <span className="text-sm font-medium">Custom</span>
                <span className="text-xs text-muted-foreground">Free</span>
              </button>
            </div>
          </div>

          {/* Attribution Section (Collapsible) */}
          <Collapsible open={showAttribution} onOpenChange={setShowAttribution}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between gap-2 text-muted-foreground hover:text-foreground">
                <span className="flex items-center gap-2">
                  <Copyright className="h-4 w-4" />
                  Source Attribution
                  {source && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{source}</span>}
                </span>
                <span className="text-xs">{showAttribution ? 'Hide' : 'Add'}</span>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              {/* Source Type */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <FileCheck className="h-4 w-4" />
                  Source Type
                </Label>
                <Select value={source} onValueChange={(v) => handleSourceChange(v as ImageSource)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Where is this image from?" />
                  </SelectTrigger>
                  <SelectContent>
                    {SOURCE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Source URL */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  Source URL
                </Label>
                <Input
                  placeholder="https://publisher.com/game-page"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Link to where you got this image</p>
              </div>

              {/* Attribution Text */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Copyright className="h-4 w-4" />
                  Attribution Text
                </Label>
                <Input
                  placeholder="© Capstone Games"
                  value={attribution}
                  onChange={(e) => setAttribution(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Copyright notice to display</p>
              </div>

              {/* License */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">License</Label>
                <Select value={license} onValueChange={setLicense}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select license type" />
                  </SelectTrigger>
                  <SelectContent>
                    {LICENSE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isProcessing}>
            Cancel
          </Button>
          <Button onClick={handleApplyCrop} disabled={isProcessing}>
            {isProcessing ? 'Processing...' : 'Upload Image'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
