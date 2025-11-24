document.addEventListener('DOMContentLoaded', async () => {
    const API_BASE_URL = 'http://localhost:3000/api';

    async function fetchAndLogApprovedMissions() {
        try {
            const response = await fetch(`${API_BASE_URL}/missions/approved-missions`, {
                method: 'GET',
                headers: {
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
        missionsDiv.innerHTML = '';
        res.forEach(mission => {
            createMissionElement(mission, missionsDiv);
        });
    } else {
        emptyMissions(res, missionsDiv);
    }
}

function createMissionElement(mission, containerElement) {
    const missionElement = document.createElement('div');
    missionElement.className = 'mission-item';

    missionElement.addEventListener('click', () => {
        if (mission.Id) {
            window.location.href = `singleMission.html?id=${mission.Id}`;
        } else {
            console.error('Mission ID is missing for this element, cannot navigate.');
        }
    });

    const imagesSectionHtml = createImageElementsHtml(mission);

    let fundingPercentage = 0;
    if (mission.fundingGoal > 0) {
        fundingPercentage = (mission.currentFunding / mission.fundingGoal) * 100;
        if (fundingPercentage > 100) {
            fundingPercentage = 100;
        }
    }
    const formattedPercentage = fundingPercentage.toFixed(1);


    const progressAreaHtml = `
        <div class="mission-progress-area">
            <div class="mission-progress-bar-container">
                <div class="mission-progress-bar-fill" style="width: ${fundingPercentage}%"></div>
                <span class="mission-progress-text">${formattedPercentage}% Funded</span>
            </div>
        </div>
    `;

    missionElement.innerHTML = `
        <h3>${mission.title}</h3>
        ${progressAreaHtml}
        ${imagesSectionHtml}
    `;

    containerElement.append(missionElement);
}

function createImageElementsHtml(mission) {
    let imagesHtml = '';
    if (mission.images && mission.images.length > 0) {
        imagesHtml = `
        <div class="mission-images">
        <div class="mission-image-wrapper">
            <img src="${mission.images[0]}" alt="${mission.title} image" loading="lazy">
        </div>
        </div>
        `;
    } else {
        imagesHtml = '<p>No images available.</p>';
    }
    return imagesHtml;
}

function emptyMissions(res, containerElement) {
    const noMissionsMessage = document.createElement('p');
    noMissionsMessage.textContent = 'No missions found or data format incorrect.';
    missionsDiv.append(noMissionsMessage);
}