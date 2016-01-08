
/*
touchy_scroller.js, version 1.0

scroll panels for Touchy.

(c) 2015 Copyright Stardotstar.
project located at https://github.com/stardotstar/Touchy.js.
Licenced under the Apache license (see LICENSE file)
 */

(function() {
  (function(window) {
    var TouchyScrollerDefinition, extend, noop;
    extend = function(object, properties) {
      var key, val;
      for (key in properties) {
        val = properties[key];
        object[key] = val;
      }
      return object;
    };
    noop = function() {};
    TouchyScrollerDefinition = function(Touchy, $, EventEmitter, TweenMax) {
      var TouchyScroller;
      TouchyScroller = (function() {
        var _default_options;

        function TouchyScroller(elm, options) {
          this.elm = $(elm).first();
          this.options = $.extend({}, _default_options, options);
          this._configurePanner();
          this._setupTouchyInstance();
          this.value(this.options.x, this.options.y);
          this._setupResize();
          this.emitEvent('init', [this]);
          this.elm.css('opacity', 1);
        }

        _default_options = {
          vertical: false,
          x: 0,
          y: 0,
          container_elm: '.options',
          option_elm: '.option',
          nav_elm: '.nav',
          indicator: false,
          indicator_elm: '.indicator',
          threshold: 20,
          velocityXThreshold: 1,
          deltaXThresholdPercent: .3
        };

        TouchyScroller.prototype._setupTouchyInstance = function() {
          this._touchy = new Touchy(this.elm);
          this._touchy.on('start', (function(_this) {
            return function(event, t, pointer) {
              return _this._onStart(event, pointer);
            };
          })(this));
          this._touchy.on('move', (function(_this) {
            return function(event, t, pointer) {
              return _this._onMove(event, pointer);
            };
          })(this));
          this._touchy.on('end', (function(_this) {
            return function(event, t, pointer) {
              return _this._onEnd(event, pointer);
            };
          })(this));
          return this._touchy.on('cancel', (function(_this) {
            return function(event, t, pointer) {
              return _this._onEnd(event, pointer);
            };
          })(this));
        };

        TouchyScroller.prototype._configureScroller = function() {
          this.elm.addClass('scroller');
          this.elm.addClass(this.options.vertical ? 'scroller_v' : 'scroller_h');
          this._options_elm = this.elm.find(this.options.container_elm);
          return this._options_elm.css({
            position: 'relative'
          });
        };

        TouchyScroller.prototype._configureNav = function() {
          this._nav_elm = this.elm.find(this.options.nav_elm);
          return true;
        };

        TouchyScroller.prototype._configureIndicator = function() {
          var i, _i, _ref;
          if (!this.options.indicator) {
            return;
          }
          this._indicator_elm = this.elm.find(this.options.indicator_elm);
          for (i = _i = 1, _ref = this._option_count; 1 <= _ref ? _i <= _ref : _i >= _ref; i = 1 <= _ref ? ++_i : --_i) {
            this._indicator_elm.append("<span class='icon'>");
          }
          return true;
        };

        TouchyScroller.prototype.value = function(xval, yval) {
          var x, y;
          if ((xval != null) || (yval != null)) {
            x = xval != null ? xval : this._current_x;
            y = yval != null ? yval : this._current_y;
            return this._scrollTo(x, y);
          } else {
            return {
              x: this._current_x,
              y: this._current_y
            };
          }
        };

        TouchyScroller.prototype._scrollTo = function(x, y, duration) {
          if (duration == null) {
            duration = .5;
          }
          if (!duration) {
            TweenLite.set(this.elm, {
              x: x,
              y: y
            });
          } else {
            TweenLite.to(this.elm, duration, {
              x: x,
              y: y,
              ease: Back.easeOut
            });
          }
          this._current_x = x;
          return this._current_y = y;
        };

        TouchyScroller.prototype._onStart = function(e, pointer) {};

        TouchyScroller.prototype._onMove = function(e, pointer) {
          var current_time, data_id, direction, distance, duration, duration_ms, duration_per_option, duration_per_pixel, time, time_change;
          direction = this._direction();
          distance = this._distance();
          if (direction && !direction.match(/^(left|right)$/)) {
            return true;
          }
          if (distance >= this.options.threshold && !this._started) {
            this._started = true;
            return this.emitEvent('panstart', [this]);
          } else if (this._started) {
            duration = this._tl.totalDuration();
            duration_ms = duration * 1000;
            duration_per_option = duration_ms / this._option_count;
            duration_per_pixel = duration_ms / (this._option_w * this._option_count);
            data_id = this._options.eq(this._current_option).data('id');
            current_time = this._tl.getLabelTime("option-" + data_id);
            time_change = Math.abs(distance * (duration_per_pixel / 2)) / 1000;
            if (direction === "right") {
              if (current_time - time_change < 0) {
                time_change = current_time;
              }
              time = "option-" + data_id + "-=" + time_change;
            } else if (direction === "left") {
              if (current_time + time_change > duration) {
                time_change = current_time;
              }
              time = "option-" + data_id + "+=" + time_change;
            }
            this._tl.seek(time);
            return this.emitEvent('panmove', [e, this]);
          }
        };

        TouchyScroller.prototype._onEnd = function(e, pointer) {
          var current_elm, direction, distance, next_ind;
          if ($(e.target).parent().is(this._nav_elm)) {
            this._onNavEnd(e, pointer);
            return;
          }
          if (!this._started) {
            return;
          }
          direction = this._direction();
          distance = this._distance();
          current_elm = this._options.eq(this._current_option);
          current_elm.removeClass('current');
          if (direction === "left") {
            next_ind = this._current_option + 1;
          } else if (direction === "right") {
            next_ind = this._current_option - 1;
          }
          this._panTo(next_ind);
          this._started = false;
          return this.emitEvent('panend', [e, this]);
        };

        TouchyScroller.prototype._onNavEnd = function(e, pointer) {
          var elm;
          e.preventDefault();
          elm = $(e.target);
          if (elm.hasClass('prev')) {
            return this._panTo(this._current_option - 1);
          } else if (elm.hasClass('next')) {
            return this._panTo(this._current_option + 1);
          }
        };

        TouchyScroller.prototype._direction = function() {
          if (this._touchy.distance.x > 0) {
            return 'right';
          } else if (this._touchy.distance.x < 0) {
            return 'left';
          } else {
            return '';
          }
        };

        TouchyScroller.prototype._distance = function() {
          return Math.abs(this._touchy.distance.x);
        };

        TouchyScroller.prototype._panTo = function(id) {
          var data_id, elm;
          if (!(id > -1 && id < this._option_count)) {
            id = this._current_option;
          }
          elm = this._options.eq(id);
          elm.addClass('current');
          data_id = elm.data('id');
          this._tl.tweenTo("option-" + data_id, {
            ease: Strong.easeOut,
            onComplete: (function(_this) {
              return function() {
                return _this.emitEvent('panchanged', [_this]);
              };
            })(this)
          });
          this._current_option = id;
          this._updateNavState();
          return this._updateIndicatorState();
        };

        TouchyScroller.prototype._updateNavState = function() {
          if (this._current_option === 0) {
            this.elm.addClass('first');
            return this.elm.removeClass('last');
          } else if (this._current_option === this._option_count - 1) {
            this.elm.addClass('last');
            return this.elm.removeClass('first');
          } else {
            return this.elm.removeClass('first last');
          }
        };

        TouchyScroller.prototype._updateIndicatorState = function() {
          if (this._indicator_elm && this._indicator_elm.length) {
            return this._indicator_elm.find('.icon').removeClass('active').eq(this._current_option).addClass('active');
          }
        };

        TouchyScroller.prototype._valueToPercent = function(val) {
          return ((val - this.options.min_value) / (this.options.max_value - this.options.min_value)) * 100;
        };

        TouchyScroller.prototype._percentToValue = function(pct) {
          return ((pct / 100) * (this.options.max_value - this.options.min_value)) + this.options.min_value;
        };

        TouchyScroller.prototype._trimAlignValue = function(val) {
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

        TouchyScroller.prototype._setupResize = function() {
          $(window).on('resize', (function(_this) {
            return function() {
              return _this._resize();
            };
          })(this));
          return this._resize();
        };

        TouchyScroller.prototype._resize = function() {
          if (this.options.vertical) {
            this._length = this.elm.height();
            this._offset = this.elm.offset().top;
          } else {
            this._length = this.elm.width();
            this._offset = this.elm.offset().left;
          }
          return this._setOptionHeight();
        };

        TouchyScroller.prototype._setOptionHeight = function() {
          var oh, option, _i, _len, _ref;
          if (this.elm.is(':visible')) {
            this._option_h = 0;
            _ref = this._options;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              option = _ref[_i];
              oh = $(option).outerHeight();
              if (oh > this._option_h) {
                this._option_h = oh;
              }
            }
            return this._options_elm.css({
              minHeight: this._option_h
            });
          }
        };

        extend(TouchyScroller.prototype, EventEmitter.prototype);

        return TouchyScroller;

      })();
      return TouchyScroller;
    };
    if (typeof define === 'function' && define.amd) {
      return define(['touchy', 'jquery', 'eventEmitter', 'gsap', 'jquery-transform'], TouchyScrollerDefinition);
    } else if (typeof exports === 'object') {
      return module.exports = TouchyScrollerDefinition(require('touchy'), require('jquery'), require('wolfy87-eventemitter'), require('gsap'), require('jquery-transform'));
    } else {
      return window.TouchyScroller = TouchyScrollerDefinition(window.Touchy, window.jQuery, window.EventEmitter, window.TweenMax);
    }
  })(window);

}).call(this);
