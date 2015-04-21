###
touchy_panner.js, version 1.0

pan events for Touchy.

(c) 2015 Copyright Stardotstar.
project located at https://github.com/stardotstar/Touchy.js.
Licenced under the Apache license (see LICENSE file)

###

((window) ->

	# helper methods
	extend = (object, properties) ->
		for key, val of properties
			object[key] = val
		object

	noop = ->

	TouchyPannerDefinition = ($,EventEmitter,TweenMax) ->

		class TouchyPanner
			constructor: (elm,options) ->
				@elm = $(elm).first()

				@options = $.extend {}, _default_options, options

				console.log('Initialized TouchyPanner on', @elm ,@options)

				@_createPanner()
				@_setupTouchyInstance()
				@_configureOptions()
				@value(@options.initial_index)
				@_updateHandlePosition()

				@emitEvent('init', [ @, @_value ] )

				@elm.css('opacity',1)

			_default_options =
				vertical: false
				initial_index: 0
				container_elm: '.options'
				option_elm: '.option'
				velocityXThreshold: 1
				deltaXThresholdPercent: .3

			_setupTouchyInstance: ->
				@_touchy = new Touchy @elm,
					cancel_on_scroll: false

				@_touchy.on 'start', (event,t,pointer) =>
					@emitEvent('panstart', [ event, @, @_value ] )

				@_touchy.on 'move', (event,t,pointer) =>
					@emitEvent('panmove', [ event, @, @_value ] )

				@_touchy.on 'end', (event,t,pointer) =>
					@emitEvent('panend', [ event, @, @_value ] )

			_createPanner: ->
				@elm.addClass('panner')
				@elm.addClass(if @options.vertical then 'panner_v' else 'panner_h')
				@elm.css
					position: 'relative'

			_configureOptions: ->
				if @options.values and @options.values.length
					@options.min_value = 0
					@options.max_value = @options.values.length-1

			_setHandleClass: (add = false) ->
				if event.target == @handle.get(0)
					if add
						@handle.addClass('touching')
					else
						@handle.removeClass('touching')

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
					@_updateBubble()
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

			_updateBubble: ->
				if @options.show_bubble and @bubble_elm

					bubble_text = if @options.values and @options.values.length then @options.values[@_value] else @_value

					# set value
					@bubble_elm.text('' + @options.bubble_prefix + bubble_text + @options.bubble_suffix)
					# move the handle
					bubble_pos = (@_value_pct / 100) * @_length
					bubble_pos -= @bubble_elm.outerWidth() / 2
					if @options.vertical
						@bubble_elm.css('top',bubble_pos)
					else
						@bubble_elm.css('left',bubble_pos)
					

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

			extend TouchyPanner.prototype, EventEmitter.prototype

		return TouchyPanner

	if typeof define == 'function' and define.amd
		# amd
		define([
			'jquery/jquery',
			'eventEmitter/EventEmitter',
			'gsap/gsap',
			'jquery-transform/jquery-transform'

		], TouchyPannerDefinition)
	else if typeof exports == 'object'
		# commonjs
		module.exports = TouchyPannerDefinition(
			require('jquery'),
			require('wolfy87-eventemitter'),
			require('gsap'),
			require('jquery-transform')
		)
	else
		# global
		window.TouchyPanner = TouchyPannerDefinition(
			window.jQuery,
			window.EventEmitter,
			window.TweenMax
		)
	

)(window)