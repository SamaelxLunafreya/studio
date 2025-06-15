'use client';

import React, { useState } from 'react';
import { Edit3, Wand2, Loader2, AlertCircle, CheckCircle, ClipboardCopy, ClipboardCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { enhanceTextAction } from '@/actions/textEnhancementActions';
import { PageHeader } from '@/components/page-header';
import { Separator } from '@/components/ui/separator';

export default function TextEnhancerPage() {
  const [inputText, setInputText] = useState('');
  const [enhancedText, setEnhancedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const { toast } = useToast();

  const handleEnhanceText = async () => {
    if (!inputText.trim()) {
      toast({
        title: 'Input Required',
        description: 'Please enter some text to enhance.',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);
    setEnhancedText(''); // Clear previous result
    const result = await enhanceTextAction(inputText);
    setIsLoading(false);

    if ('error' in result) {
      toast({
        title: 'Enhancement Failed',
        description: result.error,
        variant: 'destructive',
        icon: <AlertCircle className="h-5 w-5" />,
      });
    } else {
      setEnhancedText(result.enhancedText);
      toast({
        title: 'Text Enhanced',
        description: 'Your text has been successfully polished.',
        icon: <CheckCircle className="h-5 w-5" />,
      });
    }
  };

  const handleCopyToClipboard = () => {
    if (!enhancedText) return;
    navigator.clipboard.writeText(enhancedText).then(() => {
      setHasCopied(true);
      toast({ title: 'Copied!', description: 'Enhanced text copied to clipboard.' });
      setTimeout(() => setHasCopied(false), 2000);
    }).catch(err => {
      toast({ title: 'Copy Failed', description: 'Could not copy text to clipboard.', variant: 'destructive' });
      console.error('Failed to copy text: ', err);
    });
  };

  return (
    <>
      <PageHeader title="English Language Polisher" />
      <div className="container mx-auto max-w-3xl py-8">
        <Card className="shadow-xl">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Wand2 className="h-8 w-8 text-primary" />
              <CardTitle className="font-headline text-2xl">English Language Polisher</CardTitle>
            </div>
            <CardDescription>
              Improve your English writing with AI. This tool enhances clarity, grammar, and style.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="inputText">Original Text</Label>
              <Textarea
                id="inputText"
                placeholder="Enter the text you want to polish..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                rows={10}
                className="focus-visible:ring-primary"
              />
            </div>
            <div className="flex justify-center">
              <Button onClick={handleEnhanceText} disabled={isLoading} size="lg">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Polishing...
                  </>
                ) : (
                  <>
                    <Edit3 className="mr-2 h-5 w-5" />
                    Polish Text
                  </>
                )}
              </Button>
            </div>
            {enhancedText && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="enhancedText">Enhanced Text</Label>
                    <Button variant="ghost" size="sm" onClick={handleCopyToClipboard} disabled={!enhancedText}>
                      {hasCopied ? <ClipboardCheck className="mr-2 h-4 w-4" /> : <ClipboardCopy className="mr-2 h-4 w-4" />}
                      {hasCopied ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                  <Textarea
                    id="enhancedText"
                    value={enhancedText}
                    readOnly
                    rows={10}
                    className="bg-muted/50 focus-visible:ring-primary"
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
