function logout() {
  localStorage.removeItem('loggedInUser');
  window.location.href = '/login.html';
}

function checkSession() {
  const userDataStr = localStorage.getItem('loggedInUser');
  if (!userDataStr) {
    window.location.href = '/login.html';
    return null;
  }
  const userData = JSON.parse(userDataStr);
  const now = new Date();
  const [datePart, timePart] = userData.expireIn.split("/");
  const [day, month, year] = datePart.split(".").map(Number);
  const [hour, minute, second] = timePart.split(":").map(Number);
  const expireDate = new Date(year, month - 1, day, hour, minute, second);
  if (now >= expireDate) {
    alert("Your account has expired. Please login again.");
    logout();
    return null;
  }
  return userData;
}

async function updateUserCount() {
  try {
    const response = await fetch('/api/users/count');
    const data = await response.json();
    document.getElementById('userCount').textContent = data.count;
  } catch (err) {
    console.error('Failed to fetch user count:', err);
  }
}

function displayUserInfo(userData) {
  document.getElementById('username-display').textContent = userData.username;
  document.getElementById('expiry-date').innerHTML = userData.expireIn.replace('/','<br>');
}

async function CrashAndroid() {
  const number = document.getElementById("phoneInputAndroid").value.trim();
  if (!number) return alert("Enter a phone number");
  try {
    const res = await fetch("/crash-android", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ number }),
    });
    const result = await res.json();
    showToast(`✅ Sent by ${result.sent} Sessions`);
  } catch {
    showToast("❌ Failed to send!");
  }
}

async function CrashIOS() {
  const number = document.getElementById("phoneInputIOS").value.trim();
  if (!number) return alert("Enter a phone number");
  try {
    const res = await fetch("/crash-ios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ number }),
    });
    const result = await res.json();
    showToast(`✅ Sent by ${result.sent} Sessions`);
  } catch {
    showToast("❌ Failed to send!");
  }
}

function showToast(message, type = "default") {
  const toastContainer = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

window.onload = () => {
  const userData = checkSession();
  if (!userData) return;
  displayUserInfo(userData);
  updateUserCount();
  const toastUsername = document.getElementById('toast-username');
  if (toastUsername) {
    toastUsername.textContent = userData.username;
  }
  const closeBtn = document.querySelector('.toast .close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      closeBtn.parentElement.style.display = 'none';
    });
  }
};

const userDataStr = localStorage.getItem('loggedInUser');
if (!userDataStr) {
  location.href = '/login.html';
} else {
  const userData = JSON.parse(userDataStr);
  const [datePart, timePart] = userData.expireIn.split("/");
  const [day, month, year] = datePart.split(".").map(Number);
  const [hour, minute, second] = timePart.split(":").map(Number);
  const expireDate = new Date(year, month - 1, day, hour, minute, second);
  const now = new Date();
  if (now >= expireDate) {
    localStorage.removeItem('loggedInUser');
    location.href = '/login.html';
  }
}