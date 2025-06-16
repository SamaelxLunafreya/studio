
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Trash2, FileText, FileType, Brain, AlertTriangle, CheckCircle } from 'lucide-react'; // FileType for PDF
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

interface MemoryItem {
  id: string;
  type: 'text' | 'pdf';
  content?: string; 
  fileName?: string; 
  timestamp: number;
}

const MEMORY_ITEMS_LOCAL_STORAGE_KEY = 'lunafreyaMemoryItems';

export default function ViewMemoryPage() {
  const [memoryItems, setMemoryItems] = useState<MemoryItem[]>([]);
  const { toast } = useToast();

  const loadMemoryItems = useCallback(() => {
    if (typeof window === 'undefined') return;
    const itemsJson = localStorage.getItem(MEMORY_ITEMS_LOCAL_STORAGE_KEY);
    if (itemsJson) {
      try {
        const parsedItems = JSON.parse(itemsJson) as MemoryItem[];
        setMemoryItems(parsedItems.sort((a,b) => b.timestamp - a.timestamp)); // Show newest first
      } catch (error) {
        console.error("Error parsing memory items from localStorage:", error);
        toast({ title: "Error", description: "Could not load memory items.", variant: "destructive"});
        localStorage.removeItem(MEMORY_ITEMS_LOCAL_STORAGE_KEY); // Clear corrupted data
      }
    } else {
      setMemoryItems([]);
    }
  }, [toast]);

  useEffect(() => {
    loadMemoryItems();
  }, [loadMemoryItems]);

  const deleteMemoryItem = (itemId: string) => {
    if (typeof window === 'undefined') return;
    const updatedItems = memoryItems.filter(item => item.id !== itemId);
    localStorage.setItem(MEMORY_ITEMS_LOCAL_STORAGE_KEY, JSON.stringify(updatedItems));
    setMemoryItems(updatedItems);
    toast({ title: "Item Deleted", description: "The memory item has been removed.", icon: <CheckCircle className="h-5 w-5 text-green-500" /> });
  };

  const clearAllMemory = () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(MEMORY_ITEMS_LOCAL_STORAGE_KEY);
    setMemoryItems([]);
    toast({ title: "Memory Cleared", description: "All locally stored memory items have been deleted.", icon: <CheckCircle className="h-5 w-5 text-green-500" /> });
  };

  return (
    <>
      <PageHeader title="View AI Memory" />
      <div className="container mx-auto max-w-3xl py-8">
        <Card className="shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Brain className="h-8 w-8 text-primary" />
                <CardTitle className="font-headline text-2xl">Locally Stored AI Memory</CardTitle>
              </div>
              {memoryItems.length > 0 && (
                 <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="mr-2 h-4 w-4" /> Clear All Memory
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                       <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-6 w-6 text-destructive" />
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                       </div>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete all locally stored memory items from your browser. It will not affect any AI model's core knowledge.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={clearAllMemory} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                        Yes, delete all
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
            <CardDescription>
              Browse and manage text snippets and PDF references notionally uploaded to the AI's memory. These items are stored in your browser's local storage.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {memoryItems.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Brain size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No Memory Items Yet</p>
                <p>Items you upload via "Memory Upload" will appear here.</p>
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-var(--header-height)-22rem)] pr-3">
                <div className="space-y-4">
                  {memoryItems.map((item) => (
                    <Card key={item.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center space-x-2 mb-1">
                            {item.type === 'text' ? <FileText className="h-5 w-5 text-primary" /> : <FileType className="h-5 w-5 text-primary" />}
                            <CardTitle className="text-md font-semibold">
                              {item.type === 'text' ? 'Text Snippet' : `PDF: ${item.fileName}`}
                            </CardTitle>
                          </div>
                           <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                                  <Trash2 size={14} />
                                  <span className="sr-only">Delete item</span>
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete this memory item?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this {item.type} item? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteMemoryItem(item.id)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Stored: {new Date(item.timestamp).toLocaleString()}
                        </p>
                      </CardHeader>
                      {item.type === 'text' && item.content && (
                        <CardContent className="pt-0 pb-3">
                          <ScrollArea className="max-h-28">
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                              {item.content.length > 300 ? `${item.content.substring(0, 300)}...` : item.content}
                            </p>
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

    