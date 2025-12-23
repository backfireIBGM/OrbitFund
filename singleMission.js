document.addEventListener('DOMContentLoaded', async () => {
    const API_BASE_URL = 'http://localhost:3000/api';

    // Define the hardcoded top positions for the "rows" FIRST,
    // so it's accessible by functions defined later.
    // *** THESE VALUES ARE NOW RELATIVE TO THE VIEWPORT TOP ***
    const rowTopPositions = [
        70,
        380,
        690
    ];

    // Define the hardcoded left positions based on the original index
    // *** THESE VALUES ARE NOW RELATIVE TO THE VIEWPORT LEFT ***
    const cardLeftPositions = {
        firstColumn: 100,    // For cards with originalIndex 0, 1, 2
        secondColumn: 1600 // For cards with originalIndex 3, 4, 5
    };

    // Get references to all necessary DOM elements from your HTML
    const missionTitleElem = document.getElementById('mission-title');
    const missionLaunchDateElem = document.getElementById('mission-launch-date');
    const missionHoursToGoElem = document.getElementById('mission-hours-to-go');
    const missionCurrentFundingElem = document.getElementById('mission-current-funding');
    const missionFundingGoalElem = document.getElementById('mission-funding-goal');
    const missionProgressBarFillElem = document.querySelector('.mission-progress-bar-fill');
    const missionProgressTextElem = document.querySelector('.mission-progress-text');
    const milestoneMarkersContainer = document.querySelector('.milestone-markers-container');
    const missionDescriptionElem = document.getElementById('mission-description');
    const missionBudgetBreakdownElem = document.getElementById('mission-budget-breakdown');
    const missionGoalsElem = document.getElementById('mission-goals');
    const missionRewardsElem = document.getElementById('mission-rewards');
    const missionTeamInfoElem = document.getElementById('mission-team-info');

    // References for the Image Carousel
    const missionImagesSection = document.getElementById('mission-images-section');
    const imageCarouselSlidesContainer = missionImagesSection ? missionImagesSection.querySelector('.carousel-slides') : null;
    const imageCarouselPrevButton = missionImagesSection ? missionImagesSection.querySelector('.carousel-button.prev') : null;
    const imageCarouselNextButton = missionImagesSection ? missionImagesSection.querySelector('.carousel-button.next') : null;
    const imageCarouselDotsContainer = missionImagesSection ? missionImagesSection.querySelector('.carousel-dots') : null;
    const noImagesMessage = missionImagesSection ? missionImagesSection.querySelector('.no-images-message') : null;

    // References for the Video Carousel
    const missionVideosSection = document.getElementById('mission-videos-section');
    const videoCarouselSlidesContainer = missionVideosSection ? missionVideosSection.querySelector('.video-carousel-slides') : null;
    const videoCarouselPrevButton = missionVideosSection ? missionVideosSection.querySelector('.video-carousel-button-prev') : null;
    const videoCarouselNextButton = missionVideosSection ? missionVideosSection.querySelector('.video-carousel-button-next') : null;
    const videoCarouselDotsContainer = missionVideosSection ? missionVideosSection.querySelector('.video-carousel-dots') : null;
    const noVideosMessage = missionVideosSection ? missionVideosSection.querySelector('.no-videos-message') : null;

    const missionDocumentsSection = document.getElementById('mission-documents-section');

    const missionDetailsContainer = document.querySelector('.mission-details-container');

    const relatedMissionsWrapper = document.getElementById('related-missions-wrapper');
    const targetContainer = relatedMissionsWrapper;

    const relatedMissionTemplate = document.getElementById('related-Mission');

    const urlParams = new URLSearchParams(window.location.search);
    const currentMissionId = urlParams.get('id');

    // --- Initial checks for template and target container ---
    if (!relatedMissionTemplate) {
        console.error("--- ERROR: HTML template 'related-Mission' not found! Cannot display related missions. ---");
        if (targetContainer) {
            const errorP = document.createElement('p');
            errorP.textContent = 'A critical part of the page content could not be loaded.';
            targetContainer.appendChild(errorP);
        }
        return; // Stop execution if template is missing
    }
    if (!targetContainer) {
        console.error("--- ERROR: Dedicated related missions wrapper (#related-missions-wrapper) not found! Cannot display related missions. ---");
        return; // Stop execution if container is missing
    }
    // Check for relatedMissionsMarker is removed as it's no longer in HTML:
    // if (!relatedMissionsMarker) { console.warn("--- WARNING: ... ---"); }
    // --- End initial checks ---

    const numRelatedMissions = 6;

    if (currentMissionId) {
        await fetchAndDisplaySingleMissionDetails(currentMissionId);
        await fetchAndDisplayRelatedMissions(currentMissionId, numRelatedMissions);
    } else {
        console.warn(
            '--- No mission ID found in URL parameters. Cannot fetch single mission. ---'
        );
        if (missionDetailsContainer) {
            missionDetailsContainer.innerHTML =
                '<p>No mission ID provided. Please go back to the missions list.</p>';
        }
    }

    /**
     * Fetches and displays the details for a single approved mission.
     * @param {string} missionId The ID of the mission to fetch.
     */
    async function fetchAndDisplaySingleMissionDetails(missionId) {
        if (!missionId) {
            console.error(
                '--- No Mission ID provided for fetchAndDisplaySingleMissionDetails ---'
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
                const singleMissionData = await response.json();
                console.log(`--- Fetched Single Mission Details (ID: ${missionId}) ---`, singleMissionData);
                updateMissionDetails(singleMissionData);
            } else {
                const errorText = await response.text();
                console.error(
                    '--- Failed to fetch single mission (Response not OK) ---',
                    `Status: ${response.status}`,
                    `Error Text: ${errorText}`
                );
                if (missionDetailsContainer) {
                    missionDetailsContainer.innerHTML = `<p>Error loading mission: ${response.status} - ${errorText}</p>`;
                }
            }
        } catch (error) {
            console.error('--- Network Error Fetching Single Mission ---');
            console.error(error);
            if (missionDetailsContainer) {
                missionDetailsContainer.innerHTML =
                    '<p>Network error while loading mission.</p>';
            }
        }
    }

    async function fetchAndDisplayRelatedMissions(excludeMissionId, maxMissionsCount) {
        try {
            const response = await fetch(
                `${API_BASE_URL}/missions/approved-missions?maxMissions=${maxMissionsCount}&excludeId=${excludeMissionId}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (response.ok) {
                const relatedMissionsData = await response.json();
                console.log(`--- Fetched ${maxMissionsCount} Related Missions (Excluding ID: ${excludeMissionId}) ---`, relatedMissionsData);
                displayRelatedMissions(relatedMissionsData);
            } else {
                const errorText = await response.text();
                console.error(
                    '--- Failed to fetch related missions (Response not OK) ---',
                    `Status: ${response.status}`,
                    `Error Text: ${errorText}`
                );
                displayRelatedMissions([]); // Call display with empty array on API error
            }
        } catch (error) {
            console.error('--- Network Error Fetching Related Missions ---', error);
            displayRelatedMissions([]); // Call display with empty array on network error
        }
    }

    /**
     * Updates the main mission details section of the page with the provided mission data.
     * @param {object} mission The mission data object.
     */
    function updateMissionDetails(mission) {
        document.title = `OrbitFund | ${mission.title}`;

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
            // Early return if mission data is invalid
        }

        // Update basic text content using null-safe checks (if element exists)
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

        // Handle Images - Carousel
        if (missionImagesSection && imageCarouselSlidesContainer && imageCarouselPrevButton && imageCarouselNextButton && imageCarouselDotsContainer && noImagesMessage) {
            imageCarouselSlidesContainer.innerHTML = ''; // Clear previous images
            imageCarouselDotsContainer.innerHTML = ''; // Clear previous dots
            noImagesMessage.style.display = 'none'; // Hide default message

            if (mission.images && mission.images.length > 0) {
                mission.images.forEach((imageUrl, index) => {
                    // Create slide
                    const slideDiv = document.createElement('div');
                    slideDiv.classList.add('carousel-slide');
                    const imgElem = document.createElement('img');
                    imgElem.src = imageUrl;
                    imgElem.alt = `${mission.title} image ${index + 1}`;
                    imgElem.loading = 'lazy';
                    slideDiv.appendChild(imgElem);
                    imageCarouselSlidesContainer.appendChild(slideDiv);

                    // Create dot
                    const dotSpan = document.createElement('span');
                    dotSpan.classList.add('dot');
                    dotSpan.dataset.index = index;
                    imageCarouselDotsContainer.appendChild(dotSpan);
                });

                // Initialize carousel functionality after images are added
                initCarousel(
                    missionImagesSection,
                    '.carousel-slides', // Default image carousel slides selector
                    '.carousel-button.prev', // Default image carousel prev button selector
                    '.carousel-button.next', // Default image carousel next button selector
                    '.carousel-dots', // Default image carousel dots selector
                    '.no-images-message' // Default image carousel no-content message
                );

            } else {
                noImagesMessage.style.display = 'block'; // Show "No images" message
                // Hide carousel controls if no images
                if (imageCarouselPrevButton) imageCarouselPrevButton.style.display = 'none';
                if (imageCarouselNextButton) imageCarouselNextButton.style.display = 'none';
                if (imageCarouselDotsContainer) imageCarouselDotsContainer.style.display = 'none';
                // Also ensure carousel-slides transform is reset if there were previous images
                if (imageCarouselSlidesContainer) imageCarouselSlidesContainer.style.transform = `translateX(0%)`;
            }
        } else if (missionImagesSection) {
            // Fallback if carousel elements are not found, use old method or show simple message
            missionImagesSection.innerHTML = '<p>Image carousel structure not found. Displaying plain message or alternative.</p>';
            console.error("--- Missing image carousel DOM elements. Check HTML and JS queries. ---");
        }


        // Handle Videos - Carousel
        if (missionVideosSection && videoCarouselSlidesContainer && videoCarouselPrevButton && videoCarouselNextButton && videoCarouselDotsContainer && noVideosMessage) {
            videoCarouselSlidesContainer.innerHTML = ''; // Clear previous videos
            videoCarouselDotsContainer.innerHTML = ''; // Clear previous dots
            noVideosMessage.style.display = 'none'; // Hide default message

            if (mission.videos && mission.videos.length > 0) {
                mission.videos.forEach((videoUrl, index) => {
                    // Create slide
                    const slideDiv = document.createElement('div');
                    slideDiv.classList.add('carousel-slide');
                    const videoElem = document.createElement('video');
                    videoElem.controls = true;
                    videoElem.preload = 'metadata'; // Load metadata, not full video
                    videoElem.setAttribute('width', '100%');
                    videoElem.setAttribute('height', '100%'); // Set height to 100%
                    const sourceElem = document.createElement('source');
                    sourceElem.src = videoUrl;
                    sourceElem.type = 'video/mp4'; // Assuming MP4, adjust if other formats are expected
                    videoElem.appendChild(sourceElem);
                    videoElem.innerHTML += 'Your browser does not support the video tag.'; // Fallback text
                    slideDiv.appendChild(videoElem);
                    videoCarouselSlidesContainer.appendChild(slideDiv);

                    // Create dot
                    const dotSpan = document.createElement('span');
                    dotSpan.classList.add('dot');
                    dotSpan.dataset.index = index;
                    videoCarouselDotsContainer.appendChild(dotSpan);
                });

                // Initialize video carousel functionality
                initCarousel(
                    missionVideosSection,
                    '.video-carousel-slides',
                    '.video-carousel-button-prev',
                    '.video-carousel-button-next',
                    '.video-carousel-dots',
                    '.no-videos-message'
                );

            } else {
                noVideosMessage.style.display = 'block'; // Show "No videos" message
                // Hide carousel controls if no videos
                if (videoCarouselPrevButton) videoCarouselPrevButton.style.display = 'none';
                if (videoCarouselNextButton) videoCarouselNextButton.style.display = 'none';
                if (videoCarouselDotsContainer) videoCarouselDotsContainer.style.display = 'none';
                if (videoCarouselSlidesContainer) videoCarouselSlidesContainer.style.transform = `translateX(0%)`;
            }
        } else if (missionVideosSection) {
            // Fallback if carousel elements are not found, use old method or show simple message
            missionVideosSection.innerHTML = '<p>Video carousel structure not found. Displaying plain message or alternative.</p>';
            console.error("--- Missing video carousel DOM elements. Check HTML and JS queries. ---");
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

    function displayRelatedMissions(missions) {
        const fragment = document.createDocumentFragment();
        targetContainer.innerHTML = ''; // Clear the "Loading related missions..." message

        if (missions && missions.length > 0) {
            const heading = document.createElement('h3');
            targetContainer.appendChild(heading);

            missions.forEach((mission, index) => {
                const cardClone = relatedMissionTemplate.content.cloneNode(true);
                // Calculate which row this card belongs to
                const rowIndex = index % 3; // 0, 1, 2, 0, 1, 2 for indices 0, 1, 2, 3, 4, 5
                fillCard(mission, cardClone, fragment, rowIndex, index); // Pass rowIndex and original index
            });

            targetContainer.appendChild(fragment);

        } else {
            const noMissionsParagraph = document.createElement('p');
            noMissionsParagraph.textContent = 'No related missions found.';
            targetContainer.appendChild(noMissionsParagraph);
        }
    }

    // Modified fillCard to accept rowIndex and originalIndex for positioning
    function fillCard(missionData, cardFragment, appendTargetFragment, rowIndex, originalIndex) {
        const cardLinkElem = cardFragment.querySelector('.related-mission-card-link');
        const titleElem = cardFragment.querySelector('.related-mission-title');
        const descriptionElem = cardFragment.querySelector('.related-mission-description');
        const imageElem = cardFragment.querySelector('img');

        if (titleElem && descriptionElem && cardLinkElem && imageElem) {
            titleElem.textContent = missionData.title || 'Untitled Mission';
            descriptionElem.textContent = missionData.description || 'No description available.';

            // Set the image source
            if (missionData.images && missionData.images.length > 0) {
                imageElem.src = missionData.images[0];
            } else {
                imageElem.style.display = 'none'; // Hide image if no source is available
            }

            if (missionData.Id) {
                cardLinkElem.href = `singleMission.html?id=${missionData.Id}`;
            } else {
                cardLinkElem.removeAttribute('href');
                cardLinkElem.style.cursor = 'default';
            }

            // --- Apply hardcoded top position based on rowIndex ---
            if (rowIndex !== undefined && rowTopPositions[rowIndex] !== undefined) {
                cardLinkElem.style.top = `${rowTopPositions[rowIndex]}px`;
            } else {
                console.warn(`No specific top position for rowIndex ${rowIndex} (original index ${originalIndex}).`);
            }

            // --- Apply hardcoded left position based on originalIndex ---
            let leftPosition;
            if (originalIndex >= 0 && originalIndex <= 2) { // Cards 0, 1, 2
                leftPosition = cardLeftPositions.firstColumn;
            } else if (originalIndex >= 3 && originalIndex <= 5) { // Cards 3, 4, 5
                leftPosition = cardLeftPositions.secondColumn;
            } else {
                console.warn(`No specific left position for original index ${originalIndex}.`);
                leftPosition = 0; // Default or fallback
            }
            cardLinkElem.style.left = `${leftPosition}px`;


        } else {
            console.warn("One or more required elements (title/description/card link/image) not found in cloned template.");
            if (cardLinkElem) {
                cardLinkElem.style.display = 'none';
            }
        }

        if (appendTargetFragment) {
            appendTargetFragment.appendChild(cardFragment);
        } else {
            targetContainer.appendChild(cardFragment);
        }
    }

    /**
     * Generates HTML for milestone markers based on mission funding.
     * @param {object} mission The mission data.
     * @returns {string} HTML string for milestone markers.
     */
    function createMilestoneMarkersHtml(mission) {
        let milestonesHtml = '';
        if (mission.milestones && mission.milestones.length > 0 && mission.fundingGoal > 0) {
            // Sort milestones by target_amount to ensure correct percentage calculation and level assignment
            mission.milestones.sort((a, b) => a.target_amount - b.target_amount);

            let foundNextMilestone = false;
            let milestoneLevel = 0; // To alternate between level-0 and level-1 for CSS styling

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

    /**
     * Formats the mission's launch date into a readable string.
     * @param {object} mission The mission data.
     * @returns {string} The formatted launch date.
     */
    function formatLaunchDate(mission) {
        const launchDate = new Date(mission.launchDate);
        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        };
        return launchDate.toLocaleString(undefined, options);
    }

    /**
     * Calculates the hours remaining until the mission's end date.
     * @param {object} mission The mission data.
     * @returns {number} The number of full hours remaining, or 0 if ended/invalid data.
     */
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


    /**
     * Initializes carousel functionality for a given carousel container.
     * @param {HTMLElement} parentCarouselContainer The main container for the carousel (e.g., missionImagesSection or missionVideosSection).
     * @param {string} slidesSelector CSS selector for the slides container within this carousel.
     * @param {string} prevButtonSelector CSS selector for the previous button.
     * @param {string} nextButtonSelector CSS selector for the next button.
     * @param {string} dotsContainerSelector CSS selector for the dots container.
     * @param {string} noContentMessageSelector CSS selector for the 'no content' message.
     */
    function initCarousel(parentCarouselContainer, slidesSelector, prevButtonSelector, nextButtonSelector, dotsContainerSelector, noContentMessageSelector) {
        const slidesContainer = parentCarouselContainer.querySelector(slidesSelector);
        const slides = parentCarouselContainer.querySelectorAll(`${slidesSelector} > .carousel-slide`);
        const prevButton = parentCarouselContainer.querySelector(prevButtonSelector);
        const nextButton = parentCarouselContainer.querySelector(nextButtonSelector);
        const dotsContainer = parentCarouselContainer.querySelector(dotsContainerSelector);
        const dots = parentCarouselContainer.querySelectorAll(`${dotsContainerSelector} > .dot`);
        const noContentMessage = parentCarouselContainer.querySelector(noContentMessageSelector);

        if (!slidesContainer || slides.length === 0) {
            if (noContentMessage) noContentMessage.style.display = 'block';
            if (prevButton) prevButton.style.display = 'none';
            if (nextButton) nextButton.style.display = 'none';
            if (dotsContainer) dotsContainer.style.display = 'none';
            return; // No content, no carousel needed
        } else {
            // Ensure controls are visible if there is content
            if (prevButton) prevButton.style.display = 'block';
            if (nextButton) nextButton.style.display = 'block';
            if (dotsContainer) dotsContainer.style.display = 'flex';
        }

        let currentIndex = 0;

        function updateCarousel() {
            if (!slidesContainer) return;

            // Stop any playing video when switching slides (important for video carousels)
            // This is a common pattern for video carousels to prevent background audio
            slides.forEach((slide, index) => {
                const video = slide.querySelector('video');
                if (video && index !== currentIndex) {
                    video.pause();
                    video.currentTime = 0; // Reset video to start
                }
            });

            // Calculate the transform needed to show the current slide
            const offset = -currentIndex * 100;
            slidesContainer.style.transform = `translateX(${offset}%)`;

            // Update active dot
            if (dots) {
                dots.forEach((dot, index) => {
                    dot.classList.toggle('active', index === currentIndex);
                });
            }
        }

        function showNextSlide() {
            currentIndex = (currentIndex + 1) % slides.length;
            updateCarousel();
        }

        function showPrevSlide() {
            currentIndex = (currentIndex - 1 + slides.length) % slides.length;
            updateCarousel();
        }

        // Event Listeners for buttons
        if (nextButton) {
            nextButton.addEventListener('click', showNextSlide);
        }
        if (prevButton) {
            prevButton.addEventListener('click', showPrevSlide);
        }

        // Event Listeners for dots
        if (dotsContainer) {
            dotsContainer.addEventListener('click', (event) => {
                if (event.target.classList.contains('dot')) {
                    const index = parseInt(event.target.dataset.index, 10);
                    if (!isNaN(index)) {
                        currentIndex = index;
                        updateCarousel();
                    }
                }
            });
        }

        updateCarousel();
    }
});