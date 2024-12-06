const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thrusday", "Friday", "Saturday"];
const DATE = new Date();

//#region SELECTORS
/**
 * Returns a single element from the provided CSS selector query.
 * @param {string} selector A CSS selector to be passed to the querySelector function.
 * @returns {Element} A single element based on the provided CSS selector.
 */
function _(selector) {
    return document.querySelector(selector);
}

/**
 * Returns an array of elements from the provided CSS selector query.
 * @param {string} selector A CSS selector to be passed to the querySelectorAll function.
 * @returns {Element[]} An array of elements based on the provided CSS selector.
 */
function __(selector) {
    return document.querySelectorAll(selector);
}

/**
 * Returns a single element with the specified ID.
 * @param {string} elementId The ID of the element to get.
 * @returns {Element} A single element based on the provided ID.
 */
function id(elementId) {
    return document.getElementById(elementId);
}
//#endregion SELECTORS

//#region DATE FUNCTIONS
/**
 * Returns the current year.
 * 
 * @returns {string}
 */
function getCurrentYear() {
    return new Date().getFullYear();
}

/**
 * Returns either the year input into the Year textbox.
 * 
 * @returns {string}
 */
function getYear() {
    return id("year").value;
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
 * Returns either the number, full name, or shortened name of the current month.
 * @returns {string}
 */
function getMonth() {
    return id("month").options[id("month").selectedIndex].text
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
    return new Date(year, month, 1).toLocaleDateString("default", { weekday: 'long' }); 
}
//#endregion DATE FUNCTIONS

//#region HELPER FUNCTIONS
function removeAlphaChars(elementId) {
    _(elementId).value = _(elementId).value.replace(/\D/g,'');
}
//#endregion HELPER FUNCTIONS

//#region INITIALIZATION FUNCTIONS
function init() {
    id("year").defaultValue = "2024";
}
//#endregion INITIALIZATION FUNCTIONS

//#region EVENT LISTENERS
id("start").addEventListener("click", function() {
    let year = getYear();
    let month = getMonth();
    let firstDay = getFirstDayOfMonth(year, month);
    let firstDayIndex = DAYS.findIndex((element) => (element == firstDay));

    let dates = new Array(35);
    console.log(year)
    console.log(month)
    console.log(firstDay)
    console.log(firstDayIndex)
    let cells = __("td > span");

    

    cells.forEach(cell => {
        console.log(cell.innerText);
    });
});

id("month").addEventListener("change", function(e) { 
    let yearNumber = id("year").value;
    let monthNumber = this.value;
    let monthName = this.options[this.selectedIndex].text;
    console.log("There are " + getMonthDays(yearNumber, monthNumber, 0) + " days in " + monthName + " of " + yearNumber);
});

id("year").addEventListener("keyup", function(e) {
    removeAlphaChars("#year");
});

id("year").addEventListener("keydown", function(e) {
    if (isNaN(e.key)) {
        removeAlphaChars("#year");
    }
});
//#endregion EVENT LISTENERS