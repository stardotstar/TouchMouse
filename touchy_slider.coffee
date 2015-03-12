###
touchy_slider.js, version 1.0

Slide control for Touchy.

(c) 2015 Copyright Stardotstar.
project located at https://github.com/stardotstar/TouchySlider.js.
Licenced under the Apache license (see LICENSE file)

###

((window) ->

	# helper methods
	extend = (object, properties) ->
		for key, val of properties
			object[key] = val
		object

	noop = ->

	TouchySliderDefinition = ($,EventEmitter,TweenMax) ->

		class TouchySlider
			constructor: (elm,options) ->
				@elm = $(elm)				
				@options = $.extend {}, _default_options, options

				@_setupTouchyInstance()
				
				@_setValue(@options.initial_value)
				@_resize()


			_default_options =
				vertical: false
				min_value: 0
				max_value: 100
				initial_value: 0
				handle: ''

			_setupTouchyInstance: ->
				@_touchy = new Touchy(@elm)
				@_touchy.on 'start', (t,event,pointer) =>
					@_onStart()
				@_touchy.on 'move', (t,event,pointer) =>
					@_onMove()
				@_touchy.on 'end', (t,event,pointer) =>
					@_onEnd()

			value: (val) ->
				if val?
					@_value = val
					@_value_pct = @_valueToPercent(val)
					@
				else
					@_value

			valuePercent: (val) ->
				if val?
					@_value_pct = val
					@_value = @_percentToValue(val)
					@
				else
					@_value_pct

			_onStart: (t, event, pointer) ->
				@_update()

			_onMove: ->
				@_update()

			_onEnd: ->
				@_update()

			_update: ->
				if @options.vertical
					pos = @_touchy.current_point.y
				else
					pos = @_touchy.current_point.x

				pct = Math.round(((pos - @_offset) / @_length) * 100)
				@valuePercent(pct)

				if @handle
					# move the handle
					handle_pos = pos - @_offset - (@_handleLength / 2)
					if @options.vertical
						@handle.css('top',handle_pos)
					else
						@handle.css('left',handle_pos)

				@emitEvent('update', [ @, event, @_value ] )

			_valueToPercent: (val) ->
				((val - @options.min_value) / (@options.max_value - @options.min_value)) * 100
			
			_percentToValue: (pct) ->
				((percent / 100) * (@options.max_value - @options.min_value)) + min

			_setupResize: ->
				$(window).on 'resize', =>
					@_resize()

			_resize: ->
				if @options.vertical
					@_length = elm.height()
					@_offset = elm.offset().top
					@_handleLength = @handle.height() if @handle
				else
					@_length = elm.width()
					@_offset = elm.offset().left
					@_handleLength = @handle.width() if @handle

			extend TouchySlider.prototype, EventEmitter.prototype

		return TouchySlider

	if typeof define == 'function' and define.amd
		# amd
		define([
			'jquery/jquery',
			'eventEmitter/EventEmitter',
			'gsap/gsap',
			'jquery-transform/jquery-transform'

		], TouchyDefinition)
	else if typeof exports == 'object'
		# commonjs
		module.exports = TouchyDefinition(
			require('jquery'),
			require('wolfy87-eventemitter'),
			require('gsap'),
			require('jquery-transform')
		)
	else
		# global
		window.TouchySlider = TouchyDefinition(
			window.jQuery,
			window.EventEmitter,
			window.TweenMax
		)
	

)(window)