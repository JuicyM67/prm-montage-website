// Riktiga Google-recensioner (tidigare i startsidans slider). Visa bara dessa — hitta inte på nya.
export interface Review { name: string; text: string }
export const reviews: Review[] = [
  {
    "name": "Marie Chenik",
    "text": "Jag är mycket nöjd med installationen av blandaren i mitt badrum av en duktig och vänlig hantverkare."
  },
  {
    "name": "Melina Sandström",
    "text": "Kom i tid. Gjorde ett mkt bra jobb."
  },
  {
    "name": "Michael Bärlin",
    "text": "Great service!"
  },
  {
    "name": "Thomas Durrani",
    "text": "Helped us with installation of faucet. Very professional! The job was very well done! Can strongly recommend!"
  },
  {
    "name": "Gisela Fondberg",
    "text": "Verkligen bra service. Lyhörd och trevlig personal, snabba åtgärder och bra information. Montering av badrumsutrustning gjordes utomordentligt noggrant och med perfekt resultat."
  },
  {
    "name": "Staffan Karlsson",
    "text": "Bra arbete av trevlig och hjälpsam installatör."
  },
  {
    "name": "Daniel Hermansson",
    "text": "Ringde PRM Montage och fick snabb hjälp — proffsigt utfört arbete."
  },
  {
    "name": "Magnus Påhlsson",
    "text": "Riktigt bra bemötande och kompetent hantverkare. Rekommenderas!"
  },
  {
    "name": "Fredrik Österholm",
    "text": "Snabbt, tydligt och prisvärt utfört. Mycket nöjd."
  },
  {
    "name": "Margaretha Lindh",
    "text": "Professionellt bemötande — kom snabbt och gjorde ett bra jobb."
  },
  {
    "name": "Johanna S",
    "text": "Bra kommunikation genom hela projektet. Rekommenderas!"
  },
  {
    "name": "Daniel Skötlund",
    "text": "Löste jobbet snabbt med ett väldigt trevligt bemötande."
  },
  {
    "name": "Georgia B",
    "text": "Snabb och professionell installation, prydligt utfört."
  },
  {
    "name": "Cecilia Lind",
    "text": "Riktigt bra hantverkare som höll vad de lovade."
  },
  {
    "name": "Tomas Paulsson",
    "text": "Mycket bra installation, effektivt och prydligt."
  }
];

// Urval som passar småjobb (installation, blandare, snabb hjälp) — används på tjänstesidor.
export const jobReviews: Review[] = reviews.filter((r) => /blandare|installation|snabb|prydligt|effektivt/i.test(r.text));
