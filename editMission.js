const API_BASE_URL = "http://localhost:3000/api";
const urlParams = new URLSearchParams(window.location.search);
const currentMissionId = urlParams.get("id");
let mission = null;

// --- FORM ELEMENTS ---
const missionForm = document.getElementById('missionForm');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const submitBtn = document.getElementById('submitBtn');
const formSections = document.querySelectorAll('.form-section');
const steps = document.querySelectorAll('.step');

const missionImagesInput = document.getElementById('missionImages');
const missionVideoInput = document.getElementById('missionVideo');
const techDocsInput = document.getElementById('techDocs');

const missionImagesPreview = document.getElementById('missionImagesPreview');
const missionVideoPreview = document.getElementById('missionVideoPreview');
const techDocsPreview = document.getElementById('techDocsPreview');

const launchDateInput = document.getElementById('launchDate');

// --- WIZARD STATE ---
let currentStep = 1;
const totalSteps = formSections.length;

const collectedFiles = {
    images: new Set(),
    video: new Set(),
    documents: new Set()
};

const filesToDelete = {
    images: [],
    videos: [],
    documents: []
};

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('orbitFundToken');

    if (!token) {
        alert("You must be logged in to launch a mission. Redirecting to login page.");
        window.location.replace("loginSignup.html?form=login");
        return;
    }

    updateAuthUINarBar();
    mission = await getUserMissionData(currentMissionId);
    
    if (mission) {
        displayedFetchedData();
    }

    showStep(currentStep);

    setupFilePreview(missionImagesInput, missionImagesPreview, collectedFiles.images, 'images');
    setupFilePreview(missionVideoInput, missionVideoPreview, collectedFiles.video, 'videos');
    setupFilePreview(techDocsInput, techDocsPreview, collectedFiles.documents, 'documents');

    prevBtn.addEventListener('click', handlePrevStep);
    nextBtn.addEventListener('click', handleNextStep);
    missionForm.addEventListener('submit', editPost);
});

function updateAuthUINarBar() {
    const authLink = document.querySelector('a[href="loginSignup.html"]');
    if (!authLink) return;
    const token = localStorage.getItem("orbitFundToken");
    const username = localStorage.getItem("orbitFundUsername");
    if (token && username) {
        authLink.textContent = username;
        authLink.href = "accountPage.html";
    }
}

async function getUserMissionData(missionId) {
    if (!missionId) return null;
    const token = localStorage.getItem('orbitFundToken'); 
    try {
        const response = await fetch(`${API_BASE_URL}/my-missions/${missionId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
        });
        return response.ok ? await response.json() : null;
    } catch (error) {
        console.error('Network Error:', error);
        return null;
    }
}

function displayedFetchedData() {
    if (!mission) return;

    document.getElementById("missionTitle").value = mission.title || "";
    document.getElementById("missionDescription").value = mission.description || "";
    document.getElementById("missionGoals").value = mission.goals || "";
    document.getElementById("missionType").value = mission.type || "";
    document.getElementById("teamInfo").value = mission.teamInfo || "";
    document.getElementById("fundingGoal").value = mission.fundingGoal || "";
    document.getElementById("budgetBreakdown").value = mission.budgetBreakdown || "";
    document.getElementById("rewards").value = mission.rewards || "";

    if (mission.endTime) {
        const displayElement = document.getElementById("endTimeDisplay");
        if (displayElement) displayElement.textContent = mission.endTime.split("T")[0];
    }

    if (mission.launchDate) {
        document.getElementById("launchDate").value = mission.launchDate.split("T")[0];
    }

    if (mission.milestones && Array.isArray(mission.milestones)) {
        milestonesContainer.innerHTML = '';
        milestoneCount = 0; 
        updateMilestoneCount();
        mission.milestones.forEach((m) => {
            addMilestone();
            document.getElementById(`milestoneName-${milestoneCount}`).value = m.milestone_name || "";
            document.getElementById(`milestoneTarget-${milestoneCount}`).value = m.target_amount || "";
        });
    }

    const fileMappings = [
        { data: mission.images, preview: missionImagesPreview, set: collectedFiles.images, key: 'images' },
        { data: mission.videos, preview: missionVideoPreview, set: collectedFiles.video, key: 'videos' },
        { data: mission.documents, preview: techDocsPreview, set: collectedFiles.documents, key: 'documents' }
    ];

    fileMappings.forEach(({ data, preview, set, key }) => {
        if (data && Array.isArray(data)) {
            data.forEach(url => {
                const proxyFile = { name: url.split('/').pop(), url, isExisting: true, _id: url };
                set.add(proxyFile);
            });
            updateFilePreviews(preview, set, key);
        }
    });
}

function renderPreviewElement(container, src) {
    const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(src) || src.startsWith('data:image');
    const isVideo = /\.(mp4|webm|ogg)$/i.test(src) || src.startsWith('data:video');
    if (isImage) {
        const img = document.createElement('img');
        img.src = src;
        container.appendChild(img);
    } else if (isVideo) {
        const video = document.createElement('video');
        video.src = src;
        video.muted = true;
        video.play().catch(() => {});
        container.appendChild(video);
    } else {
        const icon = document.createElement('span');
        icon.textContent = 'DOC';
        container.appendChild(icon);
    }
}

function updateFilePreviews(previewArea, fileCollectionSet, inputName) {
    previewArea.innerHTML = '';
    if (fileCollectionSet.size === 0) return;
    fileCollectionSet.forEach(file => {
        const previewItem = document.createElement('div');
        previewItem.classList.add('file-preview');
        const fileName = document.createElement('div');
        fileName.classList.add('file-name');
        fileName.textContent = file.name;
        const removeBtn = document.createElement('button');
        removeBtn.classList.add('remove-btn');
        removeBtn.textContent = 'X';
        removeBtn.onclick = () => {
            if (file.isExisting) {
                if (filesToDelete[inputName]) {
                    filesToDelete[inputName].push(file.url);
                    console.log("Queued for deletion (" + inputName + "): " + file.url);
                }
            }
            fileCollectionSet.delete(file);
            updateFilePreviews(previewArea, fileCollectionSet, inputName);
        };
        if (file.isExisting) {
            renderPreviewElement(previewItem, file.url);
            previewItem.appendChild(fileName);
            previewItem.appendChild(removeBtn);
            previewArea.appendChild(previewItem);
        } else {
            const reader = new FileReader();
            reader.onload = (e) => {
                renderPreviewElement(previewItem, e.target.result);
                previewItem.appendChild(fileName);
                previewItem.appendChild(removeBtn);
                previewArea.appendChild(previewItem);
            };
            reader.readAsDataURL(file);
        }
    });
}

function setupFilePreview(inputElement, previewArea, fileCollectionSet, key) {
    inputElement.addEventListener('change', (event) => {
        Array.from(event.target.files).forEach(file => {
            file._id = file.name + file.lastModified + file.size;
            fileCollectionSet.add(file);
        });
        inputElement.value = '';
        updateFilePreviews(previewArea, fileCollectionSet, key);
    });
}

function showStep(stepNumber) {
    formSections.forEach(s => s.classList.remove('active'));
    document.getElementById(`section${stepNumber}`)?.classList.add('active');
    steps.forEach((s, i) => s.classList.toggle('active', i + 1 === stepNumber));
    prevBtn.style.display = stepNumber > 1 ? 'block' : 'none';
    if (stepNumber === totalSteps) {
        nextBtn.style.display = 'none';
        submitBtn.style.display = 'block';
    } else {
        nextBtn.style.display = 'block';
        submitBtn.style.display = 'none';
    }
}

function handleNextStep() {
    if (validateCurrentStep() && currentStep < totalSteps) {
        currentStep++;
        showStep(currentStep);
    }
}

function handlePrevStep() { if (currentStep > 1) { currentStep--; showStep(currentStep); } }

function validateCurrentStep() {
    if (currentStep === totalSteps) {
        return document.getElementById('termsAgree').checked && document.getElementById('accuracyConfirm').checked;
    }
    return true; 
}

const milestoneCountSpan = document.getElementById('milestoneCount');
const milestonesContainer = document.getElementById('milestonesContainer');
let milestoneCount = 0;
const updateMilestoneCount = () => { milestoneCountSpan.textContent = milestoneCount; };

const addMilestone = () => {
    milestoneCount++;
    updateMilestoneCount();
    const div = document.createElement('div');
    div.className = 'milestone-item';
    div.id = `milestone-${milestoneCount}`;
    div.innerHTML = `
        <label>Milestone ${milestoneCount} Name:</label>
        <input type="text" id="milestoneName-${milestoneCount}" name="milestoneName[]">
        <label>Funding Goal:</label>
        <input type="number" id="milestoneTarget-${milestoneCount}" name="milestoneTarget[]">
    `;
    milestonesContainer.appendChild(div);
};

const removeLastMilestone = () => {
    if (milestoneCount > 0) {
        document.getElementById(`milestone-${milestoneCount}`).remove();
        milestoneCount--;
        updateMilestoneCount();
    }
};

document.getElementById('incrementMilestone').addEventListener('click', addMilestone);
document.getElementById('decrementMilestone').addEventListener('click', removeLastMilestone);

async function editPost(e) {
    e.preventDefault();
    console.group("Mission Update Initiated");
    const formData = new FormData(missionForm);
    const stats = { newImages: 0, newVideos: 0, newDocs: 0 };

    collectedFiles.images.forEach(file => { if (!file.isExisting) { formData.append('images', file); stats.newImages++; } });
    collectedFiles.video.forEach(file => { if (!file.isExisting) { formData.append('video', file); stats.newVideos++; } });
    collectedFiles.documents.forEach(file => { if (!file.isExisting) { formData.append('documents', file); stats.newDocs++; } });

    formData.append('deleteImages', JSON.stringify(filesToDelete.images));
    formData.append('deleteVideos', JSON.stringify(filesToDelete.videos));
    formData.append('deleteDocuments', JSON.stringify(filesToDelete.documents));

    console.log("Summary of changes:", { filesToUpload: stats, filesToPermanentlyDelete: filesToDelete });

    try {
        const token = localStorage.getItem('orbitFundToken');
        const response = await fetch(`${API_BASE_URL}/my-missions/${currentMissionId}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        const result = await response.json();
        if (response.ok) {
            console.log("Update Successful: " + result.message);
            alert("Mission updated successfully!");
            window.location.reload();
        } else {
            console.error("Update Failed: " + result.message);
            alert("Error: " + result.message);
        }
    } catch (err) {
        console.error("Network or System Error: ", err);
    }
    console.groupEnd();
}