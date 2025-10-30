'use client';

import { useDroppable } from '@dnd-kit/core';
import { Card } from '@/components/ui/card';
import { BookCopy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Issue } from '@/types';

export const DroppableIssue = ({ issue, volumeId }: { issue: Issue, volumeId: string }) => {
    const { isOver, setNodeRef } = useDroppable({
        id: `issue-${issue.id}`,
        data: { issueId: issue.id, volumeId: volumeId },
    });

    return (
        <div ref={setNodeRef} className={cn("border-l pl-6 py-4 transition-colors", isOver && "bg-primary/10")}>
            <h4 className="font-semibold flex items-center gap-2">
                <BookCopy className="w-4 h-4" />
                {issue.title}
            </h4>
            <div className="mt-2 space-y-2 text-sm text-muted-foreground">
                {issue.articles && issue.articles.length > 0 ? (
                    issue.articles.map((article) => (
                        <Card key={article.id} className="p-2 text-xs">
                           - {article.title}
                        </Card>
                    ))
                ) : (
                    <p className="text-xs italic">Drop articles here</p>
                )}
            </div>
        </div>
    )
}
