
/*
touchy_panner.js, version 1.0

pan events for Touchy.

(c) 2015 Copyright Stardotstar.
project located at https://github.com/stardotstar/Touchy.js.
Licenced under the Apache license (see LICENSE file)
 */

(function() {
  (function(window) {
    var TouchyPannerDefinition, extend, noop;
    extend = function(object, properties) {
      var key, val;
      for (key in properties) {
        val = properties[key];
        object[key] = val;
      }
      return object;
    };
    noop = function() {};
    TouchyPannerDefinition = function($, EventEmitter, TweenMax) {
      var TouchyPanner;
      TouchyPanner = (function() {
        var _default_options;

        function TouchyPanner(elm, options) {
          this.elm = $(elm).first();
          this.options = $.extend({}, _default_options, options);
          console.log('Initialized TouchyPanner on', this.elm, this.options);
          this._createPanner();
          this._setupTouchyInstance();
          this._configureOptions();
          this.value(this.options.initial_index);
          this._updateHandlePosition();
          this.emitEvent('init', [this, this._value]);
          this.elm.css('opacity', 1);
        }

        _default_options = {
          vertical: false,
          initial_index: 0,
          container_elm: '.options',
          option_elm: '.option',
          velocityXThreshold: 1,
          deltaXThresholdPercent: .3
        };

        TouchyPanner.prototype._setupTouchyInstance = function() {
          this._touchy = new Touchy(this.elm, {
            cancel_on_scroll: false
          });
          this._touchy.on('start', (function(_this) {
            return function(event, t, pointer) {
              return _this.emitEvent('panstart', [event, _this, _this._value]);
            };
          })(this));
          this._touchy.on('move', (function(_this) {
            return function(event, t, pointer) {
              return _this.emitEvent('panmove', [event, _this, _this._value]);
            };
          })(this));
          return this._touchy.on('end', (function(_this) {
            return function(event, t, pointer) {
              return _this.emitEvent('panend', [event, _this, _this._value]);
            };
          })(this));
        };

        TouchyPanner.prototype._createPanner = function() {
          this.elm.addClass('panner');
          this.elm.addClass(this.options.vertical ? 'panner_v' : 'panner_h');
          return this.elm.css({
            position: 'relative'
          });
        };

        TouchyPanner.prototype._configureOptions = function() {
          if (this.options.values && this.options.values.length) {
            this.options.min_value = 0;
            return this.options.max_value = this.options.values.length - 1;
          }
        };

        TouchyPanner.prototype._setHandleClass = function(add) {
          if (add == null) {
            add = false;
          }
          if (event.target === this.handle.get(0)) {
            if (add) {
              return this.handle.addClass('touching');
            } else {
              return this.handle.removeClass('touching');
            }
          }
        };

        TouchyPanner.prototype.value = function(val) {
          if (val != null) {
            this._value = val;
            this._value_pct = this._valueToPercent(val);
            return this;
          } else {
            return this._value;
          }
        };

        TouchyPanner.prototype.valuePercent = function(val) {
          if (val != null) {
            this._value_pct = val;
            this._value = this._percentToValue(val);
            return this;
          } else {
            return this._value_pct;
          }
        };

        TouchyPanner.prototype._update = function() {
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
            this._updateBubble();
            return this.emitEvent('update', [this, event, this._value]);
          }
        };

        TouchyPanner.prototype._updateHandlePosition = function() {
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

        TouchyPanner.prototype._updateBubble = function() {
          var bubble_pos, bubble_text;
          if (this.options.show_bubble && this.bubble_elm) {
            bubble_text = this.options.values && this.options.values.length ? this.options.values[this._value] : this._value;
            this.bubble_elm.text('' + this.options.bubble_prefix + bubble_text + this.options.bubble_suffix);
            bubble_pos = (this._value_pct / 100) * this._length;
            bubble_pos -= this.bubble_elm.outerWidth() / 2;
            if (this.options.vertical) {
              return this.bubble_elm.css('top', bubble_pos);
            } else {
              return this.bubble_elm.css('left', bubble_pos);
            }
          }
        };

        TouchyPanner.prototype._valueToPercent = function(val) {
          return ((val - this.options.min_value) / (this.options.max_value - this.options.min_value)) * 100;
        };

        TouchyPanner.prototype._percentToValue = function(pct) {
          return ((pct / 100) * (this.options.max_value - this.options.min_value)) + this.options.min_value;
        };

        TouchyPanner.prototype._trimAlignValue = function(val) {
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

        TouchyPanner.prototype._setupResize = function() {
          $(window).on('resize', (function(_this) {
            return function() {
              return _this._resize();
            };
          })(this));
          return this._resize();
        };

        TouchyPanner.prototype._resize = function() {
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

        extend(TouchyPanner.prototype, EventEmitter.prototype);

        return TouchyPanner;

      })();
      return TouchyPanner;
    };
    if (typeof define === 'function' && define.amd) {
      return define(['jquery/jquery', 'eventEmitter/EventEmitter', 'gsap/gsap', 'jquery-transform/jquery-transform'], TouchyPannerDefinition);
    } else if (typeof exports === 'object') {
      return module.exports = TouchyPannerDefinition(require('jquery'), require('wolfy87-eventemitter'), require('gsap'), require('jquery-transform'));
    } else {
      return window.TouchyPanner = TouchyPannerDefinition(window.jQuery, window.EventEmitter, window.TweenMax);
    }
  })(window);

}).call(this);
