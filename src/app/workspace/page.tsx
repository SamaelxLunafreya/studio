
'use client';

import React, { useState, useCallback } from 'react';
import { Palette, Lightbulb, MessageSquareText, PencilLine, Brain, Loader2, AlertCircle, CheckCircle, ClipboardCopy, ClipboardCheck, CopyPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/page-header';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { handleWorkspaceAction, type WorkspaceActionInput, type WorkspaceActionOutput } from '@/actions/workspaceActions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type WorkspaceMode = "BRAINSTORM" | "CONTINUE" | "SUGGEST_EDITS" | "EXPLAIN";

export default function WorkspacePage() {
  const [mainText, setMainText] = useState('');
  const [selectedText, setSelectedText] = useState('');
  const [aiOutput, setAiOutput] = useState<WorkspaceActionOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentMode, setCurrentMode] = useState<WorkspaceMode>("BRAINSTORM");
  const [hasCopiedAiOutput, setHasCopiedAiOutput] = useState(false);

  const { toast } = useToast();
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const handleTextSelection = () => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      setSelectedText(mainText.substring(start, end));
    }
  };

  const handleAiInteraction = useCallback(async (modeOverride?: WorkspaceMode) => {
    const modeToUse = modeOverride || currentMode;
    if (!mainText.trim() && (modeToUse === "CONTINUE" || modeToUse === "SUGGEST_EDITS" || (modeToUse === "EXPLAIN" && !selectedText))) {
      toast({
        title: 'Input Required',
        description: 'Please provide some text in the workspace, or select text for explanation.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setAiOutput(null);

    const input: WorkspaceActionInput = {
      text: mainText,
      mode: modeToUse,
      selection: (modeToUse === "EXPLAIN" && selectedText) ? selectedText : undefined,
    };

    const result = await handleWorkspaceAction(input);
    setIsLoading(false);

    if (result && 'error' in result) {
      toast({
        title: 'AI Interaction Failed',
        description: result.error,
        variant: 'destructive',
        icon: <AlertCircle className="h-5 w-5" />,
      });
    } else if (result) {
      setAiOutput(result);
      toast({
        title: 'AI Responded',
        description: `AI has processed your request in ${modeToUse.toLowerCase().replace('_', ' ')} mode.`,
        icon: <CheckCircle className="h-5 w-5" />,
      });
    }
  }, [mainText, currentMode, selectedText, toast]);

  const handleCopyToClipboard = (textToCopy: string | undefined) => {
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setHasCopiedAiOutput(true);
      toast({ title: 'Copied!', description: 'AI output copied to clipboard.' });
      setTimeout(() => setHasCopiedAiOutput(false), 2000);
    }).catch(err => {
      toast({ title: 'Copy Failed', description: 'Could not copy AI output.', variant: 'destructive' });
      console.error('Failed to copy AI output: ', err);
    });
  };
  
  const handleAppendToWorkspace = (textToAppend: string | undefined) => {
    if (!textToAppend) return;
    setMainText(prev => prev + '\n\n' + textToAppend);
    toast({ title: 'Appended!', description: 'AI output appended to workspace.' });
  };

  const getModeIcon = (mode: WorkspaceMode) => {
    switch (mode) {
      case "BRAINSTORM": return <Lightbulb className="mr-2 h-4 w-4" />;
      case "CONTINUE": return <MessageSquareText className="mr-2 h-4 w-4" />;
      case "SUGGEST_EDITS": return <PencilLine className="mr-2 h-4 w-4" />;
      case "EXPLAIN": return <Brain className="mr-2 h-4 w-4" />;
      default: return <Palette className="mr-2 h-4 w-4" />;
    }
  };

  return (
    <>
      <PageHeader title="Collaborative Workspace" />
      <div className="container mx-auto max-w-5xl py-8">
        <Card className="shadow-xl">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Palette className="h-8 w-8 text-primary" />
              <CardTitle className="font-headline text-2xl">Collaborative Workspace</CardTitle>
            </div>
            <CardDescription>
              Write, code, and brainstorm with AI assistance. Use the tools below to interact with your content.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Panel: Main Text Area */}
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="mainText">Your Workspace</Label>
                <Textarea
                  id="mainText"
                  ref={textareaRef}
                  placeholder="Start writing or paste your code/text here..."
                  value={mainText}
                  onChange={(e) => setMainText(e.target.value)}
                  onSelect={handleTextSelection}
                  rows={20}
                  className="focus-visible:ring-primary h-full min-h-[400px]"
                />
              </div>

              {/* Right Panel: AI Controls and Output */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="interactionMode">AI Interaction Mode</Label>
                  <Select
                    value={currentMode}
                    onValueChange={(value: WorkspaceMode) => setCurrentMode(value)}
                  >
                    <SelectTrigger id="interactionMode" className="w-full focus-visible:ring-primary">
                      <SelectValue placeholder="Select mode..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BRAINSTORM">
                        <div className="flex items-center"><Lightbulb className="mr-2 h-4 w-4" /> Brainstorm Ideas</div>
                      </SelectItem>
                      <SelectItem value="CONTINUE">
                        <div className="flex items-center"><MessageSquareText className="mr-2 h-4 w-4" /> Continue Writing/Coding</div>
                      </SelectItem>
                      <SelectItem value="SUGGEST_EDITS">
                        <div className="flex items-center"><PencilLine className="mr-2 h-4 w-4" /> Suggest Edits/Improvements</div>
                      </SelectItem>
                      <SelectItem value="EXPLAIN">
                         <div className="flex items-center"><Brain className="mr-2 h-4 w-4" /> Explain This {selectedText && `(Selected)`}</div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {currentMode === "EXPLAIN" && selectedText && (
                    <p className="text-xs text-muted-foreground mt-1">Explaining: "{selectedText.substring(0,30)}..."</p>
                  )}
                </div>
                
                <Button onClick={() => handleAiInteraction()} disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    getModeIcon(currentMode)
                  )}
                  {isLoading ? 'AI is thinking...' : `Engage AI (${currentMode.replace("_", " ")})`}
                </Button>

                <Separator />

                <div>
                  <Label>AI Output</Label>
                  {isLoading && (
                    <div className="rounded-md border bg-muted/30 p-4 min-h-[150px] flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  )}
                  {aiOutput && !isLoading && (
                    <Card className="mt-1">
                      <CardContent className="p-0">
                        <ScrollArea className="h-64 rounded-md border bg-muted/30 p-4">
                          {aiOutput.resultText && (
                            <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap">
                              <h4 className="font-medium">Result:</h4>
                              <p>{aiOutput.resultText}</p>
                            </div>
                          )}
                          {aiOutput.explanation && (
                            <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap mt-4">
                              <h4 className="font-medium">Explanation/Details:</h4>
                              <p>{aiOutput.explanation}</p>
                            </div>
                          )}
                        </ScrollArea>
                         <CardFooter className="p-2 border-t flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleCopyToClipboard(aiOutput.resultText || aiOutput.explanation)} 
                              disabled={!aiOutput.resultText && !aiOutput.explanation}
                            >
                              {hasCopiedAiOutput ? <ClipboardCheck className="mr-2 h-4 w-4" /> : <ClipboardCopy className="mr-2 h-4 w-4" />}
                              {hasCopiedAiOutput ? 'Copied!' : 'Copy Output'}
                            </Button>
                            {aiOutput.resultText && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleAppendToWorkspace(aiOutput.resultText)}
                                >
                                  <CopyPlus className="mr-2 h-4 w-4" /> Append to Workspace
                                </Button>
                            )}
                         </CardFooter>
                      </CardContent>
                    </Card>
                  )}
                  {!aiOutput && !isLoading && (
                     <div className="rounded-md border border-dashed border-muted-foreground/50 bg-muted/10 p-4 min-h-[150px] flex flex-col items-center justify-center text-center text-muted-foreground">
                        <Palette size={32} className="mb-2"/>
                        <p className="text-sm">AI's response will appear here.</p>
                        <p className="text-xs">Select a mode and click "Engage AI".</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
