
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  MessageCircle,
  UploadCloud,
  Edit3,
  Code,
  Search,
  SettingsIcon,
  LayoutDashboard,
  History,
  Moon,
  Sun,
  Github,
  FileText,
  Brain,
  Users,
  PenTool, 
  TerminalSquare, 
  Globe, 
  Palette, 
  Cog, 
  ImagePlay, 
  Languages,
  Files, // Added Files icon
} from 'lucide-react';

import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarMenuBadge,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { ThemeProvider } from '@/components/theme-provider';

export const metadata: Metadata = {
  title: 'Lunafreya Google Cloud AI',
  description: 'Collaborative AI for deep thinking and creative reasoning.',
  icons: [],
};

const navItems = [
  { href: '/chat', icon: MessageCircle, label: 'AI Chat', badge: 'Beta' },
  { href: '/chat-history', icon: History, label: 'Chat History' },
  { href: '/workspace', icon: Palette, label: 'Workspace' },
  { href: '/memory-upload', icon: UploadCloud, label: 'Memory Upload' },
  { href: '/view-memory', icon: Files, label: 'View Memory' }, // New item
  { href: '/text-enhancer', icon: PenTool, label: 'Text Enhancer' },
  { href: '/code-generator', icon: TerminalSquare, label: 'Code Generator' },
  { href: '/image-generator', icon: ImagePlay, label: 'Image Generator' },
  { href: '/translator', icon: Languages, label: 'Translator' },
  { href: '/web-search', icon: Globe, label: 'Web Search' },
  { href: '/settings', icon: Cog, label: 'Settings' },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className={cn("font-body antialiased", process.env.NODE_ENV === 'development' ? 'debug-screens' : undefined)}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <SidebarProvider>
            <Sidebar>
              <SidebarHeader>
                <div className="flex items-center gap-2 p-2">
                   <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="h-8 w-8 text-primary"
                    >
                      <path d="M6.5 15.5C4.95 14.53 3.83 12.94 3.5 11.07 3.08 8.53 4.29 6.11 6.51 5.07 6.95 4.86 7.42 4.99 7.63 5.44 7.85 5.88 7.71 6.35 7.27 6.56 5.72 7.27 5.02 8.93 5.29 10.43 5.47 11.77 6.32 13.03 7.57 13.88L6.5 15.5z" />
                      <path d="M17.5 15.5C19.05 14.53 20.17 12.94 20.5 11.07 20.92 8.53 19.71 6.11 17.49 5.07 17.05 4.86 16.58 4.99 16.37 5.44 16.15 5.88 16.29 6.35 16.73 6.56 18.28 7.27 18.98 8.93 18.71 10.43 18.53 11.77 17.68 13.03 16.43 13.88L17.5 15.5z" />
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  <div className="font-headline text-xl font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">Lunafreya</div>
                </div>
              </SidebarHeader>
              <SidebarContent className="p-2">
                <SidebarMenu>
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.label}>
                      <Link href={item.href}>
                        <SidebarMenuButton
                          tooltip={{ children: item.label, side: 'right', align: 'center' }}
                          className="w-full justify-start"
                        >
                          <item.icon />
                          <span>{item.label}</span>
                          {item.badge && <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>}
                        </SidebarMenuButton>
                      </Link>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarContent>
              <SidebarFooter className="p-2">
                 <Link href="/settings">
                  <SidebarMenuButton
                    tooltip={{ children: 'User Settings', side: 'right', align: 'center' }}
                    className="w-full justify-start"
                  >
                    <Avatar className="h-7 w-7">
                      <AvatarImage src="https://placehold.co/40x40.png" alt="User Avatar" data-ai-hint="user avatar" />
                      <AvatarFallback>UA</AvatarFallback>
                    </Avatar>
                    <span className="group-data-[collapsible=icon]:hidden">User Account</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarFooter>
            </Sidebar>
            <SidebarInset className="flex flex-col">
              <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6 md:h-16">
                <SidebarTrigger className="md:hidden" />
                <h2 id="page-title" className="font-headline text-lg font-semibold text-foreground sm:text-xl">
                </h2>
              </header>
              <main className="flex-1 overflow-y-auto p-4 sm:p-6">
                {children}
              </main>
            </SidebarInset>
          </SidebarProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}

    