
'use client';

import { useUploadThing } from '@/lib/uploadthing';
import { UploadCloud, File as FileIcon, X, Image as ImageIcon } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useState, useCallback } from 'react';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import type { OurFileRouter } from '@/lib/uploadthing-router';
import Image from 'next/image';

interface FileUploaderProps {
  endpoint: keyof OurFileRouter;
  onUploadComplete: (url: string, key?: string) => void;
  onUploadError: (error: Error) => void;
  onFileSelect?: (file: File | null) => void;
  value?: string;
}

export function FileUploader({ endpoint, onUploadComplete, onUploadError, onFileSelect, value }: FileUploaderProps) {
  const { user } = useAuth();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [localValue, setLocalValue] = useState(value);
  const [fileName, setFileName] = useState<string | null>(value ? value.split('/').pop()?.split('?')[0] || 'Uploaded file' : null);


  const { startUpload, isUploading } = useUploadThing(endpoint, {
    headers: async () => {
      if (!user) {
        throw new Error('Not authenticated');
      }
      const token = await user.getIdToken();
      return { Authorization: `Bearer ${token}` };
    },
    onClientUploadComplete: (res) => {
      if (!res?.[0]) {
        onUploadError(new Error("Upload failed: No response from server."));
        return;
      };
      setLocalValue(res[0].url);
      onUploadComplete(res[0].url, res[0].key);
      setUploadProgress(0); // Reset progress
    },
    onUploadError,
    onUploadProgress: setUploadProgress,
  });

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (!user) {
        onUploadError(new Error('You must be logged in to upload files.'));
        return;
      }
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setFileName(file.name);
        if (onFileSelect) {
            onFileSelect(file);
        } else {
            startUpload([file]).catch(onUploadError);
        }
      }
    },
    [startUpload, user, onUploadError, onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: false });

  const isImageUploader = endpoint === 'imageUploader';
  const Icon = isImageUploader ? ImageIcon : FileIcon;
  const description = isImageUploader ? 'PNG, JPG, GIF up to 4MB' : 'PDF, DOCX up to 16MB.';

  if (isUploading) {
    return (
      <div className="p-4 rounded-lg border border-dashed flex flex-col items-center justify-center text-center">
        <p className="text-sm font-medium mb-2">{fileName || 'Uploading...'}</p>
        <Progress value={uploadProgress} className="w-full h-2" />
        <p className="text-xs text-muted-foreground mt-2">{uploadProgress}%</p>
      </div>
    );
  }

  if (localValue) {
      return (
          <div className="flex items-center gap-4">
              {isImageUploader && localValue ? (
                  <Image src={localValue} alt="Current file" width={64} height={64} className="rounded-md object-contain border p-1" />
              ) : (
                  <div className="p-4 rounded-lg border flex items-center gap-3">
                      <FileIcon className="h-6 w-6 text-primary" />
                      <p className="text-sm font-medium truncate max-w-[200px]">{fileName}</p>
                  </div>
              )}
              <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                      setLocalValue('');
                      setFileName(null);
                      if (onFileSelect) onFileSelect(null);
                      onUploadComplete('', ''); 
                  }}
              >
                  Change
              </Button>
          </div>
      )
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
