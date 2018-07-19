
const 	inlineNames = {
		// text node
		'#text': true,

		// font style
		'FONT': true,
		'TT': true,
		'I' : true,
		'B' : true,
		'BIG' : true,
		'SMALL' : true,
		//deprecated
		'STRIKE': true,
		'S': true,
		'U': true,

		// phrase
		'EM': true,
		'STRONG': true,
		'DFN': true,
		'CODE': true,
		'SAMP': true,
		'KBD': true,
		'VAR': true,
		'CITE': true,
		'ABBR': true,
		'ACRONYM': true,

		// special, not included IMG, OBJECT, BR, SCRIPT, MAP, BDO
		'A': true,
		'Q': true,
		'SUB': true,
		'SUP': true,
		'SPAN': true,
		'WBR': true,

		// ruby
		'RUBY': true,
		'RBC': true,
		'RTC': true,
		'RB': true,
		'RT': true,
		'RP': true,

    // User configurable elements
    'DIV': false,
	};
	
const textUtils = {
	// Gets text from a node and returns it
	// node: a node
	// selEnd: the selection end object will be changed as a side effect
	// maxLength: the maximum length of returned string
	getInlineText: function (node, selEndList, maxLength) {
		if ((node.nodeType == Node.TEXT_NODE) && (node.data.length == 0)) return ''

		let text = '';
		let result = node.ownerDocument.evaluate('descendant-or-self::text()[not(parent::rp) and not(ancestor::rt)]',
						node, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
		while ((maxLength > 0) && (node = result.iterateNext())) {
			text += node.data.substr(0, maxLength);
			maxLength -= node.data.length;
			selEndList.push(node);
		}
		return text;
	},

	// Given a node which must not be null, returns either the next sibling or
	// the next sibling of the father or the next sibling of the fathers father
	// and so on or null
	getNext: function(node) {
		do {
			if (node.nextSibling) return node.nextSibling;
			node = node.parentNode;
		} while ((node) && (inlineNames[node.nodeName]));
		return null;
	},

	getTextFromRange: function(rangeParent, offset, selEndList, maxLength) {
		if (rangeParent.ownerDocument.evaluate('boolean(parent::rp or ancestor::rt)',
			rangeParent, null, XPathResult.BOOLEAN_TYPE, null).booleanValue)
			return '';

		if (rangeParent.nodeType != Node.TEXT_NODE)
			return '';

		let text = rangeParent.data.substr(offset, maxLength);
		selEndList.push(rangeParent);

		var nextNode = rangeParent;
		while ((text.length < maxLength) &&
			((nextNode = this.getNext(nextNode)) != null) &&
			(inlineNames[nextNode.nodeName])) {
			text += this.getInlineText(nextNode, selEndList, maxLength - text.length);
		}

		return text;
	},


	getInlineTextPrev: function (node, selEndList, maxLength)
  {
		if((node.nodeType == Node.TEXT_NODE) && (node.data.length == 0))
    {
      return ''
    }

		let text = '';

		let result = node.ownerDocument.evaluate('descendant-or-self::text()[not(parent::rp) and not(ancestor::rt)]',
						     node, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);

		while((text.length < maxLength) && (node = result.iterateNext()))
    {
      if(text.length + node.data.length >= maxLength)
      {
        text += node.data.substr(node.data.length - (maxLength - text.length), maxLength - text.length);
      }
      else
      {
			  text += node.data;
      }

			selEndList.push(node);
		}

		return text;
	},


	getPrev: function(node)
  {
		do
    {
			if (node.previousSibling)
      {
        return node.previousSibling;
      }

			node = node.parentNode;
		}
    while ((node) && (inlineNames[node.nodeName]));

		return null;
	},


	getTextFromRangePrev: function(rangeParent, offset, selEndList, maxLength)
  {
		if (rangeParent.ownerDocument.evaluate('boolean(parent::rp or ancestor::rt)',
			rangeParent, null, XPathResult.BOOLEAN_TYPE, null).booleanValue)
    {
			return '';
    }

		let text = '';
		var prevNode = rangeParent;

		while ((text.length < maxLength) &&
			((prevNode = this.getPrev(prevNode)) != null) &&
			(inlineNames[prevNode.nodeName]))
    {
      textTemp = text;
      text = this.getInlineTextPrev(prevNode, selEndList, maxLength - text.length) + textTemp;
		}

		return text;
	},
	
	// @param rp - The currently selected node
	// @param ro - The position of the hilited text in the currently selected node
	// @param selEndList - in/out, selection end data
	getSentenceAround: function(rp, ro, selEndList) {
		// The text from the currently selection node + 50 more characters from the next nodes
		var sentence = textUtils.getTextFromRange(rp, 0, selEndList, rp.data.length + 50);

		// 50 characters from the previous nodes.
		// The above sentence var will stop at first ruby tag encountered to the
		// left because it has a different node type. prevSentence will start where
		// the above sentence left off moving to the left and will capture the ruby tags.
		var prevSentence = textUtils.getTextFromRangePrev(rp, 0, selEndList, 50);

		// Combine the full sentence text, including stuff that will be chopped off later.
		sentence = prevSentence + sentence;
		
		//
			// Find the sentence in the node
		//

		// Get the position of the first selected character in the sentence variable
			i = ro + prevSentence.length;

			var sentenceStartPos;
			var sentenceEndPos;

		// Find the last character of the sentence
			while (i < sentence.length)
			{
				if (sentence[i] == "。" || sentence[i] == "\n" || sentence[i] == "？" ||　sentence[i] == "！")
				{
					sentenceEndPos = i;
					break;
				}
				else if (i == (sentence.length - 1))
				{
					sentenceEndPos = i;
				}

				i++;
			}

			i = ro + prevSentence.length;


			// Find the first character of the sentence
			while (i >= 0)
			{
				if (sentence[i] == "。" || sentence[i] == "\n" || sentence[i] == "？" ||　sentence[i] == "！")
				{
					sentenceStartPos = i + 1;
					break;
				}
				else if (i == 0)
				{
					sentenceStartPos = i;
				}

				i--;
			}

		// Extract the sentence
			sentence = sentence.substring(sentenceStartPos, sentenceEndPos + 1);

		var startingWhitespaceMatch = sentence.match(/^\s+/);

		// Strip out control characters
			sentence = sentence.replace(/[\n\r\t]/g, '');

		var startOffset = 0;

	   // Adjust offset of selected word according to the number of
	   // whitespace chars at the beginning of the sentence
	   if(startingWhitespaceMatch)
	   {
		 startOffset -= startingWhitespaceMatch[0].length;
	   }

		// Trim
		sentence = textUtils.trim(sentence);

		var wordPosInSentence = ro + prevSentence.length - sentenceStartPos + startOffset;
				
		return [sentence, wordPosInSentence];
	},
	
	///////////////////////////////////////////////////////////
	// trimming
	
	  // Trim whitespace from the beginning and end of text
	  trim: function(text)
	  {
		return text.replace(/^\s\s*/, "").replace(/\s\s*$/, "");

	  }, /* trim */


	  // Trim whitespace from the end of text
	  trimEnd: function(text)
	  {
		return text.replace(/\s\s*$/, "");

	  }, /* trimEnd */
};
	
const rcxMyData = {
	wordSearch: function(word, noKanji) {
		if (this.fake) {
			dentry = '';
			reason = "<polite";
			return { data: [[dentry, reason]], matchLen: 3, more: 0, name: 0 };
		}
		else {
			return rcxData.wordSearch(word, noKanji);
		}
	},
	
	// entry returned by wordSearch
	makeHtml: function(entry) {
		if (this.fake) {
			return '<pre>So it is a window!</pre>'
		} else {
			return rcxData.makeHtml(entry);
		}
	},
	
	select: function(dictNumber) {
		return rcxData.select(dictNumber);
	},

	loadConfig: function() {
		rcxData.loadConfig();
	},	
	
	// kanji dictionary number, rcxData.kanjiPos
	kanjiPos: 0,
	
	// my data
	fake: false,
};

var rcxMain = {
	altView: 0,
	enabled: 0,
	sticky: false,
	
  lastTdata: null,              // TData used for Sanseido mode and EPWING mode popup
  superSticky: false,           // Are we in Super Sticky mode?
  superStickyOkayToShow: false, // Okay to show the popup in Super Sticky mode?
  superStickyOkayToHide: false, // Okay to hide the popup in Super Sticky mode?

	init: function() {
		window.addEventListener('load', function() { rcxMain._init() }, false);
	},

	_init: function() {
		window.addEventListener('unload', function() { }, false);

		rcxConfig.load();
			// enmode: 0=tab, 1=browser, 2=all, 3=always
		rcxConfig.enmode = 3;
					this.enabled = 1;
					this.onTabSelect();

		// Enable Sticky Mode at startup based on user preference
		if (rcxConfig.startsticky)
		{
			rcxMain.sticky = true;
		}

		// Enable Super Sticky Mode at startup based on user preference
		if (rcxConfig.startsupersticky)
		{
			rcxMain.superSticky = true;
		}
		console.log('_init done');
	},

	onTabSelect: function() {
			rcxMain._onTabSelect();
	},

	_onTabSelect: function() {
		var bro = document;

		if (false) {
		}
		else if ((rcxConfig.enmode > 0) && (this.enabled == 1) && (bro.rikaichan == null)) {
			this.enable(bro, 0);
		}

		var en = (bro.rikaichan != null);

		var b = document.getElementById('rikaichan-toggle-cmd');
		if (b) {
			// FF 14/15/+? weirdness:
			//	attr false:   toolbar icon remains sunk (bad) / context/tools menu is unchecked (ok)
			//	attr removed: toolbar icon is normal (ok) / context/tools menu remains checked (bad)

			b.setAttribute('checked', en);

			if (!en) {
				b = document.getElementById('rikaichan-toggle-button');
				if (b) b.removeAttribute('checked');
				b = document.getElementById('rikaichan-toggle-button-gs');
				if (b) b.removeAttribute('checked');
			}
		}

		b = document.getElementById('rikaichan-status');
		if (b) b.setAttribute('rcx_enabled', en);
	},

	showPopup: function(text, elem, pos, lbPop)
   {
	  //console.log(text, elem, pos, lbPop);
    try
    {
      // outer-most document
      var content = window.content;
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
        css.setAttribute('href', rcxConfig.css);
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

        popup.addEventListener('dblclick',
          function (ev) {
            rcxMain.hidePopup();
            ev.stopPropagation();
          }, true);

        if (rcxConfig.resizedoc) {
          if ((topdoc.body.clientHeight < 1024) && (topdoc.body.style.minHeight == '')) {
            topdoc.body.style.minHeight = '1024px';
            topdoc.body.style.overflow = 'auto';
          }
        }
      }

      popup.style.maxWidth = (lbPop ? '' : '600px');

      popup.style.opacity = rcxConfig.opacity / 100;

      if(rcxConfig.roundedcorners)
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
	},

	hidePopup: function()
    {

		// Don't hide popup in superSticky unless given permission to
		if(!this.superSticky || this.superStickyOkayToHide)
		{
		  this.superStickyOkayToHide = false;

			  var doc = window.content.document;
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

  /*
   Returns:
     "*"    - If expression of last hilighted word is in the user's known words list.
     "*t"   - If expression of last hilighted word is in the user's to-do words list.
     "*_r"  - If reading of last hilighted word is in the user's known words list.
     "*t_r" - If reading of last hilighted word is in the user's to-do words list.
     ""     - If neither expression nor reading of last hilighted word was found.
   */
  getKnownWordIndicatorText: function()
  {
    return "[t] "
  }, /* getKnownWordIndicatorText */




	onMouseUp: function(ev)
  {
    // Did a Ctrl-right click just occur in Super Sticky mode?
    if(ev.ctrlKey && (ev.button == 2) && rcxMain.superSticky)
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
		if(rcxMain.superSticky && (ev.ctrlKey || ev.altKey))
		{
		  // Prevent the surrounding table element from hiliting when the user
		  // performs a ctrl-left click
		  if(ev.button == 0)
		  {
			ev.preventDefault();
		  }

		  let tdata = ev.currentTarget.rikaichan;

		  rcxMain.superStickyOkayToShow = true;

		  if(tdata)
		  {
			if (tdata.titleShown)
			{
			}
			else
			{
			  rcxMain.show(tdata);
			}
		  }
		}
		else if(!rcxMain.cursorInPopup(ev))
		{
		  rcxMain.superStickyOkayToHide = true;
		  rcxMain.hidePopup();
		}
	},

  // Configure this.inlineNames based on user settings.
  configureInlineNames: function()
  {
    inlineNames["DIV"] = rcxConfig.mergedivs;

  }, /* configureInlineNames */





	highlightMatch: function(doc, rp, ro, matchLen, selEndList, tdata) {
		if (selEndList.length === 0) return;

		var selEnd;
		var offset = matchLen + ro;
		// before the loop
		// |----!------------------------!!-------|
		// |(------)(---)(------)(---)(----------)|
		// offset: '!!' lies in the fifth node
		// rangeOffset: '!' lies in the first node
		// both are relative to the first node
		// after the loop
		// |---!!-------|
		// |(----------)|
		// we have found the node in which the offset lies and the offset
		// is now relative to this node
		for (var i = 0; i < selEndList.length; ++i) {
			selEnd = selEndList[i]
			if (offset <= selEnd.data.length) break;
			offset -= selEnd.data.length;
		}

		var range = doc.createRange();
		range.setStart(rp, ro);
		range.setEnd(selEnd, offset);

		var sel = doc.defaultView.getSelection();
		if ((!sel.isCollapsed) && (tdata.selText != sel.toString()))
			return;
		sel.removeAllRanges();
		sel.addRange(range);
		tdata.selText = sel.toString();
	},

	show: function(tdata) {
		console.log('show');
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
		let u = rp.data.charCodeAt(ro);
		if ((isNaN(u)) ||
			((u != 0x25CB) &&
			((u < 0x3001) || (u > 0x30FF)) &&
			((u < 0x3400) || (u > 0x9FFF)) &&
			((u < 0xF900) || (u > 0xFAFF)) &&
			((u < 0xFF10) || (u > 0xFF9D)))) {
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

		result = textUtils.getSentenceAround(rp, ro, selEndList);
		var sentence = result[0];
		var wordPosInSentence = result[1];

		this.sentence = sentence;

		if (text.length == 0) {
			this.clearHi();
			this.hidePopup();
			return 0;
		}

		var e = rcxMyData.wordSearch(text);
		if (e == null) {
			this.hidePopup();
			this.clearHi();
			//console.log('exit because wordSearch return null for text: ' + text);
			return 0;
		}

    // Find the highlighted word, rather than the JMDICT lookup
		this.word = text.substring(0, e.matchLen);

    // Add blanks in place of the hilited word for use with the save feature
		sentenceWBlank = sentence.substring(0, wordPosInSentence) + "___"
					+ sentence.substring(wordPosInSentence + e.matchLen, sentence.length);

		this.sentenceWBlank = sentenceWBlank;

		if (!e.matchLen) e.matchLen = 1;
		tdata.uofsNext = e.matchLen;
		tdata.uofs = (ro - tdata.prevRangeOfs);

		// don't try to highlight form elements
		if ((rcxConfig.highlight) && (!('form' in tdata.prevTarget))) {
			var doc = tdata.prevRangeNode.ownerDocument;
			if (!doc) {
				this.clearHi();
				this.hidePopup();
				return 0;
			}
			this.highlightMatch(doc, tdata.prevRangeNode, ro, e.matchLen, selEndList, tdata);
			tdata.prevSelView = doc.defaultView;
		}

		tdata.titleShown = false;

    // Save the tdata so that the sanseido routines can use it
    this.lastTdata = tdata; //Components.utils.getWeakReference(tdata);

    // If not in Super Sticky mode or the user manually requested a popup
    if(!this.superSticky || this.superStickyOkayToShow)
    {
		//console.log('ssshow')
      // Clear the one-time okay-to-show flag
      this.superStickyOkayToShow = false;
		 // console.log(rcxMyData.makeHtml(e))
        this.showPopup(rcxMain.getKnownWordIndicatorText() + rcxMyData.makeHtml(e), tdata.prevTarget, tdata.pos);
    }

		return 1;
	},

	onMouseMove: function(ev) { rcxMain._onMouseMove(ev); },
	_onMouseMove: function(ev) {
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
			rcxMyData.select(ev.shiftKey ? rcxMyData.kanjiPos : 0);
			//	tdata.pos = ev;
			tdata.pos = { screenX: ev.screenX, screenY: ev.screenY, pageX: ev.pageX, pageY: ev.pageY };
			tdata.timer = setTimeout(function() { rcxMain.show(tdata) }, rcxConfig.popdelay);
			return;
		}

		if ((!this.superSticky || this.superStickyOkayToShow) && rcxConfig.title) {
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
			tdata.timer = setTimeout(function() {  }, rcxConfig.popdelay);
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
		var doc =  window.content.document;
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
			b.rikaichan = {};
			b.addEventListener('mousemove', this.onMouseMove, false);
			b.addEventListener('mousedown', this.onMouseDown, false);
			b.addEventListener('mouseup', this.onMouseUp, false);
			b.addEventListener('keydown', this.onKeyDown, true);
			b.addEventListener('keyup', this.onKeyUp, true);
			return true;
		}
		return false;
	},

	enable: function(b, mode) {
		var ok = this._enable(b, mode);


		if (ok) {
			if (mode == 1) {
				if (rcxConfig.enmode > 0) {
					this.enabled = 1;
				}
 
			}
		}
	},

};

var rcxConfig = {
	observer: {
		observe: function(subject, topic, data) {
			rcxConfig.load();
		},

	},

	load: function() {
		let p = new rcxPrefs();

		for (let i = rcxConfigList.length - 1; i >= 0; --i) {
			let [type, name] = rcxConfigList[i];
			switch (type) {
			case 0:
				rcxConfig[name] = p.getInt(name, null);
				break;
			case 1:
				rcxConfig[name] = p.getString(name, '');
				break;
			case 2:
				rcxConfig[name] = p.getBool(name, null);
				break;
			}
		}

		['cm', 'tm'].forEach(function(name) {
			let a = !rcxConfig[name + 'toggle'];
			let e = document.getElementById('rikaichan-toggle-' + name);
			if (e) e.hidden = a;

			let b = !rcxConfig[name + 'lbar'];
			e = document.getElementById('rikaichan-lbar-' + name);
			if (e) e.hidden = b;

			e = document.getElementById('rikaichan-separator-' + name);
			if (e) e.hidden = a || b;
		}, this);

		rcxConfig.css = (rcxConfig.css.indexOf('/') == -1) ? ('popup-' + rcxConfig.css + '.css') : rcxConfig.css;


		let e = document.getElementById('rikaichan-status');
		if (e) e.hidden = (rcxConfig.sticon == 0);

		if ((rcxConfig._bottomlb == true) != rcxConfig.bottomlb) {
			// switch it later, not at every change/startup
			e = document.getElementById('rikaichan-lbar');
			if (e) e.hidden = true;
		}

		rcxMyData.loadConfig();

	}
};

rcxMain.init();
