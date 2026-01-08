/*:
 * NOTE: Images are stored in the img/system folder.
 *
 * @plugindesc Show a Splash Screen "Made with MV" and/or a Custom Splash Screen before going to main screen.
 * @author Dan "Liquidize" Deptula
 *
 * @help
 * ※This is a modified version by CygnarJake for Nine-Tailed Okitsune Tale
 * This plugin does not provide plugin commands.
 *
 * @param Show Made With MV
 * @desc Enabled/Disables showing the "Made with MV" splash screen.
 * OFF - false     ON - true
 * Default: ON
 * @default true
 *
 * @param Made with MV Image
 * @desc The image to use when showing "Made with MV"
 * Default: MadeWithMv
 * @default MadeWithMv
 * @require 1
 * @dir img/system/
 * @type file
 *
 * @param Show Custom Splash
 * @desc Enabled/Disables showing the "Made with MV" splash screen.
 * OFF - false     ON - true
 * Default: OFF
 * @default false
 *
 * @param Custom Image
 * @desc The image to use when showing "Made with MV"
 * Default:
 * @default
 * @require 1
 * @dir img/system/
 * @type file
 *
 * @param Fade Out Time
 * @desc The time it takes to fade out, in frames.
 * Default: 120
 * @default 120
 *
 * @param Fade In Time
 * @desc The time it takes to fade in, in frames.
 * Default: 120
 * @default 120
 *
 * @param Wait Time
 * @desc The time between fading in and out, in frames.
 * Default: 160
 * @default 160
 *
 */
var Liquidize = Liquidize || {};
Liquidize.MadeWithMV = {};
Liquidize.MadeWithMV.Parameters = PluginManager.parameters('MadeWithMv');

Liquidize.MadeWithMV.ShowMV = JSON.parse(Liquidize.MadeWithMV.Parameters["Show Made With MV"]);
Liquidize.MadeWithMV.MVImage = String(Liquidize.MadeWithMV.Parameters["Made with MV Image"]);
Liquidize.MadeWithMV.ShowCustom = JSON.parse(Liquidize.MadeWithMV.Parameters["Show Custom Splash"]);
Liquidize.MadeWithMV.CustomImage = String(Liquidize.MadeWithMV.Parameters["Custom Image"]);
Liquidize.MadeWithMV.FadeOutTime = Number(Liquidize.MadeWithMV.Parameters["Fade Out Time"]) || 120;
Liquidize.MadeWithMV.FadeInTime = Number(Liquidize.MadeWithMV.Parameters["Fade In Time"]) || 120;
Liquidize.MadeWithMV.WaitTime = Number(Liquidize.MadeWithMV.Parameters["Wait Time"]) || 160;

//-----------------------------------------------------------------------------
// Scene_Splash
//
// This is a constructor, implementation is done in the inner scope.

function Scene_Splash() {
    this.initialize.apply(this, arguments);
}

(function () {

    //-----------------------------------------------------------------------------
    // Scene_Boot
    //
    // The scene class for dealing with the game boot.

    var _Scene_Boot_loadSystemImages = Scene_Boot.prototype.loadSystemImages;
    Scene_Boot.prototype.loadSystemImages = function () {
        _Scene_Boot_loadSystemImages.call(this);
        if (Liquidize.MadeWithMV.ShowMV) {
            ImageManager.loadSystem(Liquidize.MadeWithMV.MVImage);
        }
        if (Liquidize.MadeWithMV.ShowCustom) {
            ImageManager.loadSystem(Liquidize.MadeWithMV.CustomImage);
        }
    };

    var _Scene_Boot_start = Scene_Boot.prototype.start;
    Scene_Boot.prototype.start = function () {
        if ((Liquidize.MadeWithMV.ShowMV || Liquidize.MadeWithMV.ShowCustom) && !DataManager.isBattleTest() && !DataManager.isEventTest()) {
            SceneManager.goto(Scene_Splash);
        } else {
            _Scene_Boot_start.call(this);
        }
    };

    //-----------------------------------------------------------------------------
    // Scene_Splash
    //
    // The scene class for dealing with the splash screens.

    Scene_Splash.prototype = Object.create(Scene_Base.prototype);
    Scene_Splash.prototype.constructor = Scene_Splash;

    Scene_Splash.prototype.initialize = function () {
        Scene_Base.prototype.initialize.call(this);
        this._mvSplash = null;
        this._customSplash = null;
        this._mvWaitTime = Liquidize.MadeWithMV.WaitTime;
        this._customWaitTime = Liquidize.MadeWithMV.WaitTime;
        this._mvFadeOut = false;
        this._mvFadeIn = false;
        this._customFadeOut = false;
        this._customFadeIn = false;
    };

    Scene_Splash.prototype.create = function () {
        Scene_Base.prototype.create.call(this);
        this.createSplashes();
    };

    Scene_Splash.prototype.start = function () {
        Scene_Base.prototype.start.call(this);
        SceneManager.clearStack();
        if (this._mvSplash != null) {
            this.centerSprite(this._mvSplash);
        }
        if (this._customSplash != null) {
            this.centerSprite(this._customSplash);
        }
    };

    Scene_Splash.prototype.update = function () {
        if (Liquidize.MadeWithMV.ShowMV) {
            if (!this._mvFadeIn) {
                this.startFadeIn(Liquidize.MadeWithMV.FadeInTime, false);
                this._mvFadeIn = true;
            } else {
                if (this._mvWaitTime > 0 && this._mvFadeOut == false) {
                    this._mvWaitTime--;
                } else {
                    if (this._mvFadeOut == false) {
                        this._mvFadeOut = true;
                        this.startFadeOut(Liquidize.MadeWithMV.FadeOutTime, false);
                    }
                }
            }
        }

        if (Liquidize.MadeWithMV.ShowCustom) {
            if (Liquidize.MadeWithMV.ShowMV && this._mvFadeOut == true) {
                if (!this._customFadeIn && this._fadeDuration == 0) {
                    this._customSplash.opacity = 255;
                    this._customWaitTime = Liquidize.MadeWithMV.WaitTime;
                    this.startFadeIn(Liquidize.MadeWithMV.FadeInTime, false);
                    this._customFadeIn = true;
                } else {
                    if (this._customWaitTime > 0 && this._customFadeOut == false) {
                        this._customWaitTime--;
                    } else {
                        if (this._customFadeOut == false) {
                            this._customFadeOut = true;
                            this.startFadeOut(Liquidize.MadeWithMV.FadeOutTime, false);
                        }
                    }
                }
            } else if (!Liquidize.MadeWithMV.ShowMV) {
                if (!this._customFadeIn) {
                    this._customSplash.opacity = 255;
                    this.startFadeIn(Liquidize.MadeWithMV.FadeInTime, false);
                    this._customFadeIn = true;
                } else {
                    if (this._customWaitTime > 0 && this._customFadeOut == false) {
                        this._customWaitTime--;
                    } else {
                        if (this._customFadeOut == false) {
                            this._customFadeOut = true;
                            this.startFadeOut(Liquidize.MadeWithMV.FadeOutTime, false);
                        }
                    }
                }
            }
        }

        if (Liquidize.MadeWithMV.ShowCustom) {
            if (Liquidize.MadeWithMV.ShowMV && this._mvFadeOut == true && this._customFadeOut == true) {
                this.gotoTitleOrTest();
            } else if (!Liquidize.MadeWithMV.ShowMV && this._customFadeOut == true) {
                this.gotoTitleOrTest();
            }
        } else {
            if (this._mvFadeOut == true) {
                this.gotoTitleOrTest();
            }
        }

        Scene_Base.prototype.update.call(this);
    };

    Scene_Splash.prototype.createSplashes = function () {
        if (Liquidize.MadeWithMV.ShowMV) {
            this._mvSplash = new Sprite(ImageManager.loadSystem(Liquidize.MadeWithMV.MVImage));
            this.addChild(this._mvSplash);
        }
        if (Liquidize.MadeWithMV.ShowCustom) {
            this._customSplash = new Sprite(ImageManager.loadSystem(Liquidize.MadeWithMV.CustomImage));
            this._customSplash.opacity = 0;
            this.addChild(this._customSplash);
        }
    };

    Scene_Splash.prototype.centerSprite = function (sprite) {
        sprite.x = Graphics.width / 2;
        sprite.y = Graphics.height / 2;
        sprite.anchor.x = 0.5;
        sprite.anchor.y = 0.5;
    };

    Scene_Splash.prototype.gotoTitleOrTest = function () {
        Scene_Base.prototype.start.call(this);
        SoundManager.preloadImportantSounds();
        if (DataManager.isBattleTest()) {
            DataManager.setupBattleTest();
            SceneManager.goto(Scene_Battle);
        } else if (DataManager.isEventTest()) {
            DataManager.setupEventTest();
            SceneManager.goto(Scene_Map);
        } else {
            this.checkPlayerLocation();
            DataManager.setupNewGame();
            SceneManager.goto(Scene_Title);
            Window_TitleCommand.initCommandPosition();
        }
        this.updateDocumentTitle();
    };

    Scene_Splash.prototype.updateDocumentTitle = function () {
        document.title = $dataSystem.gameTitle;
    };

    Scene_Splash.prototype.checkPlayerLocation = function () {
        if ($dataSystem.startMapId === 0) {
            throw new Error('Player\'s starting position is not set');
        }
    };

})();

/*
-----------------------------------------------------------------------------------------------------------------------------
OKITSUNE: New/Patch code below.
-----------------------------------------------------------------------------------------------------------------------------
 */

/* =======================================================================
 *  - Skip splash once after an engine restart (localStorage flag)
 *  - Language-aware "Made with MV" splash image (optional per language)
 *  Place this block at the very end of the original MadeWithMv plugin file.
 * ======================================================================= */
(function () {
    var __OKI_prev_SceneManager_initialize = SceneManager.initialize;
    SceneManager.initialize = function () {
        window.__OKI_RESTARTING__ = (localStorage.getItem("Okitsune_Restart") === "true");
        __OKI_prev_SceneManager_initialize.call(this);
    };

    if (typeof window === 'undefined')
        return;
    var LQ = window.Liquidize = window.Liquidize || {};
    LQ.MadeWithMV = LQ.MadeWithMV || {};

    // -------------------------------------------------------------------
    // 1) Optional language table for MV splash variants
    //    Set a language to true to try loading "<MVImage>_<lang>" from img/system
    //    If not found or not enabled, it falls back to the base "<MVImage>".
    // -------------------------------------------------------------------
    LQ.MadeWithMV.SplashLangs = LQ.MadeWithMV.SplashLangs || {
        "日本語": false,
        "English": false,
        "Español": false,
        "Português": false,
        "한국어": true,
        "简体中文": false
    };

    function currentLanguage() {
        try {
            if (typeof ConfigManager !== 'undefined') {
                if (typeof ConfigManager.getLanguage === 'function')
                    return String(ConfigManager.getLanguage());
                if (typeof ConfigManager.language !== 'undefined')
                    return String(ConfigManager.language);
                if (typeof ConfigManager.locale !== 'undefined')
                    return String(ConfigManager.locale);
            }
        } catch (e) {}
        return "";
    }

    // -------------------------------------------------------------------
    // 2) Scene_Boot.start – allow one-time bypass of splash after restart
    //    If localStorage["Okitsune_Restart"] === "true", skip the splash
    //    and immediately proceed with the base start logic.
    // -------------------------------------------------------------------
    var __MWM_prev_Boot_start = Scene_Boot.prototype.start;
    Scene_Boot.prototype.start = function () {
        var restarting = (window.__OKI_RESTARTING__ === true) ||
        (localStorage.getItem("Okitsune_Restart") === "true");

        if (restarting) {
            // force-disable splashes for this boot only
            var prevMV = Liquidize.MadeWithMV.ShowMV;
            var prevCustom = Liquidize.MadeWithMV.ShowCustom;
            Liquidize.MadeWithMV.ShowMV = false;
            Liquidize.MadeWithMV.ShowCustom = false;

            __MWM_prev_Boot_start.call(this);

            // restore flags; do not touch localStorage
            Liquidize.MadeWithMV.ShowMV = prevMV;
            Liquidize.MadeWithMV.ShowCustom = prevCustom;
            window.__OKI_RESTARTING__ = false;
            return;
        }

        __MWM_prev_Boot_start.call(this);
    };

    // -------------------------------------------------------------------
    // 3) Scene_Splash.createSplashes – language-aware MV image
    //    We override the creation method to optionally use a language-
    //    specific image for the "Made with MV" splash only.
    // -------------------------------------------------------------------
    var _MWM_patch_createSplashes = Scene_Splash.prototype.createSplashes;
    Scene_Splash.prototype.createSplashes = function () {
        _MWM_patch_createSplashes.call(this);

        if (LQ.MadeWithMV && LQ.MadeWithMV.ShowMV) {
            var lang = currentLanguage();
            var baseName = String(LQ.MadeWithMV.MVImage || 'MadeWithMv');
            var useLang = (lang && LQ.MadeWithMV.SplashLangs && LQ.MadeWithMV.SplashLangs[lang]);

            var mvSprite = new Sprite();
            mvSprite.bitmap = ImageManager.loadSystem(useLang ? (baseName + "_" + lang) : baseName);

            if (this._mvSplash && this._mvSplash.parent) {
                this._mvSplash.parent.removeChild(this._mvSplash);
            }
            this._mvSplash = mvSprite;
            this.addChild(this._mvSplash);

            if (Graphics && Graphics.width) {
                this.centerSprite(this._mvSplash);
            }
        }

        if (LQ.MadeWithMV && LQ.MadeWithMV.ShowCustom && this._customSplash) {
            this._customSplash.opacity = 0;
        }
    };

})();
