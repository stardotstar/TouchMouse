###
touchy.js, version 1.0

Normalise mouse/touch events.

(c) 2015 Copyright Stardotstar.
project located at https://github.com/stardotstar/Touchy.js.
Licenced under the Apache license (see LICENSE file)

Events have the following custom data:
* touchy: the touchy instance that is responding to the event.
* event: the original javascript event triggered.
* pointer: the mouse/touch/pointer object responsible for the event.
###

((window) ->

	# helper methods

	extend = (object, properties) ->
		for key, val of properties
			object[key] = val
		object

	noop = ->

	TouchyDefinition = ($, EventEmitter, eventie, TweenMax) ->

		document = window.document
		user_agent = navigator.userAgent.toLowerCase()

		chrome_desktop = (user_agent.indexOf('chrome') > -1 && ((user_agent.indexOf('windows') > -1) || (user_agent.indexOf('macintosh') > -1) || (user_agent.indexOf('linux') > -1)) && user_agent.indexOf('mobile') < 0 && user_agent.indexOf('android') < 0)
		is_ie8 = 'attachEvent' of document.documentElement

		dummyDragStart = -> false

		disableImageDrag = if is_ie8 then $.noop() else (handle) ->
			handle_elm = handle
			if handle_elm.nodeName == 'IMG'
				handle_elm.ondragstart = dummyDragStart

			for imgs in $(handle).find('img')
				im.ondragstart = dummyDragStart

		class Touchy
			constructor: (elm,options) ->
				@elm = $(elm).first()
				@elm.data('touchy',@)
				@enabled = true
				@touching = false
				@holding = false
				@dragging = false
				@options = $.extend {}, _default_options, options
				# console.log('Initialized Touchy on', @elm ,@options)

				@_setPosition()
				@start_position = $.extend {}, @position
				@start_point = x: 0, y: 0
				@current_point = x: 0, y: 0

				@start_time = null

				@_setupHandles()
				@_setupScrollHandler()

				@enable()

			_default_options =
				drag: false
				drag_axis: null
				cancel_on_scroll: true
				handle: ''
				hold_interval: 500
				tap_threshold: 4
				double_tap_interval: 500
				drag_threshold: 5

			extend Touchy.prototype, EventEmitter.prototype

			_setPosition: ->
				pos = @elm.position()
				@position = 
					x: pos.left
					y: pos.top

			_setupScrollHandler: ->
				eventie.bind(window, 'scroll', @)

			onscroll: (event) ->
				if @options.cancel_on_scroll and @touching
					console.log('Cancelled by Scroll')
					@cancelTouchy(event)

			_setupHandles: ->
				@handles = if @options.handle then $(@handle) else @elm
				@_bindHandles(true)

			_bindHandles: (bind = true) ->
				if window.navigator.msPointerEnabled
					binder = @_bindMSPointerEvents
				else if window.navigator.pointerEnabled
					binder = @_bindPointerEvents
				else
					binder = @_bindTouchMouse

				for handle in @handles
					binder.call(@, handle, bind)

			_bindMSPointerEvents: (handle, bind) ->
				# IE10
				bind_method = if bind then 'bind' else 'unbind';
				eventie[bind_method](handle, 'pointerdown', @)
				# disable scroll
				handle.style.touchAction = if bind then 'none' else ''

			_bindPointerEvents: (handle, bind) ->
				# IE11
				bind_method = if bind then 'bind' else 'unbind';
				eventie[bind_method](handle, 'MSPointerDown', @)
				# disable scroll
				handle.style.touchAction = if bind then 'none' else ''

			_bindTouchMouse: (handle,bind) ->
				bind_method = if bind then 'bind' else 'unbind'
				eventie[bind_method](handle, 'mousedown', @)
				eventie[bind_method](handle, 'touchstart', @)

				disableImageDrag(handle) if bind

			handleEvent: (event) ->
				method = "on#{event.type}"
				@[method](event) if @[method]

			# ===================
			# start / down events
			# ===================

			onmousedown: (event) ->
				# ignore right or middle clicks
				button = event.button
				return if button and (button != 0 and button != 1 )
				@startTouchy(event, event)
				false

			ontouchstart: (event) ->
				# ignore further touches
				return if @touching
				@startTouchy(event, event.changedTouches[0])
				false

			onpointerdown: (event) ->
				# ignore further touches
				return if @touching
				@startTouchy(event, event)
				false

			onMSPointerDown: Touchy.onpointerdown

			post_start_events =
				mousedown: ['mousemove','mouseup']
				touchstart: ['touchmove','touchend','touchcancel']
				pointerdown: ['pointermove','pointerup','pointercancel']
				MSPointerDown: ['MSPointerMove','MSPointerUp','MSPointerCancel']

			startTouchy: (event, pointer) ->
				return unless @enabled

				if @options.drag
					# if we want drag we need to stop default behaviour
					if event.preventDefault
						event.preventDefault()
					else
						event.returnValue = false

				@pointerId = if pointer.pointerId != undefined then pointer.pointerId else pointer.identifier
				@_setPosition()
				@_setPointerPoint(@start_point, pointer)
				@_setPointerPoint(@current_point, pointer)
				@start_position.x = @position.x
				@start_position.y = @position.y

				@_cancelled_tap = false
				@start_time = new Date

				@_bindPostEvents
					# get matching events
					events: post_start_events[event.type]
					# bind to document for ie
					node: if event.preventDefault then window else document

				@elm.addClass('touching')
				@touching = true

				# start hold timer
				@_hold_timer = setTimeout =>
					@holdTouchy(event, pointer)
				,@options.hold_interval

				@emitEvent('start', [ event, @, pointer ] )

				false

			_setPointerPoint: (point, pointer) ->
				point.x = if pointer.pageX != undefined then pointer.pageX else pointer.clientX
				point.y = if pointer.pageY != undefined then pointer.pageY else pointer.clientY

			_bindPostEvents: (args) ->
				for event in args.events
					# console.log('binding ' + event)
					eventie.bind(args.node, event, @)
				@_currentEventArgs = args

			_unbindPostEvents: ->
				args = @_currentEventArgs
				return if not args or not args.events

				for event in args.events
					eventie.unbind(args.node, event, @)

				delete @_currentEventArgs

			# ===========
			# move events
			# ===========

			onmousemove: (event) ->
				@moveTouchy(event, event)
				false
			
			onpointermove: (event) ->
				if event.pointerId == @pointerId
					@moveTouchy(event, event)
				false

			onMSPointerMove: @onpointermove

			ontouchmove: (event) ->
				touch = @_getCurrentTouch(event.changedTouches)
				if touch
					@moveTouchy(event, touch)
				false

			moveTouchy: (event, pointer) ->
				@_setPointerPoint(@current_point, pointer)
				@distance =
					x: @current_point.x - @start_point.x
					y: @current_point.y - @start_point.y

				@distance.x = 0 if @options.axis == 'y'
				@distance.y = 0 if @options.axis == 'x'

				@position.x = @start_position.x + @distance.x
				@position.y = @start_position.y + @distance.y
				
				if Math.abs(@distance.x) > @options.tap_threshold or Math.abs(@distance.y) > @options.tap_threshold
					@_cancelTap()
					@_cancelHold()

				@emitEvent('move', [ event, @, pointer ] )

				if @options.drag
					dx = if Math.abs(@distance.x) > @options.drag_threshold then @distance.x else 0
					dy = if Math.abs(@distance.y) > @options.drag_threshold then @distance.y else 0
					
					@drag_start = {
						x: @elm.transform('x')
						y: @elm.transform('y')
					}

					if not dx or not dy
						# we're dragging
						if not @dragging
							@dragTouchy(event, pointer)

				if @dragging
					if not @options.axis or @options.axis == 'x'
						@elm.transform('x',@drag_start.x + @distance.x)
					if not @options.axis or @options.axis == 'y'
						@elm.transform('y',@drag_start.x + @distance.y)

				false

			# ===============
			# up / end events
			# ===============

			onmouseup: (event) ->
				@endTouchy(event, event)

			onpointerup: (event) ->
				if event.pointerId == @pointerId
					@endTouchy(event, event)

			onMSPointerUp: @onpointerup

			ontouchend: (event) ->
				touch = @_getCurrentTouch(event.changedTouches)
				if touch
					@endTouchy(event, touch)

			endTouchy: (event, pointer) ->
				@_resetTouchy()

				@_setPointerPoint(@current_point, pointer)
				@distance = 
					x: @current_point.x - @start_point.x
					y: @current_point.y - @start_point.y

				@end_time = new Date()

				@emitEvent('end', [ event, @, pointer ] )

				if not @_cancelled_tap and Math.abs(@distance.x) <= @options.tap_threshold and Math.abs(@distance.y) <= @options.tap_threshold
					@emitEvent('tap', [ @, event, pointer ] )

				false

			# hold event
			holdTouchy: (event, pointer) ->
				@holding = true
				@emitEvent('hold', [ event, @, pointer ] )

			# drag event
			dragTouchy: (event, pointer) ->
				@dragging = true
				@emitEvent('drag', [ event, @, pointer ] )

			cancelTouchy: (event) ->
				# cancel touchy premeturely
				@_resetTouchy()
				@emitEvent('cancel', [ event, @ ] )

			_resetTouchy: ->
				@touching = false
				delete @pointerId

				@_unbindPostEvents()
				@elm.removeClass('touching')

				@_cancelTap()
				@_cancelHold()
				@_cancelDrag()

			# cancel events
			onpointercancel: (event) ->
				if event.pointerId == @pointerId
					@endTouchy(event, event)

			onMSPointerCancel: @onpointercancel

			ontouchcancel = (event) ->
				touch = @_getCurrentTouch(event.changedTouches)
				@endTouchy(event, touch)

			_cancelTap: ->
				clearTimeout(@_tap_timer)
				@_tap_timer = null
				@_cancelled_tap = true

			_cancelHold: ->
				clearTimeout(@_hold_timer)
				@_hold_timer = null
				@holding = false
				@elm.removeClass('holding')

			_cancelDrag: ->
				@dragging = false
				@elm.removeClass('dragging')

			_getCurrentTouch: (touches) ->
				for touch in touches
					return touch if touch.identifier == @pointerId
				null
			
			enable: ->
				@enabled = true

			disable: ->
				@enabled = false
				@endTouchy() if @touching

			destroy: ->
				@disable()
				@_bindHandles(false)

		return Touchy


	if typeof define == 'function' and define.amd
		# amd
		define([
			'jquery/jquery'
			'eventEmitter/EventEmitter',
			'eventie/eventie',
			'gsap/gsap',
			'jquery-transform/jquery-transform'
		], TouchyDefinition)
	else if typeof exports == 'object'
		# commonjs
		module.exports = TouchyDefinition(
			require('jquery'),
			require('wolfy87-eventemitter'),
			require('eventie'),
			require('gsap'),
			require('jquery-transform')
		)
	else
		# global
		window.Touchy = TouchyDefinition(
			window.jQuery,
			window.EventEmitter,
			window.eventie,
			window.TweenMax
		)
	

)(window)


