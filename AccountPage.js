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
      'AccountPage: Required DOM elements not found.',
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
          const pauseBtn = clone.querySelector('#pause');

          const missionProgressBarFillElem = clone.querySelector(
            '.mission-progress-bar-fill',
          );
          const missionProgressTextElem = clone.querySelector(
            '.mission-progress-text',
          );

          const missionCountdownTimerDiv = clone.querySelector(
            '.mission-countdown-timer',
          );
          
          missionCountdownTimerDiv.setAttribute('data-mission-id', mission.Id);
          missionLink.href = `singleMission.html?id=${mission.Id}`;
          missionTitle.textContent = mission.title || 'Untitled Mission';

          // Status Logic
          const userSetPostStatus = mission.user_approved;
          const adminSetPostStatus = mission.admin_approved;
          let statusText;

          if (userSetPostStatus && adminSetPostStatus) {
            statusText = "Approved";
          } else if (userSetPostStatus && !adminSetPostStatus) {
            statusText = "Waiting for admin to approve.";
          } else if (!userSetPostStatus && adminSetPostStatus) {
            statusText = "Waiting for you to approve.";
          } else {
            statusText = "Mission not yet approved by admin or you";
          }

          missionStatus.textContent = `Status: ${statusText}`;

          // Button and Status Styling
          if (statusText === 'Approved') {
            missionStatus.style.color = 'green';
          } else if (statusText === 'Waiting for admin to approve.' || statusText === 'Waiting for you to approve.') {
            missionStatus.style.color = 'orange';
          }

          // Set Button Text based on state
          if (pauseBtn) {
            pauseBtn.textContent = mission.user_approved ? 'PAUSE' : 'RESUME';
            pauseBtn.addEventListener('click', (e) => {
              e.preventDefault();
              e.stopPropagation(); // Prevents navigating to singleMission.html
              toggleMissionApproval(mission.Id);
            });
          }

          // Funding Logic
          const currentFunding = mission.currentFunding;
          const fundingGoal = mission.fundingGoal;
          missionCurrentFunding.textContent = `$${currentFunding} raised of $${fundingGoal}`;

          let fundingPercentage = 0;
          if (mission.fundingGoal > 0) {
            fundingPercentage = (mission.currentFunding / mission.fundingGoal) * 100;
            if (fundingPercentage > 100) fundingPercentage = 100;
          }
          const formattedPercentage = fundingPercentage.toFixed(1);

          if (missionProgressBarFillElem) {
            missionProgressBarFillElem.style.width = `${fundingPercentage}%`;
          }
          if (missionProgressTextElem) {
            missionProgressTextElem.textContent = `${formattedPercentage}% Funded`;
          }

          userMissionsContainer.appendChild(clone);

          if (mission.endTime) {
            startMissionCountdown(mission.Id, mission.endTime);
          } else {
            const countdownContainer = missionCountdownTimerDiv.closest(
              '.mission-countdown-container',
            );
            if (countdownContainer) {
              const messageElem = countdownContainer.querySelector('.mission-launch-message');
              const labelElem = countdownContainer.querySelector('.countdown-label');
              if (messageElem) messageElem.textContent = 'No deadline set.';
              if (labelElem) labelElem.style.display = 'none';
              missionCountdownTimerDiv.style.display = 'none';
            }
          }
        });
      } else {
        userMissionsContainer.textContent = 'No missions found for this account.';
      }
    } else {
      const errorJson = await response.json();
      userMissionsContainer.textContent = `Failed to load missions: ${errorJson.message || 'Unknown error.'}`;
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

async function toggleMissionApproval(missionId) {
  const token = localStorage.getItem(TOKEN_KEY);
  
  try {
    const response = await fetch(`${backendBaseUrl}/api/user-actions/toggle-approval/${missionId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (response.ok) {
      const timerElem = document.querySelector(`.mission-countdown-timer[data-mission-id="${missionId}"]`);
      if (!timerElem) return;

      const card = timerElem.closest('.mission-card');
      const statusElem = card.querySelector('.mission-status');
      const pauseBtn = card.querySelector('#pause'); 

      const userApproved = data.user_approved;
      const isPublic = data.is_public;
      
      // Update Status and Color
      let statusText;
      if (isPublic) {
        statusText = "Approved";
        statusElem.style.color = 'green';
      } else if (userApproved) {
        statusText = "Waiting for admin to approve.";
        statusElem.style.color = 'orange';
      } else {
        statusText = "Waiting for you to approve.";
        statusElem.style.color = 'orange';
      }
      statusElem.textContent = `Status: ${statusText}`;

      // Update Button Word
      if (pauseBtn) {
        // If userApproved is true, the action should be to PAUSE
        // If userApproved is false, the action should be to RESUME
        pauseBtn.textContent = userApproved ? 'PAUSE' : 'RESUME';
      }
      
    } else {
      alert(`Error: ${data.message}`);
    }
  } catch (error) {
    alert('Failed to connect to server.');
  }
}