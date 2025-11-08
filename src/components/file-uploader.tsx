'use client';

import { useUploadThing } from '@/lib/uploadthing';
import { UploadCloud, File as FileIcon, X, Image as ImageIcon } from 'lucide-react';
import { useDropzone } from '@uploadthing/react';
import { useState, useCallback } from 'react';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { OurFileRouter } from '@/app/api/uploadthing/core';

interface FileUploaderProps {
  endpoint: keyof OurFileRouter;
  onUploadComplete: (url: string) => void;
  onUploadError: (error: Error) => void;
}

export function FileUploader({ endpoint, onUploadComplete, onUploadError }: FileUploaderProps) {
  const { user } = useAuth();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);

  const { startUpload, isUploading } = useUploadThing(endpoint, {
    headers: async () => {
      if (!user) throw new Error('Not authenticated');
      const token = await user.getIdToken();
      return { Authorization: `Bearer ${token}` };
    },
    onClientUploadComplete: (res) => {
      if (!res?.[0]) {
        onUploadError(new Error("Upload failed or invalid response"));
        return;
      };
      setFileName(res[0].name);
      onUploadComplete(res[0].url);
      setUploadProgress(0);
    },
    onUploadError,
    onUploadProgress: setUploadProgress,
  });

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!user) {
        onUploadError(new Error('You must be logged in to upload files.'));
        return;
      }
      if (acceptedFiles.length > 0) {
        setFileName(acceptedFiles[0].name);
        try {
          await startUpload(acceptedFiles);
        } catch (err) {
          onUploadError(err as Error);
        }
      }
    },
    [startUpload, user, onUploadError]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: false });

  const isImageUploader = endpoint === 'imageUploader';
  const Icon = isImageUploader ? ImageIcon : FileIcon;
  const description = isImageUploader ? 'PNG, JPG, GIF up to 4MB' : 'PDF, DOC, DOCX up to 16MB.';

  if (isUploading) {
    return (
      <div className="p-4 rounded-lg border border-dashed flex flex-col items-center justify-center text-center">
        <p className="text-sm font-medium mb-2">{fileName || 'Uploading...'}</p>
        <Progress value={uploadProgress} className="w-full h-2" />
        <p className="text-xs text-muted-foreground mt-2">{uploadProgress}%</p>
      </div>
    );
  }

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
          onClick={() => {
            setFileName(null);
            onUploadComplete('');
          }}
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
