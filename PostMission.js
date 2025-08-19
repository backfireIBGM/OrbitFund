// Base URL for your API submissions (Ensure this is correct for your Azure backend)
const API_BASE_URL = 'https://orbitfund-bzaafpeubnhdhaad.westus-01.azurewebsites.net/api';

// --- FORM ELEMENTS ---
const missionForm = document.getElementById('missionForm');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const submitBtn = document.getElementById('submitBtn');
const formSections = document.querySelectorAll('.form-section');
const steps = document.querySelectorAll('.step');

// --- WIZARD STATE ---
let currentStep = 1;
const totalSteps = formSections.length;

// --- FUNCTION TO SHOW SPECIFIC STEP ---
function showStep(stepNumber) {
    // Hide all sections
    formSections.forEach(section => {
        section.classList.remove('active');
    });
    // Show the target section
    const targetSection = document.getElementById(`section${stepNumber}`);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    // Update progress indicators
    steps.forEach((step, index) => {
        step.classList.toggle('active', index + 1 === stepNumber);
    });

    // Update button visibility
    prevBtn.style.display = stepNumber > 1 ? 'block' : 'none';
    nextBtn.style.display = stepNumber < totalSteps ? 'block' : 'block'; // Keep 'next' visible until last step
    submitBtn.style.display = stepNumber === totalSteps ? 'block' : 'none';
    
    // Ensure Next button is hidden when Submit button is shown (redundant with line above but explicit)
    if (stepNumber === totalSteps) {
        nextBtn.style.display = 'none';
    }
}

// --- NAVIGATION HANDLERS ---
function validateCurrentStep() {
    const currentSection = document.getElementById(`section${currentStep}`);
    const inputs = currentSection.querySelectorAll('input, textarea, select');
    let isValid = true;

    // Simple validation for required fields in the current section
    for (const input of inputs) { // Using for...of for early exit
        // Check for empty required text fields, and validity for number/date inputs
        if (input.hasAttribute('required') && !input.value.trim()) {
            isValid = false;
            input.reportValidity(); // Shows browser's native validation message
            input.focus(); // Tries to focus the invalid element
            return false; // Stop checking further inputs in this section
        }
        // Additional check for number/date types if they have min/max constraints
        if ((input.type === 'number' || input.type === 'date') && input.checkValidity && !input.checkValidity()) {
             isValid = false;
             input.reportValidity();
             input.focus();
             return false;
        }
        // Add specific validation for file inputs if required
        // e.g., if (input.type === 'file' && input.hasAttribute('required') && input.files.length === 0) { ... }
    }

    // Special check for the "Review & Launch" step (currentStep === totalSteps)
    if (currentStep === totalSteps) { 
        const termsAgree = document.getElementById('termsAgree');
        const accuracyConfirm = document.getElementById('accuracyConfirm');
        if (!termsAgree.checked || !accuracyConfirm.checked) {
            isValid = false;
            alert("Please agree to the Terms of Service and confirm accuracy."); // Or a better UI message
            if (!termsAgree.checked) termsAgree.focus();
            else accuracyConfirm.focus();
            return false;
        }
    }
    return isValid;
}

function handleNextStep() {
    if (validateCurrentStep()) {
        if (currentStep < totalSteps) {
            currentStep++;
            showStep(currentStep);
        }
    } else {
        console.warn("Validation failed for current step.");
    }
}

function handlePrevStep() {
    if (currentStep > 1) {
        currentStep--;
        showStep(currentStep);
    }
}

// --- ASYNCHRONOUS FORM SUBMISSION HANDLER ---
async function handleSubmit(event) {
    event.preventDefault();

    if (!validateCurrentStep()) {
        console.warn("Final validation failed before submission.");
        return;
    }

    const formData = new FormData(missionForm);
    const method = missionForm.method;

    const token = localStorage.getItem('orbitFundToken');
    if (!token) {
        alert("Authentication token not found. Please log in again.");
        window.location.replace("loginSignup.html?form=login");
        return;
    }

    submitBtn.textContent = 'Launching...';
    submitBtn.disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL}/Submission`, {
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData,
        });

        if (response.ok) {
            const result = await response.json();
            console.log('Mission launched successfully:', result);
            alert('Your mission has been successfully launched and is awaiting review!');
            
            // --- THIS IS THE CRUCIAL LINE TO ENSURE REDIRECTION ---
            window.location.href = 'index.html'; // Redirect to your home page (index.html)
            // Or if you want to reset the form and stay on the page (less common for mission submit)
            // missionForm.reset();
            // currentStep = 1;
            // showStep(currentStep);
            
        } else {
            let errorData;
            try {
                errorData = await response.json();
            } catch (e) {
                errorData = await response.text();
            }
            
            console.error('Mission launch failed:', response.status, errorData);
            
            let errorMessage = "An error occurred.";
            if (typeof errorData === 'object' && errorData !== null) {
                errorMessage = errorData.message || errorData.title || JSON.stringify(errorData);
                if (errorData.errors) {
                    errorMessage += "\n\nDetails:";
                    for (const key in errorData.errors) {
                        errorMessage += `\n- ${key}: ${errorData.errors[key].join(', ')}`;
                    }
                }
            } else if (typeof errorData === 'string') {
                errorMessage = errorData.substring(0, 200) + (errorData.length > 200 ? "..." : "");
            }

            alert(`Failed to launch mission: ${response.status} - ${errorMessage}`);
        }
    } catch (error) {
        console.error('Network or submission error:', error);
        alert('An unexpected network error occurred. Please check your internet connection or try again later.');
    } finally {
        submitBtn.textContent = 'Launch Mission 🚀';
        submitBtn.disabled = false;
    }
}

// --- INITIALIZE WIZARD ---
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the first step
    showStep(currentStep);

    // Add listeners for navigation buttons
    prevBtn.addEventListener('click', handlePrevStep);
    nextBtn.addEventListener('click', handleNextStep);

    // Add listener for form submission
    missionForm.addEventListener('submit', handleSubmit);
});