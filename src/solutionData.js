export const companySizeClasses = {
  solo: "Vain yrittäjä",
  micro: "1–10 henkilöä",
  small: "11–50 henkilöä",
  mid: "51–249 henkilöä",
  large: "250 henkilöä tai enemmän"
};

export const businessIndustries = [
  { value: "professional", label: "IT, ohjelmisto, asiantuntija- ja konsultointipalvelut" },
  { value: "beauty", label: "Parturi, kampaamo, kauneus ja hyvinvointi" },
  { value: "restaurant", label: "Ravintola, kahvila ja elintarvikeala" },
  { value: "grocery", label: "Ruokakauppa, kioski ja kivijalkakauppa" },
  { value: "commerce", label: "Kauppa ja verkkokauppa" },
  { value: "construction", label: "Rakennus, asennus ja huolto" },
  { value: "logistics", label: "Kuljetus ja logistiikka" },
  { value: "manufacturing", label: "Teollisuus ja valmistus" },
  { value: "realEstate", label: "Kiinteistö ja vuokraustoiminta" },
  { value: "healthcare", label: "Terveys- ja hoivapalvelut" },
  { value: "agriculture", label: "Maa-, metsä- ja hevostalous" },
  { value: "automotive", label: "Autokorjaamo, huolto ja autokauppa" },
  { value: "events", label: "Tapahtumat, matkailu ja majoitus" },
  { value: "other", label: "Muu toimiala" }
];

export const industryAliases = {
  it: "professional",
  consulting: "professional",
  professional_services: "professional",
  professional: "professional",
  beauty: "beauty",
  food: "restaurant",
  restaurant: "restaurant",
  grocery: "grocery",
  retail: "commerce",
  commerce: "commerce",
  construction: "construction",
  logistics: "logistics",
  manufacturing: "manufacturing",
  realEstate: "realEstate",
  healthcare: "healthcare",
  agriculture: "agriculture",
  automotive: "automotive",
  events: "events",
  other: "other"
};

export const employeeBandAliases = {
  solo: "solo",
  "1_4": "micro",
  "5_9": "micro",
  "1_10": "micro",
  "10_19": "small",
  "20_49": "small",
  "11_50": "small",
  "50_plus": "mid",
  "51_249": "mid",
  "250_plus": "large"
};

export const mandatoryInsuranceRules = [
  {
    id: "yel",
    name: "YEL-vakuutus",
    obligationKind: "statutory",
    badgeLabel: "Lakisääteinen, jos ehdot täyttyvät",
    appliesIf: (profile) => profile.customerType === "business" && profile.entrepreneurWorks !== false,
    text: "YEL-vakuutus tulee tarkistaa, jos yrittäjä työskentelee yrityksessä ja YEL-vakuuttamisen ehdot täyttyvät."
  },
  {
    id: "tyel",
    name: "TyEL-vakuutus",
    obligationKind: "statutory",
    badgeLabel: "Lakisääteinen, jos ehdot täyttyvät",
    appliesIf: (profile) => profile.customerType === "business" && profile.employeeStatus !== "no",
    text: "TyEL-vakuutus tulee tarkistaa, jos yrityksellä on työntekijöitä."
  },
  {
    id: "workers_comp",
    name: "Työtapaturma- ja ammattitautivakuutus",
    obligationKind: "statutory",
    badgeLabel: "Lakisääteinen, jos ehdot täyttyvät",
    appliesIf: (profile) => profile.customerType === "business" && profile.employeeStatus !== "no",
    text: "Työtapaturma- ja ammattitautivakuutus tulee tarkistaa, jos yrityksellä on työntekijöitä ja vakuuttamisvelvollisuuden ehdot täyttyvät."
  },
  {
    id: "traffic",
    name: "Liikennevakuutus",
    obligationKind: "statutory",
    badgeLabel: "Lakisääteinen liikennekäytössä",
    appliesIf: (profile) => profile.hasVehicles,
    text: "Liikennevakuutus on lakisääteinen liikenteessä käytettävälle ajoneuvolle. Muut ajoneuvovakuutukset, kuten kasko, ovat vapaaehtoisia."
  },
  {
    id: "patient",
    name: "Potilasvakuutus",
    obligationKind: "statutory",
    badgeLabel: "Lakisääteinen, jos toiminta kuuluu piiriin",
    appliesIf: (profile) => profile.customerType === "business" && profile.industryKey === "healthcare",
    text: "Potilasvakuutus tulee tarkistaa, jos yritys harjoittaa potilasvakuutuksen piiriin kuuluvaa terveyden- tai sairaanhoitotoimintaa."
  },
  {
    id: "group_life",
    name: "Työntekijäin ryhmähenkivakuutus",
    obligationKind: "collective_agreement",
    badgeLabel: "Työehtosopimuksen perusteella",
    appliesIf: (profile) => profile.customerType === "business" && profile.employeeStatus !== "no",
    text: "Työntekijäin ryhmähenkivakuutus tulee tarkistaa, jos yritystä sitova työehtosopimus edellyttää sitä."
  }
];

const cover = (key, reason, defaultCoverageKey) => ({ key, reason, defaultCoverageKey });
const optional = (key, condition, relevantNeedIds, defaultCoverageKey) => ({
  key,
  condition,
  relevantNeedIds,
  defaultCoverageKey
});

export const businessPlaybooks = {
  professional: {
    title: "Asiantuntija- ja digipalveluyrityksen vakuutuskokonaisuus",
    summary: "Keskeiset riskit liittyvät yleensä asiantuntijavastuuseen, kyberriskeihin, sopimuksiin ja avainhenkilöiden työkykyyn.",
    recommendedCovers: [
      cover("bizLiability", "Virheellinen neuvo, suunnitelma, järjestelmä tai koodi voi aiheuttaa asiakkaalle taloudellista vahinkoa.", "professional"),
      cover("bizCyber", "Asiakasdata, henkilötiedot ja järjestelmäpääsyt tekevät kyberriskistä olennaisen tarkistusalueen.", "standard"),
      cover("bizPeople", "Laskutus ja toimituskyky voivat olla riippuvaisia yrittäjästä tai muutamasta avainhenkilöstä.", "entrepreneur")
    ],
    optionalCovers: [
      optional("bizInterruption", "Jos toiminta riippuu avainhenkilöistä tai järjestelmistä.", ["owner_key_person", "system_dependency"], "ke2"),
      optional("bizProperty", "Jos yrityksellä on arvokkaita laitteita tai toimitila.", ["property_or_assets"], "esine")
    ],
    relevantGroup: "professional"
  },
  beauty: {
    title: "Kauneus- ja hyvinvointialan vakuutuskokonaisuus",
    summary: "Vakuutustarpeissa korostuvat liiketila, työvälineet, asiakasvahingot ja yrittäjän tai henkilöstön työkyky.",
    recommendedCovers: [
      cover("bizProperty", "Liiketila, työvälineet, laitteet ja tuotevarasto ovat usein toiminnan kannalta tärkeitä.", "esine"),
      cover("bizLiability", "Palvelusta, käsittelystä tai työvälineestä voi aiheutua asiakkaalle henkilö- tai omaisuusvahinko.", "operations"),
      cover("bizInterruption", "Liiketilan, työvälineiden tai avainhenkilön poissaolo voi pysäyttää laskutuksen nopeasti.", "ke1"),
      cover("bizPeople", "Yrittäjän ja työntekijöiden työkyky vaikuttaa suoraan toiminnan jatkuvuuteen.", "entrepreneur")
    ],
    optionalCovers: [
      optional("bizCyber", "Jos ajanvaraus, maksaminen tai asiakasrekisteri on toiminnalle kriittinen.", ["system_dependency"], "standard"),
      optional("bizVehicle", "Jos yritys tarjoaa liikkuvia palveluita.", ["vehicles_or_transport"], "trafficKasko")
    ],
    relevantGroup: "service"
  },
  restaurant: {
    title: "Ravintola- ja elintarvikealan vakuutuskokonaisuus",
    summary: "Keskeiset vakuutusalueet liittyvät toimitilaan, laitteisiin, varastoon, asiakasvastuuseen, henkilöstöön ja toiminnan keskeytymiseen.",
    recommendedCovers: [
      cover("bizProperty", "Toimitila, keittiö- ja kylmälaitteet, kalusteet sekä varasto ovat toiminnalle kriittisiä.", "esine"),
      cover("bizInterruption", "Toiminta voi pysähtyä nopeasti toimitilan, laitteiden tai järjestelmien vahingon vuoksi.", "ke1"),
      cover("bizLiability", "Asiakkaalle voi aiheutua esimerkiksi liukastumis-, allergia- tai ruokamyrkytystilanne.", "products"),
      cover("bizPeople", "Työntekijöiden lakisääteiset ja täydentävät henkilöturvat pitää huomioida.", "statutory")
    ],
    optionalCovers: [
      optional("bizCyber", "Jos kassa-, maksu-, tilaus- tai varausjärjestelmä on kriittinen.", ["system_dependency"], "standard"),
      optional("bizVehicle", "Jos yrityksellä on kuljetuksia, cateringia tai food truck -toimintaa.", ["vehicles_or_transport"], "trafficKasko")
    ],
    relevantGroup: "restaurant"
  },
  retail: {
    title: "Kaupan vakuutuskokonaisuus",
    summary: "Vakuutustarpeet liittyvät yleensä myymälään tai varastoon, tuotteisiin, maksujärjestelmiin, asiakasvastuuseen ja keskeytymiseen.",
    recommendedCovers: [
      cover("bizProperty", "Myymälä, varasto, kassalaitteet ja tuotteet voivat olla toiminnalle kriittisiä.", "esine"),
      cover("bizInterruption", "Toimitilan tai maksujärjestelmän häiriö voi pysäyttää myynnin.", "ke1"),
      cover("bizLiability", "Tuotteet ja asiakkaiden asiointi voivat aiheuttaa tuote- tai vastuuvahinkoja.", "products"),
      cover("bizPeople", "Henkilöstön ja yrittäjän työkyky vaikuttavat arjen toimivuuteen.", "statutory")
    ],
    optionalCovers: [
      optional("bizCyber", "Jos verkkokauppa, maksaminen tai asiakasrekisteri on olennainen.", ["system_dependency"], "standard"),
      optional("bizVehicle", "Jos yritys toimittaa tai kuljettaa tuotteita.", ["vehicles_or_transport"], "trafficKasko")
    ],
    relevantGroup: "retail"
  },
  construction: {
    title: "Rakennus-, asennus- ja huoltoyrityksen vakuutuskokonaisuus",
    summary: "Keskeiset riskit liittyvät työmaihin, työkohteisiin, työvälineisiin, vastuisiin, henkilöstöön ja keskeytyksiin.",
    recommendedCovers: [
      cover("bizProperty", "Työkalut, koneet, materiaalit ja työmaakohteet ovat taloudellisesti merkittäviä.", "rakennustyo"),
      cover("bizLiability", "Työ voi aiheuttaa vahinkoa tilaajalle, sivulliselle tai työn kohteelle.", "operations"),
      cover("bizInterruption", "Kaluston, toimitusten tai avainhenkilön poissaolo voi keskeyttää urakan.", "ke1"),
      cover("bizPeople", "Työtapaturmariski ja henkilöstön työkyky korostuvat fyysisessä työssä.", "statutory")
    ],
    optionalCovers: [
      optional("bizVehicle", "Jos käytössä on huoltoautoja tai muuta kalustoa.", ["vehicles_or_transport"], "fleet"),
      optional("bizConstruction", "Jos urakat tarvitsevat projekti- tai jatkuvaa työmaaturvaa.", ["contract_requirements"], "continuous")
    ],
    relevantGroup: "physical"
  },
  logistics: {
    title: "Kuljetus- ja logistiikkayrityksen vakuutuskokonaisuus",
    summary: "Kokonaisuudessa korostuvat ajoneuvot, kuljetettava tavara, vastuut, henkilöstö ja toiminnan jatkuvuus.",
    recommendedCovers: [
      cover("bizVehicle", "Ajoneuvot ja kalusto ovat toiminnan perusta.", "fleet"),
      cover("bizLiability", "Asiakkaan tavaraan ja kuljetuspalveluun liittyvät vastuut pitää tarkistaa.", "operations"),
      cover("bizInterruption", "Ajoneuvo-, järjestelmä- tai toimitusketjuhäiriö voi keskeyttää toiminnan.", "ke4"),
      cover("bizPeople", "Kuljettajien ja muun henkilöstön lakisääteiset turvat ovat keskeisiä.", "statutory")
    ],
    optionalCovers: [
      optional("bizCargo", "Jos yritys kuljettaa omaa tai asiakkaan tavaraa.", ["cargo_or_goods"], "carrier"),
      optional("bizCyber", "Jos reititys- tai tilausjärjestelmät ovat kriittisiä.", ["system_dependency"], "standard")
    ],
    relevantGroup: "physical"
  },
  manufacturing: {
    title: "Teollisuus- ja valmistusyrityksen vakuutuskokonaisuus",
    summary: "Vakuutustarpeissa korostuvat tuotanto-omaisuus, keskeytys, tuotteisiin liittyvät vastuut ja henkilöstö.",
    recommendedCovers: [
      cover("bizProperty", "Tuotantotilat, koneet, laitteet ja varasto ovat taloudellisesti merkittäviä.", "esine"),
      cover("bizInterruption", "Kone- tai tuotantohäiriö voi vaikuttaa nopeasti liikevaihtoon ja toimituksiin.", "ke1"),
      cover("bizLiability", "Valmistettuihin tuotteisiin voi liittyä tuotevastuuta.", "products"),
      cover("bizPeople", "Työtapaturma- ja työkykyriskit korostuvat tuotannossa.", "statutory")
    ],
    optionalCovers: [
      optional("bizCyber", "Jos tuotanto tai toimitukset riippuvat järjestelmistä.", ["system_dependency"], "pro"),
      optional("bizVehicle", "Jos yrityksellä on omaa kuljetuskalustoa.", ["vehicles_or_transport"], "fleet")
    ],
    relevantGroup: "physical"
  },
  realEstate: {
    title: "Kiinteistö- ja vuokraustoiminnan vakuutuskokonaisuus",
    summary: "Keskeiset vakuutusalueet liittyvät rakennuksiin, omistajan vastuuseen ja vuokratuoton jatkuvuuteen.",
    recommendedCovers: [
      cover("bizProperty", "Rakennukset ja kiinteistöt muodostavat toiminnan keskeisen omaisuusriskin.", "kiinteisto"),
      cover("bizLiability", "Kiinteistön omistamiseen ja hallintaan liittyvät vastuut pitää tarkistaa.", "operations"),
      cover("bizInterruption", "Korvattava vahinko voi keskeyttää vuokratuoton.", "ke3")
    ],
    optionalCovers: [
      optional("bizRealEstate", "Jos haluat tarkentaa rakennuksen, vastuun ja vuokratuoton rakennetta.", ["property_or_assets"], "building"),
      optional("bizCyber", "Jos hallinta, kulunvalvonta tai vuokraus riippuu järjestelmistä.", ["system_dependency"], "standard")
    ],
    relevantGroup: "property"
  },
  healthcare: {
    title: "Terveys- ja hoivapalveluiden vakuutuskokonaisuus",
    summary: "Kokonaisuudessa korostuvat potilas- ja toiminnan vastuut, henkilöstö, toimitilat sekä tietosuoja.",
    recommendedCovers: [
      cover("bizLiability", "Asiakas- ja potilastyöhön liittyvät vastuut pitää erottaa toisistaan.", "operations"),
      cover("bizPeople", "Henkilöstön lakisääteiset turvat ja työkyky ovat toiminnan kannalta keskeisiä.", "statutory"),
      cover("bizCyber", "Terveys- ja henkilötiedot tekevät tietoriskistä olennaisen.", "pro"),
      cover("bizProperty", "Hoitotilat ja laitteet voivat olla toiminnan kannalta kriittisiä.", "esine")
    ],
    optionalCovers: [
      optional("bizInterruption", "Jos tilan, laitteen tai avainhenkilön puuttuminen keskeyttää toiminnan.", ["business_interruption"], "ke1"),
      optional("bizPatient", "Potilasvakuutuksen soveltuvuus tarkistetaan toiminnan sisällön perusteella.", ["patient_work"], "patient")
    ],
    relevantGroup: "service"
  },
  agriculture: {
    title: "Maa-, metsä- ja hevostalouden vakuutuskokonaisuus",
    summary: "Keskeiset riskit liittyvät rakennuksiin, koneisiin, eläimiin, vastuisiin, ajoneuvoihin ja toiminnan jatkuvuuteen.",
    recommendedCovers: [
      cover("bizProperty", "Rakennukset, koneet ja muu tuotanto-omaisuus ovat toiminnan kannalta keskeisiä.", "esine"),
      cover("bizLiability", "Toimintaan, tuotteisiin ja ulkopuolisiin liittyvät vastuut pitää tarkistaa.", "operations"),
      cover("bizInterruption", "Omaisuusvahinko tai tuotannon häiriö voi keskeyttää toiminnan.", "ke1"),
      cover("bizPeople", "Yrittäjän ja työntekijöiden tapaturma- ja työkykyriskit ovat olennaisia.", "entrepreneur")
    ],
    optionalCovers: [
      optional("bizVehicle", "Jos toiminnassa käytetään liikenteessä olevia ajoneuvoja.", ["vehicles_or_transport"], "fleet"),
      optional("bizCyber", "Jos tuotanto tai hallinto riippuu digitaalisista järjestelmistä.", ["system_dependency"], "standard")
    ],
    relevantGroup: "physical"
  },
  automotive: {
    title: "Autoalan vakuutuskokonaisuus",
    summary: "Vakuutustarpeissa korostuvat asiakkaiden ja myytävien ajoneuvojen riskit, korjaamovastuu, omaisuus ja henkilöstö.",
    recommendedCovers: [
      cover("bizVehicle", "Asiakkaiden, myytävien ja huollettavien ajoneuvojen riskit vaativat autoalan erityisratkaisun.", "motorTrade"),
      cover("bizLiability", "Huolto- tai korjausvirhe voi aiheuttaa asiakkaalle vahinkoa.", "operations"),
      cover("bizProperty", "Työkalut, varaosat, laitteet ja toimitilat ovat toiminnalle tärkeitä.", "esine"),
      cover("bizPeople", "Fyysinen työ nostaa esiin henkilöstön lakisääteiset ja työkykyratkaisut.", "statutory")
    ],
    optionalCovers: [
      optional("bizInterruption", "Jos laite- tai tilavahinko pysäyttäisi toiminnan.", ["business_interruption"], "ke1"),
      optional("bizCyber", "Jos ajanvaraus, diagnostiikka tai asiakastiedot ovat kriittisiä.", ["system_dependency"], "standard")
    ],
    relevantGroup: "physical"
  },
  events: {
    title: "Tapahtuma-, matkailu- ja majoitusalan vakuutuskokonaisuus",
    summary: "Kokonaisuudessa korostuvat asiakkaat, toimitilat, tapahtumien keskeytyminen, henkilöstö ja järjestelmät.",
    recommendedCovers: [
      cover("bizLiability", "Asiakastilanteisiin ja tapahtumiin voi liittyä henkilö- ja omaisuusvahinkoja.", "operations"),
      cover("bizProperty", "Tilat, kalusto ja tapahtumatekniikka voivat olla taloudellisesti merkittäviä.", "esine"),
      cover("bizInterruption", "Tapahtuman tai majoitustoiminnan keskeytyminen voi vaikuttaa nopeasti tuloihin.", "ke1"),
      cover("bizPeople", "Henkilöstön ja avainhenkilöiden työkyky vaikuttaa palvelun toteutumiseen.", "statutory")
    ],
    optionalCovers: [
      optional("bizCyber", "Jos varaus-, maksu- tai lipunmyyntijärjestelmä on kriittinen.", ["system_dependency"], "standard"),
      optional("bizVehicle", "Jos asiakkaiden tai kaluston kuljetukset ovat olennaisia.", ["vehicles_or_transport"], "trafficKasko")
    ],
    relevantGroup: "service"
  },
  other: {
    title: "Yrityksen alustava vakuutuskokonaisuus",
    summary: "Vakuutustarve kannattaa jäsentää vastuun, omaisuuden, henkilöstön, jatkuvuuden, järjestelmien ja ajoneuvojen ympärille.",
    recommendedCovers: [
      cover("bizLiability", "Yrityksen toiminnasta voi aiheutua vastuutilanteita asiakkaalle tai ulkopuoliselle.", "operations"),
      cover("bizProperty", "Yrityksen omaisuus, työvälineet tai toimitilat kannattaa tarkistaa.", "esine"),
      cover("bizPeople", "Yrittäjän, työntekijöiden ja avainhenkilöiden työkyky voi olla toiminnan jatkuvuuden kannalta keskeistä.", "entrepreneur")
    ],
    optionalCovers: [
      optional("bizInterruption", "Jos toiminnan keskeytyminen vaikuttaisi nopeasti tuloihin.", ["business_interruption"], "ke1"),
      optional("bizCyber", "Jos järjestelmät, maksaminen tai asiakasdata ovat olennaisia.", ["system_dependency"], "standard"),
      optional("bizVehicle", "Jos yrityksellä on ajoneuvoja tai kuljetuksia.", ["vehicles_or_transport"], "trafficKasko")
    ],
    relevantGroup: "generic"
  }
};

businessPlaybooks.grocery = businessPlaybooks.retail;
businessPlaybooks.commerce = businessPlaybooks.retail;

export const businessRiskAreaPlaybooks = {
  generic: {
    title: "Keskeiset riskialueet keskusteluun",
    riskAreas: [
      { id: "property", title: "Omaisuus, toimitilat, tuotanto ja laitteet", description: "Rakennukset, koneet, laitteet, varastot ja vakuutusmäärät.", relatedCovers: ["bizProperty"] },
      { id: "interruption", title: "Toiminnan keskeytys ja toimitusketju", description: "Keskeytyssyyt, vastuuaika, toimittaja- ja asiakasriippuvuudet.", relatedCovers: ["bizInterruption"] },
      { id: "liability", title: "Vastuu, tuotevastuu ja sopimukset", description: "Toiminnan, tuotteiden, asiantuntijatyön ja sopimusten vastuut.", relatedCovers: ["bizLiability", "bizLegal"] },
      { id: "people", title: "Henkilöstö, työkyky ja avainhenkilöt", description: "Lakisääteiset vakuutukset, työkyky, avainhenkilöt ja sairauspoissaolot.", relatedCovers: ["bizPeople"] },
      { id: "cyber", title: "Kyber, järjestelmät ja data", description: "Tietoturva, tuotanto- ja hallintojärjestelmät sekä keskeytysvaikutus.", relatedCovers: ["bizCyber"] },
      { id: "program", title: "Nykyisen vakuutusohjelman tarkistus", description: "Päällekkäisyydet, puuttuvat turvat, omavastuut ja uusimisajankohta.", relatedCovers: [] }
    ]
  }
};

export const businessRelevantNeedOptions = {
  professional: [
    { id: "financial_error", label: "Virhe neuvossa, suunnitelmassa, koodissa tai laskelmassa voisi aiheuttaa taloudellista vahinkoa", affects: ["bizLiability"], priceImpact: 2 },
    { id: "system_dependency", label: "Järjestelmät, asiakasdata tai tietoturva ovat toiminnalle olennaisia", affects: ["bizCyber", "bizInterruption"], priceImpact: 2 },
    { id: "owner_key_person", label: "Laskutus riippuu yrittäjästä tai muutamasta avainhenkilöstä", affects: ["bizPeople", "bizInterruption"], priceImpact: 1 },
    { id: "property_or_assets", label: "Yrityksellä on arvokkaita laitteita tai toimitila", affects: ["bizProperty"], priceImpact: 1 },
    { id: "contract_requirements", label: "Asiakassopimuksissa on vastuu- tai vakuutusvaatimuksia", affects: ["bizLiability", "bizCyber"], priceImpact: 1 }
  ],
  restaurant: [
    { id: "business_interruption", label: "Toimitilan tai laitteen vahinko pysäyttäisi toiminnan nopeasti", affects: ["bizProperty", "bizInterruption"], priceImpact: 2 },
    { id: "customer_liability", label: "Asiakkaalle voi aiheutua allergia-, ruokamyrkytys-, liukastumis- tai muu vahinko", affects: ["bizLiability"], priceImpact: 1 },
    { id: "system_dependency", label: "Kassa-, maksu-, tilaus- tai varausjärjestelmä on tärkeä", affects: ["bizCyber", "bizInterruption"], priceImpact: 1 },
    { id: "vehicles_or_transport", label: "Yrityksellä on kuljetuksia, cateringia tai food truck -toimintaa", affects: ["bizVehicle"], priceImpact: 1 }
  ],
  generic: [
    { id: "property_or_assets", label: "Toimitila, koneet, laitteet, työkalut tai varasto ovat toiminnalle tärkeitä", affects: ["bizProperty"], priceImpact: 1 },
    { id: "business_interruption", label: "Toiminnan keskeytyminen aiheuttaisi nopeasti taloudellista vahinkoa", affects: ["bizInterruption"], priceImpact: 2 },
    { id: "customer_liability", label: "Yrityksen työ, tuote tai palvelu voi aiheuttaa vahinkoa asiakkaalle", affects: ["bizLiability"], priceImpact: 1 },
    { id: "people_risk", label: "Työntekijöiden tai avainhenkilöiden poissaolo olisi olennainen riski", affects: ["bizPeople"], priceImpact: 1 },
    { id: "system_dependency", label: "Järjestelmät, maksaminen, verkkokauppa tai asiakasdata ovat olennaisia", affects: ["bizCyber"], priceImpact: 1 },
    { id: "vehicles_or_transport", label: "Ajoneuvot, kuljetukset tai liikkuva työ ovat olennaisia", affects: ["bizVehicle"], priceImpact: 1 },
    { id: "cargo_or_goods", label: "Yritys kuljettaa omaa tai asiakkaan tavaraa", affects: ["bizCargo"], priceImpact: 1 },
    { id: "contract_requirements", label: "Sopimuksissa on erityisiä vakuutus- tai vastuuvaatimuksia", affects: ["bizLiability", "bizLegal"], priceImpact: 1 },
    { id: "patient_work", label: "Toimintaan liittyy potilas- tai hoitotyötä", affects: ["bizPatient"], priceImpact: 1 }
  ]
};

["beauty", "service", "retail", "physical", "property"].forEach((key) => {
  businessRelevantNeedOptions[key] = businessRelevantNeedOptions.generic;
});

export const privatePlaybooks = [
  {
    key: "young_renter",
    title: "Nuoren tai vuokra-asujan vakuutuskokonaisuus",
    matches: (profile) => ["under18", "18_25"].includes(profile.ageGroup) || profile.lifeSituation === "student" || profile.livingType === "rent",
    summary: "Elämäntilanteesi perusteella tärkeimmät vakuutusalueet liittyvät todennäköisesti kotiin, tavaroihin, tapaturmiin ja mahdollisiin matkoihin.",
    recommendedCovers: [
      cover("home", "Vuokra-asujalle kodin irtaimisto sekä vastuu- ja oikeusturva kannattaa yleensä tarkistaa.", "perus"),
      cover("health", "Tapaturmat ja hoitoon pääsy voivat olla ajankohtaisia aktiivisessa arjessa.", "tapaturma")
    ]
  },
  {
    key: "family_homeowner",
    title: "Perheen ja omistusasujan vakuutuskokonaisuus",
    matches: (profile) => ["house", "ownerApartment", "semiDetached"].includes(profile.livingType) || profile.lifeSituation === "parentalLeave",
    summary: "Elämäntilanteesi perusteella vakuutusturvassa korostuvat koti, perheen arki ja läheisten taloudellinen turvallisuus.",
    recommendedCovers: [
      cover("home", "Omistusasunnossa tai omakotitalossa rakennus, irtaimisto ja asumisen vastuut kannattaa tarkistaa.", "laaja"),
      cover("health", "Perheen terveys- ja tapaturmaturvat voivat olla ajankohtaisia.", "sairausLaaja"),
      cover("life", "Läheisten taloudellinen turva korostuu, jos perheellä on lapsia, puoliso tai lainaa.", "kuolemanvara")
    ]
  },
  {
    key: "private_entrepreneur",
    title: "Yrittäjän henkilökohtainen vakuutuskokonaisuus",
    matches: (profile) => profile.lifeSituation === "entrepreneur",
    summary: "Tilanteesi perusteella vakuutusturvassa kannattaa huomioida erityisesti oma työkyky, perheen taloudellinen turva ja arjen omaisuus.",
    recommendedCovers: [
      cover("health", "Oma työkyky ja hoitoon pääsy vaikuttavat suoraan toimeentuloon.", "paivaraha"),
      cover("life", "Läheisten taloudellinen turva ja velat kannattaa suhteuttaa yrittäjän tuloriskiin.", "kuolemanvara"),
      cover("home", "Koti ja irtaimisto muodostavat arjen perusturvan.", "laaja")
    ]
  },
  {
    key: "senior",
    title: "Seniorin vakuutuskokonaisuus",
    matches: (profile) => profile.ageGroup === "over65" || profile.lifeSituation === "retired",
    summary: "Tilanteesi perusteella vakuutusturvassa kannattaa huomioida koti, omaisuus, mahdollinen matkustaminen ja vapaa-ajan omaisuus.",
    recommendedCovers: [
      cover("home", "Kodin ja omaisuuden turvan ajantasaisuus kannattaa tarkistaa.", "laaja"),
      cover("travel", "Matkavakuutuksen voimassaolo, ikärajat ja matkojen kesto kannattaa tarkistaa.", "jatkuva")
    ]
  },
  {
    key: "working_adult",
    title: "Työssäkäyvän aikuisen vakuutuskokonaisuus",
    matches: () => true,
    summary: "Tilanteesi perusteella vakuutusturvassa kannattaa huomioida koti, oma terveys, mahdollinen ajoneuvo ja taloudelliset vastuut.",
    recommendedCovers: [
      cover("home", "Koti ja irtaimisto muodostavat usein arjen perusturvan.", "laaja"),
      cover("health", "Terveys- ja tapaturmaturva kannattaa sovittaa arkeen ja työkykyyn.", "sairausLaaja")
    ]
  }
];

export const privateRelevantNeedOptions = [
  { id: "home", label: "Koti ja tavarat", affects: ["home"], priceImpact: 1 },
  { id: "building_or_cottage", label: "Omakotitalo, rakennus tai vapaa-ajan asunto", affects: ["home", "apartment"], priceImpact: 2 },
  { id: "vehicle", label: "Auto, moottoripyörä, mopo tai muu ajoneuvo", affects: ["vehicle"], priceImpact: 1 },
  { id: "health", label: "Oma terveys ja tapaturmat", affects: ["health"], priceImpact: 1 },
  { id: "children_health", label: "Lasten terveys ja tapaturmat", affects: ["health", "life"], priceImpact: 1 },
  { id: "fast_care", label: "Nopea hoitoon pääsy", affects: ["health"], priceImpact: 1 },
  { id: "travel", label: "Matkat", affects: ["travel"], priceImpact: 1 },
  { id: "pet", label: "Lemmikki", affects: ["pet"], priceImpact: 1 },
  { id: "family_financial_security", label: "Läheisten taloudellinen turva", affects: ["life"], priceImpact: 1 },
  { id: "loan", label: "Asuntolaina tai muu iso taloudellinen vastuu", affects: ["life"], priceImpact: 1 },
  { id: "cottage_forest_boat", label: "Mökki, metsä, vene tai muu vapaa-ajan omaisuus", affects: ["apartment", "forest", "boat"], priceImpact: 1 },
  { id: "valuable_hobbies", label: "Harrastusvälineet tai arvokkaat tavarat", affects: ["home"], priceImpact: 1 },
  { id: "current_cover_unclear", label: "Nykyiset vakuutukset ovat epäselvät", affects: ["all"], priceImpact: 0 },
  { id: "unsure", label: "En osaa sanoa", affects: [], priceImpact: 0 }
];

export const priceImpactDisclaimer = "Tämä ei ole lopullinen hinta, vaan suuntaa antava arvio siitä, miten valinnat vaikuttavat vakuutuskokonaisuuden laajuuteen.";

export function indicativePriceSymbol(value) {
  if (typeof value === "number") {
    if (value <= 1) return "€";
    if (value <= 3) return "€€";
    return "€€€";
  }
  const text = String(value || "").toLocaleLowerCase("fi-FI");
  if (text.includes("suppea") || text.includes("liikenne") || text.includes("narrow")) return "€";
  if (text.includes("laaja") || text.includes("plus") || text.includes("pro") || text.includes("fleet") || text.includes("broad")) return "€€€";
  return "€€";
}
