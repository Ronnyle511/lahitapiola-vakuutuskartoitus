# LähiTapiola vakuutuskartoitus – konseptidemo

Verkkosivulle upotettava konseptidemo henkilöasiakkaille, perheille, kevytyrittäjille, yksinyrittäjille ja enintään 50 henkilön pienille yrityksille.

## Mitä tämä tekee

- Asiakas valitsee henkilöasiakas- tai yritysasiakaskartoituksen.
- Lyhyt kyllä/ei-kartoitus tunnistaa relevantit vakuutuslajit ilman tuotekohtaista syventymistä.
- Suosituksissa erotellaan lakisääteiset tarkistukset, tilanteeseen suositellut vakuutukset ja harkittavat lisäturvat.
- Jokainen vakuutuskortti kertoo ytimekkäästi, mitä vakuutus tekee ja miksi se liittyy asiakkaan tilanteeseen.
- Yrityskartoitus on rajattu kevytyrittäjiin, yksinyrittäjiin sekä 1–50 henkilön yrityksiin.
- Asiakas voi valita turvavaihtoehdon itse, vaikka kone ehdottaisi toista vaihtoehtoa.
- Turvatasojen vertailu on näkyvästi osana tuloksia. Mobiilissa kahta turvatasoa voi vertailla rinnakkain.
- Chat-avustajan demo hyödyntää kartoituksen vastauksia taustakontekstina ja auttaa ymmärtämään suosituksia.
- Asiakas voi tarkentaa valittua vakuutusta syventävällä päätöspolulla.
- Yksittäisen vakuutuksen tarkennetussa näkymässä asiakas voi avata tuoteselosteet, avaintietoasiakirjat ja ehdot.
- Asiakas näkee oman koosteensa ennen yhteystietojen jättämistä.
- Kevyt yhteydenottopyyntö kokoaa valitut aiheet, yhteydenoton ajankohdan ja nykyisen vakuutustilanteen asiantuntijalle.
- Demo ei laske hintoja, muodosta sitovaa tarjousta tai lähetä tietoja oikeaan asiakasjärjestelmään.

## Rakenne

- `index.html` - sivun runko
- `src/page-template.html` - lähdetemplaatti, josta julkaistava `index.html` rakennetaan
- `src/styles.css` - visuaalinen tyyli
- `src/data.js` - vakuutuslajit, tuotemateriaalien linkit, kysymykset ja turvatasojen vertailumallit
- `src/scoring.js` - suositusten pisteytys
- `src/detailResults.js` - syventävien tarkennusten tuloslogiikka
- `src/solutionData.js` - toimiala- ja elämäntilannekohtaiset ratkaisupaketit sekä lakisääteisten tarkistusten säännöt
- `src/solutionEngine.js` - ratkaisupaketin, tulosryhmien ja asiantuntijayhteenvedon muodostaminen
- `src/app.js` - käyttöliittymän renderöinti ja tilanhallinta
- `src/analytics.js` - analytiikkatapahtumien mallinnus
- `tests/smoke.test.mjs` - päätöslogiikan perustesti
- `tests/solution-engine.test.mjs` - ratkaisupakettien ja luokittelun testit
- `tests/ui.test.mjs` - käyttöliittymäpolkujen, vertailun, yhteenvedon ja saavutettavuuden automaattinen DOM-testi
- `tests/link-check.mjs` - taustalla säilytettyjen materiaalilinkkien tekninen tarkistus

## Käynnistys

```powershell
npm run serve
```

Avaa sen jälkeen:

```text
http://localhost:4173
```

## Yhden tiedoston versio

```powershell
npm run build
```

Komento luo julkaistavan `index.html`-tiedoston ja tiedoston `dist/preview.html`, jonka voi avata suoraan selaimessa ilman paikallista palvelinta.

## Tarkistukset

```powershell
npm run build
npm test
npm run check:syntax
npm run test:ui
npm run check:links
```

Projektissa ei ole TypeScriptiä eikä erillistä linttauskonfiguraatiota. `check:syntax` tarkistaa sovellusmoduulien JavaScript-syntaksin. `test:ui` ajaa tärkeimmät asiakaspolut, tarkistaa ajonaikaiset virheet ja tekee WCAG A/AA -tarkistuksen vakaville saavutettavuusvirheille. Värikontrasti tarkistetaan lisäksi visuaalisessa hyväksynnässä.

Linkkitesti tekee verkkopyyntöjä tuotemateriaalien linkkeihin. Asiakas näkee linkit yksittäisen vakuutuksen tarkennetussa näkymässä, ei yleisenä sivupalkkina.

## Kuvat

Demo käyttää paikallisesti tallennettuja ja verkkokäyttöön optimoituja WebP-kuvia LähiTapiolan omilta vakuutussivuilta. Alkuperäiset lähdesivut, kuvatunnisteet ja käyttöä koskeva hyväksyntä on dokumentoitu tiedostossa `IMAGE_SOURCES.md`. Sovellus ei hotlinkitä kuvia ulkoisilta palvelimilta.

## Julkaiseminen GitHub Pagesiin

Suorita `npm run build` ja varmista, että rakennettu `index.html` on repositorion juuressa. Tuotantoversion tyylit ja JavaScript on upotettu siihen, joten julkaisu ei riipu absoluuttisista tiedostopoluista. Lähdekoodi säilyy `src/`-hakemistossa ylläpitoa varten.
