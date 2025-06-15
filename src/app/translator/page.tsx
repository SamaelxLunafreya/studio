
'use client';

import React, { useState } from 'react';
import { Languages, ArrowRightLeft, Loader2, AlertCircle, CheckCircle, ClipboardCopy, ClipboardCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/page-header';
import { translateTextAction } from '@/actions/translationActions';
import type { TranslateTextInput } from '@/ai/flows/translate-text-flow';
import { Separator } from '@/components/ui/separator';

const targetLanguages = [
  { value: "Spanish", label: "Spanish" },
  { value: "French", label: "French" },
  { value: "German", label: "German" },
  { value: "Italian", label: "Italian" },
  { value: "Portuguese", label: "Portuguese" },
  { value: "Japanese", label: "Japanese" },
  { value: "Korean", label: "Korean" },
  { value: "Chinese (Simplified)", label: "Chinese (Simplified)" },
  { value: "Russian", label: "Russian" },
  { value: "Arabic", label: "Arabic" },
  { value: "Polish", label: "Polish" },
];

export default function TranslatorPage() {
  const [inputText, setInputText] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('Polish');
  const [translatedText, setTranslatedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!inputText.trim()) {
      toast({
        title: 'Input Required',
        description: 'Please enter text to translate.',
        variant: 'destructive',
      });
      return;
    }
    if (!targetLanguage) {
      toast({
        title: 'Language Required',
        description: 'Please select a target language.',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);
    setTranslatedText('');

    const input: TranslateTextInput = { text: inputText, targetLanguage };
    const result = await translateTextAction(input);
    setIsLoading(false);

    if (result && 'error' in result) {
      toast({
        title: 'Translation Failed',
        description: result.error,
        variant: 'destructive',
        icon: <AlertCircle className="h-5 w-5" />,
      });
    } else if (result && result.translatedText) {
      setTranslatedText(result.translatedText);
      toast({
        title: 'Translation Complete',
        description: `Text translated to ${targetLanguage}.`,
        icon: <CheckCircle className="h-5 w-5" />,
      });
    } else {
       toast({
        title: 'Translation Issue',
        description: 'The AI did not return a translation. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  const handleCopyToClipboard = () => {
    if (!translatedText) return;
    navigator.clipboard.writeText(translatedText).then(() => {
      setHasCopied(true);
      toast({ title: 'Copied!', description: 'Translated text copied to clipboard.' });
      setTimeout(() => setHasCopied(false), 2000);
    }).catch(err => {
      toast({ title: 'Copy Failed', description: 'Could not copy text.', variant: 'destructive' });
      console.error('Failed to copy text: ', err);
    });
  };

  return (
    <>
      <PageHeader title="AI Text Translator" />
      <div className="container mx-auto max-w-3xl py-8">
        <Card className="shadow-xl">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Languages className="h-8 w-8 text-primary" />
              <CardTitle className="font-headline text-2xl">AI Text Translator</CardTitle>
            </div>
            <CardDescription>
              Translate text into various languages with AI assistance.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="inputText">Text to Translate</Label>
                <Textarea
                  id="inputText"
                  placeholder="Enter text here..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  rows={6}
                  required
                  className="focus-visible:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetLanguage">Translate to</Label>
                <Select
                  value={targetLanguage}
                  onValueChange={setTargetLanguage}
                >
                  <SelectTrigger id="targetLanguage" className="w-full focus-visible:ring-primary">
                    <SelectValue placeholder="Select target language..." />
                  </SelectTrigger>
                  <SelectContent>
                    {targetLanguages.map(lang => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Translating...
                  </>
                ) : (
                  <>
                    <ArrowRightLeft className="mr-2 h-4 w-4" />
                    Translate Text
                  </>
                )}
              </Button>
            </CardFooter>
          </form>

          {translatedText && !isLoading && (
            <>
              <Separator className="my-4" />
              <CardContent className="space-y-2">
                 <div className="flex justify-between items-center">
                    <Label htmlFor="translatedText">Translated Text</Label>
                    <Button variant="ghost" size="sm" onClick={handleCopyToClipboard} disabled={!translatedText}>
                      {hasCopied ? <ClipboardCheck className="mr-2 h-4 w-4" /> : <ClipboardCopy className="mr-2 h-4 w-4" />}
                      {hasCopied ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                <Textarea
                  id="translatedText"
                  value={translatedText}
                  readOnly
                  rows={6}
                  className="bg-muted/50"
                />
              </CardContent>
            </>
          )}
           {!translatedText && !isLoading && (
             <CardContent className="text-center text-muted-foreground py-10">
                <Languages size={48} className="mx-auto mb-2" />
                <p>Enter text and select a language to translate.</p>
            </CardContent>
          )}
        </Card>
      </div>
    </>
  );
}
