# Wizualizacje DAX i Power Query: zasady

Cel: ktoś widzi narzędzie raz i rozumie mechanizm. Żadnego progu wejścia: bez instrukcji, bez logowania i bez konfiguracji.

Wzorzec: `Wizualizacje DAX/01. Kontekst filtra - CALCULATE i KEEPFILTERS.html`.

## Budowa jednego narzędzia
- Jeden plik HTML w `tools/Wizualizacje DAX/` albo `tools/Wizualizacje Power Query/`, który ładuje `../viz/kit.css` i `../viz/kit.js`. Styl i skrypt specyficzne dla strony trzymaj w tym pliku.
- Bez bibliotek z sieci, bez buildów. Plik musi działać także otwarty lokalnie.
- Język: polski, ton rzeczowy i krótki. Zdania mówią, *co widać*, a nie *co kliknąć*.
- Układ: kicker, tytuł, jedno zdanie leadu, potem zakładki ze scenariuszami (`VZ.tabs`), kod (`VZ.code`, fragmenty `{{calc|…}}` są podświetlane w kolorze roli), potem siatka `.vz-grid` ze stanem po lewej i wyjaśnieniem krok po kroku po prawej, na końcu wniosek (`.vz-takeaway`).
- Interakcja: klik albo zakładka. Wszystko liczy się na żywo z danych, nic nie jest zaszyte na sztywno. Zmiana stanu odsłania kroki (`VZ.reveal`). Tryb „Krok po kroku” opcjonalnie robi to przez `VZ.stepper`.
- Kolory mają stałe znaczenie: niebieski to filtr z wizualizacji, pomarańczowy to filtr z CALCULATE lub argument funkcji, zielony to kontekst wiersza, fioletowy to przecięcie (&), szary przekreślony to filtr usunięty lub nadpisany.
- Dane: `VZ.sales` (12 wierszy: Kategoria, Kolor, Kwota). Jeśli scenariusz potrzebuje innych danych (daty, ceny, druga tabela), zdefiniuj je lokalnie: małe, czytelne, z polskimi nazwami.
- Poprawność merytoryczna jest najważniejsza: wyniki muszą być zgodne z tym, co zwróciłby Power BI. BLANK pokazuj jako „(puste)”.
- Responsywność: musi działać od 360 px (iframe w eksploratorze ma około 960 px).
