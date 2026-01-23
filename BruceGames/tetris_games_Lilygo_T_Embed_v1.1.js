var display = require('display');
var keyboard = require('keyboard');
var audio = require('audio');

function main() {
  // --- KONFIGURASI LAYAR ---
  var dw = display.width();
  var dh = display.height();
  
  // Warna
  var black = display.color(0, 0, 0);
  var white = display.color(255, 255, 255);
  var grey = display.color(40, 40, 40);
  var colorBorder = display.color(150, 150, 150);

  // Palet Warna Tetromino
  var colors = [
    black,                        // 0: Empty
    display.color(0, 255, 255),   // 1: I (Cyan)
    display.color(0, 0, 255),     // 2: J (Blue)
    display.color(255, 165, 0),   // 3: L (Orange)
    display.color(255, 255, 0),   // 4: O (Yellow)
    display.color(0, 255, 0),     // 5: S (Green)
    display.color(128, 0, 128),   // 6: T (Purple)
    display.color(255, 0, 0)      // 7: Z (Red)
  ];

  // --- HELPER GRAFIS ---
  function createSolidData(w, h) {
    var bytesPerRow = Math.floor((w + 7) / 8);
    var size = bytesPerRow * h;
    var data = new Uint8Array(size);
    for (var i = 0; i < size; i++) {
      data[i] = 0xFF;
    }
    return data;
  }

  // REVISI: Kembalikan ukuran blok ke 8px agar muat di layar
  var blockSize = 8;
  var blockGap = 1;
  var blockTotal = blockSize + blockGap;
  var blockSprite = createSolidData(blockSize, blockSize);

  // Grid Game (10x18)
  var cols = 10;
  var rows = 18;
  
  // Hitung ukuran papan total dalam pixel
  // Height = (18 * 9) + 1 = 163px (Muat di layar 170px)
  var boardPixelW = (cols * blockTotal) + blockGap;
  var boardPixelH = (rows * blockTotal) + blockGap;
  
  // Posisi Board di Tengah Layar
  var offsetX = Math.floor((dw - boardPixelW) / 2);
  var offsetY = Math.floor((dh - boardPixelH) / 2);
  // Pastikan offsetY tidak minus
  if (offsetY < 0) offsetY = 0;
  
  // Data Grid (Array 1D: rows * cols)
  var grid = new Uint8Array(cols * rows);

  // Definisi Bentuk Tetromino
  var shapes = [
    [], // 0
    // 1: I
    [ [{x:-1,y:0}, {x:0,y:0}, {x:1,y:0}, {x:2,y:0}], [{x:1,y:-1}, {x:1,y:0}, {x:1,y:1}, {x:1,y:2}] ],
    // 2: J
    [ [{x:-1,y:-1}, {x:-1,y:0}, {x:0,y:0}, {x:1,y:0}], [{x:0,y:-1}, {x:1,y:-1}, {x:0,y:0}, {x:0,y:1}], [{x:-1,y:0}, {x:0,y:0}, {x:1,y:0}, {x:1,y:1}], [{x:0,y:-1}, {x:0,y:0}, {x:-1,y:1}, {x:0,y:1}] ],
    // 3: L
    [ [{x:-1,y:0}, {x:0,y:0}, {x:1,y:0}, {x:1,y:-1}], [{x:0,y:-1}, {x:0,y:0}, {x:0,y:1}, {x:1,y:1}], [{x:-1,y:1}, {x:-1,y:0}, {x:0,y:0}, {x:1,y:0}], [{x:-1,y:-1}, {x:0,y:-1}, {x:0,y:0}, {x:0,y:1}] ],
    // 4: O
    [ [{x:0,y:0}, {x:1,y:0}, {x:0,y:1}, {x:1,y:1}] ],
    // 5: S
    [ [{x:-1,y:1}, {x:0,y:1}, {x:0,y:0}, {x:1,y:0}], [{x:0,y:-1}, {x:0,y:0}, {x:1,y:0}, {x:1,y:1}] ],
    // 6: T
    [ [{x:-1,y:0}, {x:0,y:0}, {x:1,y:0}, {x:0,y:-1}], [{x:0,y:-1}, {x:0,y:0}, {x:0,y:1}, {x:1,y:0}], [{x:-1,y:0}, {x:0,y:0}, {x:1,y:0}, {x:0,y:1}], [{x:0,y:-1}, {x:0,y:0}, {x:0,y:1}, {x:-1,y:0}] ],
    // 7: Z
    [ [{x:-1,y:0}, {x:0,y:0}, {x:0,y:1}, {x:1,y:1}], [{x:1,y:-1}, {x:1,y:0}, {x:0,y:0}, {x:0,y:1}] ]
  ];

  // Game State
  var state = 0; // 0: Menu, 1: Play, 2: GameOver
  var score = 0;
  var level = 1;
  var linesTotal = 0;
  
  var curPiece = { id: 1, rot: 0, x: 4, y: 0 };
  var nextPieceId = 0;
  
  var dropTimer = 0;
  var dropInterval = 600; 
  var lastTime = now();

  var lastRotateTime = 0;
  var rotateCooldown = 200;
  var lastMoveTime = 0;
  var moveCooldown = 100;

  // --- LOGIKA UTAMA ---

  function resetGame() {
    for(var i=0; i<grid.length; i++) grid[i] = 0;
    score = 0;
    level = 1;
    linesTotal = 0;
    dropInterval = 600; 
    nextPieceId = Math.floor(Math.random() * 7) + 1;
    spawnPiece();
  }

  function spawnPiece() {
    curPiece.id = nextPieceId;
    curPiece.rot = 0;
    curPiece.x = 4;
    curPiece.y = 0;
    nextPieceId = Math.floor(Math.random() * 7) + 1;
    
    if (checkCollision(curPiece.x, curPiece.y, curPiece.rot)) {
       state = 2;
       audio.tone(150, 500);
    }
  }

  function getShape(id, rot) {
    var s = shapes[id];
    return s[rot % s.length];
  }

  function checkCollision(cx, cy, crot) {
    var shape = getShape(curPiece.id, crot);
    for (var i=0; i<shape.length; i++) {
      var px = cx + shape[i].x;
      var py = cy + shape[i].y;
      if (px < 0 || px >= cols || py >= rows) return true;
      if (py >= 0 && grid[py * cols + px] !== 0) return true;
    }
    return false;
  }

  function lockPiece() {
    var shape = getShape(curPiece.id, curPiece.rot);
    for (var i=0; i<shape.length; i++) {
      var px = curPiece.x + shape[i].x;
      var py = curPiece.y + shape[i].y;
      if (py >= 0 && px >= 0 && px < cols && py < rows) {
        grid[py * cols + px] = curPiece.id;
      }
    }
    audio.tone(200, 50);
    checkLines();
    spawnPiece();
  }

  function checkLines() {
    var linesCleared = 0;
    for (var r = rows - 1; r >= 0; r--) {
      var full = true;
      for (var c = 0; c < cols; c++) {
        if (grid[r * cols + c] === 0) {
          full = false;
          break;
        }
      }
      if (full) {
        linesCleared++;
        for (var rr = r; rr > 0; rr--) {
          for (var cc = 0; cc < cols; cc++) {
            grid[rr * cols + cc] = grid[(rr - 1) * cols + cc];
          }
        }
        for (var cc = 0; cc < cols; cc++) grid[cc] = 0;
        r++;
      }
    }
    
    if (linesCleared > 0) {
      score += linesCleared * 100;
      linesTotal += linesCleared;
      audio.tone(600 + (linesCleared * 200), 100);
      level = Math.floor(linesTotal / 5) + 1;
      dropInterval = Math.max(50, 600 - ((level - 1) * 50));
    }
  }

  function drawBlock(px, py, colorIdx) {
     sprite.drawXBitmap(px, py, blockSprite, blockSize, blockSize, colors[colorIdx]);
  }

  var borderH = createSolidData(boardPixelW + 4, 2);
  var borderV = createSolidData(2, boardPixelH + 4);

  // --- INISIALISASI ---
  var sprite = display.createSprite();
  keyboard.setLongPress(true);

  // --- GAME LOOP ---
  while(true) {
    var currTime = now();
    var dt = currTime - lastTime;
    
    if (keyboard.getEscPress(true)) break;

    var left = keyboard.getPrevPress(true);
    var right = keyboard.getNextPress(true);
    var rotate = keyboard.getSelPress(true); 
    
    if (state === 0) {
        // === MENU ===
        sprite.fill(black);
        sprite.setTextColor(white);
        sprite.setTextSize(1);
        sprite.setTextAlign(1);
        sprite.drawText("TETRIS", dw/2 - 20, dh/2 - 20);
        sprite.drawText("Press SELECT", dw/2 - 40, dh/2 + 10);
        
        if (rotate) {
           resetGame();
           state = 1;
           lastTime = now();
           audio.tone(600, 100);
        }
        sprite.pushSprite();
        delay(50);

    } else if (state === 1) {
        // === PLAY ===
        
        if (currTime - lastMoveTime > moveCooldown) {
            if (left) {
               if (!checkCollision(curPiece.x - 1, curPiece.y, curPiece.rot)) {
                 curPiece.x--;
                 lastMoveTime = currTime;
               }
            } else if (right) {
               if (!checkCollision(curPiece.x + 1, curPiece.y, curPiece.rot)) {
                 curPiece.x++;
                 lastMoveTime = currTime;
               }
            }
        }
        
        if (rotate) {
           if (currTime - lastRotateTime > rotateCooldown) {
               var nextRot = curPiece.rot + 1;
               if (!checkCollision(curPiece.x, curPiece.y, nextRot)) {
                 curPiece.rot = nextRot;
                 lastRotateTime = currTime;
                 audio.tone(400, 20);
               } else {
                 if (!checkCollision(curPiece.x - 1, curPiece.y, nextRot)) {
                    curPiece.x--;
                    curPiece.rot = nextRot;
                    lastRotateTime = currTime;
                 } else if (!checkCollision(curPiece.x + 1, curPiece.y, nextRot)) {
                    curPiece.x++;
                    curPiece.rot = nextRot;
                    lastRotateTime = currTime;
                 }
               }
           }
        }
        
        dropTimer += dt;
        if (dt > 200) dt = 0;
        
        if (dropTimer > dropInterval) {
           dropTimer = 0;
           if (!checkCollision(curPiece.x, curPiece.y + 1, curPiece.rot)) {
              curPiece.y++;
           } else {
              lockPiece();
           }
        }
        lastTime = currTime;

        // 4. Render
        sprite.fill(black);
        
        // --- DRAW BOARD ---
        sprite.drawXBitmap(offsetX - 2, offsetY - 2, borderH, boardPixelW + 4, 2, colorBorder); 
        sprite.drawXBitmap(offsetX - 2, offsetY + boardPixelH, borderH, boardPixelW + 4, 2, colorBorder); 
        sprite.drawXBitmap(offsetX - 2, offsetY - 2, borderV, 2, boardPixelH + 4, colorBorder); 
        sprite.drawXBitmap(offsetX + boardPixelW, offsetY - 2, borderV, 2, boardPixelH + 4, colorBorder); 
        
        for (var r=0; r<rows; r++) {
          for (var c=0; c<cols; c++) {
             var val = grid[r*cols+c];
             if (val > 0) {
                 var px = offsetX + blockGap + (c * blockTotal);
                 var py = offsetY + blockGap + (r * blockTotal);
                 drawBlock(px, py, val);
             }
          }
        }
        
        var shape = getShape(curPiece.id, curPiece.rot);
        for (var i=0; i<shape.length; i++) {
           var bx = curPiece.x + shape[i].x;
           var by = curPiece.y + shape[i].y;
           if (by >= 0) {
               var px = offsetX + blockGap + (bx * blockTotal);
               var py = offsetY + blockGap + (by * blockTotal);
               drawBlock(px, py, curPiece.id);
           }
        }
        
        // --- DRAW SIDEBARS (Layout Kembali Standard) ---
        sprite.setTextColor(white);
        sprite.setTextAlign(0); // Left align
        
        // KIRI: NEXT PIECE
        // Posisi: Sebelah kiri board, sekitar 35-40px
        var leftBaseX = offsetX - 40; 
        if (leftBaseX < 2) leftBaseX = 2; // Clamp kiri

        sprite.drawText("Next", leftBaseX, offsetY);
        
        var nextShape = getShape(nextPieceId, 0); 
        var nextOffsetX = leftBaseX; 
        var nextOffsetY = offsetY + 12;
        
        for(var i=0; i<nextShape.length; i++) {
            var nx = nextOffsetX + ((nextShape[i].x + 1) * blockTotal);
            var ny = nextOffsetY + ((nextShape[i].y + 1) * blockTotal);
            drawBlock(nx, ny, nextPieceId);
        }

        // KANAN: STATS
        var statsX = offsetX + boardPixelW + 8;
        
        sprite.drawText("Score", statsX, offsetY);
        sprite.drawText("" + score, statsX, offsetY + 10);
        
        sprite.drawText("Lvl", statsX, offsetY + 30);
        sprite.drawText("" + level, statsX, offsetY + 40);
        
        sprite.drawText("Spd", statsX, offsetY + 60);
        sprite.drawText("" + dropInterval, statsX, offsetY + 70);
        
        sprite.pushSprite();
        delay(20);
        
    } else {
        // === GAME OVER ===
        sprite.fill(black);
        sprite.setTextColor(white);
        sprite.setTextAlign(1); // Center Align
        sprite.drawText("GAME OVER", dw/2 - 35, dh/2 - 10);
        sprite.drawText("Score: " + score, dw/2 - 30, dh/2 + 10);
        
        if (rotate) {
           state = 0;
           delay(300);
        }
        sprite.pushSprite();
        delay(50);
    }
  }
  
  keyboard.setLongPress(false);
}

main();