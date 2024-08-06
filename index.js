/**
 * 
 * @param {string} selector 
 * @returns {Element}
 */
function _(selector) {
    return document.querySelector(selector);
}

/**
 * 
 * @param {string} selector 
 * @returns {Element[]}
 */
function __(selector) {
    return document.querySelectorAll(selector);
}

_("#clicker").addEventListener("click", function() {
    _("#header").innerText = "clicked but with get fn"
});