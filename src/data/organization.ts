// Företagets schema.org-nod — används som "provider" i alla Service-noder så att
// telefonnummer, adress m.m. aldrig kan glida isär mellan sidorna.
export const organization = {
  "@type": "HomeAndConstructionBusiness",
  "@id": "https://prmmontage.se/#organization",
  "name": "PRM Montage",
  "legalName": "PRM MONTAGE AB",
  "url": "https://prmmontage.se/",
  "telephone": "+46852027977",
  "email": "info@pro-montage.se",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Industrivägen 19",
    "postalCode": "171 48",
    "addressLocality": "Solna",
    "addressCountry": "SE"
  },
  "priceRange": "$$"
};
