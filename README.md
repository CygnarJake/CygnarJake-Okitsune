# CygnarJake's Okitsune
My modified version of Nine-Tailed Okitsune Tale. Includes many bug fixes, a few new features, and easy language swapping. Supported languages are: Japanese, English, Spanish, Portuguese (w.i.p), Korean, Simplified Chinese.

## Table of Contents
- [Installation Instructions](#installation-instructions)
- [Features](#features)
- [Planned Updates](#planned-updates)
- [Contact Me](#contact-me)
- [Mod Credits](#mod-credits)

## Installation Instructions

### 1. Configure the game's language to English or Japanese.
a. Right-click the icon of **Nine-Tailed Okitsune Tale** in your Steam library.<br>
b. Select **“Properties”**. In **“General”**, ensure the language is set the language to **English** or **Japanese**.<br>
c. Allow the game to finish updating.

> The installer is not able to perform an installation of the commercial version's files to the Simplified Chinese version of the game. To play the Simplified Chinese translation of the full commercial game with this mod, do the installation as described here, then you will be able to set the language from the options window in-game.


### 2. Download the installer.
a. Right-click the icon again in your Steam library and select **“Manage” → “Browse local files”**.<br>
b. Download the installer `(NTOT-Mod-Setup).exe` and place it inside the game’s main folder: **`古今東西おきつね物語`** or **`古今東西おきつね物語 Demo`**.

> `(NTOT-Mod-Setup)_Light.exe` does not include unlockable character outfit images or the custom Gojinkasai cutscene made for this mod. Excluding these reduces the installer size to half its original. All files can be found in and replaced from the `FILES` folder on this GitHub page.


### 3. Run the installer.
a. Double-click the installer file to begin installation. Follow the messages in the menu that opens.<br>
b. The installer will ask for a password. The password is: **`古今東西おきつね物語`**.<br>
c. Allow the installer to finish. Once it has, you’re done!

> You may delete the installer if you wish.<br>

### Manual Installation
You may download the folder `FILES` and perform a manual install. Download `FILES`, then copy&paste the files of each subfolder into their respective equivalents of `www`, overwriting the previous versions. `libGLESv2.dll` goes directly into `www`. Note, however, `FILES` does not contain all of the necessary files for the full version of the game, only the demo version.

### Update Instructions
1. Make sure to backup your www\save folder. You won’t have to delete it to update the mod, but it’s a good idea to save a copy of it just in case.
2. Most likely, updated files will be able to be found in the `FILES` folder. Download it, and copy&paste the files from its subfolders into www’s versions, overwriting the previous ones.
3. Otherwise, you can delete the folders in www (other than ‘save’), verify the integrity of your files through Steam, then download the new version of the installer and run it.

### Can I use my save file from the vanilla game?
Yes. You can install the mod and load your existing save just as before. However, note that there is a rare bug that might cause Kohaku to freeze after some interactions if a pre-mod save is in use. To address this, the new keybind "Unstuck" has been added. Before you load your save, go into the Options from the title screen, select the input configuration of your device, and make sure you have a key set to do the "Unstuck" action.<br>
Also, the correct language-specific images may not activate correctly when you first load your vanilla save. I suggest that on your first launch of the game, load your save, save it and return to the title screen, then load it again.

---

## Features
1. Multiple saves! Now, record up to 99 save slots!<br>
2. Outfits! Once you complete the game, you'll be able to unlock outfits.<br>
	- *Outfits carry over across saves.*<br>
	- *To change outfits, interact with the closet inside the terakoya, or inside Kohaku's house.*<br>
3. Message logging! Open the message log to read previously displayed text. The default key is Q.<br>
4. Toggle the UI on/off. The default key is TAB.<br>
5. All official translations are included, as well as fan-made Korean and Spanish versions. Easily switch between languages from the options window.<br>
	- *Additional text/translations have been added, such as for bosses’ spoken words during battles.*<br>
	- *Some refinements have been made to the English version.*<br>
6. Fishing and digging have been refreshed from the vanilla game, rewarding the player more and benefitting from omikuji!
7. Numerous bug fixes and performance improvements.<br>
	- *Ability to manually set the rendering mode.*

---

## Planned Updates
**(Unordered)**<br>
1. A Portuguese translation is planned. Currently, image assets have been created, but the majority of the game's text will need to be translated.
2. Currently, all outfits still need many sprites to be made for them to be complete.
3. Translating entries in the dictionary found within the terakoya.

### Known Bugs
1. The audio can cut out at times, especially if it's been running for a while. This is a problem in the vanilla game as well. Unfortunately, from what I've looked into this might be an issue with RPG Maker games and Nvidia, so I'm not sure there's anything I can do about it. If I can fix it though, I'll try.
2. I've had a crash reported to me, `Cannot read property 'resolution' of undefined`. I've not been able to replicate this, but my guess is that it's correlated with `[Violation] 'requestAnimationFrame' handler took ...ms`. I'll see what I can do.
3. On rare occasions, Kohaku can become frozen after certain interactions such as cutscenes or being hit by enemies. This appears to occur only when the save you're playing on originated from the umodded vanilla game. For the moment, an "Unstuck" key has been added which will hopefully be able to fix the issue if it occurs to you. "U" is the default on keyboards and "R3" on controllers, but make sure you have it bound before resuming the game from a pre-mod vanilla save. Additionally, teleporting to Henbou Pass so that the monimole at the start hits you can also fix the bug.

---

## Contact Me
I’d be happy to take any feedback on my Spanish translation, additional outfits/outfit assets for the outfit mod, or reports on bugs I might’ve missed (or added, but hopefully not). If you wish to contact me, the best place would be through the unofficial Makemon server, through the link below. There, navigate to Casual Topics > your-projects > Okitsune Mod/Overhaul.<br>
`https://discord.com/invite/xHrr3vYYzz`

---

## Mod Credits
|	**CygnarJake** (me) - All mod development. Spanish translation.<br>
|	**SHINGIKO WORLD** - Korean translation & assets.

### Outfit Credits
|	**Nanashi** - Standing pictures.<br>
|	**Mutya** - Standing pictures & sprites.<br>
|	**Memories** - Standing pictures.