/*:
 * @plugindesc Built for 古今東西おきつね物語.
 * This plugin accompanies Okitsune_RendererChoice.js.
 * @help
 * When the game restarts due to the player changing the render mode,
 * it will enter full screen mode.
 *
 * I got started with the with code written by user Sabi in this forum discussion:
 * https://steamcommunity.com/app/363890/discussions/0/483368526587764724/
 */

FSInitStart = SceneManager.initialize;
SceneManager.initialize = function() {
    FSInitStart.call(this);

    // If the game restarts due to renderer change, enter full-screen mode
    if (localStorage.getItem("Okitsune_Restart") === "true") {
		Graphics._requestFullScreen();
		localStorage.setItem("Okitsune_Restart", "false");
    }
};
