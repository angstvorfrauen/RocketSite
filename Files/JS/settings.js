//===IMPORTANT===//
function logout() {
  localStorage.removeItem('loggedInUser');
  window.location.href = '/login.html';
}
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
//===IMPORTANT===//