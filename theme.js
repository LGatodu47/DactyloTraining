// objects that assign a color to pretty much everything on the page. (the properties are named after the css variables)
const DEEP_PURPLE_THEME = {
    bg: '171338',
    navbg: '180b21',
    dialogborder: '0c0511',
    navsep: '351849',
    btnborder: '091321',
    btnborder_hovered: 'ffffff',
    btnborder_clicked: '000000',
    btnbg: '142b4c',
    preborder: '000000',
    prebg: '0b091c',
    input: '7fffd4',
    highlight: 'ff7f50',
    p: 'af99fc',
    subtext: 'ba34a6'
}
const GRAY_THEME = {
    bg: '878787',
    navbg: '2e363d',
    dialogborder: '070707',
    navsep: 'e8e8e8',
    btnborder: '1c1c1c',
    btnborder_hovered: 'ffffff',
    btnborder_clicked: '000000',
    btnbg: '5b5b5b',
    preborder: '000000',
    prebg: '0f0e0c',
    input: '79abf7',
    highlight: 'fc4141',
    p: '050707',
    subtext: '8e0002'
}
const GREEN_THEME = {
    bg: '209343',
    navbg: '346827',
    dialogborder: '0c1f08',
    navsep: '73dd58',
    btnborder: '0c1f08',
    btnborder_hovered: 'ffffff',
    btnborder_clicked: '000000',
    btnbg: '72840b',
    preborder: '000000',
    prebg: '1c1009',
    input: 'c8fc3a',
    highlight: 'f218a9',
    p: 'ee9b0c',
    subtext: '0abaf0'
}

let selected = DEEP_PURPLE_THEME
let css = document.documentElement.style

/**
 * Switches the page theme by replacing the color values of the css variables with the values specified in the given object.
 * @param {Object} theme The theme to load (see above).
 */
function setTheme(theme) {
    if(theme === selected) {
        return
    }
    selected = theme
    for(let el in theme) {
        css.setProperty('--clr-' + el.replace('_', '-'), '#' + theme[el])
    }
}