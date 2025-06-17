
'use client';

import React, { useState } from 'react';
import { UploadCloud, FileText, Loader2, AlertCircle, CheckCircle, Database } from 'lucide-react'; // Added Database icon
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { uploadToMemoryAction, saveTextToPineconeAction } from '@/actions/memoryActions'; // Updated import
import { fileToDataUri } from '@/lib/utils';
import { PageHeader } from '@/components/page-header';

interface MemoryItem {
  id: string;
  type: 'text' | 'pdf' | 'pinecone_text'; // Added 'pinecone_text' type for local logging
  content?: string; 
  fileName?: string; 
  timestamp: number;
  pineconeRecordId?: string; // To store Pinecone record ID if saved
}

const MEMORY_ITEMS_LOCAL_STORAGE_KEY = 'lunafreyaMemoryItems';
const MAX_MEMORY_ITEMS = 50; 

export default function MemoryUploadPage() {
  const [textContent, setTextContent] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isLoadingText, setIsLoadingText] = useState(false);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.type !== 'application/pdf') {
        toast({
          title: 'Invalid File Type',
          description: 'Please select a PDF file.',
          variant: 'destructive',
        });
        setPdfFile(null);
        event.target.value = ''; 
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: 'File Too Large',
          description: 'PDF file size should not exceed 5MB.',
          variant: 'destructive',
        });
        setPdfFile(null);
        event.target.value = ''; 
        return;
      }
      setPdfFile(file);
    }
  };

  const saveItemToLocalStorage = (item: MemoryItem) => {
    if (typeof window === 'undefined') return;
    try {
      const existingItemsJson = localStorage.getItem(MEMORY_ITEMS_LOCAL_STORAGE_KEY);
      let existingItems: MemoryItem[] = existingItemsJson ? JSON.parse(existingItemsJson) : [];
      existingItems.unshift(item); 
      existingItems = existingItems.slice(0, MAX_MEMORY_ITEMS); 
      localStorage.setItem(MEMORY_ITEMS_LOCAL_STORAGE_KEY, JSON.stringify(existingItems));
    } catch (error) {
      console.error("Error saving memory item to localStorage:", error);
      toast({
        title: "Local Storage Error",
        description: "Could not save item to local memory view.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!textContent.trim() && !pdfFile) {
      toast({
        title: 'No Content Provided',
        description: 'Please provide text content or select a PDF file to upload.',
        variant: 'destructive',
      });
      return;
    }

    let textProcessed = false;
    let pdfProcessed = false;

    // 1. Process Text Content (Save to Pinecone)
    if (textContent.trim()) {
      setIsLoadingText(true);
      const pineconeResult = await saveTextToPineconeAction({ 
        textToSave: textContent, 
        source: 'Memory Upload Tool - Text Input' 
      });
      setIsLoadingText(false);

      if ('error' in pineconeResult) {
        toast({
          title: 'Pinecone Save Failed',
          description: pineconeResult.error,
          variant: 'destructive',
          icon: <AlertCircle className="h-5 w-5" />,
        });
      } else {
        toast({
          title: 'Text Saved to Pinecone',
          description: `Successfully saved text to AI's external memory. Record ID: ${pineconeResult.recordId || 'N/A'}`,
          icon: <CheckCircle className="h-5 w-5" />,
        });
        saveItemToLocalStorage({
          id: Date.now().toString() + '-pinecone-text',
          type: 'pinecone_text',
          content: textContent,
          timestamp: Date.now(),
          pineconeRecordId: pineconeResult.recordId,
        });
        setTextContent(''); // Clear only if successful
        textProcessed = true;
      }
    }

    // 2. Process PDF File (Simulated Upload)
    if (pdfFile) {
      setIsLoadingPdf(true);
      let pdfDataUri: string | undefined = undefined;
      try {
        pdfDataUri = await fileToDataUri(pdfFile);
      } catch (error) {
        toast({
          title: 'Error Reading PDF File',
          description: 'Could not process the PDF file for simulated upload.',
          variant: 'destructive',
        });
        setIsLoadingPdf(false);
        return; 
      }

      const simulatedUploadResult = await uploadToMemoryAction({ pdfDataUri }); // Only pass pdfDataUri to the simulated action
      setIsLoadingPdf(false);

      if ('error' in simulatedUploadResult) {
        toast({
          title: 'Simulated PDF Upload Failed',
          description: simulatedUploadResult.error,
          variant: 'destructive',
          icon: <AlertCircle className="h-5 w-5" />,
        });
      } else {
        toast({
          title: 'Simulated PDF Upload Acknowledged',
          description: `${simulatedUploadResult.message} (This is a simulated PDF processing). PDF also logged locally.`,
          icon: <CheckCircle className="h-5 w-5" />,
        });
        saveItemToLocalStorage({
          id: Date.now().toString() + '-pdf',
          type: 'pdf',
          fileName: pdfFile.name,
          timestamp: Date.now(),
        });
        setPdfFile(null);
        const fileInput = document.getElementById('pdfFile') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        pdfProcessed = true;
      }
    }
    
    // If neither was processed due to error, but form was initially valid
    if ((textContent.trim() && !textProcessed && !pdfFile) || (pdfFile && !pdfProcessed && !textContent.trim())) {
        // This case might happen if text save failed AND there was no PDF, or vice-versa
    } else if (!textContent.trim() && !pdfFile) {
        // This shouldn't be reached due to initial check, but as a safeguard
    }
  };
  
  const isLoading = isLoadingText || isLoadingPdf;

  return (
    <>
      <PageHeader title="Memory Upload" />
      <div className="container mx-auto max-w-2xl py-8">
        <Card className="shadow-xl">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <UploadCloud className="h-8 w-8 text-primary" />
              <CardTitle className="font-headline text-2xl">Upload to AI Memory</CardTitle>
            </div>
            <CardDescription>
              Add text snippets to the AI's permanent Pinecone memory or upload PDF documents (PDF upload is currently simulated and logged locally).
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="textContent" className="flex items-center">
                  <FileText className="mr-2 h-5 w-5 text-muted-foreground" />
                  Text Content (Saved to Pinecone)
                </Label>
                <Textarea
                  id="textContent"
                  placeholder="Paste or type text content here to save to Pinecone..."
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  rows={8}
                  className="focus-visible:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pdfFile" className="flex items-center">
                  <UploadCloud className="mr-2 h-5 w-5 text-muted-foreground" />
                  Upload PDF (Simulated, Max 5MB)
                </Label>
                <Input
                  id="pdfFile"
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="file:mr-4 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20 focus-visible:ring-primary"
                />
                {pdfFile && (
                  <p className="text-sm text-muted-foreground">Selected for simulated upload: {pdfFile.name}</p>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoadingText && !isLoadingPdf && (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving Text to Pinecone...</>
                )}
                {isLoadingPdf && !isLoadingText && (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing PDF (Simulated)...</>
                )}
                {isLoadingText && isLoadingPdf && (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing All...</>
                )}
                {!isLoading && (
                  <>
                    <Database className="mr-2 h-4 w-4" /> Process & Upload Memory
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </>
  );
}
