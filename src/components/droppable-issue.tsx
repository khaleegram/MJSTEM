'use client';

import { useDroppable } from '@dnd-kit/core';
import { Card } from '@/components/ui/card';
import { BookCopy, Edit, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Issue, Volume } from '@/types';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useState } from 'react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { doc, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';

const EditIssueDialog = ({ issue, volumeId, onActionComplete }: { issue: Issue, volumeId: string, onActionComplete: () => void }) => {
    const [newTitle, setNewTitle] = useState(issue.title);
    const [isOpen, setIsOpen] = useState(false);
    const { toast } = useToast();

    const handleUpdate = async () => {
        if (!newTitle.trim()) {
            toast({ title: 'Title cannot be empty', variant: 'destructive' });
            return;
        }

        const volumeRef = doc(db, 'volumes', volumeId);
        try {
            await runTransaction(db, async (transaction) => {
                const volumeDoc = await transaction.get(volumeRef);
                if (!volumeDoc.exists()) throw new Error("Volume not found");
                const currentData = volumeDoc.data() as Volume;
                const updatedIssues = currentData.issues?.map(i => 
                    i.id === issue.id ? { ...i, title: newTitle } : i
                ) || [];
                transaction.update(volumeRef, { issues: updatedIssues });
            });
            toast({ title: 'Success', description: 'Issue title has been updated.' });
            onActionComplete();
            setIsOpen(false);
        } catch (error) {
            console.error("Error updating issue:", error);
            toast({ title: 'Error', description: 'Could not update the issue.', variant: 'destructive' });
        }
    };
    
     const handleDelete = async () => {
        const volumeRef = doc(db, 'volumes', volumeId);
        try {
            await runTransaction(db, async (transaction) => {
                const volumeDoc = await transaction.get(volumeRef);
                if (!volumeDoc.exists()) throw new Error("Volume not found");
                const currentData = volumeDoc.data() as Volume;
                const updatedIssues = currentData.issues?.filter(i => i.id !== issue.id) || [];
                transaction.update(volumeRef, { issues: updatedIssues });
            });
            toast({ title: 'Issue Deleted', description: `The issue "${issue.title}" has been deleted.`, variant: "destructive" });
            onActionComplete();
            setIsOpen(false);
        } catch (error) {
            console.error("Error deleting issue:", error);
            toast({ title: 'Error', description: 'Could not delete the issue.', variant: 'destructive' });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6"><Edit className="h-4 w-4" /></Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Issue</DialogTitle>
                    <DialogDescription>
                        Update the title of this issue or delete it permanently.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="issue-title" className="text-right">Title</Label>
                        <Input
                        id="issue-title"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        className="col-span-3"
                        />
                    </div>
                </div>
                <DialogFooter className="justify-between">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete Issue</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the issue
                                and all articles within it.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    <Button onClick={handleUpdate}>Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export const DroppableIssue = ({ issue, volumeId, onActionComplete }: { issue: Issue, volumeId: string, onActionComplete: () => void }) => {
    const { isOver, setNodeRef } = useDroppable({
        id: `issue-${issue.id}`,
        data: { issueId: issue.id, volumeId: volumeId },
    });
    const { userProfile } = useAuth();
    const isAdmin = userProfile?.role === 'Admin' || userProfile?.role === 'Managing Editor';


    return (
        <div ref={setNodeRef} className={cn("border-l pl-6 py-4 transition-colors", isOver && "bg-primary/10")}>
            <div className="flex items-center justify-between">
                <h4 className="font-semibold flex items-center gap-2">
                    <BookCopy className="w-4 h-4" />
                    {issue.title}
                </h4>
                {isAdmin && <EditIssueDialog issue={issue} volumeId={volumeId} onActionComplete={onActionComplete} />}
            </div>
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
