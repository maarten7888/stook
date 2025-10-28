"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface Photo {
  id: string;
  url: string;
  path?: string;
  type?: "prep" | "final" | "session";
}

interface PhotoCarouselProps {
  photos: Photo[];
  className?: string;
}

export function PhotoCarousel({ photos, className }: PhotoCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);

  if (!photos || photos.length === 0) {
    return null;
  }

  const currentPhoto = photos[currentIndex];

  const nextPhoto = () => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  return (
    <Card className={`bg-coals border-ash ${className}`}>
      <div className="relative">
        {/* Main photo display */}
        <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-charcoal">
          <Image
            src={currentPhoto.url}
            alt={`Foto ${currentIndex + 1} van ${photos.length}`}
            fill
            className="object-contain cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => setShowLightbox(true)}
            priority
          />

          {/* Navigation buttons */}
          {photos.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={prevPhoto}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={nextPhoto}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </>
          )}

          {/* Photo counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-3 py-1.5 rounded-full text-sm">
            {currentIndex + 1} / {photos.length}
          </div>
        </div>

        {/* Thumbnails */}
        {photos.length > 1 && (
          <div className="grid grid-cols-4 gap-2 mt-4">
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                className={`relative aspect-square rounded-md overflow-hidden cursor-pointer transition-all ${
                  index === currentIndex ? 'ring-2 ring-ember' : 'opacity-60 hover:opacity-100'
                }`}
                onClick={() => setCurrentIndex(index)}
              >
                <Image
                  src={photo.url}
                  alt={`Thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="25vw"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox dialog */}
      <Dialog open={showLightbox} onOpenChange={setShowLightbox}>
        <DialogContent className="max-w-6xl max-h-[90vh] p-0 bg-transparent border-none">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowLightbox(false)}
              className="absolute top-4 right-4 z-10 bg-black/70 hover:bg-black/90 text-white"
            >
              <X className="h-5 w-5" />
            </Button>

            <div className="relative aspect-auto">
              <Image
                src={currentPhoto.url}
                alt="Foto detail"
                width={1200}
                height={800}
                className="w-full h-auto max-h-[90vh] object-contain"
              />
            </div>

            {/* Lightbox navigation */}
            {photos.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    prevPhoto();
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white"
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    nextPhoto();
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white"
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}

            {/* Lightbox counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-full text-base font-medium">
              {currentIndex + 1} / {photos.length}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

