const API_URL = "https://vstad-api.cheatdev.online/api/playlists";
const VIDEO_API_URL = "https://vstad-api.cheatdev.online/api/admin/videos";
const USER_API_URL = "https://vstad-api.cheatdev.online/api/admin/users";
const AUTH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZXhwIjoxNzcyNDI1ODQzfQ.huyiiI0bOXoyjMfykVwoU20M6uWE5xdYnJMA1Q78Pbw";

// DOM Elements
const tableBody = document.getElementById('table-body');
const feedbackDiv = document.getElementById('playlist-feedback');
const modalOverlay = document.getElementById('modal-overlay');
const playlistForm = document.getElementById('playlist-form');
const modalTitle = document.querySelector('#modal-overlay h2');
const submitBtn = document.getElementById('submit-playlist-btn');
const createPlaylistBtn = document.getElementById('create-playlist-btn');

// Video Modal Elements
const videoModalOverlay = document.getElementById('video-modal-overlay');
const videoSelect = document.getElementById('video-select');
const addVideoBtn = document.getElementById('add-video-btn');
const playlistVideosList = document.getElementById('playlist-videos-list');
const closeVideoModalBtn = document.getElementById('close-video-modal-btn');
const doneVideoModalBtn = document.getElementById('done-video-modal-btn');

// State
let currentPlaylists = [];
let allVideos = [];
let isEditing = false;
let editingId = null;
let currentPlaylistId = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    fetchAdminPlaylists(); // Try fetching admin's playlists first
    fetchAllVideos();
    setupEventListeners();
});

function setupEventListeners() {
    // Create Button
    createPlaylistBtn.addEventListener('click', () => {
        openModal();
    });

    // Modal Close Buttons
    document.getElementById('close-modal-btn').addEventListener('click', closeModal);
    document.getElementById('cancel-modal-btn').addEventListener('click', closeModal);

    // Close on overlay click
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });

    // Form Submit - attach to the submit button directly
    submitBtn.addEventListener('click', (e) => {
        e.preventDefault();
        handleFormSubmit(e);
    });
    
    // Also handle form submit event
    playlistForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handleFormSubmit(e);
    });

    // Table Actions (Delegation)
    tableBody.addEventListener('click', handleTableActions);

    // Video Modal Listeners
    closeVideoModalBtn.addEventListener('click', closeVideoModal);
    doneVideoModalBtn.addEventListener('click', closeVideoModal);
    videoModalOverlay.addEventListener('click', (e) => {
        if (e.target === videoModalOverlay) closeVideoModal();
    });
    addVideoBtn.addEventListener('click', handleAddVideo);
}

// Try fetching playlists for the current admin user (ID: 1)
async function fetchAdminPlaylists() {
    try {
        // Show loading state
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-4 text-center text-gray-500">
                    <i class="fas fa-spinner fa-spin mr-2"></i>Loading playlists...
                </td>
            </tr>
        `;

        // Fetch playlists using the correct endpoint
        const adminId = 1; // Admin user ID
        
        const response = await fetch(`https://vstad-api.cheatdev.online/api/playlists/user/${adminId}`, {
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 404) {
            // Admin has no playlists yet
            renderPlaylists([]);
            return;
        }

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Authentication failed. Please refresh your token.');
            }
            throw new Error(`Failed to fetch playlists: ${response.statusText}`);
        }
        
        const playlists = await response.json();
        console.log('Fetched playlists:', playlists);

        if (!playlists || playlists.length === 0) {
            renderPlaylists([]);
            return;
        }

        // Fetch admin user details for creator name
        const userResponse = await fetch(`${USER_API_URL}`, {
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        let adminUser = null;
        if (userResponse.ok) {
            const users = await userResponse.json();
            adminUser = users.find(u => u.id === adminId);
        }

        // Attach creator info to each playlist
        currentPlaylists = playlists.map(playlist => ({
            ...playlist,
            creator_name: adminUser ? (adminUser.username || adminUser.full_name || 'Admin') : 'Admin'
        }));

        console.log('Processed playlists:', currentPlaylists);
        renderPlaylists(currentPlaylists);

    } catch (error) {
        console.error('Error fetching playlists:', error);
        displayFeedback(error.message || 'Failed to load playlists', 'error');
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-4 text-center text-red-500">
                    <i class="fas fa-exclamation-triangle mr-2"></i>${error.message || 'Failed to load playlists'}
                </td>
            </tr>
        `;
    }
}

// Fetch All Videos (for dropdown)
async function fetchAllVideos() {
    try {
        const response = await fetch(VIDEO_API_URL, {
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch videos');
        }

        const data = await response.json();
        allVideos = data;
        populateVideoDropdown(data);
    } catch (error) {
        console.error('Error fetching videos:', error);
        displayFeedback('Failed to load videos', 'error');
    }
}

function populateVideoDropdown(videos) {
    videoSelect.innerHTML = '<option value="">Select a video...</option>';
    videos.forEach(video => {
        const option = document.createElement('option');
        option.value = video.id;
        option.textContent = video.title || video.description || `Video #${video.id}`;
        videoSelect.appendChild(option);
    });
}

// Render Playlists
function renderPlaylists(playlists) {
    tableBody.innerHTML = '';

    if (playlists.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-4 text-center text-gray-500">
                    No playlists found. Create one to get started.
                </td>
            </tr>
        `;
        updateTotalCount(0);
        return;
    }

    playlists.forEach(playlist => {
        const row = createPlaylistRow(playlist);
        tableBody.insertAdjacentHTML('beforeend', row);
    });

    updateTotalCount(playlists.length);
}

function updateTotalCount(count) {
    const totalCountElement = document.getElementById('total-count');
    if (totalCountElement) {
        totalCountElement.textContent = count;
    }
}

function createPlaylistRow(playlist) {
    const isPublic = playlist.is_public;
    const status = isPublic ? 'Public' : 'Private';
    const statusColor = isPublic ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
    const statusBadge = `<span class="${statusColor} text-xs font-medium px-2.5 py-0.5 rounded-full inline-block">${status}</span>`;

    // Video count - assuming it might be in the object or we default to 0
    const videoCount = playlist.videos ? playlist.videos.length : (playlist.video_count || 0);
    const creatorName = playlist.creator_name || `Creator #${playlist.creator_id}`;

    return `
        <tr class="hover:bg-blue-50 transition-colors" data-id="${playlist.id}">
            <td class="px-6 py-4"><input type="checkbox" class="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" /></td>
            <td class="px-6 py-4 font-medium text-gray-900 truncate max-w-xs">${escapeHtml(playlist.title)}</td>
            <td class="px-6 py-4 text-gray-600 hidden md:table-cell">${escapeHtml(creatorName)}</td>
            <td class="px-6 py-4 text-gray-600 hidden sm:table-cell">${videoCount} Videos</td>
            <td class="px-6 py-4">${statusBadge}</td>
            <td class="px-6 py-4 text-center space-x-2 flex justify-center items-center">
                <button title="View Playlist Videos" class="action-btn btn-view" data-action="view">
                    <i class="fas fa-eye text-lg pointer-events-none"></i>
                </button>
                <button title="Edit Playlist" class="action-btn btn-edit" data-action="edit">
                    <i class="fas fa-edit text-lg pointer-events-none"></i>
                </button>
                <button title="Delete Playlist" class="action-btn btn-delete" data-action="delete">
                    <i class="fas fa-trash-alt text-lg pointer-events-none"></i>
                </button>
            </td>
        </tr>
    `;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Handle Table Actions
function handleTableActions(e) {
    const btn = e.target.closest('button');
    if (!btn) return;

    const row = btn.closest('tr');
    const id = row.dataset.id;
    const action = btn.dataset.action;

    if (action === 'delete') {
        deletePlaylist(id);
    } else if (action === 'edit') {
        openEditModal(id);
    } else if (action === 'view') {
        openVideoModal(id);
    }
}

// Modal Functions
function openModal() {
    isEditing = false;
    editingId = null;
    playlistForm.reset();
    modalTitle.innerHTML = '<i class="fas fa-plus-circle text-blue-600 mr-3"></i>Create New Playlist';
    submitBtn.innerHTML = '<i class="fas fa-check mr-2"></i>Create Playlist';
    modalOverlay.classList.remove('hidden');
}

function openEditModal(id) {
    const playlist = currentPlaylists.find(p => p.id == id);
    if (!playlist) return;

    isEditing = true;
    editingId = id;

    document.getElementById('playlist-title').value = playlist.title;
    document.getElementById('playlist-description').value = playlist.description || '';
    document.getElementById('playlist-status').value = playlist.is_public.toString();

    modalTitle.innerHTML = '<i class="fas fa-edit text-blue-600 mr-3"></i>Edit Playlist';
    submitBtn.innerHTML = '<i class="fas fa-save mr-2"></i>Update Playlist';
    modalOverlay.classList.remove('hidden');
}

function closeModal() {
    modalOverlay.classList.add('hidden');
    playlistForm.reset();
    isEditing = false;
    editingId = null;
}

// Form Submit Handler
async function handleFormSubmit(e) {
    e.preventDefault();

    const title = document.getElementById('playlist-title').value.trim();
    const description = document.getElementById('playlist-description').value.trim();
    const isPublic = document.getElementById('playlist-status').value === 'true';

    // Validation
    if (!title) {
        displayFeedback('Please enter a playlist title', 'error');
        return;
    }

    const payload = {
        title,
        description,
        is_public: isPublic
    };

    // Disable submit button to prevent double submission
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Saving...';

    try {
        let url = API_URL;
        let method = 'POST';

        if (isEditing) {
            url = `${API_URL}/${editingId}`;
            method = 'PUT';
        }

        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || errorData.message || 'Operation failed');
        }

        const result = await response.json();
        console.log('Playlist saved:', result);

        displayFeedback(
            isEditing ? 'Playlist updated successfully!' : 'Playlist created successfully!', 
            'success'
        );
        closeModal();
        await fetchAdminPlaylists(); // Refresh list

    } catch (error) {
        console.error('Error saving playlist:', error);
        displayFeedback(error.message || 'Failed to save playlist', 'error');
    } finally {
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.innerHTML = isEditing 
            ? '<i class="fas fa-save mr-2"></i>Update Playlist' 
            : '<i class="fas fa-check mr-2"></i>Create Playlist';
    }
}

// Delete Playlist
async function deletePlaylist(id) {
    if (!confirm('Are you sure you want to delete this playlist? This action cannot be undone.')) return;

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || errorData.message || 'Failed to delete playlist');
        }

        const result = await response.json();
        console.log('Delete response:', result);

        displayFeedback('Playlist deleted successfully!', 'success');
        await fetchAdminPlaylists(); // Refresh list

    } catch (error) {
        console.error('Error deleting playlist:', error);
        displayFeedback(error.message || 'Failed to delete playlist', 'error');
    }
}

// Video Management Functions
async function openVideoModal(id) {
    currentPlaylistId = id;
    videoModalOverlay.classList.remove('hidden');
    playlistVideosList.innerHTML = '<div class="text-center text-gray-500 py-4"><i class="fas fa-spinner fa-spin mr-2"></i>Loading videos...</div>';

    try {
        // Fetch playlist details to get videos
        const response = await fetch(`${API_URL}/${id}`, {
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch playlist details');
        }

        const playlist = await response.json();
        const videos = playlist.videos || [];
        renderPlaylistVideos(videos);

    } catch (error) {
        console.error('Error fetching playlist videos:', error);
        playlistVideosList.innerHTML = '<div class="text-center text-red-500 py-4"><i class="fas fa-exclamation-triangle mr-2"></i>Failed to load videos</div>';
        displayFeedback('Failed to load playlist videos', 'error');
    }
}

function closeVideoModal() {
    videoModalOverlay.classList.add('hidden');
    currentPlaylistId = null;
    videoSelect.value = '';
}

function renderPlaylistVideos(videos) {
    playlistVideosList.innerHTML = '';

    if (videos.length === 0) {
        playlistVideosList.innerHTML = '<div class="text-center text-gray-500 py-4">No videos in this playlist yet.</div>';
        return;
    }

    videos.forEach(video => {
        const div = document.createElement('div');
        div.className = 'flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow-md transition-shadow';
        div.innerHTML = `
            <div class="flex items-center gap-3 overflow-hidden">
                <div class="w-10 h-10 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                    <img src="${video.thumbnail_url || 'https://placehold.co/100x100?text=V'}" 
                         class="w-full h-full object-cover" 
                         alt="Thumbnail"
                         onerror="this.src='https://placehold.co/100x100?text=V'">
                </div>
                <div class="truncate">
                    <h4 class="font-medium text-gray-800 truncate">${escapeHtml(video.title || video.description || 'Untitled Video')}</h4>
                    <p class="text-xs text-gray-500">ID: ${video.id}</p>
                </div>
            </div>
            <button class="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors" 
                    onclick="removeVideoFromPlaylist(${video.id})"
                    title="Remove video">
                <i class="fas fa-minus-circle text-lg"></i>
            </button>
        `;
        playlistVideosList.appendChild(div);
    });
}

async function handleAddVideo() {
    const videoId = videoSelect.value;
    if (!videoId || !currentPlaylistId) {
        displayFeedback('Please select a video', 'error');
        return;
    }

    // Disable button to prevent double submission
    addVideoBtn.disabled = true;
    addVideoBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';

    try {
        const response = await fetch(`${API_URL}/${currentPlaylistId}/videos/${videoId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || errorData.message || 'Failed to add video');
        }

        const result = await response.json();
        console.log('Add video response:', result);

        // Refresh video list
        await openVideoModal(currentPlaylistId);
        videoSelect.value = '';
        displayFeedback('Video added to playlist successfully!', 'success');

    } catch (error) {
        console.error('Error adding video:', error);
        displayFeedback(error.message || 'Failed to add video to playlist', 'error');
    } finally {
        // Re-enable button
        addVideoBtn.disabled = false;
        addVideoBtn.innerHTML = 'Add';
    }
}

// Expose to global scope for onclick handler in HTML string
window.removeVideoFromPlaylist = async function (videoId) {
    if (!currentPlaylistId || !confirm('Remove this video from the playlist?')) return;

    try {
        const response = await fetch(`${API_URL}/${currentPlaylistId}/videos/${videoId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || errorData.message || 'Failed to remove video');
        }

        const result = await response.json();
        console.log('Remove video response:', result);

        // Refresh video list
        await openVideoModal(currentPlaylistId);
        displayFeedback('Video removed from playlist successfully!', 'success');

    } catch (error) {
        console.error('Error removing video:', error);
        displayFeedback(error.message || 'Failed to remove video from playlist', 'error');
    }
};

// Feedback Helper
function displayFeedback(message, type) {
    feedbackDiv.classList.remove('hidden', 'bg-green-100', 'text-green-800', 'bg-red-100', 'text-red-800');

    let icon = '';
    let classList = '';

    if (type === 'success') {
        icon = '<i class="fas fa-check-circle mr-2 text-xl"></i>';
        classList = 'bg-green-100 text-green-800';
    } else if (type === 'error') {
        icon = '<i class="fas fa-times-circle mr-2 text-xl"></i>';
        classList = 'bg-red-100 text-red-800';
    }

    feedbackDiv.className = `mb-6 p-4 rounded-lg font-medium flex items-center ${classList}`;
    feedbackDiv.innerHTML = icon + escapeHtml(message);

    setTimeout(() => {
        feedbackDiv.classList.add('hidden');
    }, 4000);
}