
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { IndexingServiceSchema } from '@/lib/data-schemas';
import { IndexingService } from '@/types';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { FileUploader } from '@/components/file-uploader';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


const ServiceForm = ({ service, onSave, onCancel }: { service?: IndexingService, onSave: () => void, onCancel: () => void }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<IndexingService>({
    resolver: zodResolver(IndexingServiceSchema),
    defaultValues: service || {
      name: '',
      logoUrl: '',
    },
  });

  const onSubmit = async (values: IndexingService) => {
    setIsSubmitting(true);
    try {
      if (values.id) {
        const { id, ...dataToUpdate } = values;
        const serviceRef = doc(db, 'indexingServices', id);
        await updateDoc(serviceRef, dataToUpdate);
        toast({ title: 'Success', description: 'Indexing service updated.' });
      } else {
        await addDoc(collection(db, 'indexingServices'), {
          ...values,
          order: (await getDocs(collection(db, 'indexingServices'))).size,
        });
        toast({ title: 'Success', description: 'New indexing service added.' });
      }
      onSave();
    } catch (error) {
      console.error('Error saving service:', error);
      toast({ title: 'Error', description: 'Could not save service details.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
         <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem><FormLabel>Service Name</FormLabel><FormControl><Input {...field} placeholder="e.g., Google Scholar" /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="logoUrl" render={({ field }) => (
            <FormItem>
                <FormLabel>Logo</FormLabel>
                <FormControl>
                    <FileUploader 
                        endpoint="imageUploader"
                        value={field.value}
                        onUploadComplete={(url) => field.onChange(url)}
                        onUploadError={(err) => toast({title: "Upload Error", description: err.message, variant: "destructive"})}
                    />
                </FormControl>
                <FormMessage />
            </FormItem>
        )} />
        
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Service'}</Button>
        </DialogFooter>
      </form>
    </Form>
  );
};


export default function IndexingSettingsPage() {
  const [services, setServices] = useState<IndexingService[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<IndexingService | undefined>(undefined);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const servicesQuery = query(collection(db, 'indexingServices'), orderBy('order'));
      const servicesSnapshot = await getDocs(servicesQuery);
      const servicesList = servicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as IndexingService));
      setServices(servicesList);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({ title: 'Error', description: 'Could not fetch indexing services.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFormSave = () => {
    setIsFormOpen(false);
    setEditingService(undefined);
    fetchData();
  };

  const handleFormCancel = () => {
    setIsFormOpen(false);
    setEditingService(undefined);
  };
  
  const handleEditClick = (service: IndexingService) => {
    setEditingService(service);
    setIsFormOpen(true);
  }

  const handleDelete = async (serviceId: string) => {
    try {
        await deleteDoc(doc(db, 'indexingServices', serviceId));
        toast({ title: 'Success', description: 'Indexing service removed.' });
        fetchData();
    } catch (error) {
        console.error('Error deleting service:', error);
        toast({ title: 'Error', description: 'Could not remove service.', variant: 'destructive' });
    }
  }


  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Manage Indexing Services</h1>
          <p className="text-muted-foreground">Add, edit, or remove the indexing services displayed on the homepage.</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
                <Button onClick={() => { setEditingService(undefined); setIsFormOpen(true); }}><PlusCircle className="mr-2" /> Add Service</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{editingService ? 'Edit' : 'Add'} Indexing Service</DialogTitle>
                    <DialogDescription>Enter the name and upload the logo for the service.</DialogDescription>
                </DialogHeader>
                <ServiceForm service={editingService} onSave={handleFormSave} onCancel={handleFormCancel} />
            </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Indexing Services</CardTitle>
          <CardDescription>The list of services currently displayed on the public website.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Logo</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-12 w-12 rounded-md" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : services.length > 0 ? (
                services.map(service => (
                  <TableRow key={service.id}>
                    <TableCell>
                      <Avatar className="h-12 w-12 rounded-md">
                        <AvatarImage src={service.logoUrl || ''} alt={service.name} className="object-contain" />
                        <AvatarFallback>{service.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">{service.name}</TableCell>
                    <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(service)}>
                            <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>This action cannot be undone. This will permanently remove this service from your homepage.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(service.id!)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={3} className="h-24 text-center">No indexing services added yet.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
