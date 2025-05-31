import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileText, Upload, X } from 'lucide-react';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  selectedFile: File | null;
  onRemoveFile: () => void;
  isProcessing: boolean;
}

export function FileUpload({ onFileUpload, selectedFile, onRemoveFile, isProcessing }: FileUploadProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      onFileUpload(file);
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxFiles: 1,
    disabled: isProcessing
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
        ${isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400'}
        ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <input {...getInputProps()} />
      
      {selectedFile ? (
        <div className="flex items-center justify-center gap-3">
          <FileText className="h-6 w-6 text-indigo-600" />
          <span className="font-medium">{selectedFile.name}</span>
          {!isProcessing && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemoveFile();
              }}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <Upload className="h-12 w-12 text-gray-400 mx-auto" />
          <div>
            <p className="text-lg font-medium text-gray-700">
              Drop your lesson plan here
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Supports PDF, DOCX, and TXT files
            </p>
          </div>
        </div>
      )}
    </div>
  );
}