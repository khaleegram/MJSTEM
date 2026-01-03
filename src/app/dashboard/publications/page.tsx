
'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
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
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
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
  const [activeId, setActiveId] = useState<string | null>(null);

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

  function findContainer(id: string | null) {
      if (!id) return null;
      if (id === 'unassigned') {
        return { type: 'unassigned', items: unassignedSubmissions };
      }
      for (const volume of volumes) {
        for (const issue of volume.issues || []) {
          if (`issue-${issue.id}` === id) {
            return { type: 'issue', volumeId: volume.id, issueId: issue.id, items: issue.articles };
          }
          if (issue.articles?.some(a => a.id === id)) {
            return { type: 'issue', volumeId: volume.id, issueId: issue.id, items: issue.articles };
          }
        }
      }
      return null;
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }

  const handleDragOver = (event: DragOverEvent) => {
      const { active, over } = event;
      const overId = over?.id;

      if (!overId) return;

      const activeContainerData = findContainer(active.id as string);
      const overContainerData = findContainer(overId as string);

      if (!activeContainerData || !overContainerData || activeContainerData === overContainerData) {
          return;
      }
      
      // This is a simplified handler that visually moves items but doesn't commit changes.
      // The real logic is in handleDragEnd.
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || !active.id || active.id === over.id) return;
    
    const originalContainer = findContainer(active.id as string);
    let overContainer = findContainer(over.id as string);
     // Handle dropping on an issue container directly
    if (over.data.current?.type === 'issue' && overContainer?.type !== 'issue') {
        overContainer = { type: 'issue', volumeId: over.data.current.volumeId, issueId: over.data.current.issueId, items: [] };
    }


    if (!originalContainer || !overContainer) return;
    
    const activeIndex = originalContainer.items.findIndex(item => item.id === active.id);
    let overIndex = -1;
    if (overContainer.items) {
      overIndex = overContainer.items.findIndex(item => item.id === over.id);
    }
    if (overIndex === -1) {
      overIndex = overContainer.items?.length || 0;
    }


    // --- Firestore Logic ---
    try {
      await runTransaction(db, async (transaction) => {
          const submissionDoc = await transaction.get(doc(db, 'submissions', active.id as string));
          if (!submissionDoc.exists()) throw new Error("Submission not found");
          
          const articleSubmission = { id: submissionDoc.id, ...submissionDoc.data() } as Submission;

          const sourceItems = [...originalContainer.items];
          let destinationItems = overContainer.items ? [...overContainer.items] : [];
          
          const [movedItem] = sourceItems.splice(activeIndex, 1);

          const newArticle: Article = {
            id: articleSubmission.id,
            title: articleSubmission.title,
            authorName: articleSubmission.author.name,
            contributors: articleSubmission.contributors,
            manuscriptUrl: articleSubmission.manuscriptUrl,
            pageCount: articleSubmission.pageCount || null,
          };

          if (originalContainer.type === 'issue' && overContainer.type === 'issue' && originalContainer.issueId === overContainer.issueId) {
            // Reordering within the same issue
            destinationItems.splice(overIndex, 0, newArticle);
             const volRef = doc(db, 'volumes', originalContainer.volumeId);
             const volDoc = await transaction.get(volRef);
             const currentVolData = volDoc.data() as Volume;
             const updatedIssues = currentVolData.issues?.map(i => i.id === originalContainer.issueId ? { ...i, articles: destinationItems } : i);
             transaction.update(volRef, { issues: updatedIssues });
          } else {
            // Moving between different containers
            destinationItems.splice(overIndex, 0, newArticle);

            // Update source container if it's an issue
            if (originalContainer.type === 'issue') {
              const sourceVolRef = doc(db, 'volumes', originalContainer.volumeId);
              const sourceVolDoc = await transaction.get(sourceVolRef);
              const sourceVolData = sourceVolDoc.data() as Volume;
              const updatedSourceIssues = sourceVolData.issues?.map(i => i.id === originalContainer.issueId ? { ...i, articles: sourceItems } : i);
              transaction.update(sourceVolRef, { issues: updatedSourceIssues });
            }

            // Update destination container if it's an issue
            if (overContainer.type === 'issue') {
              const destVolRef = doc(db, 'volumes', overContainer.volumeId!);
              const destVolDoc = await transaction.get(destVolRef);
              const destVolData = destVolDoc.data() as Volume;
              const updatedDestIssues = destVolData.issues?.map(i => i.id === overContainer!.issueId ? { ...i, articles: destinationItems } : i);
              transaction.update(destVolRef, { issues: updatedDestIssues });
            }
          }
      });
      toast({ title: "Publication Updated", description: "Article position has been saved." });
    } catch (e: any) {
        console.error("DND transaction failed: ", e);
        toast({ title: "Update Failed", description: e.message || "Could not move the article.", variant: "destructive"});
    } finally {
      fetchPublicationsData();
    }
  };


  const unassignedIds = useMemo(() => unassignedSubmissions.map(s => s.id), [unassignedSubmissions]);

  return (
    <DndContext 
      sensors={sensors} 
      collisionDetection={closestCenter} 
      onDragStart={handleDragStart} 
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
    >
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
                             <DroppableIssue key={issue.id} issue={issue} volumeId={volume.id} onActionComplete={fetchPublicationsData} />
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
                <SortableContext items={unassignedIds} strategy={verticalListSortingStrategy} id="unassigned">
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
