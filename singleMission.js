document.addEventListener('DOMContentLoaded', async () => {
    const API_BASE_URL = 'http://localhost:3000/api';
    const missionTitleElem = document.getElementById('mission-title');
    const missionLaunchDateElem = document.getElementById('mission-launch-date');
    const missionHoursToGoElem = document.getElementById('mission-hours-to-go');
    const missionCurrentFundingElem = document.getElementById(
        'mission-current-funding'
    );
    const missionFundingGoalElem = document.getElementById(
        'mission-funding-goal'
    );
    const missionProgressBarFillElem = document.querySelector(
        '.mission-progress-bar-fill'
    );
    const missionProgressTextElem = document.querySelector(
        '.mission-progress-text'
    );
    const milestoneMarkersContainer = document.querySelector(
        '.milestone-markers-container'
    );
    const missionDescriptionElem = document.getElementById(
        'mission-description'
    );
    const missionBudgetBreakdownElem = document.getElementById(
        'mission-budget-breakdown'
    );
    const missionGoalsElem = document.getElementById('mission-goals');
    const missionRewardsElem = document.getElementById('mission-rewards');
    const missionTeamInfoElem = document.getElementById('mission-team-info');
    const missionImagesSection = document.getElementById(
        'mission-images-section'
    );
    const missionVideosSection = document.getElementById(
        'mission-videos-section'
    );
    const missionDocumentsSection = document.getElementById(
        'mission-documents-section'
    );
    const missionDetailsContainer = document.querySelector(
        '.mission-details-container'
    ); // Main container for error messages

    const urlParams = new URLSearchParams(window.location.search);
    const missionIdToFetch = urlParams.get('id'); // Get the 'id' parameter from the URL

    if (missionIdToFetch) {
        await fetchAndLogApprovedMission(missionIdToFetch);
    } else {
        console.warn(
            '--- No mission ID found in URL parameters. Cannot fetch single mission. ---'
        );
        if (missionDetailsContainer) {
            missionDetailsContainer.innerHTML =
                '<p>No mission ID provided. Please go back to the missions list.</p>';
        }
    }

    async function fetchAndLogApprovedMission(missionId) {
        if (!missionId) {
            console.error(
                '--- No Mission ID provided for fetchAndLogApprovedMission ---'
            );
            return;
        }

        try {
            const response = await fetch(
                `${API_BASE_URL}/approved-missions/${missionId}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (response.ok) {
                const approvedMission = await response.json();
                updateMissionDetails(approvedMission);
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
                missionDetailsContainer.innerHTML =
                    '<p>Network error while loading mission.</p>';
            }
        }
    }

    function updateMissionDetails(mission) {
        console.log(mission);

        if (!mission || typeof mission !== 'object' || !mission.Id) {
            console.error(
                'Invalid mission data received:',
                mission,
                'in updateMissionDetails'
            );
            if (missionDetailsContainer) {
                missionDetailsContainer.innerHTML =
                    '<p>Error: Could not display mission details due to invalid data.</p>';
            }
            return;
        }

        // Update basic text content
        if (missionTitleElem) missionTitleElem.textContent = mission.title;
        if (missionDescriptionElem)
            missionDescriptionElem.textContent = mission.description;
        if (missionBudgetBreakdownElem)
            missionBudgetBreakdownElem.textContent = mission.budgetBreakdown;
        if (missionGoalsElem) missionGoalsElem.textContent = mission.goals;
        if (missionRewardsElem) missionRewardsElem.textContent = mission.rewards;
        if (missionTeamInfoElem)
            missionTeamInfoElem.textContent = mission.teamInfo;

        // Format and update specific mission data
        const launchDate = formatLaunchDate(mission);
        if (missionLaunchDateElem) missionLaunchDateElem.textContent = launchDate;

        const hoursToGo = getHoursToGo(mission);
        if (missionHoursToGoElem) missionHoursToGoElem.textContent = hoursToGo;

        if (missionCurrentFundingElem)
            missionCurrentFundingElem.textContent = `$${mission.currentFunding.toLocaleString()}`;
        if (missionFundingGoalElem)
            missionFundingGoalElem.textContent = `$${
                mission.fundingGoal ? mission.fundingGoal.toLocaleString() : 'N/A'
            }`;

        // Update Progress Bar
        let fundingPercentage = 0;
        if (mission.fundingGoal > 0) {
            fundingPercentage = (mission.currentFunding / mission.fundingGoal) * 100;
            if (fundingPercentage > 100) {
                fundingPercentage = 100;
            }
        }
        const formattedPercentage = fundingPercentage.toFixed(1);

        if (missionProgressBarFillElem)
            missionProgressBarFillElem.style.width = `${fundingPercentage}%`;
        if (missionProgressTextElem)
            missionProgressTextElem.textContent = `${formattedPercentage}% Funded`;

        // Create and inject milestone markers
        if (milestoneMarkersContainer) {
            milestoneMarkersContainer.innerHTML = createMilestoneMarkersHtml(
                mission
            );
        }

        // Handle Images
        if (missionImagesSection) {
            let imagesHtml = '';
            if (mission.images && mission.images.length > 0) {
                imagesHtml = ''; // Clear "No images" message
                mission.images.forEach((imageUrl) => {
                    imagesHtml += `<div class="mission-image-wrapper">
                                       <img src="${imageUrl}" alt="${mission.title} image" loading="lazy">
                                   </div>`;
                });
            } else {
                imagesHtml = '<p>No images available.</p>';
            }
            missionImagesSection.innerHTML = imagesHtml;
        }

        // Handle Videos
        if (missionVideosSection) {
            let videosHtml = '';
            if (mission.videos && mission.videos.length > 0) {
                videosHtml = ''; // Clear "No videos" message
                mission.videos.forEach((videoUrl) => {
                    videosHtml += `<div class="mission-video-wrapper">
                                       <video controls width="100%" height="auto">
                                           <source src="${videoUrl}" type="video/mp4">
                                           Your browser does not support the video tag.
                                       </video>
                                   </div>`;
                });
            } else {
                videosHtml = '<p>No videos available.</p>';
            }
            missionVideosSection.innerHTML = videosHtml;
        }

        // Handle Documents
        if (missionDocumentsSection) {
            let documentsHtml = '';
            if (mission.documents && mission.documents.length > 0) {
                documentsHtml = ''; // Clear "No documents" message
                mission.documents.forEach((documentUrl, index) => {
                    documentsHtml += `<div class="mission-document-wrapper">
                                           <a href="${documentUrl}" target="_blank" rel="noopener noreferrer">
                                               Document ${index + 1} (PDF)
                                           </a>
                                       </div>`;
                });
            } else {
                documentsHtml = '<p>No documents available.</p>';
            }
            missionDocumentsSection.innerHTML = documentsHtml;
        }
    }

    function createMilestoneMarkersHtml(mission) {
        let milestonesHtml = '';
        if (mission.milestones && mission.milestones.length > 0 && mission.fundingGoal > 0) {
            // Sort milestones by target_amount to ensure correct percentage calculation and level assignment
            mission.milestones.sort((a, b) => a.target_amount - b.target_amount);

            let foundNextMilestone = false;
            let milestoneLevel = 0; // To alternate between level-0 and level-1

            mission.milestones.forEach((milestone) => {
                const milestonePercentage =
                    (milestone.target_amount / mission.fundingGoal) * 100;

                // Ensure the percentage is within valid bounds (0-100)
                if (milestonePercentage >= 0 && milestonePercentage <= 100) {
                    let milestoneStatusClass = '';

                    const currentFundingNum = parseFloat(mission.currentFunding);
                    const targetAmountNum = parseFloat(milestone.target_amount);

                    if (currentFundingNum >= targetAmountNum) {
                        milestoneStatusClass = 'milestone-passed';
                    } else if (!foundNextMilestone) {
                        // This is the first milestone not yet funded
                        milestoneStatusClass = 'milestone-next';
                        foundNextMilestone = true; // Mark that the 'next' milestone has been found
                    } else {
                        milestoneStatusClass = 'milestone-future';
                    }

                    // Determine the level class for alternating positions
                    const levelClass = `milestone-level-${milestoneLevel % 2}`;

                    milestonesHtml += `
                        <div
                            class="milestone-marker ${milestoneStatusClass} ${levelClass}"
                            style="--milestone-left: ${milestonePercentage}%"
                        >
                            <div class="milestone-line"></div>
                            <span class="milestone-name">
                                ${milestone.milestone_name} ($${milestone.target_amount.toLocaleString()})
                            </span>
                        </div>
                    `;
                    milestoneLevel++; // Increment level for the next milestone
                }
            });
        }
        return milestonesHtml;
    }

    function formatLaunchDate(mission) {
        const launchDate = new Date(mission.launchDate);
        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        };
        return launchDate.toLocaleString(undefined, options);
    }

    function getHoursToGo(mission) {
        // --- Input Validation ---
        if (!mission || typeof mission !== 'object') {
            console.error("Error: 'mission' object is invalid or missing.");
            return 0;
        }
        if (
            typeof mission.CreatedAt !== 'string' ||
            mission.CreatedAt.trim() === ''
        ) {
            console.error(
                "Error: 'mission.CreatedAt' is missing or not a valid string."
            );
            return 0;
        }
        if (
            typeof mission.duration !== 'number' ||
            isNaN(mission.duration) ||
            mission.duration < 0
        ) {
            console.error(
                "Error: 'mission.duration' is missing or not a valid positive number."
            );
            return 0;
        }

        const createdAt = new Date(mission.CreatedAt);
        const durationDays = mission.duration;

        const durationMilliseconds = durationDays * 24 * 60 * 60 * 1000;
        const endDate = new Date(createdAt.getTime() + durationMilliseconds);

        const now = new Date();

        const timeDifferenceMilliseconds = endDate.getTime() - now.getTime();

        let hoursToGo = Math.max(0, timeDifferenceMilliseconds / (1000 * 60 * 60));

        // Round down to the nearest whole hour to get an integer
        hoursToGo = Math.floor(hoursToGo);

        return hoursToGo;
    }
});