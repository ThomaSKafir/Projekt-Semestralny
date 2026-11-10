🚽 YappaToilet – System zamawiania i konfiguracji toalet
1. Nazwa projektu i autorzy

Nazwa projektu: YappaToilet

Autor: Wojciech Puzia

YappaToilet to aplikacja internetowa umożliwiająca użytkownikom wybór, konfigurację oraz zamawianie różnych modeli toalet wraz z możliwością zaplanowania ich instalacji i remontu łazienki lub ubikacji.

2. Cel aplikacji

Głównym celem aplikacji YappaToilet jest uproszczenie procesu zamawiania i instalacji toalet w mieszkaniach oraz domach jednorodzinnych. Aplikacja ma zapewnić użytkownikom wygodny dostęp do szerokiej oferty produktów, możliwość ich personalizacji oraz łatwe ustalanie terminów montażu.

Aplikacja jest przeznaczona przede wszystkim dla osób, które planują remont łazienki, wymianę starej toalety lub wyposażenie nowego mieszkania czy domu.

Problem, który rozwiązuje aplikacja:

Tradycyjne zamawianie toalety oraz organizowanie jej montażu może wymagać kontaktowania się z wieloma firmami, porównywania ofert i osobnego ustalania terminów. YappaToilet ma połączyć te czynności w jednym miejscu.

Przykład użycia:

Użytkownik wchodzi na stronę YappaToilet, przegląda dostępne modele toalet i wybiera interesujący go produkt. Następnie może zmodyfikować jego wygląd lub konfigurację, wybrać odpowiedni system panelu (Standardowy, Premium lub Premium AI), podać adres dostawy oraz ustalić dogodny termin instalacji. Po zatwierdzeniu zamówienia może śledzić jego status i sprawdzać szczegóły zaplanowanej usługi.

3. Planowane funkcje aplikacji

Aplikacja będzie oferować następujące możliwości:

Przeglądanie i zamawianie toalet – użytkownik będzie mógł przeglądać dostępne modele toalet, zapoznawać się z ich opisami, właściwościami i cenami, a następnie dodać wybrany produkt do zamówienia.
Personalizacja i modyfikowanie toalet – użytkownik będzie mógł dostosować wybrany model do własnych potrzeb, na przykład poprzez zmianę dostępnych elementów wyposażenia, wariantu lub dodatkowych opcji.
Planowanie terminu instalacji – aplikacja umożliwi wybór dogodnego dnia i godziny montażu toalety. System będzie sprawdzał dostępność terminów, aby uniknąć nakładania się kilku instalacji w tym samym czasie.
Planowanie remontu ubikacji – użytkownik będzie mógł określić, czy oprócz montażu toalety potrzebuje również remontu pomieszczenia, a następnie ustalić termin realizacji usługi.
Wybór systemu panelu sterowania – klient będzie mógł wybrać jeden z trzech wariantów:
Standardowy – podstawowe funkcje sterowania.
Premium – rozszerzone możliwości i dodatkowe udogodnienia.
Premium AI – najbardziej zaawansowany wariant z funkcjami wykorzystującymi sztuczną inteligencję.
Zarządzanie zamówieniami – użytkownik będzie mógł przeglądać swoje zamówienia, sprawdzać ich szczegóły, status realizacji oraz zaplanowane terminy.
Edycja i anulowanie zamówień – właściciel zamówienia będzie mógł zmieniać wybrane informacje, modyfikować konfigurację produktu lub anulować zamówienie zgodnie z obowiązującymi zasadami.
Konto użytkownika – aplikacja będzie umożliwiać rejestrację i logowanie, dzięki czemu każdy klient będzie miał dostęp do swoich zamówień i ustawień konta.
4. Technologie i przechowywanie danych

Do stworzenia aplikacji planujemy wykorzystać następujące technologie:

Frontend – interfejs użytkownika
React.js – główna biblioteka JavaScript służąca do budowania interfejsu aplikacji.
HTML5 – struktura poszczególnych stron.
CSS3 – wygląd aplikacji, układ elementów i responsywność.
JavaScript – obsługa interakcji użytkownika oraz logiki po stronie przeglądarki.
Backend – obsługa aplikacji
Node.js – środowisko umożliwiające uruchomienie kodu JavaScript po stronie serwera.
Express.js – framework służący do tworzenia API i obsługi komunikacji między frontendem a bazą danych.
Baza danych

Dane aplikacji będą przechowywane w bazie danych, na przykład mySQL.

Baza będzie zawierać między innymi:

informacje o użytkownikach,
katalog dostępnych toalet,
konfiguracje wybranych produktów,
historię zamówień,
adresy dostawy i instalacji,
terminy montażu oraz remontów.

Za pobieranie, zapisywanie, aktualizowanie i usuwanie danych będzie odpowiadał backend, który będzie komunikował się z bazą danych.

5. Zagrożenia i zabezpieczenia

Podczas tworzenia aplikacji należy uwzględnić możliwe zagrożenia związane z bezpieczeństwem danych oraz nieprawidłowym korzystaniem z systemu.

Zagrożenie	Planowane zabezpieczenie
Masowe zamawianie toalet przez jednego użytkownika.	Wprowadzenie limitów zamówień oraz zabezpieczenia CAPTCHA.
Składanie fałszywych zamówień.	Wymaganie potwierdzenia zamówienia za pomocą wiadomości e-mail.
Podawanie błędnych danych adresowych.	Walidacja adresu i sprawdzanie wymaganych informacji przed zatwierdzeniem zamówienia.
Rezerwowanie kilku terminów instalacji na ten sam czas.	Automatyczne sprawdzanie dostępności terminów przed dokonaniem rezerwacji.
Nieuprawnione modyfikowanie zamówień innych użytkowników.	Wprowadzenie logowania, kontroli uprawnień i sprawdzania właściciela zamówienia.
Próby włamania na konta klientów.	Stosowanie silnych haseł, bezpiecznego logowania i odpowiedniego zabezpieczenia sesji.
Wysyłanie pustych lub nieprawidłowych danych.	Walidacja formularzy zarówno po stronie frontendowej, jak i backendowej.
Nieuprawniona zmiana systemu panelu (Standardowy/Premium/Premium AI).	Możliwość zmiany konfiguracji wyłącznie przez właściciela zamówienia lub administratora.
Próby uzyskania dostępu do danych innych klientów.	Kontrola dostępu do danych po stronie serwera oraz odpowiednie uprawnienia użytkowników.
Przesyłanie niebezpiecznych danych przez formularze.	Sprawdzanie i oczyszczanie danych wejściowych oraz stosowanie bezpiecznych zapytań do bazy danych.

Wszystkie zabezpieczenia mają na celu ochronę danych klientów, zapobieganie nieautoryzowanym działaniom oraz zapewnienie prawidłowego działania aplikacji.

6. Plan pracy

Prace nad projektem zostaną podzielone na kilka etapów, aby ułatwić organizację i kontrolowanie postępów.

Etap 1 – Planowanie i przygotowanie projektu
Opracowanie koncepcji aplikacji.
Określenie najważniejszych funkcji.
Przygotowanie struktury projektu.
Utworzenie repozytorium na GitHubie.
Przygotowanie pliku README.md.
Etap 2 – Projektowanie interfejsu
Przygotowanie wyglądu strony głównej.
Zaprojektowanie katalogu toalet.
Opracowanie widoku szczegółów produktu.
Przygotowanie formularzy zamówień i rezerwacji terminów.
Dostosowanie wyglądu do komputerów i urządzeń mobilnych.
Etap 3 – Tworzenie funkcjonalności
Implementacja przeglądania i zamawiania toalet.
Dodanie możliwości modyfikowania produktów.
Implementacja wyboru systemu panelu sterowania.
Dodanie rezerwacji terminów instalacji i remontów.
Przygotowanie systemu kont użytkowników.
Etap 4 – Backend i baza danych
Przygotowanie serwera aplikacji.
Utworzenie struktury bazy danych.
Implementacja zapisywania i odczytywania zamówień.
Połączenie frontendu z backendem.
Dodanie obsługi rezerwacji i zarządzania użytkownikami.
Etap 5 – Testowanie i zabezpieczenia
Sprawdzenie poprawności działania wszystkich funkcji.
Testowanie formularzy i poprawności wprowadzanych danych.
Sprawdzenie systemu logowania i uprawnień.
Testowanie rezerwacji terminów.
Usuwanie wykrytych błędów.
Etap 6 – Zakończenie projektu
Poprawienie wyglądu i wygody użytkowania.
Ostateczne sprawdzenie działania aplikacji.
Uzupełnienie dokumentacji.
Przygotowanie projektu do prezentacji i oddania nauczycielowi.
Podział obowiązków

Wojciech Puzia:

Przygotowanie i rozwój frontendu w React.
Projektowanie wyglądu aplikacji.
Tworzenie katalogu toalet i funkcji ich personalizacji.
Implementacja wyboru systemu panelu sterowania.

Druga osoba / współautor:

Przygotowanie backendu i bazy danych.
Implementacja systemu zamówień i rezerwacji terminów.
Obsługa kont użytkowników i logowania.
Testowanie funkcjonalności oraz zabezpieczeń.

Podział obowiązków może zostać dostosowany w trakcie realizacji projektu, a obie osoby będą wspólnie pracować nad testowaniem i końcowym dopracowaniem aplikacji.

7. Podsumowanie

YappaToilet ma być nowoczesną i wygodną aplikacją internetową, która umożliwi kompleksowe zamawianie toalet, ich personalizację oraz organizację instalacji i remontów. Projekt ma połączyć kilka czynności w jednym systemie, dzięki czemu użytkownicy będą mogli załatwić wszystkie najważniejsze sprawy związane z zakupem i montażem toalety bez konieczności korzystania z wielu różnych usług.

Naszym celem jest stworzenie funkcjonalnej, przejrzystej i bezpiecznej aplikacji, która będzie łatwa w obsłudze i pozwoli użytkownikom zaoszczędzić czas.
