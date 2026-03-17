"use client";

import { db } from "@/lib/db";
import { useState, useCallback } from "react";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";

interface ImageUploaderProps {
  productId: string;
  existingImages: { id: string; url: string; alt?: string }[];
}

export function ImageUploader({ productId, existingImages }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      setUploading(true);
      const uploadPromises = Array.from(files).map(async (file) => {
        try {
          // Upload to Instant Storage
          const result = await db.storage.uploadFile(file.name, file);
          return result.data.url;
        } catch (error) {
          console.error("Upload failed:", error);
          return null;
        }
      });

      const urls = await Promise.all(uploadPromises);
      const validUrls = urls.filter((url): url is string => url !== null);

      // Create product image records
      if (validUrls.length > 0) {
        const txs = validUrls.map((url, idx) =>
          db.tx.productImages[db.id()].create({
            url,
            alt: undefined,
            sortOrder: existingImages.length + idx,
            createdAt: Date.now(),
          }).link({
            product: productId,
          })
        );

        await db.transact(txs);
      }

      setUploading(false);
    },
    [productId, existingImages.length]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      handleUpload(e.dataTransfer.files);
    },
    [handleUpload]
  );

  const handleDelete = useCallback(
    async (imageId: string) => {
      await db.transact([db.tx.productImages[imageId].delete()]);
    },
    []
  );

  const handleReorder = useCallback(
    async (imageId: string, newOrder: number) => {
      await db.transact([
        db.tx.productImages[imageId].update({ sortOrder: newOrder }),
      ]);
    },
    []
  );

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-900">صور المنتج</h3>

      {/* Existing Images */}
      {existingImages.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {existingImages
            .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
            .map((image, idx) => (
              <div key={image.id} className="relative group">
                <img
                  src={image.url}
                  alt={image.alt || "Product image"}
                  className="w-full h-24 object-cover rounded-lg border"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                  <button
                    onClick={() => handleDelete(image.id)}
                    className="p-1 bg-red-500 text-white rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <span className="absolute top-1 right-1 bg-amber-500 text-white text-xs px-2 py-0.5 rounded">
                  {idx + 1}
                </span>
              </div>
            ))}
        </div>
      )}

      {/* Upload Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${dragActive ? "border-amber-500 bg-amber-50" : "border-gray-300 hover:border-amber-400"}
        `}
      >
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handleUpload(e.target.files)}
          className="hidden"
          id={`image-upload-${productId}`}
        />
        <label
          htmlFor={`image-upload-${productId}`}
          className="cursor-pointer flex flex-col items-center gap-2"
        >
          {uploading ? (
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          ) : (
            <>
              <Upload className="w-8 h-8 text-gray-400" />
              <span className="text-sm text-gray-600">
                اسحب الصور هنا أو انقر للاختيار
              </span>
              <span className="text-xs text-gray-400">
                PNG, JPG, GIF up to 5MB
              </span>
            </>
          )}
        </label>
      </div>
    </div>
  );
}
