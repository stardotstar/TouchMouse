
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
          this.elm = $(elm).first();
          this.options = $.extend({}, _default_options, options);
          if (this.options.handle) {
            this.handle = $(this.options.handle).first();
          }
          console.log('Initialized TouchySlider on', this.elm, this.options);
          this._setupResize();
          this._setupTouchyInstance();
          this.value(this.options.initial_value);
          this._updateHandlePosition();
          this.elm.css('opacity', 1);
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
            return function(event, t, pointer) {
              _this._update();
              if (event.target === _this.handle.get(0)) {
                _this.handle.addClass('touching');
              }
              return _this.emitEvent('start', [event, _this, _this._value]);
            };
          })(this));
          this._touchy.on('move', (function(_this) {
            return function(event, t, pointer) {
              _this._update();
              if (event.target === _this.handle.get(0)) {
                return _this.handle.addClass('touching');
              }
            };
          })(this));
          return this._touchy.on('end', (function(_this) {
            return function(event, t, pointer) {
              _this._update();
              if (event.target === _this.handle.get(0)) {
                _this.handle.removeClass('touching');
              }
              return _this.emitEvent('end', [event, _this, _this._value]);
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

        TouchySlider.prototype._update = function() {
          var pct, pos, val;
          if (this.options.vertical) {
            pos = this._touchy.current_point.y;
          } else {
            pos = this._touchy.current_point.x;
          }
          pct = Math.round(((pos - this._offset) / this._length) * 100);
          if (pct < 0) {
            pct = 0;
          }
          if (pct > 100) {
            pct = 100;
          }
          val = this._percentToValue(pct);
          val = this._trimAlignValue(val);
          if (val !== this._value) {
            this.value(val);
            this._updateHandlePosition();
            return this.emitEvent('update', [this, event, this._value]);
          }
        };

        TouchySlider.prototype._updateHandlePosition = function() {
          var handle_pos;
          if (this.handle) {
            handle_pos = (this._value_pct / 100) * this._length;
            handle_pos -= this._handleLength / 2;
            if (this.options.vertical) {
              return this.handle.css('top', handle_pos);
            } else {
              return this.handle.css('left', handle_pos);
            }
          }
        };

        TouchySlider.prototype._valueToPercent = function(val) {
          return ((val - this.options.min_value) / (this.options.max_value - this.options.min_value)) * 100;
        };

        TouchySlider.prototype._percentToValue = function(pct) {
          return ((pct / 100) * (this.options.max_value - this.options.min_value)) + this.options.min_value;
        };

        TouchySlider.prototype._trimAlignValue = function(val) {
          var alignValue, step, valModStep;
          if (val <= this.options.min_value) {
            return this.options.min_value;
          }
          if (val >= this.options.max_value) {
            return this.options.max_value;
          }
          step = this.options.step > 0 ? this.options.step : 1;
          valModStep = (val - this.options.min_value) % step;
          alignValue = val - valModStep;
          if (Math.abs(valModStep) * 2 >= step) {
            alignValue += valModStep > 0 ? step : -step;
          }
          return parseFloat(alignValue.toFixed(5));
        };

        TouchySlider.prototype._setupResize = function() {
          $(window).on('resize', (function(_this) {
            return function() {
              return _this._resize();
            };
          })(this));
          return this._resize();
        };

        TouchySlider.prototype._resize = function() {
          if (this.options.vertical) {
            this._length = this.elm.height();
            this._offset = this.elm.offset().top;
            if (this.handle) {
              this._handleLength = this.handle.height();
            }
          } else {
            this._length = this.elm.width();
            this._offset = this.elm.offset().left;
            if (this.handle) {
              this._handleLength = this.handle.width();
            }
          }
          return this._updateHandlePosition();
        };

        extend(TouchySlider.prototype, EventEmitter.prototype);

        return TouchySlider;

      })();
      return TouchySlider;
    };
    if (typeof define === 'function' && define.amd) {
      return define(['jquery/jquery', 'eventEmitter/EventEmitter', 'gsap/gsap', 'jquery-transform/jquery-transform'], TouchySliderDefinition);
    } else if (typeof exports === 'object') {
      return module.exports = TouchySliderDefinition(require('jquery'), require('wolfy87-eventemitter'), require('gsap'), require('jquery-transform'));
    } else {
      return window.TouchySlider = TouchySliderDefinition(window.jQuery, window.EventEmitter, window.TweenMax);
    }
  })(window);

}).call(this);
