export const typingEffect = {
    vars: {
        queries: {
            element: '*[data-typing-effect]'
        },
        minDelay: 10,
        maxDelay: 250
    },

    init() {
        const elements = document.querySelectorAll(this.vars.queries.element);
        elements.forEach(element => this.startTypingEffect(element));
    },

    find(){
        const $elements = document.querySelectorAll(this.vars.queries.element);
        $elements.forEach($element => this.startTypingEffect($element));
    },

    startTypingEffect($element) {
        const text = $element.textContent;
        $element.textContent = '';
        let currentChar = 0;

        const type = () => {
            if (currentChar < text.length) {
                $element.textContent += text[currentChar];
                currentChar++;
                const randomDelay = Math.floor(Math.random() * (this.vars.maxDelay - this.vars.minDelay + 1)) + this.vars.minDelay;
                setTimeout(type, randomDelay);
            }
        };

        setTimeout(type, 200);
    }
};