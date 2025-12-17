import tkinter as tk
import random

# ---------- Config ----------
CELL_SIZE = 20
GRID_W = 24
GRID_H = 18
DELAY_MS = 110  # lower = faster

# Sourdough palette (soft whites, browns, greens)
BG = "#FAF7F2"          # flour white
GRID = "#E7E0D8"        # light grid
BAGUETTE = "#A68B6B"    # toasted crust
BAGUETTE_HEAD = "#6F5B3E"
BUTTER = "#F3D27A"      # butter
TEXT = "#6F5B3E"
PANEL = "#F2EEE7"

TITLE = "🥖 Baguette Snake — Sourdough Arcade"

# ---------- Game ----------
class BaguetteSnake:
    def __init__(self, root: tk.Tk):
        self.root = root
        self.root.title(TITLE)
        self.root.configure(bg=BG)

        self.canvas = tk.Canvas(
            root,
            width=GRID_W * CELL_SIZE,
            height=GRID_H * CELL_SIZE,
            bg=BG,
            highlightthickness=0
        )
        self.canvas.pack(padx=12, pady=(12, 8))

        self.info = tk.Label(
            root,
            text="",
            font=("Arial", 12),
            fg=TEXT,
            bg=BG
        )
        self.info.pack(pady=(0, 10))

        # Controls
        self.root.bind("<Up>", lambda e: self.set_dir(0, -1))
        self.root.bind("<Down>", lambda e: self.set_dir(0, 1))
        self.root.bind("<Left>", lambda e: self.set_dir(-1, 0))
        self.root.bind("<Right>", lambda e: self.set_dir(1, 0))
        self.root.bind("<space>", lambda e: self.toggle_pause())
        self.root.bind("r", lambda e: self.reset())

        self.reset()

    def reset(self):
        midx, midy = GRID_W // 2, GRID_H // 2
        self.snake = [(midx, midy), (midx - 1, midy), (midx - 2, midy)]
        self.dir = (1, 0)
        self.pending_dir = self.dir
        self.score = 0
        self.game_over = False
        self.paused = False

        self.food = self.spawn_food()  # butter
        self.draw()
        self.tick()

    def toggle_pause(self):
        if self.game_over:
            return
        self.paused = not self.paused
        self.draw()

    def set_dir(self, dx, dy):
        if self.game_over:
            return
        cur_dx, cur_dy = self.dir
        if (dx, dy) == (-cur_dx, -cur_dy):
            return
        self.pending_dir = (dx, dy)

    def spawn_food(self):
        empty = {(x, y) for x in range(GRID_W) for y in range(GRID_H)} - set(self.snake)
        return random.choice(list(empty)) if empty else None

    def tick(self):
        if self.game_over:
            return
        if not self.paused:
            self.step()
            self.draw()
        self.root.after(DELAY_MS, self.tick)

    def step(self):
        self.dir = self.pending_dir
        hx, hy = self.snake[0]
        dx, dy = self.dir
        nx, ny = hx + dx, hy + dy

        # wall collision
        if not (0 <= nx < GRID_W and 0 <= ny < GRID_H):
            self.game_over = True
            return

        new_head = (nx, ny)

        # self collision (allow moving into tail cell only if tail moves away)
        will_grow = (self.food == new_head)
        body_set = set(self.snake[:-1]) if not will_grow else set(self.snake)

        if new_head in body_set:
            self.game_over = True
            return

        self.snake.insert(0, new_head)

        if will_grow:
            self.score += 1
            self.food = self.spawn_food()
        else:
            self.snake.pop()

        if self.food is None:  # filled the board
            self.game_over = True

    def draw_grid(self):
        for x in range(0, GRID_W * CELL_SIZE, CELL_SIZE):
            self.canvas.create_line(x, 0, x, GRID_H * CELL_SIZE, fill=GRID, width=1)
        for y in range(0, GRID_H * CELL_SIZE, CELL_SIZE):
            self.canvas.create_line(0, y, GRID_W * CELL_SIZE, y, fill=GRID, width=1)

    def draw_cell(self, x, y, color, outline=""):
        x1 = x * CELL_SIZE
        y1 = y * CELL_SIZE
        x2 = x1 + CELL_SIZE
        y2 = y1 + CELL_SIZE
        self.canvas.create_rectangle(x1, y1, x2, y2, fill=color, outline=outline)

    def draw_butter(self, x, y):
        # Draw a butter square with a tiny highlight
        x1 = x * CELL_SIZE
        y1 = y * CELL_SIZE
        x2 = x1 + CELL_SIZE
        y2 = y1 + CELL_SIZE
        self.canvas.create_rectangle(x1+2, y1+2, x2-2, y2-2, fill=BUTTER, outline="")
        self.canvas.create_rectangle(x1+4, y1+4, x1+10, y1+10, fill="#FFE6A8", outline="")

    def draw(self):
        self.canvas.delete("all")
        self.draw_grid()

        # butter
        if self.food:
            fx, fy = self.food
            self.draw_butter(fx, fy)

        # baguette snake
        for i, (x, y) in enumerate(self.snake):
            color = BAGUETTE_HEAD if i == 0 else BAGUETTE
            self.draw_cell(x, y, color)

        # UI text
        status = f"Butter eaten: {self.score}  |  ⬅️⬆️➡️⬇️ Move  |  Space Pause  |  R Restart"
        if self.paused:
            status = f"PAUSED — {status}"
        if self.game_over:
            status = f"GAME OVER — Butter eaten: {self.score}  |  Press R to restart"
        self.info.config(text=status)


def main():
    root = tk.Tk()
    BaguetteSnake(root)
    root.mainloop()

if __name__ == "__main__":
    main()
