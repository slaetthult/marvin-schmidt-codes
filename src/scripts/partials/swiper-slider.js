import Swiper from 'swiper';
import { Navigation, Pagination, Autoplay, Scrollbar } from 'swiper/modules';
export const swiperSlider = {

    vars: {

        swiperQuery:                '*[data-swiper]',

        settingsAttribute:          'data-swiper-settings',

        paginationRenderFraction:   (currentClass, totalClass) => {
            return `
                <span class="${currentClass}"></span> / <span class="${totalClass}"></span>
            `;
        },
        formatFractionCurrent:  (number) => {
            return number < 10 ? '0' + number : number;
        },
        formatFractionTotal: (number) => {
            return number < 10 ? '0' + number : number;
        }

    },

    init(){
        swiperSlider.find();
    },

    find(){

        const $swipers = document.querySelectorAll(swiperSlider.vars.swiperQuery);

        if($swipers.length === 0){
            return false;
        }

        for(const $swiper of $swipers){

            swiperSlider.bind($swiper);

        }

    },

    bind($swiper, customOptions){

        let additionalOptions = $swiper.getAttribute(swiperSlider.vars.settingsAttribute);
        additionalOptions = additionalOptions && additionalOptions.length > 0 ? JSON.parse(additionalOptions) : null;

        if(additionalOptions?.pagination?.type === 'fraction'){
            additionalOptions.pagination.renderFraction = swiperSlider.vars.paginationRenderFraction;
            additionalOptions.pagination.formatFractionCurrent = swiperSlider.vars.formatFractionCurrent;
            additionalOptions.pagination.formatFractionTotal = swiperSlider.vars.formatFractionTotal;
        }

        const options = {
            modules: [Navigation, Pagination, Autoplay, Scrollbar],
            pagination: {
                el: '.swiper-pagination',
                clickable: true
            },
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
            },
            scrollbar: {
                el: '.swiper-scrollbar',
                enabled: true,
                draggable: true
            },
            ...additionalOptions,
            ...customOptions
        };

        const swiperInstance = new Swiper($swiper, options);

    }

}