import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'BLEZZ RUSSIA — официальный форум',description:'Форум BLEZZ RUSSIA: игровые серверы, новости, обращения, администрация и обсуждения'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ru"><body>{children}</body></html>}