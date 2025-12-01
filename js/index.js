// Optional: Add refresh button functionality
function refreshPlaylists() {
  displayFeedback('Refreshing playlists...', 'success');
  fetchAllPlaylists();
}

// Delete Playlist Function
async function deletePlaylist(playlistId, playlistTitle) {
  // Confirm before deleting
  if (!confirm(`Are you sure you want to delete "${playlistTitle}"? This action cannot be undone.`)) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/${playlistId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`
      }
    });

    if (response.ok) {
      console.log(`✅ Playlist deleted successfully! ID: ${playlistId}`);
      displayFeedback(`Playlist "${playlistTitle}" deleted successfully!`, 'success');
      
      // Refresh the playlist list
      await fetchAllPlaylists();
    } else {
      let errorMessage = 'Unknown error';
      try {
        const errorBody = await response.json();
        errorMessage = errorBody.message || errorBody.detail || JSON.stringify(errorBody);
      } catch (e) {
        errorMessage = await response.text() || `HTTP ${response.status}`;
      }
      
      displayFeedback(`Failed to delete playlist. Status: ${response.status}. ${errorMessage}`, 'error');
      console.error('❌ Failed to delete playlist:', errorMessage);
    }

  } catch (error) {
    displayFeedback('Network error. Could not delete playlist.', 'error');
    console.error('❌ Network Error:', error);
  }
}

// Add event delegation for delete buttons
document.addEventListener('click', (e) => {
  // Check if clicked element or its parent is a delete button
  const deleteBtn = e.target.closest('.btn-delete');
  if (deleteBtn) {
    // Find the parent row
    const row = deleteBtn.closest('tr');
    if (row) {
      const playlistId = row.getAttribute('data-playlist-id');
      const playlistTitle = row.querySelector('td:nth-child(2)').textContent.trim();
      
      if (playlistId) {
        deletePlaylist(playlistId, playlistTitle);
      }
    }
  }
});