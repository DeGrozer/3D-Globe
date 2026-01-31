let globe = null;

const Tooltip = {
    el: null,
    init() { this.el = document.getElementById('tooltip'); },
    show(text, x, y) {
        this.el.textContent = text;
        this.el.style.left = (x + 15) + 'px';
        this.el.style.top = (y + 15) + 'px';
        this.el.classList.add('visible');
    },
    hide() { this.el.classList.remove('visible'); }
};

const Panel = {
    panel: null,
    countryName: null,
    flagImg: null,
    population: null,
    area: null,
    capital: null,
    region: null,
    currency: null,
    language: null,
    continent: null,
    wikiText: null,
    wikiLink: null,

    init() {
        this.panel = document.getElementById('side-panel');
        this.countryName = document.getElementById('panel-country-name');
        this.flagImg = document.getElementById('panel-flag');
        this.population = document.getElementById('panel-population');
        this.area = document.getElementById('panel-area');
        this.capital = document.getElementById('panel-capital');
        this.region = document.getElementById('panel-region');
        this.currency = document.getElementById('panel-currency');
        this.language = document.getElementById('panel-language');
        this.continent = document.getElementById('panel-continent');
        this.wikiText = document.getElementById('panel-wiki-text');
        this.wikiLink = document.getElementById('panel-wiki-link');

        document.getElementById('panel-close').addEventListener('click', () => this.hide());
    },

    async showCountry(code, name) {
        this.countryName.textContent = name;
        const alpha2 = ISO_NUMERIC_TO_ALPHA2[code] || 'un';
        this.flagImg.src = CONFIG.flagCdn + alpha2 + '.png';
        this.flagImg.alt = name + ' flag';

        this.population.textContent = '...';
        this.area.textContent = '...';
        this.capital.textContent = '...';
        this.region.textContent = COUNTRY_REGIONS[code] || 'Unknown';
        this.currency.textContent = '...';
        this.language.textContent = '...';
        this.continent.textContent = '...';
        this.wikiText.textContent = 'Loading...';
        this.wikiLink.href = 'https://en.wikipedia.org/wiki/' + encodeURIComponent(name);

        this.panel.classList.add('visible');

        const [countryData, wikiData] = await Promise.all([
            fetchCountryData(name),
            fetchWikipedia(name)
        ]);

        if (countryData) {
            this.population.textContent = formatNumber(countryData.population || 0);
            this.area.textContent = formatNumber(countryData.area || 0);
            this.capital.textContent = countryData.capital ? countryData.capital[0] : 'N/A';
            this.region.textContent = countryData.subregion || countryData.region || COUNTRY_REGIONS[code] || 'Unknown';
            this.continent.textContent = countryData.region || 'Unknown';

            if (countryData.currencies) {
                const curr = Object.values(countryData.currencies)[0];
                this.currency.textContent = curr ? curr.name : 'N/A';
            }
            if (countryData.languages) {
                this.language.textContent = Object.values(countryData.languages).slice(0, 2).join(', ');
            }
        }

        if (wikiData && wikiData.extract) {
            this.wikiText.textContent = wikiData.extract.substring(0, 400) + (wikiData.extract.length > 400 ? '...' : '');
        } else {
            this.wikiText.textContent = 'No description available.';
        }
    },

    hide() {
        this.panel.classList.remove('visible');
        if (globe) globe.clearSelection();
    }
};

const AboutModal = {
    overlay: null,
    init() {
        this.overlay = document.getElementById('about-overlay');
        document.getElementById('about-btn').addEventListener('click', () => this.show());
        document.getElementById('about-close').addEventListener('click', () => this.hide());
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.hide();
        });
    },
    show() { this.overlay.classList.add('visible'); },
    hide() { this.overlay.classList.remove('visible'); }
};

document.addEventListener('DOMContentLoaded', () => {
    Tooltip.init();
    Panel.init();
    AboutModal.init();

    const container = document.getElementById('globe-canvas');
    globe = new GlobeRenderer(container);

    document.getElementById('loading').style.display = 'none';
});
