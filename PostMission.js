const API_BASE_URL = 'https://orbitfund-bzaafpeubnhdhaad.westus-01.azurewebsites.net/api';

// --- FORM ELEMENTS ---
const missionForm = document.getElementById('missionForm');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const submitBtn = document.getElementById('submitBtn');
const formSections = document.querySelectorAll('.form-section');
const steps = document.querySelectorAll('.step');

// File input elements
const missionImagesInput = document.getElementById('missionImages');
const missionVideoInput = document.getElementById('missionVideo');
const techDocsInput = document.getElementById('techDocs');

// Preview areas
const missionImagesPreview = document.getElementById('missionImagesPreview');
const missionVideoPreview = document.getElementById('missionVideoPreview');
const techDocsPreview = document.getElementById('techDocsPreview');


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
    }

    if (currentStep === totalSteps) { 
        const termsAgree = document.getElementById('termsAgree');
        const accuracyConfirm = document.getElementById('accuracyConfirm');
        if (!termsAgree.checked || !accuracyConfirm.checked) {
            isValid = false;
            alert("Please agree to the Terms of Service and confirm accuracy.");
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

// --- FILE PREVIEW LOGIC ---
function setupFilePreview(inputElement, previewArea) {
    inputElement.addEventListener('change', (event) => {
        previewArea.innerHTML = ''; // Clear previous previews
        const files = event.target.files;

        if (files.length === 0) {
            return;
        }

        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const previewItem = document.createElement('div');
                previewItem.classList.add('file-preview');

                if (file.type.startsWith('image/')) {
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    previewItem.appendChild(img);
                } else if (file.type.startsWith('video/')) {
                    const video = document.createElement('video');
                    video.src = e.target.result;
                    video.controls = false; // No controls for thumbnail
                    video.muted = true;
                    video.play().catch(() => {}); // Attempt to play for thumbnail
                    previewItem.appendChild(video);
                } else {
                    const fileIcon = document.createElement('span');
                    fileIcon.textContent = '📄'; // Generic document icon
                    fileIcon.style.fontSize = '2em';
                    fileIcon.style.display = 'block';
                    fileIcon.style.textAlign = 'center';
                    fileIcon.style.padding = '10px';
                    previewItem.appendChild(fileIcon);
                }
                
                const fileName = document.createElement('div');
                fileName.classList.add('file-name');
                fileName.textContent = file.name;
                previewItem.appendChild(fileName);

                const removeBtn = document.createElement('button');
                removeBtn.classList.add('remove-btn');
                removeBtn.textContent = 'X';
                removeBtn.addEventListener('click', () => {
                    // This is a simplistic remove. For actual form submission, 
                    // you'd need to manage a separate DataTransfer object or re-create files.
                    // For now, it just removes the visual preview.
                    previewItem.remove();
                    // If you need to clear the input for single files:
                    if (!inputElement.multiple) {
                        inputElement.value = '';
                    }
                });
                previewItem.appendChild(removeBtn);

                previewArea.appendChild(previewItem);
            };
            reader.readAsDataURL(file);
        });
    });
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

        // Read the response body ONCE as text
        const responseText = await response.text();
        let responseData = responseText; // Default to text

        // Try to parse it as JSON if it looks like JSON
        try {
            if (responseText && responseText.trim().startsWith('{') && responseText.trim().endsWith('}')) {
                responseData = JSON.parse(responseText);
            }
        } catch (jsonParseError) {
            console.warn("Response was not valid JSON, treating as plain text:", jsonParseError);
        }

        if (response.ok) {
            console.log('Mission launched successfully (status:', response.status, '):', responseData);
            alert('Your mission has been successfully launched and is awaiting review!');
            window.location.href = 'index.html';
            
        } else {
            console.error('Mission launch failed (status:', response.status, '):', responseData);
            
            let errorMessage = "An error occurred.";
            if (typeof responseData === 'object' && responseData !== null) {
                errorMessage = responseData.message || responseData.title || JSON.stringify(responseData);
                if (responseData.errors) {
                    errorMessage += "\n\nDetails:";
                    for (const key in responseData.errors) {
                        errorMessage += `\n- ${key}: ${responseData.errors[key].join(', ')}`;
                    }
                }
            } else if (typeof responseData === 'string') {
                errorMessage = responseData.substring(0, 200) + (responseData.length > 200 ? "..." : "");
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

    // Setup file previews for each input
    setupFilePreview(missionImagesInput, missionImagesPreview);
    setupFilePreview(missionVideoInput, missionVideoPreview);
    setupFilePreview(techDocsInput, techDocsPreview);
});