const token =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZXhwIjoxNzcxOTI1ODQwfQ.cwCFjv3j_aV-FJcJ12dQjuLLSJ7EM02i2yuuRTfJEi4";
const base_url = "https://vstad-api.cheatdev.online/api/admin";

async function getAllUser() {
  try {
    const res = await fetch(`${base_url}/users`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    const data = await res.json();
    console.log(data);

    const userInfo = data
      .map((user) => {
        const status = user.is_active ? "active" : "inactive";
        const role = user.role;

        return `
        <tr class="hover:bg-gray-50 transition">
                  <td class="px-6 py-4">
                    <input type="checkbox" class="w-4 h-4 cursor-pointer" />
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-900 dark:text-white font-medium">
                    ${user.full_name}
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-600">
                    ${user.email}
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-600">${user.username}</td>
                  <td class="px-6 py-4 text-sm">
                    <span
                      class="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium"
                      >${status}</span
                    >
                  </td>
                  <td class="px-6 py-4 text-sm">
                    <span
                      class="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium"
                      >${role}</span
                    >
                  </td>
                  <td class="px-6 py-4 text-sm flex gap-3">
                    <button class="text-blue-600 hover:text-blue-700 transition table-edit-btn" data-user-id="${user.id}" data-status="${status}" data-role="${role}">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button class="text-red-600 hover:text-red-700 transition table-delete-btn" data-user-id="${user.id}">
                      <i class="fas fa-trash"></i>
                    </button>
                  </td>
                </tr>`;
      })
      .join("");

    document.getElementById("table-body").innerHTML += userInfo;

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
      const userId = button.getAttribute("data-user-id");
      const userStatus = button.getAttribute("data-status");
      const userRole = button.getAttribute("data-role");

      const userIdInput = document.getElementById("user-id");
      if (userIdInput) userIdInput.value = userId;

      const statusSelect = document.getElementById("status");
      const roleSelect = document.getElementById("role");
      if (statusSelect) statusSelect.value = userStatus;
      if (roleSelect) roleSelect.value = userRole;

      showModal("edit-modal");
    });
  });

  // delete buttons in table
  const deleteButtons = document.querySelectorAll(".table-delete-btn");
  deleteButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const userId = button.getAttribute("data-user-id");
      // store user id on modal delete button
      const modalDeleteBtn = document.getElementById("delete-btn");
      if (modalDeleteBtn) modalDeleteBtn.setAttribute("data-user-id", userId);
      showModal("delete-modal");
    });
  });
}

// perform fetch and return parsed body
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
// edit user function
async function editUser(userId, status, role) {
  try {
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    let attempt = await fetchWithBody(`${base_url}/users/${userId}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ status, role }),
    });

    if (attempt.ok) {
      console.log(`User ${userId} updated (single PUT)`);
      await getAllUser();
      closeModal("edit-modal");
      return;
    }
    console.warn("Single PUT failed:", attempt.status, attempt.body);

    attempt = await fetchWithBody(`${base_url}/users/${userId}/status`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ status }),
    });
    if (attempt.ok) {
      console.log(`User ${userId} status updated (body)`);
    } else {
      attempt = await fetchWithBody(
        `${base_url}/users/${userId}/status?status=${encodeURIComponent(
          status
        )}`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (attempt.ok) {
        console.log(`User ${userId} status updated (query)`);
      } else {
        console.error("/status (query) failed:", attempt.status, attempt.body);
      }
    }

    attempt = await fetchWithBody(`${base_url}/users/${userId}/role`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ role }),
    });
    if (attempt.ok) {
      console.log(`User ${userId} role updated (body)`);
    } else {
      console.warn("/role (body) failed:", attempt.status, attempt.body);
      attempt = await fetchWithBody(
        `${base_url}/users/${userId}/role?role=${encodeURIComponent(role)}`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (attempt.ok) {
        console.log(`User ${userId} role updated (query)`);
      } else {
        console.error("/role (query) failed:", attempt.status, attempt.body);
      }
    }

    await getAllUser();
    closeModal("edit-modal");
  } catch (error) {
    console.error("editUser error:", error);
  }
}

// delete user function
async function deleteUser(userId) {
  try {
    const res = await fetch(`${base_url}/users/${userId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (res.ok) {
      console.log(`User ${userId} deleted successfully!`);
      // remove row from the table
      const rowBtn = document.querySelector(
        `.table-delete-btn[data-user-id='${userId}']`
      );
      if (rowBtn) {
        const row = rowBtn.closest("tr");
        if (row) row.remove();
      } else {
        await getAllUser();
      }
      closeModal("delete-modal");
    } else {
      console.error("Failed to delete user");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

// event listener for the edit form submission
const editForm = document.getElementById("edit-user-form");
if (editForm) {
  editForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const userId = document.getElementById("user-id").value;
    const status = document.getElementById("status").value;
    const role = document.getElementById("role").value;
    editUser(userId, status, role);
  });
}

// event listener for the delete button
const modalDeleteBtn = document.getElementById("delete-btn");
if (modalDeleteBtn) {
  modalDeleteBtn.addEventListener("click", function () {
    const userId = modalDeleteBtn.getAttribute("data-user-id");
    if (userId) deleteUser(userId);
  });
}

getAllUser();
