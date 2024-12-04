/**
 * An array constant with an ordered list of the 12 months. 
 */
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

const DATE = new Date();

//#region SELECTORS
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
//#endregion SELECTORS

//#region DATE FUNCTIONS
/**
 * Returns either the current year.
 * 
 * @param {string} type
 * @returns {string}
 */
function getCurrentYear() {
    return new Date().getFullYear();
}

/**
 * Returns either the number, full name, or shortened name of the current month.
 * 
 * @param {string} type
 * @returns {string}
 */
function getCurrentMonth() {
    return new Date().toLocaleDateString("default", { month: 'long' }); 
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

function getFirstDayOfMonth(year, month) {
    return new Date(year, month, 1).toLocaleDateString("en", { weekday: 'long' }); 
}
//#endregion DATE FUNCTIONS

//#region HELPER FUNCTIONS
function removeAlphaChars(elementId) {
    _(elementId).value = _(elementId).value.replace(/\D/g,'');
}
//#endregion HELPER FUNCTIONS

//#region INITIALIZATION FUNCTIONS
function init() {
    _("#year").defaultValue = "2024";
}
//#endregion INITIALIZATION FUNCTIONS

//#region EVENT LISTENERS
_("#start").addEventListener("click", function() {
    let year = getCurrentYear();
    let month = getCurrentMonth();

    //Get first day of month
    let dates = new Array(35);
    let cells = __("td > span");

    cells.forEach(cell => {
        console.log(cell.innerText);
    });
});

_("#month").addEventListener("change", function(e) { 
    let yearNumber = DATE.getFullYear();
    let monthNumber = this.value;
    let monthName = this.options[this.selectedIndex].text;
    console.log("There are " + getMonthDays(2024, monthNumber, 0) + " days in " + monthName + " of " + yearNumber);
});

_("#year").addEventListener("keyup", function(e) {
    removeAlphaChars("#year");
});

_("#year").addEventListener("keydown", function(e) {
    if (isNaN(e.key)) {
        removeAlphaChars("#year");
    }
});
//#endregion EVENT LISTENERS