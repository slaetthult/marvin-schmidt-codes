export const services = {
    vars: {
        queries: {
            component:          '*[data-services]',
            tile:               '*[data-services-tile]'
        },
        attributes: {
            tileId:             'data-services-tile-id'
        },
        classes: {
            activeTile:         'active'
        }
    },
    init(){
        this.initTiles();
    },
    initTiles(){
        const component = document.querySelector(this.vars.queries.component);
        if (!component) return;

        const tiles = document.querySelectorAll(this.vars.queries.tile);

        tiles.forEach(tile => {
            tile.addEventListener('click', () => {
                const slideIndex = tile.getAttribute(this.vars.attributes.tileId);

                if (slideIndex !== null) {
                    // Hole die existierende Swiper-Instanz
                    const swiperElement = component.querySelector('.swiper');
                    if (swiperElement && swiperElement.swiper) {
                        // Springe zur Slide (0-basierter Index)
                        swiperElement.swiper.slideTo(parseInt(slideIndex, 10));
                    }
                }
            });
        });

        // Event-Listener für Swiper Slide-Änderungen
        const swiperElement = component.querySelector('.swiper');
        if (swiperElement && swiperElement.swiper) {
            swiperElement.swiper.on('slideChange', () => {
                const activeIndex = swiperElement.swiper.activeIndex;
                const tileId = activeIndex + 1; // 1-basierte ID

                // Entferne aktive Klasse von allen Kacheln
                tiles.forEach(tile => {
                    tile.classList.remove(this.vars.classes.activeTile);
                });

                // Füge aktive Klasse zur entsprechenden Kachel hinzu
                const activeTile = document.querySelector(
                    `${this.vars.queries.tile}[${this.vars.attributes.tileId}="${tileId}"]`
                );
                if (activeTile) {
                    activeTile.classList.add(this.vars.classes.activeTile);
                }
            });

            // Setze initiale aktive Kachel
            const initialIndex = swiperElement.swiper.activeIndex;
            const initialTileId = initialIndex + 1;
            const initialTile = document.querySelector(
                `${this.vars.queries.tile}[${this.vars.attributes.tileId}="${initialTileId}"]`
            );
            if (initialTile) {
                initialTile.classList.add(this.vars.classes.activeTile);
            }
        }
    }
}
