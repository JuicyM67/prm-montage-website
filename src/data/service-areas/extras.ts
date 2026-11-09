import type { Section } from '../../components/small-job-types';

// Andra textsektionen per sida (jobb → område). Handskriven och unik per område.
export const extras: Record<string, Record<string, Section>> = {
  'byta-blandare': {
    solna: {
      h: 'Så förbereder du blandarbytet',
      paras: [
        'Töm skåpet under diskbänken eller rensa platsen kring handfatet så att vi kommer åt. Har du den nya blandaren hemma, kontrollera att alla delar följer med i kartongen. Saknas något hör du av dig, så reder vi ut vad som behövs.',
        'I en lägenhet i Solna är det bra att veta var avstängningsventilerna sitter. Vet du inte det hjälper vi dig att hitta dem vid besöket, och vi stänger bara av vattnet när det är dags att byta.',
      ],
    },
    sundbyberg: {
      h: 'Kalk och fastsittande kopplingar',
      paras: [
        'Kopplingar som suttit i många år kan vara svåra att lossa utan att skada rören. Därför tar vi det försiktigt och använder rätt verktyg, och vi byter packningar och slangar när de är slitna så att den nya blandaren sitter tätt från början.',
        'Ett blandarbyte som går smidigt är ett där man hittar problemen i förväg. Skicka därför gärna ett foto på kopplingarna under handfatet eller diskbänken, så vet vi vad vi ska ta med oss.',
      ],
    },
    bromma: {
      h: 'Fler vattenpunkter i villan',
      paras: [
        'I villor i Bromma finns ofta fler vattenpunkter än i en lägenhet, till exempel tvättstuga och källare. Berätta om du har fler blandare eller kranar du vill ha hjälp med, så tar vi dem vid samma besök i stället för att komma tillbaka.',
        'Skicka gärna en lista med var varje blandare sitter och vilken sort det är. Då kan vi bedöma hur lång tid jobbet tar och boka in rätt tid redan från början.',
      ],
    },
    danderyd: {
      h: 'Planera blandarbytet i förväg',
      paras: [
        'Eftersom villor i Danderyd ofta har flera badrum lönar det sig att skicka en lista över vilka blandare du vill byta och var de sitter. Med foton kan vi bedöma om det är samma sorts blandare eller olika, och boka tillräckligt med tid för hela jobbet.',
        'Då slipper du flera separata besök, och vi kan ta med rätt anslutningar och packningar för varje blandare.',
      ],
    },
    taby: {
      h: 'Ett kort besök i en upptagen vardag',
      paras: [
        'För en familj är det viktigt att besöket blir kort och att vattnet inte är avstängt längre än nödvändigt. Vi förbereder oss genom att be dig skicka bilder i förväg, så att vi kommer med rätt delar och bara stänger av vattnet när det är dags att byta.',
        'När bytet är klart provar vi blandaren och visar hur den fungerar, så att alla i familjen vet hur den nya ska användas.',
      ],
    },
    lidingo: {
      h: 'Ett snyggt slutresultat',
      paras: [
        'Vid ett blandarbyte i ett hus med karaktär är det detaljerna som syns: att blandaren sitter rakt, att rosetten täcker hålet och att fogarna är rena. Vi tar den tid som behövs för att bytet ska se bra ut och inte bara fungera.',
        'Vi lämnar badrummet eller köket städat och går igenom resultatet med dig innan vi åker.',
      ],
    },
  },
  handyman: {
    solna: {
      h: 'Så får du ut mest av ett besök',
      paras: [
        'Skriv en lista över allt du vill ha gjort och märk vad som är viktigast. Skicka gärna foton och mått, och berätta om du har egna fästen eller skruvar. Då kan vi planera tiden rätt och ta med det som behövs, så att allt blir klart vid ett och samma besök i Solna.',
        'Är något jobb osäkert, till exempel en vägg du inte vet vad den är gjord av, säger du det i förfrågan så tittar vi på den innan vi borrar.',
      ],
    },
    sundbyberg: {
      h: 'Småjobb i lägenhet',
      paras: [
        'I en lägenhet i Sundbyberg handlar småjobben ofta om att få hemmet att kännas färdigt: tavlor och speglar, hyllor i hallen, en TV på väggen och förvaring i sovrummet. Vi hjälper dig placera allt så att det blir både praktiskt och snyggt.',
        'Vi lämnar rent efter oss och går igenom resultatet med dig innan vi åker.',
      ],
    },
    bromma: {
      h: 'Från Alvik till Riksby',
      paras: [
        'Oavsett om du bor i en lägenhet i Alvik, ett radhus i Åkeshov eller en villa i Riksby gör vi jobbet på samma sätt: vi tittar på väggen, väljer infästning och planerar placeringen med dig innan vi borrar. Det ger ett resultat som sitter rakt och håller.',
        'Vill du ha hjälp med flera rum samlar vi jobben i en tidsplan, så att det blir ett besök i stället för flera.',
      ],
    },
    danderyd: {
      h: 'Stora ytor, stora saker',
      paras: [
        'I en villa finns ofta höga väggar och stora ytor, och då syns ett litet fel i placering eller höjd mer. Därför tar vi oss tid att mäta och planera innan vi borrar, och kontrollerar med vattenpass att allt sitter rakt.',
        'Tunga speglar, stora tavlor och höga bokhyllor kräver extra eftertanke, och vi väljer infästning efter vikten.',
      ],
    },
    taby: {
      h: 'Samla allt till en dag',
      paras: [
        'Familjer i Täby har sällan tid för många separata besök. Samla gärna hyllor i barnrummet, gardinstänger, TV och möbler till samma tillfälle, så bokar vi tillräckligt med tid och tar allt i en omgång.',
        'Skicka en lista med rum och jobb, så kan vi planera ordningen och ta med det som behövs.',
      ],
    },
    lidingo: {
      h: 'Allt på sin plats',
      paras: [
        'På Lidingö vill många att resultatet ska se genomtänkt ut: tavlor i jämna rader, hyllor på rätt höjd och gardinstänger som sitter lika. Vi planerar placeringen tillsammans med dig och kontrollerar med vattenpass innan vi borrar.',
        'Vi lämnar rent och går igenom resultatet med dig innan vi åker över bron igen.',
      ],
    },
  },
  'byta-las': {
    solna: {
      h: 'Så går låsbytet till',
      paras: [
        'Du skickar ett foto på låset och måttet på cylindern, vi bekräftar vilken modell som passar och bokar en tid. Vid besöket byter vi cylindern, provar att nycklarna fungerar och justerar dörren vid behov.',
        'Vill du ha flera nycklar, eller samma nyckel till flera dörrar, säg till i förväg så har vi rätt cylindrar med oss.',
      ],
    },
    sundbyberg: {
      h: 'Mät cylindern',
      paras: [
        'Cylindrar finns i olika längder, och rätt längd är viktig för att låset ska fungera och sitta säkert. Det enklaste är att skicka ett foto på låset från dörrens kant och, om du kan, mäta cylindern.',
        'Är du osäker mäter vi på plats och byter när vi har rätt modell.',
      ],
    },
    bromma: {
      h: 'Fler dörrar än ytterdörren',
      paras: [
        'I Bromma gäller det ofta fler dörrar än bara ytterdörren, till exempel altandörr, källardörr och förråd. Berätta vilka dörrar du vill byta lås i, så planerar vi bytet av alla vid ett besök.',
        'Vi hjälper dig också välja cylindrar som passar samma nyckel, om du vill slippa en stor nyckelknippa.',
      ],
    },
    danderyd: {
      h: 'Ett besök för hela huset',
      paras: [
        'Vill du byta lås i hela huset samtidigt är det smidigast att göra det vid ett och samma besök. Då hinner vi justera dörrar som kärvar, prova alla nycklar och gå igenom med dig vilken nyckel som passar vilken dörr.',
        'Skicka gärna en lista med dörrarna och foton på låsen, så kan vi ta med rätt cylindrar.',
      ],
    },
    taby: {
      h: 'Praktiskt för familjen',
      paras: [
        'Många familjer vill ha ett nyckelsystem som är enkelt att hålla ordning på. Vi hjälper dig välja cylindrar så att antalet nycklar blir hanterbart, och vi provar att varje nyckel fungerar innan vi lämnar.',
        'Berätta hur många nycklar ni behöver, så ser vi till att det följer med rätt antal.',
      ],
    },
    lidingo: {
      h: 'Prova och justera',
      paras: [
        'Efter bytet provar vi låsning och upplåsning flera gånger och kontrollerar att dörren går i ordentligt. Eftersom äldre dörrar ofta sätter sig med åren justerar vi gärna dörren så att låset inte belastas i onödan.',
        'Du får nycklarna i handen innan vi går och kan själv prova att allt fungerar.',
      ],
    },
  },
};
