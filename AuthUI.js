function updateAuthUIHomePage() {
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

function updateAuthUINarBar() {
  const authLink = document.querySelector('a[href="loginSignup.html"]'); // Renamed for clarity

  // Always check if the element was found
  if (!authLink) {
    console.error("Authentication link not found in the navigation bar.");
    return; // Exit if the link isn't found
  }

  const token = localStorage.getItem("orbitFundToken");
  const username = localStorage.getItem("orbitFundUsername");

  if (token && username) {
    // User is logged in
    authLink.textContent = username; // Display username
    authLink.href = "accountPage.html"; // Set the href to the account page
  } else {
    // User is NOT logged in
    authLink.textContent = "Login"; // Display "Login"
    authLink.href = "loginSignup.html"; // Ensure href is set back to login/signup page
  }
}

function logout() {
  localStorage.removeItem("orbitFundToken");
  localStorage.removeItem("orbitFundUsername");

  const path = window.location.pathname;
  const currentPage = path.split("/").pop() || "index.html";

  if (currentPage === "index.html" || currentPage === "") {
    updateAuthUIHomePage();
  } else if (currentPage === "accountPage.html") {
    window.location.href = "index.html";
  }
}

// --- Initialize UI on Page Load ---
document.addEventListener('DOMContentLoaded', () => {
const currentPage = window.location.pathname.split('/').pop();

if (currentPage === "index.html") {
  updateAuthUIHomePage();
} else if (currentPage !== "accountPage.html") {
  updateAuthUINarBar();
}
});