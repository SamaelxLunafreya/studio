
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ImagePlay, Wand2, Loader2, AlertCircle, Download, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/page-header';
import { generateImageAction } from '@/actions/imageActions';
import type { GenerateImageInput } from '@/ai/flows/generate-image-flow';
import { Separator } from '@/components/ui/separator';

export default function ImageGeneratorPage() {
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!prompt.trim()) {
      toast({
        title: 'Prompt Required',
        description: 'Please enter a prompt to generate an image.',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);
    setGeneratedImage(null);

    const input: GenerateImageInput = { prompt };
    const result = await generateImageAction(input);
    setIsLoading(false);

    if (result && 'error' in result) {
      toast({
        title: 'Image Generation Failed',
        description: result.error,
        variant: 'destructive',
        icon: <AlertCircle className="h-5 w-5" />,
      });
    } else if (result && result.imageDataUri) {
      setGeneratedImage(result.imageDataUri);
      toast({
        title: 'Image Generated',
        description: 'AI has successfully generated your image.',
        icon: <CheckCircle className="h-5 w-5" />,
      });
    } else {
       toast({
        title: 'Image Generation Issue',
        description: 'The AI did not return an image. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadImage = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `generated-image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: 'Image Downloading', description: 'Your image has started downloading.'});
  };

  return (
    <>
      <PageHeader title="AI Image Generator" />
      <div className="container mx-auto max-w-2xl py-8">
        <Card className="shadow-xl">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <ImagePlay className="h-8 w-8 text-primary" />
              <CardTitle className="font-headline text-2xl">AI Image Generator</CardTitle>
            </div>
            <CardDescription>
              Describe the image you want to create, and Lunafreya will bring it to life.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="prompt">Image Prompt</Label>
                <Textarea
                  id="prompt"
                  placeholder="e.g., A futuristic cityscape at sunset, A cat wearing a tiny wizard hat, Abstract painting of musical notes..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={3}
                  required
                  className="focus-visible:ring-primary"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Image...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generate Image
                  </>
                )}
              </Button>
            </CardFooter>
          </form>

          {isLoading && (
            <CardContent className="flex justify-center items-center py-10">
              <div className="flex flex-col items-center space-y-2">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground">Creating your masterpiece...</p>
              </div>
            </CardContent>
          )}

          {generatedImage && !isLoading && (
            <>
              <Separator className="my-4" />
              <CardContent className="space-y-4">
                <h3 className="font-headline text-xl text-center">Generated Image</h3>
                <div className="relative aspect-square w-full max-w-md mx-auto overflow-hidden rounded-lg border shadow-md bg-muted/30">
                  <Image
                    src={generatedImage}
                    alt="AI generated image"
                    layout="fill"
                    objectFit="contain"
                    data-ai-hint="generated art"
                  />
                </div>
                <Button onClick={handleDownloadImage} variant="outline" className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Download Image
                </Button>
              </CardContent>
            </>
          )}
          {!generatedImage && !isLoading && (
             <CardContent className="text-center text-muted-foreground py-10">
                <ImagePlay size={48} className="mx-auto mb-2" />
                <p>Enter a prompt to generate an image.</p>
            </CardContent>
          )}
        </Card>
      </div>
    </>
  );
}
