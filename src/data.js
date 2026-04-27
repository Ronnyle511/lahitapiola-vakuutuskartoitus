export const MATERIAL_PAGES = {
  personal: "https://www.lahitapiola.fi/henkilo/asiakkaalle/asioi-sahkoisesti/henkiloasiakkaiden-vakuutusmateriaalit/",
  business: "https://www.lahitapiola.fi/yritys/asiakkaalle/yritysasiakkaiden-materiaalit/"
};

const GENERAL_TERMS_PERSONAL = "https://core-public.editaprima.fi/lahitapiola/download/4662/10/L-EH-04091-fi_2BrGwKoEF5";
const GENERAL_TERMS_BUSINESS = "https://public.brandgate.fi/lahitapiola/lahitapiola/fi/tiedostot/130957/";
const GENERAL_TERMS_BUSINESS_PERSON = "https://core-public.editaprima.fi/lahitapiola/download/1346/10";

const m = (label, url, kind = "pdf") => ({ label, url, kind });

export const profiles = {
  personal: {
    id: "personal",
    label: "Henkilöasiakas",
    heroTitle: "Löydä tilanteeseesi sopivat vakuutukset",
    heroLead: "Vastaa lyhyesti elämäntilanteestasi, tutki perustellut suositukset ja avaa tuoteselosteet ennen yhteydenottoa.",
    introTitle: "Aloita omasta tilanteestasi",
    introText: "Kartoitus tunnistaa ensin olennaiset vakuutuslajit. Vasta sen jälkeen voit tarkentaa yksittäistä vakuutusta, kuten kotia, ajoneuvoa, matkaa, terveyttä, henkeä tai lemmikkiä.",
    shortText: "Kysymme asumisesta, ajoneuvoista, matkoista, terveydestä, läheisistä, eläimistä, omaisuudesta ja taloudellisesta puskurista.",
    detailText: "Syventävä vaihe antaa konkreettisen ehdotuksen turvatasosta, lisäturvista, omavastuusta ja jatkotarkistuksista.",
    layer1Chips: ["Asuminen", "Ajoneuvot", "Matkat", "Terveys", "Läheiset", "Eläimet", "Omaisuus"],
    layer2Chips: ["Koti", "Ajoneuvo", "Matka", "Terveys", "Henki", "Koira ja kissa"],
    materialsIntro: "Henkilöasiakkaan materiaalit ja suorat PDF-linkit silloin, kun ne on varmistettu."
  },
  business: {
    id: "business",
    label: "Yritysasiakas",
    heroTitle: "Kartoita yrityksen vakuutustarpeet",
    heroLead: "Vastaa yrityksen tilanteesta kevyesti, näe tärkeimmät vakuutuslajit ja tarkenna vain ne osa-alueet, jotka ovat liiketoiminnalle olennaisia.",
    introTitle: "Aloita yrityksen perustilanteesta",
    introText: "Yrityspuolen ensimmäinen vaihe ei mene tuotteisiin liian syvälle. Se tunnistaa, liittyykö tilanteeseen omaisuutta, vastuita, henkilöstöä, keskeytysriskiä, ajoneuvoja, matkoja, kuljetuksia tai digitaalista riskiä.",
    shortText: "Kysymme yrityksen koosta, toimialasta, omaisuudesta, ihmisistä, liikkumisesta, digitaalisuudesta ja kassavaikutuksesta.",
    detailText: "Syventävä vaihe tarkentaa esimerkiksi vakuutettavaa omaisuutta, vastuun lähdettä, keskeytyksen syytä, kyberturvaa tai henkilöstöratkaisua.",
    layer1Chips: ["Yrityksen koko", "Toimiala", "Omaisuus", "Ihmiset", "Liikkuminen", "Digitaalisuus", "Kassa"],
    layer2Chips: ["Omaisuus", "Vastuu", "Keskeytys", "Kyber", "Henkilöstö", "Ajoneuvot", "Matka", "Kuljetus"],
    materialsIntro: "Yritysasiakkaiden materiaalit perustuvat LähiTapiolan yritysasiakkaiden materiaalilistaan ja suoriin PDF-linkkeihin."
  }
};

export const insuranceTypes = {
  personal: {
    home: {
      title: "Kotivakuutus",
      area: "Kodin ja tavaroiden suoja",
      desc: "Koti, irtaimisto, rakennus, vastuu, oikeusturva ja mahdollinen matkatavaraturva.",
      detailFlow: "home",
      materials: [
        m("Tuoteseloste", "https://public.egate.fi/lahitapiola/lahitapiola/fi/tiedostot/228622/"),
        m("Avaintietoasiakirja", "https://public.egate.fi/lahitapiola/lahitapiola/fi/tiedostot/226792/"),
        m("Vakuutusehdot", "https://public.egate.fi/lahitapiola/lahitapiola/fi/tiedostot/226619/"),
        m("Yleiset sopimusehdot", GENERAL_TERMS_PERSONAL)
      ]
    },
    vehicle: {
      title: "Ajoneuvovakuutus",
      area: "Autoilu ja ajoneuvot",
      desc: "Liikennevakuutus ja vapaaehtoinen kasko ajoneuvon käyttöön, arvoon ja lisäturvatarpeisiin.",
      detailFlow: "vehicle",
      materials: [
        m("Tuoteseloste", "https://core-public.editaprima.fi/lahitapiola/download/6520/10"),
        m("Avaintietoasiakirja", "https://core-public.editaprima.fi/lahitapiola/download/6480/10"),
        m("Vakuutusehdot", "https://core-public.editaprima.fi/lahitapiola/download/6175/10"),
        m("Yleiset sopimusehdot", GENERAL_TERMS_PERSONAL)
      ]
    },
    travel: {
      title: "Matkavakuutus",
      area: "Matkustaminen",
      desc: "Matkustajan hoitoturva, peruuntuminen, keskeytyminen, myöhästyminen, matkatavarat ja matkavastuu.",
      detailFlow: "travel",
      materials: [
        m("Tuoteseloste", "https://core-public.editaprima.fi/lahitapiola/download/5303/10"),
        m("Avaintietoasiakirja", "https://core-public.editaprima.fi/lahitapiola/download/5534/10"),
        m("Vakuutusehdot", "https://core-public.editaprima.fi/lahitapiola/download/5300/10"),
        m("Yleiset sopimusehdot", GENERAL_TERMS_PERSONAL)
      ]
    },
    health: {
      title: "Terveys- ja tapaturmavakuutus",
      area: "Terveys ja hoitokulut",
      desc: "Sairauden hoitoturva, tapaturman hoitoturva, urheiluturva, pysyvän haitan turva ja päivärahat.",
      detailFlow: "health",
      materials: [
        m("Tuoteseloste", "https://core-public.editaprima.fi/lahitapiola/download/5293/10"),
        m("Avaintietoasiakirja", "https://core-public.editaprima.fi/lahitapiola/download/5533/10"),
        m("Vakuutusehdot", "https://core-public.editaprima.fi/lahitapiola/download/5282/10"),
        m("Yleiset sopimusehdot", GENERAL_TERMS_PERSONAL)
      ]
    },
    life: {
      title: "Henkivakuutus",
      area: "Läheisten taloudellinen turva",
      desc: "Kuolemanvaraturva, vakavan sairauden kertakorvaus, vakuutusmäärä ja edunsaaja.",
      detailFlow: "life",
      materials: [
        m("Henkiturvan tuoteseloste", "https://public.egate.fi/lahitapiola/lahitapiola/fi/tiedostot/227300/"),
        m("Henkiturvan vakuutusehdot", "https://public.egate.fi/lahitapiola/lahitapiola/fi/tiedostot/227303/"),
        m("Materiaalilista", MATERIAL_PAGES.personal, "page")
      ]
    },
    pet: {
      title: "Koira- ja kissavakuutus",
      area: "Lemmikit",
      desc: "Koiran ja kissan eläinlääkärikulut, henki-, käyttöominaisuus- ja koiran vastuuvakuutus.",
      detailFlow: "pet",
      materials: [
        m("Tuoteseloste", "https://public.egate.fi/lahitapiola/lahitapiola/fi/tiedostot/228253/"),
        m("Avaintietoasiakirja", "https://public.egate.fi/lahitapiola/lahitapiola/fi/tiedostot/226794/"),
        m("Vakuutusehdot", "https://public.egate.fi/lahitapiola/lahitapiola/fi/tiedostot/226633/")
      ]
    },
    horse: {
      title: "Hevosvakuutus",
      area: "Eläimet",
      desc: "Hevosen hoitoon ja eläinriskeihin liittyvä vakuutustarve.",
      materials: [m("Materiaalilista", MATERIAL_PAGES.personal, "page")]
    },
    boat: {
      title: "Venevakuutus",
      area: "Veneily",
      desc: "Veneen, varusteiden ja veneilyyn liittyvien vahinkojen turva.",
      materials: [m("Tuoteseloste", "https://core-public.editaprima.fi/lahitapiola/download/1034/10"), m("Materiaalilista", MATERIAL_PAGES.personal, "page")]
    },
    apartment: {
      title: "Huoneistoturvavakuutus",
      area: "Vuokrattava tai omistettu huoneisto",
      desc: "Huoneiston omistajan erillinen turva ja vuokranantajan näkökulma.",
      materials: [m("Materiaalilista", MATERIAL_PAGES.personal, "page")]
    },
    forest: {
      title: "Metsävakuutus",
      area: "Metsä",
      desc: "Metsäomaisuuden myrsky-, palo-, lumi- ja hyönteisriskien tarkistus.",
      materials: [m("Materiaalilista", MATERIAL_PAGES.personal, "page")]
    },
    pregnancy: {
      title: "Raskausajan turva",
      area: "Perhe ja lapsi",
      desc: "Raskauden aikainen turva ja syntyvän lapsen vakuutustarpeen selvitys.",
      materials: [m("Tuoteseloste ja ehdot", "https://core-public.editaprima.fi/lahitapiola/download/6466/10"), m("Materiaalilista", MATERIAL_PAGES.personal, "page")]
    },
    childSerious: {
      title: "Lapsen vakavan sairauden turva",
      area: "Perhe ja lapsi",
      desc: "Lapsen vakavan sairauden varalle suunnattu taloudellinen turva.",
      materials: [m("Avaintieto / materiaali", "https://core-public.editaprima.fi/lahitapiola/download/3205/10"), m("Materiaalilista", MATERIAL_PAGES.personal, "page")]
    },
    investment: {
      title: "Sijoitusvakuutus",
      area: "Sijoittaminen",
      desc: "Sijoitusvakuutus ja varallisuuden suunnittelu.",
      materials: [
        m("Tuoteseloste", "https://public.egate.fi/lahitapiola/lahitapiola/fi/tiedostot/192142/"),
        m("Avaintietoasiakirja", "https://core-public.editaprima.fi/lahitapiola/download/7072/10"),
        m("Materiaalilista", MATERIAL_PAGES.personal, "page")
      ]
    }
  },
  business: {
    bizProperty: {
      title: "Yrityksen omaisuus- ja esinevakuutus",
      area: "Omaisuus ja toiminta",
      desc: "Toimitilat, koneet, laitteet, työkalut, varasto, vaihto-omaisuus ja vuokratilan muutostyöt.",
      detailFlow: "bizProperty",
      materials: [
        m("Yritysvakuutus tuoteseloste", "https://core-public.editaprima.fi/lahitapiola/download/3570/10"),
        m("Yrityksen esinevakuutus", "https://core-public.editaprima.fi/lahitapiola/download/4296/10"),
        m("ES1 Esinevakuutus ehdot", "https://core-public.editaprima.fi/lahitapiola/download/1687/10"),
        m("Huoneistoturva", "https://public.egate.fi/lahitapiola/lahitapiola/fi/tiedostot/224458/"),
        m("YS15 yleiset sopimusehdot", GENERAL_TERMS_BUSINESS)
      ]
    },
    bizLiability: {
      title: "Yrityksen vastuuvakuutukset",
      area: "Vastuut",
      desc: "Toiminnan vastuu, tuotevastuu, varallisuusvastuu, IT-vastuu, hallinnon vastuu ja erityisvastuut.",
      detailFlow: "bizLiability",
      materials: [
        m("Toiminnan vastuuvakuutus", "https://core-public.editaprima.fi/lahitapiola/download/6573/10"),
        m("Tuotevastuuvakuutus", "https://core-public.editaprima.fi/lahitapiola/download/6579/10"),
        m("Varallisuusvastuuvakuutus", "https://core-public.editaprima.fi/lahitapiola/download/6581/10"),
        m("IT-toiminnan vastuuvakuutus", "https://core-public.editaprima.fi/lahitapiola/download/6580/10"),
        m("Hallinnon vastuuvakuutukset", "https://core-public.editaprima.fi/lahitapiola/download/6571/10"),
        m("VY1 yhteiset ehdot", "https://core-public.editaprima.fi/lahitapiola/download/1440/10")
      ]
    },
    bizInterruption: {
      title: "Keskeytysvakuutus",
      area: "Toiminnan jatkuvuus",
      desc: "Omaisuus-, henkilö-, vuokratuotto- ja riippuvuuskeskeytys yrityksen kassavirran suojaamiseen.",
      detailFlow: "bizInterruption",
      materials: [
        m("Omaisuuskeskeytysvakuutukset", "https://core-public.editaprima.fi/lahitapiola/download/4312/10"),
        m("Henkilökeskeytysvakuutus", "https://core-public.editaprima.fi/lahitapiola/download/7175/10"),
        m("KE1 Keskeytysvakuutus", "https://public.brandgate.fi/lahitapiola/lahitapiola/fi/tiedostot/120102/"),
        m("KE2 Henkilökeskeytys", "https://public.brandgate.fi/lahitapiola/lahitapiola/fi/tiedostot/120105/"),
        m("KE3 Vuokratuottokeskeytys", "https://public.brandgate.fi/lahitapiola/lahitapiola/fi/tiedostot/120108/"),
        m("KE4 Riippuvuuskeskeytys", "https://public.brandgate.fi/lahitapiola/lahitapiola/fi/tiedostot/120111/")
      ]
    },
    bizCyber: {
      title: "Kybervakuutus",
      area: "Digitaalinen riski",
      desc: "Tietomurrot, kiristyshaittaohjelmat, järjestelmäkatkot, asiantuntija-apu ja kybervastuut.",
      detailFlow: "bizCyber",
      materials: [
        m("Kybervakuutus tuoteseloste", "https://public.egate.fi/lahitapiola/lahitapiola/fi/tiedostot/225564/"),
        m("CY2 Kybervakuutus ehdot", "https://public.egate.fi/lahitapiola/lahitapiola/fi/tiedostot/225474/"),
        m("Kybervakuutus Pro", "https://core-public.editaprima.fi/lahitapiola/download/5769/10")
      ]
    },
    bizVehicle: {
      title: "Yrityksen ajoneuvovakuutukset",
      area: "Ajoneuvot ja kalusto",
      desc: "Liikennevakuutus, kasko, ryhmäliikenne, autoliikekasko ja korjaamokasko.",
      detailFlow: "bizVehicle",
      materials: [
        m("Ajoneuvovakuutukset yrityksille", "https://core-public.editaprima.fi/lahitapiola/download/2374/10"),
        m("Liikennevakuutus", "https://public.egate.fi/lahitapiola/lahitapiola/fi/tiedostot/217483/"),
        m("Kaskovakuutus", "https://public.egate.fi/lahitapiola/lahitapiola/fi/tiedostot/217491/"),
        m("Ryhmäliikenne ja Autoliikekasko", "https://public.egate.fi/lahitapiola/lahitapiola/fi/tiedostot/224308/"),
        m("Korjaamokasko", "https://public.egate.fi/lahitapiola/lahitapiola/fi/tiedostot/224304/")
      ]
    },
    bizPeople: {
      title: "Henkilö- ja työkykyratkaisut",
      area: "Ihmiset",
      desc: "Työtapaturma, yrittäjän tapaturma, työkyky, sairauskulut, avainhenkilöt ja henkilöstöedut.",
      detailFlow: "bizPeople",
      materials: [
        m("Työtapaturmavakuutus tuoteseloste", "https://core-public.editaprima.fi/lahitapiola/download/2711/10"),
        m("Työtapaturmavakuutus", "https://public.egate.fi/lahitapiola/lahitapiola/fi/tiedostot/223609/"),
        m("Työtapaturmaehdot", "https://public.brandgate.fi/lahitapiola/lahitapiola/fi/tiedostot/142555/"),
        m("Yrittäjien tapaturmavakuutus", "https://public.egate.fi/lahitapiola/lahitapiola/fi/tiedostot/223904/"),
        m("Sairauskuluvakuutukset", "https://public.egate.fi/lahitapiola/lahitapiola/fi/tiedostot/225353/"),
        m("Työkykyvakuutus", "https://public.egate.fi/lahitapiola/lahitapiola/fi/tiedostot/224651/"),
        m("Henkilövakuutusten yleiset ehdot", GENERAL_TERMS_BUSINESS_PERSON)
      ]
    },
    bizTravel: {
      title: "Yrityksen matkavakuutukset",
      area: "Työmatkat",
      desc: "Työmatkat, komennukset, matkustajaturva, matkatavarat, matkavastuu ja matkaoikeusturva.",
      detailFlow: "bizTravel",
      materials: [
        m("Matkavakuutukset", "https://public.egate.fi/lahitapiola/lahitapiola/fi/tiedostot/225359/"),
        m("Komennusvakuutus", "https://public.egate.fi/lahitapiola/lahitapiola/fi/tiedostot/225355/"),
        m("Matkustajavakuutus", "https://public.brandgate.fi/lahitapiola/lahitapiola/fi/tiedostot/109811/.pdf"),
        m("Matkatavara- ja matkavastuu", "https://public.brandgate.fi/lahitapiola/lahitapiola/fi/tiedostot/111317/.pdf"),
        m("Matkaoikeusturva", "https://public.egate.fi/lahitapiola/lahitapiola/fi/tiedostot/144198/")
      ]
    },
    bizCargo: {
      title: "Kuljetusvakuutukset",
      area: "Kuljetus ja logistiikka",
      desc: "Tavarankuljetus, tiekuljetusvastuu, autokuljetus ja logistiikkaoperaattorin vastuu.",
      detailFlow: "bizCargo",
      materials: [
        m("Jatkuva tavarankuljetusvakuutus", "https://public.egate.fi/lahitapiola/lahitapiola/fi/tiedostot/225177/"),
        m("Tavaran kertakuljetusvakuutus", "https://public.egate.fi/lahitapiola/lahitapiola/fi/tiedostot/225179/"),
        m("Tiekuljetusvastuuvakuutus", "https://public.egate.fi/lahitapiola/lahitapiola/fi/tiedostot/225183/"),
        m("Autokuljetusvakuutus", "https://public.egate.fi/lahitapiola/lahitapiola/fi/tiedostot/225181/"),
        m("Logistiikkaoperaattoreiden vastuu", "https://public.egate.fi/lahitapiola/lahitapiola/fi/tiedostot/225185/"),
        m("Kuljetusvakuutusten yleiset ehdot", "https://public.brandgate.fi/lahitapiola/lahitapiola/fi/tiedostot/124352/.pdf")
      ]
    },
    bizLegal: {
      title: "Yrityksen oikeusturvavakuutus",
      area: "Riita- ja oikeudenkäyntikulut",
      desc: "Sopimus-, asiakas-, työsuhde-, vuokra- ja immateriaalioikeusriitoihin varautuminen.",
      detailFlow: "bizLegal",
      materials: [
        m("Yrityksen oikeusturvavakuutus", "https://public.egate.fi/lahitapiola/lahitapiola/fi/tiedostot/224287/"),
        m("OK1 Oikeudenkäyntikuluvakuutus", "https://core-public.editaprima.fi/lahitapiola/download/1755/10"),
        m("OK2 Immateriaalioikeudet", "https://core-public.editaprima.fi/lahitapiola/download/5181/10")
      ]
    },
    bizRealEstate: {
      title: "Kiinteistövakuutus",
      area: "Kiinteistöt",
      desc: "Yrityksen omistamat rakennukset, kiinteistöt ja vuokratuottoriski.",
      detailFlow: "bizRealEstate",
      materials: [
        m("Kiinteistövakuutus", "https://public.egate.fi/lahitapiola/lahitapiola/fi/tiedostot/224300/"),
        m("Kiinteistövakuutuksen tuoteseloste", "https://core-public.editaprima.fi/lahitapiola/download/2074/10"),
        m("Kiinteistövakuutus 5600 ehdot", "https://core-public.editaprima.fi/lahitapiola/download/1435/10"),
        m("KE3 Vuokratuottokeskeytys", "https://public.brandgate.fi/lahitapiola/lahitapiola/fi/tiedostot/120108/")
      ]
    },
    bizPatient: {
      title: "Potilasvakuutus",
      area: "Sote ja terveyspalvelut",
      desc: "Terveyden- ja sairaanhoitotoiminnan potilasvahinkoriskit.",
      detailFlow: "bizPatient",
      materials: [
        m("Potilasvakuutus", "https://public.egate.fi/lahitapiola/lahitapiola/fi/tiedostot/230258/"),
        m("Potilasvakuutuksen tuoteseloste", "https://public.egate.fi/lahitapiola/lahitapiola/fi/tiedostot/230380/"),
        m("Potilasvakuutusehto", "https://public.egate.fi/lahitapiola/lahitapiola/fi/tiedostot/230124/")
      ]
    },
    bizConstruction: {
      title: "Rakennus- ja asennustyövakuutus",
      area: "Rakentaminen",
      desc: "Rakennus-, asennus- ja korjaustöiden kohde-, materiaali- ja vastuukokonaisuudet.",
      detailFlow: "bizConstruction",
      materials: [
        m("Rakennus- ja asennustyövakuutukset", "https://core-public.editaprima.fi/lahitapiola/download/4295/10"),
        m("Rakennus- ja asennustyövakuutus", "https://core-public.editaprima.fi/lahitapiola/download/5889/10"),
        m("904 Määräaikainen", "https://core-public.editaprima.fi/lahitapiola/download/1871/10"),
        m("905 Jatkuva", "https://core-public.editaprima.fi/lahitapiola/download/1873/10"),
        m("Suorituskyvyttömyysvakuutus", "https://public.egate.fi/lahitapiola/lahitapiola/fi/tiedostot/224321/"),
        m("B10 Suojeluohje", "https://public.brandgate.fi/lahitapiola/lahitapiola/fi/tiedostot/120042/")
      ]
    }
  }
};

const score = (points, reason) => ({ points, reason });

export const quickQuestions = {
  personal: [
    {
      id: "housing",
      title: "Miten asut?",
      desc: "Valitse kaikki, jotka kuvaavat tilannettasi.",
      multi: true,
      options: [
        { value: "rent", label: "Asun vuokralla", scores: { home: score(5, "vuokralla asuminen nostaa esiin irtaimiston sekä vastuu- ja oikeusturvan") } },
        { value: "own_apartment", label: "Asun omistusasunnossa", scores: { home: score(6, "omistusasunnossa irtaimisto, kiinteät sisustukset ja osakkaan muutostyöt kannattaa tarkistaa") } },
        { value: "house", label: "Omistan tai asun omakotitalossa", scores: { home: score(8, "omakotitalossa rakennus, irtaimisto ja pihapiirin kohteet kannattaa suojata") } },
        { value: "holiday", label: "Minulla on mökki tai vapaa-ajan asunto", scores: { home: score(6, "vapaa-ajan asunnon rakennus ja irtaimisto voivat tarvita oman tarkennuksen") } },
        { value: "landlord", label: "Vuokraan asuntoa muille", scores: { home: score(4, "vuokrattavan kohteen omistajanäkökulma kannattaa huomioida"), apartment: score(5, "vuokraat asuntoa muille") } },
        { value: "none", label: "Ei ajankohtaista" }
      ]
    },
    {
      id: "vehicle",
      title: "Omistatko tai käytätkö autoa tai muuta ajoneuvoa?",
      desc: "Ajoneuvo voi nostaa esiin lakisääteisen liikennevakuutuksen ja kaskon.",
      options: [
        { value: "daily", label: "Kyllä, käytän ajoneuvoa päivittäin", scores: { vehicle: score(7, "käytät ajoneuvoa päivittäin") } },
        { value: "sometimes", label: "Kyllä, käytän ajoneuvoa satunnaisesti", scores: { vehicle: score(5, "käytät ajoneuvoa ainakin ajoittain") } },
        { value: "owner_not_daily", label: "Omistan ajoneuvon, mutta käyttö on vähäistä", scores: { vehicle: score(4, "omistat ajoneuvon, vaikka käyttö on vähäistä") } },
        { value: "no", label: "En" }
      ]
    },
    {
      id: "travel",
      title: "Millaisia matkoja teet?",
      desc: "Voit valita useamman.",
      multi: true,
      options: [
        { value: "abroad_often", label: "Ulkomaanmatkoja useita kertoja vuodessa", scores: { travel: score(7, "matkustat ulkomaille useita kertoja vuodessa"), home: score(1, "ulkomaanmatkat voivat vaikuttaa kotivakuutuksen matkatavaraturvaan") } },
        { value: "abroad_sometimes", label: "Satunnaisia ulkomaanmatkoja", scores: { travel: score(5, "matkustat ulkomaille satunnaisesti"), home: score(1, "ulkomaanmatkat voivat vaikuttaa kotivakuutuksen matkatavaraturvaan") } },
        { value: "domestic", label: "Kotimaanmatkoja yli 50 km päähän kodista", scores: { travel: score(3, "teet kotimaanmatkoja yli 50 kilometrin päähän") } },
        { value: "long_trip", label: "Yli kolmen kuukauden matkoja", scores: { travel: score(5, "yli kolmen kuukauden matka vaatii voimassaolon tarkistamista") } },
        { value: "none", label: "En juuri matkusta" }
      ]
    },
    {
      id: "health",
      title: "Mitä painotat terveyteen liittyvässä turvassa?",
      desc: "Voit valita useamman.",
      multi: true,
      options: [
        { value: "fast_care", label: "Nopea pääsy yksityiselle lääkärille", scores: { health: score(6, "nopea hoitoon pääsy on sinulle tärkeää") } },
        { value: "accident", label: "Tapaturmien hoitokulut", scores: { health: score(5, "tapaturmien hoitokulut kiinnostavat") } },
        { value: "sports", label: "Urheilu tai aktiivinen harrastaminen", scores: { health: score(5, "urheilu tai aktiivinen harrastus voi edellyttää tarkempaa tapaturmaturvaa") } },
        { value: "income", label: "Toimeentulo sairauden tai tapaturman aikana", scores: { health: score(4, "toimeentulon suoja sairauden tai tapaturman aikana kiinnostaa") } },
        { value: "none", label: "Ei erityistä painotusta" }
      ]
    },
    {
      id: "family",
      title: "Onko joku taloudellisesti riippuvainen sinusta?",
      desc: "Tämä vaikuttaa läheisten taloudellisen turvan tarpeeseen.",
      options: [
        { value: "yes", label: "Kyllä, selvästi", scores: { life: score(7, "muita on taloudellisesti riippuvaisia sinusta") } },
        { value: "partly", label: "Jonkin verran", scores: { life: score(4, "tuloillasi voi olla merkitystä muille") } },
        { value: "no", label: "Ei" }
      ]
    },
    {
      id: "pets",
      title: "Onko sinulla lemmikkejä tai eläimiä?",
      desc: "Voit valita useamman.",
      multi: true,
      options: [
        { value: "dog_cat", label: "Koira tai kissa", scores: { pet: score(7, "sinulla on koira tai kissa") } },
        { value: "horse", label: "Hevonen", scores: { horse: score(6, "sinulla on hevonen") } },
        { value: "other_pet", label: "Muu lemmikki tai eläin", scores: { pet: score(3, "eläinvakuutuksen tarve kannattaa tarkistaa") } },
        { value: "none", label: "Ei eläimiä" }
      ]
    },
    {
      id: "property",
      title: "Mitä muuta omaisuutta tai varallisuutta sinulla on?",
      desc: "Voit valita useamman.",
      multi: true,
      options: [
        { value: "boat", label: "Vene", scores: { boat: score(6, "sinulla on vene") } },
        { value: "forest", label: "Metsää", scores: { forest: score(6, "sinulla on metsää") } },
        { value: "rental_apartment", label: "Vuokra-asunto tai sijoitusasunto", scores: { apartment: score(5, "sinulla on vuokra- tai sijoitusasunto"), home: score(2, "vuokrattavan asunnon omistajan näkökulma kannattaa tarkistaa") } },
        { value: "investments", label: "Sijoitusvarallisuutta", scores: { investment: score(4, "sijoitusvarallisuus tai varallisuussuunnittelu on ajankohtaista") } },
        { value: "none", label: "Ei näistä" }
      ]
    },
    {
      id: "children",
      title: "Liittyykö tilanteeseesi raskaus tai lapsen turva?",
      desc: "Valitse lähin vaihtoehto.",
      options: [
        { value: "pregnancy", label: "Raskaus on ajankohtainen", scores: { pregnancy: score(7, "raskaus on ajankohtainen"), health: score(2, "perheen terveys- ja lapsiturvat voivat olla ajankohtaisia") } },
        { value: "child", label: "Minulla on lapsi ja haluan selvittää lapsen turvaa", scores: { childSerious: score(5, "lapsen turva on ajankohtainen"), health: score(2, "lapsen terveys- ja tapaturmaturvaa kannattaa selvittää") } },
        { value: "no", label: "Ei ajankohtaista" }
      ]
    },
    {
      id: "shock",
      title: "Olisiko iso yllättävä kulu vaikea maksaa itse?",
      desc: "Tämä vaikuttaa siihen, kuinka vahvasti vakuutuksia kannattaa nostaa esiin.",
      options: [
        { value: "yes", label: "Kyllä, se olisi vaikeaa", scores: { home: score(2, "iso yllättävä kulu olisi vaikea maksaa itse"), vehicle: score(2, "iso yllättävä kulu olisi vaikea maksaa itse"), health: score(2, "iso yllättävä kulu olisi vaikea maksaa itse"), travel: score(2, "iso yllättävä kulu olisi vaikea maksaa itse"), life: score(2, "iso yllättävä kulu olisi vaikea maksaa itse"), pet: score(2, "iso yllättävä kulu olisi vaikea maksaa itse") } },
        { value: "somewhat", label: "Jonkin verran", scores: { home: score(1, "iso yllättävä kulu olisi jonkin verran vaikea"), health: score(1, "iso yllättävä kulu olisi jonkin verran vaikea"), travel: score(1, "iso yllättävä kulu olisi jonkin verran vaikea") } },
        { value: "no", label: "Ei erityisen vaikeaa" }
      ]
    },
    {
      id: "currentCovers",
      title: "Mitä vakuutuksia sinulla on jo?",
      desc: "Tämä ei poista suositusta, vaan auttaa nostamaan esiin tarkistettavat kohdat.",
      multi: true,
      options: [
        { value: "home", label: "Kotivakuutus", existing: ["home"] },
        { value: "vehicle", label: "Ajoneuvovakuutus", existing: ["vehicle"] },
        { value: "travel", label: "Matkavakuutus", existing: ["travel"] },
        { value: "health", label: "Terveys- tai tapaturmavakuutus", existing: ["health"] },
        { value: "life", label: "Henkivakuutus", existing: ["life"] },
        { value: "pet", label: "Lemmikkivakuutus", existing: ["pet"] },
        { value: "none", label: "Ei näistä tai en tiedä" }
      ]
    }
  ],
  business: [
    {
      id: "companySize",
      title: "Minkä kokoinen yritys on?",
      desc: "Kysymys auttaa hahmottamaan henkilöstöön ja yrittäjään liittyviä perustarpeita.",
      options: [
        { value: "solo", label: "Yrittäjä ilman työntekijöitä", scores: { bizPeople: score(4, "yrittäjän oma henkilö- ja työkykyturva voi olla keskeinen") } },
        { value: "micro", label: "2-9 henkilöä", scores: { bizPeople: score(7, "yrityksessä on työntekijöitä, jolloin työtapaturma- ja henkilöstöriskit pitää kartoittaa") } },
        { value: "small", label: "10-49 henkilöä", scores: { bizPeople: score(8, "henkilöstömäärä nostaa työtapaturman ja työkyvyn vahvasti esiin") } },
        { value: "medium", label: "50+ henkilöä", scores: { bizPeople: score(8, "henkilöstömäärä vaatii henkilöriskien ja työkyvyn järjestelmällistä tarkistusta") } }
      ]
    },
    {
      id: "industry",
      title: "Mikä kuvaa parhaiten yrityksen toimintaa?",
      desc: "Valitse lähin vaihtoehto. Tarkemmat tuotekohtaiset kysymykset tulevat vasta syventävässä vaiheessa.",
      options: [
        { value: "expert_it", label: "Asiantuntija-, konsultointi- tai IT-palvelut", scores: { bizLiability: score(5, "asiantuntija- tai IT-palvelu voi synnyttää vastuu- ja sopimusriskejä"), bizCyber: score(5, "toiminta on usein riippuvainen järjestelmistä tai asiakasdatasta"), bizLegal: score(3, "sopimukset ja immateriaalioikeudet voivat olla ajankohtaisia") } },
        { value: "retail", label: "Kauppa, verkkokauppa tai maahantuonti", scores: { bizProperty: score(5, "toimitila, varasto tai myytävät tuotteet voivat olla keskeisiä"), bizLiability: score(4, "tuotteisiin ja asiakkaisiin voi liittyä vastuukysymyksiä"), bizCargo: score(3, "tavaran kuljetukset voivat olla ajankohtaisia") } },
        { value: "construction", label: "Rakennus, asennus tai kunnossapito", scores: { bizConstruction: score(7, "rakennus- ja asennustoiminta tarvitsee usein oman työmaa- tai projektitarkennuksen"), bizLiability: score(5, "työmaalla voi syntyä vastuita asiakkaalle tai sivulliselle"), bizProperty: score(4, "työkalut, koneet ja materiaalit voivat tarvita omaisuusturvaa") } },
        { value: "manufacturing", label: "Valmistus, teollisuus tai korjaus", scores: { bizProperty: score(6, "tuotannossa koneet, laitteet ja varasto ovat usein keskeisiä"), bizInterruption: score(5, "tuotannon pysähtyminen voi vaikuttaa liikevaihtoon nopeasti"), bizLiability: score(4, "tuotteisiin voi liittyä vastuukysymyksiä") } },
        { value: "healthcare", label: "Sote-, hoiva- tai terveyspalvelut", scores: { bizPatient: score(7, "terveyden- ja sairaanhoitotoimintaan voi liittyä potilasvahinkoriski"), bizPeople: score(5, "henkilöstön työkyky ja lakisääteiset henkilöriskit korostuvat"), bizLiability: score(5, "toiminnan vastuut kannattaa tarkistaa") } },
        { value: "logistics", label: "Kuljetus tai logistiikka", scores: { bizCargo: score(7, "kuljetus- ja logistiikkavastuut ovat toiminnan ytimessä"), bizVehicle: score(7, "ajoneuvot ja kalusto ovat keskeisiä"), bizLiability: score(5, "kuljetusvastuut ja sivullisvahingot pitää kartoittaa") } },
        { value: "real_estate", label: "Kiinteistö, vuokraus tai taloyhtiöpalvelut", scores: { bizRealEstate: score(7, "kiinteistö tai vuokrattava kohde on toiminnan ytimessä"), bizInterruption: score(5, "vuokratuoton keskeytys voi olla keskeinen riski"), bizLiability: score(4, "kiinteistön omistajan vastuut kannattaa huomioida") } },
        { value: "restaurant_event", label: "Ravintola, tapahtuma tai vapaa-aika", scores: { bizProperty: score(5, "toimitila, kalusto ja vaihto-omaisuus ovat keskeisiä"), bizInterruption: score(6, "sesonki- tai tapahtumakeskeytys voi vaikuttaa kassaan nopeasti"), bizLiability: score(5, "asiakas- ja yleisövahingot kannattaa huomioida") } },
        { value: "other", label: "Muu palvelu tai toiminta", scores: { bizLiability: score(3, "vastuut ja sopimukset kannattaa tarkistaa toiminnan mukaan") } }
      ]
    },
    {
      id: "assets",
      title: "Mitä yrityksellä on käytössä tai omistuksessa?",
      desc: "Voit valita useamman.",
      multi: true,
      options: [
        { value: "premises", label: "Toimitila tai liiketila", scores: { bizProperty: score(6, "yrityksellä on vakuutettavaa toimitilaomaisuutta") } },
        { value: "equipment", label: "Koneita, laitteita tai työkaluja", scores: { bizProperty: score(6, "koneet, laitteet tai työkalut voivat olla toiminnan kannalta kriittisiä") } },
        { value: "inventory", label: "Varastoa tai myytäviä tuotteita", scores: { bizProperty: score(5, "varasto tai vaihto-omaisuus voi sitoa merkittävää pääomaa") } },
        { value: "property", label: "Kiinteistö tai rakennus", scores: { bizRealEstate: score(7, "yrityksellä on kiinteistö tai rakennus"), bizProperty: score(4, "rakennuksen omaisuusriski kannattaa kartoittaa") } },
        { value: "construction_site", label: "Työmaa tai projektikohde", scores: { bizConstruction: score(6, "rakennus- tai asennuskohde tarvitsee kohdekohtaisen tarkennuksen") } },
        { value: "none", label: "Ei olennaista omaisuutta" }
      ]
    },
    {
      id: "people",
      title: "Keitä yrityksen toiminta koskee?",
      desc: "Voit valita useamman.",
      multi: true,
      options: [
        { value: "employees", label: "Työntekijöitä", scores: { bizPeople: score(6, "yrityksessä on työntekijöitä") } },
        { value: "entrepreneur", label: "Yrittäjä itse", scores: { bizPeople: score(4, "yrittäjän oma turva kannattaa selvittää") } },
        { value: "key_people", label: "Avainhenkilöitä tai johtoryhmä", scores: { bizPeople: score(5, "avainhenkilöt vaikuttavat toiminnan jatkuvuuteen"), bizInterruption: score(4, "avainhenkilön poissaolo voi aiheuttaa keskeytysriskin") } },
        { value: "many_customers", label: "Paljon asiakkaita tai kävijöitä", scores: { bizLiability: score(4, "asiakas- tai kävijämäärä voi kasvattaa vastuutilanteiden merkitystä") } },
        { value: "none", label: "Ei erityistä henkilöstö- tai asiakaspainotusta" }
      ]
    },
    {
      id: "mobility",
      title: "Liittyykö toimintaan ajoneuvoja, matkoja tai kuljetuksia?",
      desc: "Voit valita useamman.",
      multi: true,
      options: [
        { value: "vehicles", label: "Yrityksen ajoneuvoja", scores: { bizVehicle: score(5, "yrityksellä on ajoneuvoja käytössä") } },
        { value: "fleet", label: "Useita ajoneuvoja tai kalustoa", scores: { bizVehicle: score(7, "yrityksellä on useita ajoneuvoja tai kalustoa") } },
        { value: "business_travel", label: "Työmatkoja", scores: { bizTravel: score(6, "yrityksellä on työmatkoja") } },
        { value: "posted", label: "Komennuksia tai pidempiä ulkomaantöitä", scores: { bizTravel: score(7, "komennukset tai pitkät ulkomaantyöt vaativat matkaturvan tarkistusta") } },
        { value: "own_goods", label: "Oman tavaran kuljetuksia", scores: { bizCargo: score(5, "yritys kuljettaa omaa tavaraa") } },
        { value: "customer_goods", label: "Asiakkaan tavaran kuljetuksia", scores: { bizCargo: score(7, "asiakkaan tavaran kuljetus tai logistiikkavastuu voi olla keskeinen") } },
        { value: "none", label: "Ei juuri nyt" }
      ]
    },
    {
      id: "riskConcerns",
      title: "Mikä olisi yritykselle taloudellisesti hankalinta?",
      desc: "Voit valita useamman.",
      multi: true,
      options: [
        { value: "property_damage", label: "Omaisuusvahinko", scores: { bizProperty: score(5, "omaisuusvahinko olisi yritykselle hankala") } },
        { value: "interruption", label: "Toiminnan keskeytyminen", scores: { bizInterruption: score(6, "toiminnan keskeytyminen olisi yritykselle hankalaa") } },
        { value: "liability_claim", label: "Asiakkaan tai sopimuskumppanin vaatimus", scores: { bizLiability: score(6, "asiakkaan tai sopimuskumppanin vaatimus olisi merkittävä riski") } },
        { value: "cyber", label: "Tietomurto tai järjestelmäkatko", scores: { bizCyber: score(6, "tietomurto tai järjestelmäkatko olisi merkittävä riski") } },
        { value: "legal", label: "Riita- tai oikeudenkäyntikulut", scores: { bizLegal: score(5, "riita- tai oikeudenkäyntikulut kannattaa huomioida") } },
        { value: "person_absence", label: "Yrittäjän tai avainhenkilön poissaolo", scores: { bizPeople: score(5, "yrittäjän tai avainhenkilön poissaolo olisi hankalaa"), bizInterruption: score(4, "henkilön poissaolo voi aiheuttaa keskeytysriskin") } },
        { value: "none", label: "Ei mikään näistä erityisesti" }
      ]
    },
    {
      id: "digital",
      title: "Kuinka riippuvainen yritys on digitaalisista järjestelmistä tai datasta?",
      desc: "Tämä tunnistaa kyberriskin yleistasolla.",
      options: [
        { value: "high", label: "Erittäin riippuvainen", scores: { bizCyber: score(7, "yritys on erittäin riippuvainen digitaalisista järjestelmistä tai datasta"), bizInterruption: score(2, "järjestelmäkatko voi keskeyttää toimintaa") } },
        { value: "medium", label: "Jonkin verran riippuvainen", scores: { bizCyber: score(4, "yritys on jonkin verran riippuvainen digitaalisista järjestelmistä tai datasta") } },
        { value: "low", label: "Vähän riippuvainen" },
        { value: "unsure", label: "En osaa sanoa", scores: { bizCyber: score(2, "digitaalisen riippuvuuden taso kannattaa tarkistaa") } }
      ]
    },
    {
      id: "shock",
      title: "Olisiko iso vahinko tai pitkä keskeytys vaikea kantaa yrityksen kassasta?",
      desc: "Tämä vaikuttaa suositusten painotukseen.",
      options: [
        { value: "yes", label: "Kyllä, kassavaikutus olisi iso", scores: { bizProperty: score(2, "iso vahinko tai pitkä keskeytys olisi vaikea kantaa kassasta"), bizInterruption: score(2, "iso vahinko tai pitkä keskeytys olisi vaikea kantaa kassasta"), bizLiability: score(2, "iso vahinko tai pitkä keskeytys olisi vaikea kantaa kassasta"), bizCyber: score(2, "iso vahinko tai pitkä keskeytys olisi vaikea kantaa kassasta"), bizPeople: score(2, "iso vahinko tai pitkä keskeytys olisi vaikea kantaa kassasta") } },
        { value: "somewhat", label: "Jonkin verran", scores: { bizProperty: score(1, "iso vahinko tai keskeytys olisi jonkin verran vaikea"), bizInterruption: score(1, "iso vahinko tai keskeytys olisi jonkin verran vaikea"), bizCyber: score(1, "iso vahinko tai keskeytys olisi jonkin verran vaikea") } },
        { value: "no", label: "Ei erityisen vaikeaa" }
      ]
    },
    {
      id: "currentCovers",
      title: "Mitä yritysvakuutuksia yrityksellä on jo?",
      desc: "Valinta auttaa merkitsemään, mitä kannattaa päivittää eikä vain hankkia uutena.",
      multi: true,
      options: [
        { value: "bizProperty", label: "Omaisuus- tai esinevakuutus", existing: ["bizProperty"] },
        { value: "bizLiability", label: "Vastuuvakuutus", existing: ["bizLiability"] },
        { value: "bizInterruption", label: "Keskeytysvakuutus", existing: ["bizInterruption"] },
        { value: "bizCyber", label: "Kybervakuutus", existing: ["bizCyber"] },
        { value: "bizPeople", label: "Henkilö- tai työtapaturmavakuutukset", existing: ["bizPeople"] },
        { value: "bizVehicle", label: "Ajoneuvovakuutukset", existing: ["bizVehicle"] },
        { value: "bizTravel", label: "Matkavakuutus", existing: ["bizTravel"] },
        { value: "none", label: "Ei näistä tai en tiedä" }
      ]
    }
  ]
};

const q = (id, title, desc, multi, options) => ({ id, title, desc, multi, options: options.map(([value, label, hint]) => ({ value, label, hint })) });

export const detailFlows = {
  personal: {
    home: {
      title: "Kotivakuutus",
      sourceNote: "Perustuu kotivakuutuksen tuoteselosteeseen: Laaja, Perus, Suppea, Laaja Plus, matkatavaraturva, irtaimisto ja rakennus.",
      questions: [
        q("role", "Mikä kuvaa parhaiten rooliasi?", "Rooli ratkaisee, painottuuko ehdotuksessa irtaimisto, rakennus, vastuu vai vuokrattava kohde.", false, [["tenant", "Asun vuokralla"], ["owner_occupier", "Asun omistusasunnossa"], ["landlord", "Olen vuokranantaja"], ["house_owner", "Omistan ja asun omakotitalossa"], ["holiday_owner", "Omistan vapaa-ajan asunnon tai mökin"]]),
        q("insuredObject", "Mitä haluat vakuuttaa?", "Kerros- ja rivitalossa painotus on usein irtaimistossa ja kiinteissä sisustuksissa. Omakotitalossa rakennus on usein mukana.", false, [["contents", "Irtaimisto"], ["building_and_contents", "Rakennus ja irtaimisto"], ["building_only", "Rakennus"]]),
        q("coverLevel", "Mikä turvataso sopii parhaiten?", "Laaja on kattavin taso ja on ainoa taso, joka korvaa rikkoutumisvahinkoja.", false, [["laaja", "Laaja"], ["perus", "Perus"], ["suppea", "Suppea"], ["unsure", "En osaa sanoa"]]),
        q("plusNeed", "Haluatko irtaimistolle Laaja Plus -lisäturvan?", "Laaja Plus on mahdollinen Laajan kotivakuutuksen yhteydessä.", false, [["yes", "Kyllä"], ["no", "En"], ["unsure", "En osaa sanoa"]]),
        q("travelAddon", "Tarvitsetko matkatavaraturvan ulkomaanmatkoille?", "Kotivakuutuksen matkatavaraturva ulkomaanmatkoille pitää valita erikseen ennen matkaa.", false, [["yes", "Kyllä"], ["no", "En"], ["unsure", "En osaa sanoa"]]),
        q("deductibleContents", "Mikä irtaimiston omavastuu tuntuu sopivalta?", "Vaihtoehdot: 200, 300, 500, 1 000 ja 2 000 euroa.", false, [["200", "200 euroa"], ["300", "300 euroa"], ["500", "500 euroa"], ["1000", "1 000 euroa"], ["2000", "2 000 euroa"]]),
        q("deductibleBuilding", "Mikä rakennuksen omavastuu tuntuu sopivalta?", "Vaihtoehdot: 200, 300, 500, 1 000, 2 000 ja 5 000 euroa.", false, [["200", "200 euroa"], ["300", "300 euroa"], ["500", "500 euroa"], ["1000", "1 000 euroa"], ["2000", "2 000 euroa"], ["5000", "5 000 euroa"]])
      ]
    },
    vehicle: {
      title: "Ajoneuvovakuutus",
      sourceNote: "Perustuu ajoneuvovakuutuksen tuoteselosteeseen: liikennevakuutus, suppea/laaja kasko ja lisäturvat.",
      questions: [
        q("vehicleType", "Mikä ajoneuvo on kyseessä?", "Ajoneuvon tyyppi vaikuttaa saataviin turviin ja lisäturviin.", false, [["car", "Henkilöauto tai pakettiauto"], ["motorcycle", "Moottoripyörä, mopo tai mönkijä"], ["camper", "Matkailuauto tai matkailuperävaunu"], ["other", "Muu ajoneuvo"]]),
        q("finance", "Onko ajoneuvo rahoitettu, leasingissä tai kallis korvata itse?", "Rahoitus- ja leasingtilanne kannattaa tarkistaa kaskon yhteydessä.", false, [["yes", "Kyllä"], ["no", "Ei"], ["unsure", "En osaa sanoa"]]),
        q("vehicleConcerns", "Mistä vahingoista olet erityisen huolissasi?", "Voit valita useamman.", true, [["collision", "Kolarointi tai tieltä suistuminen"], ["parking", "Pysäköintivahingot"], ["glass", "Lasivahingot"], ["animal_weather_theft", "Eläintörmäys, luonnonilmiö, palo, varkaus tai ilkivalta"], ["replacement", "Sijaisauto tai sijaisajoneuvo"], ["none", "Haluan vain välttämättömimmän"]]),
        q("abroadVehicle", "Ajatko ajoneuvolla ulkomailla?", "Ulkomailla ajaminen voi vaikuttaa lisäturvien ja vastuun tarkistuksiin.", false, [["yes", "Kyllä"], ["sometimes", "Satunnaisesti"], ["no", "En"]]),
        q("vehicleDeductible", "Mikä omavastuun taso tuntuu sopivalta kaskossa?", "Sovita omavastuu ajoneuvon arvoon ja omaan kassaan.", false, [["low", "Matala omavastuu"], ["medium", "Keskitasoinen omavastuu"], ["high", "Korkeampi omavastuu"]])
      ]
    },
    travel: {
      title: "Matkavakuutus",
      sourceNote: "Perustuu matkavakuutuksen materiaaleihin: matkustajan hoitoturva, peruuntuminen, keskeytyminen, myöhästyminen ja matkatavarat.",
      questions: [
        q("tripPattern", "Millainen matkustaminen kuvaa sinua parhaiten?", "Matkan pituus ja toistuvuus vaikuttavat ratkaisuun.", false, [["single", "Yksittäinen matka"], ["several", "Useita matkoja vuodessa"], ["long", "Yli kolmen kuukauden matka"], ["domestic", "Pääosin kotimaanmatkoja yli 50 km päähän"]]),
        q("travelConcerns", "Mikä matkustamisessa huolestuttaa?", "Voit valita useamman.", true, [["medical", "Sairastuminen tai tapaturma matkalla"], ["cancel", "Matkan peruuntuminen"], ["interrupt", "Matkan keskeytyminen"], ["delay", "Jatkoyhteydeltä myöhästyminen"], ["luggage", "Matkatavaroiden vahinko tai viivästyminen"], ["liability_legal", "Matkavastuu tai matkaoikeusturva"]]),
        q("travelers", "Ketkä matkustavat?", "Matkatavaravakuutus voi kattaa samassa taloudessa asuvat yhteisellä matkalla.", false, [["alone", "Matkustan yksin"], ["partner", "Matkustan puolison kanssa"], ["family", "Matkustan perheen kanssa"], ["child_alone", "Lapsi matkustaa yksin"]]),
        q("travelDeductible", "Mikä omavastuulinja tuntuu sopivalta matkatavaroille?", "Sovita omavastuu tavaroiden arvoon.", false, [["low", "Matala omavastuu"], ["medium", "Keskitasoinen omavastuu"], ["high", "Korkeampi omavastuu"]])
      ]
    },
    health: {
      title: "Terveys- ja tapaturmavakuutus",
      sourceNote: "Perustuu terveysvakuutuksen materiaaleihin: sairauden hoitoturva, tapaturman hoitoturva, urheiluturva, haitta- ja päivärahat.",
      questions: [
        q("healthTarget", "Kenelle turvaa haetaan?", "Terveysvakuutusta voi hakea itselle, puolisolle, lapselle tai syntyvälle lapselle.", false, [["self", "Itselleni"], ["partner", "Puolisolle"], ["child", "Lapselle"], ["unborn", "Syntyvälle lapselle"]]),
        q("healthNeeds", "Mitä haluat suojata?", "Voit valita useamman.", true, [["illness_full", "Sairauden laajemmat hoitokulut"], ["illness_basic", "Yleislääkärikäynnit ja perustason sairauskulut"], ["accident", "Tapaturmien hoitokulut"], ["sports", "Urheilutapaturmat"], ["income", "Päiväraha työkyvyttömyyden varalle"], ["permanent", "Pysyvä haitta tai tapaturmainen kuolema"]]),
        q("healthDeductible", "Mikä sairauden hoitoturvan omavastuu tuntuu sopivalta?", "Sairauden hoitoturvan omavastuut ovat 300, 500 tai 1 000 euroa kalenterivuodessa.", false, [["300", "300 euroa / kalenterivuosi"], ["500", "500 euroa / kalenterivuosi"], ["1000", "1 000 euroa / kalenterivuosi"], ["not_needed", "En tarvitse sairauden hoitoturvaa"]]),
        q("healthLimits", "Onko jokin näistä erityisen tärkeä tarkistaa?", "Voit valita useamman.", true, [["health_statement", "Terveysselvitys ja mahdolliset rajoitusehdot"], ["sports_level", "Urheilulajin tai harrastustason vaikutus"], ["abroad", "Voimassaolo ulkomailla"], ["age", "Ikärajat ja päättymisiät"], ["none", "Ei erityistä"]])
      ]
    },
    life: {
      title: "Henkivakuutus",
      sourceNote: "Perustuu henkiturvan materiaaleihin: kuolemanvaraturva, vakavan sairauden kertakorvaus, vakuutusmäärä ja edunsaaja.",
      questions: [
        q("dependents", "Keiden talous olisi turvattava?", "Lähtökohta on se, kenelle korvaus olisi tarkoitettu.", false, [["family", "Puoliso ja/tai lapset"], ["loan", "Asuntolainan tai muun velan turvaaminen"], ["business", "Yritykseen tai yhteiseen talouteen liittyvä vastuu"], ["none", "Ei selkeää riippuvuutta"]]),
        q("lifeGoal", "Mihin turvaa ensisijaisesti tarvitaan?", "Voit valita useamman.", true, [["death", "Kuolemanvaraturva läheisille"], ["serious_illness", "Vakavan sairauden kertakorvaus"], ["declining", "Velan mukana aleneva vakuutusmäärä"], ["fixed", "Selkeä sovittu kertakorvaus"]]),
        q("coverAmount", "Mikä vakuutusmäärän taso kuulostaa oikealta jatkoselvitykseen?", "Tarkka määrä lasketaan tulojen, velkojen ja huollettavien perusteella.", false, [["30000", "30 000 euroa"], ["50000", "50 000 euroa"], ["100000", "100 000 euroa"], ["needs_calc", "Tarvitsen laskennan tulojen, velkojen ja huollettavien perusteella"]]),
        q("beneficiary", "Onko edunsaaja selvä?", "Edunsaajamääräys ratkaisee, kenelle korvaus maksetaan.", false, [["clear", "Kyllä"], ["needs_help", "Tarvitsen apua edunsaajan määrittelyyn"], ["not_yet", "Ei vielä"]])
      ]
    },
    pet: {
      title: "Koira- ja kissavakuutus",
      sourceNote: "Perustuu koira- ja kissavakuutuksen materiaaleihin: eläinlääkärikulut, henki, Hoitoturva Plus, käyttöominaisuus ja koiran vastuu.",
      questions: [
        q("petType", "Mikä eläin on kyseessä?", "Koira- ja kissavakuutuksessa turvat ovat osin samat, mutta vastuuvakuutus koskee koiraa.", false, [["dog", "Koira"], ["cat", "Kissa"], ["both", "Sekä koira että kissa"]]),
        q("petAge", "Minkä ikäinen eläin on?", "Vakuutuksen myöntämisikä ja lisäturvat riippuvat eläimen iästä.", false, [["puppy_kitten", "5 viikkoa - alle 1 vuotta"], ["young", "1 - alle 5 vuotta"], ["adult", "5 - alle 8 vuotta"], ["older", "8 vuotta tai vanhempi"]]),
        q("petNeeds", "Mitä haluat suojata?", "Voit valita useamman.", true, [["vet", "Eläinlääkärikulut"], ["plus", "Hoitoturva Plus ja fysioterapiaan liittyvät lisät"], ["life", "Eläimen henkivakuutus"], ["use", "Käyttöominaisuusturva"], ["liability", "Koiran vastuuvakuutus"]]),
        q("petTravel", "Matkustaako eläin mukana ulkomailla?", "Voimassaolo vaihtelee alueen ja keston mukaan.", false, [["nordic", "Pohjoismaissa"], ["eu", "Muu EU, Iso-Britannia tai Sveitsi"], ["no", "Ei matkusta mukana"]]),
        q("petDeductible", "Mikä omavastuun taso tuntuu sopivalta?", "Eläinlääkärikulujen omavastuu tarkistetaan valittavasta turvasta.", false, [["low", "Matala omavastuu"], ["medium", "Keskitasoinen omavastuu"], ["higher", "Korkeampi omavastuu"]])
      ]
    }
  },
  business: {
    bizProperty: {
      title: "Yrityksen omaisuus- ja esinevakuutus",
      sourceNote: "Perustuu ES1 Esinevakuutukseen, huoneistoturvaan, kiinteistö- ja rakennustyömateriaaleihin sekä suojeluohjeisiin.",
      questions: [
        q("propertyAssets", "Mitä omaisuutta halutaan suojata?", "Voit valita useamman.", true, [["premises", "Toimitila tai liiketila"], ["equipment", "Koneet, laitteet ja työkalut"], ["inventory", "Varasto ja vaihto-omaisuus"], ["tenant_improvements", "Vuokratilan muutostyöt ja kiinteät sisustukset"], ["building", "Rakennus tai kiinteistö"], ["construction", "Rakennus- tai asennuskohde"]]),
        q("propertyControl", "Miten kohde on yrityksen käytössä?", "Omistus- ja vuokrasuhde vaikuttaa vakuutettavaan omaisuuteen.", false, [["owned", "Yritys omistaa kohteen"], ["leased", "Yritys toimii vuokratilassa"], ["multiple", "Useita toimipaikkoja tai liikkuvaa omaisuutta"], ["project", "Projektikohtainen kohde"]]),
        q("propertyConcerns", "Mistä vahingoista olet huolissasi?", "Voit valita useamman.", true, [["fire_water", "Palo, vuoto tai luonnonilmiö"], ["theft", "Murto, varkaus tai ilkivalta"], ["breakdown", "Koneen tai laitteen rikkoutuminen"], ["flood", "Poikkeuksellinen tulva"], ["site", "Työmaa- tai asennuskohteen vahinko"]]),
        q("propertyDeductible", "Mikä omavastuulinja sopii yritykselle?", "Omavastuu kannattaa sovittaa kassaan ja vahinkojen todennäköisyyteen.", false, [["low", "Matala omavastuu"], ["medium", "Keskitasoinen omavastuu"], ["high", "Korkeampi omavastuu"]])
      ]
    },
    bizLiability: {
      title: "Yrityksen vastuuvakuutukset",
      sourceNote: "Perustuu toiminnan vastuun, tuotevastuun, varallisuusvastuun, IT-vastuun, hallinnon vastuun ja VY1-ehtojen kokonaisuuteen.",
      questions: [
        q("liabilityActivity", "Mihin vastuu ensisijaisesti liittyy?", "Valinta ohjaa vastuuvakuutuksen rakennetta.", false, [["operations", "Toiminnan aiheuttamat henkilö- tai esinevahingot"], ["products", "Tuotteet, valmistus, myynti tai maahantuonti"], ["professional", "Neuvonta, suunnittelu tai konsultointi"], ["it", "IT-palvelut, data tai järjestelmät"], ["management", "Johto, hallitus tai päätöksenteko"], ["healthcare", "Terveyden- tai sairaanhoito"]]),
        q("liabilityConcerns", "Mitä vastuutilanteita haluat korostaa?", "Voit valita useamman.", true, [["injury_property", "Henkilö- ja esinevahingot"], ["financial_loss", "Taloudellinen vahinko ilman esinevahinkoa"], ["ip", "Immateriaalioikeudet"], ["environment", "Ympäristövahingot"], ["recall", "Tuotteen takaisinveto"], ["contract", "Sopimusvaatimukset"]]),
        q("liabilityMarket", "Missä yritys toimii?", "Markkina-alue vaikuttaa vastuiden ja vakuutusmäärien arviointiin.", false, [["local", "Paikallisesti Suomessa"], ["finland", "Koko Suomessa"], ["eu", "EU-alueella"], ["global", "Kansainvälisesti"]]),
        q("liabilityLimit", "Mikä vakuutusmäärän taso vaatii jatkolaskennan?", "Tarkka määrä määräytyy sopimusten, liikevaihdon ja vahinkopotentiaalin perusteella.", false, [["basic", "Perustaso"], ["higher", "Korkeampi sopimusvaatimusten taso"], ["major", "Merkittävä vastuuriski tai kansainvälinen toiminta"]])
      ]
    },
    bizInterruption: {
      title: "Keskeytysvakuutus",
      sourceNote: "Perustuu KE1, KE2, KE3 ja KE4-keskeytysmateriaaleihin.",
      questions: [
        q("interruptionCause", "Mikä keskeyttäisi toiminnan pahiten?", "Voit valita useamman.", true, [["property", "Omaisuusvahinko toimitilassa, koneessa tai tuotannossa"], ["person", "Yrittäjän tai avainhenkilön poissaolo"], ["supplier", "Tärkeä toimittaja tai asiakas"], ["rent", "Vuokratuoton menetys"], ["event", "Sesonki tai tapahtuma peruuntuu"]]),
        q("recoveryTime", "Kuinka kauan palautuminen voisi kestää?", "Arvio auttaa hahmottamaan vastuuajan tarvetta.", false, [["short", "Alle 1 kuukausi"], ["medium", "1-3 kuukautta"], ["long", "3-12 kuukautta"], ["very_long", "Yli 12 kuukautta"]]),
        q("interruptionNeed", "Mitä keskeytyksessä pitäisi kattaa?", "Voit valita useamman.", true, [["fixed_costs", "Kiinteät kulut"], ["profit", "Menetetty käyttökate tai kate"], ["extra_costs", "Lisäkulut toiminnan jatkamiseksi"], ["wages", "Palkat ja henkilöstökulut"], ["rent_income", "Vuokratuotto"]]),
        q("interruptionCalc", "Onko keskeytysvakuutusmäärä laskettu?", "Vakuutusmäärä kannattaa perustaa kirjanpitoon ja realistiseen palautumisaikaan.", false, [["yes", "Kyllä"], ["partial", "Osittain"], ["no", "Ei vielä"]])
      ]
    },
    bizCyber: {
      title: "Kybervakuutus",
      sourceNote: "Perustuu CY2 Kybervakuutukseen ja Kybervakuutus Pro -materiaaliin.",
      questions: [
        q("cyberExposure", "Mikä altistaa yrityksen kyberriskille?", "Voit valita useamman.", true, [["personal_data", "Henkilö- tai asiakasdata"], ["payments", "Verkkokauppa, maksut tai ajanvaraus"], ["critical_systems", "Järjestelmät pysäyttävät toiminnan, jos ne eivät toimi"], ["supplier_access", "Alihankkijoita, pilvipalveluja tai etäkäyttöä"], ["low", "Vähäinen digitaalinen riippuvuus"]]),
        q("cyberConcerns", "Mistä kybertilanteista olet huolissasi?", "Voit valita useamman.", true, [["breach", "Tietomurto tai tietovuoto"], ["ransomware", "Kiristyshaittaohjelma"], ["interruption", "Liiketoiminnan keskeytys"], ["liability", "Asiakkaalle aiheutuva vahinko"], ["response", "Asiantuntija-apu, ilmoitukset ja palautus"]]),
        q("cyberMaturity", "Miten hyvin perusturva on kunnossa?", "Tämä auttaa suosittelemaan myös ennen vakuutusta tehtäviä tarkistuksia.", false, [["strong", "MFA, varmuuskopiot ja päivitykset kunnossa"], ["partial", "Osa asioista kunnossa"], ["weak", "Tarvitsee selvästi parantaa"], ["unknown", "En tiedä"]]),
        q("cyberLevel", "Mikä taso kuulostaa oikealta jatkoselvitykseen?", "Pro-tason tarve korostuu, jos digiriippuvuus tai vahinkopotentiaali on suuri.", false, [["standard", "Kybervakuutus"], ["pro", "Kybervakuutus Pro"], ["needs_assessment", "Tarvitaan riskikartoitus ennen tasovalintaa"]])
      ]
    },
    bizVehicle: {
      title: "Yrityksen ajoneuvovakuutukset",
      sourceNote: "Perustuu yritysten liikennevakuutus-, kasko-, ryhmäliikenne-, autoliikekasko- ja korjaamokaskomateriaaleihin.",
      questions: [
        q("fleetType", "Millaista kalustoa yrityksellä on?", "Valitse pääasiallinen ryhmä.", false, [["cars_vans", "Henkilö- ja pakettiautoja"], ["heavy", "Kuorma-autot, bussit tai raskas kalusto"], ["machinery", "Työkoneet tai erikoiskalusto"], ["motor_trade", "Autokauppa, huolto tai korjaamo"], ["mixed", "Sekalainen kalusto"]]),
        q("fleetUse", "Mihin ajoneuvoja käytetään?", "Käyttötarkoitus vaikuttaa turvan laajuuteen.", false, [["sales_service", "Myynti, asiakaskäynnit tai huolto"], ["deliveries", "Jakelu tai tavarankuljetus"], ["transport_business", "Kuljetusliiketoiminta"], ["construction", "Työmaa- ja asennuskäyttö"], ["employee_benefit", "Työsuhdeautot"]]),
        q("fleetConcerns", "Mitä haluat korostaa?", "Voit valita useamman.", true, [["collision", "Kolarointi ja vauriot"], ["glass", "Lasivahingot"], ["downtime", "Sijaisauto tai kaluston seisonta"], ["theft", "Varkaus, ilkivalta tai paloriski"], ["abroad", "Ulkomaan käyttö"], ["finance", "Rahoitus tai leasing"]]),
        q("fleetSize", "Kuinka monta ajoneuvoa on?", "Useampi ajoneuvo voi nostaa ryhmäliikenteen tai fleet-ratkaisun esiin.", false, [["one", "1"], ["few", "2-5"], ["many", "6-20"], ["large", "Yli 20"]])
      ]
    },
    bizPeople: {
      title: "Henkilö- ja työkykyratkaisut",
      sourceNote: "Perustuu työtapaturma-, yrittäjien tapaturma-, sairauskulu- ja työkykymateriaaleihin.",
      questions: [
        q("peopleSize", "Kenelle turvaa haetaan?", "Henkilömäärä ohjaa työkykyvakuutuksen vaihtoehtoja.", false, [["solo", "Yrittäjä ilman työntekijöitä"], ["micro", "2-9 henkilöä"], ["small", "10-49 henkilöä"], ["medium", "50+ henkilöä"]]),
        q("peopleNeeds", "Mitä halutaan turvata?", "Voit valita useamman.", true, [["statutory", "Työtapaturma- ja ammattitautivakuutus työntekijöille"], ["entrepreneur_accident", "Yrittäjän tapaturma tai vapaaehtoinen työajan vakuutus"], ["medical", "Sairauskulut ja nopea hoitoon pääsy"], ["workability", "Työkyvyn tuki ja poissaolojen hallinta"], ["leisure", "Vapaa-ajan tapaturmat"], ["key_people", "Avainhenkilöt tai johtoryhmä"]]),
        q("healthLevel", "Mikä hoitotaso kuulostaa oikealta?", "Työkykyvakuutuksessa taso voi määräytyä yleis- tai erikoislääkäritason mukaan.", false, [["basic", "Yleislääkäritasoinen"], ["specialist", "Erikoislääkäritasoinen"], ["key", "Avainhenkilö- tai johtoryhmätaso"], ["not_sure", "En osaa sanoa"]]),
        q("peopleTax", "Onko tavoitteena henkilöstöetu koko henkilöstölle?", "Tämä vaikuttaa jatkoselvitykseen ja verotukselliseen arvioon.", false, [["all", "Koko henkilöstölle samansisältöisenä"], ["selected", "Vain osalle henkilöstöä"], ["entrepreneur", "Vain yrittäjälle"], ["unknown", "Ei vielä päätetty"]])
      ]
    },
    bizTravel: {
      title: "Yrityksen matkavakuutukset",
      sourceNote: "Perustuu matkustaja-, komennus-, matkatavara-, matkavastuu- ja matkaoikeusturvamateriaaleihin.",
      questions: [
        q("bizTripType", "Millaisia työmatkoja tehdään?", "Matkan kesto ja kohde vaikuttavat vakuutuksen rakenteeseen.", false, [["domestic", "Pääosin kotimaan työmatkoja"], ["short_abroad", "Lyhyitä ulkomaan työmatkoja"], ["frequent", "Säännöllistä kansainvälistä matkustamista"], ["posted", "Komennuksia tai pitkäaikaisia ulkomaantöitä"]]),
        q("travelerGroup", "Ketkä matkustavat?", "Voit valita useamman.", true, [["entrepreneur", "Yrittäjä"], ["employees", "Työntekijät"], ["management", "Johto tai avainhenkilöt"], ["families", "Komennuksilla mukana perheenjäseniä"]]),
        q("bizTravelConcerns", "Mitä matkalla pitää kattaa?", "Voit valita useamman.", true, [["medical", "Sairaus ja tapaturma matkalla"], ["luggage", "Matkatavarat ja työvälineet"], ["liability", "Matkavastuu"], ["legal", "Matkaoikeusturva"], ["evacuation", "Kotiutus, evakuointi tai poikkeustilanne"]]),
        q("bizTravelPolicy", "Onko yrityksellä matkustuspolitiikka?", "Valmis politiikka helpottaa vakuutuksen rajaamista.", false, [["yes", "Kyllä"], ["partial", "Osittain"], ["no", "Ei vielä"]])
      ]
    },
    bizCargo: {
      title: "Kuljetusvakuutukset",
      sourceNote: "Perustuu tavarankuljetus-, tiekuljetusvastuu-, autokuljetus- ja logistiikkaoperaattorimateriaaleihin.",
      questions: [
        q("cargoRole", "Mikä on yrityksen rooli kuljetuksessa?", "Rooli ratkaisee, tarvitaanko tavaran vakuutus vai kuljetusvastuu.", false, [["own_goods", "Kuljetamme omaa tavaraa"], ["carrier", "Kuljetamme asiakkaan tavaraa"], ["forwarder", "Huolinta tai logistiikkaoperaattori"], ["exhibition", "Messu- tai näyttelykuljetukset"]]),
        q("cargoFrequency", "Kuinka usein kuljetuksia on?", "Toistuvuus vaikuttaa jatkuvan ja kertakuljetuksen välillä.", false, [["one_off", "Yksittäisiä kuljetuksia"], ["monthly", "Kuukausittain"], ["weekly", "Viikoittain"], ["daily", "Päivittäin"]]),
        q("cargoMode", "Millä tavara liikkuu?", "Voit valita useamman.", true, [["road", "Maantie"], ["sea", "Meri"], ["air", "Ilma"], ["rail", "Rautatie"], ["multi", "Useita kuljetusmuotoja"]]),
        q("cargoValue", "Mikä on tavaran arvo- ja vahinkopotentiaali?", "Tämä ohjaa vakuutusmäärän ja ehtojen tarkistusta.", false, [["low", "Matala"], ["medium", "Keskitasoinen"], ["high", "Korkea tai kriittinen"], ["temperature", "Lämpötilaherkkä tai erityistavara"]])
      ]
    },
    bizLegal: {
      title: "Yrityksen oikeusturvavakuutus",
      sourceNote: "Perustuu OK1 oikeudenkäyntikuluvakuutukseen ja OK2 immateriaalioikeusmateriaaliin.",
      questions: [
        q("legalDisputes", "Minkä tyyppisiä riitoja halutaan varalta huomioida?", "Voit valita useamman.", true, [["contract", "Sopimus- tai toimitusriidat"], ["customer", "Asiakas- tai reklamaatioriitat"], ["employment", "Työsuhderiidat"], ["ip", "Immateriaalioikeudet"], ["real_estate", "Vuokra- tai kiinteistöriidat"]]),
        q("legalMarket", "Missä sopimuksia tehdään?", "Toiminta-alue vaikuttaa ehtojen ja vakuutusmäärän tarkistukseen.", false, [["finland", "Suomi"], ["eu", "EU"], ["global", "Kansainvälinen"], ["unknown", "Ei tiedossa"]]),
        q("legalVolume", "Kuinka sopimuspainotteista toiminta on?", "Sopimusten määrä ja arvo vaikuttavat oikeusturvan merkitykseen.", false, [["low", "Vähän sopimuksia"], ["medium", "Säännöllisesti sopimuksia"], ["high", "Sopimukset ovat toiminnan ytimessä"]])
      ]
    },
    bizRealEstate: {
      title: "Kiinteistövakuutus",
      sourceNote: "Perustuu kiinteistövakuutuksen, huoneistoturvan, vuokratuottokeskeytyksen ja kiinteistön vastuukysymysten materiaaleihin.",
      questions: [
        q("realEstateType", "Minkä tyyppinen kohde on?", "Kohteen käyttötarkoitus vaikuttaa riskiprofiiliin.", false, [["residential", "Asuin- tai vuokratalo"], ["commercial", "Liike- tai toimistokiinteistö"], ["industrial", "Teollisuus- tai tuotantokiinteistö"], ["mixed", "Sekakäyttöinen kohde"]]),
        q("realEstateRole", "Mikä on yrityksen rooli?", "Omistajan ja vuokralaisen tarpeet eroavat toisistaan.", false, [["owner", "Omistaja"], ["landlord", "Vuokranantaja"], ["tenant", "Vuokralainen"], ["manager", "Isännöinti tai hallinnointi"]]),
        q("realEstateConcerns", "Mitä pitää huomioida?", "Voit valita useamman.", true, [["building", "Rakennusvahingot"], ["liability", "Kiinteistön omistajan vastuu"], ["rental_income", "Vuokratuoton keskeytys"], ["flood", "Poikkeuksellinen tulva"], ["renovation", "Korjaus- tai muutostyöt"]]),
        q("realEstateDeductible", "Mikä omavastuulinja sopii?", "Kiinteistössä omavastuu kannattaa sovittaa kohteen arvoon ja kassaan.", false, [["low", "Matala"], ["medium", "Keskitasoinen"], ["high", "Korkea"]])
      ]
    },
    bizPatient: {
      title: "Potilasvakuutus",
      sourceNote: "Perustuu potilasvakuutuksen tuoteselosteeseen ja vakuutusehtoihin.",
      questions: [
        q("patientActivity", "Mitä toimintaa yritys harjoittaa?", "Potilasvakuutuksen tarve liittyy terveyden- ja sairaanhoidon toimintaan.", false, [["healthcare", "Terveyden- tai sairaanhoito"], ["therapy", "Terapia, kuntoutus tai hoivapalvelu"], ["beauty", "Esteettinen tai hyvinvointipalvelu"], ["support", "Alihankinta tai tukipalvelu sote-toimijalle"]]),
        q("patientStaff", "Ketkä palvelua tuottavat?", "Ammattihenkilöt ja alihankkijat pitää tunnistaa.", false, [["licensed", "Laillistetut ammattihenkilöt"], ["mixed", "Sekä ammattihenkilöitä että muuta henkilöstöä"], ["subcontractors", "Alihankkijoita"], ["unknown", "Ei vielä selvää"]]),
        q("patientVolume", "Mikä on asiakasvolyymi?", "Volyymi auttaa jatkoselvityksessä.", false, [["low", "Vähäinen"], ["medium", "Säännöllinen"], ["high", "Suuri tai useita toimipaikkoja"]])
      ]
    },
    bizConstruction: {
      title: "Rakennus- ja asennustyövakuutus",
      sourceNote: "Perustuu rakennus- ja asennustyön määräaikaiseen, jatkuvaan ratkaisuun sekä työmaiden suojeluohjeisiin.",
      questions: [
        q("constructionType", "Millaisia töitä tehdään?", "Työn luonne vaikuttaa määräaikaisen ja jatkuvan ratkaisun välillä.", false, [["single_project", "Yksittäinen rakennus- tai asennushanke"], ["continuous", "Jatkuvaa urakointi- tai asennustoimintaa"], ["repair", "Korjaus- ja kunnossapitotyöt"], ["subcontractor", "Aliurakointi"]]),
        q("constructionAssets", "Mitä työmaalla pitää suojata?", "Voit valita useamman.", true, [["work_object", "Työn kohde"], ["materials", "Rakennustarvikkeet ja materiaalit"], ["tools", "Työkalut ja koneet"], ["temporary", "Väliaikaiset rakenteet"], ["existing", "Työn kohteena oleva olemassa oleva omaisuus"]]),
        q("constructionConcerns", "Mistä vahingoista olet huolissasi?", "Voit valita useamman.", true, [["fire", "Tulityöt ja paloriski"], ["water", "Vuoto- tai säävahingot"], ["theft", "Varkaus tai ilkivalta"], ["liability", "Sivullisvahingot"], ["delay", "Viivästys tai suorituskyvyttömyys"]]),
        q("constructionDuration", "Kuinka pitkiä hankkeet ovat?", "Kesto vaikuttaa vakuutuskauteen ja jatkuvan ratkaisun tarpeeseen.", false, [["short", "Alle 1 kuukausi"], ["medium", "1-6 kuukautta"], ["long", "Yli 6 kuukautta"], ["varies", "Vaihtelee jatkuvasti"]])
      ]
    }
  }
};

export function getOptionLabel(question, value) {
  const option = question?.options?.find((item) => item.value === value);
  return option ? option.label : value || "Ei valittu";
}

export function getAnswerLabels(questions, answers) {
  return questions.map((question) => {
    const value = answers[question.id];
    const values = Array.isArray(value) ? value : value ? [value] : [];
    return {
      question: question.title,
      answer: values.length ? values.map((item) => getOptionLabel(question, item)).join(", ") : "Ei valittu"
    };
  });
}
