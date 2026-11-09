import type { AreaEntry } from './index';

// Byta lås × område. All text är unik per område; områdesfakta kommer från de befintliga ortsidorna.
// Vi utför planerat byte av lås och cylinder — inte låsöppning vid utelåsning.
export const las: AreaEntry[] = [
  {
    area: 'solna',
    lead: 'Byte av lås och cylinder i Solna. Med kontor på Industrivägen 19.',
    h2: 'Byta lås och låscylinder i Solna',
    intro: [
      'Nyinflyttad i Solna och osäker på vem som har nycklar till dörren? Det är ett vanligt skäl att byta låscylindern. PRM Montage byter lås och låscylindrar i lägenheter och villor i Solna, och vi har kontor på Industrivägen 19 mitt i kommunen.',
      'Skicka ett foto på låset och dörrens kant, och gärna måttet på cylindern, så bedömer vi vad som behövs innan vi kommer. Vi byter cylindern och justerar dörren så att den går lätt.',
    ],
    section: {
      h: 'Lås i Solnas bostadsrätter',
      paras: [
        'Många lägenheter i Solna är bostadsrätter i relativt nya fastigheter, bland annat i Arenastaden, Hagalund och Råsunda. I flerfamiljshus kan dörren ingå i föreningens låssystem, och då är det föreningen som bestämmer vilka cylindrar som får användas.',
        'Kontrollera därför med styrelsen eller fastighetsägaren innan du byter cylinder i lägenhetsdörren. Gäller det en egen villadörr eller en inre dörr är du friare att välja.',
      ],
    },
    faqs: [
      { q: 'Kan jag byta cylinder i min lägenhetsdörr i Solna?', a: 'Ofta, men kontrollera med föreningen eller fastighetsägaren först, eftersom dörren kan ingå i ett gemensamt låssystem.' },
      { q: 'Hur snabbt kan ni komma till Solna?', a: 'Vårt kontor ligger på Industrivägen 19 i Solna, så vi har kort startsträcka.' },
      { q: 'Öppnar ni dörren om jag har låst mig ute?', a: 'Nej. Vi byter lås och cylinder efter planering, men öppnar inte dörrar vid utelåsning.' },
    ],
  },
  {
    area: 'sundbyberg',
    lead: 'Lås och låscylinder i Sundbyberg. Kort väg från vårt kontor i Solna.',
    h2: 'Byta lås och cylinder i Sundbyberg',
    intro: [
      'Sundbyberg gränsar till Solna, så vägen är kort när du behöver få ett lås bytt. PRM Montage byter låscylindrar och lås i lägenheter och hus i Sundbyberg, justerar dörren och provar att nyckeln går lätt.',
      'Det vanligaste skälet är en flytt eller en nyckel som har kommit bort. Då byter vi cylindern så att äldre nycklar inte längre fungerar.',
    ],
    section: {
      h: 'Äldre dörrar i Sundbyberg',
      paras: [
        'I Sundbybergs äldre fastigheter finns ofta äldre dörrar med slitna lås. Ibland räcker det med en ny cylinder, men är själva låshuset slitet eller har dörren satt sig kan det behövas ett nytt lås och en justering.',
        'I nyare delar som Sundbybergs centrum, Rissne och Hallonbergen har många dörrar standardiserade lås, och då går bytet oftast snabbt. Skicka ett foto så ser vi vad din dörr kräver.',
      ],
    },
    faqs: [
      { q: 'Hur vet jag vilken cylinder jag ska ha i Sundbyberg?', a: 'Skicka ett foto på låset och dörrens kant, så hjälper vi dig. Gärna med måttet på den gamla cylindern.' },
      { q: 'Kan ni byta lås i en äldre dörr?', a: 'Ja. Vi bedömer om det räcker med en ny cylinder eller om låshuset eller dörren behöver åtgärdas.' },
      { q: 'Kan ni byta lås när jag har tappat nyckeln?', a: 'Ja, som ett planerat byte. Vi byter cylindern så att den förlorade nyckeln inte längre fungerar, men öppnar inte dörren vid utelåsning.' },
    ],
  },
  {
    area: 'bromma',
    lead: 'Lås i ytterdörr och lägenhetsdörr. I hela Bromma.',
    h2: 'Byta lås och låscylinder i Bromma',
    intro: [
      'I Bromma finns både villor, radhus och lägenheter, och det betyder olika dörrar och olika behov: ytterdörren till ett hus, altandörren, en lägenhetsdörr eller förrådsdörren. PRM Montage byter lås och låscylindrar i hela Bromma.',
      'Vi kommer från vårt kontor i Solna, byter cylindern eller låset och justerar dörren så att den stänger ordentligt. Beskriv dörren och skicka gärna ett foto.',
    ],
    section: {
      h: 'Villadörr eller lägenhetsdörr?',
      paras: [
        'I en villa eller ett radhus bestämmer du själv vilket lås du vill ha, men vissa försäkringsbolag ställer krav på lås av viss klass för ytterdörren. Kontrollera villkoren hos ditt bolag innan du väljer.',
        'I en lägenhet i exempelvis Alvik, Åkeshov eller Riksby kan lägenhetsdörren ingå i föreningens låssystem. Fråga styrelsen innan du byter cylinder.',
      ],
    },
    faqs: [
      { q: 'Kan ni byta lås i altandörren i vår villa i Bromma?', a: 'Ja. Vi byter lås och cylinder i ytterdörrar, altandörrar och andra dörrar.' },
      { q: 'Vilket lås kräver min försäkring?', a: 'Det varierar mellan bolagen. Kontrollera dina villkor och berätta vad som krävs, så monterar vi ett lås som uppfyller det.' },
      { q: 'Hur lång tid tar det att komma till Bromma?', a: 'Bromma ligger en kort bilresa från vårt kontor i Solna.' },
    ],
  },
  {
    area: 'danderyd',
    lead: 'Lås och cylindrar till villan i Danderyd.',
    h2: 'Byta lås och låscylinder i Danderyds villor',
    intro: [
      'I en villa i Danderyd finns ofta flera dörrar som behöver lås: ytterdörr, altandörr och sidodörrar. Efter en flytt eller när nycklar har kommit bort är det klokt att byta cylindrarna, så att inga gamla nycklar fungerar.',
      'PRM Montage byter lås och cylindrar i villor i Danderyd, bland annat i Djursholm och Stocksund. Vi justerar dörren så att låset fungerar som det ska.',
    ],
    section: {
      h: 'Flera dörrar, samma nyckel',
      paras: [
        'Många villaägare vill ha en nyckel som passar flera dörrar. Berätta vilka dörrar du vill ha lås till, så hjälper vi dig välja cylindrar som kan låsas med samma nyckel.',
        'Är dörrarna äldre kan de behöva justeras samtidigt, eftersom en dörr som kärvar belastar låset. Vi tittar på dörren när vi ändå är där.',
      ],
    },
    faqs: [
      { q: 'Kan ni byta cylindrar i flera dörrar så att en nyckel passar alla?', a: 'Ja. Berätta vilka dörrar det gäller, så hjälper vi dig välja cylindrar som passar samma nyckel.' },
      { q: 'Åker ni till Djursholm och Stocksund?', a: 'Ja. Vi kommer till hela Danderyd, en kort bilresa från vårt kontor i Solna.' },
      { q: 'Kan ni justera en dörr som kärvar när ni byter lås?', a: 'Ja. Vi justerar dörren samtidigt så att låset belastas rätt.' },
    ],
  },
  {
    area: 'taby',
    lead: 'Lås och cylinder till villan eller radhuset i Täby.',
    h2: 'Byta lås och låscylinder i Täby',
    intro: [
      'I en barnfamilj händer det att nycklar kommer bort, i skolväskan, på lekplatsen eller i fickan på en jacka. Då är det klokt att byta cylindern så att den tappade nyckeln inte längre fungerar. PRM Montage byter lås och cylindrar i Täby.',
      'Vi kommer till villor och radhus i bland annat Näsbypark och kring Täby Centrum, byter låset och justerar dörren. Skicka ett foto på låset och dörrens kant så bedömer vi vad som behövs.',
    ],
    section: {
      h: 'När nycklar har kommit bort',
      paras: [
        'Byter du bara cylindern i stället för hela låset går bytet fort, och dörren behåller sitt låshus. Det är ofta det mest praktiska när målet är att få nya nycklar och göra de gamla ogiltiga.',
        'Samtidigt passar det bra att se över hur många nycklar familjen behöver. Berätta hur många nycklar ni vill ha, så hjälper vi dig med rätt cylinder.',
      ],
    },
    faqs: [
      { q: 'Behöver jag byta hela låset om en nyckel har kommit bort?', a: 'Oftast räcker det med att byta cylindern, så att den förlorade nyckeln inte längre fungerar.' },
      { q: 'Kan ni komma till radhus i Täby?', a: 'Ja. Vi byter lås i villor, radhus och lägenheter i Täby.' },
      { q: 'Kan ni öppna dörren om jag har låst mig ute?', a: 'Nej. Vi byter lås och cylinder i förväg men utför inte låsöppning.' },
    ],
  },
  {
    area: 'lidingo',
    lead: 'Lås och cylinder på Lidingö. I villor och lägenheter.',
    h2: 'Byta lås och låscylinder på Lidingö',
    intro: [
      'Lidingö nås via bro från Stockholm, och hit kommer vi från vårt kontor i Solna när du behöver byta lås eller låscylinder. PRM Montage byter lås i villor i bland annat Bodal, Larsberg och Högberga, och i lägenheter i Lidingö centrum och Torsvik.',
      'Vi byter cylindern eller hela låset, justerar dörren och provar att nyckeln går lätt. Skicka ett foto så bedömer vi vad som behövs.',
    ],
    section: {
      h: 'Äldre ytterdörrar',
      paras: [
        'Många villor på Lidingö är byggda under 1900-talets första hälft eller senare, och ytterdörren är ofta en dörr med karaktär som man vill behålla. Vi byter då låset eller cylindern utan att ändra dörrens utseende mer än nödvändigt.',
        'Passar inte ett vanligt lås dörrens utformning bedömer vi vilka alternativ som finns innan vi bokar tid.',
      ],
    },
    faqs: [
      { q: 'Kan ni byta lås i en äldre ytterdörr på Lidingö?', a: 'Ja. Vi byter lås eller cylinder med hänsyn till dörrens utseende och bedömer alternativ om ett vanligt lås inte passar.' },
      { q: 'Kommer ni över bron för ett lås?', a: 'Ja. Vi åker över bron från Solna, och tar gärna fler jobb vid samma besök.' },
      { q: 'Kan jag byta cylinder i lägenhetsdörren i Lidingö centrum?', a: 'Ofta, men kontrollera med föreningen eller fastighetsägaren först.' },
    ],
  },
];
