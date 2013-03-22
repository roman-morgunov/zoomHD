/*
*  Easy zoomHD
*
*  'This Lib Will Make Your Life Easier'
*
*  Made in Ukraine
*
*  @author: Roman Morgunov
*
*  e-mail: rom@ksturbo.org.ua
*
* */

(function(global){
	"use strict";

	function PinchToZoom(wrapperElement, options){
		this.wrapper = wrapperElement;

		this.prefix = this.getPrefix();

		this.forEach = Array.prototype.forEach;

		if(options && options.syncClass){
			this.targets = this.wrapper.getElementsByClassName(options.syncClass);
		}else{
			this.target = this.wrapper.children[0];
		}

		this.applyStyle(this.getStyleWithPrefix('TransformOrigin'), '0 0');

		this.isZoomAvailable = this.isStyleAvailable('zoom', 1);
		this.is3dAvailable = this.isStyleAvailable(this.getStyleWithPrefix('Transform'), 'matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 2, 0, 0, 0, 0, 1)');

		this.wrapperSize = null;
		this.maxZoom = options && options.maxZoom || 2;
		this.minZoom = 1;

		this.isTouch = 'ontouchstart' in window;
		this.event_start = this.isTouch ? 'touchstart' : 'mousedown';
		this.event_move = this.isTouch ? 'touchmove' : 'mousemove';
		this.event_end = this.isTouch ? 'touchend' : 'mouseup';

		this.addEvents();

		if(this.wrapper.offsetWidth){
			this.initSizes();
		}
	}

	PinchToZoom.prototype.applyStyle = function(styleName, styleValue){
		var that = this;
		if(this.target){
			this.target.style[styleName] = styleValue;
		}else if(this.targets){
			this.forEach.call(this.targets, function(element){
				element.style[styleName] = styleValue;
			});
		}
	};

	PinchToZoom.prototype.isStyleAvailable = function(style, value){
		var element = document.createElement('div'), result;
		document.body.appendChild(element);
		element.style[style] = value;
		result = getComputedStyle(element, null)[style];
		//console.log(style + ' : ' + (result == value));
		element.parentNode.removeChild(element);
		return result == value;
	};

	PinchToZoom.prototype.stopEvent = function(event){
		event.stopPropagation();
		event.preventDefault();
	};

	PinchToZoom.prototype.addEvents = function(){
		var that = this;

		window.addEventListener('resize', function(){
			if(that.wrapper.offsetWidth){
				that.initSizes(true);
			}
		});

		this.wrapper.addEventListener(this.event_start, function(event){
			if((that.isTouch && event.touches.length === 1) || !that.isTouch){
				if(!that.wrapperSize){
					that.initSizes();
				}

				that.start(event);
			}
		});

		this.wrapper.addEventListener(this.event_move, function(event){
			if((that.isTouch && event.touches.length === 1) || !that.isTouch){
				that.move(event);
			}
		});

		this.wrapper.addEventListener(this.event_end, function(event){
			if((that.isTouch && event.changedTouches.length === 1) || !that.isTouch){
				that.end(event);
			}
		});

		document.addEventListener(this.event_move, function(event){
			if(that.isStart){
				that.end(event);
			}
		});

		if(that.isTouch){
			this.wrapper.addEventListener('gesturestart', function(event){
				that.start(event, true);
			});

			this.wrapper.addEventListener('gesturechange', function(event){
				that.move(event, true);
			});

			this.wrapper.addEventListener('gestureend', function(event){
				that.end(event, true);
			});
		}
	};

	PinchToZoom.prototype.getPrefix = function(){
		var browserData = navigator.userAgent;

		if(browserData.indexOf('WebKit') !== -1 ){
			return 'webkit'
		}else if(browserData.indexOf('MSIE') !== -1 ){
			return 'ms'
		} else if(browserData.indexOf('Firefox') !== -1 ){
			//return 'moz'
			return ''
		}else if(browserData.indexOf('Opera') !== -1 ){
			//return 'o'
			return ''
		}else{
			return '';
		}
	};

	PinchToZoom.prototype.getStyleWithPrefix = function(style){
		if(this.prefix.length === 0){
			return style.charAt(0).toLowerCase() + style.slice(1);
		}else{
			return this.prefix + style;
		}
	};

	PinchToZoom.prototype.initSizes = function(ignoreReset){
		this.wrapperSize = this.wrapper.getBoundingClientRect();

		if(!ignoreReset){
			this.reset();
		}
	};

	PinchToZoom.prototype.getCoordinates = function(event){
		var i, p = {x:0, y:0};

		if (this.isTouch) {
			for (i = 0; i < event.touches.length; i++){
				if (this.identifier === event.touches[i].identifier){
					p.x = event.touches[i].clientX;
					p.y = event.touches[i].clientY;
					break
				}
			}
		} else {
			p.x = event.clientX;
			p.y = event.clientY;
		}

		p.x -= this.wrapperSize.left;
		p.y -= this.wrapperSize.top;

		return p;
	};

	PinchToZoom.prototype.start = function(event, isGesture){
		this.stopEvent(event);

		this.isStart = true;

		if(isGesture){

			this.startCoordinates = {
				x: event.pageX - this.wrapperSize.left,
				y: event.pageY - this.wrapperSize.top
			};

		}else{

			if (this.isTouch) {
				this.identifier = event.changedTouches[0].identifier;
			}

			this.startCoordinates = this.getCoordinates(event);
		}
	};

	PinchToZoom.prototype.move = function(event, isGesture){
		var x, y;

		if(this.isStart){

			this.stopEvent(event);

			if(isGesture){
				this.moveCoordinates = {
					x: event.pageX - this.wrapperSize.left,
					y: event.pageY - this.wrapperSize.top
				};
			}else{
				this.moveCoordinates = this.getCoordinates(event);
			}

			if(event.shiftKey || event.ctrlKey || isGesture){

				this.isZooming = true;

				this.zoomLineLength = Math.abs(this.startCoordinates.y - this.moveCoordinates.y);

				this.currentZoomCoef = this.zoomLineLength * 0.007;

				if(event.shiftKey){
					this.currentZoom = this.zoom + this.currentZoomCoef;
				}else if(event.ctrlKey){
					this.currentZoom = this.zoom - this.currentZoomCoef;
				}

				if(isGesture){
					this.currentZoom = this.zoom + (event.scale - 1);
				}

				if(this.currentZoom > this.maxZoom){
					this.currentZoom = this.maxZoom;
				}else if(this.currentZoom < this.minZoom){
					this.currentZoom  = this.minZoom;
				}

				this.zoomIn(this.currentZoom, this.startCoordinates.x, this.startCoordinates.y);

			}else if(!this.isZooming){
				x = this.offsetX + this.moveCoordinates.x - this.startCoordinates.x;
				y = this.offsetY + this.moveCoordinates.y - this.startCoordinates.y;

				this.translate(x, y);
			}

		}
	};

	PinchToZoom.prototype.end = function(event){
		this.stopEvent(event);

		this.isStart = false;
		this.isZooming = false;

		this.zoom = this.currentZoom;
		this.offsetX = this._offsetX;
		this.offsetY = this._offsetY;

		this.applyTransform();
	};

	PinchToZoom.prototype.checkAndCorrectOffsets = function(zoomValue){
		var that = this, diffWidth, diffHeight, target;

		if(this.target){
			target = this.target;
		}else if(this.targets){
			target = this.targets[0];
		}

		diffWidth = (target.offsetWidth - target.offsetWidth * zoomValue);
		diffHeight = (target.offsetHeight - target.offsetHeight * zoomValue);

		if(this._offsetX > 0){
			this._offsetX = 0
		}else if(this._offsetX < diffWidth){
			this._offsetX = diffWidth
		}

		if(this._offsetY > 0){
			this._offsetY = 0
		}else if(this._offsetY < diffHeight){
			this._offsetY = diffHeight
		}

	};

	PinchToZoom.prototype.translate = function(x, y){
		this._offsetX = x;
		this._offsetY = y;

	    this.checkAndCorrectOffsets(this.zoom);
		this.applyTransform();
	};



	PinchToZoom.prototype.zoomIn = function(zoomValue, _originX, _originY){
		var origX, origY, deltaValue;

		origX = Math.abs(this.offsetX) + _originX;
		origY = Math.abs(this.offsetY) + _originY;

		deltaValue = zoomValue / this.zoom;

		this._offsetX = (_originX - origX * deltaValue);
		this._offsetY = (_originY - origY * deltaValue);

		this.checkAndCorrectOffsets(zoomValue);
		this.applyTransform(true);
	};

	PinchToZoom.prototype.applyTransform = function(isScale){
		var that = this,
			setTransform = function(zoom, x, y){
			if(that.is3dAvailable){
				that.applyStyle(that.getStyleWithPrefix('Transform'), 'scale3d(' + zoom + ',' + zoom +', 1) translate3d(' + x + 'px, ' + y + 'px, 0)');
			}else{
				that.applyStyle(that.getStyleWithPrefix('Transform'), 'scale(' + zoom+ ') translate(' + x + 'px, ' + y + 'px)');
			}
		};

		if(isScale){

			if(this.isZoomAvailable){
				this.applyStyle('zoom', this.minZoom);
			}

			setTransform(this.currentZoom, this._offsetX / this.currentZoom, this._offsetY / this.currentZoom);

		}else{

			if(this.isZoomAvailable){
				this.applyStyle('zoom', this.zoom);

				setTransform(1, this._offsetX / this.currentZoom, this._offsetY / this.currentZoom);

			}else{

				setTransform(this.zoom, this._offsetX / this.currentZoom, this._offsetY / this.currentZoom);

			}

		}

	};

	PinchToZoom.prototype.reset = function(){
		this.offsetX = 0;
		this.offsetY = 0;

		this._offsetX = 0;
		this._offsetY = 0;

		this.zoom = 1;

		this.currentZoom = this.minZoom;

		this.applyTransform();
	};

	global.PinchToZoom = PinchToZoom;

})(window);
