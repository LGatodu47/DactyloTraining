const ERROR_COOLDOWN_TIME = 300

let loadedText = ''
let errors = 0
let time = 0 // in deciseconds
let timer = null // this field should only have a value when a session is ongoing
let skipErrors = false // the boolean controlling for perfect mode (enabled by default)
let playingSounds = true
let textField = document.getElementById('input')
let overlay = document.getElementById('overlay')
let currentDialog = null
let errorsOnCooldown = false

loadWord("hello world", 10)

/**
 * Loads the given text and resets the session.
 * @param {String} text The formatted text to load, or the error message if {@link errored} is set to true.
 * @param {boolean} errored If there is an error when trying to load from a specific format.
 */
function load(text, errored = false) {
    textField.scrollLeft = 0
    errors = 0
    updateErrorCounter()
    if(timer !== null) {
        clearInterval(timer)
        timer = null
    }
    time = 0
    updateDisplayTime()

    if(errored || text === '') {
        displayError(errored ? text : 'No text loaded')
        return
    }

    textField.innerText = text
    updateHighlightedChar()
    loadedText = text
}

/**
 * Formats the given text and loads it.
 * @param {String} text The unformatted text to load.
 */
function formatAndLoad(text) {
    load(text.replace(/[\r\n]+/g, ' ').replace(/\t+/g, ' ').replace(/ ( )+/g, ' ').trim())
}

/**
 * Repeats a small amount of text (32 chars max in theory) and loads the result string.
 * @param {String} word The word/text to repeat and load.
 * @param {number} repeat The number of times the word has to be repeated.
 */
function loadWord(word, repeat) {
    word = word.trim()
    let res = ""
    for (let i = 0; i < repeat; i++) {
        res = res.concat(word + " ")
    }

    formatAndLoad(res.substring(0, res.length - 1))
}

/**
 * Sets up a reader for the input file and reads then load its content.
 * @param {File} file The file containing the text to load.
 */
function loadFile(file) {
    let reader = new FileReader()
    reader.onload = event => formatAndLoad(event.target.result)
    reader.onerror = () => load('Unable to load file', true)
    reader.readAsText(file)
}

// a variable to add a 'beforeunload' listener only when necessary.
let beforeUnload = null

textField.addEventListener('beforeinput', (e) => {
    // We don't want anything typed by the user be written
    if(e.cancelable) {
        e.preventDefault()
    }

    if(textField.innerText === '') {
        return
    }

    if(e.data === null) {
        return
    }

    if(timer === null) {
        // it is the beginning of the session
        startTimer()
    }

    if(beforeUnload === null) {
        // as this event should only be triggered when the user has started a session already we add the listener here
        window.addEventListener('beforeunload', beforeUnload = (event => {
            if(timer === null) {
                return
            }
        
            event.preventDefault()
            return (event.returnValue = 'You are currently in a typing session. Are you sure you want to leave?') // return value has no effect in recent browser versions btw
        }), {capture: true})
    }

    // if user made a mistake
    if(e.data !== textField.innerText.charAt(0)) {
        if(errorsOnCooldown) {
            return
        }

        playErrorAudio()
        errors++;
        updateErrorCounter()
        cooldownErrors()
        
        if(!skipErrors) {
            return
        }
    }

    textField.innerHTML = textField.innerText.substring(1)
    updateHighlightedChar()
    if(textField.innerText === '') {
        stopTimer()
    }
})

/**
 * Updates the highlighted character of the 'pre' element.
 */
function updateHighlightedChar() {
    textField.setAttribute('data-content', textField.innerText.substring(0, 1)) 
}

/**
 * Displays an error in the 'pre' element.
 * @param {String} error 
 */
function displayError(error) {
    textField.setAttribute('data-content', error)
}

/**
 * Plays an error sound when sounds are not muted.
 */
function playErrorAudio() {
    if(playingSounds) {
        let audio = new Audio("assets/miss.mp3")
        audio.play()
    }
}

/**
 * Updates the value of the error counter shown on the page.
 */
function updateErrorCounter() {
    document.getElementById('error_counter').innerText = errors.toString()
}

/**
 * Enables the error cooldown and schedules its deactivation.
 */
function cooldownErrors() {
    errorsOnCooldown = true
    setTimeout(() => errorsOnCooldown = false, ERROR_COOLDOWN_TIME)
}

/**
 * Creates the timer object.
 */
function startTimer() {
    timer = setInterval(() => {
        updateDisplayTime()
        time++
    }, 100)
}

/**
 * Destroys the timer object.
 */
function stopTimer() {
    if(timer === null) {
        return
    }
    clearInterval(timer)
    timer = null
}

/**
 * Updates the time displayed on the page.
 */
function updateDisplayTime() {
    document.getElementById('time').innerHTML = (time / 10).toFixed(1)
}

/**
 * Toggles sounds and updates the mute button's title and icon.
 */
function changeMuteState() {
    playingSounds = !playingSounds
    let btn = document.getElementById('sound_settings_btn')
    btn.title = btn.classList.toggle('muted', !playingSounds) ? 'Unmute' : 'Mute'
}

/**
 * Toggles time visibility and updates the button's title and icon.
 */
function changeTimeVisibility() {
    let btn = document.getElementById('time_visibility_btn')
    let hidden = document.getElementById('time_text').toggleAttribute('hidden')
    btn.title = btn.classList.toggle('time_hidden', hidden) ? 'Show Time' : 'Hide Time'
}

/**
 * Toggles perfect mode and updates the button's icon.
 */
function togglePerfectMode() {
    // An aproximative way to verify that the session isn't ongoing
    if(timer !== null) {
        return
    }
    skipErrors = !skipErrors
    document.getElementById('perfect_mode_btn').classList.toggle('disabled', skipErrors)
}

/**
 * Reloads the previouly loaded text, resets the error counter and session time.
 */
function restart() {
    load(loadedText)
}

/**
 * Displays a dialog on the user's screen.
 * @param {String} dialogId The id of the dialog element.
 */
function openDialog(dialogId) {
    if(currentDialog !== null) {
        return
    }
    let dialog = document.getElementById(dialogId)
    if(dialog !== null) {
        dialog.toggleAttribute('open', true)
        currentDialog = dialog
    }
    overlay.toggleAttribute('hidden', false)
}

/**
 * Closes the currently displayed dialog and applies focus on the input field.
 */
function closeDialog() {
    if(currentDialog !== null) {
        currentDialog.toggleAttribute('open', false)
        resetDialogState(currentDialog)
        currentDialog = null
    }
    overlay.toggleAttribute('hidden', true)
    textField.focus()
}

/**
 * Resets every data that have been entered in the dialog's children (they are saved by the browser usually).
 * @param {HTMLDialogElement} dialog The dialog element.
 */
function resetDialogState(dialog) {
    dialog.querySelectorAll('input').forEach(dialogInput => {
        if(dialogInput !== null) {
            dialogInput.value = ''
            dialogInput.files = null
        }
    })

    let textArea = dialog.querySelector('textarea')
    if(textArea !== null) {
        textArea.value = ''
    }

    let confirmBtn = dialog.querySelector('.confirm_button')
    if(confirmBtn !== null) {
        confirmBtn.toggleAttribute('disabled', true)
    }
}

overlay.addEventListener('click', () => closeDialog())

document.getElementById('file_input').addEventListener('change', e => {
    if(currentDialog === null) {
        return
    }
    let input = e.target;
    // updates the state of the confirm button depending on whether the input is correct
    currentDialog.querySelector('.confirm_button').toggleAttribute('disabled', !('files' in input && input.files.length > 0))
})

/**
 * Gathers and loads the file specified in the 'file_input' element.
 */
function acceptInputFile() {
    let input = document.getElementById('file_input');
    if('files' in input && input.files.length > 0) {
        loadFile(input.files[0])
    }
    closeDialog()
}

// Same thing for 'text_input' and 'word_input' below

document.getElementById('text_input').addEventListener('input', e => {
    if(currentDialog === null) {
        return
    }
    let textArea = e.target;
    currentDialog.querySelector('.confirm_button').toggleAttribute('disabled', textArea.value === undefined || textArea.value === null || textArea.value === '')
})

function acceptInputText() {
    let textArea = document.getElementById('text_input')
    if(textArea.value !== undefined && textArea.value !== null && textArea.value !== '') {
        formatAndLoad(textArea.value)
    }
    closeDialog()
}

let updateConfirmButtonState = () => {
    if(currentDialog === null) {
        return
    }
    let wordInput = document.getElementById('word_input')
    let numberInput = document.getElementById('word_number_input')
    let confirmButton = currentDialog.querySelector('.confirm_button')
    if(confirmButton !== null) {
        confirmButton.toggleAttribute('disabled', wordInput.value === '' || numberInput.value === '' || numberInput.valueAsNumber <= 0)
    }
}

document.getElementById('word_input').addEventListener('input', updateConfirmButtonState)
document.getElementById('word_number_input').addEventListener('input', updateConfirmButtonState)

function acceptInputWord() {
    let wordInput = document.getElementById('word_input')
    let numberInput = document.getElementById('word_number_input')
    if(wordInput.value !== null && wordInput.value !== '' && numberInput.value !== '' && numberInput.valueAsNumber > 0) {
        loadWord(wordInput.value, numberInput.valueAsNumber)
    }
    closeDialog()
}