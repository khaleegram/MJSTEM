
'use client';

import { Submission } from '@/types';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Quote, FileText, Download } from 'lucide-react';
import { format } from 'date-fns';

interface CitationExporterProps {
  submission: Submission;
}

export function CitationExporter({ submission }: CitationExporterProps) {
  const articleUrl = typeof window !== 'undefined' ? `${window.location.origin}/article/${submission.id}` : '';

  const generateBibtex = () => {
    const authors = submission.contributors?.map(c => c.name).join(' and ') || submission.author.name;
    const year = format(new Date(submission.submittedAt), 'yyyy');

    const bibtex = `@article{mjstem_${submission.uniqueId || submission.id},
  author    = {${authors}},
  title     = {${submission.title}},
  journal   = {Multidisciplinary Journal of Science, Technology, Education and Management (MJSTEM)},
  year      = {${year}},
  doi       = {${submission.doi || submission.uniqueId}},
  url       = {${articleUrl}}
}`;
    return bibtex;
  };

  const generateRis = () => {
    const authors = submission.contributors?.map(c => `AU  - ${c.name}`).join('\n') || `AU  - ${submission.author.name}`;
    const year = format(new Date(submission.submittedAt), 'yyyy');

    const ris = `TY  - JOUR
${authors}
TI  - ${submission.title}
T2  - Multidisciplinary Journal of Science, Technology, Education and Management (MJSTEM)
PY  - ${year}
DO  - ${submission.doi || submission.uniqueId}
UR  - ${articleUrl}
ER  - 
`;
    return ris;
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownload = (format: 'bibtex' | 'ris') => {
    if (format === 'bibtex') {
      const content = generateBibtex();
      downloadFile(content, `${submission.uniqueId || 'citation'}.bib`, 'application/x-bibtex');
    } else if (format === 'ris') {
      const content = generateRis();
      downloadFile(content, `${submission.uniqueId || 'citation'}.ris`, 'application/x-research-info-systems');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Quote className="mr-2 h-4 w-4" />
          Cite
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => handleDownload('bibtex')}>
          <Download className="mr-2 h-4 w-4" />
          <span>BibTeX</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleDownload('ris')}>
          <FileText className="mr-2 h-4 w-4" />
          <span>RIS (EndNote, Zotero)</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
