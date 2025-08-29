document.addEventListener('DOMContentLoaded', async () => {
    const API_BASE_URL =
        'https://orbitfund-bzaafpeubnhdhaad.westus-01.azurewebsites.net/api';
    const token = localStorage.getItem('orbitFundToken');

    const submissionIdSelect = document.getElementById('submissionIdSelect');
    const missionDetailsDisplay = document.getElementById(
        'missionDetailsDisplay'
    );

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
                }
            } else {
                console.error(
                    'Failed to fetch pending submission IDs:',
                    response.status,
                    await response.text()
                );
                missionDetailsDisplay.innerHTML = `<p class="empty-state" style="color: red;">Error loading pending submission IDs.</p>`;
            }
        } catch (error) {
            console.error(
                'Network error fetching pending submission IDs:',
                error
            );
            missionDetailsDisplay.innerHTML = `<p class="empty-state" style="color: red;">Network error loading pending submission IDs.</p>`;
        }
    }

    async function fetchSubmissionDetails(id) {
        if (!id) {
            missionDetailsDisplay.innerHTML = `<p class="empty-state">Select a submission ID from the dropdown to view its details.</p>`;
            return;
        }

        missionDetailsDisplay.innerHTML = `<p class="empty-state">Loading details for ID ${id}...</p>`;

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
            } else {
                console.error(
                    'Failed to fetch submission details:',
                    response.status,
                    await response.text()
                );
                missionDetailsDisplay.innerHTML = `<p class="empty-state" style="color: red;">Error loading details for ID ${id}.</p>`;
            }
        } catch (error) {
            console.error(
                `Network error fetching submission details for ID ${id}:`,
                error
            );
            missionDetailsDisplay.innerHTML = `<p class="empty-state" style="color: red;">Network error loading details for ID ${id}.</p>`;
        }
    }

    function displaySubmissionDetails(details) {
        let html = '<div class="mission-details">';

        function formatList(items) {
            if (!items || items.length === 0) return 'N/A';
            return `<div class="media-list">${items
                .map((url) => {
                    const extension = url.split('.').pop().toLowerCase();
                    if (
                        ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(
                            extension
                        )
                    ) {
                        return `<img src="${url}" alt="Image">`;
                    } else if (['mp4', 'webm', 'ogg'].includes(extension)) {
                        return `<video controls src="${url}"></video>`;
                    } else {
                        return `<a href="${url}" target="_blank">${url.split('/').pop()}</a>`;
                    }
                })
                .join('')}</div>`;
        }

        html += `<div><strong>ID:</strong> ${details.id}</div>`;
        html += `<div><strong>Title:</strong> ${details.title || 'N/A'}</div>`;
        html += `<div><strong>Status:</strong> ${
            details.status || 'Pending'
        }</div>`;
        html += `<div><strong>Created At:</strong> ${new Date(
            details.createdAt
        ).toLocaleString()}</div>`;
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
            details.imageUrls
        )}</div>`;
        html += `<div><strong>Videos:</strong> ${formatList(
            details.videoUrls
        )}</div>`;
        html += `<div><strong>Documents:</strong> ${formatList(
            details.documentUrls
        )}</div>`;

        html += '</div>';
        missionDetailsDisplay.innerHTML = html;
    }

    const isAdmin = await verifyAdmin();
    if (isAdmin) {
        await fetchPendingSubmissionIds();

        submissionIdSelect.addEventListener('change', (event) => {
            const selectedId = event.target.value;
            fetchSubmissionDetails(selectedId);
        });
    }
});