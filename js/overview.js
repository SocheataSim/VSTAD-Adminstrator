document.addEventListener('DOMContentLoaded', () => {
    fetchOverviewStats();
    fetchAndRenderVideos();
});

async function fetchOverviewStats() {
    const apiUrl = 'https://vstad-api.cheatdev.online/api/interactions/stats/overview';
    
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        // Update DOM elements
        updateElement('totalVideos', data.total_videos);
        updateElement('totalUsers', data.total_users);
        updateElement('totalLikes', data.total_likes);
        updateElement('totalPlaylists', data.total_playlists);
        
    } catch (error) {
        console.error('Error fetching overview stats:', error);
    }
}

function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value.toLocaleString();
    }
}

async function fetchAndRenderVideos() {
    const apiUrl = 'https://vstad-api.cheatdev.online/api/videos/?limit=100';

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const videos = data.videos || [];

        // Sort and slice for each category
        const mostViewed = [...videos].sort((a, b) => b.view_count - a.view_count).slice(0, 3);
        const mostLiked = [...videos].sort((a, b) => b.like_count - a.like_count).slice(0, 3);
        const mostCommented = [...videos].sort((a, b) => b.comment_count - a.comment_count).slice(0, 3);

        // Render to containers
        renderVideoCards('mostViewsContainer', mostViewed, 'views', 'eye');
        renderVideoCards('mostLikedContainer', mostLiked, 'likes', 'heart'); // Using heart icon for likes
        renderVideoCards('mostCommentedContainer', mostCommented, 'comments', 'message-square'); // Using message-square for comments

    } catch (error) {
        console.error('Error fetching videos:', error);
    }
}

function renderVideoCards(containerId, videos, statType, iconName) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = videos.map(video => createVideoCard(video, statType, iconName)).join('');
    
    // Re-initialize icons for the new content
    if (window.lucide) {
        lucide.createIcons();
    }
}

function createVideoCard(video, statType, iconName) {
    const thumbnailUrl = video.thumbnail_url || 'https://via.placeholder.com/320x180?text=No+Thumbnail';
    const uploaderName = video.uploader ? (video.uploader.full_name || video.uploader.username) : 'Unknown User';
    const uploaderImage = (video.uploader && video.uploader.profile_image) ? video.uploader.profile_image : '../images/logo.png'; // Fallback to logo if no profile image
    
    let statCount = 0;
    let statLabel = '';
    
    if (statType === 'views') {
        statCount = video.view_count;
        statLabel = 'views';
    } else if (statType === 'likes') {
        statCount = video.like_count;
        statLabel = 'likes';
    } else if (statType === 'comments') {
        statCount = video.comment_count;
        statLabel = 'comments';
    }

    // Format count (e.g., 1.2K)
    const formattedCount = formatCount(statCount);
    const timeAgo = formatTimeAgo(video.created_at);

    return `
        <div class="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition duration-300 cursor-pointer">
            <img src="${thumbnailUrl}" alt="${video.title}" class="w-full h-40 object-cover">
            <div class="p-4">
                <div class="flex items-center mb-2">
                    <div class="overflow-hidden h-6 w-6 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs mr-2">
                        <img src="${uploaderImage}" alt="${uploaderName}" class="w-full h-full object-cover">
                    </div> 
                    <span class="text-sm font-semibold text-gray-800 dark:text-white truncate">${uploaderName}</span>
                </div>
                <h3 class="text-base font-bold text-gray-900 leading-tight dark:text-white mb-2 truncate" title="${video.title}">${video.title}</h3>
                <p class="text-xs text-gray-500 dark:text-white flex items-center">
                    <i data-lucide="${iconName}" class="inline w-3 h-3 mr-1"></i> ${formattedCount} ${statLabel} · ${timeAgo}
                </p>
            </div>
        </div>
    `;
}

function formatCount(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) return interval + " year" + (interval === 1 ? "" : "s") + " ago";
    
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return interval + " month" + (interval === 1 ? "" : "s") + " ago";
    
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return interval + " day" + (interval === 1 ? "" : "s") + " ago";
    
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return interval + " hour" + (interval === 1 ? "" : "s") + " ago";
    
    interval = Math.floor(seconds / 60);
    if (interval >= 1) return interval + " minute" + (interval === 1 ? "" : "s") + " ago";
    
    return Math.floor(seconds) + " seconds ago";
}
