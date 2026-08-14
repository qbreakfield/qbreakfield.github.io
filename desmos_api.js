// Check localStorage for existing key
let key;
let storedKey = localStorage.getItem("desmos_api_key");

// Function to prompt user for API key and save to localStorage
function promptKey() {
    key = null;
    key = prompt("Enter your Desmos API key:");
    localStorage.setItem("desmos_api_key", key);
    return key;
}

// Prompt user for key if needed, otherwise pull from localStorage
let emptyStore = (storedKey === null || storedKey.trim() === "" || storedKey === "null");
if (emptyStore) {
    promptKey();
} else {
    key = storedKey;
}

// Function to create Desmos API script with the provided key
function loadDesmosAPI(key, should_prompt) {
    let script = document.createElement('script');
    script.src = `https://www.desmos.com/api/v1.12/calculator.js?apiKey=${key}`;
    
    script.onload = function() {
        console.log("Desmos API loaded successfully.");
    }

    // If the script fails to load, prompt the user for a new key and try again
    script.onerror = function(error) {
        console.warn("Desmos API refused to load.");
        this.remove()

        if (should_prompt) {
            let new_key = promptKey(); // Prompt for a new key
            loadDesmosAPI(new_key, false); // Try loading again with the new key
        } else {
            alert("Failed to load Desmos API. Please enter a valid API key."); // Otherwise, alert
        }
    }
    
    document.head.appendChild(script);
}

// Load the Desmos API
loadDesmosAPI(key, !emptyStore);