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
    heroLead: "Vastaa lyhyesti elämäntilanteestasi, tutki perustellut suositukset ja jatka hinta-arvioon tai asiantuntijan yhteydenottoon.",
    introTitle: "Aloita omasta tilanteestasi",
    introText: "Kartoitus tunnistaa ensin olennaiset vakuutuslajit. Vasta sen jälkeen voit tarkentaa yksittäistä vakuutusta, kuten kotia, ajoneuvoa, matkaa, terveyttä, henkeä tai lemmikkiä.",
    shortText: "Kysymme asumisesta, ajoneuvoista, matkoista, terveydestä, läheisistä, eläimistä, omaisuudesta ja taloudellisesta puskurista.",
    detailText: "Syventävä vaihe antaa konkreettisen ehdotuksen turvatasosta, lisäturvista, omavastuusta ja jatkotarkistuksista.",
    layer1Chips: ["Asuminen", "Ajoneuvot", "Matkat", "Terveys", "Läheiset", "Eläimet", "Omaisuus"],
    layer2Chips: ["Koti", "Ajoneuvo", "Matka", "Terveys", "Henki", "Koira ja kissa"],
    materialsIntro: "Hinta-arvio muodostetaan laskuri-integraatiossa tai asiantuntijan kanssa."
  },
  business: {
    id: "business",
    label: "Yritysasiakas",
    heroTitle: "Kartoita yrityksen vakuutustarpeet",
    heroLead: "Vastaa muutamaan helppoon kysymykseen, näe yrityksen kriittiset vakuutustarpeet ja tarkenna vain ne osa-alueet, joista haluat hinta-arvion.",
    introTitle: "Aloita yrityksen perustilanteesta",
    introText: "Yrityspuolen ensimmäinen vaihe ei mene tuotteisiin liian syvälle. Se tunnistaa, liittyykö tilanteeseen omaisuutta, vastuita, henkilöstöä, keskeytysriskiä, ajoneuvoja, matkoja, kuljetuksia tai digitaalista riskiä.",
    shortText: "Kysymme vain perustilanteesta: ihmisistä, toimitiloista, ajoneuvoista, asiakastyöstä, keskeytysvaikutuksesta, digitaalisuudesta ja nykyisistä vakuutuksista.",
    detailText: "Syventävä vaihe tarkentaa esimerkiksi vakuutettavaa omaisuutta, vastuun lähdettä, keskeytyksen syytä, kyberturvaa tai henkilöstöratkaisua.",
    layer1Chips: ["Yrityksen koko", "Ihmiset", "Toimitilat", "Ajoneuvot", "Asiakastyö", "Digitaalisuus", "Kassa"],
    layer2Chips: ["Omaisuus", "Vastuu", "Keskeytys", "Kyber", "Henkilöstö", "Ajoneuvot", "Matka", "Kuljetus"],
    materialsIntro: "Hinta-arvio muodostetaan laskuri-integraatiossa tai asiantuntijan kanssa."
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
        m("Jatkuva matkavakuutus: tuoteseloste", "https://core-public.editaprima.fi/lahitapiola/download/5152/10"),
        m("Jatkuva matkavakuutus: avaintiedot", "https://public.egate.fi/lahitapiola/lahitapiola/fi/tiedostot/224725/"),
        m("Jatkuva matkavakuutus: vakuutusehdot", "https://core-public.editaprima.fi/lahitapiola/download/5282/10"),
        m("Matkakohtainen matkavakuutus: tuoteseloste", "https://core-public.editaprima.fi/lahitapiola/download/5303/10"),
        m("Matkakohtainen matkavakuutus: avaintiedot", "https://core-public.editaprima.fi/lahitapiola/download/5534/10"),
        m("Matkakohtainen matkavakuutus: vakuutusehdot", "https://core-public.editaprima.fi/lahitapiola/download/5300/10"),
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
      title: "Onko sinulla koti, omistusasunto, vuokra-asunto, omakotitalo tai vapaa-ajan asunto?",
      desc: "Kotivakuutuksen tarkennuksessa selvitetään myöhemmin, oletko vuokralainen, omistaja, vuokranantaja tai mökin omistaja.",
      options: [
        { value: "yes", label: "Kyllä", scores: { home: score(8, "asumiseen liittyvä irtaimisto, vastuu, oikeusturva tai rakennus kannattaa tarkistaa") } },
        { value: "no", label: "Ei" }
      ]
    },
    {
      id: "vehicle",
      title: "Omistatko tai käytätkö autoa tai muuta ajoneuvoa?",
      desc: "Jos vastaat kyllä, tarkennuksessa voidaan vertailla liikennevakuutusta ja vapaaehtoista kaskoa.",
      options: [
        { value: "yes", label: "Kyllä", scores: { vehicle: score(8, "ajoneuvo nostaa esiin liikennevakuutuksen ja vapaaehtoisen kaskon tarkistuksen") } },
        { value: "no", label: "Ei" }
      ]
    },
    {
      id: "travel",
      title: "Matkustatko ulkomaille tai pidemmille kotimaanmatkoille?",
      desc: "Matkavakuutuksen tarkennuksessa selvitetään myöhemmin, sopiiko jatkuva vai matkakohtainen ratkaisu.",
      options: [
        { value: "yes", label: "Kyllä", scores: { travel: score(8, "matkustaminen nostaa esiin matkustajan, matkatavaroiden ja peruutustilanteiden turvan"), home: score(1, "matkatavaroiden suhde kotivakuutukseen kannattaa tarkistaa") } },
        { value: "no", label: "Ei" }
      ]
    },
    {
      id: "health",
      title: "Oletko harkinnut terveys- tai tapaturmavakuutusta?",
      desc: "Tarkennuksessa voidaan myöhemmin erottaa sairauden hoitoturva, tapaturmat, urheilu ja toimeentuloon liittyvät turvat.",
      options: [
        { value: "yes", label: "Kyllä", scores: { health: score(8, "terveys- tai tapaturmaturva kiinnostaa ja sen sisältö kannattaa tarkentaa") } },
        { value: "no", label: "Ei" }
      ]
    },
    {
      id: "family",
      title: "Onko joku taloudellisesti riippuvainen sinusta?",
      desc: "Tämä voi nostaa esiin läheisten taloudellisen turvan ja henkivakuutuksen tarkistuksen.",
      options: [
        { value: "yes", label: "Kyllä", scores: { life: score(8, "läheisiä on taloudellisesti riippuvaisia tuloistasi") } },
        { value: "no", label: "Ei" }
      ]
    },
    {
      id: "pets",
      title: "Onko sinulla koira, kissa tai muu vakuutettava lemmikki?",
      desc: "Lemmikkivakuutuksen tarkennuksessa selvitetään eläinlääkärikulut ja mahdolliset lisäturvat.",
      options: [
        { value: "yes", label: "Kyllä", scores: { pet: score(8, "lemmikki nostaa esiin eläinlääkärikulujen ja mahdollisten lisäturvien tarkistuksen") } },
        { value: "no", label: "Ei" }
      ]
    },
    {
      id: "property",
      title: "Onko sinulla muuta merkittävää omaisuutta, kuten vene, metsä, vuokra-asunto tai sijoitusvarallisuutta?",
      desc: "Tämä nostaa esiin omaisuuteen liittyviä tarkistuksia ilman, että tässä vaiheessa kysytään yksityiskohtia.",
      options: [
        { value: "yes", label: "Kyllä", scores: { boat: score(3, "muuta omaisuutta voi olla tarpeen tarkistaa erillisellä vakuutuksella"), forest: score(3, "metsä- tai muu omaisuus voi vaatia oman tarkistuksen"), apartment: score(3, "vuokra- tai sijoitusasunnon vakuutustarve kannattaa tarkistaa"), investment: score(3, "varallisuuden suunnittelu voi olla ajankohtaista") } },
        { value: "no", label: "Ei" }
      ]
    },
    {
      id: "children",
      title: "Onko perheessä raskaus, lapsi tai lapsen vakuutusturva ajankohtainen?",
      desc: "Tarkennus voidaan tehdä myöhemmin, jos aihe nousee sinulle ajankohtaiseksi.",
      options: [
        { value: "yes", label: "Kyllä", scores: { pregnancy: score(4, "raskaus tai lapsen turva voi olla ajankohtainen"), childSerious: score(4, "lapsen vakavan sairauden turva voi olla hyvä tarkistaa"), health: score(2, "perheen terveys- ja tapaturmaturvat voivat olla ajankohtaisia") } },
        { value: "no", label: "Ei" }
      ]
    },
    {
      id: "shock",
      title: "Olisiko iso yllättävä kulu vaikea maksaa itse?",
      desc: "Tämä auttaa arvioimaan, pitäisikö turvan laajuutta tai omavastuuta tarkastella tarkemmin.",
      options: [
        { value: "yes", label: "Kyllä", scores: { home: score(2, "iso yllättävä kulu olisi vaikea maksaa itse"), vehicle: score(2, "iso yllättävä kulu olisi vaikea maksaa itse"), health: score(2, "iso yllättävä kulu olisi vaikea maksaa itse"), travel: score(2, "iso yllättävä kulu olisi vaikea maksaa itse"), life: score(2, "iso yllättävä kulu olisi vaikea maksaa itse"), pet: score(2, "iso yllättävä kulu olisi vaikea maksaa itse") } },
        { value: "no", label: "Ei" }
      ]
    },
    {
      id: "currentCovers",
      title: "Onko nykyinen vakuutusturvasi epäselvä tai haluatko varmistaa sen riittävyyden?",
      desc: "Jos vastaat kyllä, tulos painottaa aiempaa enemmän tarkistusta ja asiantuntijan arviota.",
      options: [
        { value: "yes", label: "Kyllä", scores: { home: score(1, "nykyinen vakuutusturva on epäselvä"), vehicle: score(1, "nykyinen vakuutusturva on epäselvä"), travel: score(1, "nykyinen vakuutusturva on epäselvä"), health: score(1, "nykyinen vakuutusturva on epäselvä"), life: score(1, "nykyinen vakuutusturva on epäselvä"), pet: score(1, "nykyinen vakuutusturva on epäselvä") } },
        { value: "no", label: "Ei" }
      ]
    }
  ],
  business: [
    {
      id: "companySize",
      title: "Onko yrityksellä työntekijöitä?",
      desc: "Työntekijät nostavat esiin lakisääteiset ja henkilöstöön liittyvät vakuutustarkistukset.",
      options: [
        { value: "yes", label: "Kyllä", scores: { bizPeople: score(8, "yrityksellä on työntekijöitä, jolloin henkilöstö- ja työtapaturmariskit pitää tarkistaa") } },
        { value: "no", label: "Ei" }
      ]
    },
    {
      id: "industry",
      title: "Tehdäänkö yrityksessä asiakastyötä, neuvontaa, palvelua tai työtä asiakkaan tiloissa?",
      desc: "Asiakastyö voi nostaa esiin vastuu- ja sopimusriskejä.",
      options: [
        { value: "yes", label: "Kyllä", scores: { bizLiability: score(8, "asiakastyö voi synnyttää henkilö-, esine- tai varallisuusvastuita"), bizLegal: score(3, "sopimukset ja riitatilanteet kannattaa huomioida") } },
        { value: "no", label: "Ei" }
      ]
    },
    {
      id: "assets",
      title: "Onko yrityksellä toimitila, koneita, laitteita, kalusteita, työkaluja tai varastoa?",
      desc: "Omaisuusvakuutuksen tarkennuksessa selvitetään myöhemmin, mitä omaisuutta halutaan suojata.",
      options: [
        { value: "yes", label: "Kyllä", scores: { bizProperty: score(8, "yrityksellä on omaisuutta, jonka vahinko voisi vaikuttaa toimintaan") } },
        { value: "no", label: "Ei" }
      ]
    },
    {
      id: "people",
      title: "Voiko yrittäjän tai avainhenkilön poissaolo pysäyttää työn tai heikentää kassavirtaa?",
      desc: "Tämä auttaa tunnistamaan henkilöriskin ja mahdollisen keskeytysriskin.",
      options: [
        { value: "yes", label: "Kyllä", scores: { bizPeople: score(5, "yrittäjän tai avainhenkilön työkyky on toiminnalle tärkeä"), bizInterruption: score(5, "avainhenkilön poissaolo voi aiheuttaa keskeytysriskin") } },
        { value: "no", label: "Ei" }
      ]
    },
    {
      id: "mobility",
      title: "Onko yrityksellä autoja, pakettiautoja, työkoneita tai muuta ajoneuvokalustoa?",
      desc: "Ajoneuvot nostavat esiin liikennevakuutuksen ja yrityksen ajoneuvoturvan.",
      options: [
        { value: "yes", label: "Kyllä", scores: { bizVehicle: score(8, "yrityksellä on ajoneuvoja tai kalustoa käytössä") } },
        { value: "no", label: "Ei" }
      ]
    },
    {
      id: "riskConcerns",
      title: "Voiko vahinko keskeyttää yrityksen toiminnan tai kassavirran?",
      desc: "Keskeytysriski voi syntyä esimerkiksi omaisuusvahingosta, järjestelmäkatkosta tai avainhenkilön poissaolosta.",
      options: [
        { value: "yes", label: "Kyllä", scores: { bizInterruption: score(8, "toiminnan keskeytyminen voisi vaikuttaa kassavirtaan"), bizProperty: score(2, "omaisuusvahinko voi aiheuttaa keskeytyksen") } },
        { value: "no", label: "Ei" }
      ]
    },
    {
      id: "digital",
      title: "Riippuuko yritys järjestelmistä, verkkokaupasta, ajanvarauksesta tai asiakasdatasta?",
      desc: "Digitaalinen riippuvuus voi nostaa esiin kyberriskin.",
      options: [
        { value: "yes", label: "Kyllä", scores: { bizCyber: score(8, "yritys on riippuvainen järjestelmistä tai asiakasdatasta"), bizInterruption: score(2, "järjestelmäkatko voi keskeyttää toimintaa") } },
        { value: "no", label: "Ei" }
      ]
    },
    {
      id: "businessTravel",
      title: "Tehdäänkö yrityksessä työmatkoja kotimaassa tai ulkomailla?",
      desc: "Työmatkat nostavat esiin yrityksen matkavakuutuksen tarkistuksen.",
      options: [
        { value: "yes", label: "Kyllä", scores: { bizTravel: score(7, "yrityksessä tehdään työmatkoja") } },
        { value: "no", label: "Ei" }
      ]
    },
    {
      id: "cargo",
      title: "Kuljettaako yritys omaa tavaraa, asiakkaan tavaraa tai myytäviä tuotteita?",
      desc: "Kuljetukset nostavat esiin tavarankuljetus- ja kuljetusvastuuriskin.",
      options: [
        { value: "yes", label: "Kyllä", scores: { bizCargo: score(8, "yritys kuljettaa tavaraa tai vastaa kuljetettavasta omaisuudesta") } },
        { value: "no", label: "Ei" }
      ]
    },
    {
      id: "construction",
      title: "Tehdäänkö yrityksessä rakennus-, asennus-, korjaus- tai projektitöitä?",
      desc: "Työmaa- ja projektiriskit tarkennetaan vasta syventävässä vaiheessa.",
      options: [
        { value: "yes", label: "Kyllä", scores: { bizConstruction: score(8, "rakennus-, asennus- tai projektityö voi vaatia kohdekohtaisen vakuutustarkistuksen"), bizLiability: score(3, "työmaalla voi syntyä vastuita asiakkaalle tai sivulliselle"), bizProperty: score(2, "työkalut ja materiaalit voivat tarvita omaisuusturvaa") } },
        { value: "no", label: "Ei" }
      ]
    },
    {
      id: "realEstate",
      title: "Omistaako yritys kiinteistön, rakennuksen tai vuokrattavan kohteen?",
      desc: "Kiinteistöön liittyvät vakuutukset tarkennetaan erikseen, jos aihe on ajankohtainen.",
      options: [
        { value: "yes", label: "Kyllä", scores: { bizRealEstate: score(8, "yrityksellä on kiinteistö, rakennus tai vuokrattava kohde"), bizInterruption: score(2, "vuokratuoton tai tilan käytön keskeytys voi olla riski") } },
        { value: "no", label: "Ei" }
      ]
    },
    {
      id: "patient",
      title: "Tarjoaako yritys terveyden-, sairaanhoidon, hoivan tai kuntoutuksen palveluja?",
      desc: "Tietyissä sote- ja terveyspalveluissa potilasvakuutus pitää tarkistaa.",
      options: [
        { value: "yes", label: "Kyllä", scores: { bizPatient: score(8, "terveyden- tai sairaanhoidon toiminta voi edellyttää potilasvakuutuksen tarkistusta"), bizLiability: score(3, "sote- ja hoivapalveluissa toiminnan vastuut kannattaa tarkistaa") } },
        { value: "no", label: "Ei" }
      ]
    },
    {
      id: "shock",
      title: "Olisiko iso vahinko, vaatimus tai pitkä keskeytys vaikea kantaa yrityksen kassasta?",
      desc: "Tämä painottaa suosituksissa taloudellisesti merkittäviä riskejä.",
      options: [
        { value: "yes", label: "Kyllä", scores: { bizProperty: score(2, "iso vahinko olisi vaikea kantaa kassasta"), bizInterruption: score(2, "pitkä keskeytys olisi vaikea kantaa kassasta"), bizLiability: score(2, "suuri vaatimus olisi vaikea kantaa kassasta"), bizCyber: score(2, "järjestelmä- tai tietoturvavahinko voisi olla taloudellisesti merkittävä"), bizPeople: score(2, "henkilöriski voisi vaikuttaa yrityksen kassaan") } },
        { value: "no", label: "Ei" }
      ]
    },
    {
      id: "currentCovers",
      title: "Onko nykyinen yritysvakuutusten kokonaisuus epäselvä tai haluatko varmistaa sen riittävyyden?",
      desc: "Jos vastaat kyllä, tulos ohjaa vahvemmin asiantuntijan arvioon.",
      options: [
        { value: "yes", label: "Kyllä", scores: { bizProperty: score(1, "nykyinen yritysvakuutusten kokonaisuus on epäselvä"), bizLiability: score(1, "nykyinen yritysvakuutusten kokonaisuus on epäselvä"), bizInterruption: score(1, "nykyinen yritysvakuutusten kokonaisuus on epäselvä"), bizCyber: score(1, "nykyinen yritysvakuutusten kokonaisuus on epäselvä"), bizPeople: score(1, "nykyinen yritysvakuutusten kokonaisuus on epäselvä"), bizVehicle: score(1, "nykyinen yritysvakuutusten kokonaisuus on epäselvä") } },
        { value: "no", label: "Ei" }
      ]
    }
  ]
};

const q = (id, title, desc, multi, options) => ({ id, title, desc, multi, options: options.map(([value, label, hint]) => ({ value, label, hint })) });

export const detailFlows = {
  personal: {
    home: {
      title: "Kotivakuutus",
      sourceNote: "Perustuu kotivakuutuksen tuotetietoihin: Laaja, Perus, Suppea, Laaja Plus, matkatavaraturva, irtaimisto ja rakennus.",
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
      sourceNote: "Perustuu ajoneuvovakuutuksen tuotetietoihin: liikennevakuutus, suppea/laaja kasko ja lisäturvat.",
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
      sourceNote: "Perustuu jatkuvan matkavakuutuksen ja matkakohtaisen eli määräaikaisen matkavakuutuksen tuotetietoihin.",
      questions: [
        q("tripPattern", "Millainen matkustaminen kuvaa sinua parhaiten?", "Matkojen määrä ja kesto ratkaisevat, kannattaako tutkia jatkuvaa vai matkakohtaista vakuutusta.", false, [["single", "Yksittäinen matka tai matkustan harvoin"], ["several", "Useita matkoja vuodessa"], ["long", "Yli kolmen kuukauden matka"], ["domestic", "Pääosin kotimaanmatkoja yli 50 km päähän"]]),
        q("travelConcerns", "Mikä matkustamisessa huolestuttaa?", "Voit valita useamman.", true, [["medical", "Sairastuminen tai tapaturma matkalla"], ["cancel", "Matkan peruuntuminen"], ["interrupt", "Matkan keskeytyminen"], ["delay", "Jatkoyhteydeltä myöhästyminen"], ["luggage", "Matkatavaroiden vahinko tai viivästyminen"], ["liability_legal", "Matkavastuu tai matkaoikeusturva"]]),
        q("travelers", "Ketkä matkustavat?", "Matkatavaravakuutus voi kattaa samassa taloudessa asuvat yhteisellä matkalla.", false, [["alone", "Matkustan yksin"], ["partner", "Matkustan puolison kanssa"], ["family", "Matkustan perheen kanssa"], ["child_alone", "Lapsi matkustaa yksin"]]),
        q("travelDeductible", "Mikä omavastuulinja tuntuu sopivalta matkatavaroille?", "Sovita omavastuu tavaroiden arvoon.", false, [["low", "Matala omavastuu"], ["medium", "Keskitasoinen omavastuu"], ["high", "Korkeampi omavastuu"]])
      ]
    },
    health: {
      title: "Terveys- ja tapaturmavakuutus",
      sourceNote: "Perustuu terveysvakuutuksen tuotetietoihin: sairauden hoitoturva, tapaturman hoitoturva, urheiluturva, haitta- ja päivärahat.",
      questions: [
        q("healthTarget", "Kenelle turvaa haetaan?", "Terveysvakuutusta voi hakea itselle, puolisolle, lapselle tai syntyvälle lapselle.", false, [["self", "Itselleni"], ["partner", "Puolisolle"], ["child", "Lapselle"], ["unborn", "Syntyvälle lapselle"]]),
        q("healthNeeds", "Mitä haluat suojata?", "Voit valita useamman.", true, [["illness_full", "Sairauden laajemmat hoitokulut"], ["illness_basic", "Yleislääkärikäynnit ja perustason sairauskulut"], ["accident", "Tapaturmien hoitokulut"], ["sports", "Urheilutapaturmat"], ["income", "Päiväraha työkyvyttömyyden varalle"], ["permanent", "Pysyvä haitta tai tapaturmainen kuolema"]]),
        q("healthDeductible", "Mikä sairauden hoitoturvan omavastuu tuntuu sopivalta?", "Sairauden hoitoturvan omavastuut ovat 300, 500 tai 1 000 euroa kalenterivuodessa.", false, [["300", "300 euroa / kalenterivuosi"], ["500", "500 euroa / kalenterivuosi"], ["1000", "1 000 euroa / kalenterivuosi"], ["not_needed", "En tarvitse sairauden hoitoturvaa"]]),
        q("healthLimits", "Onko jokin näistä erityisen tärkeä tarkistaa?", "Voit valita useamman.", true, [["health_statement", "Terveysselvitys ja mahdolliset rajoitusehdot"], ["sports_level", "Urheilulajin tai harrastustason vaikutus"], ["abroad", "Voimassaolo ulkomailla"], ["age", "Ikärajat ja päättymisiät"], ["none", "Ei erityistä"]])
      ]
    },
    life: {
      title: "Henkivakuutus",
      sourceNote: "Perustuu henkiturvan tuotetietoihin: kuolemanvaraturva, vakavan sairauden kertakorvaus, vakuutusmäärä ja edunsaaja.",
      questions: [
        q("dependents", "Keiden talous olisi turvattava?", "Lähtökohta on se, kenelle korvaus olisi tarkoitettu.", false, [["family", "Puoliso ja/tai lapset"], ["loan", "Asuntolainan tai muun velan turvaaminen"], ["business", "Yritykseen tai yhteiseen talouteen liittyvä vastuu"], ["none", "Ei selkeää riippuvuutta"]]),
        q("lifeGoal", "Mihin turvaa ensisijaisesti tarvitaan?", "Voit valita useamman.", true, [["death", "Kuolemanvaraturva läheisille"], ["serious_illness", "Vakavan sairauden kertakorvaus"], ["declining", "Velan mukana aleneva vakuutusmäärä"], ["fixed", "Selkeä sovittu kertakorvaus"]]),
        q("coverAmount", "Mikä vakuutusmäärän taso kuulostaa oikealta jatkoselvitykseen?", "Tarkka määrä lasketaan tulojen, velkojen ja huollettavien perusteella.", false, [["30000", "30 000 euroa"], ["50000", "50 000 euroa"], ["100000", "100 000 euroa"], ["needs_calc", "Tarvitsen laskennan tulojen, velkojen ja huollettavien perusteella"]]),
        q("beneficiary", "Onko edunsaaja selvä?", "Edunsaajamääräys ratkaisee, kenelle korvaus maksetaan.", false, [["clear", "Kyllä"], ["needs_help", "Tarvitsen apua edunsaajan määrittelyyn"], ["not_yet", "Ei vielä"]])
      ]
    },
    pet: {
      title: "Koira- ja kissavakuutus",
      sourceNote: "Perustuu koira- ja kissavakuutuksen tuotetietoihin: eläinlääkärikulut, henki, Hoitoturva Plus, käyttöominaisuus ja koiran vastuu.",
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
      sourceNote: "Perustuu yritysomaisuuden tuotetietoihin: esinevakuutus, huoneistoturva, kiinteistö ja rakennustyö.",
      questions: [
        q("propertyAssets", "Mitä omaisuutta halutaan suojata?", "Voit valita useamman.", true, [["premises", "Toimitila tai liiketila"], ["equipment", "Koneet, laitteet ja työkalut"], ["inventory", "Varasto ja vaihto-omaisuus"], ["tenant_improvements", "Vuokratilan muutostyöt ja kiinteät sisustukset"], ["building", "Rakennus tai kiinteistö"], ["construction", "Rakennus- tai asennuskohde"]]),
        q("propertyControl", "Miten kohde on yrityksen käytössä?", "Omistus- ja vuokrasuhde vaikuttaa vakuutettavaan omaisuuteen.", false, [["owned", "Yritys omistaa kohteen"], ["leased", "Yritys toimii vuokratilassa"], ["multiple", "Useita toimipaikkoja tai liikkuvaa omaisuutta"], ["project", "Projektikohtainen kohde"]]),
        q("propertyConcerns", "Mistä vahingoista olet huolissasi?", "Voit valita useamman.", true, [["fire_water", "Palo, vuoto tai luonnonilmiö"], ["theft", "Murto, varkaus tai ilkivalta"], ["breakdown", "Koneen tai laitteen rikkoutuminen"], ["flood", "Poikkeuksellinen tulva"], ["site", "Työmaa- tai asennuskohteen vahinko"]]),
        q("propertyDeductible", "Mikä omavastuulinja sopii yritykselle?", "Omavastuu kannattaa sovittaa kassaan ja vahinkojen todennäköisyyteen.", false, [["low", "Matala omavastuu"], ["medium", "Keskitasoinen omavastuu"], ["high", "Korkeampi omavastuu"]])
      ]
    },
    bizLiability: {
      title: "Yrityksen vastuuvakuutukset",
      sourceNote: "Perustuu vastuuvakuutusten tuotetietoihin: toiminnan vastuu, tuotevastuu, varallisuusvastuu, IT-vastuu ja hallinnon vastuu.",
      questions: [
        q("liabilityActivity", "Mihin vastuu ensisijaisesti liittyy?", "Valinta ohjaa vastuuvakuutuksen rakennetta.", false, [["operations", "Toiminnan aiheuttamat henkilö- tai esinevahingot"], ["products", "Tuotteet, valmistus, myynti tai maahantuonti"], ["professional", "Neuvonta, suunnittelu tai konsultointi"], ["it", "IT-palvelut, data tai järjestelmät"], ["management", "Johto, hallitus tai päätöksenteko"], ["healthcare", "Terveyden- tai sairaanhoito"]]),
        q("liabilityConcerns", "Mitä vastuutilanteita haluat korostaa?", "Voit valita useamman.", true, [["injury_property", "Henkilö- ja esinevahingot"], ["financial_loss", "Taloudellinen vahinko ilman esinevahinkoa"], ["ip", "Immateriaalioikeudet"], ["environment", "Ympäristövahingot"], ["recall", "Tuotteen takaisinveto"], ["contract", "Sopimusvaatimukset"]]),
        q("liabilityMarket", "Missä yritys toimii?", "Markkina-alue vaikuttaa vastuiden ja vakuutusmäärien arviointiin.", false, [["local", "Paikallisesti Suomessa"], ["finland", "Koko Suomessa"], ["eu", "EU-alueella"], ["global", "Kansainvälisesti"]]),
        q("liabilityLimit", "Mikä vakuutusmäärän taso vaatii jatkolaskennan?", "Tarkka määrä määräytyy sopimusten, liikevaihdon ja vahinkopotentiaalin perusteella.", false, [["basic", "Perustaso"], ["higher", "Korkeampi sopimusvaatimusten taso"], ["major", "Merkittävä vastuuriski tai kansainvälinen toiminta"]])
      ]
    },
    bizInterruption: {
      title: "Keskeytysvakuutus",
      sourceNote: "Perustuu keskeytysvakuutusten tuotetietoihin: KE1, KE2, KE3 ja KE4.",
      questions: [
        q("interruptionCause", "Mikä keskeyttäisi toiminnan pahiten?", "Voit valita useamman.", true, [["property", "Omaisuusvahinko toimitilassa, koneessa tai tuotannossa"], ["person", "Yrittäjän tai avainhenkilön poissaolo"], ["supplier", "Tärkeä toimittaja tai asiakas"], ["rent", "Vuokratuoton menetys"], ["event", "Sesonki tai tapahtuma peruuntuu"]]),
        q("recoveryTime", "Kuinka kauan palautuminen voisi kestää?", "Arvio auttaa hahmottamaan vastuuajan tarvetta.", false, [["short", "Alle 1 kuukausi"], ["medium", "1-3 kuukautta"], ["long", "3-12 kuukautta"], ["very_long", "Yli 12 kuukautta"]]),
        q("interruptionNeed", "Mitä keskeytyksessä pitäisi kattaa?", "Voit valita useamman.", true, [["fixed_costs", "Kiinteät kulut"], ["profit", "Menetetty käyttökate tai kate"], ["extra_costs", "Lisäkulut toiminnan jatkamiseksi"], ["wages", "Palkat ja henkilöstökulut"], ["rent_income", "Vuokratuotto"]]),
        q("interruptionCalc", "Onko keskeytysvakuutusmäärä laskettu?", "Vakuutusmäärä kannattaa perustaa kirjanpitoon ja realistiseen palautumisaikaan.", false, [["yes", "Kyllä"], ["partial", "Osittain"], ["no", "Ei vielä"]])
      ]
    },
    bizCyber: {
      title: "Kybervakuutus",
      sourceNote: "Perustuu kybervakuutuksen tuotetietoihin ja Kybervakuutus Pro -vaihtoehtoon.",
      questions: [
        q("cyberExposure", "Mikä altistaa yrityksen kyberriskille?", "Voit valita useamman.", true, [["personal_data", "Henkilö- tai asiakasdata"], ["payments", "Verkkokauppa, maksut tai ajanvaraus"], ["critical_systems", "Järjestelmät pysäyttävät toiminnan, jos ne eivät toimi"], ["supplier_access", "Alihankkijoita, pilvipalveluja tai etäkäyttöä"], ["low", "Vähäinen digitaalinen riippuvuus"]]),
        q("cyberConcerns", "Mistä kybertilanteista olet huolissasi?", "Voit valita useamman.", true, [["breach", "Tietomurto tai tietovuoto"], ["ransomware", "Kiristyshaittaohjelma"], ["interruption", "Liiketoiminnan keskeytys"], ["liability", "Asiakkaalle aiheutuva vahinko"], ["response", "Asiantuntija-apu, ilmoitukset ja palautus"]]),
        q("cyberMaturity", "Miten hyvin perusturva on kunnossa?", "Tämä auttaa suosittelemaan myös ennen vakuutusta tehtäviä tarkistuksia.", false, [["strong", "MFA, varmuuskopiot ja päivitykset kunnossa"], ["partial", "Osa asioista kunnossa"], ["weak", "Tarvitsee selvästi parantaa"], ["unknown", "En tiedä"]]),
        q("cyberLevel", "Mikä taso kuulostaa oikealta jatkoselvitykseen?", "Pro-tason tarve korostuu, jos digiriippuvuus tai vahinkopotentiaali on suuri.", false, [["standard", "Kybervakuutus"], ["pro", "Kybervakuutus Pro"], ["needs_assessment", "Tarvitaan riskikartoitus ennen tasovalintaa"]])
      ]
    },
    bizVehicle: {
      title: "Yrityksen ajoneuvovakuutukset",
      sourceNote: "Perustuu yritysten liikennevakuutus-, kasko-, ryhmäliikenne-, autoliikekasko- ja korjaamokaskoratkaisuihin.",
      questions: [
        q("fleetType", "Millaista kalustoa yrityksellä on?", "Valitse pääasiallinen ryhmä.", false, [["cars_vans", "Henkilö- ja pakettiautoja"], ["heavy", "Kuorma-autot, bussit tai raskas kalusto"], ["machinery", "Työkoneet tai erikoiskalusto"], ["motor_trade", "Autokauppa, huolto tai korjaamo"], ["mixed", "Sekalainen kalusto"]]),
        q("fleetUse", "Mihin ajoneuvoja käytetään?", "Käyttötarkoitus vaikuttaa turvan laajuuteen.", false, [["sales_service", "Myynti, asiakaskäynnit tai huolto"], ["deliveries", "Jakelu tai tavarankuljetus"], ["transport_business", "Kuljetusliiketoiminta"], ["construction", "Työmaa- ja asennuskäyttö"], ["employee_benefit", "Työsuhdeautot"]]),
        q("fleetConcerns", "Mitä haluat korostaa?", "Voit valita useamman.", true, [["collision", "Kolarointi ja vauriot"], ["glass", "Lasivahingot"], ["downtime", "Sijaisauto tai kaluston seisonta"], ["theft", "Varkaus, ilkivalta tai paloriski"], ["abroad", "Ulkomaan käyttö"], ["finance", "Rahoitus tai leasing"]]),
        q("fleetSize", "Kuinka monta ajoneuvoa on?", "Useampi ajoneuvo voi nostaa ryhmäliikenteen tai fleet-ratkaisun esiin.", false, [["one", "1"], ["few", "2-5"], ["many", "6-20"], ["large", "Yli 20"]])
      ]
    },
    bizPeople: {
      title: "Henkilö- ja työkykyratkaisut",
      sourceNote: "Perustuu työtapaturma-, yrittäjien tapaturma-, sairauskulu- ja työkykyratkaisuihin.",
      questions: [
        q("peopleSize", "Kenelle turvaa haetaan?", "Henkilömäärä ohjaa työkykyvakuutuksen vaihtoehtoja.", false, [["solo", "Yrittäjä ilman työntekijöitä"], ["micro", "2-9 henkilöä"], ["small", "10-49 henkilöä"], ["medium", "50+ henkilöä"]]),
        q("peopleNeeds", "Mitä halutaan turvata?", "Voit valita useamman.", true, [["statutory", "Työtapaturma- ja ammattitautivakuutus työntekijöille"], ["entrepreneur_accident", "Yrittäjän tapaturma tai vapaaehtoinen työajan vakuutus"], ["medical", "Sairauskulut ja nopea hoitoon pääsy"], ["workability", "Työkyvyn tuki ja poissaolojen hallinta"], ["leisure", "Vapaa-ajan tapaturmat"], ["key_people", "Avainhenkilöt tai johtoryhmä"]]),
        q("healthLevel", "Mikä hoitotaso kuulostaa oikealta?", "Työkykyvakuutuksessa taso voi määräytyä yleis- tai erikoislääkäritason mukaan.", false, [["basic", "Yleislääkäritasoinen"], ["specialist", "Erikoislääkäritasoinen"], ["key", "Avainhenkilö- tai johtoryhmätaso"], ["not_sure", "En osaa sanoa"]]),
        q("peopleTax", "Onko tavoitteena henkilöstöetu koko henkilöstölle?", "Tämä vaikuttaa jatkoselvitykseen ja verotukselliseen arvioon.", false, [["all", "Koko henkilöstölle samansisältöisenä"], ["selected", "Vain osalle henkilöstöä"], ["entrepreneur", "Vain yrittäjälle"], ["unknown", "Ei vielä päätetty"]])
      ]
    },
    bizTravel: {
      title: "Yrityksen matkavakuutukset",
      sourceNote: "Perustuu matkustaja-, komennus-, matkatavara-, matkavastuu- ja matkaoikeusturvaratkaisuihin.",
      questions: [
        q("bizTripType", "Millaisia työmatkoja tehdään?", "Matkan kesto ja kohde vaikuttavat vakuutuksen rakenteeseen.", false, [["domestic", "Pääosin kotimaan työmatkoja"], ["short_abroad", "Lyhyitä ulkomaan työmatkoja"], ["frequent", "Säännöllistä kansainvälistä matkustamista"], ["posted", "Komennuksia tai pitkäaikaisia ulkomaantöitä"]]),
        q("travelerGroup", "Ketkä matkustavat?", "Voit valita useamman.", true, [["entrepreneur", "Yrittäjä"], ["employees", "Työntekijät"], ["management", "Johto tai avainhenkilöt"], ["families", "Komennuksilla mukana perheenjäseniä"]]),
        q("bizTravelConcerns", "Mitä matkalla pitää kattaa?", "Voit valita useamman.", true, [["medical", "Sairaus ja tapaturma matkalla"], ["luggage", "Matkatavarat ja työvälineet"], ["liability", "Matkavastuu"], ["legal", "Matkaoikeusturva"], ["evacuation", "Kotiutus, evakuointi tai poikkeustilanne"]]),
        q("bizTravelPolicy", "Onko yrityksellä matkustuspolitiikka?", "Valmis politiikka helpottaa vakuutuksen rajaamista.", false, [["yes", "Kyllä"], ["partial", "Osittain"], ["no", "Ei vielä"]])
      ]
    },
    bizCargo: {
      title: "Kuljetusvakuutukset",
      sourceNote: "Perustuu tavarankuljetus-, tiekuljetusvastuu-, autokuljetus- ja logistiikkaoperaattoriratkaisuihin.",
      questions: [
        q("cargoRole", "Mikä on yrityksen rooli kuljetuksessa?", "Rooli ratkaisee, tarvitaanko tavaran vakuutus vai kuljetusvastuu.", false, [["own_goods", "Kuljetamme omaa tavaraa"], ["carrier", "Kuljetamme asiakkaan tavaraa"], ["forwarder", "Huolinta tai logistiikkaoperaattori"], ["exhibition", "Messu- tai näyttelykuljetukset"]]),
        q("cargoFrequency", "Kuinka usein kuljetuksia on?", "Toistuvuus vaikuttaa jatkuvan ja kertakuljetuksen välillä.", false, [["one_off", "Yksittäisiä kuljetuksia"], ["monthly", "Kuukausittain"], ["weekly", "Viikoittain"], ["daily", "Päivittäin"]]),
        q("cargoMode", "Millä tavara liikkuu?", "Voit valita useamman.", true, [["road", "Maantie"], ["sea", "Meri"], ["air", "Ilma"], ["rail", "Rautatie"], ["multi", "Useita kuljetusmuotoja"]]),
        q("cargoValue", "Mikä on tavaran arvo- ja vahinkopotentiaali?", "Tämä ohjaa vakuutusmäärän ja ehtojen tarkistusta.", false, [["low", "Matala"], ["medium", "Keskitasoinen"], ["high", "Korkea tai kriittinen"], ["temperature", "Lämpötilaherkkä tai erityistavara"]])
      ]
    },
    bizLegal: {
      title: "Yrityksen oikeusturvavakuutus",
      sourceNote: "Perustuu OK1 oikeudenkäyntikuluvakuutukseen ja OK2 immateriaalioikeuksien turvaan.",
      questions: [
        q("legalDisputes", "Minkä tyyppisiä riitoja halutaan varalta huomioida?", "Voit valita useamman.", true, [["contract", "Sopimus- tai toimitusriidat"], ["customer", "Asiakas- tai reklamaatioriitat"], ["employment", "Työsuhderiidat"], ["ip", "Immateriaalioikeudet"], ["real_estate", "Vuokra- tai kiinteistöriidat"]]),
        q("legalMarket", "Missä sopimuksia tehdään?", "Toiminta-alue vaikuttaa ehtojen ja vakuutusmäärän tarkistukseen.", false, [["finland", "Suomi"], ["eu", "EU"], ["global", "Kansainvälinen"], ["unknown", "Ei tiedossa"]]),
        q("legalVolume", "Kuinka sopimuspainotteista toiminta on?", "Sopimusten määrä ja arvo vaikuttavat oikeusturvan merkitykseen.", false, [["low", "Vähän sopimuksia"], ["medium", "Säännöllisesti sopimuksia"], ["high", "Sopimukset ovat toiminnan ytimessä"]])
      ]
    },
    bizRealEstate: {
      title: "Kiinteistövakuutus",
      sourceNote: "Perustuu kiinteistövakuutuksen, huoneistoturvan, vuokratuottokeskeytyksen ja kiinteistön vastuukysymysten tuotetietoihin.",
      questions: [
        q("realEstateType", "Minkä tyyppinen kohde on?", "Kohteen käyttötarkoitus vaikuttaa riskiprofiiliin.", false, [["residential", "Asuin- tai vuokratalo"], ["commercial", "Liike- tai toimistokiinteistö"], ["industrial", "Teollisuus- tai tuotantokiinteistö"], ["mixed", "Sekakäyttöinen kohde"]]),
        q("realEstateRole", "Mikä on yrityksen rooli?", "Omistajan ja vuokralaisen tarpeet eroavat toisistaan.", false, [["owner", "Omistaja"], ["landlord", "Vuokranantaja"], ["tenant", "Vuokralainen"], ["manager", "Isännöinti tai hallinnointi"]]),
        q("realEstateConcerns", "Mitä pitää huomioida?", "Voit valita useamman.", true, [["building", "Rakennusvahingot"], ["liability", "Kiinteistön omistajan vastuu"], ["rental_income", "Vuokratuoton keskeytys"], ["flood", "Poikkeuksellinen tulva"], ["renovation", "Korjaus- tai muutostyöt"]]),
        q("realEstateDeductible", "Mikä omavastuulinja sopii?", "Kiinteistössä omavastuu kannattaa sovittaa kohteen arvoon ja kassaan.", false, [["low", "Matala"], ["medium", "Keskitasoinen"], ["high", "Korkea"]])
      ]
    },
    bizPatient: {
      title: "Potilasvakuutus",
      sourceNote: "Perustuu potilasvakuutuksen tuotetietoihin ja toiminnan vastuukysymysten tarkistukseen.",
      questions: [
        q("patientActivity", "Mitä toimintaa yritys harjoittaa?", "Potilasvakuutuksen tarve liittyy terveyden- ja sairaanhoidon toimintaan.", false, [["healthcare", "Terveyden- tai sairaanhoito"], ["therapy", "Terapia, kuntoutus tai hoivapalvelu"], ["beauty", "Esteettinen tai hyvinvointipalvelu"], ["support", "Alihankinta tai tukipalvelu sote-toimijalle"]]),
        q("patientStaff", "Ketkä palvelua tuottavat?", "Ammattihenkilöt ja alihankkijat pitää tunnistaa.", false, [["licensed", "Laillistetut ammattihenkilöt"], ["mixed", "Sekä ammattihenkilöitä että muuta henkilöstöä"], ["subcontractors", "Alihankkijoita"], ["unknown", "Ei vielä selvää"]]),
        q("patientVolume", "Mikä on asiakasvolyymi?", "Volyymi auttaa jatkoselvityksessä.", false, [["low", "Vähäinen"], ["medium", "Säännöllinen"], ["high", "Suuri tai useita toimipaikkoja"]])
      ]
    },
    bizConstruction: {
      title: "Rakennus- ja asennustyövakuutus",
      sourceNote: "Perustuu rakennus- ja asennustyön määräaikaiseen ja jatkuvaan ratkaisuun sekä työmaiden riskitarkistukseen.",
      questions: [
        q("constructionType", "Millaisia töitä tehdään?", "Työn luonne vaikuttaa määräaikaisen ja jatkuvan ratkaisun välillä.", false, [["single_project", "Yksittäinen rakennus- tai asennushanke"], ["continuous", "Jatkuvaa urakointi- tai asennustoimintaa"], ["repair", "Korjaus- ja kunnossapitotyöt"], ["subcontractor", "Aliurakointi"]]),
        q("constructionAssets", "Mitä työmaalla pitää suojata?", "Voit valita useamman.", true, [["work_object", "Työn kohde"], ["materials", "Rakennustarvikkeet ja materiaalit"], ["tools", "Työkalut ja koneet"], ["temporary", "Väliaikaiset rakenteet"], ["existing", "Työn kohteena oleva olemassa oleva omaisuus"]]),
        q("constructionConcerns", "Mistä vahingoista olet huolissasi?", "Voit valita useamman.", true, [["fire", "Tulityöt ja paloriski"], ["water", "Vuoto- tai säävahingot"], ["theft", "Varkaus tai ilkivalta"], ["liability", "Sivullisvahingot"], ["delay", "Viivästys tai suorituskyvyttömyys"]]),
        q("constructionDuration", "Kuinka pitkiä hankkeet ovat?", "Kesto vaikuttaa vakuutuskauteen ja jatkuvan ratkaisun tarpeeseen.", false, [["short", "Alle 1 kuukausi"], ["medium", "1-6 kuukautta"], ["long", "Yli 6 kuukautta"], ["varies", "Vaihtelee jatkuvasti"]])
      ]
    }
  }
};

const priceNote = "Hinta-arvio saatavilla laskuri-integraation kautta";
const defaultNotice = "Turvan sisältö vaihtelee vakuutustuotteittain. Lopullinen sisältö, hinta ja soveltuvuus varmistetaan LähiTapiolan laskurissa tai asiantuntijan kanssa.";
const option = (key, title, level, means, fit, covers, limits) => ({
  key,
  title,
  level,
  means,
  fit,
  covers,
  limits,
  priceNote
});

export const coverageModels = {
  personal: {
    home: {
      label: "Turvatasot: Suppea, Perus, Laaja, LaajaPlus",
      title: "Kotivakuutuksen turvatasojen vertailu",
      notice: defaultNotice,
      calculatorAction: "Siirry kotivakuutuksen hinta-arvioon, kun laskuri-integraatio on käytössä",
      options: [
        option("suppea", "Suppea", "Rajattu turva", "Varautuminen ensisijaisesti vakavimpiin palo- ja luonnonilmiövahinkoihin.", "Kohteeseen, jossa halutaan varautua vain pahimpiin vahinkoihin, kuten ulkorakennukseen tai vähäriskiseen mökkikohteeseen.", "Tyypillisesti palo, myrsky, raesade ja salamanisku tuotekohtaisten ehtojen mukaan.", "Ei yleensä sovi, jos haluat rikkoutumis-, vuoto-, varkaus- tai laajaa irtaimistoturvaa."),
        option("perus", "Perus", "Perustason kotiturva", "Laajaa rajatumpi kotivakuutus ilman rikkoutumissuojaa.", "Tilanteeseen, jossa halutaan varautua keskeisiin koti- ja irtaimistovahinkoihin, mutta ei painoteta äkillistä rikkoutumista.", "Esimerkiksi palo-, myrsky-, rae-, vuoto-, varkaus- ja ilkivaltavahinkoja ehtojen mukaan.", "Ei tyypillisesti kata tavaroiden äkillisiä rikkoutumisvahinkoja samalla tavalla kuin Laaja."),
        option("laaja", "Laaja", "Laajin perusturvataso", "Kattavin kotivakuutuksen päätaso, joka huomioi myös rikkoutumisvahinkoja.", "Useimmille vakituisen kodin irtaimiston tai rakennuksen vakuuttajille, kun iso vahinko olisi vaikea maksaa itse.", "Äkillisiä ja ennalta arvaamattomia vahinkoja sekä rikkoutumisvahinkoja tuotekohtaisten ehtojen mukaan.", "Ei tarkoita, että kaikki vahingot korvataan; rajoitukset, omavastuut ja ikävähennykset pitää tarkistaa."),
        option("laajaPlus", "LaajaPlus", "Lisätaso Laajan yhteyteen", "Laajan kotivakuutuksen lisäturva koti-irtaimistolle.", "Kun irtaimiston arvo, elektroniikka, kiinteät sisustukset tai tilapäisasuminen korostuvat.", "Parempia irtaimiston ikävähennyksiä, tiedostojen palautusturvaa ja laajempaa kiinteiden sisustusten turvaa tuotetietojen mukaan.", "Saatavilla vain Laajan kotivakuutuksen yhteydessä ja tuotekohtaisten ehtojen mukaan.")
      ]
    },
    vehicle: {
      label: "Ajoneuvon laajuus: Liikennevakuutus, Suppea Vakuutus, Laaja Vakuutus",
      title: "Ajoneuvovakuutuksen laajuuksien vertailu",
      notice: defaultNotice,
      calculatorAction: "Siirry ajoneuvovakuutuksen hinta-arvioon, kun laskuri-integraatio on käytössä",
      options: [
        option("liikenne", "Liikennevakuutus", "Lakisääteinen vähimmäinen", "Pakollinen vakuutus liikenteessä käytettävälle ajoneuvolle.", "Kun halutaan vain lakisääteinen turva eikä oman ajoneuvon vahinkoja haluta vakuuttaa.", "Henkilövahinkoja ja syyttömän osapuolen omaisuusvahinkoja lain mukaan.", "Ei kata oman ajoneuvon vaurioita, varkautta, lasia tai kolarointia."),
        option("suppea", "Suppea Vakuutus", "Suppeampi vapaaehtoinen kasko", "Liikennevakuutusta täydentävä rajatumpi vapaaehtoinen ajoneuvovakuutus.", "Vanhemmalle tai pienemmän arvon ajoneuvolle, kun halutaan suojaa tyypillisiin riskeihin ilman laajaa kolarointiturvaa.", "Esimerkiksi palo-, varkaus-, ilkivalta-, eläin- ja luonnonilmiöriskejä sekä lisäturvia valinnan mukaan.", "Ei kata yhtä laajasti oman ajoneuvon kolarointi- tai pysäköintivahinkoja kuin Laaja Vakuutus."),
        option("laaja", "Laaja Vakuutus", "Laajempi kasko", "Liikennevakuutus ja kattavampi vapaaehtoinen ajoneuvoturva.", "Uudemmalle, rahoitetulle, leasingissä olevalle tai taloudellisesti merkittävälle ajoneuvolle.", "Kolarointi-, pysäköinti-, lasi-, varkaus-, palo-, ilkivalta- ja luonnonilmiöriskejä valittujen turvien mukaan.", "Omavastuut, lisäturvat ja ajoneuvokohtaiset rajaukset pitää tarkistaa laskurissa.")
      ]
    },
    travel: {
      label: "Sopimusmuoto: jatkuva vai matkakohtainen",
      title: "Matkavakuutuksen sopimusmuotojen vertailu",
      notice: "Matkavakuutuksen sisältö, voimassaolo ja hinta riippuvat matkan kestosta, kohteesta, matkustajista ja valituista turvista. Lopullinen sisältö varmistetaan laskurissa tai asiantuntijan kanssa.",
      calculatorAction: "Siirry matkavakuutuksen hinta-arvioon, kun laskuri-integraatio on käytössä",
      options: [
        option("matkakohtainen", "Matkakohtainen eli määräaikainen", "Yksittäisen matkan ratkaisu", "Vakuutus otetaan tietylle matkalle ja sen kestolle.", "Kun matkustat harvoin, yleensä kerran vuodessa tai yksittäiselle matkalle.", "Matkustajan hoitoturvaa, peruuntumista, keskeytymistä, myöhästymistä ja matkatavaroita valintojen mukaan.", "Ei ole jatkuvasti voimassa seuraavia matkoja varten; uusi matka vaatii uuden vakuutuksen."),
        option("jatkuva", "Jatkuva matkavakuutus", "Usein matkustavan ratkaisu", "Vuoden ympäri voimassa oleva matkavakuutus matkoille tuotekohtaisen voimassaolon mukaan.", "Kun matkustat useamman kerran vuodessa, kotimaassa tai ulkomailla.", "Matkustajan ja matkatavaroiden turvia, kotimaan matkoja yli 50 km päähän ja ulkomaanmatkoja ehtojen mukaan.", "Normaali voimassaolo on rajattu matkan kestoon; pitkät matkat vaativat erillisen tarkistuksen."),
        option("jatkuvaPidennys", "Jatkuva + pitkän matkan pidennys", "Pitkän matkan jatkoselvitys", "Jatkuvan matkavakuutuksen voimassaoloa voidaan tarvita pidennettynä pitkälle matkalle.", "Yli kolmen kuukauden matkalle tai ulkomailla pidempään oleskelevalle.", "Jatkuvan matkavakuutuksen turvat pidennettynä, jos pidennys myönnetään.", "Pidennys, kohdemaa, terveystiedot ja matkan tarkoitus pitää varmistaa erikseen.")
      ]
    },
    health: {
      label: "Turvan osat: sairaus, tapaturma, urheilu ja toimeentulo",
      title: "Terveys- ja tapaturmavakuutuksen rakenneosien vertailu",
      notice: defaultNotice,
      calculatorAction: "Pyydä terveysvakuutuksen hinta-arvio asiantuntijalta tai laskuri-integraation kautta",
      options: [
        option("sairausLaaja", "Sairauden hoitoturva", "Laajempi sairauskulujen turva", "Sairauksien tutkimus- ja hoitokuluja valitun vakuutuksen mukaan.", "Kun nopea pääsy hoitoon ja laajempi yksityisen hoidon käyttö korostuvat.", "Lääkäri-, tutkimus- ja hoitokuluja sekä valittuja hoitopolkuja ehtojen mukaan.", "Terveysselvitys, rajoitusehdot, omavastuu ja ikärajat vaikuttavat."),
        option("sairausSuppea", "Suppea sairauden hoitoturva", "Rajattu sairauskulujen turva", "Rajatummin määritelty sairauden hoitokulujen turva.", "Kun halutaan edullisempi ja rajatumpi vaihtoehto sairauskuluille.", "Perustason sairauden hoitokuluja valitun turvan mukaan.", "Ei kata yhtä laajasti kuin sairauden laajempi hoitoturva."),
        option("tapaturma", "Tapaturman hoitoturva", "Tapaturmapainotteinen turva", "Tapaturmista aiheutuvien hoitokulujen turva.", "Kun huoli liittyy erityisesti kaatumisiin, vapaa-aikaan tai arjen tapaturmiin.", "Tapaturman tutkimus- ja hoitokuluja ehtojen mukaan.", "Ei korvaa sairauksia samalla tavalla kuin sairauden hoitoturva."),
        option("urheilu", "Urheiluturva", "Aktiivisen harrastajan lisäselvitys", "Urheilun tai aktiivisen harrastamisen vaikutuksen tarkistus.", "Kun harrastat lajia, jossa tavallinen tapaturmaturva ei välttämättä riitä.", "Urheilussa sattuvia tapaturmia vain, jos laji ja harrastustaso kuuluvat turvaan.", "Lajirajoitukset ja kilpailutoiminta pitää tarkistaa aina erikseen."),
        option("paivaraha", "Päiväraha ja haittaturvat", "Toimeentulon ja pysyvän haitan tuki", "Täydentävä turva työkyvyttömyyden, pysyvän haitan tai kuoleman varalle.", "Kun tulot, yrittäjyys tai perheen talous riippuvat omasta työkyvystä.", "Päivärahaa tai kertakorvausta valittujen turvien mukaan.", "Korvausmäärät, omavastuuajat ja työkyvyttömyyden määritelmät pitää varmistaa.")
      ]
    },
    life: {
      label: "Rakenne: kuolemanvara, vakava sairaus, aleneva tai kiinteä määrä",
      title: "Henkivakuutuksen rakenteiden vertailu",
      notice: defaultNotice,
      calculatorAction: "Pyydä henkivakuutuksen hinta-arvio asiantuntijalta tai laskuri-integraation kautta",
      options: [
        option("kuolemanvara", "Kuolemanvaraturva", "Läheisten taloudellinen turva", "Kertakorvaus edunsaajille kuolemantapauksessa.", "Kun puoliso, lapset, laina tai arjen menot riippuvat tuloistasi.", "Sovittu vakuutusmäärä edunsaajille ehtojen mukaan.", "Ei ratkaise automaattisesti oikeaa vakuutusmäärää tai edunsaajaa."),
        option("vakavaSairaus", "Vakavan sairauden kertakorvaus", "Oman talouden lisätuki", "Kertakorvaus tiettyjen vakavien sairauksien tilanteessa.", "Kun haluat taloudellista liikkumavaraa sairastumisen alkuvaiheeseen.", "Sovittu kertakorvaus vakuutusehtojen mukaisissa tilanteissa.", "Korvattavat sairaudet ja rajoitukset pitää tarkistaa ehdoista."),
        option("aleneva", "Alenevasummainen turva", "Velan mukaan pienenevä tarve", "Vakuutusmäärä pienenee esimerkiksi lainan pienentyessä.", "Kun päätarve on asuntolainan tai muun velan turvaaminen.", "Vakuutusmäärä seuraa sovittua alenevaa rakennetta.", "Ei välttämättä huomioi perheen muita menoja, jos tarve ei liity vain velkaan."),
        option("kiintea", "Kiinteä kertakorvaus", "Selkeä sovittu määrä", "Vakuutusmäärä pysyy sovitulla tasolla.", "Kun haluat turvata läheisille tietyn euromääräisen puskurin.", "Sovittu kertakorvaus ehtojen mukaan.", "Vakuutusmäärän riittävyys pitää suhteuttaa tuloihin, velkoihin ja säästöihin.")
      ]
    },
    pet: {
      label: "Rakenne: eläinlääkärikulut, Plus, henki, käyttö ja vastuu",
      title: "Koira- ja kissavakuutuksen rakenneosien vertailu",
      notice: defaultNotice,
      calculatorAction: "Pyydä lemmikkivakuutuksen hinta-arvio laskuri-integraation kautta",
      options: [
        option("elainlaakari", "Eläinlääkärikuluvakuutus", "Keskeinen hoitokuluturva", "Turvaa sairauden tai tapaturman eläinlääkärikuluja.", "Useimmille koiran tai kissan omistajille.", "Tutkimus- ja hoitokuluja vakuutusmäärän, omavastuun ja ehtojen mukaan.", "Ei välttämättä kata kaikkia sairauksia, ennaltaehkäisyä tai aiempia vaivoja."),
        option("hoitoturvaPlus", "Hoitoturva Plus", "Laajentava lisäturva", "Täydentää eläinlääkärikuluturvaa valituilla hoito- ja kuntoutusmenoilla.", "Kun haluat laajemman hoitopolun esimerkiksi fysioterapiaan liittyen.", "Lisähoitoja tuotekohtaisten ehtojen mukaan.", "Saatavuus voi riippua eläimen iästä ja terveydestä."),
        option("henki", "Eläimen henkivakuutus", "Eläimen arvon turva", "Korvaa eläimen menetykseen liittyvää taloudellista arvoa ehtojen mukaan.", "Kun eläimen hankintahinta, jalostusarvo tai käyttöarvo on merkittävä.", "Sovittu vakuutusmäärä ehtojen mukaisessa kuolema- tai menetystilanteessa.", "Ei korvaa hoitokuluja ilman erillistä eläinlääkärikuluturvaa."),
        option("kaytto", "Käyttöominaisuusturva", "Käyttötarkoituksen turva", "Turvaa eläimen käyttötarkoitukseen liittyvää menetystä.", "Työ-, harrastus-, kilpailu- tai jalostuskäytössä olevalle eläimelle.", "Käyttöominaisuuden menetykseen liittyviä tilanteita ehtojen mukaan.", "Ei ole tarpeen tavalliselle kotilemmikille ilman erityistä käyttötarkoitusta."),
        option("koiranVastuu", "Koiran vastuuvakuutus", "Koiran aiheuttamien vahinkojen varalle", "Turvaa koiran ulkopuolisille aiheuttamia vahinkoja.", "Koiranomistajalle, jos vastuutilanteet mietityttävät.", "Henkilö- tai esinevahinkoja ehtojen mukaan.", "Koskee koiraa, ei kissaa.")
      ]
    }
  },
  business: {
    bizProperty: {
      label: "Rakenne: esine-, huoneisto-, kiinteistö- ja projektiturvat",
      title: "Yritysomaisuuden vakuutusrakenteiden vertailu",
      notice: defaultNotice,
      calculatorAction: "Pyydä yritysomaisuuden hinta-arvio asiantuntijalta",
      options: [
        option("esine", "ES1 Esinevakuutus", "Yrityksen irtaimen omaisuuden perusrakenne", "Koneiden, laitteiden, työkalujen ja vaihto-omaisuuden suoja.", "Yritykselle, jolla on toiminnan kannalta tärkeää irtainta omaisuutta.", "Omaisuusvahinkoja sovittujen turvien ja ehtojen mukaan.", "Ei yksin ratkaise keskeytys-, vastuu- tai kiinteistöriskiä."),
        option("huoneisto", "Huoneistoturva", "Vuokratilan ja sisustusten näkökulma", "Vuokratilan muutostöiden ja kiinteiden sisustusten suoja.", "Vuokratilassa toimivalle yritykselle.", "Vuokratilan omaisuuteen ja sisustuksiin liittyviä vahinkoja ehtojen mukaan.", "Ei korvaa rakennuksen omistajan kaikkia vastuita."),
        option("kiinteisto", "Kiinteistövakuutus", "Rakennuksen ja kiinteistön suoja", "Yrityksen omistaman rakennuksen tai kiinteistön vakuuttaminen.", "Rakennuksen tai kiinteistön omistajalle.", "Rakennusvahinkoja ja kiinteistöriskejä sovitun turvan mukaan.", "Vuokratuotto ja vastuut pitää tarkistaa erikseen."),
        option("rakennustyo", "Rakennus- ja asennustyövakuutus", "Projektikohtainen tai jatkuva työmaaturva", "Rakennus-, asennus- tai korjaustyön kohteiden suoja.", "Urakoitsijalle tai projektikohteeseen.", "Työn kohteita, materiaaleja ja työmaariskiä ehtojen mukaan.", "Urakkasopimuksen vakuutusvaatimukset pitää varmistaa.")
      ]
    },
    bizLiability: {
      label: "Rakenne: toiminnan, tuotteen, varallisuuden, IT:n ja hallinnon vastuut",
      title: "Yrityksen vastuuvakuutusten vertailu",
      notice: defaultNotice,
      calculatorAction: "Pyydä vastuuvakuutuksen hinta-arvio asiantuntijalta",
      options: [
        option("operations", "Toiminnan vastuuvakuutus", "Henkilö- ja esinevahinkojen päävastuu", "Turvaa yrityksen toiminnasta aiheutuvaa korvausvastuuta.", "Useimmille yrityksille, joilla on asiakkaita, tiloja, töitä tai palveluita.", "Henkilö- ja esinevahinkoja ehtojen mukaan.", "Ei kata kaikkia puhtaita varallisuusvahinkoja tai erityisvastuita."),
        option("products", "Tuotevastuuvakuutus", "Tuotteisiin liittyvä vastuu", "Valmistettujen, myytyjen tai maahantuotujen tuotteiden aiheuttamat vahingot.", "Kaupalle, valmistajalle, maahantuojalle ja verkkokaupalle.", "Tuotteen virheellisyydestä aiheutuvia henkilö- tai esinevahinkoja.", "Takaisinveto ja sopimusvastuut vaativat erillisen tarkistuksen."),
        option("professional", "Varallisuus- tai konsultin vastuu", "Asiantuntijatyön taloudellinen riski", "Ammatillisen virheen tai suunnittelun aiheuttama taloudellinen vahinko.", "Konsulteille, suunnittelijoille, tilitoimistoille ja neuvontatyölle.", "Puhtaita varallisuusvahinkoja tai suunnitteluvastuita vakuutuslajin mukaan.", "Toimialarajaukset ja sopimusvaatimukset ovat keskeisiä."),
        option("it", "IT-toiminnan vastuuvakuutus", "IT-palvelun vastuu", "IT-palveluissa toiselle aiheutettu vahinko.", "Ohjelmisto-, data-, pilvi- tai IT-konsultointiyritykselle.", "Henkilö-, esine- ja varallisuusvahinkoja ehtojen mukaan.", "Ei korvaa yrityksen omaa kyberkeskeytystä ilman kyber- tai keskeytysturvaa."),
        option("management", "Hallinnon vastuuvakuutus", "Johdon henkilökohtainen vastuu", "Ylimmän johdon varallisuusvastuun turva.", "Osakeyhtiölle, yhdistykselle, säätiölle tai hallitustyötä tekevälle yhteisölle.", "Johdon aiheuttamia varallisuusvahinkoja ehtojen mukaan.", "Ei korvaa operatiivisen toiminnan kaikkia vahinkoja.")
      ]
    },
    bizInterruption: {
      label: "Rakenne: KE1, KE2, KE3 ja KE4",
      title: "Keskeytysvakuutuksen rakenneosien vertailu",
      notice: defaultNotice,
      calculatorAction: "Pyydä keskeytysvakuutuksen hinta-arvio asiantuntijalta",
      options: [
        option("ke1", "KE1 Omaisuuskeskeytys", "Omaisuusvahingon aiheuttama keskeytys", "Turvaa liiketoiminnan katkosta korvattavan esinevahingon jälkeen.", "Yritykselle, jonka tuotanto, myynti tai palvelu riippuu tilasta, koneesta tai varastosta.", "Käyttökatetta, kiinteitä kuluja ja lisäkuluja sovitun rakenteen mukaan.", "Vakuutusmäärä, vastuuaika ja omavastuu pitää laskea kirjanpidosta."),
        option("ke2", "KE2 Henkilökeskeytys", "Avainhenkilön poissaolo", "Turvaa liiketoiminnan katkosta yrittäjän tai nimetyn henkilön työkyvyttömyyden vuoksi.", "Pienyritykselle, asiantuntijayritykselle tai avainhenkilöriippuvaiseen toimintaan.", "Saamatta jäänyttä katetta ehtojen mukaan.", "Terveysselvitys ja henkilön merkitys liiketoiminnalle pitää varmistaa."),
        option("ke3", "KE3 Vuokratuottokeskeytys", "Vuokratuoton menetys", "Turvaa vuokratulon keskeytymistä korvattavan esinevahingon jälkeen.", "Vuokranantajalle tai kiinteistön omistajalle.", "Vuokratuoton menetystä sovitun vastuuajan mukaan.", "Ei korvaa kaikkia vuokralaisriskejä ilman muita turvia."),
        option("ke4", "KE4 Riippuvuuskeskeytys", "Toimittaja- tai asiakasriippuvuus", "Turvaa keskeytystä, joka johtuu tärkeän riippuvuuskohteen vahingosta.", "Yritykselle, joka on riippuvainen yhdestä toimittajasta, asiakkaasta tai alihankkijasta.", "Liiketoiminnan häiriötä ehtojen mukaan.", "Riippuvuuskohteet pitää nimetä ja vakuutusmäärä mitoittaa oikein.")
      ]
    },
    bizCyber: {
      label: "Rakenne: Kybervakuutus ja Kybervakuutus Pro",
      title: "Kybervakuutuksen vaihtoehtojen vertailu",
      notice: defaultNotice,
      calculatorAction: "Pyydä kybervakuutuksen hinta-arvio asiantuntijalta",
      options: [
        option("standard", "Kybervakuutus", "Digitaalisen riskin perusteltu kokonaisuus", "Kustannus-, keskeytys- ja vastuuvakuutuksen yhdistelmä kybervahinkoihin.", "Pk-yritykselle, jolla on dataa, järjestelmäriippuvuutta tai asiakasrekistereitä.", "Selvitys-, palautus-, ilmoitus-, keskeytys- ja vastuukustannuksia ehtojen mukaan.", "Perustietoturvan taso, alihankkijat ja järjestelmäriippuvuus pitää selvittää."),
        option("pro", "Kybervakuutus Pro", "Laajemman digiriippuvuuden jatkoselvitys", "Laajempi tai asiantuntijamaisempi kyberratkaisu suurempaan vahinkopotentiaaliin.", "Yritykselle, jonka toiminta pysähtyy järjestelmäkatkosta tai jolla on merkittävä datariski.", "Laajempia kybervahinkojen kustannus-, keskeytys- ja vastuuriskejä sovitun ratkaisun mukaan.", "Edellyttää tarkempaa riskikartoitusta ja tietoturvakäytäntöjen arviointia.")
      ]
    },
    bizVehicle: {
      label: "Rakenne: liikenne, kasko, ryhmä/fleet ja korjaamoratkaisut",
      title: "Yrityksen ajoneuvoratkaisujen vertailu",
      notice: defaultNotice,
      calculatorAction: "Pyydä yritysajoneuvojen hinta-arvio asiantuntijalta",
      options: [
        option("trafficKasko", "Liikennevakuutus + kasko", "Yksittäisen yritysajoneuvon perusratkaisu", "Lakisääteinen liikennevakuutus ja vapaaehtoinen kasko.", "Yrityksen henkilö-, paketti- tai käyttöajoneuvolle.", "Liikennevahinkoja ja oman ajoneuvon kaskoriskejä valitun laajuuden mukaan.", "Käyttötarkoitus, kuljettajat ja rahoitus vaikuttavat."),
        option("fleet", "Ryhmä- tai fleet-ratkaisu", "Usean ajoneuvon hallinta", "Useamman ajoneuvon vakuutusten keskitetty tarkistus.", "Yritykselle, jolla on useita ajoneuvoja tai kalustoa.", "Kaluston vakuutukset ja mahdolliset yhtenäiset käytännöt.", "Ajoneuvolajit, käyttö ja vahinkohistoria pitää käydä läpi."),
        option("motorTrade", "Autoliikekasko tai korjaamokasko", "Autoalan erityisratkaisu", "Autokaupan, huollon tai korjaamon erityistarpeisiin.", "Autoalan yritykselle, jolla on asiakkaiden tai myytävien ajoneuvojen riskejä.", "Autoalan toimintaan liittyviä ajoneuvoriskejä ehtojen mukaan.", "Ei sovi tavalliseksi yritysauton kaskoksi ilman autoalan toimintaa.")
      ]
    },
    bizPeople: {
      label: "Rakenne: lakisääteinen, yrittäjä, työkyky ja avainhenkilöt",
      title: "Henkilö- ja työkykyratkaisujen vertailu",
      notice: defaultNotice,
      calculatorAction: "Pyydä henkilöratkaisujen hinta-arvio asiantuntijalta",
      options: [
        option("statutory", "Työtapaturma- ja ammattitautivakuutus", "Lakisääteinen työntekijäturva", "Työntekijöiden työtapaturmien ja ammattitautien vakuuttaminen.", "Yritykselle, jolla on työntekijöitä.", "Työtapaturmia ja ammattitauteja lain mukaan.", "Ei yksin kata vapaa-aikaa, yrittäjää tai sairauskuluetuja."),
        option("entrepreneur", "Yrittäjän tapaturmavakuutus", "Yrittäjän oma turva", "Yrittäjän tapaturmariskin turvaaminen.", "Yksinyrittäjälle tai yrittäjälle työntekijöiden rinnalla.", "Yrittäjän tapaturmia valitun turvan mukaan.", "YEL/TyEL-tilanne ja vapaa-ajan tarve pitää varmistaa."),
        option("workability", "Työkyky- ja sairauskuluratkaisut", "Nopea hoito ja työkyvyn tuki", "Henkilöstön tai avainhenkilöiden sairauskulu- ja työkykyratkaisu.", "Kun poissaolot, nopea hoito tai henkilöstöetu korostuvat.", "Sairauskuluja, työkyvyn tukea ja hoitoonohjausta valitun ratkaisun mukaan.", "Verotus ja vakuutettavat ryhmät pitää tarkistaa."),
        option("keyPeople", "Avainhenkilöturva", "Toiminnan jatkuvuuden tuki", "Avainhenkilöiden tai johdon työkykyyn liittyvä ratkaisu.", "Yritykselle, jossa muutama henkilö on liiketoiminnan kannalta kriittinen.", "Avainhenkilöiden hoito- ja työkykyriskejä valitun ratkaisun mukaan.", "Vaatii vakuutettavien ryhmien ja verokohtelun tarkistuksen.")
      ]
    },
    bizTravel: {
      label: "Rakenne: työmatka, komennus, tavarat, vastuu ja oikeusturva",
      title: "Yrityksen matkavakuutuksen rakenteiden vertailu",
      notice: defaultNotice,
      calculatorAction: "Pyydä yrityksen matkavakuutuksen hinta-arvio asiantuntijalta",
      options: [
        option("traveler", "Matkustajavakuutus", "Työmatkan hoitoturva", "Työmatkalla sattuvan sairauden tai tapaturman turva.", "Yritykselle, jossa yrittäjä tai henkilöstö matkustaa työasioissa.", "Sairaus- ja tapaturmakuluja matkalla ehtojen mukaan.", "Matkan kesto, kohdemaa ja vakuutettavat henkilöt pitää tarkistaa."),
        option("posted", "Komennusvakuutus", "Pitkä ulkomaantyö", "Komennukselle tai pitkäaikaiselle ulkomaantyölle suunnattu turva.", "Kun työntekijä tai yrittäjä työskentelee pidempään ulkomailla.", "Komennuksen erityistarpeita valitun ratkaisun mukaan.", "Perheenjäsenet, kohdemaa ja kesto pitää määritellä."),
        option("luggage", "Matkatavara- ja matkavastuu", "Työvälineet ja vastuu matkalla", "Matkatavaroiden, työvälineiden ja matkavastuun tarkistus.", "Kun mukana kulkee työvälineitä tai asiakirjoja.", "Tavara- ja vastuuvahinkoja ehtojen mukaan.", "Kalliit työvälineet ja erityistavarat pitää ilmoittaa erikseen."),
        option("legal", "Matkaoikeusturva", "Riita- ja oikeudenkäyntikulut matkalla", "Matkalla syntyvien oikeudellisten kulujen varalle.", "Jos työmatkoihin liittyy sopimus- tai oikeudellisia riskejä.", "Asianajo- ja oikeudenkäyntikuluja ehtojen mukaan.", "Ei korvaa kaikkia riitoja tai sopimusvastuita.")
      ]
    },
    bizCargo: {
      label: "Rakenne: oma tavara, asiakkaan tavara ja logistiikkavastuu",
      title: "Kuljetusvakuutusten rakenteiden vertailu",
      notice: defaultNotice,
      calculatorAction: "Pyydä kuljetusvakuutuksen hinta-arvio asiantuntijalta",
      options: [
        option("ownGoods", "Tavarankuljetusvakuutus", "Oman tavaran vakuuttaminen", "Yrityksen oman tavaran kuljetusriskin vakuuttaminen.", "Kun yritys kuljettaa tai lähettää omaa tavaraa.", "Tavaralle kuljetuksen aikana aiheutuvia vahinkoja ehtojen mukaan.", "Kuljetusehdot, arvo ja kuljetusmaat vaikuttavat."),
        option("carrier", "Tiekuljetusvastuu tai autokuljetusvastuu", "Asiakkaan tavaraan liittyvä vastuu", "Rahdinkuljettajan vastuuta asiakkaan tavarasta.", "Kuljetusliikkeelle tai asiakkaan tavaraa kuljettavalle.", "Lain tai sopimuksen mukaista kuljetusvastuuta ehtojen mukaan.", "Ei välttämättä kata tavaran täyttä arvoa ilman tavarankuljetusvakuutusta."),
        option("forwarder", "Logistiikkaoperaattorin vastuu", "Huolinnan ja logistiikan vastuu", "Logistiikkaoperaattorin vastuukokonaisuus.", "Huolitsijalle tai logistiikkapalvelun tarjoajalle.", "Logistiikkatoimintaan liittyviä vastuita ehtojen mukaan.", "Sopimusehdot ja vastuun siirtyminen ovat ratkaisevia."),
        option("exhibition", "Näyttely- tai kertakuljetus", "Yksittäinen erityiskuljetus", "Yksittäinen messu-, näyttely- tai projektikuljetus.", "Harvoin tapahtuvalle kuljetukselle tai erityistavaralle.", "Tavaraa valitun kuljetuksen aikana ehtojen mukaan.", "Ei sovi jatkuviin kuljetuksiin ilman jatkuvaa ratkaisua.")
      ]
    },
    bizLegal: {
      label: "Rakenne: OK1 ja OK2",
      title: "Yrityksen oikeusturvan vaihtoehtojen vertailu",
      notice: defaultNotice,
      calculatorAction: "Pyydä oikeusturvavakuutuksen hinta-arvio asiantuntijalta",
      options: [
        option("ok1", "OK1 Oikeudenkäyntikuluvakuutus", "Yritystoiminnan riitojen pääratkaisu", "Asianajo- ja oikeudenkäyntikulujen turva yritystoiminnan riidoissa.", "Useimmille yrityksille, joilla on sopimuksia, asiakkaita tai toimittajia.", "Riita- ja hakemusasioiden kuluja ehtojen mukaan.", "Ei kata kaikkia rikos-, sopimus- tai kansainvälisiä tilanteita."),
        option("ok2", "OK2 Immateriaalioikeudet", "IP-riitojen lisäselvitys", "Immateriaalioikeuksiin liittyvien riitojen oikeusturva.", "Yritykselle, jonka toiminnassa brändi, ohjelmisto, malli, patentti tai tekijänoikeus on olennainen.", "IP-riitojen kuluja ehtojen mukaan.", "Tarve, toimialue ja oikeudet pitää kartoittaa erikseen.")
      ]
    },
    bizRealEstate: {
      label: "Rakenne: kiinteistö, vastuu ja vuokratuotto",
      title: "Kiinteistövakuutuksen rakenteiden vertailu",
      notice: defaultNotice,
      calculatorAction: "Pyydä kiinteistövakuutuksen hinta-arvio asiantuntijalta",
      options: [
        option("building", "Kiinteistövakuutus", "Rakennuksen ja kiinteistön turva", "Rakennuksen omaisuusvahinkojen vakuuttaminen.", "Kiinteistön omistajalle tai vuokranantajalle.", "Rakennusvahinkoja valittujen turvien mukaan.", "Käyttötarkoitus, ikä, kunto ja suojeluohjeet vaikuttavat."),
        option("liability", "Kiinteistön vastuuvakuutus", "Omistajan vastuu", "Kiinteistön omistamiseen ja hallintaan liittyvä vastuuriski.", "Kun kiinteistössä on vuokralaisia, kävijöitä tai ulkopuolisia.", "Henkilö- ja esinevahinkoja ehtojen mukaan.", "Ei korvaa rakennuksen omaisuusvahinkoa ilman kiinteistövakuutusta."),
        option("rentalIncome", "Vuokratuottokeskeytys", "Vuokratulon turva", "Vuokratuoton menetys korvattavan esinevahingon jälkeen.", "Vuokranantajalle tai sijoituskiinteistön omistajalle.", "Vuokratulon menetystä sovitun vastuuajan mukaan.", "Ei kata kaikkia vuokralaisen maksukyky- tai sopimusriskejä.")
      ]
    },
    bizPatient: {
      label: "Rakenne: potilasvakuutus ja toiminnan vastuun tarkistus",
      title: "Potilasvakuutuksen ja vastuun vertailu",
      notice: defaultNotice,
      calculatorAction: "Pyydä potilasvakuutuksen hinta-arvio asiantuntijalta",
      options: [
        option("patient", "Potilasvakuutus", "Potilasvahinkojen lakisääteinen näkökulma", "Terveyden- ja sairaanhoitotoiminnan potilasvahinkoriskien vakuuttaminen.", "Sote-, hoiva-, terapia- tai terveyspalvelutoimijalle, jos toiminta kuuluu potilasvakuutuksen piiriin.", "Potilasvahinkoja lain ja ehtojen mukaan.", "Toiminnan kuuluminen potilasvakuutuksen piiriin pitää varmistaa."),
        option("operations", "Toiminnan vastuuvakuutus", "Muu toiminnan vastuu", "Terveyspalveluun liittyvät muut henkilö- ja esinevahingot.", "Kun toiminnassa on tiloja, asiakkaita, laitteita tai palvelutilanteita.", "Toiminnan aiheuttamia vastuita ehtojen mukaan.", "Ei korvaa potilasvahinkoja, jos ne kuuluvat potilasvakuutuksen piiriin.")
      ]
    },
    bizConstruction: {
      label: "Rakenne: määräaikainen, jatkuva, vastuu ja suorituskyky",
      title: "Rakennus- ja asennustyövakuutuksen rakenteiden vertailu",
      notice: defaultNotice,
      calculatorAction: "Pyydä rakennus- ja asennustyövakuutuksen hinta-arvio asiantuntijalta",
      options: [
        option("singleProject", "Määräaikainen rakennus- ja asennustyövakuutus", "Yksittäinen hanke", "Yhden rakennus- tai asennushankkeen vakuuttaminen.", "Kun kyseessä on rajattu projekti, jolla on selkeä alku ja loppu.", "Työn kohdetta, materiaaleja ja työmaan riskejä ehtojen mukaan.", "Hankkeen arvo, kesto ja sopimusvelvoitteet pitää määritellä."),
        option("continuous", "Jatkuva rakennus- ja asennustyövakuutus", "Jatkuva urakointi", "Toistuvan urakointi- tai asennustoiminnan vakuuttaminen.", "Yritykselle, joka tekee jatkuvasti rakennus-, asennus- tai korjaustöitä.", "Useita hankkeita sovitun vakuutusrakenteen mukaan.", "Yksittäisten suurten hankkeiden rajat pitää tarkistaa."),
        option("liability", "Toiminnan vastuun tarkistus", "Sivullis- ja työkohdevastuu", "Rakennus- ja asennustyöhön liittyvä vastuuriski.", "Kun työ voi aiheuttaa vahinkoa tilaajalle, sivulliselle tai työn kohteelle.", "Vastuita ehtojen mukaan.", "Ei korvaa työn kohdetta samalla tavalla kuin rakennus- ja asennustyövakuutus."),
        option("performance", "Suorituskyvyttömyysvakuutus", "Urakan erityinen sopimusriski", "Sopimuksen mukaisen suorituskyvyn erityistarkistus.", "Kun sopimus tai tilaaja edellyttää lisäturvaa suorituskyvyttömyyden varalle.", "Sovittuja sopimusriskejä ehtojen mukaan.", "Tarve on sopimuskohtainen ja vaatii asiantuntijan arvion.")
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
