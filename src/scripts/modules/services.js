export const services = {
    vars: {
        queries: {
            component:      '*[data-services]',
            tile:           '*[data-services-tile]'
        },
        attributes: {
            tileId:         'data-services-tile-id'
        },
        classes: {
            activeTile:     'active'
        }
    },

    // Cached DOM references
    _cache: {
        component: null,
        swiperElement: null,
        tiles: null
    },

    /**
     * Initializes the services component
     */
    init() {
        // Wait for DOM readiness and Swiper initialization
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this._initialize());
        } else {
            this._initialize();
        }
    },

    /**
     * Internal initialization method with Swiper readiness check
     * @private
     */
    _initialize() {
        // Cache DOM elements
        if (!this._cacheDOMElements()) {
            console.warn('Services: Component not found');
            return;
        }

        // Wait for Swiper initialization
        this._waitForSwiper(() => {
            this._initTileClickHandlers();
            this._initSwiperSync();
        });
    },

    /**
     * Waits for Swiper initialization
     * @private
     */
    _waitForSwiper(callback) {
        const checkSwiper = () => {
            if (this._cache.swiperElement?.swiper) {
                callback();
            } else {
                setTimeout(checkSwiper, 100);
            }
        };
        checkSwiper();
    },

    /**
     * Caches DOM elements for better performance
     * @private
     * @returns {boolean} true if component was found
     */
    _cacheDOMElements() {
        this._cache.component = document.querySelector(this.vars.queries.component);
        if (!this._cache.component) return false;

        this._cache.swiperElement = this._cache.component.querySelector('.swiper');
        this._cache.tiles = document.querySelectorAll(this.vars.queries.tile);

        return true;
    },

    /**
     * Gets the Swiper instance
     * @private
     * @returns {Object|null}
     */
    _getSwiperInstance() {
        return this._cache.swiperElement?.swiper || null;
    },

    /**
     * Initializes click handlers for the tiles
     * @private
     */
    _initTileClickHandlers() {
        const swiper = this._getSwiperInstance();
        if (!swiper) return;

        this._cache.tiles.forEach(tile => {
            tile.addEventListener('click', (event) => {
                event.preventDefault();
                this._handleTileClick(tile);
            });
        });
    },

    /**
     * Handles click on a tile
     * @private
     * @param {HTMLElement} tile
     */
    _handleTileClick(tile) {
        const tileId = tile.getAttribute(this.vars.attributes.tileId);
        if (!tileId) return;

        const slideIndex = parseInt(tileId, 10) - 1;
        if (isNaN(slideIndex) || slideIndex < 0) return;

        const swiper = this._getSwiperInstance();
        if (swiper) {
            swiper.slideTo(slideIndex);
        }
    },

    /**
     * Synchronizes Swiper with the tiles
     * @private
     */
    _initSwiperSync() {
        const swiper = this._getSwiperInstance();
        if (!swiper) return;

        // Register slide change event
        swiper.on('slideChange', () => {
            this._updateActiveTile(swiper.activeIndex);
        });

        // Set initial active tile
        this._updateActiveTile(swiper.activeIndex);
    },

    /**
     * Updates the active tile based on the slide index
     * @private
     * @param {number} slideIndex - 0-based slide index
     */
    _updateActiveTile(slideIndex) {
        const tileId = slideIndex + 1;

        // Remove active class from all tiles
        this._cache.tiles.forEach(tile => {
            tile.classList.remove(this.vars.classes.activeTile);
        });

        // Add active class to the corresponding tile
        const activeTile = this._getTileById(tileId);
        if (activeTile) {
            activeTile.classList.add(this.vars.classes.activeTile);
        }
    },

    /**
     * Finds a tile by its ID
     * @private
     * @param {number} tileId - 1-based tile ID
     * @returns {HTMLElement|null}
     */
    _getTileById(tileId) {
        return document.querySelector(
            `${this.vars.queries.tile}[${this.vars.attributes.tileId}="${tileId}"]`
        );
    },

    /**
     * Cleans up event listeners (for cleanup)
     */
    destroy() {
        const swiper = this._getSwiperInstance();
        if (swiper) {
            swiper.off('slideChange');
        }

        // Clear cache
        this._cache = {
            component: null,
            swiperElement: null,
            tiles: null
        };
    }
}