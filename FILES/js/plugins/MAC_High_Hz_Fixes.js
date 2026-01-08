/*:
 * @plugindesc (v1.1) Fixes various issues on high refresh rate monitors
 * @author Mac15001900
 * 
 * @help
 * This plugin fixes various issues on high refresh rate monitors.
 * No configuration is needed.
 * 
 * ----------------------------------- Terms ------------------------------------
 *
 * This plugin is available under the MIT Licence. You're free to use it in any
 * games, commercial or not, or use the code in your own plugins. Credit is
 * appreciated, but not required. If your credits include links, please link to
 * https://mac15001900.itch.io/
 * 
 */

//Removed FPS-related functions from SceneManager.update
SceneManager.update = function () {
    try {
        // this.tickStart();
        if (Utils.isMobileSafari()) {
            this.updateInputData();
        }
        this.updateManagers();
        this.updateMain();
        // this.tickEnd();
    } catch (e) {
        this.catchException(e);
    }
};

//Added FPS-related functions here and changed renderScene to only be called when at least one logical frame happened
SceneManager.updateMain = function () {
    let ranFrame = false;
    if (Utils.isMobileSafari()) {
        this.tickStart();
        this.changeScene();
        this.updateScene();
        ranFrame = true;
    } else {
        var newTime = this._getTimeInMsWithoutMobileSafari();
        var fTime = (newTime - this._currentTime) / 1000;
        if (fTime > 0.25) fTime = 0.25;
        this._currentTime = newTime;
        this._accumulator += fTime;
        while (this._accumulator >= this._deltaTime) {
            if (!ranFrame) this.tickStart();
            ranFrame = true;
            this.updateInputData();
            this.changeScene();
            this.updateScene();
            this._accumulator -= this._deltaTime;
        }
    }
    if (ranFrame) {
        this.renderScene();
        this.tickEnd();
    }
    this.requestUpdate();
};

//Fixed a rare graphics freeze that would happen when this._skipCount became negative, and removed frame counting
Graphics.render = function (stage) {
    if (this._skipCount <= 0) {
        var startTime = Date.now();
        if (stage) {
            this._renderer.render(stage);
            if (this._renderer.gl && this._renderer.gl.flush) {
                this._renderer.gl.flush();
            }
        }
        var endTime = Date.now();
        var elapsed = endTime - startTime;
        this._skipCount = Math.min(Math.floor(elapsed / 15), this._maxSkip);
        this._rendered = true;
    } else {
        this._skipCount--;
        this._rendered = false;
    }
};

//Moved framecounting to SceneManager.updateScene
void ((alias) => {
    SceneManager.updateScene = function () {
        alias.call(this);
        Graphics.frameCount++;
    }
})(SceneManager.updateScene);