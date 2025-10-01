export function isAtTopOfViewport(el, offset = 0) {
    if (!el) return false;

    const rect = el.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;

    return (
        rect.top <= offset &&
        rect.bottom >= 0 &&
        rect.top < windowHeight
    );
}