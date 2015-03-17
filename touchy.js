
/*
touchy.js, version 1.0

Normalise mouse/touch events.

(c) 2015 Copyright Stardotstar.
project located at https://github.com/stardotstar/Touchy.js.
Licenced under the Apache license (see LICENSE file)

Events have the following custom data:
* touchy: the touchy instance that is responding to the event.
* event: the original javascript event triggered.
* pointer: the mouse/touch/pointer object responsible for the event.
 */

(function() {
  (function(window) {
    var TouchyDefinition, extend, noop;
    extend = function(object, properties) {
      var key, val;
      for (key in properties) {
        val = properties[key];
        object[key] = val;
      }
      return object;
    };
    noop = function() {};
    TouchyDefinition = function($, EventEmitter, eventie, TweenMax) {
      var Touchy, chrome_desktop, disableImageDrag, document, dummyDragStart, is_ie8, user_agent;
      document = window.document;
      user_agent = navigator.userAgent.toLowerCase();
      chrome_desktop = user_agent.indexOf('chrome') > -1 && ((user_agent.indexOf('windows') > -1) || (user_agent.indexOf('macintosh') > -1) || (user_agent.indexOf('linux') > -1)) && user_agent.indexOf('mobile') < 0 && user_agent.indexOf('android') < 0;
      is_ie8 = 'attachEvent' in document.documentElement;
      dummyDragStart = function() {
        return false;
      };
      disableImageDrag = is_ie8 ? $.noop() : function(handle) {
        var handle_elm, imgs, _i, _len, _ref, _results;
        handle_elm = handle;
        if (handle_elm.nodeName === 'IMG') {
          handle_elm.ondragstart = dummyDragStart;
        }
        _ref = $(handle).find('img');
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          imgs = _ref[_i];
          _results.push(im.ondragstart = dummyDragStart);
        }
        return _results;
      };
      Touchy = (function() {
        var ontouchcancel, post_start_events, _default_options;

        function Touchy(elm, options) {
          this.elm = $(elm).first();
          this.elm.data('touchy', this);
          this.enabled = true;
          this.touching = false;
          this.holding = false;
          this.dragging = false;
          this.options = $.extend({}, _default_options, options);
          this._setPosition();
          this.start_position = $.extend({}, this.position);
          this.start_point = {
            x: 0,
            y: 0
          };
          this.current_point = {
            x: 0,
            y: 0
          };
          this.start_time = null;
          this._setupHandles();
          this.enable();
        }

        _default_options = {
          drag: false,
          drag_axis: null,
          handle: '',
          hold_interval: 500,
          tap_threshold: 4,
          double_tap_interval: 500,
          drag_threshold: 5
        };

        extend(Touchy.prototype, EventEmitter.prototype);

        Touchy.prototype._setPosition = function() {
          var pos;
          pos = this.elm.position();
          return this.position = {
            x: pos.left,
            y: pos.top
          };
        };

        Touchy.prototype._setupHandles = function() {
          this.handles = this.options.handle ? $(this.handle) : this.elm;
          return this._bindHandles(true);
        };

        Touchy.prototype._bindHandles = function(bind) {
          var binder, handle, _i, _len, _ref, _results;
          if (bind == null) {
            bind = true;
          }
          if (window.navigator.msPointerEnabled) {
            binder = this._bindMSPointerEvents;
          } else if (window.navigator.pointerEnabled) {
            binder = this._bindPointerEvents;
          } else {
            binder = this._bindTouchMouse;
          }
          _ref = this.handles;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            handle = _ref[_i];
            _results.push(binder.call(this, handle, bind));
          }
          return _results;
        };

        Touchy.prototype._bindMSPointerEvents = function(handle, bind) {
          var bind_method;
          bind_method = bind ? 'bind' : 'unbind';
          eventie[bind_method](handle, 'pointerdown', this);
          return handle.style.touchAction = bind ? 'none' : '';
        };

        Touchy.prototype._bindPointerEvents = function(handle, bind) {
          var bind_method;
          bind_method = bind ? 'bind' : 'unbind';
          eventie[bind_method](handle, 'MSPointerDown', this);
          return handle.style.touchAction = bind ? 'none' : '';
        };

        Touchy.prototype._bindTouchMouse = function(handle, bind) {
          var bind_method;
          bind_method = bind ? 'bind' : 'unbind';
          eventie[bind_method](handle, 'mousedown', this);
          eventie[bind_method](handle, 'touchstart', this);
          if (bind) {
            return disableImageDrag(handle);
          }
        };

        Touchy.prototype.handleEvent = function(event) {
          var method;
          method = "on" + event.type;
          if (this[method]) {
            return this[method](event);
          }
        };

        Touchy.prototype.onmousedown = function(event) {
          var button;
          button = event.button;
          if (button && (button !== 0 && button !== 1)) {
            return;
          }
          this.startTouchy(event, event);
          return false;
        };

        Touchy.prototype.ontouchstart = function(event) {
          if (this.touching) {
            return;
          }
          this.startTouchy(event, event.changedTouches[0]);
          return false;
        };

        Touchy.prototype.onpointerdown = function(event) {
          if (this.touching) {
            return;
          }
          this.startTouchy(event, event);
          return false;
        };

        Touchy.prototype.onMSPointerDown = Touchy.onpointerdown;

        post_start_events = {
          mousedown: ['mousemove', 'mouseup'],
          touchstart: ['touchmove', 'touchend', 'touchcancel'],
          pointerdown: ['pointermove', 'pointerup', 'pointercancel'],
          MSPointerDown: ['MSPointerMove', 'MSPointerUp', 'MSPointerCancel']
        };

        Touchy.prototype.startTouchy = function(event, pointer) {
          if (!this.enabled) {
            return;
          }
          if (this.options.drag) {
            if (event.preventDefault) {
              event.preventDefault();
            } else {
              event.returnValue = false;
            }
          }
          this.pointerId = pointer.pointerId !== void 0 ? pointer.pointerId : pointer.identifier;
          this._setPosition();
          this._setPointerPoint(this.start_point, pointer);
          this._setPointerPoint(this.current_point, pointer);
          this.start_position.x = this.position.x;
          this.start_position.y = this.position.y;
          this._cancelled_tap = false;
          this.start_time = new Date;
          this._bindPostEvents({
            events: post_start_events[event.type],
            node: event.preventDefault ? window : document
          });
          this.elm.addClass('touching');
          this.touching = true;
          this._hold_timer = setTimeout((function(_this) {
            return function() {
              return _this.holdTouchy(event, pointer);
            };
          })(this), this.options.hold_interval);
          this.emitEvent('start', [this, event, pointer]);
          return false;
        };

        Touchy.prototype._setPointerPoint = function(point, pointer) {
          point.x = pointer.pageX !== void 0 ? pointer.pageX : pointer.clientX;
          return point.y = pointer.pageY !== void 0 ? pointer.pageY : pointer.clientY;
        };

        Touchy.prototype._bindPostEvents = function(args) {
          var event, _i, _len, _ref;
          _ref = args.events;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            event = _ref[_i];
            eventie.bind(args.node, event, this);
          }
          return this._currentEventArgs = args;
        };

        Touchy.prototype._unbindPostEvents = function() {
          var args, event, _i, _len, _ref;
          args = this._currentEventArgs;
          if (!args || !args.events) {
            return;
          }
          _ref = args.events;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            event = _ref[_i];
            eventie.unbind(args.node, event, this);
          }
          return delete this._currentEventArgs;
        };

        Touchy.prototype.onmousemove = function(event) {
          this.moveTouchy(event, event);
          return false;
        };

        Touchy.prototype.onpointermove = function(event) {
          if (event.pointerId === this.pointerId) {
            this.moveTouchy(event, event);
          }
          return false;
        };

        Touchy.prototype.onMSPointerMove = Touchy.onpointermove;

        Touchy.prototype.ontouchmove = function(event) {
          var touch;
          touch = this._getCurrentTouch(event.changedTouches);
          if (touch) {
            this.moveTouchy(event, touch);
          }
          return false;
        };

        Touchy.prototype.moveTouchy = function(event, pointer) {
          var dx, dy;
          this._setPointerPoint(this.current_point, pointer);
          this.distance = {
            x: this.current_point.x - this.start_point.x,
            y: this.current_point.y - this.start_point.y
          };
          if (this.options.axis === 'y') {
            this.distance.x = 0;
          }
          if (this.options.axis === 'x') {
            this.distance.y = 0;
          }
          this.position.x = this.start_position.x + this.distance.x;
          this.position.y = this.start_position.y + this.distance.y;
          if (Math.abs(this.distance.x) > this.options.tap_threshold || Math.abs(this.distance.y) > this.options.tap_threshold) {
            this._cancelTap();
            this._cancelHold();
          }
          this.emitEvent('move', [this, event, pointer]);
          if (this.options.drag) {
            dx = Math.abs(this.distance.x) > this.options.drag_threshold ? this.distance.x : 0;
            dy = Math.abs(this.distance.y) > this.options.drag_threshold ? this.distance.y : 0;
            this.drag_start = {
              x: this.elm.transform('x'),
              y: this.elm.transform('y')
            };
            if (!dx || !dy) {
              if (!this.dragging) {
                this.dragTouchy(event, pointer);
              }
            }
          }
          if (this.dragging) {
            if (!this.options.axis || this.options.axis === 'x') {
              this.elm.transform('x', this.drag_start.x + this.distance.x);
            }
            if (!this.options.axis || this.options.axis === 'y') {
              this.elm.transform('y', this.drag_start.x + this.distance.y);
            }
          }
          return false;
        };

        Touchy.prototype.onmouseup = function(event) {
          return this.endTouchy(event, event);
        };

        Touchy.prototype.onpointerup = function(event) {
          if (event.pointerId === this.pointerId) {
            return this.endTouchy(event, event);
          }
        };

        Touchy.prototype.onMSPointerUp = Touchy.onpointerup;

        Touchy.prototype.ontouchend = function(event) {
          var touch;
          touch = this._getCurrentTouch(event.changedTouches);
          if (touch) {
            return this.endTouchy(event, touch);
          }
        };

        Touchy.prototype.endTouchy = function(event, pointer) {
          this.touching = false;
          delete this.pointerId;
          this._unbindPostEvents();
          this.elm.removeClass('touching');
          this._setPointerPoint(this.current_point, pointer);
          this.distance = {
            x: this.current_point.x - this.start_point.x,
            y: this.current_point.y - this.start_point.y
          };
          this.end_time = new Date();
          this._cancelHold();
          this._cancelDrag();
          this.emitEvent('end', [this, event, pointer]);
          if (!this._cancelled_tap && Math.abs(this.distance.x) <= this.options.tap_threshold && Math.abs(this.distance.y) <= this.options.tap_threshold) {
            this.emitEvent('tap', [this, event, pointer]);
          }
          return false;
        };

        Touchy.prototype.holdTouchy = function(event, pointer) {
          this.holding = true;
          return this.emitEvent('hold', [this, event, pointer]);
        };

        Touchy.prototype.dragTouchy = function(event, pointer) {
          this.dragging = true;
          return this.emitEvent('drag', [this, event, pointer]);
        };

        Touchy.prototype.onpointercancel = function(event) {
          if (event.pointerId === this.pointerId) {
            return this.endTouchy(event, event);
          }
        };

        Touchy.prototype.onMSPointerCancel = Touchy.onpointercancel;

        ontouchcancel = function(event) {
          var touch;
          touch = this._getCurrentTouch(event.changedTouches);
          return this.endTouchy(event, touch);
        };

        Touchy.prototype._cancelTap = function() {
          clearTimeout(this._tap_timer);
          this._tap_timer = null;
          return this._cancelled_tap = true;
        };

        Touchy.prototype._cancelHold = function() {
          clearTimeout(this._hold_timer);
          this._hold_timer = null;
          this.holding = false;
          return this.elm.removeClass('holding');
        };

        Touchy.prototype._cancelDrag = function() {
          this.dragging = false;
          return this.elm.removeClass('dragging');
        };

        Touchy.prototype._getCurrentTouch = function(touches) {
          var touch, _i, _len;
          for (_i = 0, _len = touches.length; _i < _len; _i++) {
            touch = touches[_i];
            if (touch.identifier === this.pointerId) {
              return touch;
            }
          }
          return null;
        };

        Touchy.prototype.enable = function() {
          return this.enabled = true;
        };

        Touchy.prototype.disable = function() {
          this.enabled = false;
          if (this.touching) {
            return this.endTouchy();
          }
        };

        Touchy.prototype.destroy = function() {
          this.disable();
          return this._bindHandles(false);
        };

        return Touchy;

      })();
      return Touchy;
    };
    if (typeof define === 'function' && define.amd) {
      return define(['jquery/jquery', 'eventEmitter/EventEmitter', 'eventie/eventie', 'gsap/gsap', 'jquery-transform/jquery-transform'], TouchyDefinition);
    } else if (typeof exports === 'object') {
      return module.exports = TouchyDefinition(require('jquery'), require('wolfy87-eventemitter'), require('eventie'), require('gsap'), require('jquery-transform'));
    } else {
      return window.Touchy = TouchyDefinition(window.jQuery, window.EventEmitter, window.eventie, window.TweenMax);
    }
  })(window);

}).call(this);
