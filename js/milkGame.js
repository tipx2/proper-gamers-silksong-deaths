const canvas = document.getElementById('milkGame');
const ctx = canvas.getContext('2d');

let fire = 0;      // current fire strength
let milkState = 0; // 0 = raw, 1 = baking, 2 = ready, 3 = burnt
let progress = 0;  // bake progress

function drawGame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw oven background
  ctx.fillStyle = "#3b1d1d";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw fire (color depends on strength)
  const fireColor = fire > 60 ? "orange" : fire > 30 ? "red" : "darkred";
  ctx.fillStyle = fireColor;
  ctx.fillRect(150, 220, 100, Math.min(fire, 80));

  // Draw chugun (pot)
  ctx.fillStyle = "#222";
  ctx.beginPath();
  ctx.arc(200, 150, 60, 0, Math.PI * 2);
  ctx.fill();

  // Draw milk inside
  let milkColor = "#fff";
  if (milkState === 1) milkColor = "#f5e6c6"; // baking
  if (milkState === 2) milkColor = "#e0b36c"; // ready
  if (milkState === 3) milkColor = "#5a2c2c"; // burnt
  ctx.fillStyle = milkColor;
  ctx.beginPath();
  ctx.arc(200, 150, 45, 0, Math.PI * 2);
  ctx.fill();
}

function updateGame() {
  // Fire naturally cools
  if (fire > 0) fire -= 0.5;

  if (fire > 20 && fire < 50) {
    // Good heat → progress bakes
    progress += 0.3;
    milkState = 1;
    if (progress >= 100) milkState = 2;
  } else if (fire >= 50) {
    // Too hot → burn
    if (milkState === 2) milkState = 3;
    else if (milkState !== 0) milkState = 3;
  }

  drawGame();
}

document.getElementById('addLog').addEventListener('click', () => {
  fire += 20;
  if (fire > 80) fire = 80;
});

document.getElementById('resetMilk').addEventListener('click', () => {
  fire = 0;
  progress = 0;
  milkState = 0;
});

setInterval(updateGame, 100);
