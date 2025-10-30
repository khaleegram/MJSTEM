'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
  BookCopy,
  GripVertical,
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Submission, Volume, Issue, Article } from '@/types';
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
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { DroppableIssue } from '@/components/droppable-issue';

const AddIssueDialog = ({ volume, onIssueAdded }: { volume: Volume; onIssueAdded: () => void }) => {
  const [issueTitle, setIssueTitle] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleCreateIssue = async () => {
    if (!issueTitle.trim()) {
      toast({ title: 'Title is required', variant: 'destructive' });
      return;
    }

    try {
      const volumeRef = doc(db, 'volumes', volume.id);
      const newIssue: Omit<Issue, 'id'> & { id: string } = {
        id: `issue_${Date.now()}`,
        title: issueTitle,
        articles: [],
      };
      await updateDoc(volumeRef, {
        issues: arrayUnion(newIssue),
      });

      toast({ title: 'Issue Created', description: `Added "${issueTitle}" to ${volume.title}` });
      onIssueAdded();
      setIsOpen(false);
      setIssueTitle('');
    } catch (error) {
      console.error('Error creating issue: ', error);
      toast({ title: 'Error', description: 'Could not create the issue.', variant: 'destructive' });
    }
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

const DraggableArticle = ({ article }: { article: Submission }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: article.id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };
    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} data-dnd-id={article.id}>
            <Card className="p-4 hover:shadow-md cursor-grab active:cursor-grabbing">
                <div className="flex items-center gap-4">
                <GripVertical className="h-5 w-5 text-muted-foreground" />
                <div>
                    <p className="font-medium leading-snug">{article.title}</p>
                    <p className="text-sm text-muted-foreground">{article.author.name}</p>
                </div>
                </div>
            </Card>
        </div>
    )
}


export default function PublicationsPage() {
  const [unassignedSubmissions, setUnassignedSubmissions] = useState<Submission[]>([]);
  const [volumes, setVolumes] = useState<Volume[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [newVolumeTitle, setNewVolumeTitle] = useState(`Volume ${volumes.length + 1}, ${new Date().getFullYear()}`);
  const sensors = useSensors(useSensor(PointerSensor));
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const fetchPublicationsData = async () => {
    setLoading(true);
    try {
      // Fetch all volumes and their articles
      const volsQuery = query(collection(db, 'volumes'), orderBy('year', 'desc'));
      const volsSnapshot = await getDocs(volsQuery);
      const vols: Volume[] = volsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Volume, 'id'>),
      }));
      setVolumes(vols);

      // Get all article IDs that are already in issues
      const assignedArticleIds = vols.flatMap(v => v.issues?.flatMap(i => i.articles?.map(a => a.id) || []) || []);

      // Fetch accepted submissions that are NOT in the assigned list
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
        .filter(sub => !assignedArticleIds.includes(sub.id)); // Filter out already assigned articles
      
      setUnassignedSubmissions(subs);

    } catch (error) {
      console.error('Error fetching data: ', error);
      toast({
        title: 'Error',
        description: 'Could not fetch publications data.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicationsData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]);

  const handleCreateVolume = async () => {
    if (!newVolumeTitle.trim()) {
      toast({ title: 'Volume title cannot be empty', variant: 'destructive' });
      return;
    }
    try {
      await addDoc(collection(db, 'volumes'), {
        title: newVolumeTitle,
        year: new Date().getFullYear(),
        issues: [],
      });
      toast({
        title: 'Volume Created!',
        description: `${newVolumeTitle} has been added.`,
      });
      fetchPublicationsData();
      setNewVolumeTitle(`Volume ${volumes.length + 2}, ${new Date().getFullYear()}`);
    } catch (error) {
      console.error('Error creating volume: ', error);
      toast({ title: 'Error', description: 'Could not create the volume.', variant: 'destructive' });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);
    if (!over || !active) return;
    
    const articleId = active.id as string;
    const droppableId = over.id as string;

    if (!droppableId.startsWith('issue-')) return;
    
    const issueId = over.data.current?.issueId;
    const volumeId = over.data.current?.volumeId;

    if (articleId && issueId && volumeId) {
        const article = unassignedSubmissions.find(s => s.id === articleId);
        if (!article) return;

        try {
            await runTransaction(db, async (transaction) => {
                const volumeRef = doc(db, 'volumes', volumeId);
                const volumeDoc = await transaction.get(volumeRef);
                if (!volumeDoc.exists()) throw "Volume not found!";

                const newArticle: Article = { id: article.id, title: article.title, authorName: article.author.name };
                
                const currentData = volumeDoc.data() as Volume;
                const updatedIssues = currentData.issues?.map(issue => {
                    if (issue.id === issueId) {
                        // Prevent adding duplicates
                        if (issue.articles?.some(a => a.id === newArticle.id)) {
                            return issue;
                        }
                        return { ...issue, articles: [...(issue.articles || []), newArticle] };
                    }
                    return issue;
                });

                transaction.update(volumeRef, { issues: updatedIssues });
            });
            
            toast({ title: "Article Added", description: `Added "${article.title}" to issue.` });
            // Refetch all data to ensure UI consistency
            fetchPublicationsData();

        } catch (error) {
            console.error("Failed to add article to issue: ", error);
            toast({ title: "Update Failed", description: "Could not add article to the issue.", variant: "destructive" });
        }
    }
  };


  const unassignedIds = useMemo(() => unassignedSubmissions.map(s => s.id), [unassignedSubmissions]);

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={(e) => setActiveDragId(e.active.id as string)} onDragEnd={handleDragEnd}>
      <div className="grid gap-8 lg:grid-cols-3">
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
                      <AccordionTrigger className="text-lg font-headline"><div className="flex items-center gap-3"><Book /> {volume.title}</div></AccordionTrigger>
                      <AccordionContent className="pl-6">
                        {volume.issues && volume.issues.length > 0 ? (
                          volume.issues.map((issue) => (
                             <DroppableIssue key={issue.id} issue={issue} volumeId={volume.id} />
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
              <CardDescription>Drag accepted articles into an issue.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto space-y-4">
                <SortableContext items={unassignedIds} strategy={verticalListSortingStrategy}>
                    {loading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i} className="p-4">
                            <div className="flex items-center gap-4">
                            <Skeleton className="h-6 w-6" /><div className="space-y-2"><Skeleton className="h-4 w-48" /><Skeleton className="h-3 w-32" /></div>
                            </div>
                        </Card>
                        ))
                    ) : unassignedSubmissions.length > 0 ? (
                        unassignedSubmissions.map((sub) => (
                           <DraggableArticle key={sub.id} article={sub} />
                        ))
                    ) : (
                        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm h-full">
                        <div className="flex flex-col items-center gap-4 text-center">
                            <Book className="h-16 w-16 text-muted-foreground" />
                            <h3 className="text-xl font-bold tracking-tight font-headline">No Unassigned Articles</h3>
                            <p className="text-sm text-muted-foreground max-w-md">Accepted manuscripts will appear here. Any articles already in an issue will not be shown.</p>
                        </div>
                        </div>
                    )}
                </SortableContext>
            </CardContent>
          </Card>
        </div>
      </div>
    </DndContext>
  );
}
