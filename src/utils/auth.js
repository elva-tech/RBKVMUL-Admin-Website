const ADMIN_USER = "admin";
const ADMIN_PASS = "rbkvmul@123";

export function login(username, password) {
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    localStorage.setItem("isAdmin", "true");
    return true;
  }
  return false;
}

export function logout() {
  localStorage.removeItem("isAdmin");
}

export function isAuthenticated() {
  return localStorage.getItem("isAdmin") === "true";
}