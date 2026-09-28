//=============================================================================
// TidyTilingTitleTie.js
// ----------------------------------------------------------------------------
// Copyright (c) 2017 Tsumio
// This software is released under the MIT License.
// http://opensource.org/licenses/mit-license.php
// ----------------------------------------------------------------------------
// Version
// 1.0.0 2017/08/12 公開。
// ----------------------------------------------------------------------------
// [Blog]   : http://ntgame.wpblog.jp/
// [Twitter]: https://twitter.com/TsumioNtGame
//=============================================================================

/*:
 * @plugindesc This plugin scroll the background of the title screen automatically, and add a particle function.
 * @author Tsumio
 *
 * @param ----Background Settings----
 * @desc 
 * @default 
 * 
 * @param MainDrawingArea
 * @type number[]
 * @min -2000
 * @max 2000
 * @desc This is a setting sets the drawing area of the main background.The order is [x, y, width, heigh].If you set '-1' in size, sets the screen size.
 * @default ["0","0","-1","-1"]
 * 
 * @param MainBackgroundSpeedX
 * @type number
 * @min -255
 * @max 255
 * @decimals 2
 * @desc This is a setting sets the speed of the main background X direction.
 * @default 0
 * 
 * @param MainBackgroundSpeedY
 * @type number
 * @min -255
 * @max 255
 * @decimals 2
 * @desc This is a setting sets the speed of the main background Y direction.
 * @default 0
 * 
 * @param SubDrawingArea
 * @type number[]
 * @min -2000
 * @max 2000
 * @desc This is a setting sets the drawing area of the sub background.The order is [x, y, width, heigh].If you set '-1' in size, sets the screen size.
 * @default ["0","0","-1","-1"]
 * 
 * @param SubBackgroundSpeedX
 * @type number
 * @min -255
 * @max 255
 * @decimals 2
 * @desc This is a setting sets the speed of the sub background X direction.
 * @default 0
 * 
 * @param SubBackgroundSpeedY
 * @type number
 * @min -255
 * @max 255
 * @decimals 2
 * @desc This is a setting sets the speed of the sub background Y direction.
 * @default 0
 * 
 * @param ----Particle Settings----
 * @desc 
 * @default 
 * 
 * 
 * @param ParticleImage
 * @type file
 * @require 1
 * @desc Sets the image of the particle image from 'pictures' folder.If you don't set anything, particle is empty.
 * @dir img/pictures
 * @default
 * 
 * @param ParticleDrawingArea
 * @type number[]
 * @min -2000
 * @max 2000
 * @desc This is a setting sets the drawing area of the particle.The order is [x, y, width, heigh].If you set '-1' in size, sets the screen size.
 * @default ["0","0","-1","-1"]
 * 
 * @param ParticleSettings
 * @type number[]
 * @min -2000
 * @max 2000
 * @desc This is a setting sets the opacity and blend mode(0:Normal 1:Addition 2:Multiplication 3:Screen）.The order is [opacity, blendMode].  
 * @default ["255","0"]
 * 
 * 
 * @param ParticleFlashing
 * @type boolean
 * @desc This is a setting sets whether to make the particles flash.
 * @default true
 * 
 * @param ParticleScrollSpeedX
 * @type number
 * @min -255
 * @max 255
 * @decimals 2
 * @desc This is a setting sets the scroll X speed of the particle.
 * @default 0
 * 
 * @param ParticleScrollSpeedY
 * @type number
 * @min -255
 * @max 255
 * @decimals 2
 * @desc This is a setting sets the scroll Y speed of the particle.
 * @default 0
 * 
 * @help This plugin scroll the background of the title screen automatically, and add a particle function.
 * 
 * ----how to use----
 * You can use this plugin after setting some plugin parameters.
 * 
 * Background image is obtained from 'Tool -> DataBase -> System -> TitleScreen'.
 * 
 * If you set minus in the speed, image scroll in the opposite direction.
 * 
 * 
 * 
 * ----plugin command----
 * There is no plugin command.
 * 
 * 
 * ----others----
 * This plugin is maked for plugin lecture.
 * The details of the lecture can see at the following URL.
 * http://ntgame.wpblog.jp/2017/08/11/post-721/
 * You can transplant easyly this plugin function to other than the title scene.
 * Please have a look if you are interested !
 * 
 * --Terms of Use--
 * This plugin is free for both commercial and non-commercial use.
 * You don't have to make sure to credit.
 * Furthermore, you may edit the source code to suit your needs,
 * so long as you don't claim the source code belongs to you.
 * 
 */
/*:ja
 * @plugindesc タイトル画面の背景にスクロール機能とパーティクル機能を追加。
 * @author ツミオ
 *
 * @param ----背景の設定----
 * @desc 
 * @default 
 * 
 * @param メイン背景の描画領域
 * @type number[]
 * @min -2000
 * @max 2000
 * @desc メイン背景の描画領域を指定します。[x, y, width, heigh]の順。サイズに-1を指定した場合、スクリーンのサイズが代入されます。
 * @default ["0","0","-1","-1"]
 * 
 * @param メイン背景のX方向の速度
 * @type number
 * @min -255
 * @max 255
 * @decimals 2
 * @desc メイン背景のX方向の速度を設定します。
 * @default 0
 * 
 * @param メイン背景のY方向の速度
 * @type number
 * @min -255
 * @max 255
 * @decimals 2
 * @desc メイン背景のX方向の速度を設定します。
 * @default 0

 * @param サブ背景のX方向の速度
 * @type number
 * @min -255
 * @max 255
 * @decimals 2
 * @desc サブ背景のX方向の速度を設定します。
 * @default 0

 * @param サブ背景のY方向の速度
 * @type number
 * @min -255
 * @max 255
 * @decimals 2
 * @desc サブ背景のY方向の速度を設定します。
 * @default 0
 * 
 * @param サブ背景の描画領域
 * @type number[]
 * @min -2000
 * @max 2000
 * @desc サブ背景の描画領域を指定します。[x, y, width, heigh]の順。サイズに-1を指定した場合、スクリーンのサイズが代入されます。
 * @default ["0","0","-1","-1"]
 * 
 * 
 * @param ----パーティクルの設定----
 * @desc 
 * @default 
 * 
 * @param パーティクル画像
 * @type file
 * @require 1
 * @desc パーティクル用の画像を指定します。画像はpicturesフォルダから読み込まれ、指定がない場合パーティクルの画像は表示されません。
 * @dir img/pictures
 * @default
 * 
 * @param パーティクル画像の描画領域
 * @type number[]
 * @min -2000
 * @max 2000
 * @desc 画像の描画領域を指定します。[x, y, width, heigh]の順。サイズに-1を指定した場合、スクリーンのサイズが代入されます。
 * @default ["0","0","-1","-1"]
 * 
 * @param パーティクル画像の設定
 * @type number[]
 * @min -2000
 * @max 2000
 * @desc 画像の透明度とブレンドモード（0：通常 1：加算 2：乗算 3：スクリーン）を指定します。[opacity, blendMode]の順。 
 * @default ["255","0"]
 * 
 * 
 * @param パーティクル画像の点滅
 * @type boolean
 * @desc パーティクル画像を点滅させるかどうかを設定します。
 * @default true
 * 
 * @param パーティクル画像のX方向の速度
 * @type number
 * @min -255
 * @max 255
 * @decimals 2
 * @desc パーティクル画像の横方向の速度を設定します。
 * @default 0
 * 
 * @param パーティクル画像のY方向の速度
 * @type number
 * @min -255
 * @max 255
 * @decimals 2
 * @desc パーティクル画像のY方向の速度を設定します。
 * @default 0
 * 
 * @help タイトル画面の背景にスクロール機能とパーティクル機能を追加します。
 * 
 * 【使用方法】
 * プラグインの導入後、プラグインパラメーターを設定することによって使用できます。
 * 
 * 背景画像は「ツール→データベース→システム→タイトル画面」から取得されます。
 * 
 * 速度にマイナスを指定した場合、逆向きへスクロールします。
 * 
 * 【プラグインコマンド】
 * このプラグインにプラグインコマンドはありません。
 *
 *
 * 【その他】
 * このプラグインは、プラグイン制作講座用に作成されたものです。
 * 講座の詳細は
 * http://ntgame.wpblog.jp/2017/08/11/post-721/
 * を参照してください。
 * このプラグインの機能をタイトル画面以外に流用することも比較的簡単にできますので、興味があればご覧ください。
 * 
 * 利用規約：
 * 作者に無断で改変、再配布が可能で、利用形態（商用、18禁利用等）
 * についても制限はありません。
 * 自由に使用してください。
 * 
 */

(function() {
    'use strict';
    var pluginName = 'TidyTilingTitleTie';

////=============================================================================
//// NTMO
////  Declare NTMO namespace.
////=============================================================================
    var NTMO = NTMO || {};
    NTMO.TTTT = function(){
    };

    NTMO.TTTT.isNumberMinus = function(num) {
        if(num < 0){
            return true;
        }
        return false;
    };

    NTMO.TTTT.convertBackgroundWidth = function(num) {
        if(NTMO.TTTT.isNumberMinus(num)){
            return Graphics.width; 
        }else{
            return num;
        }
    };

    NTMO.TTTT.convertBackgroundHeight = function(num) {
        if(NTMO.TTTT.isNumberMinus(num)){
            return Graphics.height; 
        }else{
            return num;
        }
    };

////=============================================================================
//// Local function
////  These functions checks & formats pluguin's command parameters.
////  I borrowed these functions from Triacontane.Thanks!
////=============================================================================
    var getParamString = function(paramNames) {
        if (!Array.isArray(paramNames)) paramNames = [paramNames];
        for (var i = 0; i < paramNames.length; i++) {
            var name = PluginManager.parameters(pluginName)[paramNames[i]];
            if (name) return name;
        }
        return '';
    };

    var getParamNumber = function(paramNames, min, max) {
        var value = getParamString(paramNames);
        if (arguments.length < 2) min = -Infinity;
        if (arguments.length < 3) max = Infinity;
        return (parseInt(value) || 0).clamp(min, max);
    };

    //This function is not written by Triacontane.Tsumio wrote this function !
    var getParamDouble = function(paramNames, min, max) {
        var value = getParamString(paramNames);
        if (arguments.length < 2) min = -Infinity;
        if (arguments.length < 3) max = Infinity;
        return Number(value);
    };

    //This function is not written by Triacontane.Tsumio wrote this function !
    var convertParam = function(param) {
        if(param !== undefined){
            try {
                return JSON.parse(param);
            }catch(e){
                console.group();
                console.error('%cParameter is invalid ! You should check the following parameter !','background-color: #5174FF');
                console.error('Parameter:' + eval(param));
                console.error('Error message :' + e);
                console.groupEnd();
            }
        }
    };

////=============================================================================
//// Get and set pluguin parameters.
////=============================================================================
    var param                          = {};
    //Background parameter.
    param.settings_mainBackground      = getParamString(['MainDrawingArea',       'メイン背景の描画領域']);
    param.speed_mainBackgroundX        = getParamDouble(['MainBackgroundSpeedX',  'メイン背景のX方向の速度']);
    param.speed_mainBackgroundY        = getParamDouble(['MainBackgroundSpeedY',  'メイン背景のY方向の速度']);
    param.settings_subBackground       = getParamString(['SubDrawingArea',        'サブ背景の描画領域']);
    param.speed_subBackgroundX         = getParamDouble(['SubBackgroundSpeedX',   'サブ背景のX方向の速度']);
    param.speed_subBackgroundY         = getParamDouble(['SubBackgroundSpeedY',   'サブ背景のY方向の速度']);
    //Particle parameter.
    param.img_particle                 = getParamString(['ParticleImage',         'パーティクル画像']);
    param.drawingArea_particle         = getParamString(['ParticleDrawingArea',   'パーティクル画像の描画領域']);
    param.settings_particle            = getParamString(['ParticleSettings',      'パーティクル画像の設定']);
    param.isFlahing_particle           = getParamString(['ParticleFlashing',      'パーティクル画像の点滅']);
    param.speedX_particle              = getParamDouble(['ParticleScrollSpeedX',  'パーティクル画像のX方向の速度']);
    param.speedY_particle              = getParamDouble(['ParticleScrollSpeedY',  'パーティクル画像のY方向の速度']);

////==============================
//// Convert parameters.
////==============================
    //Background
    param.settings_mainBackground    = convertParam(param.settings_mainBackground);
    param.settings_subBackground     = convertParam(param.settings_subBackground);
    //Particle
    param.drawingArea_particle       = convertParam(param.drawingArea_particle);
    param.settings_particle          = convertParam(param.settings_particle);
    param.isFlahing_particle         = convertParam(param.isFlahing_particle);


//////=============================================================================
///// Scene_Title
/////  Add particle and scrolling background.
/////=============================================================================
    var _Scene_Title_createBackground = Scene_Title.prototype.createBackground;
    Scene_Title.prototype.createBackground = function() {
        _Scene_Title_createBackground.call(this);

        //Hide the original background to display the scrolling background.
        this._backSprite1.visible = false;
        this._backSprite2.visible = false;
        
        //Initialize background settings.
        var main_x      = param.settings_mainBackground[0];
        var main_y      = param.settings_mainBackground[1];
        var main_width  = NTMO.TTTT.convertBackgroundWidth(param.settings_mainBackground[2]);
        var main_height = NTMO.TTTT.convertBackgroundHeight(param.settings_mainBackground[3]);
        var sub_x       = param.settings_subBackground[0];
        var sub_y       = param.settings_subBackground[1];
        var sub_width   = NTMO.TTTT.convertBackgroundWidth(param.settings_subBackground[2]);
        var sub_height  = NTMO.TTTT.convertBackgroundHeight(param.settings_subBackground[3]);

        //Create scrolling background.You should 'move()' each image, if you want to draw a certain range.
        this.scrollBackImages = new NTMO.TTTT.ScrollBackImages(this, $dataSystem.title1Name, $dataSystem.title2Name);
        this.scrollBackImages.setMainSpeed(param.speed_mainBackgroundX,param.speed_mainBackgroundY);
        this.scrollBackImages.setSubSpeed(param.speed_subBackgroundX, param.speed_subBackgroundY);
        this.scrollBackImages.moveMainSprite(main_x, main_y, main_width, main_height);
        this.scrollBackImages.moveSubSprite(sub_x, sub_y, sub_width, sub_height);
    };

    var _Scene_Title_create = Scene_Title.prototype.create;
    Scene_Title.prototype.create = function() {
        _Scene_Title_create.call(this);

        this.createParticle_TTTT();
    };

    Scene_Title.prototype.createParticle_TTTT = function() {
        //Initialize particle settings.
        var fileName    = param.img_particle;
        var opacity     = param.settings_particle[0];
        var blendMode   = param.settings_particle[1];
        var x           = param.drawingArea_particle[0];
        var y           = param.drawingArea_particle[1];
        var width       = NTMO.TTTT.convertBackgroundWidth(param.drawingArea_particle[2]);
        var height      = NTMO.TTTT.convertBackgroundHeight(param.drawingArea_particle[3]);

        //Create particle.You should 'move()' each image, if you want to draw a certain range.
        this.particleImage = new NTMO.TTTT.ParticleImage(this, fileName, opacity, blendMode, param.isFlahing_particle);
        this.particleImage.setSpeed(param.speedX_particle, param.speedY_particle);
        this.particleImage.moveSprite(x, y, width, height);
    };

    var _Scene_Title_update = Scene_Title.prototype.update;
    Scene_Title.prototype.update = function() {
        _Scene_Title_update.call(this);

        this.scrollBackImages.update();
        this.particleImage.update();
    };

////==============================
//// NTMO.TTTT.Scrolling
////  This class is for scrolling title scene images.
//==============================
    NTMO.TTTT.ScrollBackImages = function(parent) {
        this.initialize.apply(this, arguments);
    };

    NTMO.TTTT.ScrollBackImages.prototype.initialize = function(parent, mainFileName, subFileName) {
        //Initialize
        this._parent         = parent;//parent scene.
        this._backMainSprite = null;
        this._backSubSprite  = null;
        this._mainSpeedX     = 0;
        this._mainSpeedY     = 0;
        this._subSpeedX      = 0;
        this._subSpeedY      = 0;
        this._mainFileName   = mainFileName;
        this._subFileName    = subFileName;

        //Create.
        this.createSprites();
        this.moveMainSprite(0, 0, Graphics.width, Graphics.height);
        this.moveSubSprite(0, 0, Graphics.width, Graphics.height);
    };

    NTMO.TTTT.ScrollBackImages.prototype.createSprites = function() {
        //Create.
        this._backMainSprite = new TilingSprite(ImageManager.loadTitle1(this.getMainFileName()));
        this._backSubSprite  = new TilingSprite(ImageManager.loadTitle2(this.getSubFileName()));
        //AddChild.
        this._parent.addChild(this._backMainSprite);
        this._parent.addChild(this._backSubSprite);
    };

    NTMO.TTTT.ScrollBackImages.prototype.moveMainSprite = function(x, y, width, height) {
        this._backMainSprite.move(x, y, width, height);
    };

    NTMO.TTTT.ScrollBackImages.prototype.moveSubSprite = function(x, y, width, height) {
        this._backSubSprite.move(x, y, width, height);
    };

    NTMO.TTTT.ScrollBackImages.prototype.setMainSpeed = function(speedX, speedY) {
        this._mainSpeedX = (isFinite(speedX)) ? speedX : 0;
        this._mainSpeedY = (isFinite(speedY)) ? speedY : 0;
    };

    NTMO.TTTT.ScrollBackImages.prototype.setSubSpeed = function(speedX, speedY) {
        this._subSpeedX = (isFinite(speedX)) ? speedX : 0;
        this._subSpeedY = (isFinite(speedY)) ? speedY : 0;
    };

    NTMO.TTTT.ScrollBackImages.prototype.getMainFileName = function() {
        if(this._mainFileName){
            return this._mainFileName;
        }
        return null;
    };

    NTMO.TTTT.ScrollBackImages.prototype.getSubFileName = function() {
        if(this._subFileName){
            return this._subFileName;
        }
        return null;
    };

    NTMO.TTTT.ScrollBackImages.prototype.update = function() {
        this.updateOriginPosition();
    };

    NTMO.TTTT.ScrollBackImages.prototype.updateOriginPosition = function() {
        //Main.
        this._backMainSprite.origin.x += this._mainSpeedX;
        this._backMainSprite.origin.y += this._mainSpeedY;
        //Sub.
        this._backSubSprite.origin.x  += this._subSpeedX;
        this._backSubSprite.origin.y  += this._subSpeedY;
    };

////==============================
//// NTMO.TTTT.ParticleImage
////  This class implements particle image for title scene.
//==============================
    NTMO.TTTT.ParticleImage = function(parent, fileName, opacity, blendMode, isFlashing) {
        this.initialize.apply(this, arguments);
    };

    NTMO.TTTT.ParticleImage.prototype.initialize = function(parent, fileName, opacity, blendMode, isFlashing) {
        //Initialize basic settings.
        this._parent         = parent;//parent scene.
        this._particleSprite = null;
        this._speedX         = 0;
        this._speedY         = 0;
        this._fileName       = fileName;

        //Flashing settings.
        this._opacity        = Number(opacity);
        this._blendMode      = Number(blendMode);//0:Normal 1:Addition 2:Multiplication 3:Screen
        this.CENTER_OPACITY  = 255/2;
        this._amp            = this._opacity / 2;//Wave amplitude
        this._phase          = 0;//Wave phase
        this._isFlashing     = isFlashing;

        //Create.
        this.createSprite();
        this.moveSprite(0, 0, Graphics.width, Graphics.height);
    };

    NTMO.TTTT.ParticleImage.prototype.createSprite = function() {
        //Create and set.
        this._particleSprite           = new TilingSprite(ImageManager.loadPicture(this.getFileName()));
        this._particleSprite.blendMode = this._blendMode;
        this._particleSprite.opacity   = this._opacity;
        //AddChild.
        this._parent.addChild(this._particleSprite);
    };

    NTMO.TTTT.ParticleImage.prototype.moveSprite = function(x, y, width, height) {
        this._particleSprite.move(x, y, width, height);
    };

    NTMO.TTTT.ParticleImage.prototype.setSpeed = function(speedX, speedY) {
        this._speedX = (isFinite(speedX)) ? speedX : 0;
        this._speedY = (isFinite(speedY)) ? speedY : 0;
    };

    NTMO.TTTT.ParticleImage.prototype.getFileName = function() {
        if(this._fileName){
            return this._fileName;
        }
        return null;
    };

    NTMO.TTTT.ParticleImage.prototype.isFlashing = function() {
        return this._isFlashing;
    };

    NTMO.TTTT.ParticleImage.prototype.update = function() {
        this.updateOriginPosition();
        this.updateOpacity();
    };

    NTMO.TTTT.ParticleImage.prototype.updateOriginPosition = function() {
        this._particleSprite.origin.x += this._speedX;
        this._particleSprite.origin.y += this._speedY;
    };

    NTMO.TTTT.ParticleImage.prototype.updateOpacity = function() {
        if(this.isFlashing()){
            //Get new opacity.
            var d         = Math.sin(this._phase * Math.PI / 180);
            this._opacity = d * this._amp + this.CENTER_OPACITY;
            this._phase++;
            //Set new opacity.
            this._particleSprite.opacity = this._opacity;
        }
    };

})();