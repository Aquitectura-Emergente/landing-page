/**
 * i18n sin frameworks: un JSON por idioma en /i18n y atributos en el HTML.
 *
 *   data-i18n="clave"            reemplaza el texto. Si el elemento tiene
 *                                hijos (un icono, un <span> con un numero),
 *                                solo cambia el ultimo nodo de texto y los
 *                                hijos se conservan.
 *   data-i18n-html="clave"       reemplaza el HTML interno. Solo para textos
 *                                de los JSON del repo, nunca para datos del
 *                                usuario.
 *   data-i18n-attr="attr:clave;attr2:clave2"
 *                                traduce atributos (placeholder, aria-label,
 *                                title, alt, content, value).
 *
 * El HTML trae el texto en ingles, que es el idioma por defecto: si el JSON
 * no carga, la pagina se sigue viendo completa. La eleccion se guarda en
 * localStorage, y al cambiar de idioma se emite `i18n:change` en document
 * para que cada pagina vuelva a pintar sus textos generados por JS.
 */
(function () {
    const LANGS = { en: 'en-US', es: 'es-419' };
    const DEFAULT_LANG = 'en';
    const STORAGE_KEY = 'emsafe-lang';
    const baseUrl = new URL('../i18n/', document.currentScript.src);

    let dictionary = {};

    function readStoredLang() {
        try {
            return localStorage.getItem(STORAGE_KEY);
        } catch (error) {
            return null;
        }
    }

    function storeLang(lang) {
        try {
            localStorage.setItem(STORAGE_KEY, lang);
        } catch (error) {
            // Sin almacenamiento (modo privado, cookies bloqueadas): el idioma
            // vale solo para esta visita.
        }
    }

    function lookup(key) {
        return key.split('.').reduce((node, part) => (node == null ? undefined : node[part]), dictionary);
    }

    function t(key, vars) {
        const value = lookup(key);
        if (typeof value !== 'string') return key;
        if (!vars) return value;
        return value.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? vars[name] : match));
    }

    function setElementText(element, text) {
        if (element.children.length === 0) {
            element.textContent = text;
            return;
        }
        const textNodes = Array.from(element.childNodes)
            .filter(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== '');
        const target = textNodes[textNodes.length - 1];
        if (target) {
            target.textContent = ` ${text} `;
        } else {
            element.append(text);
        }
    }

    function apply(root) {
        root.querySelectorAll('[data-i18n]').forEach(element => {
            const value = lookup(element.dataset.i18n);
            if (typeof value === 'string') setElementText(element, value);
        });

        root.querySelectorAll('[data-i18n-html]').forEach(element => {
            const value = lookup(element.dataset.i18nHtml);
            if (typeof value === 'string') element.innerHTML = value;
        });

        root.querySelectorAll('[data-i18n-attr]').forEach(element => {
            element.dataset.i18nAttr.split(';').forEach(pair => {
                const [attribute, key] = pair.split(':').map(part => part.trim());
                const value = lookup(key);
                if (attribute && typeof value === 'string') element.setAttribute(attribute, value);
            });
        });
    }

    function updateSwitches(lang) {
        document.querySelectorAll('[data-lang]').forEach(button => {
            button.setAttribute('aria-pressed', String(button.dataset.lang === lang));
        });
    }

    async function setLang(requested) {
        const lang = Object.prototype.hasOwnProperty.call(LANGS, requested) ? requested : DEFAULT_LANG;
        try {
            const response = await fetch(new URL(`${lang}.json`, baseUrl));
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            dictionary = await response.json();
        } catch (error) {
            console.error(`[i18n] No se pudo cargar el idioma "${lang}":`, error);
            return;
        }

        api.lang = lang;
        api.loaded = true;
        document.documentElement.lang = LANGS[lang];
        apply(document);
        updateSwitches(lang);
        storeLang(lang);
        document.dispatchEvent(new CustomEvent('i18n:change', { detail: { lang } }));
    }

    const api = { t, setLang, lang: DEFAULT_LANG, loaded: false };
    window.i18n = api;

    document.querySelectorAll('[data-lang]').forEach(button => {
        button.addEventListener('click', () => {
            if (button.dataset.lang !== api.lang || !api.loaded) setLang(button.dataset.lang);
        });
    });

    api.ready = setLang(readStoredLang() || DEFAULT_LANG);
})();
