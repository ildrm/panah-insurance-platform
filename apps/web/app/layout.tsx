import type { Metadata, Viewport } from 'next';
import './globals.css';
import { SessionProvider } from '../components/session';
import { Header } from '../components/chrome';
import { Footer } from '../components/footer';
import { PwaRegistration } from '../components/pwa';
export const metadata: Metadata = { title: { default: 'پناه | بیمه با خیال روشن', template: '%s | پناه' }, description: 'مقایسه بیمه، خرید و پیگیری پوشش در بازار آزمایشی پناه.', manifest: '/manifest.webmanifest', robots: { index: false, follow: false } };
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#102f3b' };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="fa" dir="rtl"><body><a className="skip-link" href="#main-content">رفتن به محتوای اصلی</a><SessionProvider><Header/><main id="main-content">{children}</main><Footer/><PwaRegistration/></SessionProvider></body></html>; }
