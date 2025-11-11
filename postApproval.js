document.addEventListener('DOMContentLoaded', async () => {
    const API_BASE_URL = 'http://localhost:3000/api';
    const token = localStorage.getItem('orbitFundToken');

    const submissionIdSelect = document.getElementById('submissionIdSelect');
    const missionDetailsDisplay = document.getElementById(
        'missionDetailsDisplay'
    );

    const approvalActionsDiv = document.getElementById('approvalActions');
    const approveBtn = document.getElementById('approveBtn');
    const rejectBtn = document.getElementById('rejectBtn');

    let currentSubmissionId = null; // Store the ID of the currently displayed submission

    async function verifyAdmin() {
        if (!token) {
            window.location.href = 'index.html';
            return false;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/Users/verifyAdmin`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                console.log('Admin verified! Welcome to the approval zone.');
                return true;
            } else {
                const errorData = await response.json();
                console.warn(
                    'Admin verification failed:',
                    response.status,
                    errorData.message || 'Not authorized or forbidden.'
                );
                alert(
                    'You do not have administrative privileges to view this page.'
                );
                window.location.href = 'index.html';
                return false;
            }
        } catch (error) {
            console.error('Error during admin verification:', error);
            alert(
                'A network error occurred while verifying your permissions. Please try again.'
            );
            window.location.href = 'index.html'; // Redirect on network/server errors
            return false;
        }
    }

    async function fetchPendingSubmissionIds() {
        try {
            const response = await fetch(
                `${API_BASE_URL}/Approval/pending-ids`,
                {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (response.ok) {
                const ids = await response.json();
                console.log('Fetched Pending Submission IDs:', ids);
                if (ids.length === 0) {
                    submissionIdSelect.innerHTML =
                        '<option value="">-- No Pending Submissions --</option>';
                    missionDetailsDisplay.innerHTML = `<p class="empty-state">No pending missions to approve right now!</p>`;
                    // Hide approval actions if no pending submissions
                    if (approvalActionsDiv) approvalActionsDiv.style.display = 'none';
                } else {
                    // Clear previous options except the default one
                    submissionIdSelect.innerHTML =
                        '<option value="">-- Select an ID --</option>';
                    ids.forEach((id) => {
                        const option = document.createElement('option');
                        option.value = id;
                        option.textContent = `Submission ID: ${id}`;
                        submissionIdSelect.appendChild(option);
                    });
                     // Re-select if current ID is still in the list, otherwise clear
                    if (currentSubmissionId && ids.includes(parseInt(currentSubmissionId))) {
                        submissionIdSelect.value = currentSubmissionId;
                    } else {
                        currentSubmissionId = null;
                        submissionIdSelect.value = "";
                        missionDetailsDisplay.innerHTML = `<p class="empty-state">Select a submission ID from the dropdown to view its details.</p>`;
                        if (approvalActionsDiv) approvalActionsDiv.style.display = 'none';
                    }
                }
            } else {
                console.error(
                    'Failed to fetch pending submission IDs:',
                    response.status,
                    await response.text()
                );
                missionDetailsDisplay.innerHTML = `<p class="empty-state" style="color: red;">Error loading pending submission IDs.</p>`;
                if (approvalActionsDiv) approvalActionsDiv.style.display = 'none';
            }
        } catch (error) {
            console.error(
                'Network error fetching pending submission IDs:',
                error
            );
            missionDetailsDisplay.innerHTML = `<p class="empty-state" style="color: red;">Network error loading pending submission IDs.</p>`;
            if (approvalActionsDiv) approvalActionsDiv.style.display = 'none';
        }
    }

    async function fetchSubmissionDetails(id) {
        if (!id) {
            currentSubmissionId = null; // Clear the stored ID
            missionDetailsDisplay.innerHTML = `<p class="empty-state">Select a submission ID from the dropdown to view its details.</p>`;
            if (approvalActionsDiv) approvalActionsDiv.style.display = 'none'; // Hide buttons
            return;
        }

        currentSubmissionId = id; // Store the currently viewed ID
        missionDetailsDisplay.innerHTML = `<p class="empty-state">Loading details for ID ${id}...</p>`;
        if (approvalActionsDiv) approvalActionsDiv.style.display = 'none'; // Hide buttons while loading

        try {
            const response = await fetch(`${API_BASE_URL}/Approval/${id}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const details = await response.json();
                console.log('Fetched Submission Details:', details);
                displaySubmissionDetails(details);
                if (approvalActionsDiv) approvalActionsDiv.style.display = 'block'; // Show buttons after details load
            } else {
                console.error(
                    'Failed to fetch submission details:',
                    response.status,
                    await response.text()
                );
                missionDetailsDisplay.innerHTML = `<p class="empty-state" style="color: red;">Error loading details for ID ${id}.</p>`;
                if (approvalActionsDiv) approvalActionsDiv.style.display = 'none';
            }
        } catch (error) {
            console.error(
                `Network error fetching submission details for ID ${id}:`,
                error
            );
            missionDetailsDisplay.innerHTML = `<p class="empty-state" style="color: red;">Network error loading details for ID ${id}.</p>`;
            if (approvalActionsDiv) approvalActionsDiv.style.display = 'none';
        }
    }

    function displaySubmissionDetails(details) {
        let html = '<div class="mission-details">';

        function formatList(items, type) { // Added 'type' argument for potential future differentiation
            if (!items || items.length === 0) return 'N/A';
            return `<div class="media-list">${items
                .map((url) => {
                    const extension = url.split('.').pop().toLowerCase();
                    if (
                        ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(
                            extension
                        )
                    ) {
                        return `<img src="${url}" alt="${type} Image">`;
                    } else if (['mp4', 'webm', 'ogg'].includes(extension)) {
                        return `<video controls src="${url}"></video>`;
                    } else {
                        return `<a href="${url}" target="_blank">${url.split('/').pop() || 'Document'}</a>`;
                    }
                })
                .join('')}</div>`;
        }

        html += `<div><strong>ID:</strong> ${details.id}</div>`;
        html += `<div><strong>Title:</strong> ${details.title || 'N/A'}</div>`;
        html += `<div><strong>Status:</strong> ${
            details.status || 'Pending'
        }</div>`;
        html += `<div><strong>Created At:</strong> ${
            details.createdAt
                ? new Date(details.createdAt).toLocaleString()
                : 'N/A'
        }</div>`;
        html += `<div><strong>Description:</strong> ${
            details.description || 'N/A'
        }</div>`;
        html += `<div><strong>Goals:</strong> ${details.goals || 'N/A'}</div>`;
        html += `<div><strong>Type:</strong> ${details.type || 'N/A'}</div>`;
        html += `<div><strong>Launch Date:</strong> ${
            details.launchDate
                ? new Date(details.launchDate).toLocaleDateString()
                : 'N/A'
        }</div>`;
        html += `<div><strong>Team Info:</strong> ${
            details.teamInfo || 'N/A'
        }</div>`;
        html += `<div><strong>Funding Goal:</strong> $${
            details.fundingGoal?.toLocaleString() || '0'
        }</div>`;
        html += `<div><strong>Duration:</strong> ${
            details.duration ? `${details.duration} days` : 'N/A'
        }</div>`;
        html += `<div><strong>Budget Breakdown:</strong> ${
            details.budgetBreakdown || 'N/A'
        }</div>`;
        html += `<div><strong>Rewards:</strong> ${
            details.rewards || 'N/A'
        }</div>`;
        html += `<div><strong>Images:</strong> ${formatList(
            details.imageUrls, 'image'
        )}</div>`;
        html += `<div><strong>Videos:</strong> ${formatList(
            details.videoUrls, 'video'
        )}</div>`;
        html += `<div><strong>Documents:</strong> ${formatList(
            details.documentUrls, 'document'
        )}</div>`;

        html += '</div>';
        missionDetailsDisplay.innerHTML = html;
    }

    async function updateSubmissionStatus(id, newStatus, adminNotes = null) {
        if (!id) return;

        // Confirmation for rejection
        if (newStatus === 'Rejected') {
            const confirmation = prompt(`Are you sure you want to REJECT submission ID ${id}? Please provide a brief reason:`);
            if (confirmation === null || confirmation.trim() === '') {
                alert('Rejection cancelled or no reason provided.');
                return;
            }
            adminNotes = confirmation.trim();
        } else if (newStatus === 'Approved') {
            const confirmation = confirm(`Are you sure you want to APPROVE submission ID ${id}?`);
            if (!confirmation) {
                alert('Approval cancelled.');
                return;
            }
        }


        try {
            const response = await fetch(`${API_BASE_URL}/Approval/update-status`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: parseInt(id),
                    newStatus: newStatus,
                    adminNotes: adminNotes
                }),
            });

            if (response.ok) {
                const result = await response.json();
                alert(result.message);
                // After successful update, re-fetch pending IDs to update the dropdown
                await fetchPendingSubmissionIds();
                // Clear the displayed details as this submission is no longer pending
                missionDetailsDisplay.innerHTML = `<p class="empty-state">Select a submission ID from the dropdown to view its details.</p>`;
                if (approvalActionsDiv) approvalActionsDiv.style.display = 'none'; // Hide buttons
                currentSubmissionId = null; // Clear current selection
                submissionIdSelect.value = ""; // Reset dropdown
            } else {
                const errorData = await response.json();
                console.error(
                    `Failed to ${newStatus.toLowerCase()} submission ${id}:`,
                    response.status,
                    errorData.message || errorData
                );
                alert(`Error: ${errorData.message || `Failed to ${newStatus.toLowerCase()} submission.`}`);
            }
        } catch (error) {
            console.error(
                `Network error updating status for submission ${id}:`,
                error
            );
            alert(`Network error: Could not connect to the server to ${newStatus.toLowerCase()} submission.`);
        }
    }

    const isAdmin = await verifyAdmin();
    if (isAdmin) {
        await fetchPendingSubmissionIds();

        submissionIdSelect.addEventListener('change', (event) => {
            const selectedId = event.target.value;
            fetchSubmissionDetails(selectedId);
        });

        // Add event listeners for the new buttons if they exist
        if (approveBtn) {
            approveBtn.addEventListener('click', () => {
                if (currentSubmissionId) {
                    updateSubmissionStatus(currentSubmissionId, 'Approved');
                } else {
                    alert('Please select a submission to approve.');
                }
            });
        }

        if (rejectBtn) {
            rejectBtn.addEventListener('click', () => {
                if (currentSubmissionId) {
                    updateSubmissionStatus(currentSubmissionId, 'Rejected');
                } else {
                    alert('Please select a submission to reject.');
                }
            });
        }
    }
});