
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Trash2, FileText, FileType2 as FileTypeIcon, Brain, AlertTriangle, CheckCircle, Archive, MessageSquareDiff } from 'lucide-react'; // Renamed FileType to FileTypeIcon to avoid conflict
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

// --- Type definitions ---

// For items from MEMORY_ITEMS_LOCAL_STORAGE_KEY
interface MemoryItem {
  id: string;
  type: 'text' | 'pdf';
  content?: string;
  fileName?: string;
  timestamp: number;
}

// For items from CHAT_HISTORY_LOCAL_STORAGE_KEY
interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: Date | string;
  isAutonomous?: boolean;
}

interface SavedChatSession {
  id: string;
  name: string;
  messages: Message[];
  savedAt: number;
  language?: 'Polish' | 'English';
}

// Combined type for display on this page
type DisplayableItemType = 'Uploaded Text' | 'Uploaded PDF' | 'Archived Chat Summary' | 'Saved Chat Session';

interface DisplayableMemoryItem {
  id: string; // Unique key for React list (e.g., `mem-${originalId}` or `chat-${originalId}`)
  originalId: string; // ID in its original localStorage key
  storageKey: 'memory_items' | 'chat_history'; // To know where to delete from
  displayType: DisplayableItemType;
  title: string; // For display
  timestamp: number; // For sorting
  contentPreview?: string; // Snippet or first messages
  fileName?: string; // For PDF
}

const MEMORY_ITEMS_LOCAL_STORAGE_KEY = 'lunafreyaMemoryItems';
const CHAT_HISTORY_LOCAL_STORAGE_KEY = 'chatHistory';

export default function ViewMemoryPage() {
  const [displayableItems, setDisplayableItems] = useState<DisplayableMemoryItem[]>([]);
  const { toast } = useToast();

  const loadAllMemoryItems = useCallback(() => {
    if (typeof window === 'undefined') return;
    let allItems: DisplayableMemoryItem[] = [];

    // 1. Load from MEMORY_ITEMS_LOCAL_STORAGE_KEY
    const memoryItemsJson = localStorage.getItem(MEMORY_ITEMS_LOCAL_STORAGE_KEY);
    if (memoryItemsJson) {
      try {
        const parsedMemoryItems = JSON.parse(memoryItemsJson) as MemoryItem[];
        parsedMemoryItems.forEach(item => {
          if (item.type === 'text' && item.content?.startsWith('Archived Chat Session:')) {
            const title = item.content.split('\n')[0].replace('Archived Chat Session: ', '').trim() || 'Archived Chat';
            allItems.push({
              id: `mem-arc-${item.id}`,
              originalId: item.id,
              storageKey: 'memory_items',
              displayType: 'Archived Chat Summary',
              title: title,
              timestamp: item.timestamp,
              contentPreview: item.content.substring(0, 300) + (item.content.length > 300 ? '...' : ''),
            });
          } else if (item.type === 'text') {
            allItems.push({
              id: `mem-txt-${item.id}`,
              originalId: item.id,
              storageKey: 'memory_items',
              displayType: 'Uploaded Text',
              title: item.content?.substring(0, 50) + (item.content && item.content.length > 50 ? '...' : '') || 'Untitled Text',
              timestamp: item.timestamp,
              contentPreview: item.content?.substring(0, 300) + (item.content && item.content.length > 300 ? '...' : ''),
            });
          } else if (item.type === 'pdf') {
            allItems.push({
              id: `mem-pdf-${item.id}`,
              originalId: item.id,
              storageKey: 'memory_items',
              displayType: 'Uploaded PDF',
              title: item.fileName || 'Untitled PDF',
              timestamp: item.timestamp,
              fileName: item.fileName,
            });
          }
        });
      } catch (error) {
        console.error("Error parsing memory items from localStorage:", error);
        toast({ title: "Error", description: "Could not load uploaded memory items.", variant: "destructive"});
      }
    }

    // 2. Load from CHAT_HISTORY_LOCAL_STORAGE_KEY
    const chatHistoryJson = localStorage.getItem(CHAT_HISTORY_LOCAL_STORAGE_KEY);
    if (chatHistoryJson) {
      try {
        const parsedChatSessions = JSON.parse(chatHistoryJson) as SavedChatSession[];
        parsedChatSessions.forEach(session => {
          // Filter out sessions that only contain autonomous messages or are empty for the preview
          const meaningfulMessages = session.messages.filter(m => !m.isAutonomous);
          if (meaningfulMessages.length > 0) {
            allItems.push({
              id: `chat-${session.id}`,
              originalId: session.id,
              storageKey: 'chat_history',
              displayType: 'Saved Chat Session',
              title: session.name || `Chat - ${new Date(session.savedAt).toLocaleDateString()}`,
              timestamp: session.savedAt,
              contentPreview: meaningfulMessages
                .slice(0, 2)
                .map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.text.substring(0, 40)}${m.text.length > 40 ? '...' : ''}`)
                .join('\n'),
            });
          }
        });
      } catch (error) {
        console.error("Error parsing chat history from localStorage:", error);
        toast({ title: "Error", description: "Could not load saved chat sessions.", variant: "destructive"});
      }
    }

    setDisplayableItems(allItems.sort((a,b) => b.timestamp - a.timestamp));
  }, [toast]);

  useEffect(() => {
    loadAllMemoryItems();
  }, [loadAllMemoryItems]);

  const deleteItem = (itemToDelete: DisplayableMemoryItem) => {
    if (typeof window === 'undefined') return;

    if (itemToDelete.storageKey === 'memory_items') {
      const memoryItemsJson = localStorage.getItem(MEMORY_ITEMS_LOCAL_STORAGE_KEY);
      if (memoryItemsJson) {
        let existingItems = JSON.parse(memoryItemsJson) as MemoryItem[];
        const updatedItems = existingItems.filter(item => item.id !== itemToDelete.originalId);
        localStorage.setItem(MEMORY_ITEMS_LOCAL_STORAGE_KEY, JSON.stringify(updatedItems));
      }
    } else if (itemToDelete.storageKey === 'chat_history') {
      const chatHistoryJson = localStorage.getItem(CHAT_HISTORY_LOCAL_STORAGE_KEY);
      if (chatHistoryJson) {
        let existingSessions = JSON.parse(chatHistoryJson) as SavedChatSession[];
        const updatedSessions = existingSessions.filter(session => session.id !== itemToDelete.originalId);
        localStorage.setItem(CHAT_HISTORY_LOCAL_STORAGE_KEY, JSON.stringify(updatedSessions));
      }
    }
    loadAllMemoryItems(); // Refresh the list
    toast({ title: "Item Deleted", description: `"${itemToDelete.title}" has been removed.`, icon: <CheckCircle className="h-5 w-5 text-green-500" /> });
  };

  const clearUploadedMemory = () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(MEMORY_ITEMS_LOCAL_STORAGE_KEY);
    loadAllMemoryItems(); // Refresh the list
    toast({ title: "Uploaded Memory Cleared", description: "All items from Memory Upload (including archived chat summaries) have been deleted.", icon: <CheckCircle className="h-5 w-5 text-green-500" /> });
  };
  
  const getDisplayIcon = (displayType: DisplayableItemType) => {
    switch (displayType) {
      case 'Uploaded Text':
        return <FileText className="h-5 w-5 text-primary" />;
      case 'Uploaded PDF':
        return <FileTypeIcon className="h-5 w-5 text-primary" />;
      case 'Archived Chat Summary':
        return <Archive className="h-5 w-5 text-primary" />;
      case 'Saved Chat Session':
        return <MessageSquareDiff className="h-5 w-5 text-primary" />;
      default:
        return <Brain className="h-5 w-5 text-primary" />;
    }
  };


  return (
    <>
      <PageHeader title="View Combined AI Memory" />
      <div className="container mx-auto max-w-3xl py-8">
        <Card className="shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Brain className="h-8 w-8 text-primary" />
                <CardTitle className="font-headline text-2xl">Combined AI Memory</CardTitle>
              </div>
              {displayableItems.some(item => item.storageKey === 'memory_items') && (
                 <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="mr-2 h-4 w-4" /> Clear Uploaded Memory
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                       <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-6 w-6 text-destructive" />
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                       </div>
                      <AlertDialogDescription>
                        This will permanently delete all items uploaded via "Memory Upload" and any "Archived Chat Summaries". Saved Chat Sessions (from Chat History) will NOT be affected by this action.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={clearUploadedMemory} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                        Yes, clear uploaded memory
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
            <CardDescription>
              Browse items from "Memory Upload" (texts, PDFs, archived chat summaries) and "Saved Chat Sessions" from your Chat History. All items are stored in your browser.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {displayableItems.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Brain size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No Memory Items Yet</p>
                <p>Items from "Memory Upload" or "Chat History" will appear here.</p>
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-var(--header-height)-22rem)] pr-3">
                <div className="space-y-4">
                  {displayableItems.map((item) => (
                    <Card key={item.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center space-x-2 mb-1">
                            {getDisplayIcon(item.displayType)}
                            <CardTitle className="text-md font-semibold truncate" title={item.title}>
                              {item.title}
                            </CardTitle>
                          </div>
                           <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive flex-shrink-0">
                                  <Trash2 size={14} />
                                  <span className="sr-only">Delete item</span>
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete this item?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{item.title}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteItem(item)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Type: {item.displayType} &bull; Stored: {new Date(item.timestamp).toLocaleString()}
                        </p>
                      </CardHeader>
                      {(item.contentPreview || item.fileName) && (
                        <CardContent className="pt-0 pb-3">
                          <ScrollArea className="max-h-28">
                            {item.fileName && <p className="text-sm text-muted-foreground">File: {item.fileName}</p>}
                            {item.contentPreview && 
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                                {item.contentPreview}
                              </p>
                            }
                          </ScrollArea>
                        </CardContent>
                      )}
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
