import { coverageModels, detailFlows } from "./data.js";
import { toArray } from "./scoring.js";

const has = (values, value) => toArray(values).includes(value);

export function buildDetailResult(profileId, flowKey, answers = {}) {
  const builders = {
    home: buildHomeResult,
    vehicle: buildVehicleResult,
    travel: buildTravelResult,
    health: buildHealthResult,
    life: buildLifeResult,
    pet: buildPetResult,
    bizProperty: buildBizPropertyResult,
    bizLiability: buildBizLiabilityResult,
    bizInterruption: buildBizInterruptionResult,
    bizCyber: buildBizCyberResult,
    bizVehicle: buildBizVehicleResult,
    bizPeople: buildBizPeopleResult,
    bizTravel: buildBizTravelResult,
    bizCargo: buildBizCargoResult,
    bizLegal: buildBizLegalResult,
    bizRealEstate: buildBizRealEstateResult,
    bizPatient: buildBizPatientResult,
    bizConstruction: buildBizConstructionResult
  };

  const builder = builders[flowKey];
  if (!builder) {
    const fallback = result(
      "Tarkennettu ehdotus",
      "Tarve kannattaa käydä läpi asiantuntijan kanssa.",
      [{ label: "Tulos", value: "Syventävää logiikkaa ei ole vielä mallinnettu tälle vakuutukselle." }],
      ["suositus perustuu lyhyen kartoituksen vastauksiin"],
      [],
      "Jatka hinta-arvioon ja varmista vakuutusmäärät, rajaukset ja omavastuut asiantuntijan kanssa."
    );
    return attachCoverageComparison(profileId, flowKey, answers, fallback);
  }

  return attachCoverageComparison(profileId, flowKey, answers, builder(profileId, flowKey, answers));
}

export function labelFor(profileId, flowKey, questionId, value) {
  if (!value) return "Ei valittu";
  const flow = detailFlows[profileId]?.[flowKey];
  const question = flow?.questions.find((item) => item.id === questionId);
  const option = question?.options.find((item) => item.value === value);
  return option ? option.label : value;
}

export function labelsFor(profileId, flowKey, questionId, values) {
  const list = toArray(values);
  return list.length ? list.map((value) => labelFor(profileId, flowKey, questionId, value)).join(", ") : "Ei valittu";
}

function buildHomeResult(profileId, flowKey, a) {
  const level = a.coverLevel === "unsure" || !a.coverLevel ? "laaja" : a.coverLevel;
  const levelText = level === "laaja" ? "Laaja kotivakuutus" : level === "perus" ? "Perus kotivakuutus" : "Suppea kotivakuutus";
  const additions = [];
  const notes = [];
  const reasons = [];

  if (a.plusNeed === "yes" || (level === "laaja" && a.insuredObject !== "building_only")) {
    additions.push("Laaja Plus irtaimistolle");
  }
  if (a.travelAddon === "yes") additions.push("Matkatavaraturva ulkomaanmatkoille");

  const roleText = {
    tenant: "Vuokralaiselle painotus on omassa irtaimistossa sekä vastuu- ja oikeusturvassa.",
    owner_occupier: "Omistusasunnossa kannattaa painottaa irtaimistoa, kiinteitä sisustuksia ja osakkaan vastuulla olevia muutostöitä.",
    landlord: "Vuokranantajalle korostuu omistajan näkökulma, vuokrattavan kohteen suoja ja vuokralaisen aiheuttamien vahinkojen rajaukset.",
    house_owner: "Omakotitalon omistajalle keskeistä on rakennus, irtaimisto sekä pihapiirin muut rakennelmat ja varusteet.",
    holiday_owner: "Mökin omistajalle kannattaa erottaa vapaa-ajan asunnon rakennus, irtaimisto ja mahdollinen kausikäyttö."
  };

  if (level === "laaja") reasons.push("Laaja taso on kattavin ja huomioi myös rikkoutumisvahinkoja.");
  if (level === "perus") reasons.push("Perus taso sopii, jos haluat rajatumman turvan ilman rikkoutumissuojaa.");
  if (level === "suppea") reasons.push("Suppea taso sopii lähinnä vakavimpiin palo- ja luonnonilmiövahinkoihin varautumiseen.");
  if (a.role && roleText[a.role]) reasons.push(roleText[a.role]);

  if (a.plusNeed === "yes" && level !== "laaja") {
    notes.push("Laaja Plus edellyttää Laajaa kotivakuutusta, joten turvataso kannattaa nostaa Laajaan, jos lisäturva halutaan.");
  }
  if (a.insuredObject === "building_only") notes.push("Jos vakuutetaan vain rakennus, irtaimiston erillinen tilanne kannattaa silti tarkistaa.");

  const rows = [
    { label: "Rooli", value: labelFor(profileId, flowKey, "role", a.role) },
    { label: "Vakuutettava kohde", value: labelFor(profileId, flowKey, "insuredObject", a.insuredObject) },
    { label: "Ehdotettu turvataso", value: levelText },
    { label: "Lisäturvat", value: additions.length ? additions.join(", ") : "Ei erillistä lisäturvaa vastauksilla" },
    { label: "Irtaimiston omavastuu", value: a.insuredObject === "building_only" ? "Ei ensisijainen" : labelFor(profileId, flowKey, "deductibleContents", a.deductibleContents) },
    { label: "Rakennuksen omavastuu", value: a.insuredObject === "contents" ? "Ei ensisijainen" : labelFor(profileId, flowKey, "deductibleBuilding", a.deductibleBuilding) }
  ];

  return result(
    "Kotivakuutuksen ehdotus",
    [levelText, additions.join(" + ")].filter(Boolean).join(" + "),
    rows,
    reasons,
    notes,
    "Varmista vakuutusmäärät, valittu turvataso, Laaja Plus -kelpoisuus, matkatavaraturva, vastuu- ja oikeusturva sekä omavastuut."
  );
}

function buildVehicleResult(profileId, flowKey, a) {
  const concerns = toArray(a.vehicleConcerns);
  const additions = ["Liikennevakuutus"];
  const notes = [];

  const wantsBroad = has(concerns, "collision") || has(concerns, "parking") || has(concerns, "replacement") || a.finance === "yes";
  additions.push(wantsBroad ? "Laaja kasko" : "Suppea kasko jatkoselvitykseen");
  if (has(concerns, "glass")) additions.push("Lasiturva");
  if (has(concerns, "replacement")) additions.push("Sijaisauto- tai sijaisajoneuvoturva");
  if (a.finance === "yes") notes.push("Rahoitus- tai leasingtilanne kannattaa tarkistaa kaskon rahoitusturvan osalta.");
  if (a.abroadVehicle !== "no") notes.push("Ulkomaankäyttö voi vaatia voimassaolon, vastuuvakuutuksen ja lisäturvien tarkistuksen.");

  return result(
    "Ajoneuvovakuutuksen ehdotus",
    additions.join(" + "),
    [
      { label: "Ajoneuvo", value: labelFor(profileId, flowKey, "vehicleType", a.vehicleType) },
      { label: "Ehdotettu rakenne", value: additions.join(", ") },
      { label: "Omavastuun linja", value: labelFor(profileId, flowKey, "vehicleDeductible", a.vehicleDeductible) },
      { label: "Ulkomaankäyttö", value: labelFor(profileId, flowKey, "abroadVehicle", a.abroadVehicle) }
    ],
    ["liikennevakuutus on ajoneuvolle lakisääteinen, ja kasko mitoitetaan ajoneuvon arvoon sekä vahinkohuoliin"],
    notes,
    "Tarkista ajoneuvokohtaiset tiedot, käyttö, rahoitus, kuljettajat, omavastuut ja lisäturvien saatavuus."
  );
}

function buildTravelResult(profileId, flowKey, a) {
  const concerns = toArray(a.travelConcerns);
  const covers = ["Matkustajan hoitoturva"];
  const notes = [];
  let contractType = "Matkavakuutuksen sopimusmuoto jatkoselvitykseen";

  if (has(concerns, "cancel")) covers.push("Peruuntumisturva");
  if (has(concerns, "interrupt")) covers.push("Keskeytymisturva");
  if (has(concerns, "delay")) covers.push("Myöhästymisturva");
  if (has(concerns, "luggage")) covers.push("Matkatavaravakuutus");
  if (has(concerns, "liability_legal")) covers.push("Matkavastuu ja matkaoikeusturva");

  if (a.tripPattern === "single") {
    contractType = "Matkakohtainen eli määräaikainen matkavakuutus";
    notes.push("Matkakohtainen vakuutus sopii erityisesti yksittäiselle tai harvoin tehtävälle matkalle.");
  }
  if (a.tripPattern === "several") {
    contractType = "Jatkuva matkavakuutus";
    notes.push("Jatkuva matkavakuutus on yleensä luonteva vaihtoehto, jos matkoja on useita vuodessa.");
  }
  if (a.tripPattern === "long") {
    contractType = "Jatkuva matkavakuutus ja voimassaolon pidennys jatkoselvitykseen";
    notes.push("Yli kolmen kuukauden matka vaatii voimassaolon erillisen tarkistuksen tai pidennyksen.");
  }
  if (a.tripPattern === "domestic") {
    contractType = "Jatkuva matkavakuutus tai matkakohtainen kotimaan matkalle";
    notes.push("Kotimaan matkoilla matkavakuutuksen voimassaolo kannattaa tarkistaa erityisesti yli 50 kilometrin matkoille.");
  }

  return result(
    "Matkavakuutuksen ehdotus",
    `${contractType}: ${covers.join(" + ")}`,
    [
      { label: "Matkustamisen tyyppi", value: labelFor(profileId, flowKey, "tripPattern", a.tripPattern) },
      { label: "Ehdotettu sopimusmuoto", value: contractType },
      { label: "Ehdotetut turvat", value: covers.join(", ") },
      { label: "Matkustajat", value: labelFor(profileId, flowKey, "travelers", a.travelers) },
      { label: "Matkatavaroiden omavastuu", value: labelFor(profileId, flowKey, "travelDeductible", a.travelDeductible) }
    ],
    ["matkaturva kannattaa sovittaa matkojen toistuvuuteen, kestoon ja siihen, tarvitaanko jatkuva vai matkakohtainen vakuutus"],
    notes,
    "Varmista matkakohteet, matkan kesto, vakuutettavat henkilöt, matkatavaroiden arvo ja mahdolliset terveyteen liittyvät rajoitukset."
  );
}

function buildHealthResult(profileId, flowKey, a) {
  const needs = toArray(a.healthNeeds);
  const covers = [];
  const notes = [];

  if (has(needs, "illness_full")) covers.push("Sairauden laaja hoitoturva");
  if (has(needs, "illness_basic")) covers.push("Suppeampi sairauden hoitoturva");
  if (has(needs, "accident")) covers.push("Tapaturman hoitoturva");
  if (has(needs, "sports")) covers.push("Urheiluturvan tarkistus");
  if (has(needs, "income")) covers.push("Päiväraha työkyvyttömyyden varalle");
  if (has(needs, "permanent")) covers.push("Pysyvän haitan ja tapaturmaisen kuoleman turvat");
  if (!covers.length) covers.push("Tapaturman ja sairauden hoitoturvan jatkoselvitys");
  if (has(a.healthLimits, "health_statement")) notes.push("Terveysselvitys ja mahdolliset rajoitusehdot pitää käydä läpi ennen lopullista ratkaisua.");
  if (has(a.healthLimits, "sports_level")) notes.push("Urheilulajin ja harrastustason vaikutus pitää tarkistaa erikseen.");

  return result(
    "Terveys- ja tapaturmavakuutuksen ehdotus",
    covers.join(" + "),
    [
      { label: "Kohdehenkilö", value: labelFor(profileId, flowKey, "healthTarget", a.healthTarget) },
      { label: "Ehdotetut turvat", value: covers.join(", ") },
      { label: "Sairauden hoitoturvan omavastuu", value: labelFor(profileId, flowKey, "healthDeductible", a.healthDeductible) },
      { label: "Tarkistettavat rajat", value: labelsFor(profileId, flowKey, "healthLimits", a.healthLimits) }
    ],
    ["terveysturvan rakenne kannattaa erottaa sairauteen, tapaturmaan, urheiluun ja toimeentuloon liittyviin tarpeisiin"],
    notes,
    "Tarkista vakuutusmäärät, omavastuut, terveysselvitys, urheilurajoitukset, ikärajat ja voimassaolo ulkomailla."
  );
}

function buildLifeResult(profileId, flowKey, a) {
  const goals = toArray(a.lifeGoal);
  const covers = [];
  const notes = [];

  if (has(goals, "death") || a.dependents !== "none") covers.push("Kuolemanvaraturva");
  if (has(goals, "serious_illness")) covers.push("Vakavan sairauden kertakorvaus");
  if (has(goals, "declining")) covers.push("Velan mukana aleneva vakuutusmäärä");
  if (has(goals, "fixed")) covers.push("Sovittu kertakorvaus");
  if (!covers.length) covers.push("Henkivakuutuksen tarpeen jatkoselvitys");
  if (a.coverAmount === "needs_calc") notes.push("Vakuutusmäärä kannattaa laskea tulojen, velkojen, huollettavien ja säästöjen perusteella.");
  if (a.beneficiary !== "clear") notes.push("Edunsaajamääräys kannattaa määritellä ennen sopimuksen tekemistä.");

  return result(
    "Henkivakuutuksen ehdotus",
    covers.join(" + "),
    [
      { label: "Turvattava tarve", value: labelFor(profileId, flowKey, "dependents", a.dependents) },
      { label: "Ehdotettu rakenne", value: covers.join(", ") },
      { label: "Vakuutusmäärä jatkoselvitykseen", value: labelFor(profileId, flowKey, "coverAmount", a.coverAmount) },
      { label: "Edunsaaja", value: labelFor(profileId, flowKey, "beneficiary", a.beneficiary) }
    ],
    ["henkivakuutuksessa keskeistä on sovittaa korvausmäärä läheisten, velkojen ja arjen kulujen todelliseen tarpeeseen"],
    notes,
    "Laske korvausmäärä suhteessa velkoihin, tuloihin, huollettaviin ja säästöihin sekä varmista edunsaajamääräys."
  );
}

function buildPetResult(profileId, flowKey, a) {
  const needs = toArray(a.petNeeds);
  const covers = [];
  const notes = [];

  if (has(needs, "vet") || !needs.length) covers.push("Eläinlääkärikuluvakuutus");
  if (has(needs, "plus")) covers.push("Hoitoturva Plus");
  if (has(needs, "life")) covers.push("Eläimen henkivakuutus");
  if (has(needs, "use")) covers.push("Käyttöominaisuusturva");
  if ((a.petType === "dog" || a.petType === "both") && has(needs, "liability")) covers.push("Koiran vastuuvakuutus");
  if (a.petAge === "older") notes.push("Jos eläin on jo täyttänyt 8 vuotta, uuden vakuutuksen myöntämiskelpoisuus pitää tarkistaa erityisen huolellisesti.");
  if (a.petAge === "adult" && has(needs, "plus")) notes.push("Hoitoturva Plus voi olla ikään sidottu, joten saatavuus pitää tarkistaa.");

  return result(
    "Koira- ja kissavakuutuksen ehdotus",
    covers.join(" + "),
    [
      { label: "Eläin", value: labelFor(profileId, flowKey, "petType", a.petType) },
      { label: "Ikä", value: labelFor(profileId, flowKey, "petAge", a.petAge) },
      { label: "Ehdotetut turvat", value: covers.join(", ") },
      { label: "Omavastuun linja", value: labelFor(profileId, flowKey, "petDeductible", a.petDeductible) }
    ],
    ["eläinlääkärikulut voivat olla merkittävä yllättävä meno, ja lisäturvat riippuvat eläinlajista, iästä ja käyttötarkoituksesta"],
    notes,
    "Tarkista eläimen ikä, terveystiedot, vakuutusmäärät, rajoitukset ja koiran vastuuvakuutuksen tarve."
  );
}

function buildBizPropertyResult(profileId, flowKey, a) {
  const assets = toArray(a.propertyAssets);
  const concerns = toArray(a.propertyConcerns);
  const products = [];
  const notes = [];

  if (has(assets, "building")) products.push("Kiinteistövakuutus");
  if (has(assets, "construction")) products.push("Rakennus- ja asennustyövakuutus");
  if (has(assets, "tenant_improvements")) products.push("Huoneistoturva");
  if (products.length === 0) products.push("ES1 Esinevakuutus");
  if (has(concerns, "breakdown")) notes.push("Koneen tai laitteen rikkoutuminen kannattaa tarkistaa erillisenä riskinä.");
  if (has(concerns, "flood")) notes.push("Poikkeuksellisen tulvan turva ja kohteen sijainti kannattaa varmistaa.");

  return result(
    "Yritysomaisuuden ehdotus",
    [...new Set(products)].join(" + "),
    [
      { label: "Vakuutettava omaisuus", value: labelsFor(profileId, flowKey, "propertyAssets", assets) },
      { label: "Kohteen hallinta", value: labelFor(profileId, flowKey, "propertyControl", a.propertyControl) },
      { label: "Ehdotettu rakenne", value: [...new Set(products)].join(", ") },
      { label: "Omavastuun linja", value: labelFor(profileId, flowKey, "propertyDeductible", a.propertyDeductible) }
    ],
    ["omaisuusturva kannattaa rakentaa sen mukaan, mitä yritys omistaa, vuokraa tai käyttää toiminnassaan"],
    notes,
    "Varmista toimipaikat, omaisuusarvot, omistus- tai vuokrasuhde, suojeluohjeet, omavastuu ja keskeytysvakuutuksen tarve."
  );
}

function buildBizLiabilityResult(profileId, flowKey, a) {
  const concerns = toArray(a.liabilityConcerns);
  const products = [];
  const notes = [];

  if (a.liabilityActivity === "operations" || has(concerns, "injury_property")) products.push("Toiminnan vastuuvakuutus");
  if (a.liabilityActivity === "products" || has(concerns, "recall")) products.push("Tuotevastuu ja tarvittaessa takaisinveto");
  if (a.liabilityActivity === "professional" || has(concerns, "financial_loss")) products.push("Varallisuus- tai konsultin vastuuvakuutus");
  if (a.liabilityActivity === "it") products.push("IT-toiminnan vastuuvakuutus");
  if (a.liabilityActivity === "management") products.push("Hallinnon vastuuvakuutus");
  if (a.liabilityActivity === "healthcare") products.push("Potilasvakuutus ja toiminnan vastuu");
  if (has(concerns, "environment")) products.push("Ympäristövahinkovastuun tarkistus");
  if (has(concerns, "ip")) products.push("Immateriaalioikeuksiin liittyvä vastuun tarkistus");
  if (!products.length) products.push("Toiminnan vastuuvakuutus");
  if (a.liabilityMarket === "global") notes.push("Kansainvälinen toiminta voi vaatia erillisen alue- ja vakuutusmäärätarkistuksen.");
  if (a.liabilityLimit === "major") notes.push("Merkittävä vastuuriski kannattaa käsitellä asiantuntijan kanssa vakuutusmäärän ja rajoitusten osalta.");

  return result(
    "Vastuuvakuutusten ehdotus",
    [...new Set(products)].join(" + "),
    [
      { label: "Päävastuu", value: labelFor(profileId, flowKey, "liabilityActivity", a.liabilityActivity) },
      { label: "Ehdotetut turvat", value: [...new Set(products)].join(", ") },
      { label: "Markkina-alue", value: labelFor(profileId, flowKey, "liabilityMarket", a.liabilityMarket) },
      { label: "Vakuutusmäärän linja", value: labelFor(profileId, flowKey, "liabilityLimit", a.liabilityLimit) }
    ],
    ["vastuuturva pitää sovittaa toimialaan, sopimuksiin, markkina-alueeseen ja vahinkopotentiaaliin"],
    notes,
    "Tarkista sopimusten vakuutusvaatimukset, omavastuu, vakuutusmäärä, toimialarajoitukset ja mahdolliset erityisvastuut."
  );
}

function buildBizInterruptionResult(profileId, flowKey, a) {
  const causes = toArray(a.interruptionCause);
  const products = [];
  const notes = [];

  if (has(causes, "property")) products.push("KE1 omaisuuskeskeytys");
  if (has(causes, "person")) products.push("KE2 henkilökeskeytys");
  if (has(causes, "supplier")) products.push("KE4 riippuvuuskeskeytys");
  if (has(causes, "rent")) products.push("KE3 vuokratuottokeskeytys");
  if (!products.length) products.push("Keskeytysvakuutus jatkoselvitykseen");
  if (a.recoveryTime === "very_long") notes.push("Yli 12 kuukauden palautumisaika edellyttää vastuuajan huolellista mitoitusta.");
  if (a.interruptionCalc !== "yes") notes.push("Keskeytysvakuutusmäärä kannattaa laskea kirjanpidon ja realistisen palautumissuunnitelman perusteella.");

  return result(
    "Keskeytysvakuutuksen ehdotus",
    products.join(" + "),
    [
      { label: "Keskeytyksen syy", value: labelsFor(profileId, flowKey, "interruptionCause", causes) },
      { label: "Ehdotettu rakenne", value: products.join(", ") },
      { label: "Palautumisaika", value: labelFor(profileId, flowKey, "recoveryTime", a.recoveryTime) },
      { label: "Katettavat erät", value: labelsFor(profileId, flowKey, "interruptionNeed", a.interruptionNeed) }
    ],
    ["keskeytysturva täydentää omaisuus- tai henkilöriskiä silloin, kun vahinko pysäyttää liikevaihdon"],
    notes,
    "Laske vakuutusmäärä käyttökatteen, kiinteiden kulujen, palkkojen ja lisäkulujen perusteella sekä mitoita vastuuaika realistisesti."
  );
}

function buildBizCyberResult(profileId, flowKey, a) {
  const exposure = toArray(a.cyberExposure);
  const concerns = toArray(a.cyberConcerns);
  const notes = [];
  const level = a.cyberLevel === "pro" || has(exposure, "critical_systems") || has(concerns, "ransomware")
    ? "Kybervakuutus Pro jatkoselvitykseen"
    : "Kybervakuutus";

  if (a.cyberMaturity === "weak" || a.cyberMaturity === "unknown") {
    notes.push("Ennen lopullista valintaa kannattaa varmistaa MFA, varmuuskopiot, päivitykset ja käyttöoikeuksien hallinta.");
  }
  if (has(concerns, "breach")) notes.push("Tietomurtoon liittyvät ilmoitus- ja asiantuntijakulut kannattaa huomioida.");

  return result(
    "Kybervakuutuksen ehdotus",
    level,
    [
      { label: "Digitaalinen altistus", value: labelsFor(profileId, flowKey, "cyberExposure", exposure) },
      { label: "Ehdotettu taso", value: level },
      { label: "Huolenaiheet", value: labelsFor(profileId, flowKey, "cyberConcerns", concerns) },
      { label: "Perusturvan tila", value: labelFor(profileId, flowKey, "cyberMaturity", a.cyberMaturity) }
    ],
    ["kybervakuutus kannattaa mitoittaa digitaalisen riippuvuuden, datan ja järjestelmäkeskeytyksen vaikutuksen mukaan"],
    notes,
    "Tarkista liikevaihto, järjestelmäriippuvuus, datatyypit, alihankkijat, varautumisen taso ja sopimusvaatimukset."
  );
}

function buildBizVehicleResult(profileId, flowKey, a) {
  const concerns = toArray(a.fleetConcerns);
  const products = ["Liikennevakuutus"];
  const notes = [];

  products.push(a.fleetType === "motor_trade" ? "Ryhmäliikenne, Autoliikekasko tai Korjaamokasko" : "Kaskovakuutus yrityksille");
  if (has(concerns, "downtime")) products.push("Sijaisauto- tai seisontariskin tarkistus");
  if (has(concerns, "finance")) notes.push("Rahoitus- ja leasingtilanne kannattaa tarkistaa ajoneuvokohtaisesti.");
  if (a.fleetSize === "large" || a.fleetSize === "many") notes.push("Usean ajoneuvon kalusto kannattaa käsitellä fleet- tai ryhmäratkaisuna.");

  return result(
    "Yrityksen ajoneuvovakuutusten ehdotus",
    products.join(" + "),
    [
      { label: "Kalusto", value: labelFor(profileId, flowKey, "fleetType", a.fleetType) },
      { label: "Käyttö", value: labelFor(profileId, flowKey, "fleetUse", a.fleetUse) },
      { label: "Ehdotettu rakenne", value: products.join(", ") },
      { label: "Ajoneuvojen määrä", value: labelFor(profileId, flowKey, "fleetSize", a.fleetSize) }
    ],
    ["yrityksen ajoneuvoissa pakollinen liikennevakuutus ja vapaaehtoinen kasko pitää sovittaa käyttötarkoitukseen"],
    notes,
    "Varmista rekisteröidyt ajoneuvot, käyttö, kuljettajat, rahoitus, ulkomaan käyttö ja kaluston seisontariskin merkitys."
  );
}

function buildBizPeopleResult(profileId, flowKey, a) {
  const needs = toArray(a.peopleNeeds);
  const products = [];
  const notes = [];

  if (has(needs, "statutory") || ["micro", "small", "medium"].includes(a.peopleSize)) products.push("Työtapaturma- ja ammattitautivakuutus");
  if (has(needs, "entrepreneur_accident") || a.peopleSize === "solo") products.push("Yrittäjän tapaturmavakuutus");
  if (has(needs, "medical") || has(needs, "workability")) products.push(["small", "medium"].includes(a.peopleSize) ? "Työkykyvakuutus ryhmäratkaisuna" : "Työkykyvakuutus pienyritykselle");
  if (has(needs, "key_people")) products.push(a.healthLevel === "key" ? "Työkykyvakuutus Arvo tai Loisto" : "Avainhenkilöiden työkykyturva");
  if (has(needs, "leisure")) products.push("Vapaa-ajan tapaturmaturva");
  if (!products.length) products.push("Henkilöturvan jatkoselvitys");
  if (a.peopleTax === "selected") notes.push("Vain osalle henkilöstöä tarjottu turva voi olla verotuksellisesti eri asemassa kuin koko henkilöstölle tarjottu etu.");

  return result(
    "Henkilö- ja työkykyratkaisujen ehdotus",
    products.join(" + "),
    [
      { label: "Kohderyhmä", value: labelFor(profileId, flowKey, "peopleSize", a.peopleSize) },
      { label: "Ehdotetut ratkaisut", value: products.join(", ") },
      { label: "Hoitotaso", value: labelFor(profileId, flowKey, "healthLevel", a.healthLevel) },
      { label: "Henkilöstöedun linja", value: labelFor(profileId, flowKey, "peopleTax", a.peopleTax) }
    ],
    ["henkilöratkaisuissa pitää erottaa lakisääteinen turva, yrittäjän oma turva ja vapaaehtoiset henkilöstöedut"],
    notes,
    "Tarkista palkkasumma, YEL/TyEL-tilanne, henkilöstömäärä, vakuutettavat ryhmät, verotus ja työterveyden nykyinen taso."
  );
}

function buildBizTravelResult(profileId, flowKey, a) {
  const concerns = toArray(a.bizTravelConcerns);
  const products = ["Matkustajavakuutus"];
  const notes = [];

  if (a.bizTripType === "posted") products.push("Komennusvakuutus");
  if (has(concerns, "luggage")) products.push("Matkatavara- ja matkavastuuvakuutus");
  if (has(concerns, "legal")) products.push("Matkaoikeusturvavakuutus");
  if (has(concerns, "evacuation")) products.push("Laajennettu matkustajavakuutus");
  if (a.bizTravelPolicy === "no") notes.push("Matkustuspolitiikka kannattaa laatia, jotta vakuutettavat henkilöt, kohteet ja matkat ovat selviä.");

  return result(
    "Yrityksen matkavakuutuksen ehdotus",
    products.join(" + "),
    [
      { label: "Matkatyyppi", value: labelFor(profileId, flowKey, "bizTripType", a.bizTripType) },
      { label: "Matkustajat", value: labelsFor(profileId, flowKey, "travelerGroup", a.travelerGroup) },
      { label: "Ehdotettu rakenne", value: products.join(", ") },
      { label: "Matkustuspolitiikka", value: labelFor(profileId, flowKey, "bizTravelPolicy", a.bizTravelPolicy) }
    ],
    ["yrityksen matkaturva kannattaa mitoittaa matkustajien, kohteiden ja matkojen keston mukaan"],
    notes,
    "Varmista matkakohteet, matkojen kesto, vakuutettavat henkilöt, komennusten tarpeet ja matkatavaroiden vakuutusmäärä."
  );
}

function buildBizCargoResult(profileId, flowKey, a) {
  const products = [];
  const notes = [];

  if (a.cargoRole === "own_goods") products.push(a.cargoFrequency === "one_off" ? "Tavaran kertakuljetusvakuutus" : "Jatkuva tavarankuljetusvakuutus");
  if (a.cargoRole === "carrier") products.push("Tiekuljetusvastuuvakuutus tai autokuljetusvakuutus");
  if (a.cargoRole === "forwarder") products.push("Logistiikkaoperaattorin kuljetusvastuu");
  if (a.cargoRole === "exhibition") products.push("Näyttelyvakuutus");
  if (!products.length) products.push("Kuljetusvakuutuksen jatkoselvitys");
  if (a.cargoValue === "temperature") notes.push("Lämpötilaherkkä tai erityistavara tarvitsee ehtojen ja kuljetusketjun erillisen tarkistuksen.");

  return result(
    "Kuljetusvakuutuksen ehdotus",
    products.join(" + "),
    [
      { label: "Yrityksen rooli", value: labelFor(profileId, flowKey, "cargoRole", a.cargoRole) },
      { label: "Ehdotettu rakenne", value: products.join(", ") },
      { label: "Kuljetusmuodot", value: labelsFor(profileId, flowKey, "cargoMode", a.cargoMode) },
      { label: "Arvo ja erityisriski", value: labelFor(profileId, flowKey, "cargoValue", a.cargoValue) }
    ],
    ["kuljetusriskissä pitää erottaa oman tavaran vakuuttaminen ja asiakkaan tavaraan liittyvä kuljetusvastuu"],
    notes,
    "Tarkista kuljetusehdot, vastuun siirtyminen, tavaran arvo, kuljetusmaat, kuljetusmuodot ja erityisriskit."
  );
}

function buildBizLegalResult(profileId, flowKey, a) {
  const disputes = toArray(a.legalDisputes);
  const products = ["OK1 oikeudenkäyntikuluvakuutus"];
  const notes = [];

  if (has(disputes, "ip")) products.push("OK2 immateriaalioikeudet");
  if (a.legalMarket !== "finland") notes.push("Kansainvälinen sopiminen edellyttää toimialueen ja sovellettavan oikeuden tarkistamista.");

  return result(
    "Yrityksen oikeusturvan ehdotus",
    products.join(" + "),
    [
      { label: "Riitatyypit", value: labelsFor(profileId, flowKey, "legalDisputes", disputes) },
      { label: "Ehdotettu rakenne", value: products.join(", ") },
      { label: "Toiminta-alue", value: labelFor(profileId, flowKey, "legalMarket", a.legalMarket) },
      { label: "Sopimusten määrä", value: labelFor(profileId, flowKey, "legalVolume", a.legalVolume) }
    ],
    ["oikeusturva auttaa varautumaan riita-asioiden asianajo- ja oikeudenkäyntikuluihin ehtojen mukaan"],
    notes,
    "Tarkista sopimusten arvo, yleiset sopimusehdot, toimialue ja mahdolliset immateriaalioikeuksiin liittyvät riidat."
  );
}

function buildBizRealEstateResult(profileId, flowKey, a) {
  const concerns = toArray(a.realEstateConcerns);
  const products = ["Kiinteistövakuutus"];
  const notes = [];

  if (has(concerns, "rental_income")) products.push("Vuokratuottokeskeytys");
  if (has(concerns, "liability")) products.push("Kiinteistön vastuuvakuutuksen tarkistus");
  if (has(concerns, "renovation")) products.push("Rakennus- ja asennustyön tarkistus");
  if (has(concerns, "flood")) notes.push("Poikkeuksellisen tulvan turva ja sijaintiriski kannattaa tarkistaa.");

  return result(
    "Kiinteistövakuutuksen ehdotus",
    products.join(" + "),
    [
      { label: "Kohde", value: labelFor(profileId, flowKey, "realEstateType", a.realEstateType) },
      { label: "Rooli", value: labelFor(profileId, flowKey, "realEstateRole", a.realEstateRole) },
      { label: "Ehdotettu rakenne", value: products.join(", ") },
      { label: "Omavastuun linja", value: labelFor(profileId, flowKey, "realEstateDeductible", a.realEstateDeductible) }
    ],
    ["kiinteistöturva pitää sovittaa rakennuksen käyttötarkoitukseen, omistajan vastuisiin ja vuokratuottoriskiin"],
    notes,
    "Varmista rakennuksen tiedot, käyttötarkoitus, vuokralaiset, vuokratuottoriski, vastuukysymykset ja omavastuut."
  );
}

function buildBizPatientResult(profileId, flowKey, a) {
  const notes = [];
  if (a.patientStaff === "subcontractors") notes.push("Alihankkijoiden vakuuttaminen ja vastuunjako pitää tarkistaa sopimuksista.");
  if (a.patientActivity === "beauty") notes.push("Esteettisissä ja hyvinvointipalveluissa pitää varmistaa, kuuluuko toiminta potilasvakuutuksen piiriin.");

  return result(
    "Potilasvakuutuksen ehdotus",
    "Potilasvakuutus ja toiminnan vastuun tarkistus",
    [
      { label: "Toiminta", value: labelFor(profileId, flowKey, "patientActivity", a.patientActivity) },
      { label: "Palveluntuottajat", value: labelFor(profileId, flowKey, "patientStaff", a.patientStaff) },
      { label: "Volyymi", value: labelFor(profileId, flowKey, "patientVolume", a.patientVolume) }
    ],
    ["potilasvakuutus pitää selvittää, kun toiminta liittyy terveyden- tai sairaanhoitoon tai siihen rinnastuvaan palveluun"],
    notes,
    "Varmista toiminnan luvanvaraisuus, ammattihenkilöt, alihankkijat, toimipaikat ja suhde toiminnan vastuuvakuutukseen."
  );
}

function buildBizConstructionResult(profileId, flowKey, a) {
  const concerns = toArray(a.constructionConcerns);
  const products = [a.constructionType === "single_project" ? "Määräaikainen rakennus- ja asennustyövakuutus" : "Jatkuva rakennus- ja asennustyövakuutus"];
  const notes = [];

  if (has(concerns, "liability")) products.push("Toiminnan vastuun ja työn kohteena olevan omaisuuden tarkistus");
  if (has(concerns, "delay")) products.push("Suorituskyvyttömyyden tarkistus");
  if (has(concerns, "fire")) notes.push("Tulityöt ja paloturvallisuuden suojeluohjeet pitää käydä läpi ennen työn aloitusta.");

  return result(
    "Rakennus- ja asennustyövakuutuksen ehdotus",
    products.join(" + "),
    [
      { label: "Työn tyyppi", value: labelFor(profileId, flowKey, "constructionType", a.constructionType) },
      { label: "Suojattavat kohteet", value: labelsFor(profileId, flowKey, "constructionAssets", a.constructionAssets) },
      { label: "Ehdotettu rakenne", value: products.join(", ") },
      { label: "Hankkeen kesto", value: labelFor(profileId, flowKey, "constructionDuration", a.constructionDuration) }
    ],
    ["rakennus- ja asennustyövakuutus kannattaa sovittaa hankkeen kestoon, työn kohteeseen ja työmaalla olevaan omaisuuteen"],
    notes,
    "Tarkista urakkasopimus, vakuutusvelvoitteet, työmaan arvo, omavastuu, vastuut, suojeluohjeet ja hankkeen ajankohdat."
  );
}

function attachCoverageComparison(profileId, flowKey, answers, output) {
  const model = coverageModels[profileId]?.[flowKey];
  if (!model) return output;

  const recommendation = chooseCoverageKeys(flowKey, answers);
  const recommendedKeys = recommendation.keys.filter((key) => model.options.some((option) => option.key === key));
  const fallbackKeys = recommendedKeys.length ? recommendedKeys : [model.options[0]?.key].filter(Boolean);
  const recommended = model.options.filter((option) => fallbackKeys.includes(option.key));
  const alternatives = model.options.filter((option) => !fallbackKeys.includes(option.key)).slice(0, 2);

  output.comparison = {
    ...model,
    recommendedKeys: fallbackKeys,
    recommended,
    alternatives,
    basis: recommendation.basis,
    nextStep: recommendation.nextStep || model.calculatorAction
  };
  return output;
}

function chooseCoverageKeys(flowKey, a) {
  const concerns = toArray(a.vehicleConcerns || a.travelConcerns || a.healthNeeds || a.petNeeds || []);
  switch (flowKey) {
    case "home": {
      if (a.plusNeed === "yes") return picked(["laajaPlus"], "LaajaPlus voisi sopia, koska halusit vahvemman irtaimistoturvan Laajan kotivakuutuksen yhteyteen.");
      if (["suppea", "perus", "laaja"].includes(a.coverLevel)) return picked([a.coverLevel], `${labelLevel(a.coverLevel)} vastaa valitsemaasi turvatasoa, mutta sisältö kannattaa vielä verrata muihin tasoihin.`);
      if (["house_owner", "owner_occupier", "tenant"].includes(a.role)) return picked(["laaja"], "Laaja voisi sopia, koska kodin irtaimisto, rakennus tai vastuutilanteet voivat aiheuttaa taloudellisesti merkittäviä vahinkoja.");
      return picked(["perus"], "Perus voi olla vaihtoehto, jos haluat rajatummin keskeisiä kotiin liittyviä vahinkoja.");
    }
    case "vehicle": {
      if (has(concerns, "none")) return picked(["liikenne"], "Liikennevakuutus on lakisääteinen lähtökohta, mutta oman ajoneuvon vahinkoja ei tällöin yleensä suojata.");
      if (a.finance === "yes" || has(concerns, "collision") || has(concerns, "parking") || has(concerns, "replacement")) {
        return picked(["laaja"], "Laaja Vakuutus voisi sopia, koska vastauksissa korostuivat oman ajoneuvon vauriot, rahoitus tai sijaisajoneuvon tarve.");
      }
      return picked(["suppea"], "Suppea Vakuutus voi sopia, jos haluat liikennevakuutuksen lisäksi suojaa valittuihin riskeihin ilman laajinta kaskoa.");
    }
    case "travel": {
      if (a.tripPattern === "single") return picked(["matkakohtainen"], "Matkakohtainen vakuutus voisi sopia, koska kyse on yksittäisestä tai harvoin tehtävästä matkasta.");
      if (a.tripPattern === "long") return picked(["jatkuvaPidennys"], "Pitkä yli kolmen kuukauden matka vaatii jatkuvan vakuutuksen voimassaolon ja mahdollisen pidennyksen tarkistuksen.");
      return picked(["jatkuva"], "Jatkuva matkavakuutus vaikuttaa sopivalta, kun matkoja on useita vuodessa tai haluat turvan olevan valmiina myös kotimaan matkoille.");
    }
    case "health": {
      const keys = [];
      if (has(a.healthNeeds, "illness_full")) keys.push("sairausLaaja");
      if (has(a.healthNeeds, "illness_basic")) keys.push("sairausSuppea");
      if (has(a.healthNeeds, "sports")) keys.push("urheilu");
      if (has(a.healthNeeds, "accident")) keys.push("tapaturma");
      if (has(a.healthNeeds, "income") || has(a.healthNeeds, "permanent")) keys.push("paivaraha");
      return picked(keys.length ? keys.slice(0, 3) : ["tapaturma"], "Terveysturvan rakenne kannattaa valita sen mukaan, painottuuko vastauksissa sairaus, tapaturma, urheilu vai toimeentulon turva.");
    }
    case "life": {
      if (has(a.lifeGoal, "serious_illness")) return picked(["vakavaSairaus", "kuolemanvara"], "Vakavan sairauden kertakorvaus ja kuolemanvaraturva nousivat esiin, koska haluat turvaa sairastumisen ja läheisten talouden varalle.");
      if (has(a.lifeGoal, "declining")) return picked(["aleneva"], "Alenevasummainen turva voi sopia, jos päätarve liittyy velan pienenemiseen ajan myötä.");
      if (has(a.lifeGoal, "fixed")) return picked(["kiintea"], "Kiinteä kertakorvaus voi sopia, jos haluat läheisille selkeän sovitun euromäärän.");
      return picked(["kuolemanvara"], "Kuolemanvaraturva vaikuttaa olennaiselta, jos joku on taloudellisesti riippuvainen tuloistasi tai velat pitää turvata.");
    }
    case "pet": {
      const keys = [];
      if (has(a.petNeeds, "vet") || !toArray(a.petNeeds).length) keys.push("elainlaakari");
      if (has(a.petNeeds, "plus")) keys.push("hoitoturvaPlus");
      if (has(a.petNeeds, "life")) keys.push("henki");
      if (has(a.petNeeds, "use")) keys.push("kaytto");
      if ((a.petType === "dog" || a.petType === "both") && has(a.petNeeds, "liability")) keys.push("koiranVastuu");
      return picked(keys.length ? keys.slice(0, 3) : ["elainlaakari"], "Lemmikkivakuutuksen rakenne kannattaa valita eläinlääkärikulujen, eläimen iän ja mahdollisten lisäturvien perusteella.");
    }
    case "bizProperty": {
      const keys = [];
      if (has(a.propertyAssets, "building")) keys.push("kiinteisto");
      if (has(a.propertyAssets, "construction")) keys.push("rakennustyo");
      if (has(a.propertyAssets, "tenant_improvements")) keys.push("huoneisto");
      if (has(a.propertyAssets, "premises") || has(a.propertyAssets, "equipment") || has(a.propertyAssets, "inventory")) keys.push("esine");
      return picked(keys.length ? keys : ["esine"], "Yritysomaisuuden rakenne määräytyy sen mukaan, vakuutetaanko irtainta omaisuutta, vuokratilan muutostöitä, rakennusta vai projektikohdetta.");
    }
    case "bizLiability": {
      const key = a.liabilityActivity === "healthcare" ? "operations" : (a.liabilityActivity || "operations");
      return picked([key], "Vastuuvakuutuksen tyyppi kannattaa valita sen mukaan, syntyykö riski toiminnasta, tuotteista, asiantuntijatyöstä, IT-palveluista vai johdon vastuusta.");
    }
    case "bizInterruption": {
      const keys = [];
      if (has(a.interruptionCause, "property")) keys.push("ke1");
      if (has(a.interruptionCause, "person")) keys.push("ke2");
      if (has(a.interruptionCause, "rent")) keys.push("ke3");
      if (has(a.interruptionCause, "supplier")) keys.push("ke4");
      return picked(keys.length ? keys : ["ke1"], "Keskeytysvakuutus kannattaa rakentaa keskeytyksen todennäköisen syyn mukaan.");
    }
    case "bizCyber":
      return picked([a.cyberLevel === "pro" || has(a.cyberExposure, "critical_systems") || has(a.cyberConcerns, "ransomware") ? "pro" : "standard"], "Kyberturvan taso määräytyy digitaalisen riippuvuuden, datariskin ja keskeytysvaikutuksen perusteella.");
    case "bizVehicle":
      if (a.fleetType === "motor_trade") return picked(["motorTrade"], "Autoalan toiminta tarvitsee tavallisen yritysauton sijaan autoliikkeen tai korjaamon erityisratkaisun.");
      if (["many", "large"].includes(a.fleetSize)) return picked(["fleet"], "Useampi ajoneuvo kannattaa tarkistaa ryhmä- tai fleet-ratkaisuna.");
      return picked(["trafficKasko"], "Yritysajoneuvon lähtökohta on liikennevakuutus ja käyttötarkoitukseen sopiva kasko.");
    case "bizPeople": {
      const keys = [];
      if (["micro", "small", "medium"].includes(a.peopleSize) || has(a.peopleNeeds, "statutory")) keys.push("statutory");
      if (a.peopleSize === "solo" || has(a.peopleNeeds, "entrepreneur_accident")) keys.push("entrepreneur");
      if (has(a.peopleNeeds, "medical") || has(a.peopleNeeds, "workability")) keys.push("workability");
      if (has(a.peopleNeeds, "key_people")) keys.push("keyPeople");
      return picked(keys.length ? keys.slice(0, 3) : ["entrepreneur"], "Henkilöratkaisuissa erotetaan työntekijöiden lakisääteinen turva, yrittäjän oma turva ja vapaaehtoiset työkykyratkaisut.");
    }
    case "bizTravel": {
      const keys = ["traveler"];
      if (a.bizTripType === "posted") keys.push("posted");
      if (has(a.bizTravelConcerns, "luggage") || has(a.bizTravelConcerns, "liability")) keys.push("luggage");
      if (has(a.bizTravelConcerns, "legal")) keys.push("legal");
      return picked(keys.slice(0, 3), "Yrityksen matkaturva rakentuu matkustajaturvasta ja tarvittaessa komennus-, tavara-, vastuu- ja oikeusturvasta.");
    }
    case "bizCargo":
      return picked([{ own_goods: "ownGoods", carrier: "carrier", forwarder: "forwarder", exhibition: "exhibition" }[a.cargoRole] || "ownGoods"], "Kuljetusvakuutuksen oikea rakenne riippuu siitä, kuljettaako yritys omaa tavaraa vai vastaako asiakkaan tavarasta.");
    case "bizLegal":
      return picked(has(a.legalDisputes, "ip") ? ["ok1", "ok2"] : ["ok1"], "Yrityksen oikeusturvan rakenne määräytyy riitatyyppien ja mahdollisten immateriaalioikeusriskien perusteella.");
    case "bizRealEstate": {
      const keys = ["building"];
      if (has(a.realEstateConcerns, "liability")) keys.push("liability");
      if (has(a.realEstateConcerns, "rental_income")) keys.push("rentalIncome");
      return picked(keys, "Kiinteistöturva kannattaa rakentaa rakennuksen, omistajan vastuun ja vuokratuoton menetyksen ympärille.");
    }
    case "bizPatient":
      return picked(["patient", "operations"], "Sote- ja terveyspalveluissa potilasvakuutuksen tarve pitää erottaa muusta toiminnan vastuusta.");
    case "bizConstruction": {
      const keys = [a.constructionType === "single_project" ? "singleProject" : "continuous"];
      if (has(a.constructionConcerns, "liability")) keys.push("liability");
      if (has(a.constructionConcerns, "delay")) keys.push("performance");
      return picked(keys, "Rakennus- ja asennustyössä sopiva rakenne riippuu siitä, onko kyse yksittäisestä hankkeesta vai jatkuvasta urakoinnista.");
    }
    default:
      return picked([], "Suositus perustuu annettuihin vastauksiin ja vakuutuksen tuotemateriaalien päälinjoihin.");
  }
}

function picked(keys, basis, nextStep) {
  return { keys: Array.isArray(keys) ? keys : [keys], basis, nextStep };
}

function labelLevel(key) {
  return { suppea: "Suppea", perus: "Perus", laaja: "Laaja", laajaPlus: "LaajaPlus" }[key] || key;
}

function result(primaryTag, title, rows, reasons, notes, nextStep) {
  return {
    primaryTag,
    title,
    rows,
    reasons: reasons.length ? reasons : ["suositus perustuu annettuihin vastauksiin ja tuotemateriaalien päälinjoihin"],
    notes,
    nextStep
  };
}
