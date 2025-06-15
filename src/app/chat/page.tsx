'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Mic, Volume2, CornerDownLeft, AlertCircle, Bot, User, Lightbulb, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { handleChatMessageAction, getIntelligentSuggestionsAction } from '@/actions/chatActions';
import type { CollaborateWithAiOutput } from '@/ai/flows/collaborate-with-ai';
import { PageHeader } from '@/components/page-header';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: Date;
  suggestions?: string[];
  isError?: boolean;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollViewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      }
    }
  };

  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      const recognition = recognitionRef.current;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
             // Keep updating input value with interim results for better UX
            setInputValue(prev => prev.substring(0, prev.length - (event.results[i-1]?.[0].transcript.length ?? 0)) + event.results[i][0].transcript);
          }
        }
        if (finalTranscript) {
            setInputValue(prev => prev + finalTranscript); // Append final transcript
        }
      };
      recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        toast({ title: 'Voice Input Error', description: event.error === 'no-speech' ? 'No speech detected.' : 'An error occurred during speech recognition.', variant: 'destructive' });
        setIsListening(false);
      };
      recognition.onend = () => setIsListening(false);
    } else {
      console.warn('Speech Recognition API not supported in this browser.');
    }
    return () => recognitionRef.current?.abort();
  }, [toast]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast({ title: 'Voice Input Not Supported', description: 'Your browser does not support speech recognition.', variant: 'destructive' });
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setInputValue(''); // Clear input before starting new recognition
      recognitionRef.current.start();
    }
    setIsListening(!isListening);
  };

  const speakText = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel(); // Stop any previous speech
      }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    } else {
      toast({ title: 'Text-to-Speech Not Supported', description: 'Your browser does not support speech synthesis.', variant: 'destructive' });
    }
  };

  const fetchSuggestions = useCallback(async (context: string) => {
    const userGoals = "Engage in a productive and insightful conversation."; // Could be dynamic
    const result = await getIntelligentSuggestionsAction(context, userGoals);
    if ('error' in result) {
      // Don't show toast for suggestion errors to avoid clutter
      console.error("Failed to fetch suggestions:", result.error);
      setSuggestions([]);
    } else {
      setSuggestions(result.suggestedActions.slice(0, 3)); // Limit to 3 suggestions
    }
  }, []);

  const handleSendMessage = useCallback(async (messageText?: string) => {
    const textToSend = (messageText || inputValue).trim();
    if (!textToSend) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', text: textToSend, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setSuggestions([]); // Clear old suggestions

    const aiResponse = await handleChatMessageAction(textToSend);
    setIsLoading(false);

    if ('error' in aiResponse) {
      const errorMessage: Message = { id: Date.now().toString() + '-error', role: 'ai', text: aiResponse.error, timestamp: new Date(), isError: true };
      setMessages(prev => [...prev, errorMessage]);
      toast({ title: 'AI Error', description: aiResponse.error, variant: 'destructive' });
    } else {
      // For collaborateWithAi, we can format the response. For now, using the summary.
      // Or, if collaborativeIdeas is rich, iterate and present them.
      // Let's use the summary as the main response for simplicity.
      const aiResponseMessage: Message = { id: (aiResponse as CollaborateWithAiOutput).summary, role: 'ai', text: (aiResponse as CollaborateWithAiOutput).summary, timestamp: new Date() };
      setMessages(prev => [...prev, aiResponseMessage]);
      
      // Fetch suggestions based on the new context
      const conversationContext = [...messages, userMessage, aiResponseMessage]
        .slice(-5) // Use last 5 messages for context
        .map(m => `${m.role}: ${m.text}`)
        .join('\n');
      fetchSuggestions(conversationContext);
    }
  }, [inputValue, messages, toast, fetchSuggestions]);

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    handleSendMessage(suggestion);
  };

  return (
    <>
      <PageHeader title="AI Chat" />
      <div className="flex h-[calc(100vh-var(--header-height)-2rem)] flex-col"> {/* Adjust height based on actual header height */}
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-6">
            {messages.map((msg) => (
              <div key={msg.id} className={cn('flex items-start gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                {msg.role === 'ai' && (
                  <Avatar className="h-9 w-9 border border-primary/20">
                    <AvatarFallback><Bot size={20} className="text-primary" /></AvatarFallback>
                  </Avatar>
                )}
                <div className={cn(
                  'max-w-[70%] rounded-xl p-3 shadow-md',
                  msg.role === 'user' ? 'bg-primary text-primary-foreground' : (msg.isError ? 'bg-destructive text-destructive-foreground' : 'bg-card'),
                  msg.isError && 'border border-destructive/50'
                )}>
                  <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-xs opacity-70">{msg.timestamp.toLocaleTimeString()}</span>
                    {msg.role === 'ai' && !msg.isError && (
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => speakText(msg.text)}>
                        <Volume2 size={16} />
                        <span className="sr-only">Speak</span>
                      </Button>
                    )}
                  </div>
                </div>
                {msg.role === 'user' && (
                  <Avatar className="h-9 w-9">
                    <AvatarFallback><User size={20} /></AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-3 justify-start">
                <Avatar className="h-9 w-9 border border-primary/20">
                   <AvatarFallback><Bot size={20} className="text-primary" /></AvatarFallback>
                </Avatar>
                <div className="max-w-[70%] rounded-xl bg-card p-3 shadow-md">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        {suggestions.length > 0 && (
          <div className="p-4 border-t">
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium flex items-center mr-2 text-muted-foreground"><Lightbulb size={16} className="mr-1 text-primary"/>Suggestions:</span>
              {suggestions.map((s, i) => (
                <Button key={i} variant="outline" size="sm" onClick={() => handleSuggestionClick(s)}>
                  {s}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="border-t p-4">
          <div className="relative flex items-center gap-2">
            <Textarea
              placeholder="Type your message or use voice input..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              rows={1}
              className="min-h-[48px] flex-1 resize-none rounded-full border-input bg-background pr-20 shadow-sm focus-visible:ring-primary"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex gap-1">
              <Button type="button" size="icon" variant="ghost" onClick={toggleListening} className={cn(isListening && "bg-destructive/20 text-destructive")}>
                <Mic className="h-5 w-5" />
                <span className="sr-only">{isListening ? 'Stop Listening' : 'Start Listening'}</span>
              </Button>
              <Button type="submit" size="icon" variant="ghost" onClick={() => handleSendMessage()} disabled={isLoading || !inputValue.trim()}>
                <Send className="h-5 w-5" />
                <span className="sr-only">Send</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
