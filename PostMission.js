const API_BASE_URL = 'http://localhost:3000/api';

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

// Specific date inputs
const launchDateInput = document.getElementById('launchDate');
const endTimeInput = document.getElementById('endTime'); // Now directly from user input


// --- WIZARD STATE ---
let currentStep = 1;
const totalSteps = formSections.length;

// --- Object to store all files selected for each input ---
// Keys will be the input 'name' attributes (e.g., 'images', 'video', 'documents')
// Values will be Sets to automatically handle duplicates and maintain order
const collectedFiles = {
    images: new Set(),
    video: new Set(),
    documents: new Set()
};

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('orbitFundToken');

    if (!token) {
        alert("You must be logged in to launch a mission. Redirecting to login page.");
        window.location.replace("loginSignup.html?form=login");
    }
});

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
    nextBtn.style.display = stepNumber < totalSteps ? 'block' : 'block';
    if (stepNumber === totalSteps) { // Ensure Next button is hidden when Submit button is shown
        nextBtn.style.display = 'none';
        submitBtn.style.display = 'block';
    } else {
        submitBtn.style.display = 'none';
    }
}

// --- NAVIGATION HANDLERS ---
function validateCurrentStep() {
    const currentSection = document.getElementById(`section${currentStep}`);
    const inputs = currentSection.querySelectorAll('input, textarea, select');
    let isValid = true;

    for (const input of inputs) {
        // Validation for launchDate and endTime relationship
        if (input.id === 'launchDate' || input.id === 'endTime') {
            const launchDateVal = launchDateInput.value;
            const endTimeVal = endTimeInput.value;

            // Only validate if both have values
            if (launchDateVal && endTimeVal) {
                const startDate = new Date(launchDateVal);
                const endDate = new Date(endTimeVal);

                if (endDate <= startDate) {
                    isValid = false;
                    alert("Campaign End Date must be after Target Launch Date.");
                    endTimeInput.reportValidity();
                    endTimeInput.focus();
                    return false;
                }
            }
        }

        if (input.hasAttribute('required') && !input.value.trim()) {
            isValid = false;
            input.reportValidity();
            input.focus();
            return false;
        }
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

// --- FILE PREVIEW AND COLLECTION LOGIC ---
function setupFilePreview(inputElement, previewArea, fileCollectionSet) {
    inputElement.addEventListener('change', (event) => {
        const files = event.target.files;

        // Add new files to the collection
        Array.from(files).forEach(file => {
            // Assign a unique ID to each file object for easier removal from the Set
            // This is important because File objects are not guaranteed to be referentially equal
            // even if their content is the same, making Set.delete tricky without an identifier.
            file._id = file.name + file.lastModified + file.size; // Simple unique ID
            fileCollectionSet.add(file);
        });

        // Clear the *input element's value* so new selections don't conflict,
        // but files remain in our `collectedFiles` object.
        inputElement.value = ''; // IMPORTANT: Clears the selection shown in the input box

        updateFilePreviews(previewArea, fileCollectionSet, inputElement.name); // Pass input name for remove handling
    });
}

function updateFilePreviews(previewArea, fileCollectionSet, inputName) {
    previewArea.innerHTML = ''; // Clear previous previews

    if (fileCollectionSet.size === 0) {
        return;
    }

    fileCollectionSet.forEach(file => {
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
                video.controls = false;
                video.muted = true;
                video.play().catch(() => {});
                previewItem.appendChild(video);
            } else { // Generic for documents (like PDF)
                const fileIcon = document.createElement('span');
                fileIcon.textContent = '📄';
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
                fileCollectionSet.delete(file); // Remove from our collected set
                updateFilePreviews(previewArea, fileCollectionSet, inputName); // Re-render previews
            });
            previewItem.appendChild(removeBtn);

            previewArea.appendChild(previewItem);
        };
        reader.readAsDataURL(file);
    });
}

// --- ASYNCHRONOUS FORM SUBMISSION HANDLER ---
async function handleSubmit(event) {
    event.preventDefault();

    if (!validateCurrentStep()) {
        console.warn("Final validation failed before submission.");
        return;
    }

    // --- Manually create FormData and append all collected files ---
    const formData = new FormData(missionForm); // Collects all non-file inputs including launchDate, endTime

    // Append collected files from our Sets
    for (const fileInputName in collectedFiles) {
        collectedFiles[fileInputName].forEach(file => {
            formData.append(fileInputName, file, file.name); // Append each file with its original name
        });
    }
    // --- END NEW ---

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
        const response = await fetch(`${API_BASE_URL}/submission`, {
            method: method,
            headers: {
                // IMPORTANT: Do NOT set Content-Type for FormData when uploading files.
                // The browser sets it automatically, including the boundary.
                'Authorization': `Bearer ${token}`
            },
            body: formData, // FormData object handles its own content type
        });

        const responseText = await response.text();
        let responseData = responseText;

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
            // window.location.href = 'index.html';

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
    showStep(currentStep);

    prevBtn.addEventListener('click', handlePrevStep);
    nextBtn.addEventListener('click', handleNextStep);
    missionForm.addEventListener('submit', handleSubmit);

    // Setup file previews and collection for each input
    // Pass the corresponding Set from 'collectedFiles'
    setupFilePreview(missionImagesInput, missionImagesPreview, collectedFiles.images);
    setupFilePreview(missionVideoInput, missionVideoPreview, collectedFiles.video);
    setupFilePreview(techDocsInput, techDocsPreview, collectedFiles.documents);
});


// Get references to the elements
const milestoneCountSpan = document.getElementById('milestoneCount');
const decrementMilestoneBtn = document.getElementById('decrementMilestone');
const incrementMilestoneBtn = document.getElementById('incrementMilestone');
const milestonesContainer = document.getElementById('milestonesContainer');

let milestoneCount = 0;

// Function to update the displayed count
const updateMilestoneCount = () => {
  milestoneCountSpan.textContent = milestoneCount;
};

// Function to add a new milestone input group
const addMilestone = () => {
  milestoneCount++;
  updateMilestoneCount();

  const milestoneDiv = document.createElement('div');
  milestoneDiv.className = 'milestone-item';
  milestoneDiv.id = `milestone-${milestoneCount}`;

  milestoneDiv.innerHTML = `
    <label for="milestoneName-${milestoneCount}">Milestone ${milestoneCount} Name:</label>
    <input type="text" id="milestoneName-${milestoneCount}" name="milestoneName[]" placeholder="e.g., Satellite Design & Prototyping">

    <label for="milestoneTarget-${milestoneCount}">Funding Goal:</label>
    <input
      type="number"
      id="milestoneTarget-${milestoneCount}"
      name="milestoneTarget[]"
      placeholder="Funding Goal (USD, no $ or commas):"
      min="0"
    >
  `;

  milestonesContainer.appendChild(milestoneDiv);
};

// Function to remove the last milestone input group
const removeLastMilestone = () => {
  if (milestoneCount > 0) {
    const lastMilestoneDiv = document.getElementById(`milestone-${milestoneCount}`);
    if (lastMilestoneDiv) {
      milestonesContainer.removeChild(lastMilestoneDiv);
      milestoneCount--;
      updateMilestoneCount();
    }
  }
};

// Event listeners for the buttons
incrementMilestoneBtn.addEventListener('click', addMilestone);
decrementMilestoneBtn.addEventListener('click', removeLastMilestone);