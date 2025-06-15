'use client';

import React, { useState } from 'react';
import { Search, Globe, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { searchWebAction } from '@/actions/searchActions';
import { PageHeader } from '@/components/page-header';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function WebSearchPage() {
  const [query, setQuery] = useState('');
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

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
    const result = await searchWebAction(query);
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
                <div className="flex space-x-2">
                  <Input
                    id="searchQuery"
                    type="search"
                    placeholder="Enter your search query..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    required
                    className="flex-grow focus-visible:ring-primary"
                  />
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="mr-2 h-4 w-4" />
                    )}
                    Search
                  </Button>
                </div>
              </div>
            </CardContent>
          </form>

          {summary && (
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
              <p>Enter a query to start searching.</p>
            </CardContent>
          )}
        </Card>
      </div>
    </>
  );
}
