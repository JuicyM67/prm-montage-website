// Typer för SmallJobPage.astro — i en .ts-fil så att datafiler (t.ex. src/data/service-areas) kan importera dem.
export interface Faq { q: string; a: string }
export interface Section { h: string; paras?: string[]; list?: string[] }
export interface Crumb { name: string; href?: string }
export interface Highlight { icon: string; title: string; text: string }
export interface JobPageProps {
  slug: string;
  title: string;
  description: string;
  ogDescription?: string;
  ogImage?: string;
  heroImage: string;
  heroAlt: string;
  h1: string;
  lead?: string;
  crumbs: Crumb[];
  eyebrow?: string;
  h2: string;
  intro: string[];
  highlights?: Highlight[];
  sections?: Section[];
  checklistTitle?: string;
  checklist?: string[];
  faqTitle?: string;
  faqs: Faq[];
  serviceType: string;
  serviceName: string;
  areaServed?: string;
  defaultService: string;
  ctaHeading: string;
  relatedTitle?: string;
  related?: { href: string; label: string }[];
}
