const fs = require('fs');
const file = 'c:/Users/User/Desktop/Projects/MJSTEM/src/app/dashboard/submissions/[id]/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add toast to AuthorRevisionForm catch
const catchRegex = /catch \(serverError\) \{\s*errorEmitter\.emit\('permission-error'/;
const catchReplace = `catch (serverError: any) {
            console.error('[Revision] Error submitting revision:', serverError);
            toast({
                title: 'Error submitting revision',
                description: serverError?.message || 'An unknown error occurred while submitting.',
                variant: 'destructive'
            });
            errorEmitter.emit('permission-error'`;
content = content.replace(catchRegex, catchReplace);

// 2. Replace FileUploader description for accepted_manuscript
content = content.replace(/description="Upload final manuscript version \(\.doc, \.docx\)\."/g, 'description="Upload final manuscript version (.pdf)."');

// 3. Add In-Press Visibility and Editorial Decision EIC check
const decisionTarget = `        {isEditor && !isDecisionMade && (
        <Card>
          <CardHeader><CardTitle className="font-headline">Editorial Decision</CardTitle></CardHeader>
          <CardContent className="grid gap-2">
            <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleDecision('Accepted')} disabled={isUpdating}>Accept</Button>
            <Button variant="secondary" onClick={() => handleDecision('Minor Revision')} disabled={isUpdating}>Minor Revision</Button>
            <Button variant="secondary" onClick={() => handleDecision('Major Revision')} disabled={isUpdating}>Major Revision</Button>
            <Button variant="destructive" onClick={() => handleDecision('Rejected')} disabled={isUpdating}>Reject</Button>
          </CardContent>
        </Card>
        )}`;

const decisionReplace = `        {isEIC && submission.status === 'Accepted' && (
            <Card className={(submission as any).hiddenFromInPress ? "border-muted" : "border-primary"}>
                <CardHeader><CardTitle className="font-headline text-lg flex items-center gap-2"><BookText className="w-5 h-5"/> In-Press Visibility</CardTitle></CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                        {(submission as any).hiddenFromInPress 
                            ? "This article is currently hidden from the public 'Articles in Press' list." 
                            : "This article is currently visible to the public in the 'Articles in Press' list."}
                    </p>
                    <Button 
                        variant={(submission as any).hiddenFromInPress ? "default" : "secondary"} 
                        onClick={() => handleToggleInPress(!(submission as any).hiddenFromInPress)} 
                        disabled={isUpdating} 
                        className="w-full"
                    >
                        {(submission as any).hiddenFromInPress ? "Show in Articles in Press" : "Hide from Articles in Press"}
                    </Button>
                </CardContent>
            </Card>
        )}

        {isEditor && !isDecisionMade && (
        <Card>
          <CardHeader><CardTitle className="font-headline">Editorial Decision</CardTitle></CardHeader>
          <CardContent className="grid gap-2">
            {isEIC ? (
               <>
                 <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleDecision('Accepted')} disabled={isUpdating}>Accept</Button>
                 <Button variant="secondary" onClick={() => handleDecision('Minor Revision')} disabled={isUpdating}>Minor Revision</Button>
                 <Button variant="secondary" onClick={() => handleDecision('Major Revision')} disabled={isUpdating}>Major Revision</Button>
                 <Button variant="destructive" onClick={() => handleDecision('Rejected')} disabled={isUpdating}>Reject</Button>
               </>
            ) : (
                <p className="text-sm text-muted-foreground text-center py-2">Only the Editor-in-Chief can make the final decision.</p>
            )}
          </CardContent>
        </Card>
        )}`;

content = content.replace(decisionTarget, decisionReplace);

// 4. Add Assigned Editor
const reviewerTarget = `        <Card>
          <CardHeader><CardTitle className="font-headline">Peer Reviewers</CardTitle></CardHeader>`;

const reviewerReplace = `        {isEIC && (
        <Card>
          <CardHeader><CardTitle className="font-headline">Assigned Editor</CardTitle></CardHeader>
          <CardContent>
            {(submission as any).assignedEditorName ? (
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Avatar><AvatarFallback>{getInitials((submission as any).assignedEditorName)}</AvatarFallback></Avatar>
                        <div>
                            <p className="font-medium text-sm">{(submission as any).assignedEditorName}</p>
                            <p className="text-xs text-muted-foreground">Managing this submission</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleAssignSectionEditor(null, null)}><Trash2 className="h-4 w-4" /></Button>
                </div>
            ) : (
                <p className="text-sm text-muted-foreground text-center py-2">No specific editor assigned.</p>
            )}
          </CardContent>
          <CardFooter>
             <Dialog>
              <DialogTrigger asChild><Button variant="outline" className="w-full"><PlusCircle className="mr-2 h-4 w-4" /> Assign Editor</Button></DialogTrigger>
              <DialogContent className="sm:max-w-sm">
                <DialogHeader><DialogTitle>Assign an Editor</DialogTitle></DialogHeader>
                <div className="pt-4 max-h-60 overflow-y-auto">
                    {availableReviewers.filter(r => r.role === 'Editor').length > 0 ? availableReviewers.filter(r => r.role === 'Editor').map(r => (
                        <div key={r.uid} className='flex justify-between items-center p-2 border-b last:border-0'>
                            <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8"><AvatarFallback>{getInitials(r.displayName)}</AvatarFallback></Avatar>
                                <div className="text-xs">
                                    <p className="font-bold">{r.displayName}</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => handleAssignSectionEditor(r.uid, r.displayName)}><PlusCircle className='h-4 w-4' /></Button>
                        </div>
                    )) : <p className="text-sm text-muted-foreground text-center py-4">No users found with Editor role.</p>}
                </div>
              </DialogContent>
             </Dialog>
          </CardFooter>
        </Card>
        )}
        
        <Card>
          <CardHeader><CardTitle className="font-headline">Peer Reviewers</CardTitle></CardHeader>`;

content = content.replace(reviewerTarget, reviewerReplace);

// 5. Add handleAssignSectionEditor and handleToggleInPress functions inside the component
const funcTarget = `  const handleDecision = async (status: SubmissionStatus) => {`;
const funcReplace = `  const handleAssignSectionEditor = async (editorId: string | null, editorName: string | null) => {
      if (!submission || !isEIC) return;
      setIsUpdating(true);
      const submissionRef = doc(db, 'submissions', submission.id);
      try {
          await updateDoc(submissionRef, { 
              assignedEditorId: editorId,
              assignedEditorName: editorName
          });
          toast({ title: 'Editor Assigned', description: editorName ? \`\${editorName} is now managing this submission.\` : 'Editor assignment removed.', className: 'bg-green-600 text-white' });
          setRefetchTrigger(p => p+1);
      } catch (err: any) {
          toast({ title: 'Error', description: err.message, variant: 'destructive' });
      }
      setIsUpdating(false);
  };

  const handleToggleInPress = async (hidden: boolean) => {
      if (!submission || !isEIC) return;
      setIsUpdating(true);
      const submissionRef = doc(db, 'submissions', submission.id);
      try {
          await updateDoc(submissionRef, { hiddenFromInPress: hidden });
          toast({ title: 'Visibility Updated', description: hidden ? 'Article hidden from In-Press.' : 'Article now visible in In-Press.', className: 'bg-green-600 text-white' });
          setRefetchTrigger(p => p+1);
      } catch (err: any) {
          toast({ title: 'Error', description: err.message, variant: 'destructive' });
      }
      setIsUpdating(false);
  };

  const handleDecision = async (status: SubmissionStatus) => {`;
if (!content.includes('handleAssignSectionEditor')) {
    content = content.replace(funcTarget, funcReplace);
}

// 6. Check for isEIC declaration
const eicTarget = `const isEditor = userProfile?.role === 'Editor' || userProfile?.role === 'Managing Editor' || userProfile?.role === 'Admin';`;
const eicReplace = `const isEditor = userProfile?.role === 'Editor' || userProfile?.role === 'Managing Editor' || userProfile?.role === 'Admin';
  const isEIC = userProfile?.role === 'Managing Editor' || userProfile?.role === 'Admin';`;
if (!content.includes('const isEIC')) {
    content = content.replace(eicTarget, eicReplace);
}

fs.writeFileSync(file, content, 'utf8');
console.log('Successfully patched page.tsx');
