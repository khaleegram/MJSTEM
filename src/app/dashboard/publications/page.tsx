'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  PlusCircle,
  Book,
  Settings2,
  Trash2,
  Move,
  BookCopy,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Submission, Volume, Issue, Article, Contributor } from '@/types';
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  addDoc,
  doc,
  updateDoc,
  arrayUnion,
  runTransaction,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

// --- DIALOGS AND SUB-COMPONENTS ---

const ManageVolumeDialog = ({ volume, onActionComplete }: { volume: Volume; onActionComplete: () => void }) => {
    const [newTitle, setNewTitle] = useState(volume.title);
    const [isSaving, setIsSaving] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const { toast } = useToast();

    const handleUpdateTitle = async () => {
        if (!newTitle.trim()) {
            toast({ title: 'Title cannot be empty', variant: 'destructive' });
            return;
        }
        setIsSaving(true);
        const volumeRef = doc(db, 'volumes', volume.id);
        updateDoc(volumeRef, { title: newTitle }).then(() => {
            toast({ title: 'Volume Updated', description: 'The volume title has been saved.' });
            onActionComplete();
            setIsOpen(false);
        }).catch((serverError) => {
            const permissionError = new FirestorePermissionError({ path: volumeRef.path, operation: 'update', requestResourceData: { title: newTitle }});
            errorEmitter.emit('permission-error', permissionError);
        }).finally(() => {
            setIsSaving(false);
        });
    };

    const handleDeleteVolume = async () => {
        setIsSaving(true);
        const volumeRef = doc(db, 'volumes', volume.id);
        deleteDoc(volumeRef).then(() => {
            toast({ title: 'Volume Deleted', description: `"${volume.title}" has been permanently removed.` });
            onActionComplete();
            setIsOpen(false);
        }).catch((serverError) => {
            const permissionError = new FirestorePermissionError({ path: volumeRef.path, operation: 'delete' });
            errorEmitter.emit('permission-error', permissionError);
        }).finally(() => {
            setIsSaving(false);
        });
    };


    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Settings2 className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Manage Volume</DialogTitle>
                    <DialogDescription>Edit the title or delete this volume.</DialogDescription>
                </DialogHeader>
                 <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="volume-title" className="text-right">Title</Label>
                        <Input id="volume-title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="col-span-3" />
                    </div>
                </div>
                <DialogFooter className="justify-between">
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button variant="destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete Volume</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                This will permanently delete the volume <strong>{volume.title}</strong> and all issues and articles within it. This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteVolume}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    <Button onClick={handleUpdateTitle} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Title'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

const AddIssueDialog = ({ volume, onIssueAdded }: { volume: Volume; onIssueAdded: () => void }) => {
  const [issueTitle, setIssueTitle] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleCreateIssue = async () => {
    if (!issueTitle.trim()) {
      toast({ title: 'Title is required', variant: 'destructive' });
      return;
    }

    const volumeRef = doc(db, 'volumes', volume.id);
    const newIssue: Omit<Issue, 'id'> & { id: string } = {
      id: `issue_${Date.now()}`,
      title: issueTitle,
      articles: [],
    };
    
    updateDoc(volumeRef, { issues: arrayUnion(newIssue) }).then(() => {
        toast({ title: 'Issue Created', description: `Added "${issueTitle}" to ${volume.title}` });
        onIssueAdded();
        setIsOpen(false);
        setIssueTitle('');
    }).catch(serverError => {
        const permissionError = new FirestorePermissionError({
            path: volumeRef.path,
            operation: 'update',
            requestResourceData: { issues: `(arrayUnion with ${newIssue.title})` }
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="mt-2">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Issue
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Issue to {volume.title}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="issue-title" className="text-right">Title</Label>
            <Input
              id="issue-title"
              value={issueTitle}
              onChange={(e) => setIssueTitle(e.target.value)}
              placeholder="e.g., Issue 1"
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleCreateIssue}>Add Issue</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


const AddToIssueDialog = ({ article, volumes, onActionComplete }: { article: Submission; volumes: Volume[], onActionComplete: () => void }) => {
    const [selectedIssueId, setSelectedIssueId] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const { toast } = useToast();

    const handleAddToIssue = async () => {
        if (!selectedIssueId) {
            toast({ title: 'Please select an issue', variant: 'destructive' });
            return;
        }
        
        const [volumeId, issueId] = selectedIssueId.split('/');
        const volumeRef = doc(db, 'volumes', volumeId);

        const newArticle: Article = {
            id: article.id,
            title: article.title,
            authorName: article.author.name,
            contributors: article.contributors,
            manuscriptUrl: article.manuscriptUrl,
            pageCount: article.pageCount || null,
            uniqueId: article.uniqueId,
        };

        try {
            await runTransaction(db, async (transaction) => {
                const volDoc = await transaction.get(volumeRef);
                if (!volDoc.exists()) throw new Error("Volume not found");

                const currentVolume = volDoc.data() as Volume;
                const updatedIssues = currentVolume.issues?.map(issue => {
                    if (issue.id === issueId) {
                        return { ...issue, articles: [...(issue.articles || []), newArticle] };
                    }
                    return issue;
                }) || [];
                
                transaction.update(volumeRef, { issues: updatedIssues });
            });
            toast({ title: 'Article Added', description: `Moved "${article.title}" to the selected issue.` });
            onActionComplete();
            setIsOpen(false);
        } catch (error) {
             toast({ title: 'Failed to add article', variant: 'destructive' });
             console.error(error);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button size="sm">Add to Issue</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add "{article.title}" to an issue</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <Label>Target Issue</Label>
                    <Select onValueChange={setSelectedIssueId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a volume and issue..." />
                        </SelectTrigger>
                        <SelectContent>
                            {volumes.map(volume => (
                                <optgroup label={volume.title} key={volume.id}>
                                    {volume.issues?.map(issue => (
                                        <SelectItem key={`${volume.id}/${issue.id}`} value={`${volume.id}/${issue.id}`}>
                                            {issue.title}
                                        </SelectItem>
                                    ))}
                                </optgroup>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <DialogFooter>
                    <Button onClick={handleAddToIssue}>Add to Issue</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

// --- MAIN PAGE COMPONENT ---

export default function PublicationsPage() {
  const [unassignedSubmissions, setUnassignedSubmissions] = useState<Submission[]>([]);
  const [volumes, setVolumes] = useState<Volume[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [newVolumeTitle, setNewVolumeTitle] = useState('');

  const fetchPublicationsData = async () => {
    setLoading(true);
    try {
      const volsQuery = query(collection(db, 'volumes'), orderBy('year', 'desc'));
      const volsSnapshot = await getDocs(volsQuery);
      const volsData: Volume[] = volsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Volume, 'id'>),
      }));
      setVolumes(volsData);
      setNewVolumeTitle(`Volume ${volsData.length + 1}, ${new Date().getFullYear()}`);

      const assignedArticleIds = volsData.flatMap(v => v.issues?.flatMap(i => i.articles?.map(a => a.id) || []) || []);

      const subsQuery = query(
        collection(db, 'submissions'),
        where('status', '==', 'Accepted')
      );
      const subsSnapshot = await getDocs(subsQuery);
      const subs: Submission[] = subsSnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Submission, 'id'>),
          submittedAt: doc.data().submittedAt.toDate(),
        }))
        .filter(sub => !assignedArticleIds.includes(sub.id));
      
      setUnassignedSubmissions(subs);

    } catch (serverError) {
        const permissionError = new FirestorePermissionError({ path: 'volumes', operation: 'list' });
        errorEmitter.emit('permission-error', permissionError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicationsData();
  }, []);

  const handleCreateVolume = async () => {
    if (!newVolumeTitle.trim()) {
      toast({ title: 'Volume title cannot be empty', variant: 'destructive' });
      return;
    }
    const volumeData = {
        title: newVolumeTitle,
        year: new Date().getFullYear(),
        issues: [],
    };
    const volumesCollectionRef = collection(db, 'volumes');
    addDoc(volumesCollectionRef, volumeData).then(() => {
        toast({
            title: 'Volume Created!',
            description: `${newVolumeTitle} has been added.`,
        });
        fetchPublicationsData();
    }).catch(serverError => {
        const permissionError = new FirestorePermissionError({ path: volumesCollectionRef.path, operation: 'create', requestResourceData: volumeData });
        errorEmitter.emit('permission-error', permissionError);
    });
  };
  
    const handleRemoveArticle = async (articleId: string, fromIssueId: string, fromVolumeId: string) => {
        const volumeRef = doc(db, 'volumes', fromVolumeId);
        try {
            await runTransaction(db, async (transaction) => {
                const volDoc = await transaction.get(volumeRef);
                if (!volDoc.exists()) throw new Error("Volume not found");

                const currentVolume = volDoc.data() as Volume;
                const updatedIssues = currentVolume.issues?.map(issue => {
                    if (issue.id === fromIssueId) {
                        return { ...issue, articles: issue.articles?.filter(a => a.id !== articleId) || [] };
                    }
                    return issue;
                }) || [];
                transaction.update(volumeRef, { issues: updatedIssues });
            });
            toast({ title: 'Article Removed', description: 'The article has been returned to the unassigned list.' });
            fetchPublicationsData();
        } catch (error) {
            toast({ title: 'Failed to remove article', variant: 'destructive' });
            console.error(error);
        }
    };


  return (
      <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Volumes and Issues</CardTitle>
              <CardDescription>Organize accepted articles into volumes and issues for publication.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end mb-4">
                <Dialog>
                  <DialogTrigger asChild><Button><PlusCircle className="mr-2" />Create New Volume</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Volume</DialogTitle>
                      <DialogDescription>Enter the details for the new volume.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="volume-title" className="text-right">Title</Label>
                        <Input id="volume-title" value={newVolumeTitle} onChange={(e) => setNewVolumeTitle(e.target.value)} className="col-span-3" />
                      </div>
                    </div>
                    <DialogFooter><Button onClick={handleCreateVolume}>Create Volume</Button></DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              {loading ? (
                <div className='space-y-2'>
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <Accordion type="single" collapsible defaultValue={volumes[0]?.id}>
                  {volumes.map((volume) => (
                    <AccordionItem value={volume.id} key={volume.id}>
                        <div className="flex items-center w-full group">
                            <AccordionTrigger className="text-lg font-headline hover:no-underline flex-1">
                                <div className="flex items-center gap-3"><Book /> {volume.title}</div>
                            </AccordionTrigger>
                            <div className="pl-4 pr-2">
                                <ManageVolumeDialog volume={volume} onActionComplete={fetchPublicationsData} />
                            </div>
                        </div>
                      <AccordionContent className="pl-6 space-y-4">
                        {volume.issues && volume.issues.length > 0 ? (
                          volume.issues.map((issue) => (
                             <div key={issue.id} className="border-l pl-6 py-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-semibold flex items-center gap-2"><BookCopy className="w-4 h-4" />{issue.title}</h4>
                                </div>
                                <div className="mt-2 space-y-2 text-sm text-muted-foreground">
                                    {issue.articles && issue.articles.length > 0 ? (
                                        issue.articles.map(article => (
                                            <div key={article.id} className="p-2 bg-card border rounded-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                                                <span className="truncate flex-1">{article.title}</span>
                                                <div className="flex items-center self-end sm:self-center">
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><Trash2 className="h-4 w-4 text-destructive"/></Button></AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader><AlertDialogTitle>Confirm Removal</AlertDialogTitle><AlertDialogDescription>Are you sure you want to remove this article from the issue? It will be moved back to the "Ready for Publication" list.</AlertDialogDescription></AlertDialogHeader>
                                                            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleRemoveArticle(article.id, issue.id, volume.id)}>Remove</AlertDialogAction></AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-xs italic py-4 text-center">No articles in this issue.</p>
                                    )}
                                </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center text-muted-foreground py-6"><p>No issues in this volume yet.</p></div>
                        )}
                        <AddIssueDialog volume={volume} onIssueAdded={fetchPublicationsData} />
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-8">
          <Card className="max-h-[calc(100vh-10rem)] flex flex-col">
            <CardHeader>
              <CardTitle className="font-headline">Ready for Publication</CardTitle>
              <CardDescription>Articles that are accepted but not yet in an issue.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
                <div className="flex-1 overflow-y-auto space-y-4 p-1 rounded-lg">
                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i} className="p-4"><div className="flex items-center gap-4"><Skeleton className="h-4 w-4" /><div className="space-y-2"><Skeleton className="h-4 w-48" /><Skeleton className="h-3 w-32" /></div></div></Card>
                    ))
                ) : unassignedSubmissions.length > 0 ? (
                    unassignedSubmissions.map((sub) => (
                       <Card key={sub.id} className="p-4">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="flex-1">
                                    <p className="font-medium leading-snug">{sub.title}</p>
                                    <p className="text-sm text-muted-foreground">{sub.author.name}</p>
                                </div>
                                <div className="self-end sm:self-center">
                                    <AddToIssueDialog article={sub} volumes={volumes} onActionComplete={fetchPublicationsData} />
                                </div>
                            </div>
                        </Card>
                    ))
                ) : (
                    <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm h-full py-20">
                    <div className="flex flex-col items-center gap-4 text-center">
                        <Book className="h-16 w-16 text-muted-foreground" />
                        <h3 className="text-xl font-bold tracking-tight font-headline">No Unassigned Articles</h3>
                        <p className="text-sm text-muted-foreground max-w-md">Accepted manuscripts will appear here once they are approved.</p>
                    </div>
                    </div>
                )}
                </div>
            </CardContent>
          </Card>
        </div>
      </div>
  );
}
