/* ==========================================================================
   SOUNDWAVE — поиск музыки по нескольким источникам

   Архитектура:
   - Каждый источник (SoundCloud / Spotify / YouTube Music) — отдельный
     "адаптер": асинхронная функция, которая принимает запрос и возвращает
     массив треков в едином формате { id, title, artist, cover, url, source }.
   - Сейчас адаптеры возвращают моковые данные (см. блок MOCK ADAPTERS ниже).
   - Когда появится бэкенд-прокси к реальным API — нужно заменить ТОЛЬКО
     тело этих функций на fetch() к своему серверу. Остальной код
     (переключение табов, рендер карточек, состояния загрузки/ошибки)
     трогать не придётся.
   ========================================================================== */

/* ============ КОНФИГ ИСТОЧНИКОВ ============ */

const SOURCES = {
    soundcloud: { label: "SoundCloud", badge: "SC" },
    spotify: { label: "Spotify", badge: "SP" },
    youtube: { label: "YouTube Music", badge: "YT" },
};

/* ============ DOM ============ */

const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");
const sourceTabs = document.getElementById("sourceTabs");
const retryButton = document.getElementById("retryButton");

const emptyState = document.getElementById("emptyState");
const loadingState = document.getElementById("loadingState");
const errorState = document.getElementById("errorState");
const noResultsState = document.getElementById("noResultsState");
const resultsState = document.getElementById("resultsState");

const loadingGrid = document.getElementById("loadingGrid");
const resultsGrid = document.getElementById("resultsGrid");
const errorMessage = document.getElementById("errorMessage");
const noResultsSource = document.getElementById("noResultsSource");

/* ============ СОСТОЯНИЕ ПРИЛОЖЕНИЯ ============ */

let currentSource = "soundcloud";
let currentQuery = "";
let requestToken = 0; // защита от гонки запросов при быстром переключении табов

/* ==========================================================================
   MOCK ADAPTERS
   Замени тело каждой функции на реальный запрос к своему бэкенду, например:

   async function searchSoundCloud(query) {
       const res = await fetch(`/api/soundcloud/search?q=${encodeURIComponent(query)}`);
       if (!res.ok) throw new Error("SoundCloud request failed");
       return (await res.json()).map(mapTrack);
   }
   ========================================================================== */

function mockCover(seed) {
    return `https://picsum.photos/seed/${encodeURIComponent(seed)}/300/300`;
}

function makeMockTracks(query, source, count) {
    const artistsBySource = {
        soundcloud: ["Nightwave", "Ashen Fields", "Coral Drift", "Low Static", "Paper Moth"],
        spotify: ["Velvet Echo", "Glass Horizon", "Kite & Kin", "Dusty Radio", "Halcyon Row"],
        youtube: ["Neon Parade", "Slow Orbit", "The Quiet West", "Amber Line", "Stillhouse"],
    };

    const artists = artistsBySource[source];

    return Array.from({ length: count }, (_, i) => ({
        id: `${source}-${query}-${i}`,
        title: `${query} ${["", "(Reprise)", "Pt. II", "— Live", "(Demo)"][i % 5]}`.trim(),
        artist: artists[i % artists.length],
        cover: mockCover(`${source}-${query}-${i}`),
        url: "#",
        source,
    }));
}

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function searchSoundCloud(query) {
    await delay(500 + Math.random() * 300);
    if (query.trim().toLowerCase() === "empty") return [];
    return makeMockTracks(query, "soundcloud", 8);
}

async function searchSpotify(query) {
    await delay(500 + Math.random() * 300);
    if (query.trim().toLowerCase() === "empty") return [];
    return makeMockTracks(query, "spotify", 8);
}

async function searchYoutubeMusic(query) {
    await delay(500 + Math.random() * 300);
    if (query.trim().toLowerCase() === "empty") return [];
    return makeMockTracks(query, "youtube", 8);
}

const adapters = {
    soundcloud: searchSoundCloud,
    spotify: searchSpotify,
    youtube: searchYoutubeMusic,
};

/* ============ РЕНДЕР СОСТОЯНИЙ ============ */

function hideAllStates() {
    emptyState.hidden = true;
    loadingState.hidden = true;
    errorState.hidden = true;
    noResultsState.hidden = true;
    resultsState.hidden = true;
}

function showEmpty() {
    hideAllStates();
    emptyState.hidden = false;
}

function showLoading() {
    hideAllStates();
    loadingGrid.innerHTML = Array.from({ length: 8 }, renderSkeletonCard).join("");
    loadingState.hidden = false;
}

function showError(message) {
    hideAllStates();
    errorMessage.textContent = message || "Couldn't reach this source. Try again.";
    errorState.hidden = false;
}

function showNoResults(sourceKey) {
    hideAllStates();
    noResultsSource.textContent = SOURCES[sourceKey].label;
    noResultsState.hidden = false;
}

function showResults(tracks) {
    hideAllStates();
    resultsGrid.innerHTML = tracks.map(renderTrackCard).join("");
    resultsState.hidden = false;

    resultsGrid.querySelectorAll(".track-card").forEach((card, i) => {
        card.addEventListener("click", () => openTrack(tracks[i]));
    });
}

function renderSkeletonCard() {
    return `
        <div class="track-card">
            <div class="skeleton-cover"></div>
            <div class="skeleton-line title"></div>
            <div class="skeleton-line artist"></div>
        </div>
    `;
}

function renderTrackCard(track) {
    const badge = SOURCES[track.source].badge;

    return `
        <div class="track-card" role="button" tabindex="0">
            <div class="track-cover">
                <img src="${track.cover}" alt="${escapeHtml(track.title)} cover" loading="lazy">
                <span class="track-source-badge">${badge}</span>
                <div class="track-play">
                    <svg viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="11" fill="rgba(255,255,255,0.15)" stroke="white" stroke-width="1.4"/>
                        <path d="M10 8.5L16 12L10 15.5V8.5Z" fill="white"/>
                    </svg>
                </div>
            </div>
            <div class="track-title">${escapeHtml(track.title)}</div>
            <div class="track-artist">${escapeHtml(track.artist)}</div>
        </div>
    `;
}

function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}

function openTrack(track) {
    // Пока источники — моки, ссылки ведут в никуда.
    // Когда подключишь реальные API, здесь можно открывать track.url
    // или запускать встроенный плеер.
    console.log("Open track:", track);
}

/* ============ ПОИСК ============ */

async function runSearch() {
    const query = searchInput.value.trim();

    if (!query) {
        searchInput.focus();
        return;
    }

    currentQuery = query;
    const token = ++requestToken;

    showLoading();
    searchButton.disabled = true;

    try {
        const tracks = await adapters[currentSource](query);

        if (token !== requestToken) return; // пришёл ответ на устаревший запрос

        if (tracks.length === 0) {
            showNoResults(currentSource);
        } else {
            showResults(tracks);
        }
    } catch (err) {
        if (token !== requestToken) return;

        console.error(`${SOURCES[currentSource].label} search failed:`, err);
        showError(`Couldn't reach ${SOURCES[currentSource].label}. Try again.`);
    } finally {
        if (token === requestToken) {
            searchButton.disabled = false;
        }
    }
}

/* ============ ПЕРЕКЛЮЧЕНИЕ ИСТОЧНИКОВ ============ */

function setActiveTab(sourceKey) {
    sourceTabs.querySelectorAll(".source-tab").forEach((tab) => {
        const isActive = tab.dataset.source === sourceKey;
        tab.classList.toggle("active", isActive);
        tab.setAttribute("aria-selected", String(isActive));
    });
}

sourceTabs.addEventListener("click", (event) => {
    const tab = event.target.closest(".source-tab");
    if (!tab || tab.dataset.source === currentSource) return;

    currentSource = tab.dataset.source;
    setActiveTab(currentSource);

    if (currentQuery) {
        runSearch();
    }
});

/* ============ СОБЫТИЯ ПОИСКА ============ */

searchButton.addEventListener("click", runSearch);

searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        runSearch();
    }
});

retryButton.addEventListener("click", runSearch);