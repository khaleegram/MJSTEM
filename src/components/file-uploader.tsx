
'use client';

import { useUploadThing } from '@/lib/uploadthing';
import { UploadCloud, File as FileIcon, X, Image as ImageIcon } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useState, useCallback } from 'react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { OurFileRouter } from '@/app/api/uploadthing/core';
import { useAuth } from '@/contexts/auth-context';
import Image from 'next/image';

interface FileUploaderProps {
  endpoint: keyof OurFileRouter;
  onUploadComplete: (url: string, key: string) => void;
  onUploadError: (error: Error) => void;
  onFileSelect?: (file: File | null) => void;
  value?: string;
}

export function FileUploader({ endpoint, onUploadComplete, onUploadError, onFileSelect, value }: FileUploaderProps) {
  const { user } = useAuth();
  const [fileName, setFileName] = useState<string | null>(null);
  const [localValue, setLocalValue] = useState(value);

  const { startUpload } = useUploadThing(endpoint, {
    onClientUploadComplete: (res) => {
        if (res && res[0]) {
            onUploadComplete(res[0].url, res[0].key);
            setLocalValue(res[0].url);
        }
    },
    onUploadError: (error: Error) => {
        onUploadError(error);
    },
    headers: async () => {
        if (!user) return {};
        const token = await user.getIdToken();
        return { Authorization: `Bearer ${token}` };
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setFileName(file.name);
      if (onFileSelect) {
        onFileSelect(file);
      } else {
         startUpload([file]);
      }
    }
  }, [onFileSelect, startUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
  });

  const isImageUploader = endpoint === 'imageUploader';
  const Icon = isImageUploader ? ImageIcon : FileIcon;
  const description = isImageUploader ? 'PNG, JPG, GIF up to 4MB' : 'PDF, DOC, DOCX up to 16MB.';

  const handleRemove = () => {
    setFileName(null);
    if (onFileSelect) {
      onFileSelect(null);
    }
  };

  if (localValue && !fileName) {
      return (
          <div className="flex items-center gap-4">
              {isImageUploader ? (
                  <Image src={localValue} alt="Current file" width={64} height={64} className="rounded-md object-contain border p-1" />
              ) : (
                  <div className="p-4 rounded-lg border flex items-center gap-3">
                      <FileIcon className="h-6 w-6 text-primary" />
                      <p className="text-sm font-medium truncate max-w-[200px]">{localValue.split('/').pop()}</p>
                  </div>
              )}
              <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                      setLocalValue('');
                      onUploadComplete('', ''); 
                  }}
              >
                  Change
              </Button>
          </div>
      )
  }

  if (fileName) {
    return (
      <div className="p-4 rounded-lg border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Icon className="h-6 w-6 text-primary" />
          <p className="text-sm font-medium">{fileName}</p>
        </div>
        <Button
          type="button"
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
