const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DATE = new Date();

const HEADER_TEXT_REGEX = '(?<=```javascript\n)[^`]*(?=```)';
const TEXT_AFTER_HEADER_REGEX = '(?<=```[ \t]*\r?\n)([\s\S]*)';

const SOURCETYPES = {Current: "current", Selected: "selected"};
const FORMATS = {FullName: "fullname", Abbreviation: "abbreviation"};

//#region HELPER FUNCTIONS
function removeAlphaChars(elementId) {
    console.log(_(elementId).value)
    //_(elementId).value = _(elementId).value.replace(/\D/g,'');
}
//#endregion HELPER FUNCTIONS

//#region INITIALIZATION FUNCTIONS
function init() {
    _("#year").defaultValue = "2024";
    _("body > main > details > summary").innerText = "January 2024"

    fetch("test.md")
    .then(response => response.text())
    .then(data => {
        //console.log(data);
        //_("#text").innerText = data;
        var regexr = new RegExp(HEADER_TEXT_REGEX);
        var result = regexr.exec(data);
        var settings = JSON.parse(result);
        console.log(settings.title);
        console.log(settings.authors[0]);
        var regexr2 = new RegExp("(# )(.*?)(\n)");
        var result2 = regexr2.exec(data);
        console.log(result2);
        console.log(result2[2]);
        var newChld = document.createElement("h1");
        newChld.innerText = result2[2];
        var hr = document.createElement("hr");
        newChld.appendChild(hr);
        //_("#text").appendChild(newChld);
        _("#text").innerHTML = "<h1>" + result2[2] + "</h1>";
    });
}
//#endregion INITIALIZATION FUNCTIONS
