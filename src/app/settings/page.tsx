
'use client';

import React, { useState } from 'react';
import { Settings, User, Brain, Palette, ExternalLink, Cloud, Loader2, AlertCircle, CheckCircle, Save, Github } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { savePersonalitySettingsAction } from '@/actions/settingsActions';
import type { InitialPromptSetupInput } from '@/ai/flows/initial-prompt-setup';
import { PageHeader } from '@/components/page-header';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";


export default function SettingsPage() {
  const [personalitySettings, setPersonalitySettings] = useState<InitialPromptSetupInput>({
    personalNeeds: '',
    professionalNeeds: '',
  });
  const [isLoadingPersonality, setIsLoadingPersonality] = useState(false);
  const [personaDescription, setPersonaDescription] = useState('');
  const { toast } = useToast();

  const handlePersonalityChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPersonalitySettings({ ...personalitySettings, [e.target.name]: e.target.value });
  };

  const handleSavePersonality = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!personalitySettings.personalNeeds.trim() && !personalitySettings.professionalNeeds.trim()) {
      toast({
        title: 'Input Required',
        description: 'Please describe at least one personal or professional need.',
        variant: 'destructive',
      });
      return;
    }
    setIsLoadingPersonality(true);
    setPersonaDescription('');
    const result = await savePersonalitySettingsAction(personalitySettings);
    setIsLoadingPersonality(false);

    if ('error' in result) {
      toast({
        title: 'Save Failed',
        description: result.error,
        variant: 'destructive',
        icon: <AlertCircle className="h-5 w-5" />,
      });
    } else {
      setPersonaDescription(result.aiPersonaDescription);
      toast({
        title: 'Personality Saved',
        description: "AI's personality settings have been updated.",
        icon: <CheckCircle className="h-5 w-5" />,
      });
    }
  };

  const handlePlaceholderClick = (featureName: string) => {
    toast({
      title: "Feature Not Implemented",
      description: `${featureName} integration is a placeholder for future development.`,
      duration: 3000,
    });
  };

  return (
    <>
      <PageHeader title="Settings" />
      <div className="container mx-auto max-w-3xl py-8 space-y-8">
        
        <Card className="shadow-xl">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <User className="h-6 w-6 text-primary" />
              <CardTitle className="font-headline text-xl">User Account</CardTitle>
            </div>
            <CardDescription>Manage your account details and preferences.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue="porucznikswext@gmail.com" disabled />
            </div>
             <div className="space-y-1">
              <Label>Theme</Label>
              <div className="flex items-center justify-between rounded-md border p-3">
                <p className="text-sm text-muted-foreground">Choose your preferred interface theme.</p>
                <ThemeToggle />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xl">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Brain className="h-6 w-6 text-primary" />
              <CardTitle className="font-headline text-xl">Advanced AI Personality Settings</CardTitle>
            </div>
            <CardDescription>
              Define personal and professional needs for the AI to remember, shaping its response behavior and persona.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSavePersonality}>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="personalNeeds">Personal Needs & Preferences</Label>
                <Textarea
                  id="personalNeeds"
                  name="personalNeeds"
                  placeholder="e.g., Likes concise answers, prefers a friendly tone, interested in space exploration..."
                  value={personalitySettings.personalNeeds}
                  onChange={handlePersonalityChange}
                  rows={4}
                  className="focus-visible:ring-primary"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="professionalNeeds">Professional Needs & Context</Label>
                <Textarea
                  id="professionalNeeds"
                  name="professionalNeeds"
                  placeholder="e.g., Works as a software developer, primary language is Python, often needs help with API documentation..."
                  value={personalitySettings.professionalNeeds}
                  onChange={handlePersonalityChange}
                  rows={4}
                  className="focus-visible:ring-primary"
                />
              </div>
              {personaDescription && (
                <div className="rounded-md border bg-muted/30 p-4">
                  <p className="text-sm font-medium text-primary mb-1">Generated AI Persona Description:</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{personaDescription}</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoadingPersonality}>
                {isLoadingPersonality ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving Personality...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Personality Settings
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
        
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-integrations">
            <AccordionTrigger className="font-headline text-lg">
               <div className="flex items-center">
                <ExternalLink className="mr-2 h-5 w-5 text-primary" /> Connected Services & Integrations
               </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 p-4">
               <p className="text-sm text-muted-foreground mb-4">
                Manage connections to external services to enhance AI capabilities. These are currently placeholders for future development.
              </p>
              <Button variant="outline" className="w-full justify-start" onClick={() => handlePlaceholderClick('Google Account')}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M12.545 5.516C13.37 3.435 15.32 2 17.5 2A4.5 4.5 0 0 1 22 6.5c0 2.18-1.435 4.13-3.516 4.955L12 22 5.516 11.455C3.435 10.63 2 8.68 2 6.5A4.5 4.5 0 0 1 6.5 2c2.18 0 4.13 1.435 4.955 3.516L12 12Z"/></svg>
                Connect Google Account
              </Button>
               <Button variant="outline" className="w-full justify-start" onClick={() => handlePlaceholderClick('Google Drive')}>
                 <Cloud className="mr-2 h-4 w-4" /> Connect Google Drive
              </Button>
               <Button variant="outline" className="w-full justify-start" onClick={() => handlePlaceholderClick('GitHub Account')}>
                 <Github className="mr-2 h-4 w-4" /> Connect GitHub Account
              </Button>
               <Button variant="outline" className="w-full justify-start" onClick={() => handlePlaceholderClick('OpenAI/ChatGPT Account')}>
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                   <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                   <polyline points="14 2 14 8 20 8" />
                   <path d="m10.303 12.293.002-.002L9.5 15.5h1l.803-3.207-.002.002h.002A2.25 2.25 0 1 1 13.5 12h-3.195Z" />
                 </svg>
                Connect OpenAI/ChatGPT Account
              </Button>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-advanced">
            <AccordionTrigger className="font-headline text-lg">
              <div className="flex items-center">
                <Settings className="mr-2 h-5 w-5 text-primary" /> Advanced Panel Settings
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 p-4">
              <p className="text-sm text-muted-foreground">
                Future settings for panel customization, notifications, and other advanced application behaviors will appear here.
              </p>
              <Button variant="outline" className="w-full justify-start" onClick={() => handlePlaceholderClick('Panel Layout Options')}>Panel Layout Options</Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => handlePlaceholderClick('Notification Preferences')}>Notification Preferences</Button>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

      </div>
    </>
  );
}
