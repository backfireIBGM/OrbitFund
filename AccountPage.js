const TOKEN_KEY = 'orbitFundToken';
const backendBaseUrl = 'http://localhost:3000';

// Object to store setInterval IDs for each mission's countdown
const countdownIntervals = {};

// Function to start an individual countdown for a mission card
// Now takes 'targetTimeString' which could be launchDate or endTime
function startMissionCountdown(missionId, targetTimeString) {
  const targetTime = new Date(targetTimeString).getTime();

  // Find the specific countdown timer elements for this mission
  const countdownTimerElem = document.querySelector(
    `.mission-countdown-timer[data-mission-id="${missionId}"]`,
  );
  if (!countdownTimerElem) {
    console.warn(`Countdown timer for mission ${missionId} not found.`);
    return;
  }

  const daysElem = countdownTimerElem.querySelector('.days');
  const hoursElem = countdownTimerElem.querySelector('.hours');
  const minutesElem = countdownTimerElem.querySelector('.minutes');
  const secondsElem = countdownTimerElem.querySelector('.seconds');
  const messageElem = countdownTimerElem
    .closest('.mission-countdown-container')
    .querySelector('.mission-launch-message');
  const labelElem = countdownTimerElem
    .closest('.mission-countdown-container')
    .querySelector('.countdown-label');

  // Clear any existing interval for this mission (in case of re-rendering)
  if (countdownIntervals[missionId]) {
    clearInterval(countdownIntervals[missionId]);
  }

  // Start the new interval
  countdownIntervals[missionId] = setInterval(function () {
    const now = new Date().getTime();
    const distance = targetTime - now;

    if (distance < 0) {
      clearInterval(countdownIntervals[missionId]);
      delete countdownIntervals[missionId];

      if (countdownTimerElem) {
        countdownTimerElem.innerHTML = 'TIME EXPIRED!';
        countdownTimerElem.style.color = '#ff0000'; // Make "TIME EXPIRED!" red
        countdownTimerElem.style.textShadow = '0 0 10px rgba(255, 0, 0, 0.7)';
        countdownTimerElem.style.justifyContent = 'center';
      }
      if (messageElem) messageElem.innerHTML = 'Mission deadline reached.';
      if (labelElem) labelElem.style.display = 'none'; // Hide the "Time Remaining:" label

      return; // Exit early if countdown is over
    }

    // Calculate time components
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
    );
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    // Update the elements
    if (daysElem) daysElem.innerHTML = String(days).padStart(2, '0');
    if (hoursElem) hoursElem.innerHTML = String(hours).padStart(2, '0');
    if (minutesElem) minutesElem.innerHTML = String(minutes).padStart(2, '0');
    if (secondsElem) secondsElem.innerHTML = String(seconds).padStart(2, '0');
  });
}

// Function to load user missions
async function loadUserMissions() {
  const token = localStorage.getItem(TOKEN_KEY);
  const userMissionsContainer = document.getElementById(
    'user-missions-container',
  );
  const missionCardTemplate = document.getElementById('mission-card-template');

  if (!token) {
    console.warn(
      'AccountPage: No authentication token found. Redirecting to index.html.',
    );
    window.location.href = 'index.html';
    return;
  }

  if (!userMissionsContainer || !missionCardTemplate) {
    console.error(
      'AccountPage: Required DOM elements (user-missions-container or mission-card-template) not found.',
    );
    return;
  }

  try {
    const response = await fetch(`${backendBaseUrl}/api/user-missions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const missionsJson = await response.json();
      console.log('User Missions JSON (success):', missionsJson);

      if (Array.isArray(missionsJson) && missionsJson.length > 0) {
        missionsJson.forEach((mission) => {
          const clone = document.importNode(missionCardTemplate.content, true);
          const missionLink = clone.querySelector('.mission-card-link');
          const missionTitle = clone.querySelector('.mission-title');
          const missionStatus = clone.querySelector('.mission-status');
          const missionCurrentFunding = clone.querySelector('.mission-current-funding');

          const missionProgressBarFillElem = clone.querySelector(
            '.mission-progress-bar-fill',
          );
          const missionProgressTextElem = clone.querySelector(
            '.mission-progress-text',
          );

          const missionCountdownTimerDiv = clone.querySelector(
            '.mission-countdown-timer',
          );
          // Set a unique identifier for the countdown timer div
          missionCountdownTimerDiv.setAttribute('data-mission-id', mission.Id);

          missionLink.href = `singleMission.html?id=${mission.Id}`;
          missionTitle.textContent = mission.title || 'Untitled Mission';
          const statusText = mission.Status || 'Unknown';
          missionStatus.textContent = `Status: ${statusText}`;

          if (statusText === 'Approved') {
            missionStatus.style.color = 'green';
          } else if (statusText === 'Pending') {
            missionStatus.style.color = 'orange';
          } else if (statusText === 'Rejected') {
            missionStatus.style.color = 'red';
          }

        const currentFunding = mission.currentFunding;
        const fundingGoal = mission.fundingGoal;
        missionCurrentFunding.textContent = `$${currentFunding} raised of $${fundingGoal}`;

          let fundingPercentage = 0;
          if (mission.fundingGoal > 0) {
            fundingPercentage =
              (mission.currentFunding / mission.fundingGoal) * 100;
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

          // Only start countdown if mission.endTime is a valid (non-null) string
          if (mission.endTime) {
            startMissionCountdown(mission.Id, mission.endTime);
          } else {
            // If no endTime, display a message indicating no deadline
            const countdownContainer = missionCountdownTimerDiv.closest(
              '.mission-countdown-container',
            );
            if (countdownContainer) {
              const messageElem =
                countdownContainer.querySelector('.mission-launch-message');
              const labelElem = countdownContainer.querySelector('.countdown-label');
              if (messageElem) messageElem.textContent = 'No deadline set.';
              if (labelElem) labelElem.style.display = 'none'; // Hide the "Time Remaining:" label
              missionCountdownTimerDiv.style.display = 'none'; // Hide the timer itself
            }
          }
        });
      } else {
        userMissionsContainer.textContent = 'No missions found for this account.';
      }
    } else {
      const errorJson = await response.json();
      console.error(
        'User Missions JSON (error) - Status:',
        response.status,
        errorJson,
      );
      userMissionsContainer.textContent = `Failed to load missions: ${
        errorJson.message || 'Unknown error.'
      }`;
    }
  } catch (error) {
    console.error('User Missions JSON (network error):', error);
    userMissionsContainer.textContent = 'Network error: Could not load missions.';
  }
}

// Ensure the DOM is fully loaded before trying to access and manipulate elements
document.addEventListener('DOMContentLoaded', () => {
  const username = localStorage.getItem('orbitFundUsername');
  const accountInfo = document.getElementById('account-info-top-of-page');
  if (username) {
    document.title = `OrbitFund | ${username}`;
    accountInfo.textContent = `${username} Account Info`;
  }

  loadUserMissions();
});

// Clean up any active countdown intervals when the page is about to be unloaded.
// This prevents memory leaks and ensures no background tasks are left running
// if the user navigates away or closes the tab.
window.addEventListener('beforeunload', () => {
  for (const intervalId of Object.values(countdownIntervals)) {
    clearInterval(intervalId);
  }
});