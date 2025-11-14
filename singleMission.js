// singleMission.js

document.addEventListener('DOMContentLoaded', async () => {
    const API_BASE_URL = 'http://localhost:3000/api';
    const missionDetailsContainer = document.querySelector('.missions'); // Or your specific container for single mission details

    // --- CORRECTED: Extract mission ID from URL parameters ---
    const urlParams = new URLSearchParams(window.location.search);
    const missionIdToFetch = urlParams.get('id'); // Get the 'id' parameter from the URL (e.g., singleMission.html?id=116)
    // --- End Extraction ---

    if (missionIdToFetch) {
        await fetchAndLogApprovedMission(missionIdToFetch);
    } else {
        console.warn('--- No mission ID found in URL parameters. Cannot fetch single mission. ---');
        if (missionDetailsContainer) {
            missionDetailsContainer.innerHTML = '<p>No mission ID provided. Please go back to the missions list.</p>';
        }
    }

    async function fetchAndLogApprovedMission(missionId) {
        if (!missionId) {
            console.error('--- No Mission ID provided for fetchAndLogApprovedMission ---');
            return;
        }

        try {
            // This URL still uses 'missionId' (lowercase) because it's a dynamic part of the path,
            // matching how typical REST APIs expect the ID in the URL.
            // Your backend's route would typically be something like `/approved-missions/:id`.
            const response = await fetch(`${API_BASE_URL}/approved-missions/${missionId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const approvedMission = await response.json();
                handleResponse(approvedMission);
            } else {
                const errorText = await response.text();
                console.error(
                    '--- Failed to fetch approved mission (Response not OK) ---',
                    `Status: ${response.status}`,
                    `Error Text: ${errorText}`
                );
                if (missionDetailsContainer) {
                    missionDetailsContainer.innerHTML = `<p>Error loading mission: ${response.status} - ${errorText}</p>`;
                }
            }
        } catch (error) {
            console.error('--- Network Error Fetching Approved Mission ---');
            console.error(error);
            if (missionDetailsContainer) {
                missionDetailsContainer.innerHTML = '<p>Network error while loading mission.</p>';
            }
        }
    }
});

function handleResponse(res) {
    console.log(res);

    const missionsDiv = document.querySelector('.missions');
    if (!missionsDiv) {
        console.error('Container element with class ".missions" not found in singleMission.html');
        return;
    }
    missionsDiv.innerHTML = '';

    // --- CORRECTED: Check for res.Id (capital I) from the fetched mission object ---
    if (res && typeof res === 'object' && res.Id) {
        createMissionElement(res, missionsDiv);
    } else {
        emptyMissions(res, missionsDiv);
    }
}

// Ensure these helper functions are accessible in this file
// (defined in this file, or imported if using modules)
function createMissionElement(mission, containerElement) {
    const missionElement = document.createElement('div');
    missionElement.className = 'mission-item'; // Consider renaming to 'single-mission-detail' for clarity

    const imagesSectionHtml = createImageElementsHtml(mission);

    let fundingPercentage = 0;
    if (mission.fundingGoal > 0) {
        fundingPercentage = (mission.currentFunding / mission.fundingGoal) * 100;
        if (fundingPercentage > 100) {
            fundingPercentage = 100;
        }
    }
    const formattedPercentage = fundingPercentage.toFixed(1);

    const milestoneMarkersHtml = createMilestoneMarkersHtml(mission);

    const progressAreaHtml = `
        <div class="mission-progress-area">
            <div class="mission-progress-bar-container">
                <div class="mission-progress-bar-fill" style="width: ${fundingPercentage}%"></div>
                <span class="mission-progress-text">${formattedPercentage}% Funded</span>
                ${milestoneMarkersHtml}
            </div>
        </div>
    `;

    missionElement.innerHTML = `
        <h2>${mission.title}</h2>
        <p>Current Funding: <span class="funding-amount">$${mission.currentFunding.toLocaleString()}</span></p>
        <p>Goal: <span class="funding-amount">$${mission.fundingGoal.toLocaleString()}</span></p>
        ${progressAreaHtml}
        <p>Description: ${mission.description}</p>
        <h4>Images:</h4>
        ${imagesSectionHtml}
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
    return imagesHtml;
}

function createMilestoneMarkersHtml(mission) {
    let milestonesHtml = '';
    if (mission.milestones && mission.milestones.length > 0 && mission.fundingGoal > 0) {
        mission.milestones.sort((a, b) => a.target_amount - b.target_amount);

        let foundNextMilestone = false;
        let milestoneLevel = 0;

        mission.milestones.forEach((milestone) => {
            const milestonePercentage = (milestone.target_amount / mission.fundingGoal) * 100;

            if (milestonePercentage >= 0 && milestonePercentage <= 100) {
                let milestoneStatusClass = '';

                const currentFundingNum = parseFloat(mission.currentFunding);
                const targetAmountNum = parseFloat(milestone.target_amount);

                if (currentFundingNum >= targetAmountNum) {
                    milestoneStatusClass = 'milestone-passed';
                } else if (!foundNextMilestone) {
                    milestoneStatusClass = 'milestone-next';
                    foundNextMilestone = true;
                } else {
                    milestoneStatusClass = 'milestone-future';
                }

                const levelClass = `milestone-level-${milestoneLevel % 2}`;
                milestoneLevel++;

                milestonesHtml += `
                    <div class="milestone-marker ${milestoneStatusClass} ${levelClass}" style="left: ${milestonePercentage}%">
                        <div class="milestone-line"></div>
                        <span class="milestone-name">${milestone.milestone_name} ($${milestone.target_amount.toLocaleString()})</span>
                    </div>
                `;
            }
        });
    }
    return milestonesHtml;
}

function emptyMissions(res, containerElement) {
    const noMissionsMessage = document.createElement('p');
    noMissionsMessage.textContent = 'No missions found or data format incorrect.';
    containerElement.append(noMissionsMessage);
}