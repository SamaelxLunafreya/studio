'use client';

import React, { useState, useEffect } from 'react';
import { Search, Globe, Loader2, AlertCircle, CheckCircle, LanguagesIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { searchWebAction } from '@/actions/searchActions';
import { PageHeader } from '@/components/page-header';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SummaryLanguage = 'Polish' | 'English';
const SUMMARY_LANGUAGE_STORAGE_KEY = 'webSearchSummaryLanguagePreference';


export default function WebSearchPage() {
  const [query, setQuery] = useState('');
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentSummaryLanguage, setCurrentSummaryLanguage] = useState<SummaryLanguage>('English');
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem(SUMMARY_LANGUAGE_STORAGE_KEY) as SummaryLanguage | null;
      if (savedLang) {
        setCurrentSummaryLanguage(savedLang);
      }
    }
  }, []);

  const handleLanguageChange = (lang: SummaryLanguage) => {
    setCurrentSummaryLanguage(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem(SUMMARY_LANGUAGE_STORAGE_KEY, lang);
      toast({
        title: lang === 'Polish' ? 'Język Podsumowania Zmieniony' : 'Summary Language Changed',
        description: lang === 'Polish' ? 'Podsumowania będą teraz generowane po polsku.' : 'Summaries will now be generated in English.',
      });
    }
  };

  const handleSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!query.trim()) {
      toast({
        title: 'Query Required',
        description: 'Please enter a search query.',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);
    setSummary(''); // Clear previous result
    const result = await searchWebAction(query, currentSummaryLanguage);
    setIsLoading(false);

    if ('error' in result) {
      toast({
        title: 'Search Failed',
        description: result.error,
        variant: 'destructive',
        icon: <AlertCircle className="h-5 w-5" />,
      });
    } else {
      setSummary(result.summary);
      toast({
        title: 'Search Complete',
        description: 'Summary of search results retrieved.',
        icon: <CheckCircle className="h-5 w-5" />,
      });
    }
  };

  return (
    <>
      <PageHeader title="AI-Assisted Web Search" />
      <div className="container mx-auto max-w-2xl py-8">
        <Card className="shadow-xl">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Globe className="h-8 w-8 text-primary" />
              <CardTitle className="font-headline text-2xl">AI-Assisted Web Search</CardTitle>
            </div>
            <CardDescription>
              Search the web using AI to get summarized information and insights on your query.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSearch}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="searchQuery">Search Query</Label>
                <Input
                  id="searchQuery"
                  type="search"
                  placeholder="Enter your search query..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  required
                  className="flex-grow focus-visible:ring-primary"
                />
              </div>
               <div className="space-y-2">
                <Label htmlFor="summaryLanguage">Summary Language</Label>
                 <Select value={currentSummaryLanguage} onValueChange={(value: string) => handleLanguageChange(value as SummaryLanguage)}>
                    <SelectTrigger className="w-full h-10 text-sm focus-visible:ring-primary" aria-label="Select Summary Language">
                        <LanguagesIcon size={16} className="mr-2 text-muted-foreground" />
                        <SelectValue placeholder="Summary Language" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="English">English Summary</SelectItem>
                        <SelectItem value="Polish">Polish Summary (Polskie Podsumowanie)</SelectItem>
                    </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter>
               <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Search className="mr-2 h-4 w-4" />
                )}
                Search
              </Button>
            </CardFooter>
          </form>

          {isLoading && (
            <CardContent className="flex justify-center items-center py-10">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </CardContent>
          )}

          {summary && !isLoading && (
            <>
              <Separator className="my-4" />
              <CardContent>
                <h3 className="font-headline text-xl mb-2">Search Summary</h3>
                <ScrollArea className="h-64 rounded-md border bg-muted/30 p-4">
                  <p className="text-sm whitespace-pre-wrap">{summary}</p>
                </ScrollArea>
              </CardContent>
            </>
          )}
           {!summary && !isLoading && (
            <CardContent className="text-center text-muted-foreground py-10">
              <Search size={48} className="mx-auto mb-2" />
              <p>Enter a query to start searching. You can select the summary language above.</p>
            </CardContent>
          )}
        </Card>
      </div>
    </>
  );
}
