//======================//
async function login() {
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value.trim();
  const msgElem = document.getElementById('loginMessage');
  if (!username || !password) {
    msgElem.textContent = 'Username and password are required.';
    msgElem.style.color = 'red';
    return;
  }
  try {
    const res = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('loggedInUser', JSON.stringify({
        username: data.username,
        expireIn: data.expireIn
      }));
      msgElem.style.color = 'green';
      msgElem.textContent = data.message;
      setTimeout(() => {
        window.location.href = '/dashboard.html';
      }, 1000);
    } else {
      msgElem.style.color = 'red';
      msgElem.textContent = data.message;
    }
  } catch (err) {
    msgElem.style.color = 'red';
    msgElem.textContent = 'Server error. Try again later.';
  }
}
//======================//
//===IMPORTANT===//
const userDataStr = localStorage.getItem('loggedInUser');
if (userDataStr) {
  const userData = JSON.parse(userDataStr);
  const [datePart, timePart] = userData.expireIn.split("/");
  const [day, month, year] = datePart.split(".").map(Number);
  const [hour, minute, second] = timePart.split(":").map(Number);
  const expireDate = new Date(year, month - 1, day, hour, minute, second);
  const now = new Date();
  if (now < expireDate) {
    window.location.href = '/dashboard.html';
  } else {
    localStorage.removeItem('loggedInUser');
  }
}
//===IMPORTANT===//