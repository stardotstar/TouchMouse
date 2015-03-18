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
				@elm = $(elm).first()
				@options = $.extend {}, _default_options, options

				@handle = $(@options.handle).first() if @options.handle

				console.log('Initialized TouchySlider on', @elm ,@options)

				@_resize()
				@_setupTouchyInstance()
				@value(@options.initial_value)
				@_updateHandlePosition()

			_default_options =
				vertical: false
				min_value: 0
				max_value: 100
				initial_value: 0
				handle: ''

			_setupTouchyInstance: ->
				@_touchy = new Touchy(@elm)

				@_touchy.on 'start', (event,t,pointer) =>
					@_update()
					@emitEvent('start', [ event, @, @_value ] )

				@_touchy.on 'move', (event,t,pointer) =>
					@_update()

				@_touchy.on 'end', (event,t,pointer) =>
					@_update()
					@emitEvent('end', [ event, @, @_value ] )

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

			_update: ->
				if @options.vertical
					pos = @_touchy.current_point.y
				else
					pos = @_touchy.current_point.x

				pct = Math.round(((pos - @_offset) / @_length) * 100)
				pct = 0 if pct < 0
				pct = 100 if pct > 100

				val = @_percentToValue(pct)
				val = @_trimAlignValue(val)

				if val != @_value
					# value has changed
					@value(val)
					@_updateHandlePosition()
					@emitEvent('update', [ @, event, @_value ] )

			_updateHandlePosition: ->
				if @handle
					# move the handle
					handle_pos = (@_value_pct / 100) * @_length
					handle_pos -= @_handleLength / 2
					if @options.vertical
						@handle.css('top',handle_pos)
					else
						@handle.css('left',handle_pos)

			_valueToPercent: (val) ->
				((val - @options.min_value) / (@options.max_value - @options.min_value)) * 100
			
			_percentToValue: (pct) ->
				((pct / 100) * (@options.max_value - @options.min_value)) + @options.min_value

			_trimAlignValue: (val) ->
				if val <= @options.min_value 
					return @options.min_value
				
				if val >= @options.max_value
					return @options.max_value
	
				step = if @options.step > 0 then @options.step else 1
				valModStep = (val - @options.min_value) % step
				alignValue = val - valModStep

				if Math.abs(valModStep) * 2 >= step
					alignValue += if valModStep > 0 then step else -step

				# Since JavaScript has problems with large floats, round
				# the final value to 5 digits after the decimal point
				return parseFloat(alignValue.toFixed(5))

			_setupResize: ->
				$(window).on 'resize', =>
					@_resize()

			_resize: ->
				if @options.vertical
					@_length = @elm.height()
					@_offset = @elm.offset().top
					@_handleLength = @handle.height() if @handle
				else
					@_length = @elm.width()
					@_offset = @elm.offset().left
					@_handleLength = @handle.width() if @handle

				@_updateHandlePosition()

			extend TouchySlider.prototype, EventEmitter.prototype

		return TouchySlider

	if typeof define == 'function' and define.amd
		# amd
		define([
			'jquery/jquery',
			'eventEmitter/EventEmitter',
			'gsap/gsap',
			'jquery-transform/jquery-transform'

		], TouchySliderDefinition)
	else if typeof exports == 'object'
		# commonjs
		module.exports = TouchySliderDefinition(
			require('jquery'),
			require('wolfy87-eventemitter'),
			require('gsap'),
			require('jquery-transform')
		)
	else
		# global
		window.TouchySlider = TouchySliderDefinition(
			window.jQuery,
			window.EventEmitter,
			window.TweenMax
		)
	

)(window)