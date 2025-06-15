'use client';

import React, { useState } from 'react';
import { UploadCloud, FileText, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { uploadToMemoryAction } from '@/actions/memoryActions';
import { fileToDataUri } from '@/lib/utils';
import { PageHeader } from '@/components/page-header';

export default function MemoryUploadPage() {
  const [textContent, setTextContent] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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
        event.target.value = ''; // Reset file input
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: 'File Too Large',
          description: 'PDF file size should not exceed 5MB.',
          variant: 'destructive',
        });
        setPdfFile(null);
        event.target.value = ''; // Reset file input
        return;
      }
      setPdfFile(file);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!textContent && !pdfFile) {
      toast({
        title: 'No Content Provided',
        description: 'Please provide text content or select a PDF file to upload.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    let pdfDataUri: string | undefined = undefined;
    if (pdfFile) {
      try {
        pdfDataUri = await fileToDataUri(pdfFile);
      } catch (error) {
        toast({
          title: 'Error Reading File',
          description: 'Could not process the PDF file.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }
    }

    const result = await uploadToMemoryAction({ text: textContent, pdfDataUri });
    setIsLoading(false);

    if ('error' in result) {
      toast({
        title: 'Upload Failed',
        description: result.error,
        variant: 'destructive',
        icon: <AlertCircle className="h-5 w-5" />,
      });
    } else {
      toast({
        title: 'Upload Successful',
        description: result.message,
        icon: <CheckCircle className="h-5 w-5" />,
      });
      setTextContent('');
      setPdfFile(null);
      // Reset file input visually
      const fileInput = document.getElementById('pdfFile') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    }
  };

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
              Add text snippets or PDF documents to the AI's memory modules. This helps the AI learn and provide more personalized and relevant responses.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="textContent" className="flex items-center">
                  <FileText className="mr-2 h-5 w-5 text-muted-foreground" />
                  Text Content (Optional)
                </Label>
                <Textarea
                  id="textContent"
                  placeholder="Paste or type text content here..."
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  rows={8}
                  className="focus-visible:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pdfFile" className="flex items-center">
                  <UploadCloud className="mr-2 h-5 w-5 text-muted-foreground" />
                  Upload PDF (Optional, Max 5MB)
                </Label>
                <Input
                  id="pdfFile"
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="file:mr-4 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20 focus-visible:ring-primary"
                />
                {pdfFile && (
                  <p className="text-sm text-muted-foreground">Selected: {pdfFile.name}</p>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <UploadCloud className="mr-2 h-4 w-4" />
                    Upload to Memory
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
