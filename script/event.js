_("#start").addEventListener("click", function() {
    let year = _("#year").value;
    let month = _("#month").value;
    let firstDay = getFirstDayOfMonth(year, month);
    let firstDayIndex = DAYS.indexOf(firstDay);

    let dates = new Array(35);
    console.log(year)
    console.log(month)
    console.log(firstDay)
    console.log(firstDayIndex)
    let cells = __("td > span");

    console.log(dates.length);
    console.log(cells.length);
/*
    for (let i = 0; i < dates.length; i++) {
        dates.push(i + 1)
    }

    for (let i = 0; i < cells.length; i++) {
        cells[i].innerText = dates[i]
        console.log(cell.innerText);
    }*/
});

_("#month").addEventListener("change", function(e) { 
    let yearNumber = _("#year").value;
    let monthNumber = this.value;
    let monthName = this.options[this.selectedIndex].text;
    console.log("There are " + getMonthDays(yearNumber, monthNumber, 0) + " days in " + monthName + " of " + yearNumber);
});

_("#year").addEventListener("keyup", function(e) {
    removeAlphaChars("#year");
});

_("#year").addEventListener("keydown", function(e) {
    if (isNaN(e.key)) {
        removeAlphaChars("#year");
    }
});