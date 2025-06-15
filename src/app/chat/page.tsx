
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Send, Mic, Volume2, Bot, User, Loader2, Save, PlusCircle, FileText, Power, LanguagesIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { handleChatMessageAction, getAutonomousUpdateAction } from '@/actions/chatActions';
import type { CollaborateWithAiOutput } from '@/ai/flows/collaborate-with-ai';
import { PageHeader } from '@/components/page-header';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: Date;
  isError?: boolean;
  isAutonomous?: boolean;
}

interface SavedChatSession {
  id: string;
  name: string;
  messages: Message[];
  savedAt: number;
  language?: 'Polish' | 'English'; // Store language with session
}

type ChatLanguage = 'Polish' | 'English';

const CHAT_HISTORY_LOCAL_STORAGE_KEY = 'chatHistory';
const AUTONOMOUS_MODE_STORAGE_KEY = 'autonomousModeEnabled';
const CHAT_LANGUAGE_STORAGE_KEY = 'chatLanguagePreference';

const LUNAFREYA_GREETING_ID = 'lunafreya-initial-greeting';
const INITIAL_GREETING_TEXT_POLISH = "Cześć! Jestem Lunafreya, Twoja asystentka AI. W czym mogę Ci dzisiaj pomóc?";
const INITIAL_GREETING_TEXT_ENGLISH = "Hi! I'm Lunafreya, your AI assistant. How can I help you today?";


export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isAutonomousModeEnabled, setIsAutonomousModeEnabled] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<ChatLanguage>('Polish');
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

  // Load preferences from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem(AUTONOMOUS_MODE_STORAGE_KEY);
      setIsAutonomousModeEnabled(savedMode === 'true');

      const savedLang = localStorage.getItem(CHAT_LANGUAGE_STORAGE_KEY) as ChatLanguage | null;
      if (savedLang) {
        setCurrentLanguage(savedLang);
      }
    }
  }, []);

  // Handle Autonomous Mode
  useEffect(() => {
    if (isAutonomousModeEnabled) {
      autonomousIntervalRef.current = setInterval(async () => {
        const result = await getAutonomousUpdateAction(currentLanguage);
        if ('error' in result) {
          console.error("Autonomous update error:", result.error);
        } else {
          const autonomousMessage: Message = {
            id: Date.now().toString() + '-autonomous',
            role: 'ai',
            text: `${currentLanguage === 'Polish' ? 'Myśl Lunafreyi' : "Lunafreya's thought"}: ${result.thought}`,
            timestamp: new Date(),
            isAutonomous: true,
          };
          setMessages(prev => [...prev, autonomousMessage]);
        }
      }, 30000); 
    } else {
      if (autonomousIntervalRef.current) {
        clearInterval(autonomousIntervalRef.current);
        autonomousIntervalRef.current = null;
      }
    }
    return () => {
      if (autonomousIntervalRef.current) {
        clearInterval(autonomousIntervalRef.current);
      }
    };
  }, [isAutonomousModeEnabled, currentLanguage]);

  const handleAutonomousModeToggle = (enabled: boolean) => {
    setIsAutonomousModeEnabled(enabled);
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTONOMOUS_MODE_STORAGE_KEY, enabled.toString());
      toast({
        title: currentLanguage === 'Polish' 
          ? `Tryb Autonomiczny ${enabled ? 'Włączony' : 'Wyłączony'}`
          : `Autonomous Mode ${enabled ? 'Enabled' : 'Disabled'}`,
        description: currentLanguage === 'Polish'
          ? (enabled ? "Lunafreya będzie teraz oferować proaktywne myśli." : "Autonomiczne aktualizacje są wyłączone.")
          : (enabled ? "Lunafreya will now offer proactive thoughts." : "Autonomous updates are disabled."),
      });
    }
  };

  const handleLanguageChange = (lang: ChatLanguage) => {
    setCurrentLanguage(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem(CHAT_LANGUAGE_STORAGE_KEY, lang);
      toast({
        title: lang === 'Polish' ? 'Język Zmieniony' : 'Language Changed',
        description: lang === 'Polish' ? 'Lunafreya będzie teraz odpowiadać po polsku.' : 'Lunafreya will now respond in English.',
      });
    }
    // When language changes, if there are no user messages, update greeting to new language
    const nonAutonomousMessages = messages.filter(m => !m.isAutonomous && m.id !== LUNAFREYA_GREETING_ID);
    if (nonAutonomousMessages.length === 0) {
        const greetingMessage: Message = {
            id: LUNAFREYA_GREETING_ID,
            role: 'ai',
            text: lang === 'Polish' ? INITIAL_GREETING_TEXT_POLISH : INITIAL_GREETING_TEXT_ENGLISH,
            timestamp: new Date(),
        };
        setMessages(prev => [greetingMessage, ...prev.filter(m => m.isAutonomous)]);
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
    const sessionNameBase = firstUserMessage?.text.substring(0, 30) || (currentLanguage === 'Polish' ? 'Czat' : 'Chat');
    const sessionName = `${sessionNameBase} - ${new Date(meaningfulMessages[0].timestamp).toLocaleDateString()}`;
    
    const history = getChatHistory();
    const existingSessionIndex = history.findIndex(session => session.id === newSessionId);

    const sessionToSave: SavedChatSession = {
      id: newSessionId,
      name: sessionName,
      messages: currentMessages.map(msg => ({...msg, timestamp: msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp)})),
      savedAt: Date.now(),
      language: currentLanguage, // Save current language with session
    };

    if (existingSessionIndex > -1) {
      history[existingSessionIndex] = sessionToSave;
    } else {
      history.unshift(sessionToSave);
    }
    
    saveChatHistory(history.slice(0, 50)); // Limit history size
    setCurrentSessionId(newSessionId);
    return newSessionId;
  }, [messages, currentSessionId, getChatHistory, currentLanguage]);

  const addInitialGreetingIfNeeded = useCallback((currentMessages: Message[], lang: ChatLanguage) => {
    const nonAutonomousOrGreetingMessages = currentMessages.filter(m => !m.isAutonomous && m.id !== LUNAFREYA_GREETING_ID);
    if (nonAutonomousOrGreetingMessages.length === 0) {
        // Check if a greeting already exists, even if it's the only one.
        const greetingExists = currentMessages.some(m => m.id === LUNAFREYA_GREETING_ID);
        if (!greetingExists) {
            const greetingMessage: Message = {
                id: LUNAFREYA_GREETING_ID,
                role: 'ai',
                text: lang === 'Polish' ? INITIAL_GREETING_TEXT_POLISH : INITIAL_GREETING_TEXT_ENGLISH,
                timestamp: new Date(),
            };
            setMessages(prev => [greetingMessage, ...prev.filter(m => m.isAutonomous)]);
        } else {
             // If greeting exists, ensure it's in the correct language
            setMessages(prev => prev.map(m => {
                if (m.id === LUNAFREYA_GREETING_ID) {
                    return {...m, text: lang === 'Polish' ? INITIAL_GREETING_TEXT_POLISH : INITIAL_GREETING_TEXT_ENGLISH };
                }
                return m;
            }));
        }
    }
  }, []);
  
  const loadChatSession = useCallback((sessionId: string) => {
    const history = getChatHistory();
    const session = history.find(s => s.id === sessionId);
    if (session) {
      setMessages(session.messages.map(msg => ({...msg, timestamp: new Date(msg.timestamp)})));
      setCurrentSessionId(session.id);
      const sessionLang = session.language || 'Polish'; // Default to Polish if not set
      setCurrentLanguage(sessionLang);
      if (typeof window !== 'undefined') {
        localStorage.setItem(CHAT_LANGUAGE_STORAGE_KEY, sessionLang);
      }
      toast({ title: sessionLang === 'Polish' ? 'Czat Załadowany' : 'Chat Loaded', description: `${sessionLang === 'Polish' ? 'Załadowano' : 'Loaded'} "${session.name}".` });
    } else {
      toast({ title: 'Błąd', description: currentLanguage === 'Polish' ? 'Nie znaleziono sesji czatu.' : 'Chat session not found.', variant: 'destructive' });
      setMessages([]); 
      setCurrentSessionId(null);
      addInitialGreetingIfNeeded([], currentLanguage); 
    }
  }, [toast, getChatHistory, currentLanguage, addInitialGreetingIfNeeded]);


  useEffect(() => {
    const sessionIdFromUrl = searchParams.get('sessionId');
    if (sessionIdFromUrl) {
      if (sessionIdFromUrl !== currentSessionId) {
        loadChatSession(sessionIdFromUrl);
      }
    } else {
      addInitialGreetingIfNeeded(messages, currentLanguage);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, loadChatSession, currentLanguage]);


  const handleNewChat = () => {
    const meaningfulMessages = messages.filter(m => m.id !== LUNAFREYA_GREETING_ID && !m.isAutonomous);
    if (meaningfulMessages.length > 0) {
      const savedId = saveCurrentChat();
      if (savedId) {
         toast({ title: currentLanguage === 'Polish' ? 'Czat Zapisany' : 'Chat Saved', description: currentLanguage === 'Polish' ? 'Poprzednia sesja czatu została zapisana.' : 'Previous chat session saved.' });
      }
    }
    setInputValue('');
    setCurrentSessionId(null); 
    const greetingMessage: Message = {
      id: LUNAFREYA_GREETING_ID,
      role: 'ai',
      text: currentLanguage === 'Polish' ? INITIAL_GREETING_TEXT_POLISH : INITIAL_GREETING_TEXT_ENGLISH,
      timestamp: new Date(),
    };
    // Keep recent autonomous messages if any
    setMessages(prev => [greetingMessage, ...prev.filter(m => m.isAutonomous && m.timestamp.getTime() > Date.now() - 5*60*1000)]); 
    router.push('/chat', { scroll: false });
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (recognitionRef.current) {
        recognitionRef.current.abort(); // Stop any existing recognition
      }
      recognitionRef.current = new SpeechRecognition();
      const recognition = recognitionRef.current;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = currentLanguage === 'Polish' ? 'pl-PL' : 'en-US';

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
            // This logic for updating interim results might need refinement
            // For simplicity, focusing on final transcript for now if interim is tricky
            if (interimTranscript && prev.endsWith(interimTranscript.slice(0,-1))) { 
                return prev.slice(0, prev.length - interimTranscript.length +1) + interimTranscript;
            }
            return prev + interimTranscript;
        });
        if (finalTranscript) {
            setInputValue(prev => prev.replace(interimTranscript, '') + finalTranscript); // More robust update
        }
      };
      recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        const errorDesc = currentLanguage === 'Polish' 
          ? (event.error === 'no-speech' ? 'Nie wykryto mowy.' : 'Wystąpił błąd podczas rozpoznawania mowy.')
          : (event.error === 'no-speech' ? 'No speech detected.' : 'Error during speech recognition.');
        toast({ title: currentLanguage === 'Polish' ? 'Błąd Rozpoznawania Mowy' : 'Speech Recognition Error', description: errorDesc, variant: 'destructive' });
        setIsListening(false);
      };
      recognition.onend = () => setIsListening(false);
    } else {
      console.warn('Speech Recognition API not supported in this browser.');
    }
    return () => recognitionRef.current?.abort();
  }, [toast, currentLanguage]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast({ title: currentLanguage === 'Polish' ? 'Wprowadzanie Głosowe Nieobsługiwane' : 'Voice Input Not Supported', description: currentLanguage === 'Polish' ? 'Twoja przeglądarka nie obsługuje rozpoznawania mowy.' : 'Your browser does not support speech recognition.', variant: 'destructive' });
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.lang = currentLanguage === 'Polish' ? 'pl-PL' : 'en-US'; // Ensure lang is set before starting
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error("Error starting speech recognition:", error);
        setIsListening(false);
        toast({ title: currentLanguage === 'Polish' ? 'Błąd Startu Rozpoznawania' : 'Recognition Start Error', description: String(error), variant: 'destructive' });
      }
    }
  };

  const speakText = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = currentLanguage === 'Polish' ? 'pl-PL' : 'en-US';

      const voices = window.speechSynthesis.getVoices();
      let targetVoice: SpeechSynthesisVoice | undefined;

      if (currentLanguage === 'Polish') {
        targetVoice = voices.find(voice =>
          voice.lang.startsWith('pl') &&
          (voice.name.toLowerCase().includes('female') ||
           voice.name.toLowerCase().includes('kobieta') ||
           voice.name.toLowerCase().includes('dziewczyna') ||
           voice.name.toLowerCase().includes('zosia') || 
           voice.name.toLowerCase().includes('ewa') ||
           voice.name.toLowerCase().includes('agata') ||
           voice.name.toLowerCase().includes('paulina')
          )
        ) || voices.find(voice => voice.lang.startsWith('pl'));
      } else { // English
         targetVoice = voices.find(voice =>
          voice.lang.startsWith('en') && voice.name.toLowerCase().includes('female') && 
          (voice.name.toLowerCase().includes('juniper') || voice.name.toLowerCase().includes('female')) // Try for Juniper-like or any female
        ) || voices.find(voice => voice.lang.startsWith('en-US') && voice.name.toLowerCase().includes('female')) 
          || voices.find(voice => voice.lang.startsWith('en') && voice.name.toLowerCase().includes('female'));
      }
      
      if (targetVoice) {
        utterance.voice = targetVoice;
      } else {
         // Fallback to first available voice for the language if specific female not found
        const fallbackVoice = voices.find(voice => voice.lang === utterance.lang);
        if (fallbackVoice) utterance.voice = fallbackVoice;
      }
      
      window.speechSynthesis.speak(utterance);
    } else {
      toast({ title: currentLanguage === 'Polish' ? 'Synteza Mowy Nieobsługiwana' : 'Speech Synthesis Not Supported', description: currentLanguage === 'Polish' ? 'Twoja przeglądarka nie obsługuje syntezy mowy.' : 'Your browser does not support speech synthesis.', variant: 'destructive' });
    }
  };
  
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      // Ensure voices are loaded, especially on some browsers
      if (speechSynthesis.getVoices().length === 0) {
        speechSynthesis.onvoiceschanged = () => { /* Voices loaded */ };
      }
    }
  }, []);

  const handleSendMessage = useCallback(async (messageText?: string) => {
    const textToSend = (messageText || inputValue).trim();
    if (!textToSend) return;

    let updatedMessages = [...messages];
    const nonAutonomousMessages = updatedMessages.filter(m => !m.isAutonomous);
    if (nonAutonomousMessages.length === 1 && nonAutonomousMessages[0].id === LUNAFREYA_GREETING_ID) {
      updatedMessages = updatedMessages.filter(m => m.id !== LUNAFREYA_GREETING_ID);
    }
    
    const userMessage: Message = { id: Date.now().toString(), role: 'user', text: textToSend, timestamp: new Date() };
    updatedMessages.push(userMessage);
    
    setMessages(updatedMessages);
    setInputValue('');
    setIsLoading(true);

    const aiResponse = await handleChatMessageAction(textToSend, currentLanguage);
    setIsLoading(false);

    let finalMessages = updatedMessages;

    if ('error' in aiResponse) {
      const errorMessage: Message = { id: Date.now().toString() + '-error', role: 'ai', text: aiResponse.error, timestamp: new Date(), isError: true };
      finalMessages = [...updatedMessages, errorMessage];
      setMessages(finalMessages);
      toast({ title: currentLanguage === 'Polish' ? 'Błąd AI' : 'AI Error', description: aiResponse.error, variant: 'destructive' });
    } else {
      const aiResponseMessage: Message = { id: (aiResponse as CollaborateWithAiOutput).summary + Date.now(), role: 'ai', text: (aiResponse as CollaborateWithAiOutput).summary, timestamp: new Date() };
      finalMessages = [...updatedMessages, aiResponseMessage];
      setMessages(finalMessages);
    }
  }, [inputValue, messages, toast, currentLanguage]);


  return (
    <>
      <PageHeader title={currentLanguage === 'Polish' ? 'Czat AI' : 'AI Chat'} />
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
                    <span className="text-xs opacity-70">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {msg.role === 'ai' && !msg.isError && msg.id !== LUNAFREYA_GREETING_ID && !msg.isAutonomous && (
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => speakText(msg.text)}>
                        <Volume2 size={16} />
                        <span className="sr-only">{currentLanguage === 'Polish' ? 'Mów' : 'Speak'}</span>
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
        
        <div className="border-t p-4 space-y-3">
           <div className="flex flex-wrap gap-2 justify-start items-center">
                <Select value={currentLanguage} onValueChange={(value: string) => handleLanguageChange(value as ChatLanguage)}>
                    <SelectTrigger className="w-auto min-w-[120px] h-9 text-xs" aria-label="Select Language">
                        <LanguagesIcon size={14} className="mr-1.5 text-muted-foreground" />
                        <SelectValue placeholder="Language" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Polish">Polski</SelectItem>
                        <SelectItem value="English">English</SelectItem>
                    </SelectContent>
                </Select>
                 <Button variant="outline" size="sm" onClick={handleNewChat}>
                    <PlusCircle size={16} className="mr-2" /> {currentLanguage === 'Polish' ? 'Nowy Czat' : 'New Chat'}
                </Button>
                <Button variant="outline" size="sm" onClick={() => { saveCurrentChat(); toast({title: currentLanguage === 'Polish' ? "Czat Zapisany" : "Chat Saved", description: currentLanguage === 'Polish' ? "Bieżąca rozmowa została zapisana." : "Current conversation saved."}) }} disabled={messages.filter(m => m.id !== LUNAFREYA_GREETING_ID && !m.isAutonomous).length === 0}>
                    <Save size={16} className="mr-2" /> {currentLanguage === 'Polish' ? 'Zapisz Czat' : 'Save Chat'}
                </Button>
                <Button variant="outline" size="sm" onClick={() => router.push('/chat-history')}>
                    <FileText size={16} className="mr-2" /> {currentLanguage === 'Polish' ? 'Historia' : 'History'}
                </Button>
                <div className="flex items-center space-x-2 ml-auto">
                    <Switch
                        id="autonomous-mode"
                        checked={isAutonomousModeEnabled}
                        onCheckedChange={handleAutonomousModeToggle}
                        aria-label="Toggle autonomous updates"
                    />
                    <Label htmlFor="autonomous-mode" className="text-sm flex items-center text-muted-foreground">
                        <Power size={14} className={cn("mr-1.5", isAutonomousModeEnabled ? "text-primary" : "text-muted-foreground")} /> 
                        {currentLanguage === 'Polish' ? 'Tryb Autonomiczny' : 'Autonomous Mode'}
                    </Label>
                </div>
            </div>
          <div className="relative flex items-center gap-2">
            <Textarea
              placeholder={currentLanguage === 'Polish' ? "Wpisz wiadomość lub użyj wprowadzania głosowego..." : "Type a message or use voice input..."}
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
              <Button type="button" size="icon" variant="ghost" onClick={toggleListening} className={cn("hover:bg-accent", isListening && "bg-destructive/20 text-destructive hover:bg-destructive/30")}>
                <Mic className="h-5 w-5" />
                <span className="sr-only">{isListening ? (currentLanguage === 'Polish' ? 'Zatrzymaj' : 'Stop Listening') : (currentLanguage === 'Polish' ? 'Mów' : 'Start Listening')}</span>
              </Button>
              <Button type="submit" size="icon" variant="ghost" onClick={() => handleSendMessage()} disabled={isLoading || !inputValue.trim()} className="hover:bg-accent">
                <Send className="h-5 w-5" />
                <span className="sr-only">{currentLanguage === 'Polish' ? 'Wyślij' : 'Send'}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

