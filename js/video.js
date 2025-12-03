const token =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZXhwIjoxNzcxOTI1ODQwfQ.cwCFjv3j_aV-FJcJ12dQjuLLSJ7EM02i2yuuRTfJEi4";

const base_url = "https://vstad-api.cheatdev.online/api/admin";

async function getAllVideos() {
  try {
    const res = await fetch(`${base_url}/videos`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    const data = await res.json();
    console.log(data);

    const listVideo = data
      .map((video) => {
        const status = video.is_public ? "public" : "private";
        // date time ---------
        const createdAt = new Date(video.created_at);

        const formattedDate = createdAt.toLocaleDateString("en-GB");

        const formattedTime = createdAt.toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });
        // -------------------

        return `
        <tr class="hover:bg-gray-50 transition bg-gray-50 dark:bg-[#1F2937]">
                  <td class="px-6 py-1.5 text-sm text-gray-600">
                    <img src="${video.thumbnail_url}" alt="video" class="w-9 h-9 object-cover rounded-[9px]">
                  </td>
                  <td class="px-6 py-1.5 text-sm text-gray-600 truncate max-w-[100px] overflow-ellipsis">
                    ${video.description}
                  </td>
                  <td class="px-6 py-1.5 text-sm text-gray-600">${video.uploader.username}</td>
                  <td class="px-6 py-1.5 text-sm text-gray-600">${formattedDate}</td>
                  <td class="px-6 py-1.5 text-sm text-gray-600">${formattedTime}</td>
                  <td class="px-6 py-1.5 text-sm text-gray-600">${video.view_count}</td>
                  <td class="px-6 py-1.5 text-sm text-gray-600">${video.like_count}</td>
                  <td class="px-6 py-1.5 text-sm text-gray-600">${status}</td>
                  <td class="px-6 py-4 text-sm flex gap-3">
                   <button class="text-blue-600 hover:text-blue-700 transition table-edit-btn" data-video-id="${video.id}" data-status="${status}">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button class="text-red-600 hover:text-red-700 transition table-delete-btn" data-video-id="${video.id}">
                      <i class="fas fa-trash"></i>
                    </button>
                  </td>
                </tr>`;
      })
      .join("");

    document.getElementById("table-video").innerHTML += listVideo;

    attachModalListeners();
  } catch (err) {
    console.error("Error:", err);
  }
}

// Function to show modal
function showModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.classList.remove("hidden");
}

// Function to close modal
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.classList.add("hidden");
}

function attachModalListeners() {
  // edit buttons in table
  const editButtons = document.querySelectorAll(".table-edit-btn");
  editButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const videoId = button.getAttribute("data-video-id");
      const videoStatus = button.getAttribute("data-status");

      const videoIdInput = document.getElementById("video-id");
      if (videoIdInput) videoIdInput.value = videoId;

      const statusSelect = document.getElementById("status");
      if (statusSelect) statusSelect.value = videoStatus;

      showModal("edit-modal");
    });
  });

  // delete buttons in table
  const deleteButtons = document.querySelectorAll(".table-delete-btn");
  deleteButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const videoId = button.getAttribute("data-video-id");
      // store video id on modal delete button
      const modalDeleteBtn = document.getElementById("delete-btn");
      if (modalDeleteBtn) modalDeleteBtn.setAttribute("data-video-id", videoId);
      showModal("delete-modal");
    });
  });
}

async function fetchWithBody(url, options = {}) {
  const res = await fetch(url, options);
  let body = null;
  try {
    body = await res.json();
  } catch {
    try {
      body = await res.text();
    } catch {
      body = null;
    }
  }
  return { res, ok: res.ok, status: res.status, body };
}

async function editVideo(videoId, status) {
  try {
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    let attempt = await fetchWithBody(`${base_url}/videos/${videoId}/status`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ status }),
    });
    if (attempt.ok) {
      console.log(`Video ${videoId} status updated (body)`);
    } else {
      attempt = await fetchWithBody(
        `${base_url}/videos/${videoId}/status?status=${encodeURIComponent(
          status
        )}`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (attempt.ok) {
        console.log(`Video ${videoId} status updated (query)`);
      } else {
        console.error("/status (query) failed:", attempt.status, attempt.body);
      }
    }

    await getAllVideos();
    closeModal("edit-modal");
  } catch (error) {
    console.error("editVideo error:", error);
  }
}

// function to delete video
async function deleteVideo(videoId) {
  try {
    const res = await fetch(`${base_url}/videos/${videoId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (res.ok) {
      console.log(`Video ${videoId} deleted successfully!`);
      // remove row from the table
      const rowBtn = document.querySelector(
        `.table-delete-btn[data-video-id='${videoId}']`
      );
      if (rowBtn) {
        const row = rowBtn.closest("tr");
        if (row) row.remove();
      } else {
        await getAllVideos();
      }
      closeModal("delete-modal");
    } else {
      console.error("Failed to delete video");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

// event listener for the edit form submission
const editForm = document.getElementById("edit-video-form");
if (editForm) {
  editForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const videoId = document.getElementById("video-id").value;
    const status = document.getElementById("status").value;
    editVideo(videoId, status);
  });
}
// event listener for the delete button
const modalDeleteBtn = document.getElementById("delete-btn");
if (modalDeleteBtn) {
  modalDeleteBtn.addEventListener("click", function () {
    const videoId = modalDeleteBtn.getAttribute("data-video-id");
    if (videoId) deleteVideo(videoId);
  });
}

getAllVideos();
