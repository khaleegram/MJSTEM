
'use client';

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from './ui/button';
import { useAuth } from '@/contexts/auth-context';
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Notification } from '@/types';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from './ui/skeleton';

export const NotificationsDropdown = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
        setLoading(false);
        return;
    };

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const notifs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.read).length);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      const notifRef = doc(db, 'notifications', notification.id);
      await updateDoc(notifRef, { read: true });
    }
    router.push(notification.link);
  };
  
  const handleMarkAllRead = async () => {
    const unreadNotifs = notifications.filter(n => !n.read);
    for (const notif of unreadNotifs) {
      const notifRef = doc(db, 'notifications', notif.id);
      await updateDoc(notifRef, { read: true });
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground">
              {unreadCount}
            </span>
          )}
          <span className="sr-only">Toggle notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex justify-between items-center">
            Notifications
            {unreadCount > 0 && <Button variant="link" size="sm" className="h-auto p-0" onClick={handleMarkAllRead}>Mark all as read</Button>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {loading ? (
            <div className="p-2 space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        ) : notifications.length > 0 ? (
          notifications.map(notif => (
            <DropdownMenuItem
              key={notif.id}
              className={`cursor-pointer flex flex-col items-start gap-1 ${!notif.read ? 'bg-secondary' : ''}`}
              onClick={() => handleNotificationClick(notif)}
            >
              <p className="text-sm whitespace-normal">{notif.message}</p>
              <p className="text-xs text-muted-foreground">{formatDistanceToNow(notif.timestamp.toDate(), { addSuffix: true })}</p>
            </DropdownMenuItem>
          ))
        ) : (
          <p className="p-4 text-center text-sm text-muted-foreground">No new notifications.</p>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
