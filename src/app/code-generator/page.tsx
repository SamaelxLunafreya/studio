'use client';

import React, { useState } from 'react';
import { Code2, TerminalSquare, Wand2, Loader2, AlertCircle, CheckCircle, ClipboardCopy, ClipboardCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { generateCodeAction } from '@/actions/codingActions';
import type { GenerateCodeSnippetsInput } from '@/ai/flows/generate-code-snippets';
import { PageHeader } from '@/components/page-header';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function CodeGeneratorPage() {
  const [formState, setFormState] = useState<GenerateCodeSnippetsInput>({
    programmingLanguage: '',
    codeDescription: '',
    codeOptimizationGoal: '',
    existingCode: '',
  });
  const [generatedOutput, setGeneratedOutput] = useState<{ code: string; explanation: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasCopiedCode, setHasCopiedCode] = useState(false);
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormState({ ...formState, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formState.programmingLanguage || !formState.codeDescription) {
      toast({
        title: 'Missing Fields',
        description: 'Please provide programming language and code description.',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);
    setGeneratedOutput(null);
    const result = await generateCodeAction(formState);
    setIsLoading(false);

    if ('error' in result) {
      toast({
        title: 'Generation Failed',
        description: result.error,
        variant: 'destructive',
        icon: <AlertCircle className="h-5 w-5" />,
      });
    } else {
      setGeneratedOutput({ code: result.generatedCode, explanation: result.explanation });
      toast({
        title: 'Code Generated',
        description: 'AI has generated the code snippet and explanation.',
        icon: <CheckCircle className="h-5 w-5" />,
      });
    }
  };
  
  const handleCopyToClipboard = (textToCopy: string, type: 'code' | 'explanation') => {
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy).then(() => {
      if (type === 'code') setHasCopiedCode(true);
      toast({ title: 'Copied!', description: `${type === 'code' ? 'Code' : 'Explanation'} copied to clipboard.` });
      setTimeout(() => {
        if (type === 'code') setHasCopiedCode(false);
      }, 2000);
    }).catch(err => {
      toast({ title: 'Copy Failed', description: `Could not copy ${type}.`, variant: 'destructive' });
      console.error(`Failed to copy ${type}: `, err);
    });
  };


  return (
    <>
      <PageHeader title="Advanced Coding Toolbox" />
      <div className="container mx-auto max-w-4xl py-8">
        <Card className="shadow-xl">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <TerminalSquare className="h-8 w-8 text-primary" />
              <CardTitle className="font-headline text-2xl">Advanced Coding Toolbox</CardTitle>
            </div>
            <CardDescription>
              Generate, debug, and optimize code snippets with AI assistance. Specify language, describe functionality, and set optimization goals.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="programmingLanguage">Programming Language*</Label>
                  <Input
                    id="programmingLanguage"
                    name="programmingLanguage"
                    placeholder="e.g., Python, JavaScript, Java"
                    value={formState.programmingLanguage}
                    onChange={handleChange}
                    required
                    className="focus-visible:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="codeOptimizationGoal">Optimization Goal (Optional)</Label>
                  <Input
                    id="codeOptimizationGoal"
                    name="codeOptimizationGoal"
                    placeholder="e.g., speed, memory usage, readability"
                    value={formState.codeOptimizationGoal}
                    onChange={handleChange}
                    className="focus-visible:ring-primary"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="codeDescription">Code Description*</Label>
                <Textarea
                  id="codeDescription"
                  name="codeDescription"
                  placeholder="Describe what the code should do..."
                  value={formState.codeDescription}
                  onChange={handleChange}
                  rows={5}
                  required
                  className="focus-visible:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="existingCode">Existing Code (Optional - for debugging/optimization)</Label>
                <Textarea
                  id="existingCode"
                  name="existingCode"
                  placeholder="Paste existing code here if you need debugging or optimization..."
                  value={formState.existingCode}
                  onChange={handleChange}
                  rows={8}
                  className="font-code focus-visible:ring-primary"
                />
              </div>
              <div className="flex justify-center">
                <Button type="submit" disabled={isLoading} size="lg">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-5 w-5" />
                      Generate Code
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </form>

          {generatedOutput && (
            <>
              <Separator className="my-6" />
              <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-headline text-xl">Generated Code</h3>
                     <Button variant="ghost" size="sm" onClick={() => handleCopyToClipboard(generatedOutput.code, 'code')} disabled={!generatedOutput.code}>
                      {hasCopiedCode ? <ClipboardCheck className="mr-2 h-4 w-4" /> : <ClipboardCopy className="mr-2 h-4 w-4" />}
                      {hasCopiedCode ? 'Copied!' : 'Copy Code'}
                    </Button>
                  </div>
                  <ScrollArea className="h-80 rounded-md border bg-muted/30 p-4">
                    <pre><code className="font-code text-sm">{generatedOutput.code}</code></pre>
                  </ScrollArea>
                </div>
                <div>
                  <h3 className="font-headline text-xl mb-2">Explanation</h3>
                  <ScrollArea className="h-40 rounded-md border bg-muted/30 p-4">
                    <p className="text-sm whitespace-pre-wrap">{generatedOutput.explanation}</p>
                  </ScrollArea>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </>
  );
}
