
var rcxMain = {
	altView: 0,
	enabled: 0,
	sticky: false,
	
	superSticky: false,           // Are we in Super Sticky mode?
	superStickyOkayToShow: false, // Okay to show the popup in Super Sticky mode?
	superStickyOkayToHide: false, // Okay to hide the popup in Super Sticky mode?

	init: function(rcxConfig, rcxMyData) {
		this.rcxConfig = rcxConfig;
		this.rcxMyData = rcxMyData;
		
		const _this = this;
		window.addEventListener('load', function() { _this._init() }, false);
	},

	_init: function(rcxConfig) {
		window.addEventListener('unload', function() { }, false);

		this.rcxConfig.load();
		// enmode: 0=tab, 1=browser, 2=all, 3=always
		this.rcxConfig.enmode = 3;
		this.enabled = 1;
		this.enable(document, 0);

		// Enable Sticky Mode at startup based on user preference
		if (this.rcxConfig.startsticky)
		{
			this.sticky = true;
		}

		// Enable Super Sticky Mode at startup based on user preference
		if (this.rcxConfig.startsupersticky)
		{
			this.superSticky = true;
		}
		console.log('_init done');
	},

	showPopup: function(text, elem, pos, lbPop)
    {
	  //console.log(text, elem, pos, lbPop);
    try
    {
      // outer-most document
      var content = window.top;
      var topdoc = content.document;

      var x = 0, y = 0;
      if (pos) {
        x = pos.screenX;
        y = pos.screenY;
      }

      this.lbPop = lbPop;

      var popup = topdoc.getElementById('rikaichan-window');
      if (!popup) {
        var css = topdoc.createElementNS('http://www.w3.org/1999/xhtml', 'link');
        css.setAttribute('rel', 'stylesheet');
        css.setAttribute('type', 'text/css');
        css.setAttribute('href', this.rcxConfig.css);
        css.setAttribute('id', 'rikaichan-css');

        head = topdoc.getElementsByTagName('head')[0];

        if(head)
        {
          head.appendChild(css);
        }
        else
        {
          console.error("showPopup(): Unable to append css to head!");
          return;
        }

        popup = topdoc.createElementNS('http://www.w3.org/1999/xhtml', 'div');
        popup.setAttribute('id', 'rikaichan-window');
        topdoc.documentElement.appendChild(popup);

        // if this is not set then Cyrillic text is displayed with Japanese
        // font, if the web page uses a Japanese code page as opposed to Unicode.
        // This makes it unreadable.
        popup.setAttribute('lang', 'en');

		_this = this;
        popup.addEventListener('dblclick',
          function (ev) {
            _this.hidePopup();
            ev.stopPropagation();
          }, true);

        if (this.rcxConfig.resizedoc) {
          if ((topdoc.body.clientHeight < 1024) && (topdoc.body.style.minHeight == '')) {
            topdoc.body.style.minHeight = '1024px';
            topdoc.body.style.overflow = 'auto';
          }
        }
      }

      popup.style.maxWidth = (lbPop ? '' : '600px');
      popup.style.opacity = this.rcxConfig.opacity / 100;

      if(this.rcxConfig.roundedcorners)
      {
        popup.style.borderRadius = '5px';
      }
      else
      {
        popup.style.borderRadius = '0px';
      }

      if (topdoc.contentType == 'text/plain') {
        var df = document.createDocumentFragment();
        var sp = document.createElementNS('http://www.w3.org/1999/xhtml', 'span');
        df.appendChild(sp);
        sp.innerHTML = text;
        while (popup.firstChild) {
          popup.removeChild(popup.firstChild);
        }
        popup.appendChild(df);
      }
      else {
        popup.innerHTML = text;
      }

      if (elem && (typeof elem !== 'undefined')
         && elem.parentNode && (typeof elem.parentNode !== 'undefined')) {
        popup.style.top = '-1000px';
        popup.style.left = '0px';
        popup.style.display = '';

        var width = popup.offsetWidth;
        var height = popup.offsetHeight;

        // guess! (??? still need this?)
        if (width <= 0) width = 200;
        if (height <= 0) {
          height = 0;
          var j = 0;
          while ((j = text.indexOf('<br', j)) != -1) {
            j += 5;
            height += 22;
          }
          height += 25;
        }

		//console.log('altView ' + this.altView);
        if (this.altView == 1) {
          // upper-left
          x = 0;
          y = 0;
        }
        else if (this.altView == 2) {
          // lower-right
          x = (content.innerWidth - (width + 20));
          y = (content.innerHeight - (height + 20));
        }
        else {
          // convert xy relative to outer-most document
          var cb = document;
          var bo = window;//cb.boxObject; <-- changed
          x -= bo.screenX;
          y -= bo.screenY;

          // when zoomed, convert to zoomed document pixel position
          // - not in TB compose and ...?
          try {
            var z = cb.fullZoom || 1;
            if (z != 1) {
              x = Math.round(x / z);
              y = Math.round(y / z);
            }
          }
          catch (ex) {
            // console.log('ex: ' + ex)
          }

          if (false ) {

          }
          else {
            // go left if necessary
            if ((x + width) > (content.innerWidth - 20)) {
              x = (content.innerWidth - width) - 20;
              if (x < 0) x = 0;
            }

            // below the mouse
            var v = 25;

            // under the popup title
            if ((elem.title) && (elem.title != '')) v += 20;

            // go up if necessary
            if ((y + v + height) > content.innerHeight) {
              var t = y - height - 30;
              if (t >= 0) y = t;
            }
            else y += v;
          }
        }
      }
      else
      {
        console.error("showPopup(): elem or parentNode is not defined!");
      }

      popup.style.left = (x + content.scrollX) + 'px';
      popup.style.top = (y + content.scrollY) + 'px';
      popup.style.display = '';
	  console.log('top ' + popup.style.top + ' ' + content.scrollY);
    }
    catch(ex)
    {
      console.error("showPopup() Exception: " + ex);
    }
	console.log('showPopup end');
	}, /* showPopup */

	hidePopup: function()
    {

		// Don't hide popup in superSticky unless given permission to
		if(!this.superSticky || this.superStickyOkayToHide)
		{
		  this.superStickyOkayToHide = false;

			  var doc = window.top.document;
			  var popup = doc.getElementById('rikaichan-window');

		  if (popup)
		  {
			popup.style.display = 'none';
			popup.innerHTML = '';
		  }

		  this.lbPop = 0;
		  this.title = null;
		}
	},

	clearHi: function() {
		var tdata = document.rikaichan;
		if ((!tdata) || (!tdata.prevSelView)) return;
		if (tdata.prevSelView.closed) {
			tdata.prevSelView = null;
			return;
		}

		var sel = tdata.prevSelView.getSelection();
		if ((sel.isCollapsed) || (tdata.selText == sel.toString())) {
			sel.removeAllRanges();
		}
		tdata.prevSelView = null;
		tdata.kanjiChar = null;
		tdata.selText = null;
	},


  onMouseUp: function(ev)
  {
    // Did a Ctrl-right click just occur in Super Sticky mode?
    if(ev.ctrlKey && (ev.button == 2) && this.superSticky)
    {
      // Set a timer to remove the right-click context menu by creating a key press event
      // that simulates an ESC press. It won't work if we send the ESC press right away,
      // we have to wait a little while, hence the timer.
        window.setTimeout
        (
          function()
          {
            var evnt = document.createEvent("KeyboardEvent");
            evnt.initKeyEvent("keypress", true, true, window, false, false, false, false, 27, 0);
            ev.target.dispatchEvent(evnt);
          }, 15);
    }
  },


	onMouseDown: function(ev)
    {
		// Did a Ctrl-click or Alt-click just occur in Super Sticky mode?
		if(this.superSticky && (ev.ctrlKey || ev.altKey))
		{
		  // Prevent the surrounding table element from hiliting when the user
		  // performs a ctrl-left click
		  if(ev.button == 0)
		  {
			ev.preventDefault();
		  }

		  let tdata = ev.currentTarget.rikaichan;

		  this.superStickyOkayToShow = true;

		  if(tdata)
		  {
			if (tdata.titleShown)
			{
			}
			else
			{
			  this.show(tdata);
			}
		  }
		}
		else if(!this.cursorInPopup(ev))
		{
		  this.superStickyOkayToHide = true;
		  this.hidePopup();
		}
	},

	  // Configure this.inlineNames based on user settings.
	  configureInlineNames: function()
	  {
		inlineNames["DIV"] = this.rcxConfig.mergedivs;

	  }, /* configureInlineNames */


	show: function(tdata) {
		//console.log('show');
		var rp = tdata.prevRangeNode; // The currently selected node
		var ro = tdata.prevRangeOfs + tdata.uofs; // The position of the hilited text in the currently selected node
		var i;
		var j;

		tdata.uofsNext = 1;

		if (!rp) {
			this.clearHi();
			this.hidePopup();
			return 0;
		}

		if ((ro < 0) || (ro >= rp.data.length)) {
			this.clearHi();
			this.hidePopup();
			return 0;
		}

		// @@@ check me
		// TODO: move symbol checking to a sep function
		let u = rp.data.charCodeAt(ro);
		const notKanaOrKanji = ((u < 0x3001) || (u > 0x30FF)) &&
			((u < 0x3400) || (u > 0x9FFF)) &&
			((u < 0xF900) || (u > 0xFAFF)) &&
			((u < 0xFF10) || (u > 0xFF9D));
		const isHangul = (0x3130 <= u && u <=0x318F) || (0xAC00 <= u && u <= 0xD7AF) ||
		                 (0x3400 <= u && u <= 0xA000);
		if ((isNaN(u)) ||
			((u != 0x25CB) &&
			notKanaOrKanji && 
			!isHangul)) {
			this.clearHi();
			this.hidePopup();
			return -2;
		}

		// Configure this.inlineNames based on user settings
		this.configureInlineNames();

		//selection end data
		var selEndList = [];

		// The text here will be used to lookup the word
		var text = textUtils.getTextFromRange(rp, ro, selEndList, 20);
		//	console.log(text);

		let result = textUtils.getSentenceAround(rp, ro, selEndList);
		let sentence = result[0];
		let wordPosInSentence = result[1];

		this.sentence = sentence;

		if (text.length == 0) {
			this.clearHi();
			this.hidePopup();
			return 0;
		}

		var e = this.rcxMyData.wordSearch(text);
		if (e == null) {
			this.hidePopup();
			this.clearHi();
			//console.log('exit because wordSearch return null for text: ' + text);
			return 0;
		}

		// Find the highlighted word, rather than the JMDICT lookup
		//this.word = text.substring(0, e.matchLen);

		// Add blanks in place of the hilited word for use with the save feature
		sentenceWBlank = sentence.substring(0, wordPosInSentence) + "___"
					+ sentence.substring(wordPosInSentence + e.matchLen, sentence.length);

		this.sentenceWBlank = sentenceWBlank;

		if (!e.matchLen) e.matchLen = 1;
		tdata.uofsNext = e.matchLen;
		tdata.uofs = (ro - tdata.prevRangeOfs);

		// don't try to highlight form elements
		if ((this.rcxConfig.highlight) && (!('form' in tdata.prevTarget))) {
			var doc = tdata.prevRangeNode.ownerDocument;
			if (!doc) {
				this.clearHi();
				this.hidePopup();
				return 0;
			}
			textUtils.highlightMatch(doc, tdata.prevRangeNode, ro, e.matchLen, selEndList, tdata);
			tdata.prevSelView = doc.defaultView;
		}

		tdata.titleShown = false;

		// If not in Super Sticky mode or the user manually requested a popup
		if(!this.superSticky || this.superStickyOkayToShow)
		{
			//console.log('ssshow')
			// Clear the one-time okay-to-show flag
			this.superStickyOkayToShow = false;
			 // console.log(this.rcxMyData.makeHtml(e))
			this.showPopup(this.rcxMyData.makeHtml(e), tdata.prevTarget, tdata.pos);
		}

		return 1;
	},


	onMouseMove: function(ev) {
		var tdata = ev.currentTarget.rikaichan;	// per-tab data
		var rp = ev.rangeParent;
		var ro = ev.rangeOffset;
	
		if ((this.sticky) && (this.cursorInPopup(ev))) {
			clearTimeout(tdata.timer);
			tdata.timer = null;
			return;
		}

		if (ev.target == tdata.prevTarget) {
			if (tdata.title) return;
			if ((rp == tdata.prevRangeNode) && (ro == tdata.prevRangeOfs)) return;
		}

		if (tdata.timer) {
			clearTimeout(tdata.timer);
			tdata.timer = null;
		}

		if ((ev.explicitOriginalTarget.nodeType != Node.TEXT_NODE) && !('form' in ev.target)) {
			rp = null;
			ro = -1;
		}

		tdata.prevTarget = ev.target;
		tdata.prevRangeNode = rp;
		tdata.prevRangeOfs = ro;
		tdata.title = null;
		tdata.uofs = 0;
		this.uofsNext = 1;

		if (ev.button != 0) return;
		if (this.lbPop) return;

		if ((rp) && (rp.data) && (ro < rp.data.length)) {
			this.rcxMyData.select(ev.shiftKey ? rcxMyData.kanjiPos : 0);
			//	tdata.pos = ev;
			tdata.pos = { screenX: ev.screenX, screenY: ev.screenY, pageX: ev.pageX, pageY: ev.pageY };
			tdata.timer = setTimeout(function() { rcxMain.show(tdata) }, this.rcxConfig.popdelay);
			return;
		}

		if ((!this.superSticky || this.superStickyOkayToShow) && this.rcxConfig.title) {
			if ((typeof(ev.target.title) == 'string') && (ev.target.title.length)) {
				tdata.title = ev.target.title;
			}
			else if ((typeof(ev.target.alt) == 'string') && (ev.target.alt.length)) {
				tdata.title = ev.target.alt;
			}
		}

		if (ev.target.nodeName == 'OPTION') {
			tdata.title = ev.target.text;
		}
		else if (ev.target.nodeName == 'SELECT') {
			tdata.title = ev.target.options[ev.target.selectedIndex].text;
		}

		if (tdata.title) {
			//	tdata.pos = ev;
			tdata.pos = { screenX: ev.screenX, screenY: ev.screenY, pageX: ev.pageX, pageY: ev.pageY };
			tdata.timer = setTimeout(function() {  }, this.rcxConfig.popdelay);
			return;
		}

		if ((tdata.pos) && (!this.sticky)) {
			// dont close just because we moved from a valid popup slightly over to a place with nothing
			var dx = tdata.pos.screenX - ev.screenX;
			var dy = tdata.pos.screenY - ev.screenY;
			var distance = Math.sqrt(dx * dx + dy * dy);
			if (distance > 4) {
				this.clearHi();
				this.hidePopup();
			}
		}
		//console.log('_onMouseMove');
	},

	cursorInPopup: function(pos) {
		var doc =  window.top.document;
		var popup = doc.getElementById('rikaichan-window');
		return (popup && (popup.style.display !== 'none') &&
			(pos.pageX >= popup.offsetLeft) &&
			(pos.pageX <= popup.offsetLeft + popup.offsetWidth) &&
			(pos.pageY >= popup.offsetTop) &&
			(pos.pageY <= popup.offsetTop + popup.offsetHeight));
	},

	_enable: function(b) {
		if ((b != null) && (b.rikaichan == null)) {
			//	alert('enable ' + b.id);
			_this = this;
			b.rikaichan = {};
			b.addEventListener('mousemove', function(e) { _this.onMouseMove(e) }, false);
			b.addEventListener('mousedown', function(e) { _this.onMouseDown(e) }, false);
			b.addEventListener('mouseup',   function(e) { _this.onMouseUp(e)   }, false);
		//	b.addEventListener('keydown',   function(e) { _this.onKeyDown(e)   }, true);
		//	b.addEventListener('keyup',     function(e) { _this.onKeyUp(e)     }, true);
			return true;
		}
		return false;
	},

	enable: function(b, mode) {
		var ok = this._enable(b, mode);
		if (ok) {
			if (mode == 1) {
				if (this.rcxConfig.enmode > 0) {
					this.enabled = 1;
				}
			}
		}
	},

};