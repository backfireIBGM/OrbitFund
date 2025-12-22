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
