/*:
 * @plugindesc Mod for TitleCall + TitleImageChange
 * @author CygnarJake
 * @orderAfter TitleCall
 * @orderAfter TitleImageChange
 * @orderAfter SRD_TranslationEngine
 *
 * @param LanguageSets
 * @text Language Sets
 * @type struct<LangSet>[]
 * @default []
 *
 * @param DebugTrace
 * @text Debug Trace ?
 * @type boolean @on Yes @off No
 * @desc When ON, chosen SE / picture are printed to the F8 console.
 * @default false
 *
 * @help
 * Add Language Sets in Plugin Manager.  
 *    - Language: must match ConfigManager.getLanguage()  
 *    - SE files: list from audio/se/ (no extension)  
 *    - Title pictures: list from img/titles1/ (slot 0, 1, 2, 3 …)  
 */

/*~struct~LangSet:
 * @param Language
 * @type string
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
  const PLUGIN_NAME = script
        ? decodeURIComponent(script.src.split(/\/|\\/).pop().replace(/\.js$/, ''))
        : 'Title_LangPatch';                        // fallback

  const PARAMS = PluginManager.parameters(PLUGIN_NAME);
  const DEBUG  = PARAMS.DebugTrace === 'true';

  /* --------------------------------------------------------------
   * 1.  Build language-specific tables from "LanguageSets".
   *     (Each entry is double-encoded JSON. Parse twice.)
   * ------------------------------------------------------------ */
  /** @type {{[lang:string]: string[]}} */
  const LANG_SE_TABLE = {};
  /** @type {{[lang:string]: string[]}} */
  const LANG_PIC_TABLE = {};

  JSON.parse(PARAMS.LanguageSets || '[]')
    .map(s => JSON.parse(s))
    .forEach(set => {
      const lang = (set.Language || '').trim();
      if (!lang) return;

      let se = [];
      try { se = JSON.parse(set.SEFiles || '[]'); } catch (_) {}
      LANG_SE_TABLE[lang] = se.filter(Boolean);

      let pic = [];
      try { pic = JSON.parse(set.TitlePictures || '[]'); } catch (_) {}
      LANG_PIC_TABLE[lang] = pic.filter(Boolean);
    });

  /* --------------------------------------------------------------
   * 2.  Cache TitleCall parameters (volume, delay, etc.).
   * ------------------------------------------------------------ */
  const tcRaw   = PluginManager.parameters('TitleCall') || {};
  const tcParam = {};
  for (const k in tcRaw) {
    try { tcParam[k] = JSON.parse(tcRaw[k]); } catch (_) { tcParam[k] = tcRaw[k]; }
  }
  ['volume','pitch','pan','delay','bgmDelay'].forEach(k => {
    if (k in tcParam) tcParam[k] = Number(tcParam[k]);
  });

  /* --------------------------------------------------------------
   * 3.  Language-aware SE (override playTitleCall)
   * ------------------------------------------------------------ */
  Scene_Title.prototype.playTitleCall = function () {
    if (this.isReturnToTitle && this.isReturnToTitle()) return;
    if (tcParam.condition && !eval(tcParam.condition))  return;

    const lang     = ConfigManager.getLanguage();
    const choice   = LANG_SE_TABLE[lang] && LANG_SE_TABLE[lang].length
                   ? LANG_SE_TABLE[lang]
                   : tcParam.randomList;

    if (choice && choice.length) {
      tcParam.name = choice[Math.randomInt(choice.length)];
      if (DEBUG) console.log(`[${PLUGIN_NAME}] SE  (${lang}) → ${tcParam.name}`);
    }

    if (tcParam.delay) {
      setTimeout(() => AudioManager.playSe(tcParam), tcParam.delay);
    } else {
      AudioManager.playSe(tcParam);
    }
  };

  /* --------------------------------------------------------------
   * 4.  Rebuild TitleImageChange’s grade threshold list
   * ------------------------------------------------------------ */
  const ticP = PluginManager.parameters('TitleImageChange') || {};
  const num  = (jp, en, d=0) => Number(ticP[jp] || ticP[en] || d);

  let thresholds = [
    num('タイトル1の進行度','TitleGrade1',1),
    num('タイトル2の進行度','TitleGrade2',2),
    num('タイトル3の進行度','TitleGrade3',3),
  ];
  thresholds = thresholds.concat(
      (ticP['以降の進行度']||ticP['TitleGradeAfter']||'')
        .split(',').map(s=>Number(s.trim())).filter(Boolean)
    ).reverse();                             // high → low

  /* --------------------------------------------------------------
   * 5.  Post-process Scene_Title.initialize to swap picture
   * ------------------------------------------------------------ */
  const _Scene_Title_init = Scene_Title.prototype.initialize;
  Scene_Title.prototype.initialize = function () {
    _Scene_Title_init.apply(this, arguments);

    const lang  = ConfigManager.getLanguage();
    const list  = LANG_PIC_TABLE[lang];
    if (!list || !list.length) return;       // language not defined

    const grade = DataManager.getFirstPriorityGradeVariable();
    let idx = (Number.isInteger(grade) && grade >= 0 && grade < list.length)
            ? grade : -1;

    if (idx === -1) {                        // fallback using thresholds
      for (let i=0;i<thresholds.length;i++){
        if (grade >= thresholds[i]) { idx=i; break; }
      }
    }
    if (idx === -1) return;

    const pic = list[idx];
    if (pic) {
      $dataSystem.title1Name = pic;
      if (DEBUG) console.log(`[${PLUGIN_NAME}] PIC slot ${idx} (${lang}) → ${pic}`);
    }
  };

})();
