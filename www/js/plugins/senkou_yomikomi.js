

/*:
 * @plugindesc 起動時にファイルを先読みするプラグインです。
 * 
 * @author しぐれん
 * 
 * @param character
 * @desc ここで指定したファイルを先に読み込んでおきます。
 * @type file[]
 * @dir img/characters
 * 
 * 
 * @help
 * 指定した画像ファイルを起動時に読み込みます。
 * 
 * 
**/


(function(){
    'use strict'
const   Scene_Boot_loadSystemWindowImage =Scene_Boot.prototype.loadSystemWindowImage;
Scene_Boot.prototype.loadSystemWindowImage =function(){
    Scene_Boot_loadSystemWindowImage.call(this);
    const param = PluginManager.parameters("senkou_yomikomi");
    const list = JSON.parse(param.character);
    for (const c of list) {
        console.log(c);
        ImageManager.reserveCharacter(c);
    }
};

})()