// PostMission.js
// This file is NOW ONLY for multi-step form navigation.
// The actual form submission is handled by the browser directly due to the HTML action attribute.

// --- FORM ELEMENTS ---
// We only need references for navigation logic now.
const missionForm = document.getElementById('missionForm'); // Not directly used for fetch anymore
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
    nextBtn.style.display = stepNumber < totalSteps ? 'block' : 'none';
    submitBtn.style.display = stepNumber === totalSteps ? 'block' : 'none';
    
    // Ensure Next button is hidden when Submit button is shown
    if (stepNumber === totalSteps) {
        nextBtn.style.display = 'none';
    }
}

// --- NAVIGATION HANDLERS ---
function handleNextStep() {
    const currentSection = document.getElementById(`section${currentStep}`);
    const inputs = currentSection.querySelectorAll('input, textarea, select');
    let isValid = true;

    // Simple validation for required fields in the current section
    inputs.forEach(input => {
        // Check for empty required text fields, and validity for number/date inputs
        if (input.hasAttribute('required') && !input.value.trim()) {
            isValid = false;
            input.reportValidity(); // Shows browser's native validation message
            input.focus(); // Tries to focus the invalid element
            return; // Stop checking further inputs in this section
        }
        // Additional check for number/date types if they have min/max constraints
        if (input.type === 'number' && input.checkValidity && !input.checkValidity()) {
             isValid = false;
             input.reportValidity();
             input.focus();
             return;
        }
        if (input.type === 'date' && input.checkValidity && !input.checkValidity()) {
             isValid = false;
             input.reportValidity();
             input.focus();
             return;
        }
        // You'll need specific checks for file inputs if they were mandatory
    });

    if (currentStep === totalSteps) { // Special check for the "Review & Launch" step
        const termsAgree = document.getElementById('termsAgree');
        const accuracyConfirm = document.getElementById('accuracyConfirm');
        if (!termsAgree.checked || !accuracyConfirm.checked) {
            isValid = false;
            alert("Please agree to the Terms of Service and confirm accuracy."); // Or a better UI message
            if (!termsAgree.checked) termsAgree.focus();
            else accuracyConfirm.focus();
        }
    }


    if (isValid) {
        if (currentStep < totalSteps) {
            currentStep++;
            showStep(currentStep);
        }
    } else {
        // Keep the user on the current step if validation fails
        console.warn("Validation failed for current step.");
    }
}

function handlePrevStep() {
    if (currentStep > 1) {
        currentStep--;
        showStep(currentStep);
    }
}

// --- INITIALIZE WIZARD ---
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the first step
    showStep(currentStep);

    // Add listeners for navigation buttons
    prevBtn.addEventListener('click', handlePrevStep);
    nextBtn.addEventListener('click', handleNextStep);

    // *** REMOVED: No submit listener for fetch here anymore! The form itself submits via HTML 'action'. ***
});