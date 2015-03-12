
/*
touchy_slider.js, version 1.0

Slide control for Touchy.

(c) 2015 Copyright Stardotstar.
project located at https://github.com/stardotstar/TouchySlider.js.
Licenced under the Apache license (see LICENSE file)
 */

(function() {
  (function(window) {
    var TouchySliderDefinition, extend, noop;
    extend = function(object, properties) {
      var key, val;
      for (key in properties) {
        val = properties[key];
        object[key] = val;
      }
      return object;
    };
    noop = function() {};
    TouchySliderDefinition = function($, EventEmitter, TweenMax) {
      var TouchySlider;
      TouchySlider = (function() {
        var _default_options;

        function TouchySlider(elm, options) {
          this.elm = $(elm);
          this.options = $.extend({}, _default_options, options);
          this._setupTouchyInstance();
          this._setValue(this.options.initial_value);
          this._resize();
        }

        _default_options = {
          vertical: false,
          min_value: 0,
          max_value: 100,
          initial_value: 0,
          handle: ''
        };

        TouchySlider.prototype._setupTouchyInstance = function() {
          this._touchy = new Touchy(this.elm);
          this._touchy.on('start', (function(_this) {
            return function(t, event, pointer) {
              return _this._onStart();
            };
          })(this));
          this._touchy.on('move', (function(_this) {
            return function(t, event, pointer) {
              return _this._onMove();
            };
          })(this));
          return this._touchy.on('end', (function(_this) {
            return function(t, event, pointer) {
              return _this._onEnd();
            };
          })(this));
        };

        TouchySlider.prototype.value = function(val) {
          if (val != null) {
            this._value = val;
            this._value_pct = this._valueToPercent(val);
            return this;
          } else {
            return this._value;
          }
        };

        TouchySlider.prototype.valuePercent = function(val) {
          if (val != null) {
            this._value_pct = val;
            this._value = this._percentToValue(val);
            return this;
          } else {
            return this._value_pct;
          }
        };

        TouchySlider.prototype._onStart = function(t, event, pointer) {
          return this._update();
        };

        TouchySlider.prototype._onMove = function() {
          return this._update();
        };

        TouchySlider.prototype._onEnd = function() {
          return this._update();
        };

        TouchySlider.prototype._update = function() {
          var handle_pos, pct, pos;
          if (this.options.vertical) {
            pos = this._touchy.current_point.y;
          } else {
            pos = this._touchy.current_point.x;
          }
          pct = Math.round(((pos - this._offset) / this._length) * 100);
          this.valuePercent(pct);
          if (this.handle) {
            handle_pos = pos - this._offset - (this._handleLength / 2);
            if (this.options.vertical) {
              this.handle.css('top', handle_pos);
            } else {
              this.handle.css('left', handle_pos);
            }
          }
          return this.emitEvent('update', [this, event, this._value]);
        };

        TouchySlider.prototype._valueToPercent = function(val) {
          return ((val - this.options.min_value) / (this.options.max_value - this.options.min_value)) * 100;
        };

        TouchySlider.prototype._percentToValue = function(pct) {
          return ((percent / 100) * (this.options.max_value - this.options.min_value)) + min;
        };

        TouchySlider.prototype._setupResize = function() {
          return $(window).on('resize', (function(_this) {
            return function() {
              return _this._resize();
            };
          })(this));
        };

        TouchySlider.prototype._resize = function() {
          if (this.options.vertical) {
            this._length = elm.height();
            this._offset = elm.offset().top;
            if (this.handle) {
              return this._handleLength = this.handle.height();
            }
          } else {
            this._length = elm.width();
            this._offset = elm.offset().left;
            if (this.handle) {
              return this._handleLength = this.handle.width();
            }
          }
        };

        extend(TouchySlider.prototype, EventEmitter.prototype);

        return TouchySlider;

      })();
      return TouchySlider;
    };
    if (typeof define === 'function' && define.amd) {
      return define(['jquery/jquery', 'eventEmitter/EventEmitter', 'gsap/gsap', 'jquery-transform/jquery-transform'], TouchyDefinition);
    } else if (typeof exports === 'object') {
      return module.exports = TouchyDefinition(require('jquery'), require('wolfy87-eventemitter'), require('gsap'), require('jquery-transform'));
    } else {
      return window.TouchySlider = TouchyDefinition(window.jQuery, window.EventEmitter, window.TweenMax);
    }
  })(window);

}).call(this);
