# LähiTapiola vakuutuskartoitus

Verkkosivulle upotettava vakuutuskartoitus henkilö- ja yritysasiakkaille.

## Mitä tämä tekee

- Asiakas valitsee henkilöasiakas- tai yritysasiakaskartoituksen.
- Lyhyt kyllä/ei-kartoitus tunnistaa relevantit vakuutuslajit ilman tuotekohtaista syventymistä.
- Tulosnäkymä jakaa lakisääteiset tarkistukset, suositellut vakuutukset ja harkittavat lisäturvat selkeiksi osioiksi.
- Selkeistä vakuutuskorteista pääsee suoraan turvavaihtoehtojen vertailuun ja valintaan.
- Yrityspuolella tulokset jaetaan lakisääteisiin tarkistuksiin, kriittisiin tarpeisiin ja tilannekohtaisiin hyötyihin.
- Asiakas voi valita turvavaihtoehdon itse, vaikka kone ehdottaisi toista vaihtoehtoa.
- Kartoitin ei esitä hinta-arvioita. Tarkka vakuutusturva ja hinta varmistetaan asiantuntijan kanssa.
- Chat-avustajan demo hyödyntää kartoituksen vastauksia taustakontekstina ja auttaa ymmärtämään suosituksia.
- Asiakas voi tarkentaa valittua vakuutusta syventävällä päätöspolulla.
- Yksittäisen vakuutuksen tarkennetussa näkymässä asiakas voi avata tuoteselosteet, avaintietoasiakirjat ja ehdot.
- Vapaaehtoinen yhteydenottopyyntö näyttää asiakkaalle etukäteen asiantuntijalle välitettävät tiedot, mukaan lukien asiakkaan valitsemat turvavaihtoehdot.

## Rakenne

- `index.html` - sivun runko
- `src/page-template.html` - lähdetemplaatti, josta julkaistava `index.html` rakennetaan
- `src/styles.css` - visuaalinen tyyli
- `src/data.js` - vakuutuslajit, tuotemateriaalien linkit, kysymykset ja turvavertailun mallit
- `src/scoring.js` - suositusten pisteytys
- `src/detailResults.js` - syventävien tarkennusten tuloslogiikka
- `src/app.js` - käyttöliittymän renderöinti ja tilanhallinta
- `src/analytics.js` - analytiikkatapahtumien mallinnus
- `tests/smoke.test.mjs` - päätöslogiikan perustesti
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
npm run check:links
```

Linkkitesti tekee verkkopyyntöjä tuotemateriaalien linkkeihin. Asiakas näkee linkit yksittäisen vakuutuksen tarkennetussa näkymässä, ei yleisenä sivupalkkina.
