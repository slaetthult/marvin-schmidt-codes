/**
 * Lazy-load a module when the browser is idle,
 * optionally only when matching elements are visible in the viewport.
 *
 * You can pass either:
 *  - importer: () => import('./path.js')   ✅ best for Vite (static literal)
 *  - moduleSpecifier: './path.js'          ⚠️ use only if it's a static string
 *
 * @param {string|(() => Promise<any>)} importerOrSpecifier
 * @param {Object} [options]
 * @param {boolean} [options.visible=true]
 * @param {string}  [options.selector]
 * @param {(mod:any)=>void} [options.onLoad]
 * @param {number}  [options.timeout=2000]
 * @param {number|number[]} [options.threshold=0.1]
 * @param {string}  [options.rootMargin='0px 0px -10% 0px']
 * @param {boolean} [options.once=true]
 */
export const lazyLoadWhenIdle = (importerOrSpecifier, options = {}) => {
    const {
        visible = true,
        selector,
        onLoad,
        timeout = 2000,
        threshold = 0.1,
        rootMargin = '0px 0px 0px 0px',
        once = true,
    } = options;

    const doImport =
        typeof importerOrSpecifier === 'function'
            ? importerOrSpecifier
            : () => import(/* @vite-ignore */ importerOrSpecifier); // ignored if you pass a function

    // no visibility gating requested or no selector -> idle import right away
    if (!visible || !selector) {
        return idleImport(doImport, timeout).then((mod) => {
            if (typeof onLoad === 'function') onLoad(mod);
            return mod;
        });
    }

    const els = document.querySelectorAll(selector);
    if (els.length === 0) return; // nothing to observe

    let loaded = false;
    const load = () => {
        if (loaded) return;
        loaded = true;
        return idleImport(doImport, timeout)
        .then((mod) => {
            if (typeof onLoad === 'function') onLoad(mod);
            return mod;
        })
        .catch((err) => console.error('Lazy import failed:', err));
    };

    if (!('IntersectionObserver' in window)) return load();

    const io = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) {
            const res = load();
            if (once) io.disconnect();
            return res;
        }
    }, { root: null, rootMargin, threshold });

    els.forEach((el) => io.observe(el));
}

/** import() when idle (with fallback) */
function idleImport(doImport, timeout) {
    if ('requestIdleCallback' in window) {
        return new Promise((resolve, reject) => {
            requestIdleCallback(() => {
                doImport().then(resolve).catch(reject);
            }, { timeout });
        });
    }
    return new Promise((r) => setTimeout(r, timeout)).then(doImport);
}
