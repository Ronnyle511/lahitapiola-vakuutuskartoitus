# LähiTapiola vakuutuskartoitus

Verkkosivulle upotettava vakuutuskartoitus henkilö- ja yritysasiakkaille.

## Mitä tämä tekee

- Asiakas valitsee henkilöasiakas- tai yritysasiakaskartoituksen.
- Lyhyt kartoitus tunnistaa relevantit vakuutuslajit.
- Suosituksissa näytetään perustelut ja tuoteseloste-/ehtolinkit.
- Asiakas voi tarkentaa valittua vakuutusta syventävällä päätöspolulla.
- Yhteydenottopyyntö kokoaa valitut aiheet ja tuottaa kopioitavan yhteenvedon asiakaspalvelulle.

## Rakenne

- `index.html` - sivun runko
- `src/styles.css` - visuaalinen tyyli
- `src/data.js` - vakuutuslajit, PDF-linkit ja kysymykset
- `src/scoring.js` - suositusten pisteytys
- `src/detailResults.js` - syventävien tarkennusten tuloslogiikka
- `src/app.js` - käyttöliittymän renderöinti ja tilanhallinta
- `src/analytics.js` - analytiikkatapahtumien mallinnus
- `tests/smoke.test.mjs` - päätöslogiikan perustesti
- `tests/link-check.mjs` - PDF-linkkien tarkistus

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

Komento luo tiedoston `dist/preview.html`, jonka voi avata suoraan selaimessa ilman paikallista palvelinta.

## Tarkistukset

```powershell
npm run build
npm test
npm run check:links
```

Linkkitesti tekee verkkopyyntöjä LähiTapiolan materiaaleihin.
