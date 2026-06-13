# CygnarJake's Okitsune
My modified version of Nine-Tailed Okitsune Tale. Includes many bug fixes, a few new features, and easy language swapping. Supported languages are: Japanese, English, Spanish, Portuguese (w.i.p), Korean, Simplified Chinese.

## Table of Contents
- [Installation Instructions](#installation-instructions)
- [Features](#features)
- [Planned Updates](#planned-updates)
- [Contact Me](#contact-me)
- [Mod Credits](#mod-credits)

## Installation Instructions
Installation is currently available for Windows and Linux. The instructions below are identical for Windows and Linux. MAC is currently not supported, however, it appears trivial to add support. I just don't have an Apple computer to test for myself at the moment to confirm what I think but if I ever do I'll test things out and try to add support.


### 1. Install 7-Zip
If you don't already have it, install 7-Zip at https://www.7-zip.org/. Many tutorials exist for 7-Zip on YouTube and other video sharing platforms if you encounter any issues.


### 2. Download and extract 古今東西おきつね物語.7z
From this GitHub page, download the `古今東西おきつね物語.7z` file. Place it wherever is convenient, then extract it with 7-Zip. Keep the extracted folder open and ready.<br>
If you would like to verify the download of 古今東西おきつね物語.7z, its SHA-256 output should be: `a319d06fcba45f8774977c23fa11c5eb72c22f7319751920873e169c469eea38`.


### 3. Verify integrity of game files and open.
a. Hover over the game's icon in the left panel of your Steam library.<br>
b. `Properties...` > `Installed Files` > `Verify integrity of game files`.<br>
c. Again, hover over the game's icon in the left panel of you Steam library. `Manage` > `Browse local files`. This should open `古今東西おきつね物語` or `古今東西おきつね物語 Demo`.<br>

If you're translating this webpage into a different language than English, the exact button text may be different.


### 4. Cut and paste extracted 7z
Select all files in the folder that was extracted from the 7z file. Cut and paste them into the main game folder - either `古今東西おきつね物語` or `古今東西おきつね物語 Demo`. When prompted, choose to overwrite all duplicate files.<br><br>
	* Note that the extracted folder is caled "古今東西おきつね物語" too. Don't confuse it with the actual folder of the game in your Steam library.<br>
	* It does not matter which language the game is set to, so long as it is in the vanilla state of any of its official language releases (Japanese, English, Simplified Chinese).<br>
	* If installing to the demo version of the game rather than the full paid version, not all data files will be loaded.


### 5. Confirm installation and how to update
Installation is now complete. On the full version of the game, a popup should appear to inform you that the mod has fully installed. If you own the full version and are not getting a proper install, try deleting all files within `古今東西おきつね物語` (ctrl + a then delete) after backing up `古今東西おきつね物語` > `www` > `save` somewhere else on your computer if you have any save data that you don't want to lose. Then, again verify the integrity of game files by following step 3 a and b. Cut and paste all files from the extracted 7z file once more and try again.

Likewise, if you wish to update the mod to a newer version that I may have released, verify file integrity through Steam, download the new `古今東西おきつね物語.7z`, extract it and cut & paste it once more. The Steam integrity must be verified for any mod updates as the mod will be confused if the vanilla files are not present and default to a demo-version install.


### Can I use my save file from the vanilla game?
Yes. You can install the mod and load your existing save just as before. However, note that there is a rare bug that might cause Kohaku to freeze after some interactions if a pre-mod save is in use. To address this, the new keybind "Unstuck" has been added. Before you load your save, go into the Options menu from the title screen, select the input configuration of your device, and make sure you have some key set to do the "Unstuck" action.<br>
Also, the correct language-specific images may not activate correctly when you first load your vanilla save. I suggest that on your first launch of the game, load your save, save it and return to the title screen, then load it again.


### Other Notes
All of the files within `古今東西おきつね物語.7z` are the files in the `古今東西おきつね物語` folder on this GitHub page. The 7z file is used as I experienced issues with some of the large files not downloading correctly with GitHub's standard "Download ZIP" from the Code button. If you do not encounter such issues, you could also download that folder directly.<br>

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
4. Update NW.js version whenever Greenworks is updated. Might look into how to compile the files myself as some basic instructions are given on its GitHub page.
5. Update PIXI version?? Seems difficult, low priority.
6. Updating the NW.js version added a fair number of files. I'm not sure they're all necessary, particularly those in the `locales` folder so I'll be combing through them at some point to verify which are actually needed for Nine-Tailed Okitsune Tail to run.
7. An update for the Korean patch has released. I'll update to the new files as soon as I can.

### Known Bugs
1. The audio can cut out at times, especially if it's been running for a while. This is a problem in the vanilla game as well. Unfortunately, from what I've looked into this might be an issue with RPG Maker games and Nvidia, so I'm not sure there's anything I can do about it. If I can fix it though, I'll try.
2. I've had a crash reported to me, `Cannot read property 'resolution' of undefined`. I've not been able to replicate this, but my guess is that it's correlated with `[Violation] 'requestAnimationFrame' handler took ...ms`. I'll see what I can do.
3. On rare occasions, Kohaku can become frozen after certain interactions such as cutscenes or being hit by enemies. This appears to occur only when the save you're playing on originated from the umodded vanilla game. For the moment, an "Unstuck" key has been added which will hopefully be able to fix the issue if it occurs to you. "U" is the default on keyboards and "R3" on controllers, but make sure you have it bound before resuming the game from a pre-mod vanilla save. Additionally, teleporting to Henbou Pass so that the monimole at the start hits you can also fix the bug.
4. Had a crash occur to me during testing of the 05/24/2026 update upon the map transfer to Hyoi Pass during Risen's quest. Have not been able to replicate, will probably get around to repeat-playing the game many times at some point.
5. Haruchii won't come out of the shrine during Angel's tour of the city. I know why but I won't be able to fix this until mid to late June.
6. You won't be able to reopen the item selection menu at Kosen's hokora if you cancel out of it. Only way to fix this is to leave the map (teleport back to the start of Hyoi Pass) then walk back. Will also fix this once I get my main computer back in mid to late June.
7. Some weird zone issues near the dig site in the second half of Hyoi Pass mess with Kohaku's movement in a mild way.
8. Cheshika's Lost Forest comment about the pink birds won't change after you've slain them.
9. It's possible to attack when first entering Alice's mushroom house then be visually bugged for the start of the cutscene.
10. Some of the staircases in the caves might be slightly odd visually.
11. Possible movement freeze after fishing?
12. Leaving the message log in the middle of a text box with a 'press to continue' toggle will cause issues.
13. The warning about Risen's magic seal in the middle of Henbou Pass still appears once even after defeating him if you hadn't had the interaction with it before.

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
