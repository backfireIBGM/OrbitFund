function showCreateMission() {
    const token = localStorage.getItem('orbitFundToken');
    if (token) {
        window.location.href = "postMission.html";
    } else {
        alert("You must be logged in to launch a mission!");
        window.location.href = "loginSignup.html?form=login"; // Redirect to login page
    }
}

function showLogin() {
    window.location.href = "loginSignup.html?form=login";
}

function showCreateAccount() {
    window.location.href = "loginSignup.html?form=signup";
}

// --- User Authentication UI Management ---
function updateAuthUI() {
    const authButtons = document.getElementById('authButtons');
    const loggedInUserDisplay = document.getElementById('loggedInUserDisplay');
    const usernameGreeting = document.getElementById('usernameGreeting');

    const token = localStorage.getItem('orbitFundToken');
    const username = localStorage.getItem('orbitFundUsername');

    if (token && username) {
        // User is logged in
        authButtons.style.display = 'none'; // Hide Login/Sign Up buttons
        loggedInUserDisplay.style.display = 'flex'; // Show Welcome/Logout section
        usernameGreeting.textContent = `Welcome, ${username}!`; // Set username text
    } else {
        // User is NOT logged in
        authButtons.style.display = 'flex'; // Show Login/Sign Up buttons
        loggedInUserDisplay.style.display = 'none'; // Hide Welcome/Logout section
        usernameGreeting.textContent = ''; // Clear username text
    }
}

function logout() {
    localStorage.removeItem('orbitFundToken'); // Clear the JWT
    localStorage.removeItem('orbitFundUsername'); // Clear the username
    alert('You have been logged out.');
    updateAuthUI(); // Update the UI immediately after logout
    // Optionally, redirect to a specific page after logout if desired, e.g.:
    // window.location.href = "index.html"; // Redirect to home
}


// --- Initialize UI on Page Load ---
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI(); // Call this when the page loads to set the initial state

    // Listen for storage changes across tabs/windows (optional but good for UX)
    window.addEventListener('storage', updateAuthUI);
});