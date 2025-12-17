(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");

  const scoreEl = document.getElementById("score");
  const statusEl = document.getElementById("status");

  // Grid config (matches canvas size nicely)
  const CELL = 20;
  const COLS = Math.floor(canvas.width / CELL);  // 480/20=24
  const ROWS = Math.floor(canvas.height / CELL); // 360/20=18

  // Colors (match CSS palette)
  const COLORS = {
    bg: "#FFFFFF",
    grid: "#E7E0D8",
    baguette: "#A68B6B",
    baguetteHead: "#6F5B3E",
    butter: "#F3D27A",
    butterHi: "#FFE6A8",
    text: "#6F5B3E",
  };

  // Game state
  let snake, dir, nextDir, food, score, paused, over;
  let lastTime = 0;
  const STEP_MS = 110;

  function reset() {
    const midX = Math.floor(COLS / 2);
    const midY = Math.floor(ROWS / 2);

    snake = [
      { x: midX, y: midY },
      { x: midX - 1, y: midY },
      { x: midX - 2, y: midY },
    ];

    dir = { x: 1, y: 0 };
    nextDir = { ...dir };
    score = 0;
    paused = false;
    over = false;

    food = spawnFood();
    updateHUD("Ready to bake.");
    draw();
  }

  function updateHUD(msg) {
    scoreEl.textContent = String(score);
    statusEl.textContent = msg;
  }

  function spawnFood() {
    const occupied = new Set(snake.map(p => `${p.x},${p.y}`));
    const empty = [];
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const k = `${x},${y}`;
        if (!occupied.has(k)) empty.push({ x, y });
      }
    }
    if (!empty.length) return null;
    return empty[Math.floor(Math.random() * empty.length)];
  }

  function setDir(nx, ny) {
    if (over) return;

    // Prevent reversing
    if (nx === -dir.x && ny === -dir.y) return;

    nextDir = { x: nx, y: ny };
  }

  function togglePause() {
    if (over) return;
    paused = !paused;
    updateHUD(paused ? "Paused (space to resume)." : "Baking...");
  }

  function step() {
    dir = { ...nextDir };

    const head = snake[0];
    const newHead = { x: head.x + dir.x, y: head.y + dir.y };

    // Wall collision
    if (newHead.x < 0 || newHead.x >= COLS || newHead.y < 0 || newHead.y >= ROWS) {
      over = true;
      updateHUD("Game over — your baguette hit the oven wall. Press R.");
      return;
    }

    const willGrow = food && newHead.x === food.x && newHead.y === food.y;

    // Self collision
    // If not growing, tail will move away, so allow stepping onto last tail cell.
    const bodyToCheck = willGrow ? snake : snake.slice(0, -1);
    if (bodyToCheck.some(p => p.x === newHead.x && p.y === newHead.y)) {
      over = true;
      updateHUD("Game over — you knotted your baguette. Press R.");
      return;
    }

    snake.unshift(newHead);

    if (willGrow) {
      score += 1;
      food = spawnFood();
      updateHUD("Butter acquired 🧈");
    } else {
      snake.pop();
    }

    if (!food) {
      over = true;
      updateHUD("You filled the tray — Master Baker! Press R.");
    }
  }

  function drawGrid() {
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;

    for (let x = 0; x <= COLS; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL, 0);
      ctx.lineTo(x * CELL, ROWS * CELL);
      ctx.stroke();
    }
    for (let y = 0; y <= ROWS; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL);
      ctx.lineTo(COLS * CELL, y * CELL);
      ctx.stroke();
    }
  }

  function drawButter(x, y) {
    const px = x * CELL;
    const py = y * CELL;

    ctx.fillStyle = COLORS.butter;
    ctx.fillRect(px + 2, py + 2, CELL - 4, CELL - 4);

    ctx.fillStyle = COLORS.butterHi;
    ctx.fillRect(px + 5, py + 5, 7, 7);
  }

  function drawSnake() {
    snake.forEach((p, i) => {
      const px = p.x * CELL;
      const py = p.y * CELL;

      ctx.fillStyle = i === 0 ? COLORS.baguetteHead : COLORS.baguette;
      ctx.fillRect(px + 1, py + 1, CELL - 2, CELL - 2);

      // subtle crust line
      ctx.strokeStyle = "rgba(0,0,0,0.08)";
      ctx.strokeRect(px + 1, py + 1, CELL - 2, CELL - 2);
    });
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // background
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawGrid();

    if (food) drawButter(food.x, food.y);
    drawSnake();

    if (paused) {
      ctx.fillStyle = "rgba(255,255,255,0.72)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = COLORS.text;
      ctx.font = "bold 22px system-ui, -apple-system, Segoe UI, Roboto, Arial";
      ctx.textAlign = "center";
      ctx.fillText("PAUSED", canvas.width / 2, canvas.height / 2 - 8);

      ctx.font = "14px system-ui, -apple-system, Segoe UI, Roboto, Arial";
      ctx.fillText("Press Space to resume", canvas.width / 2, canvas.height / 2 + 18);
    }

    if (over) {
      ctx.fillStyle = "rgba(255,255,255,0.78)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = COLORS.text;
      ctx.font = "bold 22px system-ui, -apple-system, Segoe UI, Roboto, Arial";
      ctx.textAlign = "center";
      ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 10);

      ctx.font = "14px system-ui, -apple-system, Segoe UI, Roboto, Arial";
      ctx.fillText("Press R to restart", canvas.width / 2, canvas.height / 2 + 18);
    }
  }

  function loop(ts) {
    if (!lastTime) lastTime = ts;
    const elapsed = ts - lastTime;

    if (!paused && !over && elapsed >= STEP_MS) {
      step();
      lastTime = ts;
    }

    draw();
    requestAnimationFrame(loop);
  }

  // Controls
  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp") setDir(0, -1);
    else if (e.key === "ArrowDown") setDir(0, 1);
    else if (e.key === "ArrowLeft") setDir(-1, 0);
    else if (e.key === "ArrowRight") setDir(1, 0);
    else if (e.key === " " || e.code === "Space") togglePause();
    else if (e.key.toLowerCase() === "r") {
      lastTime = 0;
      reset();
    }
  });

  // Start
  reset();
  requestAnimationFrame(loop);
})();
