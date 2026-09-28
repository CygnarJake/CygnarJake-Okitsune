//=============================================================================
// T_dashMotion.js
//=============================================================================
//Copyright (c) 2016 Trb
// This software is released under the MIT License.
// http://opensource.org/licenses/mit-license.php
//
//twitter https://twitter.com/Trb_surasura
/*:
 * @plugindesc 簡易的なダッシュモーションを実装します
 * @author Trb
 * @version 1.00 2016/6/3 初版
 * 
 * @help キャラクターが走っている時、画像を少し傾け上下させることで
 * 簡易的にダッシュモーションのようにします。
 * 上下の動きや傾きの角度を調整したい場合はプラグイン内を直接編集して下さい。
 */
(() => {
   "use strict";
   //=============================================================================
   // Game_Event
   //=============================================================================
   Game_Event.prototype.eventAreaCoordinates = function(x, y, d, withDirection) {
      const area = this.getEventTriggerArea();
      const arrayPos = new Array(area.width * area.height).fill(null);
      const x2 = withDirection ? $gameMap.roundXWithDirection(x, d) : x;
      const y2 = withDirection ? $gameMap.roundYWithDirection(y, d) : y;
      return arrayPos.map((_, i) => {
         return {x: x2 + (i % area.width), y: y2 + Math.floor(i / area.height)};
      });
   };

   const _Game_Event_canPass = Game_Event.prototype.canPass;
   Game_Event.prototype.canPass = function(x, y, d) {
      const result = _Game_Event_canPass.call(this, x, y, d);
      const isAnyCharactersCollided = this.eventAreaCoordinates(x, y, d, true)
         .some(pos => this.isCollidedWithCharacters(pos.x, pos.y));
      const isMapPassable = this.eventAreaCoordinates(x, y, d, false)
         .every(pos => this.isMapPassable(pos.x, pos.y, d));
      return result && isMapPassable && !isAnyCharactersCollided;
   };

   Game_Event.prototype.isCollidedWithEvents = function(x, y) {
      const events = $gameMap.eventsXyNt(x, y).filter(event => event !== this);
      return events.length > 0;
   };
})();