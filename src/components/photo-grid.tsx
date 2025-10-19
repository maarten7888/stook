"use client";

import Image from "next/image";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface Photo {
  id: string;
  path: string;
  type: "prep" | "final" | "session";
  createdAt: string;
}

interface PhotoGridProps {
  photos: Photo[];
  maxVisible?: number;
  columns?: 2 | 3 | 4;
  className?: string;
  onPhotoClick?: (photo: Photo) => void;
}

export function PhotoGrid({
  photos,
  maxVisible = 6,
  columns = 3,
  className,
  onPhotoClick,
}: PhotoGridProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  if (photos.length === 0) {
    return (
      <div className={cn("text-center py-8 text-smoke", className)}>
            <p>Nog geen foto&apos;s toegevoegd</p>
      </div>
    );
  }

  const visiblePhotos = photos.slice(0, maxVisible);
  const remainingCount = photos.length - maxVisible;

  const gridClasses = {
    2: "grid-cols-2",
    3: "grid-cols-2 sm:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
  };

  const handlePhotoClick = (photo: Photo) => {
    setSelectedPhoto(photo);
    onPhotoClick?.(photo);
  };

  return (
    <>
      <div className={cn("grid gap-2", gridClasses[columns], className)}>
        {visiblePhotos.map((photo, index) => (
          <div
            key={photo.id}
            className={cn(
              "relative aspect-square overflow-hidden rounded-lg bg-coals cursor-pointer group",
              "hover:ring-2 hover:ring-ember hover:ring-offset-2 hover:ring-offset-charcoal transition-all"
            )}
            onClick={() => handlePhotoClick(photo)}
          >
            <Image
              src={photo.path}
              alt={`Foto ${index + 1}`}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-200"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
            
            {/* Photo type badge */}
            <div className="absolute top-2 left-2">
              <span className={cn(
                "text-xs px-1.5 py-0.5 rounded text-white font-medium",
                photo.type === "prep" && "bg-blue-600",
                photo.type === "final" && "bg-green-600", 
                photo.type === "session" && "bg-ember"
              )}>
                {photo.type === "prep" && "Prep"}
                {photo.type === "final" && "Eindresultaat"}
                {photo.type === "session" && "Sessie"}
              </span>
            </div>

            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
          </div>
        ))}

        {/* Show remaining count */}
        {remainingCount > 0 && (
          <div className="aspect-square bg-coals rounded-lg flex items-center justify-center text-smoke hover:bg-ash transition-colors cursor-pointer">
            <span className="text-sm font-medium">
              +{remainingCount} meer
            </span>
          </div>
        )}
      </div>

      {/* Photo modal */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          {selectedPhoto && (
            <div className="relative">
              <Image
                src={selectedPhoto.path}
                alt="Foto detail"
                width={800}
                height={600}
                className="w-full h-auto max-h-[80vh] object-contain"
              />
              
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <div className="text-white">
                  <p className="text-sm text-gray-300">
                    {new Date(selectedPhoto.createdAt).toLocaleDateString("nl-NL", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// Compact version for recipe cards
export function PhotoThumbnail({
  photos,
  className,
}: {
  photos: Photo[];
  className?: string;
}) {
  if (photos.length === 0) {
    return null;
  }

  const mainPhoto = photos.find(p => p.type === "final") || photos[0];

  return (
    <div className={cn("relative aspect-video overflow-hidden rounded-lg bg-coals", className)}>
      <Image
        src={mainPhoto.path}
        alt="Recept foto"
        fill
        className="object-cover"
        sizes="(max-width: 640px) 100vw, 50vw"
      />
      
              {photos.length > 1 && (
                <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                  {photos.length} foto&apos;s
                </div>
              )}
    </div>
  );
}
