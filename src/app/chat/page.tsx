
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Send, Mic, Volume2, Bot, User, Lightbulb, Loader2, Save, PlusCircle, FileText, Power } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { handleChatMessageAction, getIntelligentSuggestionsAction, getAutonomousUpdateAction } from '@/actions/chatActions';
import type { CollaborateWithAiOutput } from '@/ai/flows/collaborate-with-ai';
import { PageHeader } from '@/components/page-header';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: Date;
  suggestions?: string[];
  isError?: boolean;
  isAutonomous?: boolean;
}

interface SavedChatSession {
  id: string;
  name: string;
  messages: Message[];
  savedAt: number;
}

const CHAT_HISTORY_LOCAL_STORAGE_KEY = 'chatHistory';
const AUTONOMOUS_MODE_STORAGE_KEY = 'autonomousModeEnabled';
const LUNAFREYA_GREETING_ID = 'lunafreya-initial-greeting';

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isAutonomousModeEnabled, setIsAutonomousModeEnabled] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const autonomousIntervalRef = useRef<NodeJS.Timeout | null>(null);
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

  // Load autonomous mode setting from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem(AUTONOMOUS_MODE_STORAGE_KEY);
      setIsAutonomousModeEnabled(savedMode === 'true');
    }
  }, []);

  // Effect for handling autonomous updates
  useEffect(() => {
    if (isAutonomousModeEnabled) {
      autonomousIntervalRef.current = setInterval(async () => {
        const result = await getAutonomousUpdateAction();
        if ('error' in result) {
          console.error("Autonomous update error:", result.error);
        } else {
          const autonomousMessage: Message = {
            id: Date.now().toString() + '-autonomous',
            role: 'ai',
            text: `Lunafreya's thought: ${result.thought}`,
            timestamp: new Date(),
            isAutonomous: true,
          };
          setMessages(prev => [...prev, autonomousMessage]);
        }
      }, 30000); // 30 seconds
    } else {
      if (autonomousIntervalRef.current) {
        clearInterval(autonomousIntervalRef.current);
        autonomousIntervalRef.current = null;
      }
    }
    // Cleanup interval on component unmount or when mode is disabled
    return () => {
      if (autonomousIntervalRef.current) {
        clearInterval(autonomousIntervalRef.current);
      }
    };
  }, [isAutonomousModeEnabled]);

  const handleAutonomousModeToggle = (enabled: boolean) => {
    setIsAutonomousModeEnabled(enabled);
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTONOMOUS_MODE_STORAGE_KEY, enabled.toString());
      toast({
        title: `Autonomous Mode ${enabled ? 'Enabled' : 'Disabled'}`,
        description: enabled ? "Lunafreya will now offer proactive thoughts." : "Autonomous updates are off.",
      });
    }
  };


  const getChatHistory = useCallback((): SavedChatSession[] => {
    if (typeof window === 'undefined') return [];
    const historyJson = localStorage.getItem(CHAT_HISTORY_LOCAL_STORAGE_KEY);
    if (historyJson) {
      try {
        const parsedHistory = JSON.parse(historyJson) as SavedChatSession[];
        return parsedHistory.map(session => ({
          ...session,
          messages: session.messages.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp) 
          }))
        }));
      } catch (error) {
        console.error("Error parsing chat history from localStorage:", error);
        localStorage.removeItem(CHAT_HISTORY_LOCAL_STORAGE_KEY); 
        return [];
      }
    }
    return [];
  }, []);

  const saveChatHistory = (history: SavedChatSession[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(CHAT_HISTORY_LOCAL_STORAGE_KEY, JSON.stringify(history));
  };

  const saveCurrentChat = useCallback((messagesToSave?: Message[]) => {
    const currentMessages = messagesToSave || messages;
    const meaningfulMessages = currentMessages.filter(m => m.id !== LUNAFREYA_GREETING_ID && !m.isAutonomous);
    if (meaningfulMessages.length === 0) return null;

    let newSessionId = currentSessionId || Date.now().toString();
    const firstUserMessage = meaningfulMessages.find(m => m.role === 'user');
    const sessionName = firstUserMessage?.text.substring(0, 50) || `Chat - ${new Date(meaningfulMessages[0].timestamp).toLocaleString()}`;
    
    const history = getChatHistory();
    const existingSessionIndex = history.findIndex(session => session.id === newSessionId);

    const sessionToSave: SavedChatSession = {
      id: newSessionId,
      name: sessionName,
      messages: currentMessages.map(msg => ({...msg, timestamp: msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp)})),
      savedAt: Date.now(),
    };

    if (existingSessionIndex > -1) {
      history[existingSessionIndex] = sessionToSave;
    } else {
      history.unshift(sessionToSave);
    }
    
    saveChatHistory(history.slice(0, 50));
    setCurrentSessionId(newSessionId);
    return newSessionId;
  }, [messages, currentSessionId, getChatHistory]);

  const loadChatSession = useCallback((sessionId: string) => {
    const history = getChatHistory();
    const session = history.find(s => s.id === sessionId);
    if (session) {
      setMessages(session.messages.map(msg => ({...msg, timestamp: new Date(msg.timestamp)})));
      setCurrentSessionId(session.id);
      toast({ title: 'Chat Loaded', description: `Loaded "${session.name}".` });
    } else {
      toast({ title: 'Error', description: 'Chat session not found.', variant: 'destructive' });
      setMessages([]); 
      setCurrentSessionId(null);
      addInitialGreetingIfNeeded([]); 
    }
  }, [toast, getChatHistory]);

  const addInitialGreetingIfNeeded = (currentMessages: Message[]) => {
    if (currentMessages.length === 0 || currentMessages.every(m => m.isAutonomous)) {
       const nonAutonomousMessages = currentMessages.filter(m => !m.isAutonomous);
        if (nonAutonomousMessages.length === 0) {
            const greetingMessage: Message = {
                id: LUNAFREYA_GREETING_ID,
                role: 'ai',
                text: "Hello! I'm Lunafreya, your AI assistant. How can I help you today?",
                timestamp: new Date(),
            };
            setMessages(prev => [greetingMessage, ...prev.filter(m => m.isAutonomous)]);
        }
    }
  };
  
  useEffect(() => {
    const sessionIdFromUrl = searchParams.get('sessionId');
    if (sessionIdFromUrl) {
      if (sessionIdFromUrl !== currentSessionId) {
        loadChatSession(sessionIdFromUrl);
      }
    } else {
      if (messages.filter(m => !m.isAutonomous).length === 0 && !currentSessionId) {
         addInitialGreetingIfNeeded(messages);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, loadChatSession]); 


  const handleNewChat = () => {
    const meaningfulMessages = messages.filter(m => m.id !== LUNAFREYA_GREETING_ID && !m.isAutonomous);
    if (meaningfulMessages.length > 0) {
      const savedId = saveCurrentChat();
      if (savedId) {
         toast({ title: 'Chat Saved', description: 'Previous chat session was saved.' });
      }
    }
    setInputValue('');
    setSuggestions([]);
    setCurrentSessionId(null); 
    const greetingMessage: Message = {
      id: LUNAFREYA_GREETING_ID,
      role: 'ai',
      text: "Hello! I'm Lunafreya, your AI assistant. How can I help you today?",
      timestamp: new Date(),
    };
    setMessages(prev => [greetingMessage, ...prev.filter(m => m.isAutonomous && m.timestamp.getTime() > Date.now() - 5*60*1000)]); // Keep recent autonomous
    router.push('/chat', { scroll: false });
  };

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
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
         setInputValue(prev => {
            if (interimTranscript && prev.endsWith(interimTranscript.slice(0,-1))) { 
                return prev.slice(0, prev.length - interimTranscript.length +1) + interimTranscript;
            }
            return prev + interimTranscript;
        });
        if (finalTranscript) {
            setInputValue(prev => prev + finalTranscript);
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
      recognitionRef.current.start();
    }
    setIsListening(!isListening);
  };

  const speakText = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US'; // Ensure English (US) for pronunciation

      // Attempt to find and set a female English voice
      const voices = window.speechSynthesis.getVoices();
      const femaleEnglishVoice = voices.find(voice => 
        voice.lang.startsWith('en') && 
        (voice.name.toLowerCase().includes('female') || 
         voice.name.toLowerCase().includes('woman') || 
         voice.name.toLowerCase().includes('girl') ||
         // Common default female voice names
         voice.name.includes('Susan') || voice.name.includes('Samantha') || 
         voice.name.includes('Karen') || voice.name.includes('Zira') ||
         voice.name.includes('Moira'))
      );

      if (femaleEnglishVoice) {
        utterance.voice = femaleEnglishVoice;
      } else {
        // Fallback: try any English voice if a specific female one isn't found
        const anyEnglishVoice = voices.find(voice => voice.lang.startsWith('en'));
        if (anyEnglishVoice) {
          utterance.voice = anyEnglishVoice;
        }
      }
      
      window.speechSynthesis.speak(utterance);
    } else {
      toast({ title: 'Text-to-Speech Not Supported', description: 'Your browser does not support speech synthesis.', variant: 'destructive' });
    }
  };
  
  // Preload voices if they are not loaded immediately
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (speechSynthesis.getVoices().length === 0) {
        speechSynthesis.onvoiceschanged = () => {
          // Voices are now loaded
        };
      }
    }
  }, []);


  const fetchSuggestions = useCallback(async (context: string) => {
    const userGoals = "Engage in a productive and insightful conversation.";
    const result = await getIntelligentSuggestionsAction(context, userGoals);
    if ('error' in result) {
      // The flow now returns fallback suggestions, so direct error toast is less likely for "no suggestions"
      // console.error("Failed to fetch suggestions:", result.error); 
      // Fallback handled within the flow, but if action itself fails:
      if (result.suggestedActions && result.suggestedActions.length > 0){
        setSuggestions(result.suggestedActions.slice(0,3));
      } else {
        console.error("Failed to fetch suggestions:", result.error);
        setSuggestions([]); // Clear suggestions if error is critical
      }
    } else {
      setSuggestions(result.suggestedActions.slice(0, 3));
    }
  }, []);

  const handleSendMessage = useCallback(async (messageText?: string) => {
    const textToSend = (messageText || inputValue).trim();
    if (!textToSend) return;

    let updatedMessages = [...messages];
    // Remove initial greeting if it's the only non-autonomous message
    const nonAutonomousMessages = updatedMessages.filter(m => !m.isAutonomous);
    if (nonAutonomousMessages.length === 1 && nonAutonomousMessages[0].id === LUNAFREYA_GREETING_ID) {
      updatedMessages = updatedMessages.filter(m => m.id !== LUNAFREYA_GREETING_ID);
    }
    
    const userMessage: Message = { id: Date.now().toString(), role: 'user', text: textToSend, timestamp: new Date() };
    updatedMessages.push(userMessage);
    
    setMessages(updatedMessages);
    setInputValue('');
    setIsLoading(true);
    setSuggestions([]); 

    const aiResponse = await handleChatMessageAction(textToSend);
    setIsLoading(false);

    let finalMessages = updatedMessages;

    if ('error' in aiResponse) {
      const errorMessage: Message = { id: Date.now().toString() + '-error', role: 'ai', text: aiResponse.error, timestamp: new Date(), isError: true };
      finalMessages = [...updatedMessages, errorMessage];
      setMessages(finalMessages);
      toast({ title: 'AI Error', description: aiResponse.error, variant: 'destructive' });
    } else {
      const aiResponseMessage: Message = { id: (aiResponse as CollaborateWithAiOutput).summary + Date.now(), role: 'ai', text: (aiResponse as CollaborateWithAiOutput).summary, timestamp: new Date() };
      finalMessages = [...updatedMessages, aiResponseMessage];
      setMessages(finalMessages);
      
      const conversationContext = finalMessages
        .filter(m => !m.isAutonomous) // Exclude autonomous messages from suggestion context
        .slice(-5) 
        .map(m => `${m.role}: ${m.text}`)
        .join('\n');
      if(conversationContext) fetchSuggestions(conversationContext);
    }
  }, [inputValue, messages, toast, fetchSuggestions]);

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  return (
    <>
      <PageHeader title="AI Chat" />
      <div className="flex h-[calc(100vh-var(--header-height)-2rem)] flex-col">
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
                  msg.role === 'user' ? 'bg-primary text-primary-foreground' : 
                  (msg.isError ? 'bg-destructive text-destructive-foreground' : 
                  (msg.isAutonomous ? 'bg-accent text-accent-foreground opacity-90 italic' : 'bg-card')),
                  msg.isError && 'border border-destructive/50',
                  msg.isAutonomous && 'border border-dashed border-primary/50'
                )}>
                  <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-xs opacity-70">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                    {msg.role === 'ai' && !msg.isError && msg.id !== LUNAFREYA_GREETING_ID && !msg.isAutonomous && (
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
        
        {suggestions.length > 0 && !isLoading && (
          <div className="p-4 border-t">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm font-medium flex items-center mr-2 text-muted-foreground"><Lightbulb size={16} className="mr-1 text-primary"/>Suggestions:</span>
              {suggestions.map((s, i) => (
                <Button key={i} variant="outline" size="sm" onClick={() => handleSuggestionClick(s)}>
                  {s}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="border-t p-4 space-y-3">
          <div className="flex flex-wrap gap-2 justify-start items-center">
            <Button variant="outline" size="sm" onClick={handleNewChat}>
              <PlusCircle size={16} className="mr-2" /> New Chat
            </Button>
            <Button variant="outline" size="sm" onClick={() => { saveCurrentChat(); toast({title: "Chat Saved", description: "Current conversation saved to history."}) }} disabled={messages.filter(m => m.id !== LUNAFREYA_GREETING_ID && !m.isAutonomous).length === 0}>
              <Save size={16} className="mr-2" /> Save Chat
            </Button>
             <Button variant="outline" size="sm" onClick={() => router.push('/chat-history')}>
              <FileText size={16} className="mr-2" /> View History
            </Button>
            <div className="flex items-center space-x-2 ml-auto">
              <Switch
                id="autonomous-mode"
                checked={isAutonomousModeEnabled}
                onCheckedChange={handleAutonomousModeToggle}
                aria-label="Toggle autonomous updates"
              />
              <Label htmlFor="autonomous-mode" className="text-sm flex items-center text-muted-foreground">
                <Power size={14} className={cn("mr-1.5", isAutonomousModeEnabled ? "text-primary" : "text-muted-foreground")} /> Autonomous Updates
              </Label>
            </div>
          </div>
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
