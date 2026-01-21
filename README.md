# **Tetris 🧱**

A classic implementation of the Tetris game written in JavaScript, designed specifically to run on microcontrollers and embedded devices with limited resources.

This game is designed for low-resolution screens and is **recommended for use with Lilygo T-Embed** devices running **Bruce Firmware**.

## **⚡ Quick Installation (Beginner's Guide)**

Follow these 3 simple steps to start playing immediately:

1. **Prepare the File**: Save the game code as tetris.js on your computer.  
2. **Upload**:  
   * Connect your T-Embed to WiFi (or its Hotspot) to access the **Bruce Web Interface**.  
   * Go to **File Manager**.  
   * Open the /apps folder.  
   * Upload tetris (Lilygo T Embed) / tetris_games_m5stickcplus2.js (m5stickcplus2)
3. **Play**:  
   * On your T-Embed screen, open the main menu.  
   * Go to **Files** or **Launcher**.  
   * Select tetris.js to start the game\!

## **🎮 Features**

* **Classic Gameplay**: Accurate rotation, movement, and line clearing mechanisms (7-bag system).  
* **Colorful Graphics**: Supports unique color palettes for each Tetromino shape (I, J, L, O, S, T, Z).  
* **Level & Score System**:  
  * Score increases when lines are cleared.  
  * Level up for every 5 lines cleared.  
  * Drop speed increases as the level rises.  
* **Informative UI**: Displays "Next Piece", Score, Level, and current Speed.  
* **Sound Effects**: Simple audio feedback using tones for rotation, game over, and line clears.  
* **Responsive**: Uses sprite buffering for smooth rendering without flickering, adapted to the T-Embed refresh rate.

## **🛠️ Hardware & Software Prerequisites**

This game was developed and tested in the following environment:

* **Device**: Lilygo T-Embed (Recommended)  
* **Firmware**: Bruce Firmware (supports standard display, keyboard, audio modules)

### **Display & Input Specifications**

The code automatically adjusts the board position (centering) based on the T-Embed screen resolution. Input utilizes the *rotary encoder* (dial) or physical buttons available on the T-Embed unit according to the Bruce firmware mapping.

## **🕹️ Controls (Lilygo T-Embed)**

| Button / Input | Menu Function | In-Game Function |
| :---- | :---- | :---- |
| **Dial Press (Select)** | Start Game / Restart | Rotate Block |
| **Dial Left / Prev** | \- | Move Left |
| **Dial Right / Next** | \- | Move Right |
| **Button / Esc** | Exit | Exit to Menu |

## **📂 Code Structure**

* **Configuration**: Color settings and Tetromino shape definitions (Coordinate arrays).  
* **Main Loop**: A while(true) loop handling timing, input, logic updates, and rendering.  
* **Logic Functions**:  
  * checkCollision(): Detects collisions with walls or the stack of blocks.  
  * checkLines(): Clears full lines and shifts the grid down.  
  * drawBlock(): Draws an 8x8 pixel block to the screen buffer.

## **📜 License**
This project is open-source. Feel free to use and modify it according to your needs.

Made with ❤️ using JavaScript for the Bruce Firmware Community.

Github / Discord by : metalgalz

![alt text](https://github.com/metalgalz/Tetris-Games-Bruce-Firmware/blob/main/Lilygo%20T%20Embed.jpg?raw=true)
