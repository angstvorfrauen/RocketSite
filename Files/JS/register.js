//======================//
async function register() {
  const username = document.getElementById("registerUsername").value;
  const password = document.getElementById("registerPassword").value;
  const res = await fetch("/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  const msg = document.getElementById("registerMessage");
  msg.textContent = data.message;
  msg.style.color = res.ok ? "green" : "red";
  if (res.ok) {
    setTimeout(() => {
      window.location.href = "login.html";
    }, 1000);
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