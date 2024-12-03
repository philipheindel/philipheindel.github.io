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
function getMonthDays(year, month) {
    return new Date(year, month, 0).getDate();
}

_("#start").addEventListener("click", function() {
    getCurrentMonth();
    //_("#header").innerText = "clicked but with get fn"
});

_("#month").addEventListener("change", function(e) { 
    let yearNumber = DATE.getFullYear();
    let monthNumber = this.value;
    let monthName = this.options[this.selectedIndex].text;
    console.log("There are " + getMonthDays(2024, monthNumber, 0) + " days in " + monthName + " of " + yearNumber);
});

_("#year").addEventListener("keypress", function(e) {
    console.log("key pressed on " + this.value)
});