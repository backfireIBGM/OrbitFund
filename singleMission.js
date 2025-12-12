document.addEventListener('DOMContentLoaded', async () => {
    const API_BASE_URL = 'http://localhost:3000/api';
    const missionDetailsContainer = document.querySelector('.missions'); // Or your specific container for single mission details

    const urlParams = new URLSearchParams(window.location.search);
    const missionIdToFetch = urlParams.get('id'); // Get the 'id' parameter from the URL (e.g., singleMission.html?id=116)

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

    if (res && typeof res === 'object' && res.Id) {
        createMissionElement(res, missionsDiv);
    } else {
        emptyMissions(res, missionsDiv);
    }
}

function createMissionElement(mission, containerElement) {
    const missionElement = document.createElement('div');

    const imagesSectionHtml = createImageElementsHtml(mission);
    const videosSectionHtml = createVideoElementsHtml(mission);
    const documentsSectionHtml = createDocumentElementsHtml(mission);

    hoursToGo = getHoursToGo(mission);
    missionType = formatMissionType(mission);
    launchDate = formatLaunchDate(mission);

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
<div class="mission-header-box">
    <h2>${mission.title}</h2>
    <div class="mission-info-grid">
        <!-- New Left Group (originally Right) -->
        <div class="mission-info-left">
            <p class="countdown"><span class="label">Launch Date:</span> ${launchDate}</p>
            <p class="countdown"><span class="label">Hours to go:</span> ${hoursToGo}</p>
        </div>

        <!-- The Button in the middle -->
        <div class="mission-button-container">
            <button class="support-button">Support Mission</button>
        </div>

        <!-- New Right Group (originally Left) -->
        <div class="mission-info-right">
            <p class="funding"><span class="label">Current Funding:</span> $${mission.currentFunding.toLocaleString()}</p>
            <p class="funding"><span class="label">Goal:</span> $${mission.fundingGoal ? mission.fundingGoal.toLocaleString() : "N/A"}</p>
        </div>
    </div>

    ${progressAreaHtml}
</div>
<p><span class="label">Description:</span> ${mission.description}</p>
<p><span class="label">Budget Breakdown:</span> ${mission.budgetBreakdown}</p>
<p><span class="label">Goals:</span> ${mission.goals}</p>

<p><span class="label">Rewards:</span> ${mission.rewards}</p>
<p><span class="label">Team Info:</span> ${mission.teamInfo}</p>

<h4 class="label">Images:</h4>
${imagesSectionHtml}
<h4 class="label">Videos:</h4>
${videosSectionHtml}
<h4 class="label">Documents:</h4>
${documentsSectionHtml}
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

function createVideoElementsHtml(mission) {
  let videosHtml = "";
  if (mission.videos && mission.videos.length > 0) {
    videosHtml = '<div class="mission-videos">';
    mission.videos.forEach((videoUrl, index) => {
      videosHtml += `<div class="mission-video-wrapper">
                             <video controls width="100%" height="auto">
                                 <source src="${videoUrl}" type="video/mp4">
                                 Your browser does not support the video tag.
                             </video>
                         </div>`;
    });
    videosHtml += "</div>";
  } else {
    videosHtml = "<p>No videos available.</p>";
  }
  return videosHtml;
}

function createDocumentElementsHtml(mission) {
  let documentsHtml = "";
  if (mission.documents && mission.documents.length > 0) {
    documentsHtml = '<div class="mission-documents">';
    mission.documents.forEach((documentUrl, index) => {
      documentsHtml += `<div class="mission-document-wrapper">
                             <a href="${documentUrl}" target="_blank" rel="noopener noreferrer">
                                 Document ${index + 1} (PDF)
                             </a>
                         </div>`;
    });
    documentsHtml += "</div>";
  } else {
    documentsHtml = "<p>No documents available.</p>";
  }
  return documentsHtml;
}

function createMilestoneMarkersHtml(mission) {
    let milestonesHtml = '';
    if (mission.milestones && mission.milestones.length > 0 && mission.fundingGoal > 0) {
        // Sort milestones by target_amount to ensure correct percentage calculation and level assignment
        mission.milestones.sort((a, b) => a.target_amount - b.target_amount);

        let foundNextMilestone = false;
        let milestoneLevel = 0; // To alternate between level-0 and level-1

        mission.milestones.forEach((milestone) => {
            const milestonePercentage = (milestone.target_amount / mission.fundingGoal) * 100;

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
                // Using modulo 2 will alternate between 0 and 1: 0, 1, 0, 1...
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

 function formatMissionType(mission) {
    return mission.type;
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
  if (!mission || typeof mission !== "object") {
    console.error("Error: 'mission' object is invalid or missing.");
    return 0;
  }
  if (typeof mission.CreatedAt !== "string" || mission.CreatedAt.trim() === "") {
    console.error("Error: 'mission.CreatedAt' is missing or not a valid string.");
    return 0;
  }
  if (typeof mission.duration !== "number" || isNaN(mission.duration) || mission.duration < 0) {
    console.error("Error: 'mission.duration' is missing or not a valid positive number.");
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

function emptyMissions(res, containerElement) {
    const noMissionsMessage = document.createElement('p');
    noMissionsMessage.textContent = 'No missions found or data format incorrect.';
    containerElement.append(noMissionsMessage);
}