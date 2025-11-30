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
        return `
        <tr class="hover:bg-gray-50 transition">
                  <td class="px-6 py-4">
                    <input type="checkbox" class="w-4 h-4 cursor-pointer" />
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-900 font-medium">
                    ${user.full_name}
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-600">
                    ${user.email}
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-600">${user.username}</td>
                  <td class="px-6 py-4 text-sm">
                    <span
                      class="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium"
                      >${user.role}</span
                    >
                  </td>
                  <td class="px-6 py-4 text-sm flex gap-3">
                    <button
                      class="text-blue-600 hover:text-blue-700 transition"
                    >
                      <i class="fas fa-edit"></i>
                    </button>
                    <button class="text-red-600 hover:text-red-700 transition">
                      <i class="fas fa-trash"></i>
                    </button>
                  </td>
                </tr>`;
      })
      .join("");

    document.getElementById("table-body").innerHTML += userInfo;
  } catch (err) {
    console.error("Error:", err);
  }
}

getAllUser();
