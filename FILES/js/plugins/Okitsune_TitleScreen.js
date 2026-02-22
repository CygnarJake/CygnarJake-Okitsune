/*:
 * @plugindesc Built for 古今東西おきつね物語.
 * Mod for TitleCall + TitleImageChange
 * @author CygnarJake
 *
 * @param LanguageSets
 * @text Language Sets
 * @type struct<LangSet>[]
 * @default []
 *
 * @help
 * Add Language Sets in Plugin Manager.
 *    - Language: must match ConfigManager.getLanguage()
 *    - SE files: list from audio/se/ (no extension)
 *    - Title pictures: list from img/titles1/ (slot 0, 1, 2, 3 …)
 *
 * Includes an override for TitleImageChange, making DataManager.latestSavefileId(); the method for selecting file priority.
 *
 * Order After:
 *    - TitleCall
 *    - TitleImageChange
 *    - SRD_TranslationEngine
 */

/*~struct~LangSet:
 * @param Language
 * @type string
 *
 * @param GameTitle
 * @text Game Title
 * @type string
 * @default Okitsune
 *
 * @param SEFiles
 * @text Title SE
 * @type string[]
 * @default []
 *
 * @param TitlePictures
 * @text Title Pictures
 * @type file[]
 * @dir img/titles1/
 * @default []
 */
(() => {
    'use strict';
    const script = document.currentScript;
    const PLUGIN_NAME = script ? decodeURIComponent(script.src.split(/\/|\\/).pop().replace(/\.js$/, '')) : 'Title_LangPatch';
    const PARAMS = PluginManager.parameters(PLUGIN_NAME);
    const LANG_SE_TABLE = {};
    const LANG_PIC_TABLE = {};
    const LANG_TITLE_TABLE = {};
    JSON.parse(PARAMS.LanguageSets || '[]').map(s => JSON.parse(s)).forEach(set => {
        const lang = (set.Language || '').trim();
        if (!lang)
            return;
        LANG_TITLE_TABLE[lang] = (set.GameTitle || 'Okitsune').trim();
        let se = [];
        try {
            se = JSON.parse(set.SEFiles || '[]');
        } catch (_) {}
        LANG_SE_TABLE[lang] = se.filter(Boolean);
        let pic = [];
        try {
            pic = JSON.parse(set.TitlePictures || '[]');
        } catch (_) {}
        LANG_PIC_TABLE[lang] = pic.filter(Boolean);
    });
    function applyLocalizedGameTitle() {
        const lang = ConfigManager.getLanguage();
        const title = LANG_TITLE_TABLE[lang];
        if (!title)
            return;
        if ($gameSystem)
            $gameSystem._gameTitle = title;
        document.title = title;
        if (Graphics._updateTitle)
            Graphics._updateTitle();
    }
    const _ConfigManager_load = ConfigManager.load;
    ConfigManager.load = function () {
        _ConfigManager_load.apply(this, arguments);
        applyLocalizedGameTitle();
    };
    const _Scene_Boot_start = Scene_Boot.prototype.start;
    Scene_Boot.prototype.start = function () {
        _Scene_Boot_start.apply(this, arguments);
        applyLocalizedGameTitle();
    };
    const tcRaw = PluginManager.parameters('TitleCall') || {};
    const tcParam = {};
    for (const k in tcRaw) {
        try {
            tcParam[k] = JSON.parse(tcRaw[k]);
        } catch (_) {
            tcParam[k] = tcRaw[k];
        }
    }
    ['volume', 'pitch', 'pan', 'delay', 'bgmDelay'].forEach(k => {
        if (k in tcParam)
            tcParam[k] = Number(tcParam[k]);
    });
    Scene_Title.prototype.playTitleCall = function () {
        if (this.isReturnToTitle && this.isReturnToTitle())
            return;
        if (tcParam.condition && !eval(tcParam.condition))
            return;
        const lang = ConfigManager.getLanguage();
        const choice = LANG_SE_TABLE[lang] && LANG_SE_TABLE[lang].length ? LANG_SE_TABLE[lang] : tcParam.randomList;
        if (choice && choice.length) {
            tcParam.name = choice[Math.randomInt(choice.length)];
        }
        if (tcParam.delay) {
            setTimeout(() => AudioManager.playSe(tcParam), tcParam.delay);
        } else {
            AudioManager.playSe(tcParam);
        }
    };
    const ticP = PluginManager.parameters('TitleImageChange') || {};
    const num = (jp, en, d = 0) => Number(ticP[jp] || ticP[en] || d);
    let thresholds = [num('タイトル1の進行度', 'TitleGrade1', 1), num('タイトル2の進行度', 'TitleGrade2', 2), num('タイトル3の進行度', 'TitleGrade3', 3), ];
    thresholds = thresholds.concat((ticP['以降の進行度'] || ticP['TitleGradeAfter'] || '').split(',').map(s => Number(s.trim())).filter(Boolean)).reverse();
    const _Scene_Title_start = Scene_Title.prototype.start;
    Scene_Title.prototype.start = function () {
        _Scene_Title_start.apply(this, arguments);
        applyLocalizedGameTitle();
    };
    const _Scene_Title_init = Scene_Title.prototype.initialize;
    Scene_Title.prototype.initialize = function () {
        _Scene_Title_init.apply(this, arguments);
        const lang = ConfigManager.getLanguage();
        const list = LANG_PIC_TABLE[lang];
        if (!list || !list.length)
            return;
        const grade = DataManager.getFirstPriorityGradeVariable();
        let idx = (Number.isInteger(grade) && grade >= 0 && grade < list.length) ? grade : -1;
        if (idx === -1) {
            for (let i = 0; i < thresholds.length; i++) {
                if (grade >= thresholds[i]) {
                    idx = i;
                    break;
                }
            }
        }
        if (idx === -1)
            return;
        const pic = list[idx];
        if (pic) {
            $dataSystem.title1Name = pic;
        }
    };
})();

// Make newest savefile timestamp take priority in TitleImageChange
(function () {
    'use strict';
    DataManager._compareOrderForGradeVariable = function (a, b) {
        if (!a)
            return 1;
        if (!b)
            return -1;
        return (b.timestamp || 0) - (a.timestamp || 0);
    };
})();