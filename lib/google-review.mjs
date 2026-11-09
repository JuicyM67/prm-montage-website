// Direktlänk som öppnar Googles "skriv ett omdöme" för PRM Montage AB (Google Place ID från företagsprofilen).
export const GOOGLE_REVIEW_URL = 'https://search.google.com/local/writereview?placeid=ChIJfz7at7SdX0YRIM0Fm8GASUE';

export function siteOrigin(request) {
  const origin = new URL(request.url).origin;
  return /localhost|127\.0\.0\.1/.test(origin) ? origin : 'https://prmmontage.se';
}
