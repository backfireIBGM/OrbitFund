document.addEventListener('DOMContentLoaded', () => {
    const showLoginBtn = document.getElementById('showLoginBtn');
    const showSignupBtn = document.getElementById('showSignupBtn');
    const loginSection = document.getElementById('loginSection');
    const signupSection = document.getElementById('signupSection');

    const API_BASE_URL = 'http://localhost:3000/api';

    function showSection(sectionToShow) {
        // Hide all sections
        loginSection.classList.remove('active');
        signupSection.classList.remove('active');

        // Deactivate all toggle buttons
        showLoginBtn.classList.remove('active');
        showSignupBtn.classList.remove('active');

        // Show the target section and activate its button
        if (sectionToShow === 'login') {
            loginSection.classList.add('active');
            showLoginBtn.classList.add('active');
        } else if (sectionToShow === 'signup') {
            signupSection.classList.add('active');
            showSignupBtn.classList.add('active');
        }
    }

    // --- URL Parameter Handling ---
    const urlParams = new URLSearchParams(window.location.search);
    const initialForm = urlParams.get('form'); // Gets the value of 'form' parameter (e.g., 'login' or 'signup')

    if (initialForm === 'signup') {
        showSection('signup');
    } else {
        // Default to login if no parameter or an unknown parameter
        showSection('login');
    }

    // Event Listeners for toggle buttons
    showLoginBtn.addEventListener('click', () => showSection('login'));
    showSignupBtn.addEventListener('click', () => showSection('signup'));

    // --- Form submission handlers (updated for API calls) ---
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent actual form submission

        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
            const response = await fetch(`${API_BASE_URL}/users/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('orbitFundToken', data.token);
                localStorage.setItem('orbitFundUsername', data.username);
                window.location.href = 'index.html';
            } else {
                console.error('Login failed:', data);
                alert(`Login Failed: ${data.message || data.title || 'Invalid credentials'}`);
            }
        } catch (error) {
            console.error('Network or server error during login:', error);
            alert('A network error occurred. Please try again.');
        }
    });

    signupForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent actual form submission

        const username = document.getElementById('signupUsername').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const termsAgreed = document.getElementById('termsAgreeSignup').checked;

        if (password !== confirmPassword) {
            alert('Passwords do not match!');
            document.getElementById('confirmPassword').focus();
            return;
        }

        if (!termsAgreed) {
            alert('Please agree to the Terms of Service and Privacy Policy.');
            document.getElementById('termsAgreeSignup').focus();
            return;
        }

        // Add more robust client-side validation here (e.g., password strength)
        // For example, a regex for password:
        const passwordRegex =
            /^(?=.*[0-9])(?=.*[!@#$%^&*])(?=.*[a-zA-Z]).{8,}$/;
        if (!passwordRegex.test(password)) {
            alert(
                'Password must be at least 8 characters, include a number, and a symbol.'
            );
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/users/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                console.log('Signup successful!', data);
                alert('Account created successfully! Please log in.');
                showSection('login'); // Switch to login tab after successful registration
                // Optionally pre-fill login email:
                document.getElementById('loginEmail').value = email;
            } else {
                console.error('Signup failed:', data);
                alert(`Sign Up Failed: ${data.message || data.title || 'An error occurred'}`);
            }
        } catch (error) {
            console.error('Network or server error during signup:', error);
            alert('A network error occurred. Please try again.');
        }
    });
});