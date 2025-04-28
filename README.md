# 🚀 [Download Latest Version Here](https://github.com/VoIcanis/S1MPL/releases)

# S1MPL — Schedule 1 Multiplayer Loader

**S1MPL** (Schedule 1 Multiplayer Loader) is a lightweight, standalone tool for managing save data and player characters for the game **Schedule I**.

- 🚀 Quickly inject or extract player characters between saves
- 📂 Manage local saves and player data folders easily
- 🔒 100% offline, secure, no server needed
- 🎯 Minimal, fast, easy-to-use Electron app

---

## 📥 Download

The latest compiled `.exe` is available on the [Releases page](https://github.com/VoIcanis/S1MPL/releases).

If you want just the source code (and know how to build Electron apps), you can clone this repository.

---

## Features
- **Auto-detect your Steam ID** (no manual input needed)
- **Browse and refresh** local save slots
- **Import / Export** entire save files (.zip format)
- **Extract individual players** from saves into separate folders
- **Inject players** into any save slot (as main or secondary player)
- **Handles conflicts** (warns about overwriting existing data)
- **Dark mode interface** with custom window controls
- **No installation required** — portable app

---

## How It Works

- **Save Management:**  
  - Open your save slots
  - Export them into a `.zip`
  - Import new save files easily
  
- **Player Management:**  
  - Extract specific players from a save into `playerdata/`
  - Inject extracted players into a new or existing save
  - Choose to inject as a **main player** or a **secondary player**

- **Automatic Steam ID Detection:**  
  Reads from your local Steam login file to automatically locate your game saves.

---

## System Requirements
- Windows 10 or later
- Steam version of **Schedule I**

---

## How To Use

1. Download the `.exe` from the [Releases page](https://github.com/VoIcanis/S1MPL/releases).
2. Run **S1MPL.exe** (run as admin if needed).
3. **Refresh Saves** using the `Refresh Local Saves` button.
4. **Manage Your Saves:**
   - Import `.zip` save files into the game
   - Export saves to `.zip` backups
5. **Manage Players:**
   - Extract players from a save
   - Inject players into new or existing save slots

---

## Notes

- First time use will auto-create `savedata/` and `playerdata/` folders next to the app.
- Make backups before importing new data if you're unsure.
- Steam must be installed normally to auto-detect your saves.

---

## License

Released as-is for public use.  
No warranty. Not affiliated with TVGS or the Schedule I developers.  
Use at your own risk.

---

# 📂 Folder Layout Example
```
S1MPL/
├── S1MPL.exe
├── assets/
├── playerdata/
├── savedata/
```

---

# 🛡️ Final Reminder

Always back up your original saves before modifying anything!  
S1MPL makes multiplayer sharing easier — but your data is your responsibility.
