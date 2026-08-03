# LähiTapiola vakuutuskartoitus – selkeä korttiversio

Verkkosivulle upotettava vakuutuskartoitus henkilöasiakkaille, yrittäjille ja pienille yrityksille. Tämä versio palauttaa alkuperäisen selkeän korttipohjaisen kartoituspolun. Hintalaskuri ja suuryritysten valinnat on poistettu. Kuvien lähteet on dokumentoitu tiedostoon `IMAGE_SOURCES.md`.

## Mitä tämä tekee

- Asiakas valitsee henkilöasiakas- tai yritysasiakaskartoituksen.
- Lyhyt kyllä/ei-kartoitus tunnistaa relevantit vakuutuslajit ilman tuotekohtaista syventymistä.
- Suosituksissa näytetään perustelut, opastava vakuutuskortti ja korttipohjainen turvan vertailu.
- Yrityspuolella tulokset jaetaan lakisääteisiin tarkistuksiin, kriittisiin tarpeisiin ja tilannekohtaisiin hyötyihin.
- Asiakas voi valita turvavaihtoehdon itse, vaikka kone ehdottaisi toista vaihtoehtoa.
- Chat-avustajan demo hyödyntää kartoituksen vastauksia taustakontekstina ja auttaa ymmärtämään suosituksia.
- Asiakas voi tarkentaa valittua vakuutusta syventävällä päätöspolulla.
- Yksittäisen vakuutuksen tarkennetussa näkymässä asiakas voi avata tuoteselosteet, avaintietoasiakirjat ja ehdot.
- Kevyt yhteydenottopyyntö kokoaa valitut aiheet ja tuottaa kopioitavan yhteenvedon asiakaspalvelulle.

## Rakenne

- `index.html` - sivun runko
- `src/page-template.html` - lähdetemplaatti, josta julkaistava `index.html` rakennetaan
- `src/styles.css` - visuaalinen tyyli
- `src/data.js` - vakuutuslajit, tuotemateriaalien linkit, kysymykset ja turvatasojen mallit
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
