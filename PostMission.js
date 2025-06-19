// Multi-step form functionality
let currentStep = 1;
const totalSteps = 4;

function showStep(step) {
    // Hide all sections
    for (let i = 1; i <= totalSteps; i++) {
        document.getElementById(`section${i}`).style.display = 'none';
        document.querySelector(`.step:nth-child(${i})`).classList.remove('active');
    }
    
    // Show current section
    document.getElementById(`section${step}`).style.display = 'block';
    document.querySelector(`.step:nth-child(${step})`).classList.add('active');
    
    // Update navigation buttons
    document.getElementById('prevBtn').style.display = step === 1 ? 'none' : 'block';
    document.getElementById('nextBtn').style.display = step === totalSteps ? 'none' : 'block';
    document.getElementById('submitBtn').style.display = step === totalSteps ? 'block' : 'none';
}

// Next button
document.getElementById('nextBtn').addEventListener('click', () => {
    if (currentStep < totalSteps) {
        currentStep++;
        showStep(currentStep);
    }
});

// Previous button
document.getElementById('prevBtn').addEventListener('click', () => {
    if (currentStep > 1) {
        currentStep--;
        showStep(currentStep);
    }
});

function handleImageUpload(files) {
    const inputElement = document.getElementById("input");
    inputElement.addEventListener("change", handleFiles, false);
    
    function handleFiles() {
        const fileList = this.files; /* now you can work with the file list */
        console.log(fileList);
    }
}

document.getElementById('missionForm').addEventListener('submit', function(e) {
    e.preventDefault(); // Prevent default form submission
    
    const formData = new FormData(this);
    
    fetch(this.action, {
        method: this.method,
        body: formData
    })
    .then(response => {
        // --- THIS IS THE KEY CHANGE ---
        // Instead of .json(), use .text() to read the response as plain text.
        return response.text(); 
    })
    .then(data => {
        // 'data' will now be the plain text string, e.g., "API is running"
        console.log('API Response (Text):', data);

        // You can then check the content of the text response
        if (data === "API is running") {
            alert("Mission data submitted successfully!");
            window.location.href = "index.html";
        } else {
            console.warn("Function returned an unexpected response:", data);
            alert("Submission complete, but with an unexpected response.");
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert("There was an error submitting the mission data. Please try again.");
    });
});

// Initialize
showStep(1);