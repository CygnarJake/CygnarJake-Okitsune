// --------------------------------------------------------------------------
// 
// PNDK_ActiveWindowBackOpacity v1.0.1
// Copyright (c) 2016 PANDAKO
// This software is released under the MIT License.
// http://opensource.org/licenses/mit-license.php
// 
// --------------------------------------------------------------------------
/*:
 * @plugindesc 操作対象のウィンドウの背景の不透明度やカラーを変更できます。
 * @author パンダコ
 *
 * @help
 * このプラグインは、アクティブ（操作対象）となっているウィンドウ背景の
 * 不透明度やカラーを変更することができます。
 * これを使えばプレイヤーに今どこが操作できるのかを、より明確に伝えることが
 * できるようになるので、とてもユーザーフレンドリーなゲームになりますたぶん。
 * 
 * このプラグインにプラグインコマンドは無いのです。
 * 
 * 【注意点】
 * 不透明度だけの変更であれば問題ないのですが、ウィンドウカラーも変更する
 * 場合は以下の点にご注意ください。
 * 
 * 「システム」の「ウィンドウカラー」の設定と、本プラグインの
 * 「アクティブなウィンドウカラー（赤緑青）」が異なる値になっていると
 * ウィンドウの開閉時にちょいと負荷が増えます。
 * 
 * これは、そもそも「システム」の「ウィンドウカラー」で色を変更すると、
 * その分負荷が増えるのに、さらにそこからアクティブなウィンドウのカラーを
 * 変更する処理が追加されるためです。
 * 
 * 赤緑青すべてが 0 だと負荷は発生しません。
 * 
 * 負荷の軽い順の設定は以下のとおりです。
 * 
 * 【軽】不透明度だけ変更する（ウィンドウカラーは変更しない）
 * システムのウィンドウカラー　　：すべて0
 * アクティブなウィンドウカラー　：すべて0
 * ⇒負荷はほとんど増えません。
 * 
 * 【並】システムのウィンドウカラーを変更する
 * システムのウィンドウカラー　　：変更
 * アクティブなウィンドウカラー　：すべて0
 * ⇒ウィンドウの開閉時の負荷がちょっと増えます。
 * 
 * 【並】アクティブなウィンドウカラーを変更する
 * システムのウィンドウカラー　　：すべて0
 * アクティブなウィンドウカラー　：変更
 * ⇒ウィンドウの開閉時の負荷がちょっと増えます。
 * 
 * 【普】本プラグインなしでシステムのウィンドウカラーを変更する
 * システムのウィンドウカラー　　：変更
 * ⇒全てのウィンドウが変更対象になるため開閉時の負荷がやや増えます。
 * 
 * 【普】どちらも同じ値にする（すべて0でもない）
 * システムのウィンドウカラー　　：↓と同じ
 * アクティブなウィンドウカラー　：↑と同じ
 * ⇒全てのウィンドウが変更対象になるため開閉時の負荷がやや増えます。
 * 
 * 【重】両方を異なる値にする（すべて0でもない）
 * システムのウィンドウカラー　　：↓と異なる
 * アクティブなウィンドウカラー　：↑と異なる
 * ⇒全てのウィンドウが変更対象な上にアクティブの処理が追加されるため
 * 開閉時の負荷がまあまあ増えます。
 * 
 * 
 * なお、初期のウィンドウ背景は、画像（img/system/Window.png）の時点で
 * 多少透過されているため、それ以上は不透明化できないのでご注意ください。
 * 
 * ■更新履歴
 * Version:1.0.1［2016/11/30］
 * より厳密に操作対象となっているウィンドウのみ効果が発揮されるよう修正。
 * 
 * Version:1.0.0［2016/11/29］
 * 初版
 * 
 * ■ライセンス
 * Copyright (c) 2016 PANDAKO
 * This software is released under the MIT License.
 * http://opensource.org/licenses/mit-license.php
 * 
 * [Blog : http://note.pandako.com/]
 * 
 * ■免責事項
 * このプラグインの利用により利用者または第三者に生じたいかなる損害や
 * 不利益も、このプラグインの開発者はその責任を負いません。
 * 
 * 
 * @param StandardWindowBackOpacity
 * @desc 通常のウィンドウの不透明度
 * 透明 0 ～ 255 不透明（初期値：192）
 * @default 192
 * 
 * @param ActiveWindowBackOpacity
 * @desc アクティブなウィンドウの不透明度
 * 透明 0 ～ 255 不透明
 * @default 255
 * 
 * @param ActiveWindowBackColorR
 * @desc アクティブなウィンドウカラーの赤成分
 * -255 ～ 255（0で無変換）
 * @default 0
 * 
 * @param ActiveWindowBackColorG
 * @desc アクティブなウィンドウカラーの緑成分
 * -255 ～ 255（0で無変換）
 * @default 0
 * 
 * @param ActiveWindowBackColorB
 * @desc アクティブなウィンドウカラーの青成分
 * -255 ～ 255（0で無変換）
 * @default 0
 * 
 */
(function() {
	//プラグインマネージャーで設定されたパラメータを取得
	var parameters = PluginManager.parameters('PNDK_ActiveWindowBackOpacity');
	
	//パラメータを変数へ
	var StandardWindowBackOpacity = parseInt(parameters['StandardWindowBackOpacity'] || 192, 10);
	var ActiveWindowBackOpacity = parseInt(parameters['ActiveWindowBackOpacity'] || 255, 10);
	var ActiveWindowBackColorR = parseInt(parameters['ActiveWindowBackColorR'] || 0, 10).clamp(-255, 255);
	var ActiveWindowBackColorG = parseInt(parameters['ActiveWindowBackColorG'] || 0, 10).clamp(-255, 255);
	var ActiveWindowBackColorB = parseInt(parameters['ActiveWindowBackColorB'] || 0, 10).clamp(-255, 255);
	
	//通常のウィンドウの不透明度
	var _Window_Base_standardBackOpacity = Window_Base.prototype.standardBackOpacity;
	Window_Base.prototype.standardBackOpacity = function() {
		var v = _Window_Base_standardBackOpacity.call(this);
		//
		return StandardWindowBackOpacity;
	};
	
	//アクティブになる時
	var _Window_Base_activate = Window_Base.prototype.activate;
	Window_Base.prototype.activate = function() {
		_Window_Base_activate.call(this);
		//
		if (typeof this.index === "function") {
			this.backOpacity = ActiveWindowBackOpacity;
		}
	};
	
	//非活性時に普通に戻す
	var _Window_Base_deactivate = Window_Base.prototype.deactivate;
	Window_Base.prototype.deactivate = function() {
		_Window_Base_deactivate.call(this);
		//
		this.backOpacity = this.standardBackOpacity();
	};
	
	//ウィンドウカラーの変更
	var _Window_Base_updateTone = Window_Base.prototype.updateTone;
	Window_Base.prototype.updateTone = function() {
		//_Window_Base_updateTone.call(this);
		var tone = $gameSystem.windowTone();
		if (this.active && typeof this.index === "function") {
			tone = [ActiveWindowBackColorR, ActiveWindowBackColorG, ActiveWindowBackColorB];
		}
		this.setTone(tone[0], tone[1], tone[2]);
	};
	
})();
