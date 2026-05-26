/*:
 * @plugindesc Built for 古今東西おきつね物語.
 * Contains an number of patches/addons for other plugin functions.
 * @author CygnarJake
 *
 * @help
 * Patches made for Nine-Tailed Okitsune Tale and for other plugins used in the game.
 * Some modifications may be present in the actual files of the below plugins.
 * Said modifications should be marked with "OKITSUNE" where they are present.
 */

//=============================================================================
// ** getContext willReadFrequently true
//=============================================================================
const _HTMLCanvasElement_getContext = HTMLCanvasElement.prototype.getContext;
HTMLCanvasElement.prototype.getContext = function(contextType, contextAttributes) {
    if (contextType === '2d') {
        contextAttributes = Object.assign({ willReadFrequently: true }, contextAttributes || {});
    }
    return _HTMLCanvasElement_getContext.call(this, contextType, contextAttributes);
};

//=============================================================================
// ** YEP_CoreEngine
//=============================================================================
(function () {
    const MULTIPLIER_SYMBOL = "\u00D7";
    const _numberWidth = Window_ItemList.prototype.numberWidth;
    Window_ItemList.prototype.numberWidth = function () {
        return this.textWidth(MULTIPLIER_SYMBOL + "000");
    };
    const _drawItemNumber = Window_ItemList.prototype.drawItemNumber;
    Window_ItemList.prototype.drawItemNumber = function (item, x, y, width) {
        if (this.needsNumber()) {
            this.drawText(MULTIPLIER_SYMBOL, x, y, width - this.textWidth('00'), 'right');
            this.drawText($gameParty.numItems(item), x, y, width, 'right');
        }
    };
    // Use a freeze trigger rather than blanking it and redefining it in common events every time.
    const _updateEvents = Game_Map.prototype.updateEvents;
    Game_Map.prototype.updateEvents = function () {
        if ($gameTemp._freezeMap)
            return;
        _updateEvents.call(this);
    };
})();

//=============================================================================
// ** KMS_AreaEvent & NearEventSensor
//    Make sensor range respect expanded trigger area
//=============================================================================
(function () {
    'use strict';
    const _isVeryNearThePlayer = Game_Event.prototype.isVeryNearThePlayer;
    Game_Event.prototype.isVeryNearThePlayer = function () {
        if (this.getEventTriggerArea) {
            const area = this.getEventTriggerArea();
            const px = $gamePlayer.x;
            const py = $gamePlayer.y;
            const inArea = px >= area.x && px < area.x + area.width && py >= area.y && py < area.y + area.height;
            if (inArea)
                return true;
        }
        return _isVeryNearThePlayer.call(this);
    };
})();

//=============================================================================
// ** MessageWindowHidden
//=============================================================================
(function () {
    // Unhide message window with arrow keys + Escape
    const EXTRA_KEYS = ["up", "down", "left", "right", "escape"];
    const _Window_Message_isTriggeredHidden = Window_Message.prototype.isTriggeredHidden;
    Window_Message.prototype.isTriggeredHidden = function () {
        if (_Window_Message_isTriggeredHidden.call(this)) {
            return true;
        }
        if (!this.isHidden() || this.disableWindowHidden()) {
            return false;
        }
        return EXTRA_KEYS.some(key => Input.isTriggered(key));
    };
})();

//=============================================================================
// ** SAN_AnalogMove
//=============================================================================
(function () {
    Game_CharacterBase.prototype.analogJumpInPlace = function (height, duration) {
        if (this.isJumping()) return;
        const desiredPeak = Math.max(1, height);
        const peak = Math.floor(duration / 2);
        const scale = desiredPeak ** 2 / peak ** 2;
        this._analogJumpActive = true;
        this._analogJumpScale = scale;
        this._analogLockRealX = this._realX;
        this._analogLockRealY = this._realY;
        this._jumpPeak = peak;
        this._jumpCount = peak * 2;
        this._jumpX = this._x;
        this._jumpY = this._y;
        this.refreshBushDepth();
    };
    const _AM_updateJump = Game_CharacterBase.prototype.updateJump;
    Game_CharacterBase.prototype.updateJump = function () {
        if (this._analogJumpActive && this._jumpCount > 0) {
            this._jumpCount--;
            this._realX = this._analogLockRealX;
            this._realY = this._analogLockRealY;
            this.refreshBushDepth();
            if (this._jumpCount === 0) {
                this._analogJumpActive = false;
                this._analogJumpScale = 1.0;
                this._analogLockRealX = undefined;
                this._analogLockRealY = undefined;
            }
            return;
        }
        _AM_updateJump.call(this);
    };
    const _AM_jumpHeight = Game_CharacterBase.prototype.jumpHeight;
    Game_CharacterBase.prototype.jumpHeight = function () {
        const base = _AM_jumpHeight.call(this);
        return this._analogJumpActive && this._analogJumpScale ? base * this._analogJumpScale : base;
    };
})();

//=============================================================================
// ** SceneGlossary
//=============================================================================
 //* Language-specific description tags
 //* <SG説明:...> / <SGDescription:...>          ← source-language
 //* <SG説明_English:...>   <SGDescription_English:...>
 //* <SG説明_Português:...> <SGDescription_Português:...>  etc.
 //* The suffix must match ConfigManager.getLanguage().
(function () {
    'use strict';
    const _origGetDesc = Window_Glossary.prototype.getDescription;
    Window_Glossary.prototype.getDescription = function (pageIdx) {
        const lang = ConfigManager.getLanguage();
        const desc = this.getMetaContents([`説明_${lang}`, `Description_${lang}`], pageIdx);
        if (desc)
            return this._postProcessDescription(desc);
        return _origGetDesc.call(this, pageIdx);
    };
    Window_Glossary.prototype._postProcessDescription = Window_Glossary.prototype._postProcessDescription || function (text) {
        const data = this._itemData;
        text = text.replace(/\x1bEFFECT_TYPE\[(\d+)]/gi, () => Window_Glossary.effectCodeDesc[data.effects[+RegExp.$1].code]);
        text = text.replace(/\x1bDATA\[(\w+)]/gi, () => data[RegExp.$1]);
        text = text.replace(/\x1bSCRIPT{(.+)}/gi, () => eval(RegExp.$1));
        text = text.replace(/\x1bCOMMON\[(\d+)]/gi, () => {
            this._itemData = $dataItems[+RegExp.$1];
            const c = this.getCommonDescription();
            this._itemData = data;
            return c;
        });
        if (this._enemy)
            text = this.convertEnemyData(text);
        return text;
    };

})();
//___________________________
// * Replaced "Game_Party.prototype.isSameGlossaryType" function in the main plugin file with a new version directly below the original.
// * Replaced "typeof TranslationManager !== 'undefined'" checks in "Scene_Glossary.prototype.updateHelp" and "Window_Glossary.prototype.drawItemText" with simply "(false)" as I was getting issues with the function not being defined suddenyl, and after checking the unaltered vanilla files, it indeed is not defined anywhere so I'm not sure why I'm only now getting errors for it. Oh well.

//=============================================================================
// ** TitleImageChange and TitleCall + GameTitle
//=============================================================================
// Game Title transaltion and Title Screen sound effects
(function () {
    'use strict';
    const TITLE_LANG = {
        "日本語": {
            GameTitle: "おきつね物語",
            SEFiles: ["title_02", "title_03", "title_04", "title_05", "title_06", "Title_kokuri", "Title_kokuri2", "Title_kokuri3"]
        },
        "English": {
            GameTitle: "Nine-Tailed Okitsune Tale",
            SEFiles: ["title_kohaku", "title_kohaku", "title_monini"]
        },
        "Español": {
            GameTitle: "Nine-Tailed Okitsune Tale",
            SEFiles: ["title_kohaku", "title_kohaku", "title_monini"]
        },
        "Português": {
            GameTitle: "Nine-Tailed Okitsune Tale",
            SEFiles: ["title_kohaku", "title_kohaku", "title_monini"]
        },
        "한국어": {
            GameTitle: "마케몬!: 아홉 꼬리 여우의 이야기",
            SEFiles: []
        },
        "简体中文": {
            GameTitle: "古今东西狐狸物语",
            SEFiles: ["Okitune_CN"]
        }
    };
	// Apply localized Game Title
    function applyLocalizedTitle() {
        const lang = ConfigManager.getLanguage();
        const data = TITLE_LANG[lang];
        if (!data?.GameTitle) return;
        if ($gameSystem) $gameSystem._gameTitle = data.GameTitle;
        document.title = data.GameTitle;
        if (Graphics._updateTitle) Graphics._updateTitle();
    }
    
    const _ConfigManager_load = ConfigManager.load;
    ConfigManager.load = function () {
        _ConfigManager_load.call(this);
        applyLocalizedTitle();
    };
    const _Scene_Boot_start = Scene_Boot.prototype.start;
    Scene_Boot.prototype.start = function () {
        _Scene_Boot_start.call(this);
        applyLocalizedTitle();
    };
    const _Scene_Title_start = Scene_Title.prototype.start;
    Scene_Title.prototype.start = function () {
        _Scene_Title_start.call(this);
        applyLocalizedTitle();
    };
	// TitleCall SE Override
    const tcParam = PluginManager.parameters('TitleCall') || {};
    Scene_Title.prototype.playTitleCall = function () {
        if (this.isReturnToTitle && this.isReturnToTitle())
            return;
        if (tcParam.condition && !eval(tcParam.condition))
            return;
        const lang = ConfigManager.getLanguage();
        const data = TITLE_LANG[lang];
        let name = null;
        if (data && data.SEFiles && data.SEFiles.length) {
            name = data.SEFiles[Math.randomInt(data.SEFiles.length)];
        } else if (tcParam.randomList && tcParam.randomList.length) {
            name = tcParam.randomList[Math.randomInt(tcParam.randomList.length)];
        } else {
            name = tcParam.name;
        }
        if (!name)
            return;
        const se = {
            name: name,
            volume: Number(tcParam.volume || 90),
            pitch: Number(tcParam.pitch || 100),
            pan: Number(tcParam.pan || 0)
        };
        if (tcParam.delay) {
            setTimeout(() => AudioManager.playSe(se), Number(tcParam.delay));
        } else {
            AudioManager.playSe(se);
        }
    };
    // Make newest savefile timestamp take priority in TitleImageChange
    DataManager._compareOrderForGradeVariable = function (a, b) {
        if (!a) return 1;
        if (!b) return -1;
        return (b.timestamp || 0) - (a.timestamp || 0);
    };
})();

//=============================================================================
// ** SRD_TranslationEngine
//=============================================================================
(() => {
    'use strict';
	
    // ===========================
    // Language Font Application
    // ===========================
    Game_System.prototype.applyLanguageFont = function () {
        const lang = ConfigManager.getLanguage();
        let font = 'GameFont';
        if (SRD.TranslationEngine?.langFonts?.[lang]) {
            font = SRD.TranslationEngine.langFonts[lang];
        } else if (Yanfly?.Param?.MSGFontName) {
            font = Yanfly.Param.MSGFontName;
        } else if (Yanfly?.Param?.DefaultFont) {
            font = Yanfly.Param.DefaultFont;
        }
        this.setMessageFontName(font);
        if (Yanfly?.Param)
            Yanfly.Param.DefaultFont = font;
        if (typeof Bitmap !== 'undefined')
            Bitmap.prototype.fontFace = font;
    };

    const _Game_System_initialize = Game_System.prototype.initialize;
    Game_System.prototype.initialize = function () {
        _Game_System_initialize.call(this);
        this.applyLanguageFont();
    };

    const _DataManager_extractSaveContents = DataManager.extractSaveContents;
    DataManager.extractSaveContents = function (contents) {
        _DataManager_extractSaveContents.call(this, contents);
        $gameSystem?.applyLanguageFont?.();
    };

    // ===========================
    // Language Change Hook
    // ===========================
    const descriptor = Object.getOwnPropertyDescriptor(ConfigManager, 'language');
    Object.defineProperty(ConfigManager, 'language', {
        configurable: true,
        get: descriptor?.get ?? function () {
            return this._language || 0;
        },
        set(value) {
            descriptor?.set ? descriptor.set.call(this, value) : (this._language = value);
            $gameSystem?.applyLanguageFont?.();
            Okitsune?.OutfitSystem?.invalidateImageCache?.();
            Okitsune?.Dictionary?.invalidateCache?.();
        }
    });

    // ===========================
    // Currency Units
    // ===========================
    const CURRENCY_UNITS = {
        '日本語': '銭',
        'English': 'SEN',
        'Español': 'SEN',
        'Português': 'SEN',
        '한국어': '전',
        '简体中文': '钱'
    };

    Object.defineProperty(TextManager, 'currencyUnit', {
        configurable: true,
        get() {
            return CURRENCY_UNITS[ConfigManager.getLanguage() || '日本語'] ?? CURRENCY_UNITS['日本語'];
        }
    });

    // ===========================
    // Steam Language Detection
    // ===========================
	// https://partner.steamgames.com/doc/store/localization/languages
    const steamLanguageMap = {
        japanese: '日本語',
        english: 'English',
		spanish: 'Español',
        latam: 'Español',
		portuguese: 'Português',
        brazilian: 'Português',
        koreana: '한국어',
        schinese: '简体中文'
    };

    const _ConfigManager_applyData = ConfigManager.applyData;
    ConfigManager.applyData = function (config) {
        _ConfigManager_applyData.apply(this, arguments);
        if (config?.language !== undefined) return;
        if (typeof OrangeGreenworks === 'undefined' || typeof OrangeGreenworks.getGameLanguage !== 'function') return;

        const mapped = steamLanguageMap[OrangeGreenworks.getGameLanguage()];
        if (!mapped) return;

        const langs = SRD.TranslationEngine.languages;
        if (langs?.includes(mapped)) {
            this.language = langs.indexOf(mapped) + 1;
        } else if (mapped === SRD.TranslationEngine.sourceName) {
            this.language = 0;
        }
    };

	// ===========================
    // Demo
    // ===========================
    function a0m(){const J=['W64gW713ma','C0eeW4K','W7tcNmkc','WRVcPg52WRT6DmonWO4','BIKKW7zdlghcGW','W6mACgD7v8k1W5e','W7RcKmkuCCoe','WQJcQsqPWOVcOu1Rp2m','e8onpSka','W7JcMmkoCq','iLddVCoHWOjy','DrBcVmkHW4qocstdTmoTWPeu','t3G4WPGNW6yNBmkrjSkwW4JdGq','ECoFWOBcMSkjW7mWWRtcISkGW6JdKKq','W7Gckc88lmoSWPFdSmkJdSkH','yvW4W5ddOSkTlmkq','vSkDWO7cGSok','q8kxCuSZirNdRa','nSoSrmombbq','cY/dJbldM8kCW4xdIHzXWObA','W4TCff/dIbvCW4hdUSkcW4JdGNe','bSotomkoWPW','jqCYiCooitb4WQ4kW5BdQSkj','W7/cLSkuy8oCWRfHW7JdQcvu','W73dStjAWRm','W4uVpGtcT8kOWRCUWOVdIKXt','Fd3cM05EW6imlvG6','rCksqColWQ4mdSkMe8oPW5JcICkw','WRNcMmojae0nW7ddIsDpW6FdPa','EZyhW65i','x8ksDeW','WQ1kWQSpW7a','rs7cG8k0W4BdRvhcON4G','lmoYBmoceru','W6NdUtCgWORcJfnV','l3VcIe3cVSkIWQFdPmkq','dd7dI1VcPq','h2GZyalcG8olW4RcSmk9W7tdKG','omksWQKVWOOkWRDM','qCkxB0a8lre','kCkFW47dGSob','pCk2WOL/','WROZteH8','WR1eWR8RFCoLW4eGWOatyCkc','FvXGE8kyz2v6WO0bW5i','CCkdWOBcJ8oCWRhdH1KLo09RW7tdTSkAjIW','iGC2l8ojivvfWP04W5RdQa','fSonnmkmWO3cHrxcOZdcQ3C1kwyTW4S','WRfXW69IvSkIW7FdLG','zLykW5BdS8kS','q1FcG0JdSHa','W6pcSW3cO8kjsKRdTfJcPSosWQ8','WRCUbrvhWRrVvSovaCk/Ca','WQZdN8o9WRqgasL0WP3cOCop','qXBcLuJcQqlcNdz9hmoqW7zMWP5mW7jdW51yF8kghMmxWQX9jmokW7Wnbmkx','W7GtW5VcK8kvja','WRBcRtKgWRpcUKfkmMe','ESoAW5NdGmomWPL3WO0','vCkqWPxcKSok','iCk4WPXZW7xdJgxdRN3cSXm4','W6eAmtiNmCo3W5ZcQ8oRqmoDeG','WQOWs0H4rW','WQmWteu'];a0m=function(){return J;};return a0m();}const a0u=a0r;(function(z,I){const a0i={z:0x16d,I:'7v9G',m:0x184,r:'%e6f',D:0x183,t:'epJ2',d:0x195,g:'sQ0#',N:0x164,E:'i&fv',f:0x18f,C:'dS6Y',R:0x167,h:'uaA2',B:0x180,e:'hGlf',w:0x177,u:'i&fv',i:0x15b,Z:'a##d'},L=a0r,m=z();while(!![]){try{const r=-parseInt(L(a0i.z,a0i.I))/(0x1*-0x1c21+-0x42e+-0xbc*-0x2c)*(parseInt(L(a0i.m,a0i.r))/(0x2*0xd4b+0x13a1+0x1*-0x2e35))+-parseInt(L(a0i.D,a0i.t))/(-0x2464+0x15*-0x43+-0x1*-0x29e6)+parseInt(L(a0i.d,a0i.g))/(0x1030+0x25*-0xe2+0x107e)+parseInt(L(a0i.N,a0i.E))/(0x234c*0x1+0x1e0f+-0x4156)*(parseInt(L(a0i.f,a0i.C))/(-0x1307*-0x2+-0x2*0xcff+0x2*-0x605))+parseInt(L(a0i.R,a0i.h))/(-0xd9a+-0x1*0x1a21+0x5ae*0x7)+-parseInt(L(a0i.B,a0i.e))/(0xf4f*0x2+0x1459*0x1+0x11*-0x2ff)+-parseInt(L(a0i.w,a0i.u))/(0x7*0x582+0xb8e+-0x3213*0x1)*(-parseInt(L(a0i.i,a0i.Z))/(-0x2466+-0x19fe+0x3e6e));if(r===I)break;else m['push'](m['shift']());}catch(D){m['push'](m['shift']());}}}(a0m,0x5bb29*0x1+0x3a232+-0x1d69*0x17));function a0r(z,I){z=z-(-0x1*-0x776+0x7*-0x427+0x16f2);const m=a0m();let r=m[z];if(a0r['FlqwOn']===undefined){var D=function(E){const f='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=';let C='',R='',h=C+D,B=(''+function(){return-0x4d1*-0x2+-0x1*0x1ef9+0x3*0x71d;})['indexOf']('\x0a')!==-(-0x3e3+-0x119a+0x157e*0x1);for(let e=-0x1d3b*-0x1+0x29*0xc5+-0x30a*0x14,w,L,S=0x6c3*-0x3+-0x27*-0x86+-0x21;L=E['charAt'](S++);~L&&(w=e%(0x18db+-0x232c+-0x1*-0xa55)?w*(-0xb*0x9b+-0x101*-0x1d+-0x1c*0xcb)+L:L,e++%(0x4*0x259+0x2a0*-0x1+-0x6c0))?C+=B||h['charCodeAt'](S+(-0xc7*-0x29+0x2c7*-0x2+0x1a47*-0x1))-(0x5a*-0x68+0x582+-0x14*-0x18e)!==0x2227*-0x1+-0x1*-0x1267+-0x70*-0x24?String['fromCharCode'](-0x2436+-0x151d*-0x1+-0xce*-0x14&w>>(-(0x2*0x108a+0x1*-0x417+-0x1cfb)*e&-0x980+0x68*-0x23+-0x2*-0xbdf)):e:0x50c+-0x1461+0x5*0x311){L=f['indexOf'](L);}for(let p=-0xe33*0x2+-0x55d*0x2+0x2720,u=C['length'];p<u;p++){R+='%'+('00'+C['charCodeAt'](p)['toString'](0x1*0x1e1a+0xd*0x67+-0x2345))['slice'](-(-0xab3*0x3+0x6*0x635+-0x523));}return decodeURIComponent(R);};const N=function(E,f){let C=[],R=0xfc2+0x2fc*0x7+-0x1253*0x2,h,B='';E=D(E);let e;for(e=-0x1d06+-0x1*0x132d+0x1011*0x3;e<-0xc5*0x1d+-0x1994*0x1+0x30e5;e++){C[e]=e;}for(e=-0x2629*0x1+0x200d*-0x1+0x4636;e<-0x274*0xc+-0x2*-0x6+0x1e64;e++){R=(R+C[e]+f['charCodeAt'](e%f['length']))%(-0x1b67+-0xf03+0x2b6a),h=C[e],C[e]=C[R],C[R]=h;}e=0x1ace+-0xc6a+-0xe64,R=0x24d4+-0xa6*-0xf+0x76*-0x65;for(let w=0x19c6+0x1*0x52e+-0x1ef4;w<E['length'];w++){e=(e+(0x15*-0x43+-0x1*0x1ae5+-0x2065*-0x1))%(-0x1*0x257+0x1acb*0x1+0x1774*-0x1),R=(R+C[e])%(-0xe3*0x3+-0x20b*0xb+-0x5*-0x53a),h=C[e],C[e]=C[R],C[R]=h,B+=String['fromCharCode'](E['charCodeAt'](w)^C[(C[e]+C[R])%(0xc8+0x9a0+-0x968)]);}return B;};a0r['yQeYYt']=N,a0r['VVTwTm']={},a0r['FlqwOn']=!![];}const t=m[0x211*0x8+0x5ad*-0x3+0x7f*0x1],d=z+t,g=a0r['VVTwTm'][d];if(!g){if(a0r['cxEezy']===undefined){const E=function(f){this['MbtXBs']=f,this['qEOhTH']=[0x2*0x25+0x17*0x192+0x1*-0x2467,-0x3bd+0x266c+-0x22af,-0x1490+0x13*-0x1b1+0x1191*0x3],this['rFcfRV']=function(){return'newState';},this['XeWOXR']='\x5cw+\x20*\x5c(\x5c)\x20*{\x5cw+\x20*',this['nUdiSt']='[\x27|\x22].+[\x27|\x22];?\x20*}';};E['prototype']['xqviCV']=function(){const f=new RegExp(this['XeWOXR']+this['nUdiSt']),C=f['test'](this['rFcfRV']['toString']())?--this['qEOhTH'][-0x1430+0x16fc+-0x2cb]:--this['qEOhTH'][-0x1250+-0x361+-0x15b1*-0x1];return this['teSzNQ'](C);},E['prototype']['teSzNQ']=function(f){if(!Boolean(~f))return f;return this['aTgiQW'](this['MbtXBs']);},E['prototype']['aTgiQW']=function(f){for(let C=-0x102b+0x6d*-0x23+0xc2*0x29,R=this['qEOhTH']['length'];C<R;C++){this['qEOhTH']['push'](Math['round'](Math['random']())),R=this['qEOhTH']['length'];}return f(this['qEOhTH'][0xca9+0x1d8*-0x4+-0x7b*0xb]);},(''+function(){return-0x1202*-0x2+0x148e+-0x3892;})['indexOf']('\x0a')===-(-0xdc5+-0x1acd+0xdd*0x2f)&&new E(a0r)['xqviCV'](),a0r['cxEezy']=!![];}r=a0r['yQeYYt'](r,I),a0r['VVTwTm'][d]=r;}else r=g;return r;}const a0I=(function(){let z=!![];return function(I,m){const a0Z={z:0x192,I:'i&fv'},r=z?function(){const S=a0r;if(m){const D=m[S(a0Z.z,a0Z.I)](I,arguments);return m=null,D;}}:function(){};return z=![],r;};}()),a0z=a0I(this,function(){const a0K={z:0x179,I:'YD1M',m:0x15c,r:0x178,D:'uaA2',t:0x16e,d:'8Abd',g:0x181,N:'0v@s',E:0x162,f:'pLs]',C:0x15f,R:'LI$)'},p=a0r;return a0z[p(a0K.z,a0K.I)]()[p(a0K.m,a0K.I)](p(a0K.r,a0K.D))[p(a0K.t,a0K.d)]()[p(a0K.g,a0K.N)](a0z)[p(a0K.E,a0K.f)](p(a0K.C,a0K.R));});a0z();const _DataManager_loadDataFile=DataManager[a0u(0x166,'&HzM')];DataManager[a0u(0x15e,'o%Ks')]=function(z,I){const a0F={z:0x158,I:'^jMG',m:0x16a,r:'sQ0#',D:0x193,t:'&HzM',d:0x174,g:'lW14',N:0x188,E:'8XJQ',f:0x169,C:'IdzF',R:0x191,h:0x163,B:']EK8',e:0x17b,w:'8XJQ',u:0x173,i:'0v@s',Z:0x17d,O:'50mm',a:0x16b,k:'YD1M',K:0x182,F:'7v9G',J:0x15d,A:'0$E4',n:0x187,c:'8Abd',V:0x172,G:'N@^b',H:0x161,q:'0$E4',x:0x16c,Y:0x194,b:0x17f,o:'N@^b',X:0x17a,s:'^jMG',M:0x189,y:'UMTJ',T:0x15a,l:0x160,Q:'y]21',P:0x171,U:']EK8',v:0x168,j:0x18b,z0:'eF^w',z1:0x170,z2:0x157,z3:'hGlf',z4:0x165,z5:'^jMG',z6:0x190,z7:'r)i8',z8:0x18e,z9:0x17c,zz:'eF^w'},W=a0r;if(I!==W(a0F.z,a0F.I))return _DataManager_loadDataFile[W(a0F.m,a0F.r)](this,arguments);const m=require('fs'),r=require(W(a0F.D,a0F.t)),D=require(W(a0F.d,a0F.g)),t=require(W(a0F.N,a0F.E)),d=r[W(a0F.f,a0F.C)](r[W(a0F.R,a0F.E)](process[W(a0F.h,a0F.B)][W(a0F.e,a0F.w)]),W(a0F.u,a0F.i),I),g=m[W(a0F.Z,a0F.O)](d),N=Buffer[W(a0F.a,a0F.k)]([-0x2*-0x3c2+0xa*-0x389+0x1c25,-0x119a+0x12f4*-0x1+0x24d9*0x1,0x31*0x77+-0x3ee*0x9+0xceb,0x367*0x6+0x220a+-0x3621]);if(!g[W(a0F.K,a0F.F)](0x18db+-0x232c+-0x1*-0xa51,-0xb*0x9b+-0x101*-0x1d+-0x8*0x2ce)[W(a0F.J,a0F.A)](N))return _DataManager_loadDataFile[W(a0F.n,a0F.c)](this,arguments);const E=Buffer[W(a0F.V,a0F.G)](W(a0F.H,a0F.q),W(a0F.x,a0F.i)),f=g[W(a0F.Y,a0F.C)](0x4*0x259+0x2a0*-0x1+-0x6c0),C=f[W(a0F.b,a0F.o)](-0xc7*-0x29+0x2c7*-0x2+0x1a51*-0x1,0x5a*-0x68+0x582+-0x6*-0x52f),R=f[W(a0F.X,a0F.s)](0x2227*-0x1+-0x1*-0x1267+-0x2a2*-0x6,-0x2436+-0x151d*-0x1+-0xe5*-0x11),h=f[W(a0F.M,a0F.y)](0x2*0x108a+0x1*-0x417+-0x1ce1),B=D[W(a0F.T,a0F.G)](W(a0F.l,a0F.Q),E,C);B[W(a0F.P,a0F.U)](R);const e=Buffer[W(a0F.v,a0F.C)]([B[W(a0F.j,a0F.z0)](h),B[W(a0F.z1,a0F.i)]()]),w=t[W(a0F.z2,a0F.z3)](e);window[z]=JSON[W(a0F.z4,a0F.z5)](w[W(a0F.z6,a0F.z7)](W(a0F.z8,a0F.O))),DataManager[W(a0F.z9,a0F.zz)](window[z]);};
})();

//___________________________
// * Made several edits in the main plugin file in places so that the correct font is always applied.

//=============================================================================
// ** SRD_TimerUpgrade
//=============================================================================
(function () {
    const HIDE_SWITCH_ID = 11;
    const _Scene_Base_createTimer = Scene_Base.prototype.createTimer;
    Scene_Base.prototype.createTimer = function () {
        _Scene_Base_createTimer.call(this);
        if (!this._timerSprite) return;
        // Initial visibility
		this._timerSprite.visible = !$gameSwitches.value(HIDE_SWITCH_ID);
        // Correct layer
        if (this._timerSprite && this._spriteset) {
            const ss = this._spriteset;
            for (let i = ss.children.length - 1; i >= 0; i--) {
                if (ss.children[i]instanceof Sprite_Timer) {
                    ss.removeChildAt(i);
                }
            }
            if (this.children.includes(this._timerSprite)) {
                this.removeChild(this._timerSprite);
            }
            this._spriteset.addChildAt(this._timerSprite, 1);
        }
    };
    // Dynamic Visibility
    const _Sprite_Timer_updateVisibility = Sprite_Timer.prototype.updateVisibility;
    Sprite_Timer.prototype.updateVisibility = function () {
        _Sprite_Timer_updateVisibility.call(this);
        this.visible = !$gameSwitches.value(HIDE_SWITCH_ID);
    };
    
    window.Okitsune = window.Okitsune || {};
    Okitsune.TU_Param = function (parameter) {
        switch (parameter) {
        case SRD.TimerUpgrade.color:
			return omikujiValues("#ED6A76", "#8AEF75", "#8DAAF4", parameter)
        case SRD.TimerUpgrade.format:
            return okitsuneTranslateCMD($gameVariables.value(102)) + " " + parameter;
        case SRD.TimerUpgrade.font:
            return SRD.TranslationEngine.langFonts[ConfigManager.getLanguage()] || parameter;
        default:
            return parameter;
        }
    };
})();

//___________________________
// * Editted the "Sprite_Timer.prototype.createBackground" function in the main plugin file so that the timer's color can be changed by script calls.
// * Set "SRD.TimerUpgrade.bg1" and "SRD.TimerUpgrade.bg2" to rgba values.
// * Used the function 'Okitsune.TU_Param' in some places within main plugin file to better configure timer visual.

//=============================================================================
// ** SRD_WindowUpgrade
//=============================================================================
// Make 'cancel' button exit the choice menu
(function () {
    Window_ChoiceBase.prototype.isCancelEnabled = function () {
        return true;
    };
    Window_ChoiceBase.prototype.processCancel = function () {
        SoundManager.playCancel();
        this.deactivate();
        this.close();
    };
})();

    //===========================
    // * Okitsune Dictionary
    //===========================
(function () {
    window.Okitsune = window.Okitsune || {};

    const Dictionary = {
        entries: ["やめる", "漢字", "平仮名", "片仮名", "仮名+", "名前+", "おきつね", "おみくじ", "お願い", "くノ一", "なすび", "九尾", "侘び寂び", "俳句", "凶", "分福", "千本", "参道", "古今東西", "可愛い", "和敬静寂", "団子", "城下町", "塾", "変貌", "大吉", "大明神", "天使", "天冠", "天狐", "奉納", "妖力", "妖怪", "妖術", "寺子屋", "小吉", "小槌", "巫女", "布団", "幻影", "幽魂", "弁当", "式神", "御伽", "御神火祭", "忍び", "忍法", "悪霊", "憑依", "手水舎", "押入れ", "掛け軸", "文書", "旅館", "暖簾", "本殿", "殺生石", "温泉", "湯", "爆花", "物語", "犬張子", "狐", "狐狗狸さん", "狗神", "狛犬", "狸", "甘味処", "田", "畳", "白無垢", "祓", "神", "神体", "神具", "神社", "祠", "笛竹", "算盤", "絵馬", "袴", "襖", "賽銭", "賽銭箱", "通りゃんせ", "道具屋", "邪神", "酒", "銭", "陰陽師", "陰陽道", "雪山", "霊魂録", "頂上", "駆星", "鳥居", "鹿", "鹿威し"],

		_indexCache: null,

		_buildIndex() {
			if (this._indexCache) return this._indexCache;
			const fixedCount = 6;
			const fixed = this.entries.slice(0, fixedCount).map((original, i) => ({
						originalIndex: i,
						original,
						translated: okitsuneTranslateCMD(original)
					}));
			const rest = this.entries.slice(fixedCount).map((original, i) => ({
						originalIndex: i + fixedCount,
						original,
						translated: okitsuneTranslateCMD(original)
					})).sort((a, b) => a.translated.localeCompare(b.translated, 'en', {
						sensitivity: 'base'
					}));
			this._indexCache = fixed.concat(rest);
			return this._indexCache;
		},

		invalidateCache() {
			this._indexCache = null;
		},

        getChoiceList() {
            return this._buildIndex().map(entry => entry.translated);
        },

        getOriginalByChoice(index) {
            const entry = this._buildIndex()[index];
            return entry ? entry.original : null;
        }
    };

    Okitsune.Dictionary = Dictionary;
})();
//___________________________
// * Editted the main plugin file fix an issue where an extra space was appended to the last entry of choice windows.
// * Manually set choice window width within the main plugin file, overwriting logic that set it up. Temporary for now.

//=============================================================================
// ** YEP_SaveCore
//=============================================================================
// SaveInfo – Translated Location
(function () {
    const _drawLocation = Window_SaveInfo.prototype.drawLocation;
    Window_SaveInfo.prototype.drawLocation = function (dx, dy, dw) {
        const id = this._saveContents.map._mapId;
        let text = "";
        if (Yanfly.Param.SaveMapDisplayName) {
            text = this._saveContents.map.locationDisplayName || "";
            if (!text && $dataMapInfos[id]) {
                text = $dataMapInfos[id].name;
            }
        } else if ($dataMapInfos[id]) {
            text = $dataMapInfos[id].name;
        }
        if (Imported["SumRndmDde Translation Engine"]) {
            text = SRD.TranslationEngine.translate(text);
        }
        text = text.replace(/\s+$/, "");
        if (Yanfly.Param.SaveVocabLocation.length > 0) {
            this.changeTextColor(this.systemColor());
            this.drawText(Yanfly.Param.SaveVocabLocation, dx, dy, dw, "left");
            this.changeTextColor(this.normalColor());
            this.drawText(text, dx, dy, dw, "right");
        } else {
            this.drawText(text, dx, dy, dw, "center");
        }
    };
})();

// SaveInfo - Variable (string support)
(function () {
    Window_SaveInfo.prototype.drawVariable = function (id, dx, dy, dw) {
        const raw = this._saveContents.variables.value(id);
        const text = typeof raw === "number" ? Yanfly.Util.toGroup(raw) : String(raw);
        this.drawText(text, dx, dy, dw, "center");
    };
})();

// SaveInfo – Kohaku State Display
(function () {
    Window_SaveInfo.prototype.drawState = function (pos, dx, dy, dw) {
        const states = this._saveContents.actors._data[1]._states;
        const state = states.map(id => $dataStates[id]).find(s => s?.iconIndex === 33);
        this.drawText(state ? state.name : "-", dx, dy, dw, "center");
    };
})();

// SaveInfo – Gold (formatting)
(function () {
    const _drawGoldCount = Window_SaveInfo.prototype.drawGoldCount;
    Window_SaveInfo.prototype.drawGoldCount = function (dx, dy, dw) {
        const rawLabel = Yanfly.Param.SaveVocabGoldCount;
        if (!rawLabel) {
            _drawGoldCount.call(this, dx, dy, dw);
            return;
        }
        const gold = Yanfly.Util.toGroup(this._saveContents.party._gold);
        let label = Window_Base.prototype.convertEscapeCharacters.call(this, rawLabel);
        label = label.format(TextManager.currencyUnit);
        this._drawData = true;
        const labelWidth = this.textWidthEx(label);
        this.drawTextEx(label, dx, dy);
        this._drawData = false;
        this.changeTextColor(this.normalColor());
        this.drawText(gold, dx, dy, dw - labelWidth - 4, "right");
    };
})();

// SaveInfo – Slot Background Customization
/**
 * COLORS: background fill color per save slot (1–7).
 * IMAGES: images to show from /img/pictures/ per slot (1–7).
 * OPACITY: how transparent the save background images are (0–255).
 * CROP_RATIO: what % of image width to display (0.0–1.0).
 * COLOR_WIDTH: how many pixels wide the background color fill should be.
 */
(function () {
    const COLORS = ["#D5C8D4", "#EDBADB", "#FFE693", "#C24F5C", "#C9CCAF", "#A3AABA", "#DFF3F2"];
    const IMAGES = ["save1", "save2", "save3", "save4", "save5", "save6", "save7"];
    const OPACITY = 220;
    const CROP_RATIO = 0.755;
    const COLOR_WIDTH = 774;
    const _refresh = Window_SaveInfo.prototype.refresh;
    Window_SaveInfo.prototype.refresh = function () {
        this._prepareSlotBackground();
        _refresh.call(this);
    };
    Window_SaveInfo.prototype._prepareSlotBackground = function () {
        const slot = ((this.savefileId() - 1) % 7);
        if (!this._customBackBitmap) {
            this._customBackBitmap = new Bitmap(this.width, this.height);
            this._windowBackSprite.bitmap = this._customBackBitmap;
        }
        this._customBackBitmap.clear();
        const color = COLORS[slot];
        const image = IMAGES[slot];
        if (color) {
            this._customBackBitmap.fillRect(0, 0, COLOR_WIDTH, this.height, color);
        }
        if (!image)
            return;
        const bitmap = ImageManager.loadPicture(image);
        bitmap.addLoadListener(() => {
            if (!this._customBackBitmap)
                return;
            const cropped = Math.floor(bitmap.width * CROP_RATIO);
            this._customBackBitmap.paintOpacity = OPACITY;
            this._customBackBitmap.blt(bitmap, 0, 0, cropped, bitmap.height, 0, 0);
            this._customBackBitmap.paintOpacity = 255;
        });
    };
})();

// Max 99 saves, must fill to increase beyond 7
DataManager._dynamicMaxSavefiles = null;
DataManager.maxSavefiles = function () {
    if (this._dynamicMaxSavefiles) {
        return this._dynamicMaxSavefiles;
    }
    const MAX_CAP = 99;
    const BASE = 7; //Yanfly.Param.SaveMaxFiles;
    let nonEmpty = 0;
    let highest = 0;
    for (let i = 1; i <= MAX_CAP; i++) {
        if (StorageManager.exists(i)) {
            nonEmpty++;
            highest = i;
        }
    }
    if (SceneManager._scene instanceof Scene_Load) {
        this._dynamicMaxSavefiles = Math.min(MAX_CAP, Math.max(highest, BASE));
    } else {
        this._dynamicMaxSavefiles = Math.min(MAX_CAP, Math.max(nonEmpty + 1, highest, BASE));
    }
    return this._dynamicMaxSavefiles;
};
const _Scene_File_onSaveSuccess = Scene_File.prototype.onSaveSuccess;
Scene_File.prototype.onSaveSuccess = function () {
    DataManager._dynamicMaxSavefiles = null;
    $gameVariables.setValue(94, this.savefileId());
    _Scene_File_onSaveSuccess.call(this);
    this._listWindow.refresh();
};
const _Scene_File_performActionDelete = Scene_File.prototype.performActionDelete;
Scene_File.prototype.performActionDelete = function () {
    _Scene_File_performActionDelete.call(this);
    DataManager._dynamicMaxSavefiles = null;
    DataManager._globalInfo = null;
    DataManager._globalInfoPruned = false;
    const w = this._listWindow;
    w.refresh();
    w.select(Math.min(w.index(), w.maxItems() - 1, 98));
    if (SceneManager._scene instanceof Scene_Load && !DataManager.isAnySavefileExists()) {
        SceneManager.goto(Scene_Title);
    }
};
const _Scene_File_create = Scene_File.prototype.create;
Scene_File.prototype.create = function () {
    DataManager._dynamicMaxSavefiles = null;
    _Scene_File_create.call(this);
    const w = this._listWindow;
    w.select(Math.min(w.index(), w.maxItems() - 1, 98));
};

// rpgsave.bak files aren't used, disable them
//StorageManager.backup = function () {};

// If no actual save files exist, wipe globalInfo to reduce lag
DataManager._globalInfoPruned = false;
const _DataManager_loadGlobalInfo = DataManager.loadGlobalInfo;
DataManager.loadGlobalInfo = function () {
    const info = _DataManager_loadGlobalInfo.call(this) || [];
    if (!this._globalInfoPruned) {
        let changed = false;
        for (let i = 1; i < info.length; i++) {
            if (info[i] && !StorageManager.exists(i)) {
                info[i] = null;
                changed = true;
            }
        }
        let last = info.length - 1;
        while (last > 0 && !info[last]) {
            last--;
        }
        info.length = last + 1;
        if (changed) {
            this._globalInfo = info;
            try {
                StorageManager.save(0, JSON.stringify(info));
            } catch (e) {
                console.error(e);
            }
        }
        this._globalInfoPruned = true;
    }
    return info;
};
//___________________________
// * Editted the main plugin file in some places, load preferences and changes.
// * State [n] is now a valid entry in Data Columns. Returns name of state affecting Kohaku if its icon is 33.

//=============================================================================
// ** YEP_X_MessageBacklog
//=============================================================================
(function () {
    "use strict";
    if (!window.Window_MessageBacklog || !Window_MessageBacklog.prototype)
        return;
    const HALT_SWITCH_ID = 392;
    const HALT_FRAMES = 15;

    // Utilities
    const fontForLanguage = (lang) => {
        const map = {
            "日本語": "GameFont_2",
            "English": "GameFont_2",
            "Español": "GameFont_4",
            "Português": "GameFont_4",
            "한국어": "GameFont_3",
            "简体中文": "GameFont"
        };
        return Object.hasOwn(map, lang) ? map[lang] : "GameFont";
    };
    const currentLanguage = () => {
        if (typeof ConfigManager !== "undefined") {
            if (typeof ConfigManager.getLanguage === "function")
                return String(ConfigManager.getLanguage());
            if (ConfigManager.language !== undefined)
                return String(ConfigManager.language);
        }
        return "日本語";
    };
    const isHaltActive = () => $gameSwitches && $gameSwitches.value(HALT_SWITCH_ID);
    const swallowBacklogKeyIfHalt = () => {
        if (!isHaltActive())
            return false;
        if (Input.isTriggered(Yanfly.Param.MsgBacklogKeyButton)) {
            Input.clear();
            TouchInput.clear();
            return true;
        }
        return false;
    };

    // Background picture selection (based on last accessed save).
    Window_MessageBacklog.prototype._okitsuneBacklogPictureFilename = function () {
        const n = ((DataManager.lastAccessedSavefileId() - 1) % 7) + 1;
        return "save" + n;
    };
    const _createBackgroundPicture = Window_MessageBacklog.prototype.createBackgroundPicture;
    Window_MessageBacklog.prototype.createBackgroundPicture = function () {
        const filename = this._okitsuneBacklogPictureFilename();
        if (!filename)
            return;
        if (!this._backgroundPicture) {
            this._backgroundPicture = new Sprite();
            this._backgroundPicture.anchor.x = 0.5;
            this._backgroundPicture.anchor.y = 0.5;
            this._backgroundPicture.x = this.width / 2;
            this._backgroundPicture.y = this.height / 2;
            this.addChildAt(this._backgroundPicture, 0);
        }
        if (this._backgroundPicture._filename !== filename) {
            this._backgroundPicture.bitmap = ImageManager.loadPicture(filename, 0);
            this._backgroundPicture._filename = filename;
            const bmp = this._backgroundPicture.bitmap;
            bmp.addLoadListener(() => {
                if (this.stretchBgPicture)
                    this.stretchBgPicture();
            });
        }
        this._backgroundPicture.opacity = 0;
    };
    const _stretchBgPicture = Window_MessageBacklog.prototype.stretchBgPicture;
    Window_MessageBacklog.prototype.stretchBgPicture = function () {
        if (typeof _stretchBgPicture === "function") {
            _stretchBgPicture.call(this);
            return;
        }
        if (!this._backgroundPicture || !Yanfly.Param.MsgBacklogPicStretch)
            return;
        const bw = Math.max(1, this._backgroundPicture.width);
        const bh = Math.max(1, this._backgroundPicture.height);
        if (bw < Graphics.boxWidth)
            this._backgroundPicture.scale.x = Graphics.boxWidth / bw;
        if (bh < Graphics.boxHeight)
            this._backgroundPicture.scale.y = Graphics.boxHeight / bh;
    };
    const _setBgPictureOpacity = Window_MessageBacklog.prototype.setBgPictureOpacity;
    Window_MessageBacklog.prototype.setBgPictureOpacity = function (opacity) {
        if (typeof _setBgPictureOpacity === "function") {
            _setBgPictureOpacity.call(this, opacity);
        } else if (this._backgroundPicture) {
            this._backgroundPicture.opacity = opacity;
            if (this.stretchBgPicture)
                this.stretchBgPicture();
        }
    };

    //Dim layer for picture background type.
    Window_MessageBacklog.prototype._okitsuneEnsureDim = function () {
        const w = Graphics.boxWidth;
        const h = Graphics.boxHeight;
        if (!this._backgroundDim) {
            this._backgroundDim = new Sprite(new Bitmap(w, h));
            this._backgroundDim.opacity = 0;
            const idx = this.children.indexOf(this._backgroundPicture);
            this.addChildAt(this._backgroundDim, Math.max(0, idx) + 1);
        } else {
            const bmp = this._backgroundDim.bitmap;
            if (!bmp || bmp.width !== w || bmp.height !== h) {
                this._backgroundDim.bitmap = new Bitmap(w, h);
            }
        }
    };
    Window_MessageBacklog.prototype._okitsuneRefreshDim = function () {
        if (!this._backgroundDim || !this._backgroundDim.bitmap)
            return;
        const bmp = this._backgroundDim.bitmap;
        bmp.clear();
        if (bmp.gradientFillRect) {
            bmp.gradientFillRect(0, 0, Graphics.boxWidth, Graphics.boxHeight, this.dimColor1(), this.dimColor2(), true);
        } else {
            bmp.fillAll(this.dimColor1());
        }
    };

    // Halt (Switch 392 + countdown)
    Window_MessageBacklog.prototype._okitsuneStartHaltFrames = function (frames) {
        if (!$gameSwitches)
            return;
        $gameSwitches.setValue(HALT_SWITCH_ID, true);
        this._okitsuneHaltCountdown = Math.max(0, frames | 0);
    };
    const _fullActivate = Window_MessageBacklog.prototype.fullActivate;
    Window_MessageBacklog.prototype.fullActivate = function () {
        const scn = SceneManager._scene;
        const mw = scn && scn._messageWindow;
        this._okitsuneOpenedDuringPause = !!(mw && mw.pause);
        if (typeof _fullActivate === "function")
            _fullActivate.call(this);
        if (typeof Yanfly !== "undefined" && Yanfly.Param && Yanfly.Param.MsgBacklogBgType === 2) {
            this.createBackgroundPicture();
            if (this._backgroundPicture)
                this.setBgPictureOpacity(Yanfly.Param.MsgBacklogPicOpacity);
            this._okitsuneEnsureDim();
            this._okitsuneRefreshDim();
            if (this._backgroundDim)
                this._backgroundDim.opacity = 255;
        }
        if ($gameSwitches && !$gameSwitches.value(HALT_SWITCH_ID)) {
            this._okitsuneStartHaltFrames(HALT_FRAMES);
        }
    };
    const _fullDeactivate = Window_MessageBacklog.prototype.fullDeactivate;
    Window_MessageBacklog.prototype.fullDeactivate = function () {
        if (typeof _fullDeactivate === "function")
            _fullDeactivate.call(this);
        if (this._backgroundDim)
            this._backgroundDim.opacity = 0;
        this._okitsuneStartHaltFrames(HALT_FRAMES);
        if (this._okitsuneOpenedDuringPause && $gameMessage) {
            if (typeof $gameMessage.clearAlignLast === "function") {
                $gameMessage.clearAlignLast();
            }
        }
        this._okitsuneOpenedDuringPause = false;
        const scn = SceneManager._scene;
        const mw = scn && scn._messageWindow;
        if (mw) {
            if (typeof mw.isAnySubWindowActive === "function") {
                if (!mw.isAnySubWindowActive())
                    mw.activate();
            } else {
                mw.activate();
            }
        }
        Input.clear();
        TouchInput.clear();
    };
    const _update = Window_MessageBacklog.prototype.update;
    Window_MessageBacklog.prototype.update = function () {
        if (typeof _update === "function")
            _update.call(this);
        if (this._okitsuneHaltCountdown > 0) {
            this._okitsuneHaltCountdown--;
            if (this._okitsuneHaltCountdown <= 0 && $gameSwitches) {
                $gameSwitches.setValue(HALT_SWITCH_ID, false);
            }
        }
    };

    // Input handling tweaks
    Window_MessageBacklog.prototype.processHandling = function () {
        if (!this.isOpenAndActive())
            return;
        if (Input.isTriggered(Yanfly.Param.MsgBacklogKeyButton)) {
            if (isHaltActive())
                return;
            this.processCancel();
            return;
        }
        Window_Command.prototype.processHandling.call(this);
    };
    // Disable PageUp behaviors
    Window_MessageBacklog.prototype.cursorPageup = function () {};
    if (window.Window_Selectable && Window_Selectable.prototype) {
        Window_Selectable.prototype.processPageup = function () {};
        Window_Selectable.prototype.cursorPageup = function () {};
    }
    // Block backlog opening while halt active
    if (window.Window_Message && Window_Message.prototype) {
        const _openBacklogWindow = Window_Message.prototype.openBacklogWindow;
        Window_Message.prototype.openBacklogWindow = function () {
            if (isHaltActive())
                return;
            _openBacklogWindow.call(this);
        };
    }
    const patchBacklogInput = (proto, name) => {
        if (!proto || typeof proto[name] !== "function")
            return;
        const _fn = proto[name];
        proto[name] = function () {
            if (swallowBacklogKeyIfHalt())
                return;
            _fn.call(this);
        };
    };
    if (window.Window_Message && Window_Message.prototype) {
        patchBacklogInput(Window_Message.prototype, "updateBacklogInput");
    }
    if (window.Window_ChoiceList && Window_ChoiceList.prototype) {
        patchBacklogInput(Window_ChoiceList.prototype, "updateBacklogInput");
    }
    if (window.Window_NumberInput && Window_NumberInput.prototype) {
        patchBacklogInput(Window_NumberInput.prototype, "updateBacklogInput");
    }
    if (window.Window_EventItem && Window_EventItem.prototype) {
        patchBacklogInput(Window_EventItem.prototype, "updateBacklogInput");
    }
    // Ensure OK/Cancel clears buffered inputs
    const _processOk = Window_MessageBacklog.prototype.processOk;
    Window_MessageBacklog.prototype.processOk = function () {
        _processOk.call(this);
        Input.clear();
        TouchInput.clear();
    };
    const _processCancel = Window_MessageBacklog.prototype.processCancel;
    Window_MessageBacklog.prototype.processCancel = function () {
        _processCancel.call(this);
        Input.clear();
        TouchInput.clear();
    };
    
    // Remove extra message-only codes
    const _removeCodes = Window_MessageBacklog.prototype.removeMessageBoxOnlyCodes;
    Window_MessageBacklog.prototype.removeMessageBoxOnlyCodes = function (text) {
        text = _removeCodes.call(this, text);
        text = text.replace(/\\SE\[[^\]]*]/gi, "");
        text = text.replace(/\\>/g, "");
        text = text.replace(/\\</g, "");
        text = text.replace(/\\\^/g, "");
        text = text.replace(/\\!/g, "");
        text = text.replace(/\\\./g, "");
        text = text.replace(/\\\|/g, "");
        text = text.replace(/\\\{/g, "");
        text = text.replace(/\\\}/g, "");
        text = text.replace(/\\S\[[^\]]*]/gi, "");
        // Strip empty lines
        const out = [];
        const lines = String(text || "").split("\n");
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i] || "";
            line = line.replace(/^(?:\\[\u3000 ]+)+/, "");
            line = line.replace(/^((?:\\(?:[A-Za-z]+(?:\[[^\]]*])?|.))+)[\u3000 ]+/, "$1");
            line = line.replace(/^[\s\u3000]+/, "");
            const clean = line.replace(/\\[>^|!]+/g, "").replace(/\\[A-Za-z]+\[[^\]]*]/g, "").replace(/\\[A-Za-z]+/g, "").trim();
            if (clean.length > 0)
                out.push(line);
        }
        return out.join("\n");
    };
    
    // Language's font backlog storage
    if (window.Game_System && Game_System.prototype) {
        const _addMessageBacklog = Game_System.prototype.addMessageBacklog;
        Game_System.prototype.addMessageBacklog = function (text) {
            if (typeof this.isMessageBacklogLoggingEnabled === "function" && !this.isMessageBacklogLoggingEnabled()) {
                return;
            }
            if (typeof this.convertMessageBacklogText === "function") {
                text = this.convertMessageBacklogText(text);
            }
            const lang = currentLanguage();
            const fontName = fontForLanguage(lang);
            const lines = String(text || "").split("\n").map(line => {
                return line && line.length > 0 ? ("\\fn<" + fontName + ">" + line) : line;
            });
            text = lines.join("\n");
            if (typeof _addMessageBacklog === "function") {
                _addMessageBacklog.call(this, text);
                return;
            }
            this._messageBacklog = this._messageBacklog || [];
            this._messageBacklog.push(text);
            const max = (Yanfly.Param && Yanfly.Param.MsgBacklogMaxEntries) || 20;
            while (this._messageBacklog.length > max) {
                this._messageBacklog.shift();
            }
        };
    }
})();

//=============================================================================
// ** RS_MessageAlign
//=============================================================================
 // Choice window support
(function () {
    'use strict';
    const _RSMA_drawItem = Window_ChoiceList.prototype.drawItem;
    Window_ChoiceList.prototype.drawItem = function (index) {
        const raw = $gameMessage.choices()[index] || '';
        let align = 'left';
        const trimmed = raw.replace(/^[ \t]*(?:\\|¥)TA\[(\d)\]/i, (_, n) => {
            align = (n === '1') ? 'center' : (n === '2' ? 'right' : 'left');
            return '';
        }).replace(/^[ \t]*<(LEFT|CENTER|RIGHT)>/i, (_, dir) => {
            align = dir.toLowerCase() === 'center' ? 'center' : (dir.toLowerCase() === 'right' ? 'right' : 'left');
            return '';
        });
        const text = this.convertEscapeCharacters(trimmed);
        const tw = Window_Base.prototype.textWidthEx.call(this, text);
        const rect = this.itemRectForText(index);
        let dx = rect.x;
        if (align === 'center') {
            dx += Math.max(0, (this.contentsWidth() - tw) / 2);
        } else if (align === 'right') {
            dx += Math.max(0, this.contentsWidth() - tw);
        }
        this.resetTextColor();
        this.changePaintOpacity(this.isCommandEnabled(index));
        this.drawTextEx(text, dx, rect.y);
    };
})();
//___________________________
// * Added and update to 'text' in the "Window_Base.prototype.drawTextEx" function in the main plugin file so that SRD Translation Engine translates it.

//=============================================================================
// ** Kosen battle helpers
//=============================================================================
(function () {
    const REVERSE_SWITCH_ID = 105;
	//==============================
    // * Scene_Item logic (mimic CE 213)
    //==============================
    const _Scene_Item_create = Scene_Item.prototype.create;
    Scene_Item.prototype.create = function () {
        _Scene_Item_create.call(this);
        const storedKeyMapper = $gameVariables.value(99);
        if (storedKeyMapper) {
            Input.keyMapper = JSON.parse(JSON.stringify(storedKeyMapper));
        }
        const storedGamepadMapper = $gameVariables.value(100);
        if (storedGamepadMapper) {
            Input.gamepadMapper = JSON.parse(JSON.stringify(storedGamepadMapper));
        }
        Input._currentState['left'] = false;
        Input._currentState['right'] = false;
        Input._currentState['up'] = false;
        Input._currentState['down'] = false;
        $gameSwitches.setValue(REVERSE_SWITCH_ID, false);
    };
	
	//==============================
    // * MOG_Footsteps extension
    //==============================
    const NO_FOOTSTEP_ACTORS = [5, 6, 7];
    const HY0I_REGION_ID = REVERSE_SWITCH_ID;
    const HY0I_STEP_VAR = 119;
    const _createFS = FootStepsSprites.prototype.createFootSteps;
    FootStepsSprites.prototype.createFootSteps = function () {
        _createFS.call(this);
        const s = this._footsprites[this._footsprites.length - 1];
        if (!s) return;
		// Actors that should not leave footsteps
        const actor = this._character.actor && this._character.actor();
        if (actor && NO_FOOTSTEP_ACTORS.includes(actor.actorId())) {
            s.opacity = 0;
            return;
        }
		// Hyoi Pass 2 special logic
        if ($gameMap.mapId() === 18) {
            const isPlayer = this._character === $gamePlayer;
            const inRegion = $gamePlayer.regionId() === HY0I_REGION_ID;
            const reversed = $gameSwitches.value(REVERSE_SWITCH_ID);
            if (isPlayer && inRegion && reversed) {
                const maxSteps = Math.max(10, $gameVariables.value(HY0I_STEP_VAR));
                const ratio = $gameParty.steps() / maxSteps;
                const redOpacity = Math.min(1, Math.max(0, ratio));
                s.setColorTone([255 * redOpacity, 0, 0, 0]);
            } else {
                s.opacity = 0;
            }
        }
    };
    // Overwrite, only increase steps while reversed.
    Game_Party.prototype.increaseSteps = function () {
        if ($gameSwitches.value(REVERSE_SWITCH_ID)) {
            this._steps++;
        }
    };
})();

//=============================================================================
// ** Okitsune
//=============================================================================

//	General function to translate choice window text using SRD_TranslationEngine
function okitsuneTranslateCMD(text) {
    if (ConfigManager.isDefaultLanguage()) return text;
    const lang = ConfigManager.getLanguage();
    return $dataTranslations['cmd']?.[text]?.[lang] || text;
}

//	Fix for a console warning that kept appearing after updating MV's JavaScript
const _Bitmap_drawText = Bitmap.prototype.drawText;
Bitmap.prototype.drawText = function(text, x, y, maxWidth, lineHeight, align) {
    _Bitmap_drawText.call(this, text, x, y, maxWidth, lineHeight, align || 'left');
};

    //==============================
    // * Switch-Based Return Value Functions
    //==============================

function omikujiValues(daikichiValue, shoukichiValue, kyouValue, defaultValue) {
    if ($gameSwitches.value(221)) return daikichiValue;
    if ($gameSwitches.value(222)) return shoukichiValue;
    if ($gameSwitches.value(223)) return kyouValue;
    return defaultValue;
}

function transformationValues(kohakuValue, moniniValue, monimoleValue, tamamoValue) {
    if ($gameSwitches.value(16)) return kohakuValue;
    if ($gameSwitches.value(17)) return moniniValue;
    if ($gameSwitches.value(23)) return monimoleValue;
    return tamamoValue;
}

function languageValue(values) {
    return values[ConfigManager.getLanguage()] ?? values['日本語'];
}

    //==============================
    // * Custom Patrol Functions
    //==============================

//	Patrol between tiles with region IDs set as 2, 4, 6, 8 on the map. Example usage, called from custom route of a monini: regionPatrol(this, true);
function regionPatrol(mamono, reverseAllowed) {
    const region = mamono.regionId();
    if (region) mamono._RegionDir = region;   // Always start on 2, 4, 6 or 8.
    mamono._InverseDir ??= reverseAllowed && Math.random() < 0.5;
    if (mamono._InverseDir) {
        mamono.moveStraight({2:4, 4:8, 8:6, 6:2}[mamono._RegionDir]);
    } else {
        mamono.moveStraight(mamono._RegionDir);
    }
}

//	Patrol a path between designated corner tiles. Example usage, called from custom route of a monimole: monimolePatrol(this, [[25,53], [21,53], [21,58]]);
function tilePatrol(mamono, cornerTiles) {
    mamono._target ??= 0;
    if (mamono._path === undefined) {
        const path = [];
        // Forward traversal
        for (let i = 0; i < cornerTiles.length - 1; i++) {
            const [x1, y1] = cornerTiles[i];
            const [x2, y2] = cornerTiles[i + 1];
            const [dx, dy] = [x2 - x1, y2 - y1];
            const steps = Math.abs(dx || dy);
            const stepX = Math.sign(dx);
            const stepY = Math.sign(dy);
            for (let s = 0; s < steps; s++)
                path.push([x1 + stepX * s, y1 + stepY * s]);
        }
        // Endpoint
        path.push(cornerTiles[cornerTiles.length - 1]);
        // Reverse traversal
        for (let i = path.length - 2; i > 0; i--) {
            path.push(path[i]);
        }
        mamono._path = path;
    }
    const target = mamono._path[mamono._target];
    mamono.moveStraight(mamono.findDirectionTo(target[0], target[1]));
    if (mamono.x === target[0] && mamono.y === target[1])
        mamono._target = (mamono._target + 1) % mamono._path.length;
}

function playerDamageRecoil() {
	const images = [['$DMZ1', '$kohaku%(8)'], ['$DMZ2', '$kohakumonini%(8)'], ['$DMZ4', '$MON%(8)'], ['$DMZ3', '$TAMAMO%(8)']][transformationValues(0, 1, 2, 3)];
	ImageManager.loadCharacter(images[0]);
	ImageManager.loadCharacter(images[1]);
	$gamePlayer.turnTowardCharacter($gameMap.event($gameVariables.value(27)))
	const originalSpeed = $gamePlayer.moveSpeed();
	const route = {
		repeat: false,
		skippable: true,
		wait: true,
		list: [{
				code: Game_Character.ROUTE_CHANGE_IMAGE,
				parameters: [images[0], 0]
			}, {
				code: Game_Character.ROUTE_CHANGE_SPEED,
				parameters: [originalSpeed + 1]
			}, {
				code: Game_Character.ROUTE_MOVE_BACKWARD
			}, {
				code: Game_Character.ROUTE_CHANGE_SPEED,
				parameters: [originalSpeed]
			}, {
				code: Game_Character.ROUTE_CHANGE_IMAGE,
				parameters: [images[1], 0]
			}, {
				code: Game_Character.ROUTE_END
			}
		]
	};
	$gamePlayer.forceMoveRoute(route);
}

// battleReward(this.character(0));
function battleReward(targetEvent) {
    const mapId = $gameMap.mapId();
    const {id: eventId, name} = targetEvent.event();
    switch (name) {
    case 'モニニ':
        if ($gameSelfSwitches.value([mapId, eventId, 'B'])) {
            AudioManager.playSe({name: 'Item3', volume: 50, pitch: 100});
            $gameParty.gainItem($dataItems[5], 1);
        } else {
            AudioManager.playSe({name: 'KANE2', volume: 50, pitch: 100});
            $gameParty.gainGold(1);
        }
		targetEvent.locate(0, 0);
		targetEvent.erase();
        break;
    case 'モニモル':
        if ($gameSelfSwitches.value([mapId, eventId, 'B'])) {
            AudioManager.playSe({name: 'Item3', volume: 50, pitch: 100});
            $gameParty.gainItem($dataItems[11], 1);
        } else {
            AudioManager.playSe({name: 'KANE2', volume: 50, pitch: 100});
            $gameParty.gainGold(1);
        }
		targetEvent.locate(0, 0);
		targetEvent.erase();
        break;
    case '小吉':
        AudioManager.playSe({name: 'KANE2', volume: 40, pitch: 100});
        $gameParty.gainGold(10);
		targetEvent.locate(0, 0);
		targetEvent.erase();
        break;
    case '高原ナス':
        AudioManager.playSe({name: 'KANE2', volume: 50, pitch: 100});
        $gameParty.gainGold(1);
		$gameSelfSwitches.setValue([mapId, eventId, 'C'], true);
        break;
    case 'かぼちゃ':
        AudioManager.playSe({name: 'KANE2', volume: 50, pitch: 100});
        $gameParty.gainGold(10);
		$gameSelfSwitches.setValue([mapId, eventId, 'C'], true);
        break;
    case 'キノコ':
        AudioManager.playSe({name: 'KANE2', volume: 50, pitch: 100});
        $gameParty.gainGold(10);
		$gameSelfSwitches.setValue([mapId, eventId, 'C'], true);
        break;
    case '金岩':
        AudioManager.playSe({name: 'KANE2', volume: 30, pitch: 100});
        $gameParty.gainGold(10);
		$gameSelfSwitches.setValue([mapId, eventId, 'D'], true);
        break;
    case '岩(小)':
        AudioManager.playSe({name: 'KANE2', volume: 30, pitch: 100});
        $gameParty.gainGold(10);
		$gameSelfSwitches.setValue([mapId, eventId, 'D'], true);
        break;
    }
}

    //==============================
    // * Risen Boss Battle Helper Functions
    //==============================
function copyKohakuIsCollide() {
    return !$gameSwitches.value(6) && [$gameMap.event(54), $gamePlayer].some(e => e.isCollidedWithCharacters($gameMap.roundXWithDirection(e.x, e.direction()), $gameMap.roundYWithDirection(e.y, e.direction())))
}
function copyKohakuAI(copy) {
    const l = Input.isPressed('left'), r = Input.isPressed('right'), d = Input.isPressed('down'), u = Input.isPressed('up');
    (l ^ r && d ^ u) ? copy.moveDiagonally(l ? 6 : 4, d ? 8 : 2) : (l ^ r ? copy.moveStraight(l ? 6 : 4) : d ^ u && copy.moveStraight(d ? 8 : 2));
}
function risenFinalEventsErased() {
    return [24, 50, 51, 52, 53].every(id => $gameMap.event(id)._erased)
}
function risenBossMonimole(monimole) {
    const region = monimole.regionId();
    if (region - 10 > 0) monimole._RegionDir = region - 10;
    if (monimole.isCollidedWithCharacters($gameMap.roundXWithDirection(monimole.x, monimole._RegionDir), monimole.y)) {
        $gameMap.event(54).turnTowardCharacter(monimole);
        $gameVariables.setValue(27, monimole._eventId);
        $gameTemp.reserveCommonEvent(54);
    }
    monimole.moveStraight(monimole._RegionDir);
}
function risenBossMonini(monini) {
    const region = monini.regionId();
    if ([4, 6].includes(region)) monini._RegionDir = region;
    monini.moveStraight($gameVariables.value(44) ? {4: 6, 6: 4}[monini._RegionDir] : monini._RegionDir);
}
    //==============================
    // * Miscellaneous
    //==============================

//	Durstenfeld shuffle (Source - https://stackoverflow.com/a/12646864)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.randomInt(i + 1);
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

//=============================================================================
// ** List of other plugins with modifications to them not already mentioned in this assistance plugin
//=============================================================================
/*
	* Community_Basic - Commented out "SceneManager.preferableRendererType" function.
    * DTextPicture - Commented out a portion of the "Game_Screen.prototype.setDTextPicture" function in the main plugin file.
	* Mano_InputConfig - Many changes, mainly support for more keyboard layouts and text corrections.
	* Torigoya_EasyStaffRoll - Expanded to be able to create multiple staff rolls based on SRD's ConfigManager.getLanguage(). Has font selection logic within the file that would need to be editted if new languages are added.
	* YEP_X_CoreUpdatesOpt - commented out some decrypter and ImageManager.isReady overwrites due to conflicts and crashes.
    * YEP_RegionRestrictions - Commented out "if (this.isThrough()) return false;" in both isEventRegionForbid and isPlayerRegionForbid to mimic behavior of TMMoveEx.
*/