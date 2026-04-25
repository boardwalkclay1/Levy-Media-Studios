// api.js
import { getToken, logout } from "./auth.js";

export async function adminFetch(endpoint) {
  const token = getToken();

  const res = await fetch(`/api/admin/${endpoint}`, {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  if (res.status === 401) {
    logout();
    return [];
  }

  return await res.json();
}
