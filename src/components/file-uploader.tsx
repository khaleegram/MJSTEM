
'use client';

import { useUploadThing } from '@/lib/uploadthing';
import { UploadCloud, File as FileIcon, X, Image as ImageIcon } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useState, useCallback } from 'react';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { cn } from '@/lib/utils';
import { OurFileRouter } from '@/app/api/uploadthing/core';
import { useAuth } from '@/contexts/auth-context';


interface FileUploaderProps {
  endpoint: keyof OurFileRouter;
  onUploadComplete: (url: string, key: string) => void;
  onUploadError: (error: Error) => void;
  onUploadBegin?: () => void;
  onFileSelect?: (file: File | null) => void;
}

export function FileUploader({ endpoint, onUploadComplete, onUploadError, onFileSelect, onUploadBegin }: FileUploaderProps) {
  const { user } = useAuth();
  const [fileName, setFileName] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFileName(acceptedFiles[0].name);
      if (onFileSelect) {
        onFileSelect(acceptedFiles[0]);
      } else {
        // Kept for immediate upload behavior if needed
        if (!user) {
          onUploadError(new Error('You must be logged in to upload files.'));
          return;
        }
      }
    }
  }, [user, onUploadError, onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
  });

  const isImageUploader = endpoint === 'imageUploader';
  const Icon = isImageUploader ? ImageIcon : FileIcon;
  const description = isImageUploader ? 'PNG, JPG, GIF up to 4MB' : 'PDF, DOC, DOCX up to 16MB.';

  const handleRemove = () => {
    setFileName(null);
    if(onFileSelect) {
      onFileSelect(null);
    }
    // Note: Deletion logic for already uploaded files should be handled separately
    // by calling a server action with the file key if it exists.
  };

  if (fileName) {
    return (
      <div className="p-4 rounded-lg border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Icon className="h-6 w-6 text-primary" />
          <p className="text-sm font-medium">{fileName}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRemove}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        'group relative cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors hover:border-primary/50',
        isDragActive && 'border-primary bg-primary/10'
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-2 text-muted-foreground">
        <UploadCloud className={cn('h-10 w-10', isDragActive && 'text-primary')} />
        <p className="font-medium">{isDragActive ? 'Drop the file here...' : 'Drag & drop file or click to select'}</p>
        <p className="text-xs">{description}</p>
      </div>
    </div>
  );
}

    