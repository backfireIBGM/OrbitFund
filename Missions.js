document.addEventListener('DOMContentLoaded', async () => {
    const API_BASE_URL = 'http://localhost:3000/api';
    const token = localStorage.getItem('orbitFundToken');

    async function fetchAndLogApprovedMissions() {
        try {
            const response = await fetch(`${API_BASE_URL}/missions/approved-missions`, {
                method: 'GET',
                headers: {
                    ...(token && { 'Authorization': `Bearer ${token}` }),
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const approvedMissions = await response.json();
                handleResponse(approvedMissions)
            } else {
                const errorText = await response.text();
                console.error(
                    '--- Failed to fetch approved missions (Response not OK) ---',
                    `Status: ${response.status}`,
                    `Error Text: ${errorText}`
                );
            }
        } catch (error) {
            console.error('--- Network Error Fetching Approved Missions ---');
            console.error(error);
        }
    }

    await fetchAndLogApprovedMissions();
});

function handleResponse(res) {
    console.log(res);

    const missionsDiv = document.querySelector('.missions');

    if (Array.isArray(res) && res.length > 0) {
        res.forEach(mission => {
            createMissionElement(mission, missionsDiv);
        });
    } else {
        emptyMissions();
    }
}

function createMissionElement(mission, containerElement) {
    const missionElement = document.createElement('div');
    missionElement.className = 'mission-item';

    // Call the helper function and store its return value
    const imagesSectionHtml = createImageElementsHtml(mission);

    // Inject the mission details and dynamically generated images HTML
    missionElement.innerHTML = `
        <h3>${mission.title}</h3>
        <p>Current Funding: $${mission.currentFunding.toLocaleString()}</p>
        <p>Goal: $${mission.fundingGoal.toLocaleString()}</p>
        <p>Description: ${mission.description}</p>
        <h4>Images:</h4>
        ${imagesSectionHtml}
        <!-- Videos and Documents will go here later -->
    `;

    containerElement.append(missionElement);
}

function createImageElementsHtml(mission) {
    let imagesHtml = '';
    if (mission.images && mission.images.length > 0) {
        imagesHtml = '<div class="mission-images">';
        mission.images.forEach(imageUrl => {
            imagesHtml += `<div class="mission-image-wrapper">
                               <img src="${imageUrl}" alt="${mission.title} image" loading="lazy">
                           </div>`;
        });
        imagesHtml += '</div>';
    } else {
        imagesHtml = '<p>No images available.</p>';
    }
    return imagesHtml; // Return the generated HTML
}

function emptyMissions(res, containerElement) {
    const noMissionsMessage = document.createElement('p');
    noMissionsMessage.textContent = 'No missions found or data format incorrect.';
    missionsDiv.append(noMissionsMessage);
}