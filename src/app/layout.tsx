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
  Bot,
  FileText,
  Brain,
  Users,
  PenTool, // For Text Enhancer
  TerminalSquare, // For Code Generator
  Globe, // For Web Search
  Palette, // For Workspace
  Cog, // For Settings
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
import { Button } from '@/components/ui/button';
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
  { href: '/text-enhancer', icon: PenTool, label: 'Text Enhancer' },
  { href: '/code-generator', icon: TerminalSquare, label: 'Code Generator' },
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
                   <Bot className="h-8 w-8 text-primary" />
                  <h1 className="font-headline text-xl font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">Lunafreya</h1>
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
                  {/* Page title will be set dynamically */}
                </h2>
                {/* <ThemeToggle /> Theme toggle to be created */}
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
