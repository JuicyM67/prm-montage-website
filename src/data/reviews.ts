// Riktiga Google-recensioner, ordagrant som kunden skrev dem (hämtade 2026-11-09, se scripts/import-reviews.mjs).
// Hitta aldrig på eller omformulera recensioner här. Hela listan finns i databasen (tabellen reviews) och i omdömesmodalen.
export interface Review { name: string; text: string; date?: string }
export const reviews: Review[] = [
  {
    "name": "Anders Nettelbladt",
    "text": "Superbra och trevlig service och installation helt enligt förväntningarna",
    "date": "2026-11-06"
  },
  {
    "name": "Torbjorn Cronbladh",
    "text": "Vasyl genomförde ett snabbt och perfekt jobb. Mycket nöjd.",
    "date": "2026-11-03"
  },
  {
    "name": "Greta Garcia Rodriguez",
    "text": "Super duktig och erfaren häntverkare. Vasyl är den bästa!",
    "date": "2026-10-30"
  },
  {
    "name": "Johanna Kull",
    "text": "Vini gjorde ett fint jobb med att montera våra nya duschväggar.",
    "date": "2026-10-23"
  },
  {
    "name": "Göran Wollroth",
    "text": "Montörerna kom på avtalad tid och utförde arbetet snabbt med bra resultat. Lösningsorienterade.",
    "date": "2026-10-16"
  },
  {
    "name": "Martin Pagrotsky",
    "text": "Vini you did a great job! Big thanks! 🤩🤩🤩",
    "date": "2026-10-08"
  },
  {
    "name": "Krystyna Sylvén",
    "text": "Mycket trevlig  personal, rekomenderar .",
    "date": "2026-09-08"
  },
  {
    "name": "Peter Jonsson",
    "text": "Snygg montering av duschblandare och duschvägg. Trevlig montör. Behövdes några efterbesök för att lägga mer silikon men montören kom på tider som passade oss.",
    "date": "2026-08-26"
  },
  {
    "name": "Tove Westerström",
    "text": "Vasil var mycket duktig och väldigt trevlig när han hjälpte till med byte av kranar och byte av komod, handfat och högskåp",
    "date": "2026-08-18"
  },
  {
    "name": "Ida Ramkloo",
    "text": "Är jättenöjd med vad hantverkaren Gentjan Ymeraj utförde. Han var tydlig med att vårt badrum var snett och skevt och gjorde allt i sin makt för att fixa så att duschhörnan kunde fästas på bästa sätt.",
    "date": "2026-08-15"
  },
  {
    "name": "Behnam Izadi",
    "text": "Mycket noggrant och väl genomfört arbete! Fantastiskt bemötande",
    "date": "2026-08-12"
  },
  {
    "name": "Niina Frolid",
    "text": "Montering ytterdörr. Noggrant arbete med bra slutresultat.",
    "date": "2026-08-06"
  },
  {
    "name": "Elin Johansson",
    "text": "Excellent work with our kitchen shelf and replacement of oven. Great communication and fast work. I’m very satisfied.",
    "date": "2026-08-04"
  },
  {
    "name": "Johannes Asp",
    "text": "Great installation work. Very professional installer and polite.",
    "date": "2026-08-03"
  },
  {
    "name": "tibma",
    "text": "Professionellt agerande av Vasyl som snabbt kunde korrigera en felaktigt installerad diskmaskin. Satte maskinen i våg samt satte dit en skruv som saknades.",
    "date": "2026-07-31"
  },
  {
    "name": "Linnea Johansson",
    "text": "Jättetrevlig och kunde sin sak!",
    "date": "2026-07-31"
  },
  {
    "name": "Evelina Hall",
    "text": "Jättenöjd med renovering av kök. Gentjan med team var pålitliga, noggranna och gjorde det väldigt fint!",
    "date": "2026-07-31"
  },
  {
    "name": "Annika Ferm",
    "text": "Bra,trevlig o snabb hantverkare 👍",
    "date": "2026-07-29"
  },
  {
    "name": "Gustav H",
    "text": "Mycket bra jobb utfört av Vasil. 10+",
    "date": "2026-07-29"
  },
  {
    "name": "Matilda Lindblad",
    "text": "Supernöjd med installation av toalett, kommod, duschväggar av Vasyl! Noga, snabb, trevlig, höll ordning under tiden. Jättebra!",
    "date": "2026-07-17"
  },
  {
    "name": "Mantha Kasagianni",
    "text": "Vasyl var så professionell! Noggrann och trevlig.",
    "date": "2026-07-13"
  },
  {
    "name": "Johanna S",
    "text": "Tackar Vasyl för smidig installation av diskmaskin och supertrevligt bemötande 👍",
    "date": "2026-07-06"
  },
  {
    "name": "Margaretha Lindh",
    "text": "Bra kommunikation inför jobbet, installation av diskmaskin. Fick en tid dagen därpå. Snabbt och bra utförande och trevlig kille som utförde jobbet.",
    "date": "2026-06-26"
  },
  {
    "name": "PettingbrorTV",
    "text": "Mycket snabbt och väl utfört arbete!",
    "date": "2026-06-24"
  }
];

// Urval som passar småjobb (installation, blandare, snabb hjälp) — används på tjänstesidor.
export const jobReviews: Review[] = reviews.filter((r) => /blandare|installation|snabb|prydligt|effektivt|montör|diskmaskin/i.test(r.text));
