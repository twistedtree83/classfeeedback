import React, { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { supabase } from "@/lib/supabaseClient";
import { v4 as uuidv4 } from "uuid";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { X, Upload, File, Link, Image as ImageIcon } from "lucide-react";
import { CardAttachment } from "@/lib/types";

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAttachmentAdded: (attachment: CardAttachment) => void;
}

export function FileUploadModal({
  isOpen,
  onClose,
  onAttachmentAdded,
}: FileUploadModalProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadType, setUploadType] = useState<"file" | "image" | "link">(
    "file"
  );
  const [linkUrl, setLinkUrl] = useState("");
  const [linkName, setLinkName] = useState("");

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      setIsUploading(true);
      setError(null);

      try {
        // Generate a unique file name to prevent collisions
        const fileExt = file.name.split(".").pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = `${fileName}`;

        // Upload to Supabase storage
        const { data, error } = await supabase.storage
          .from("lesson_attachments")
          .upload(filePath, file);

        if (error) {
          throw error;
        }

        // Get the public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from("lesson_attachments").getPublicUrl(filePath);

        // Create attachment object
        const attachment: CardAttachment = {
          id: uuidv4(),
          type: file.type.startsWith("image/") ? "image" : "file",
          name: file.name,
          url: publicUrl,
          fileType: file.type,
          size: file.size,
          previewUrl: file.type.startsWith("image/") ? publicUrl : undefined,
        };

        // Pass attachment back to parent component
        onAttachmentAdded(attachment);
        onClose();
      } catch (err) {
        console.error("Error uploading file:", err);
        setError("Failed to upload file. Please try again.");
      } finally {
        setIsUploading(false);
      }
    },
    [onAttachmentAdded, onClose]
  );

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } =
    useDropzone({
      onDrop,
      accept:
        uploadType === "image"
          ? { "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"] }
          : {
              "application/pdf": [".pdf"],
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
                [".docx"],
              "application/msword": [".doc"],
              "text/plain": [".txt"],
            },
      maxFiles: 1,
      disabled: isUploading,
    });

  const handleAddLink = (e: React.FormEvent) => {
    e.preventDefault();

    if (!linkUrl.trim()) {
      setError("Please enter a URL");
      return;
    }

    try {
      // Basic URL validation
      let processedUrl = linkUrl.trim();
      if (
        !processedUrl.startsWith("http://") &&
        !processedUrl.startsWith("https://")
      ) {
        processedUrl = "https://" + processedUrl;
      }

      // Create link attachment
      const attachment: CardAttachment = {
        id: uuidv4(),
        type: "link",
        name: linkName.trim() || new URL(processedUrl).hostname,
        url: processedUrl,
      };

      onAttachmentAdded(attachment);
      onClose();
    } catch (err) {
      console.error("Error adding link:", err);
      setError("Please enter a valid URL");
    }
  };

  // Clean up when modal closes
  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setLinkUrl("");
      setLinkName("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
          disabled={isUploading}
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-xl font-bold text-teal mb-4">Add Attachment</h2>

        <div className="mb-5 grid grid-cols-3 gap-2">
          <Button
            type="button"
            variant={uploadType === "file" ? "default" : "outline"}
            className={
              uploadType === "file"
                ? "bg-teal text-white"
                : "border-teal text-teal hover:bg-teal/10"
            }
            onClick={() => setUploadType("file")}
            disabled={isUploading}
          >
            <File className="h-4 w-4 mr-2" />
            File
          </Button>
          <Button
            type="button"
            variant={uploadType === "image" ? "default" : "outline"}
            className={
              uploadType === "image"
                ? "bg-teal text-white"
                : "border-teal text-teal hover:bg-teal/10"
            }
            onClick={() => setUploadType("image")}
            disabled={isUploading}
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            Image
          </Button>
          <Button
            type="button"
            variant={uploadType === "link" ? "default" : "outline"}
            className={
              uploadType === "link"
                ? "bg-teal text-white"
                : "border-teal text-teal hover:bg-teal/10"
            }
            onClick={() => setUploadType("link")}
            disabled={isUploading}
          >
            <Link className="h-4 w-4 mr-2" />
            Link
          </Button>
        </div>

        {uploadType === "link" ? (
          <form onSubmit={handleAddLink} className="space-y-4">
            <div>
              <Input
                label="Link URL"
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                required
              />
            </div>
            <div>
              <Input
                label="Display Name (optional)"
                placeholder="Resource name"
                value={linkName}
                onChange={(e) => setLinkName(e.target.value)}
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2 mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-teal hover:bg-teal/90 text-white"
                disabled={isUploading || !linkUrl.trim()}
              >
                Add Link
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                ${
                  isDragActive
                    ? "border-teal bg-teal/10"
                    : "border-gray-300 hover:border-teal/60"
                }
                ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <input {...getInputProps()} />

              {acceptedFiles?.[0] ? (
                <div className="flex items-center justify-center gap-3">
                  {uploadType === "image" ? (
                    <ImageIcon className="h-6 w-6 text-teal" />
                  ) : (
                    <File className="h-6 w-6 text-teal" />
                  )}
                  <span className="font-medium">{acceptedFiles[0].name}</span>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                  <div>
                    <p className="text-lg font-medium text-gray-700">
                      Drop your {uploadType === "image" ? "image" : "file"} here
                    </p>
                    <div className="text-sm text-gray-500 mt-1">
                      {uploadType === "image" ? (
                        <p>Supports PNG, JPG, GIF images</p>
                      ) : (
                        <p>Supports PDF, DOCX, and TXT files</p>
                      )}
                      <p>Maximum size: 10MB</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="bg-teal hover:bg-teal/90 text-white"
                disabled={isUploading || !acceptedFiles?.[0]}
                onClick={async () => {
                  if (acceptedFiles?.[0]) {
                    await onDrop([acceptedFiles[0]]);
                  }
                }}
              >
                {isUploading
                  ? "Uploading..."
                  : `Upload ${uploadType === "image" ? "Image" : "File"}`}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
