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
    localStorage.removeItem('orbitFundToken'); // Clear the JWT
    localStorage.removeItem('orbitFundUsername'); // Clear the username
    alert('You have been logged out.');

    // Directly call the update function if on the homepage
    // No need for DOMContentLoaded as the page is already loaded
    const currentPage = window.location.pathname.split('/').pop();
    if (currentPage === 'index.html' || currentPage === '') { // Added '' for root path
      updateAuthUIHomePage();
    }
    // If on other pages, consider redirecting or updating other UI elements if necessary
    // For now, we only care about the home page UI based on your problem description.
}

// --- Initialize UI on Page Load ---
document.addEventListener('DOMContentLoaded', () => {
const currentPage = window.location.pathname.split('/').pop();

if (currentPage === 'index.html') {
  updateAuthUIHomePage(); // Call this when the page loads to set the initial state
} else {
  updateAuthUINarBar();
}
});