"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, X, Camera } from "lucide-react";

interface PhotoUploaderProps {
  recipeId: string | null;
  onPhotosChange: (photos: Photo[]) => void;
  existingPhotos?: Photo[];
  photoType?: "prep" | "final" | "session";
}

interface Photo {
  id: string;
  url: string;
  file?: File;
  path?: string;
  type: "prep" | "final" | "session";
}

export function PhotoUploader({ recipeId, onPhotosChange, existingPhotos = [], photoType = "prep" }: PhotoUploaderProps) {
  const [photos, setPhotos] = useState<Photo[]>(existingPhotos);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (!recipeId) {
      alert("Recept moet eerst opgeslagen worden voordat je foto's kunt uploaden");
      return;
    }

    setUploading(true);

    try {
      const newPhotos: Photo[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file
        if (!file.type.startsWith('image/')) {
          alert(`${file.name} is geen geldig beeldbestand`);
          continue;
        }

        const maxSize = 8 * 1024 * 1024; // 8MB
        if (file.size > maxSize) {
          alert(`${file.name} is te groot (max 8MB)`);
          continue;
        }

        // Read file and create preview URL
        const url = URL.createObjectURL(file);
        
        // Upload to server
        const formData = new FormData();
        formData.append('file', file);
        formData.append('recipeId', recipeId);
        formData.append('type', photoType);

        const response = await fetch('/api/photos', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Upload failed:', errorData);
          URL.revokeObjectURL(url);
          throw new Error(`Upload mislukt: ${errorData.error || response.statusText}`);
        }

        const photoData = await response.json();
        
        // Store signed URL
        newPhotos.push({
          id: photoData.id,
          url: photoData.signedUrl || url,
          path: photoData.path,
          type: photoType,
        });

        // Clean up object URL if we got a signed URL
        if (photoData.signedUrl) {
          URL.revokeObjectURL(url);
        }
      }

      const updatedPhotos = [...photos, ...newPhotos];
      setPhotos(updatedPhotos);
      onPhotosChange(updatedPhotos);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Fout bij uploaden van foto(s)');
    } finally {
      setUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCameraInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = async (photoId: string) => {
    // Optimistically update UI
    const updatedPhotos = photos.filter(p => p.id !== photoId);
    setPhotos(updatedPhotos);
    onPhotosChange(updatedPhotos);

    // Delete from server
    try {
      const res = await fetch(`/api/photos/${photoId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        // Revert on error
        setPhotos(photos);
        onPhotosChange(photos);
        const errorData = await res.json().catch(() => ({}));
        alert(`Fout bij verwijderen: ${errorData.error || 'Onbekende fout'}`);
      }
    } catch (error) {
      // Revert on error
      setPhotos(photos);
      onPhotosChange(photos);
      console.error('Error deleting photo:', error);
      alert('Fout bij verwijderen van foto');
    }
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <Card className="bg-coals border-ash">
      <div className="p-6 space-y-4">
        <h3 className="text-xl text-ash font-heading">Foto&apos;s</h3>
        
        {photos.length === 0 ? (
          <div className="text-center py-8 text-smoke">
            <p>Nog geen foto&apos;s</p>
            <p className="text-sm mt-2">Upload foto&apos;s of maak een foto met je camera</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {photos.map((photo) => (
              <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden bg-charcoal group">
                <img
                  src={photo.url}
                  alt="Upload preview"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => handleRemovePhoto(photo.id)}
                  className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          {/* Regular file upload */}
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || !recipeId}
            className="border-ember text-ember hover:bg-ember hover:text-white"
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? "Uploaden..." : "Upload Foto's"}
          </Button>

          {/* Camera capture (mobile) */}
          {isMobile && (
            <Button
              type="button"
              variant="outline"
              onClick={() => cameraInputRef.current?.click()}
              disabled={uploading || !recipeId}
              className="border-ember text-ember hover:bg-ember hover:text-white"
            >
              <Camera className="h-4 w-4 mr-2" />
              Camera
            </Button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleFileInputChange}
            className="hidden"
          />
          
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            capture="environment"
            onChange={handleCameraInputChange}
            className="hidden"
          />
        </div>
      </div>
    </Card>
  );
}

