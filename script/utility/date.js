/**
 * Returns the current year.
 * @returns {string}
 */
function getCurrentYear() {
    return new Date().getFullYear();
}

/**
 * Returns either the year input into the Year textbox.
 * @param {string} type
 * @returns {number}
 */
function getYear(type) {
    if (type === SOURCETYPES.Selected) {
        return parseInt(_("#year").value);
    }
    return new Date().getFullYear();
}

/**
 * Returns either the number, full name, or shortened name of the current month.
 * @param {string} type
 * @returns {string}
 */
function getMonthIndex(type) {
    if (type === SOURCETYPES.Current) {
        return new Date().getMonth();
    } else if (type === SOURCETYPES.Selected) {
        
    }
    return -1;
    return new Date().toLocaleDateString("default", { month: 'long' }); 
}

/**
 * Returns either the full name or shortened name of the current month or the month selected.
 * @param {string} type
 * @param {string} format
 * @returns {string}
 */
function getMonthName(type, format) {
    let month = "";
    if (type === SOURCETYPES.Current) {
        month = new Date().toLocaleDateString("default", { month: 'long' });
    } else if (type === SOURCETYPES.Selected) {
        month = _("#month").options[_("#month").selectedIndex].text;
    }

    if (format === FORMATS.Abbreviation) {
        return month.substring(0, 3);
    }
    return month;
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

/**
 * 
 * @param {number} year 
 * @param {number} month 
 * @returns 
 */
function getFirstDayOfMonth(year, month) {
    return new Date(year, month, 1).toLocaleDateString("default", { weekday: 'long' }); 
}