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
        <tr class="hover:bg-gray-50 transition bg-gray-50">
                  <td class="px-4 py-1.5 text-sm text-gray-600">
                    <img src="${video.thumbnail_url}" alt="video" class="w-9 h-9 object-cover rounded-[9px]">
                  </td>
                  <td class="px-6 py-1.5 text-sm text-gray-600 truncate max-w-[150px] overflow-ellipsis">
                    ${video.description}
                  </td>
                  <td class="px-6 py-1.5 text-sm text-gray-600">${video.uploader.username}</td>
                  <td class="px-6 py-1.5 text-sm text-gray-600">${formattedDate}</td>
                  <td class="px-6 py-1.5 text-sm text-gray-600">${formattedTime}</td>
                  <td class="px-6 py-1.5 text-sm text-gray-600">${video.view_count}</td>
                  <td class="px-6 py-1.5 text-sm text-gray-600">${video.like_count}</td>
                  <td class="px-6 py-1.5 text-sm text-gray-600">Actions</td>
                </tr>`;
      })
      .join("");

    document.getElementById("table-video").innerHTML += listVideo;
  } catch (err) {
    console.error("Error:", err);
  }
}

getAllVideos();
