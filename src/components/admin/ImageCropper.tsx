'use client';

import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import type { Area, Point } from 'react-easy-crop';
import { Crop, ZoomIn, ZoomOut } from 'lucide-react';

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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

import {
  getCroppedImg,
  ASPECT_RATIOS,
  IMAGE_TYPE_RATIOS,
  type AspectRatioKey,
  type ImageType,
} from '@/lib/utils/image-crop';

interface ImageCropperProps {
  /** The image source (base64 or URL) to crop */
  image: string;
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog is closed */
  onOpenChange: (open: boolean) => void;
  /** The image type being uploaded (determines allowed aspect ratios) */
  imageType: ImageType;
  /** Callback when crop is complete */
  onCropComplete: (blob: Blob) => void;
  /** Optional: original filename for output naming */
  fileName?: string;
}

export function ImageCropper({
  image,
  open,
  onOpenChange,
  imageType,
  onCropComplete,
}: ImageCropperProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Determine initial aspect ratio based on image type (used as default)
  const defaultRatio = IMAGE_TYPE_RATIOS[imageType];
  const [selectedRatio, setSelectedRatio] = useState<AspectRatioKey>(
    defaultRatio || '4:3'
  );

  const onCropAreaChange = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleApplyCrop = useCallback(async () => {
    if (!croppedAreaPixels) return;

    setIsProcessing(true);
    try {
      const croppedBlob = await getCroppedImg(image, croppedAreaPixels);
      onCropComplete(croppedBlob);
      onOpenChange(false);
    } catch (error) {
      console.error('Error cropping image:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [croppedAreaPixels, image, onCropComplete, onOpenChange]);

  const handleCancel = useCallback(() => {
    onOpenChange(false);
    // Reset state for next use
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  }, [onOpenChange]);

  // Reset state when dialog opens
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (newOpen) {
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setSelectedRatio(defaultRatio || '4:3');
      }
      onOpenChange(newOpen);
    },
    [onOpenChange, defaultRatio]
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crop className="h-5 w-5" />
            Crop Image
          </DialogTitle>
          <DialogDescription>
            Adjust the crop area and select an aspect ratio.
            {defaultRatio && ` Default for ${imageType}: ${defaultRatio}`}
          </DialogDescription>
        </DialogHeader>

        {/* Crop Area */}
        <div className="relative h-80 w-full overflow-hidden rounded-lg bg-muted">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={ASPECT_RATIOS[selectedRatio]}
            onCropChange={setCrop}
            onCropComplete={onCropAreaChange}
            onZoomChange={setZoom}
            showGrid
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

          {/* Aspect Ratio Selector */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Aspect Ratio</Label>
            <RadioGroup
              value={selectedRatio}
              onValueChange={(value) =>
                setSelectedRatio(value as AspectRatioKey)
              }
              className="flex gap-4"
            >
              {(Object.keys(ASPECT_RATIOS) as AspectRatioKey[]).map(
                (ratio) => (
                  <div key={ratio} className="flex items-center space-x-2">
                    <RadioGroupItem value={ratio} id={`ratio-${ratio}`} />
                    <Label
                      htmlFor={`ratio-${ratio}`}
                      className="cursor-pointer text-sm"
                    >
                      {ratio}
                      {ratio === defaultRatio && (
                        <span className="ml-1 text-xs text-muted-foreground">(default)</span>
                      )}
                    </Label>
                  </div>
                )
              )}
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isProcessing}>
            Cancel
          </Button>
          <Button onClick={handleApplyCrop} disabled={isProcessing}>
            {isProcessing ? 'Processing...' : 'Apply Crop'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
