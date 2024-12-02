/**
 * An array constant with an ordered list of the 12 months. 
 */
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

const DATE = new Date();

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

/**
 * Returns either the number, full name, or shortened name of the current month.
 * 
 * @param {string} type
 * @returns {string}
 */
function getCurrentMonth() {
    const d = new Date();
    console.log(MONTHS[d.getMonth()]);
}

/**
 * Returns an array 
 * 
 * @param {string} month 
 * @returns {number}
 */
function getMonthDays(month) {
    
}

_("#start").addEventListener("click", function() {
    getCurrentMonth();
    //_("#header").innerText = "clicked but with get fn"
});
var val = 0
_("#month").addEventListener("change", function() {
    console.log("changed " + val + " times");
    val += 1;
});