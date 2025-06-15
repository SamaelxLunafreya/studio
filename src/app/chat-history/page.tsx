
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { History, Trash2, FileText, AlertTriangle, CheckCircle, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PageHeader } from '@/components/page-header';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { uploadToMemoryAction } from '@/actions/memoryActions';

interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: Date | string; // Allow string temporarily from JSON parse
  suggestions?: string[];
  isError?: boolean;
}

interface SavedChatSession {
  id: string;
  name: string;
  messages: Message[];
  savedAt: number;
}

const CHAT_HISTORY_LOCAL_STORAGE_KEY = 'chatHistory';

export default function ChatHistoryPage() {
  const [savedSessions, setSavedSessions] = useState<SavedChatSession[]>([]);
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const fetchHistory = useCallback(() => {
    if (typeof window === 'undefined') return;
    const historyJson = localStorage.getItem(CHAT_HISTORY_LOCAL_STORAGE_KEY);
    if (historyJson) {
      try {
        const parsedHistory = JSON.parse(historyJson) as SavedChatSession[];
        const processedHistory = parsedHistory.map(session => ({
          ...session,
          messages: session.messages.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp) 
          })),
        })).sort((a, b) => b.savedAt - a.savedAt);
        setSavedSessions(processedHistory);
      } catch (error) {
        console.error("Error parsing chat history:", error);
        toast({ title: "Error", description: "Could not load chat history.", variant: "destructive" });
        setSavedSessions([]);
      }
    } else {
      setSavedSessions([]);
    }
  }, [toast]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const deleteSession = (sessionId: string) => {
    if (typeof window === 'undefined') return;
    const updatedSessions = savedSessions.filter(session => session.id !== sessionId);
    localStorage.setItem(CHAT_HISTORY_LOCAL_STORAGE_KEY, JSON.stringify(updatedSessions));
    setSavedSessions(updatedSessions);
    toast({ title: "Chat Deleted", description: "The chat session has been removed.", icon: <CheckCircle className="h-5 w-5" /> });
  };

  const clearAllHistory = () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(CHAT_HISTORY_LOCAL_STORAGE_KEY);
    setSavedSessions([]);
    toast({ title: "History Cleared", description: "All chat sessions have been deleted.", icon: <CheckCircle className="h-5 w-5" /> });
  };

  const handleArchiveSession = async (session: SavedChatSession) => {
    setArchivingId(session.id);
    const chatContent = session.messages.map(msg => `${msg.role === 'user' ? 'User' : 'AI'} (${new Date(msg.timestamp).toLocaleString()}): ${msg.text}`).join('\n\n');
    const memoryInput = {
      text: `Archived Chat Session: ${session.name}\nSaved At: ${new Date(session.savedAt).toLocaleString()}\n\n--- Chat Content ---\n${chatContent}`
    };
    
    const result = await uploadToMemoryAction(memoryInput);
    setArchivingId(null);

    if (result && 'error' in result) {
      toast({
        title: "Archive Failed",
        description: result.error,
        variant: "destructive"
      });
    } else if (result) {
      toast({
        title: "Chat Archived",
        description: `"${session.name}" has been archived to AI memory.`,
        icon: <CheckCircle className="h-5 w-5" />
      });
    }
  };

  return (
    <>
      <PageHeader title="Chat History" />
      <div className="container mx-auto max-w-3xl py-8">
        <Card className="shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <History className="h-8 w-8 text-primary" />
                <CardTitle className="font-headline text-2xl">Saved Chat Sessions</CardTitle>
              </div>
              {savedSessions.length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="mr-2 h-4 w-4" /> Clear All History
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete all your saved chat sessions.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={clearAllHistory} className="bg-destructive hover:bg-destructive/90">
                        Yes, delete all
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
            <CardDescription>
              Review, load, archive, or delete your past conversations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {savedSessions.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <History size={48} className="mx-auto mb-4" />
                <p className="text-lg font-medium">No Saved Chats Yet</p>
                <p>Your saved chat sessions will appear here.</p>
                <Button asChild variant="link" className="mt-4">
                  <Link href="/chat">Start a new chat</Link>
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-var(--header-height)-22rem)]">
                <div className="space-y-4">
                  {savedSessions.map((session) => (
                    <Card key={session.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-medium truncate flex justify-between items-center">
                          <Link href={`/chat?sessionId=${session.id}`} className="hover:underline flex-grow truncate mr-2">
                            {session.name || `Chat - ${session.id}`}
                          </Link>
                           <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                                <Trash2 size={16} />
                                <span className="sr-only">Delete session</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete this chat session?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete the chat titled "{session.name || `Chat - ${session.id}`}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteSession(session.id)} className="bg-destructive hover:bg-destructive/90">
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Saved: {new Date(session.savedAt).toLocaleString()} &bull; {session.messages.length} messages
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0 pb-3">
                        <p className="text-sm text-muted-foreground truncate">
                          {session.messages[0]?.text || "No messages preview."}
                        </p>
                      </CardContent>
                      <CardFooter className="pt-0 flex gap-2">
                        <Button asChild variant="outline" size="sm" className="flex-1">
                          <Link href={`/chat?sessionId=${session.id}`}>
                            <FileText className="mr-2 h-4 w-4" /> Load Chat
                          </Link>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleArchiveSession(session)}
                          disabled={archivingId === session.id}
                        >
                          {archivingId === session.id ? (
                            <Archive className="mr-2 h-4 w-4 animate-pulse" />
                          ) : (
                            <Archive className="mr-2 h-4 w-4" />
                          )}
                           {archivingId === session.id ? 'Archiving...' : 'Archive to Memory'}
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
