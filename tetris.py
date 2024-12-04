#!/usr/bin/env python3
import curses
import random
import time
from typing import List, Tuple

# Tetromino shapes
SHAPES = {
    'I': [(0, 0), (0, 1), (0, 2), (0, 3)],
    'O': [(0, 0), (0, 1), (1, 0), (1, 1)],
    'T': [(0, 1), (1, 0), (1, 1), (1, 2)],
    'S': [(0, 1), (0, 2), (1, 0), (1, 1)],
    'Z': [(0, 0), (0, 1), (1, 1), (1, 2)],
    'J': [(0, 0), (1, 0), (1, 1), (1, 2)],
    'L': [(0, 2), (1, 0), (1, 1), (1, 2)]
}

class Tetris:
    def __init__(self, height: int = 20, width: int = 10):
        self.height = height
        self.width = width
        self.board = [[0 for _ in range(width)] for _ in range(height)]
        self.score = 0
        self.game_over = False
        self.new_piece()
        self.speed = 0.5  # Initial speed (seconds)

    def new_piece(self) -> None:
        """Create a new tetromino piece."""
        self.piece_type = random.choice(list(SHAPES.keys()))
        self.piece = list(SHAPES[self.piece_type])
        self.piece_x = self.width // 2 - 2
        self.piece_y = 0
        
        if self.check_collision():
            self.game_over = True

    def check_collision(self) -> bool:
        """Check if the current piece collides with the board or boundaries."""
        for x, y in self.piece:
            new_x = self.piece_x + x
            new_y = self.piece_y + y
            if (new_x < 0 or new_x >= self.width or 
                new_y >= self.height or 
                (new_y >= 0 and self.board[new_y][new_x])):
                return True
        return False

    def rotate(self) -> None:
        """Rotate the current piece."""
        if self.piece_type == 'O':  # Square doesn't need to rotate
            return
            
        if self.piece_type == 'I':  # I piece needs special handling
            # Find the bounding box
            min_x = min(x for x, y in self.piece)
            min_y = min(y for x, y in self.piece)
            
            # If horizontal, rotate to vertical
            if self.piece[0][0] == self.piece[1][0]:  # vertical
                rotated = [(min_x + i, min_y) for i in range(4)]
            else:  # horizontal
                rotated = [(min_x, min_y + i) for i in range(4)]
        else:
            # For other pieces (T, S, Z, J, L) use standard rotation
            center = self.piece[1]  # Use the second block as rotation center
            rotated = []
            for x, y in self.piece:
                # Rotate 90 degrees clockwise around center
                rx = center[0] - (y - center[1])
                ry = center[1] + (x - center[0])
                rotated.append((rx, ry))
        
        # Test if rotation is possible
        old_piece = self.piece.copy()
        self.piece = rotated
        if self.check_collision():
            self.piece = old_piece

    def move(self, dx: int, dy: int) -> bool:
        """Move the current piece if possible."""
        self.piece_x += dx
        self.piece_y += dy
        if self.check_collision():
            self.piece_x -= dx
            self.piece_y -= dy
            return False
        return True

    def drop(self) -> None:
        """Drop the current piece and create a new one."""
        while self.move(0, 1):
            pass
        self.freeze()
        self.clear_lines()
        self.new_piece()

    def freeze(self) -> None:
        """Freeze the current piece on the board."""
        for x, y in self.piece:
            if self.piece_y + y >= 0:
                self.board[self.piece_y + y][self.piece_x + x] = 1

    def clear_lines(self) -> None:
        """Clear complete lines and update score."""
        lines_cleared = 0
        y = self.height - 1
        while y >= 0:
            if all(self.board[y]):
                lines_cleared += 1
                for y2 in range(y, 0, -1):
                    self.board[y2] = self.board[y2 - 1].copy()
                self.board[0] = [0] * self.width
            else:
                y -= 1
        
        self.score += lines_cleared * 100
        # Increase speed with score
        self.speed = max(0.1, 0.5 - (self.score // 1000) * 0.05)

def main(stdscr) -> None:
    # Set up colors
    curses.start_color()
    curses.init_pair(1, curses.COLOR_WHITE, curses.COLOR_BLACK)
    curses.init_pair(2, curses.COLOR_CYAN, curses.COLOR_BLACK)
    
    # Hide cursor
    curses.curs_set(0)
    
    # Initialize game
    game = Tetris()
    last_move_time = time.time()
    
    while not game.game_over:
        # Clear screen
        stdscr.clear()
        
        # Draw board
        for y in range(game.height):
            for x in range(game.width):
                char = '□' if game.board[y][x] else '·'
                stdscr.addstr(y + 1, x * 2 + 1, char, curses.color_pair(1))
        
        # Draw current piece
        for x, y in game.piece:
            if game.piece_y + y >= 0:
                stdscr.addstr(game.piece_y + y + 1, 
                            (game.piece_x + x) * 2 + 1, 
                            '■', 
                            curses.color_pair(2))
        
        # Draw score
        stdscr.addstr(0, 0, f'Score: {game.score}')
        
        # Refresh screen
        stdscr.refresh()
        
        # Handle input
        stdscr.nodelay(1)
        key = stdscr.getch()
        
        if key == ord('q'):
            break
        elif key == curses.KEY_LEFT:
            game.move(-1, 0)
        elif key == curses.KEY_RIGHT:
            game.move(1, 0)
        elif key == curses.KEY_UP:
            game.rotate()
        elif key == curses.KEY_DOWN:
            game.move(0, 1)
        elif key == ord(' '):
            game.drop()
        
        # Automatic piece movement
        current_time = time.time()
        if current_time - last_move_time > game.speed:
            if not game.move(0, 1):
                game.freeze()
                game.clear_lines()
                game.new_piece()
            last_move_time = current_time

    # Game over screen
    stdscr.nodelay(0)
    stdscr.clear()
    stdscr.addstr(game.height // 2, 
                  (game.width * 2 - 20) // 2, 
                  f'Game Over! Score: {game.score}')
    stdscr.addstr(game.height // 2 + 1, 
                  (game.width * 2 - 24) // 2, 
                  'Press any key to exit...')
    stdscr.refresh()
    stdscr.getch()

if __name__ == '__main__':
    curses.wrapper(main)
