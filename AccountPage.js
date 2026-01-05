const TOKEN_KEY = 'orbitFundToken';
const backendBaseUrl = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    const userMissionsContainer = document.getElementById('user-missions-container');
    const missionCardTemplate = document.getElementById('mission-card-template');


    if (!token) {
        console.warn('AccountPage: No authentication token found. Redirecting to index.html.');
        window.location.href = 'index.html';
        return;
    }

    if (!userMissionsContainer || !missionCardTemplate) {
        console.error('AccountPage: Required DOM elements (user-missions-container or mission-card-template) not found.');
        return;
    }

    try {
        const response = await fetch(`${backendBaseUrl}/api/user-missions`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const missionsJson = await response.json();
            console.log('User Missions JSON (success):', missionsJson);

            if (Array.isArray(missionsJson) && missionsJson.length > 0) {
                missionsJson.forEach(mission => {
                    const clone = document.importNode(missionCardTemplate.content, true);
                    const missionLink = clone.querySelector('.mission-card-link');
                    const missionTitle = clone.querySelector('.mission-title');
                    const missionStatus = clone.querySelector('.mission-status');

                    // Query for the progress bar elements WITHIN the cloned template
                    const missionProgressBarFillElem = clone.querySelector('.mission-progress-bar-fill');
                    const missionProgressTextElem = clone.querySelector('.mission-progress-text');


                    // Set the link for the mission page to singleMission.html
                    missionLink.href = `singleMission.html?id=${mission.Id}`;

                    // Populate the template with mission data
                    missionTitle.textContent = mission.title || 'Untitled Mission';
                    const statusText = mission.Status || 'Unknown';
                    missionStatus.textContent = `Status: ${statusText}`;

                    if (statusText === "Approved") {
                        missionStatus.style.color = 'green';
                    } else if (statusText === "Pending") {
                        missionStatus.style.color = 'orange';
                    } else if (statusText === "Rejected") {
                        missionStatus.style.color = 'red';
                    }

                    // Update Progress Bar for THIS mission's card
                    let fundingPercentage = 0;
                    if (mission.fundingGoal > 0) {
                        fundingPercentage = (mission.currentFunding / mission.fundingGoal) * 100;
                        if (fundingPercentage > 100) {
                            fundingPercentage = 100;
                        }
                    }
                    const formattedPercentage = fundingPercentage.toFixed(1);

                    if (missionProgressBarFillElem) {
                        missionProgressBarFillElem.style.width = `${fundingPercentage}%`;
                    }
                    if (missionProgressTextElem) {
                        missionProgressTextElem.textContent = `${formattedPercentage}% Funded`;
                    }

                    userMissionsContainer.appendChild(clone);
                });
            } else {
                userMissionsContainer.textContent = 'No missions found for this account.';
            }

        } else {
            const errorJson = await response.json();
            console.error('User Missions JSON (error) - Status:', response.status, errorJson);
            userMissionsContainer.textContent = `Failed to load missions: ${errorJson.message || 'Unknown error.'}`;
            // Optional: Redirect if the API call with a token fails
            // window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('User Missions JSON (network error):', error);
        userMissionsContainer.textContent = 'Network error: Could not load missions.';
        // Optional: Redirect for network errors
        // window.location.href = 'index.html';
    }
});