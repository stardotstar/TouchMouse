###
touchy_scroller.js, version 1.0

scroll panels for Touchy.

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

	TouchyScrollerDefinition = (Touchy,$,EventEmitter,TweenMax) ->

		class TouchyScroller
			constructor: (elm,options) ->
				@elm = $(elm).first()

				@options = $.extend {}, _default_options, options

				# console.log('Initialized TouchyScroller on', @elm ,@options)

				@_configurePanner()
				@_setupTouchyInstance()
				@value(@options.x,@options.y)
				@_setupResize()

				@emitEvent('init', [ @ ] )

				@elm.css('opacity',1)

			_default_options =
				vertical: false
				x: 0
				y: 0
				container_elm: '.options'
				option_elm: '.option'
				nav_elm: '.nav'
				indicator: false
				indicator_elm: '.indicator'
				threshold: 20
				velocityXThreshold: 1
				deltaXThresholdPercent: .3

			_setupTouchyInstance: ->
				@_touchy = new Touchy @elm
					# cancel_on_scroll: false

				@_touchy.on 'start', (event,t,pointer) =>
					@_onStart(event,pointer)
					# @emitEvent('panstart', [ event, @, @_value ] )

				@_touchy.on 'move', (event,t,pointer) =>
					@_onMove(event,pointer)
					# @emitEvent('panmove', [ event, @, @_value ] )

				@_touchy.on 'end', (event,t,pointer) =>
					@_onEnd(event,pointer)
					# @emitEvent('panend', [ event, @, @_value ] )

				@_touchy.on 'cancel', (event,t,pointer) =>
					@_onEnd(event,pointer)
					# @emitEvent('panend', [ event, @, @_value ] )

			_configureScroller: ->
				@elm.addClass('scroller')
				@elm.addClass(if @options.vertical then 'scroller_v' else 'scroller_h')
				
				@_options_elm = @elm.find(@options.container_elm)

				@_options_elm.css
					position: 'relative'

			_configureNav: ->
				@_nav_elm = @elm.find(@options.nav_elm)
				true

			_configureIndicator: ->
				return unless @options.indicator
				@_indicator_elm = @elm.find(@options.indicator_elm)
				@_indicator_elm.append("<span class='icon'>") for i in [1..@_option_count]
				true

			value: (xval,yval) ->
				if xval? || yval?
					x = xval ? @_current_x
					y = yval ? @_current_y					
					@_scrollTo(x,y)
				else
					x: @_current_x
					y: @_current_y

			_scrollTo: (x,y,duration = .5) ->
				
				# console.log('paging to',id)
				if !duration
					TweenLite.set @elm,
						x: x
						y: y
				else
					TweenLite.to @elm, duration,
						x: x
						y: y
						ease: Back.easeOut

				@_current_x = x
				@_current_y = y

			_onStart: (e, pointer) ->
				# console.log('Touch started')

			_onMove: (e, pointer) ->
				direction = @_direction()
				distance = @_distance()

				return true if direction and not direction.match /^(left|right)$/

				# console.log(distance)

				if distance >= @options.threshold and not @_started
					# console.log('Pan Started')
					@_started = true
					@emitEvent('panstart', [ @ ] )
				else if @_started

					duration = @_tl.totalDuration()
					duration_ms = duration * 1000
					duration_per_option = duration_ms / @_option_count
					duration_per_pixel = duration_ms / (@_option_w * @_option_count)

					# console.log(duration_ms,@_option_w,@_option_count)

					data_id = @_options.eq(@_current_option).data('id')
					current_time = @_tl.getLabelTime("option-#{data_id}")

					time_change = Math.abs(distance * (duration_per_pixel / 2)) / 1000

					# console.log(time_change)

					if direction == "right"
						time_change = current_time if current_time - time_change < 0
						time = "option-#{data_id}-=#{time_change}"
					else if direction == "left"
						time_change = current_time if current_time + time_change > duration
						time = "option-#{data_id}+=#{time_change}"
					# console.log('seeking to',time)
					@_tl.seek(time)

					@emitEvent('panmove', [ e, @ ] )


			_onEnd: (e,pointer) ->

				if $(e.target).parent().is(@_nav_elm)
					@_onNavEnd(e,pointer)
					return

				return unless @_started

				direction = @_direction()
				distance = @_distance()

				current_elm = @_options.eq(@_current_option)
				current_elm.removeClass('current')

				if direction == "left"
					next_ind = @_current_option + 1
				else if direction == "right"
					next_ind = @_current_option - 1

				@_panTo(next_ind)

				@_started = false
				@emitEvent('panend', [ e, @ ] )

			_onNavEnd: (e,pointer) ->
				e.preventDefault()
				elm = $(e.target)
				if elm.hasClass('prev')
					# console.log('go prev')
					@_panTo @_current_option - 1
				else if elm.hasClass('next')
					# console.log('go next')
					@_panTo @_current_option + 1

			_direction: ->
				if @_touchy.distance.x > 0
					'right'
				else if @_touchy.distance.x < 0
					'left'
				else
					''

			_distance: ->
				Math.abs(@_touchy.distance.x)

			_panTo: (id) ->
				# dont allow paging past min and max
				if not (id > -1 and id < @_option_count)
					id = @_current_option

				elm = @_options.eq(id)
				elm.addClass('current')
				data_id = elm.data('id')

				# console.log('panning to',data_id)

				@_tl.tweenTo "option-#{data_id}",
					ease: Strong.easeOut,
					onComplete: =>
						# console.log('panchanged')
						@emitEvent('panchanged', [ @ ] )
				@_current_option = id
				@_updateNavState()
				@_updateIndicatorState()

			_updateNavState: ->
				if @_current_option == 0
					@elm.addClass('first')
					@elm.removeClass('last')
				else if @_current_option == @_option_count - 1
					@elm.addClass('last')
					@elm.removeClass('first')
				else
					@elm.removeClass('first last')

			_updateIndicatorState: ->
				if @_indicator_elm and @_indicator_elm.length
					@_indicator_elm.find('.icon')
						.removeClass('active')
						.eq(@_current_option)
							.addClass('active')

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
				else
					@_length = @elm.width()
					@_offset = @elm.offset().left

				@_setOptionHeight()

			_setOptionHeight: ->
				if @elm.is(':visible')
					@_option_h = 0
					for option in @_options
						oh = $(option).outerHeight()
						if oh > @_option_h
							@_option_h = oh
					@_options_elm.css
						minHeight: @_option_h

			extend TouchyScroller.prototype, EventEmitter.prototype

		return TouchyScroller

	if typeof define == 'function' and define.amd
		# amd
		define([
			'touchy',
			'jquery',
			'eventEmitter',
			'gsap',
			'jquery-transform'
		], TouchyScrollerDefinition)
	else if typeof exports == 'object'
		# commonjs
		module.exports = TouchyScrollerDefinition(
			require('touchy'),
			require('jquery'),
			require('wolfy87-eventemitter'),
			require('gsap'),
			require('jquery-transform')
		)
	else
		# global
		window.TouchyScroller = TouchyScrollerDefinition(
			window.Touchy,
			window.jQuery,
			window.EventEmitter,
			window.TweenMax
		)
	

)(window)