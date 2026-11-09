// Tjänst × område-sidor: samma jobb i olika delar av Stockholm. Varje sida har helt egen, handskriven text
// (se blandare.ts, handyman.ts, las.ts) — bara jobbens metadata och sidans skelett delas. Duplicerat
// innehåll mäts med scripts/check-duplication.mjs (gräns 15 %).
import type { JobPageProps } from '../../components/small-job-types';
import { extras } from './extras';
import { blandare } from './blandare';
import { handyman } from './handyman';
import { las } from './las';

export interface Area {
  id: string;
  name: string;
  /** "i Solna", "på Lidingö" */
  loc: string;
  /** befintlig ortsida */
  page: string;
}
export const areas: Record<string, Area> = {
  solna: { id: 'solna', name: 'Solna', loc: 'i Solna', page: '/solna' },
  sundbyberg: { id: 'sundbyberg', name: 'Sundbyberg', loc: 'i Sundbyberg', page: '/sundbyberg' },
  bromma: { id: 'bromma', name: 'Bromma', loc: 'i Bromma', page: '/bromma' },
  danderyd: { id: 'danderyd', name: 'Danderyd', loc: 'i Danderyd', page: '/danderyd' },
  taby: { id: 'taby', name: 'Täby', loc: 'i Täby', page: '/tacby' },
  lidingo: { id: 'lidingo', name: 'Lidingö', loc: 'på Lidingö', page: '/lidingo' },
};

export interface AreaEntry {
  area: keyof typeof areas;
  lead: string;
  h2: string;
  intro: string[];
  section: { h: string; paras: string[] };
  faqs: { q: string; a: string }[];
}
export interface Job {
  /** slug-prefix: byta-blandare → byta-blandare-solna */
  prefix: string;
  titleBase: string;
  titleTail: string;
  h1Base: string;
  hub: string;
  hubLabel: string;
  serviceType: string;
  defaultService: string;
  heroImage: string;
  ctaHeading: string;
  entries: AreaEntry[];
}

const ALT = 'Arbete utfört av PRM Montage i Stockholm';
const jobs: Job[] = [
  {
    prefix: 'byta-blandare', titleBase: 'Byta blandare', titleTail: 'Kök, dusch & handfat', h1Base: 'Byta blandare',
    hub: '/byta-blandare', hubLabel: 'Byta blandare', serviceType: 'Byte av blandare', defaultService: 'VVS & Badrum',
    heroImage: 'assets/img/projekt/badrum-07.webp', ctaHeading: 'Dags att byta blandare?', entries: blandare,
  },
  {
    prefix: 'handyman', titleBase: 'Handyman', titleTail: 'Montering & småjobb', h1Base: 'Handyman',
    hub: '/handyman-stockholm', hubLabel: 'Handyman Stockholm', serviceType: 'Handyman och montering', defaultService: 'Montering & handyman',
    heroImage: 'assets/img/projekt/bygg-02.webp', ctaHeading: 'Har du något som behöver fixas?', entries: handyman,
  },
  {
    prefix: 'byta-las', titleBase: 'Byta lås', titleTail: 'Lås & låscylinder', h1Base: 'Byta lås',
    hub: '/byta-las-cylinder', hubLabel: 'Byta lås & låscylinder', serviceType: 'Byte av lås och låscylinder', defaultService: 'Lås & dörrar',
    heroImage: 'assets/img/projekt/bygg-04.webp', ctaHeading: 'Dags att byta lås?', entries: las,
  },
];

const siblingLabel: Record<string, string> = { 'byta-blandare': 'Byta blandare', handyman: 'Handyman', 'byta-las': 'Byta lås' };

export const allPages: JobPageProps[] = jobs.flatMap((job) =>
  job.entries.map((e) => {
    const area = areas[e.area];
    const slug = `${job.prefix}-${area.id}`;
    const h1 = `${job.h1Base} ${area.loc}`;
    return {
      slug,
      title: `${job.titleBase} ${area.name} — ${job.titleTail} | PRM Montage`,
      description: `${e.lead} Fast pris och kostnadsfri offert.`,
      heroImage: job.heroImage,
      heroAlt: ALT,
      h1,
      lead: e.lead,
      crumbs: [{ name: job.hubLabel, href: job.hub }],
      eyebrow: area.name,
      h2: e.h2,
      intro: e.intro,
      sections: [e.section, extras[job.prefix][area.id]],
      faqTitle: `Vanliga frågor — ${job.titleBase.toLowerCase()} ${area.loc}`,
      faqs: e.faqs,
      serviceType: job.serviceType,
      serviceName: h1,
      areaServed: area.name,
      defaultService: job.defaultService,
      ctaHeading: job.ctaHeading,
      relatedTitle: `Fler jobb ${area.loc}`,
      related: [
        { href: job.hub, label: `${job.hubLabel} — hela Stockholm` },
        ...jobs
          .filter((j) => j.prefix !== job.prefix)
          .map((j) => ({ href: `/${j.prefix}-${area.id}`, label: `${siblingLabel[j.prefix]} ${area.loc}` })),
        { href: area.page, label: `Alla tjänster ${area.loc}` },
      ],
    } satisfies JobPageProps;
  }),
);
