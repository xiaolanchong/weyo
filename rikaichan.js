/*

	Rikaichan
	Copyright (C) 2005-2015 Jonathan Zarate
	http://www.polarcloud.com/

	---

	Originally based on RikaiXUL 0.4 by Todd Rudick
	http://www.rikai.com/
	http://rikaixul.mozdev.org/

	---

	This program is free software; you can redistribute it and/or modify
	it under the terms of the GNU General Public License as published by
	the Free Software Foundation; either version 2 of the License, or
	(at your option) any later version.

	This program is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU General Public License for more details.

	You should have received a copy of the GNU General Public License
	along with this program; if not, write to the Free Software
	Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA

	---

	Please do not change or remove any of the copyrights or links to web pages
	when modifying any of the files.

*/

/*
  Rikaisama
  Author:  Christopher Brochtrup
  Contact: cb4960@gmail.com
  Website: http://rikaisama.sourceforge.net/
*/

var rcxMain = {
	altView: 0,
	enabled: 0,
	sticky: false,
	id: '{697F6AFE-5321-4DE1-BFE6-4471C3721BD4}',
	version: null,
  lastTdata: null,              // TData used for Sanseido mode and EPWING mode popup
  sanseidoMode: false,          // Are we in Sanseido mode?
  sanseidoReq: false,           // XML HTTP Request object for sanseido mode
  sanseidoFallbackState: 0,     // 0 = Lookup with kanji form, 1 = Lookup with kana form
  superSticky: false,           // Are we in Super Sticky mode?
  superStickyOkayToShow: false, // Okay to show the popup in Super Sticky mode?
  superStickyOkayToHide: false, // Okay to hide the popup in Super Sticky mode?
  epwingMode: false,            // Are we in EPWING mode?
  epwingActive: false,          // Is the EPWING lookup in progress?
  epwingTotalHits: 0,           // The total number of EPWING hits for the current word
  epwingCurHit: 0,              // The current EPWING hit number (for showing hits one at a time)
  epwingPrevHit: 0,             // The previous EPWING hit number
  epwingCurDic: "",             // The EPWING dictionary to use (path)
  prevEpwingSearchTerm: "",     // The previous search term used with EPWING mode
  epwingFallbackCount: 0,       // How many times have we attempted to fallback to another EPWING dictionary?
  epwingStartDic: "",           // The dictionary used for the original EPWING lookup (before any fallbacks)
  epwingDicList: [],            // The list of EPWING dictionaries
  epwingDicTitleList: [],       // The list of EPWING dictionary titles
  saveKana: false,              // When saving a word, make the $d token equal to the $r token
  autoPlayAudioTimer: null,     // Timer used for automatically playing audio when a word is hilited
  epwingTimer: null,            // Timer used to lookup word in EPWING dictionary after word is hilited for a certain amount of time.
  noAudioFileHash: "",          // The hash of the no no_audio.mp3
  noAudioDic: null,             // Associative array containing words that have no audio clip. Key = "Reading - Expression.mp3", Value = true.
  knownWordsDic: null,          // Associative array containing the user's known words
  todoWordsDic: null,           // Associative array containing the user's to-do words
  prevKnownWordsFilePath: "",   // Previous path of the known words file. Used to determine in the use changed the path in the options.
  prevTodoWordsFilePath: "",    // Previous path of the to-do words file. Used to determine in the use changed the path in the options.
  epwingSearchTerm: "",         // Text to lookup in EPWING dictionary
  epwingSearchingNextLongest: false, // true = Searching for the next longest word in the gloss if the longest was not found.
                                     //        For example, Kojien6 doesn't have 自由研究 (which is in EDICT) but it does have 自由,
                                     //        so 自由 is used for the next longest search
  epwingResultList: [],         // List of results from the previous EPWING search
  freqDB: null,                 // Frequency database connection
  pitchDB: null,                // Pitch accent database connection


	global: function() {
		return null;
	},

	rcxObs: {
		observe: function(subject, topic, data) {
			if (topic == 'rikaichan') {
				if (data == 'getdic') {
					rcxMain.showDownloadPage();
					return;
				}

				if (data == 'dready') {
					if (rcxMain.tabSelectPending) {
						rcxMain.tabSelectPending = false;
						rcxMain.onTabSelect();
					}
					return;
				}

			}
		},
		register: function() {
		},
		unregister: function() {
		},
		notifyState: function(state) {

		}
	},


	init: function() {
		window.addEventListener('load', function() { rcxMain._init() }, false);
	},

	_init: function() {
		window.addEventListener('unload', function() { rcxMain.onUnload() }, false);

   // getBrowser: function() { return document; }, // new
    if (true) {
			let docID = document.documentElement.id;

			let mks = false ? (document.getElementById('mailKeys') || document.getElementById('editorKeys')) :
						document.getElementById('mainKeyset') || document.getElementById('navKeys');
			if (mks) {
				let prefs = new rcxPrefs();
				['toggle', 'lbar'].forEach(function(name) {
					let s = prefs.getString(name + '.key');
					if ((s.length) && (s != '(disabled)')) {
						let key = document.createElementNS('http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul', 'key');
						key.setAttribute('id', 'rikaichan-key-' + name);
						if (s.length > 1) key.setAttribute('keycode', 'VK_' + s.replace(' ', '_').toUpperCase());	// "Page Up" -> "VK_PAGE_UP"
							else key.setAttribute('key', s);
						key.setAttribute('modifiers', prefs.getString(name + '.mod'));
						key.setAttribute('command', 'rikaichan-' + name + '-cmd');
						mks.appendChild(key);
					}
				});
			}
		}

		this.rcxObs.register();

		rcxConfig.load();
		rcxConfig.observer.start();

		if (false) {
		}
		else {
			this.getBrowser = function() { return document; }

		//	gBrowser.mTabContainer.addEventListener('select', this.onTabSelect, false);
		
			// enmode: 0=tab, 1=browser, 2=all, 3=always
		rcxConfig.enmode = 3;
		if (rcxConfig.enmode >= 2) {
				if ((rcxConfig.enmode == 3) || (this.global().rikaichanActive)) {
					this.enabled = 1;
					this.onTabSelect();
				}
			}

			// add icon to the toolbar
			try {
				let prefs = new rcxPrefs();
				if (prefs.getBool('firsticon')) {
					prefs.setBool('firsticon', false);

					// ref: https://developer.mozilla.org/En/Code_snippets:Toolbar#Adding_button_by_default
					let nb = document.getElementById('nav-bar');
					nb.insertItem('rikaichan-toggle-button');
					nb.setAttribute('currentset', nb.currentSet);
					document.persist(nb.id, 'currentset');
				}
			}
			catch (ex) { }
		}

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

	onUnload: function() {
		this.rcxObs.unregister();
		rcxConfig.observer.stop();
	},

	initDictionary: function() {
		if (rcxData.missing) {
			if (confirm('No dictionary file was found. Show the download page?')) {
				this.showDownloadPage();
			}
			return false;
		}
		try {
			rcxData.init();
		}
		catch (ex) {
			alert('Error: ' + ex);
			return false;
		}
		return true;
	},

	showDownloadPage: function() {
	},


	onTabSelect: function() {
		// see rcxData.loadConfig
		if ((rcxData.dicPath) && (!rcxData.dicPath.ready)) {
			rcxMain.tabSelectPending = true;
		}
		else {
			rcxMain._onTabSelect();
		}
	},

	_onTabSelect: function() {
		var bro = this.getBrowser();

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
          var cb = this.getBrowser();
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
    // Reset the EPWING hit number and hit totals
    this.epwingTotalHits = 0;
    this.epwingCurHit = 0;
    this.epwingPrevHit = 0;

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

        // Stop the current auto play timer
        if(rcxConfig.autoplayaudio)
        {
          if(this.autoPlayAudioTimer)
          {
            clearTimeout(this.autoPlayAudioTimer);
            this.autoPlayAudioTimer = null;
          }
        }

        // Stop the EPWING timer
        if(this.epwingTimer)
        {
          clearTimeout(this.epwingTimer);
          this.epwingTimer = null;
        }
      }

      this.lbPop = 0;
      this.title = null;
    }
	},

	isVisible: function() {
		var doc = window.content.document;
		var popup = doc.getElementById('rikaichan-window');
		return (popup) && (popup.style.display != 'none');
	},

	clearHi: function() {
		var tdata = this.getBrowser().rikaichan;
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

	//

	lastFound: null,

	savePrep: function(clip, saveFormat) {
		var me, mk;
		var text;
		var i;
		var f;
		var e;
		var s;
		var w;

		f = this.lastFound;
		s = this.sentence;
		sWBlank = this.sentenceWBlank;
		w = this.word;

		if ((!f) || (f.length == 0)) return null;

		if (clip) {
			me = rcxConfig.smaxce;
			mk = rcxConfig.smaxck;
		}
		else {
			me = rcxConfig.smaxfe;
			mk = rcxConfig.smaxfk;
		}

		if (!f.fromLB) mk = 1;

		e = f[0];
		text = rcxData.makeText(e, w, s, sWBlank, rcxMain.saveKana, saveFormat);

    // Result the save kana ($d=$r) flag
    rcxMain.saveKana = false;

		if (rcxConfig.snlf == 1) text = text.replace(/\n/g, '\r\n');
			else if (rcxConfig.snlf == 2) text = text.replace(/\n/g, '\r');

		var sep = rcxConfig.ssep;
		switch (sep) {
		case 'Tab':
			sep = '\t';
			break;
		case 'Comma':
			sep = ',';
			break;
		case 'Space':
			sep = ' ';
			break;
		}
		if (sep != '\t') return text.replace(/\t/g, sep);

		return text;
	},

	copyToClip: function() {
		console.error('copyToClip not impelemented');
		return;
		var text;

		if ((text = this.savePrep(1, rcxConfig.saveformat)) != null) {
			Components.classes['@mozilla.org/widget/clipboardhelper;1']
				.getService(Components.interfaces.nsIClipboardHelper)
				.copyString(text);
			this.showPopup('Copied to clipboard.');
		} else {
			this.showPopup('Please select something to copy in Preferences.');
			return;
		}
	},


  /* Get the CSS style to use when drawing the provided frequency */
  getFreqStyle: function(inFreqNum)
  {
    freqNum = inFreqNum.replace(/_r/g, "");

    var freqStyle = 'w-freq-rare';

    if (freqNum <= 5000)
    {
      freqStyle = "w-freq-very-common";
    }
    else if (freqNum <= 10000)
    {
      freqStyle = "w-freq-common";
    }
    else if (freqNum <= 20000)
    {
      freqStyle = "w-freq-uncommon";
    }

    return freqStyle;

  }, /* getFreqStyle */


  /* Get the frequency for the given expression/reading. If the frequency is based on the
     reading then "_r" is appended to the frequency string that is returned.

     useHilitedWord - Set to true to allow the hilited word to be considered when
                      determining frequency.

     Note: frequency information comes from analysis of 5000+ novels (via
           Japanese Text Analysis Tool). */
  getFreq: function(inExpression, inReading, useHilitedWord)
  {
    var expression = inExpression;
    var reading = inReading;
    var hilitedWord = this.word; // Hilited word without de-inflection

    var freqNum = "";
    var freqStr = "";
    var freqBasedOnReading = false;

    try
    {
      var readingFreqNum = this.lookupFreqInDb(reading);
      var readingSameAsExpression = (expression == reading);
      var expressionFreqNum = readingFreqNum;

      // Don't waste time looking up the expression freq if expression is same as the reading
      if(!readingSameAsExpression)
      {
        expressionFreqNum = this.lookupFreqInDb(expression);
      }

      // If frequency was found for either frequency or reading
      if((expressionFreqNum.length > 0) || (readingFreqNum.length > 0))
      {
        // If the hilited word does not contain kanji, and the reading is unique,
        // use the reading frequency
        if(useHilitedWord
            && !readingSameAsExpression
            && !this.containsKanji(hilitedWord)
            && (readingFreqNum.length > 0)
            && (rcxData.getReadingCount(reading) == 1))
        {
          freqNum = readingFreqNum;
          freqBasedOnReading = true;
        }

        // If expression and reading are the same, use the reading frequency
        if((freqNum.length == 0)
            && readingSameAsExpression
            && (readingFreqNum.length > 0))
        {
          freqNum = readingFreqNum;
        }

        // If the expression is in the freq db, use the expression frequency
        if((freqNum.length == 0) && (expressionFreqNum.length > 0))
        {
          freqNum = expressionFreqNum;
        }

        // If the reading is in the freq db, use the the reading frequency
        if((freqNum.length == 0) && (readingFreqNum.length > 0))
        {
          freqNum = readingFreqNum;
          freqBasedOnReading = true;
        }
      }

      freqStr = freqNum;

      // Indicate that frequency was based on the reading
      if(freqBasedOnReading)
      {
        freqStr += "_r";
      }
    }
    catch(ex)
    {
      console.error("getFreq() Exception: " + ex);
      freqStr = "";
    }

    return freqStr;

  }, /* getFreq */


  /* Lookup the provided word in the frequency database. */
  lookupFreqInDb: function(word)
  {
	  console.error('lookupFreqInDb not implemented' );
	  return 0;
    var freq = "";

    try
    {
      // If we have not yet made a connection to the database
      if(this.freqDB == null)
      {
        // Get the path of the frequency database
        var freqDbPath = Components.classes["@mozilla.org/file/directory_service;1"]
        .getService(Components.interfaces.nsIProperties)
        .get("ProfD", Components.interfaces.nsILocalFile);
        freqDbPath.append("extensions");
        freqDbPath.append(rcxMain.id); // GUID of extension
        freqDbPath.append("freq");
        freqDbPath.append("freq.sqlite");

        // Is the frequency database could not be found, return
        if(!freqDbPath.exists())
        {
          return "";
        }

        // Get file pointer to the frequency sqlite database
        var freqDbFile = Components.classes['@mozilla.org/file/local;1']
         .createInstance(Components.interfaces.nsILocalFile);
        freqDbFile.initWithPath(freqDbPath.path);

        // Open the frequency database
        this.freqDB = Components.classes['@mozilla.org/storage/service;1']
         .getService(Components.interfaces.mozIStorageService)
         .openDatabase(freqDbFile);
      }

      // Reference: https://developer.mozilla.org/en-US/docs/Storage
      var stFreq = this.freqDB.createStatement(
        "SELECT freq FROM Dict WHERE expression='" + word + "'");

      try
      {
        var freqFound = stFreq.executeStep();

        if(freqFound)
        {
          freq = stFreq.row.freq;
        }
      }
      finally
      {
        stFreq.reset();
      }
    }
    catch(ex)
    {
      console.error("lookupFreqInDb() Exception: " + ex);
      freq = "";
    }

    return freq;

  }, /* lookupFreqInDb */



  /* Get the pitch accent of the last hilited word if present. If inExpression is not provided,
     will get the pitch accent for the hilited word's expression and reading */
  getPitchAccent: function(inExpression, inReading)
  {
	  console.error('getPitchAccent not implemented' );
	  return "";
    try
    {
      // If we have not yet made a connection to the database
      if(this.pitchDB == null)
      {
        // Get the path of the pitch accent database
        var pitchDbPath = Components.classes["@mozilla.org/file/directory_service;1"]
        .getService(Components.interfaces.nsIProperties)
        .get("ProfD", Components.interfaces.nsILocalFile);
        pitchDbPath.append("extensions");
        pitchDbPath.append(rcxMain.id); // GUID of extension
        pitchDbPath.append("pitch");
        pitchDbPath.append("pitch_accents.sqlite");

        // Is the pitch accent database could not be found, return
        if(!pitchDbPath.exists())
        {
          return "";
        }

        // Get file pointer to the pitch accent sqlite database
        var pitchDbFile = Components.classes['@mozilla.org/file/local;1']
         .createInstance(Components.interfaces.nsILocalFile);
        pitchDbFile.initWithPath(pitchDbPath.path);

        // Open the pitch accent database
        this.pitchDB = Components.classes['@mozilla.org/storage/service;1']
         .getService(Components.interfaces.mozIStorageService)
         .openDatabase(pitchDbFile);
      }

      // If the caller provided an expression/reading, use them, otherwise use the
      // expression/reading of the hilited word
      if(inExpression)
      {
        var expression = inExpression;
        var reading = inReading;
      }
      else
      {
        var hilitedEntry = this.lastFound;

        if ((!hilitedEntry) || (hilitedEntry.length == 0)
          || !hilitedEntry[0] || !hilitedEntry[0].data[0])
        {
          return "";
        }

        var entryData = hilitedEntry[0].data[0][0].match(/^(.+?)\s+(?:\[(.*?)\])?\s*\/(.+)\//);

        //   entryData[0] = kanji/kana + kana + definition
        //   entryData[1] = kanji (or kana if no kanji)
        //   entryData[2] = kana (null if no kanji)
        //   entryData[3] = definition

        var expression = entryData[1];
        var reading = entryData[2];
      }

      // Form the SQL used to query the pitch accent
      if(!reading)
      {
        // Reference: https://developer.mozilla.org/en-US/docs/Storage
        var stPitch = this.pitchDB.createStatement("SELECT pitch FROM Dict WHERE expression='"
          + expression + "'");
      }
      else
      {
        var stPitch = this.pitchDB.createStatement("SELECT pitch FROM Dict WHERE expression='"
          + expression + "' AND reading='" + reading + "'");
      }

      var pitch = "";

      try
      {
        stPitch.executeStep();

        // Get the result of the query
        pitch = stPitch.row.pitch;
      }
      finally
      {
        stPitch.reset();
      }

      // If user wants to hide the part-of-speech unless , or | is present
      if(rcxConfig.hidepitchaccentpos)
      {
        if((pitch.indexOf(",") == -1) && (pitch.indexOf("|") == -1))
        {
          pitch = pitch.replace(/\(.*?\)/g, "")
        }
      }

      return pitch;
    }
    catch(ex)
    {
      return "";
    }

    return "";

  }, /* getPitchAccent */


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

  // If in Super Sticky mode, allow the popup to show just once
  allowOneTimeSuperSticky: function()
  {
    if(this.superSticky)
    {
      this.superStickyOkayToShow = true;
    }

  }, /* allowOneTimeSuperSticky */


  // Toggle Super Sticky mode
  toggleSuperStickyMode: function()
  {
    this.superSticky = !this.superSticky;



  }, /* toggleSuperStickyMode */


  // Toggle EPWING mode
  toggleEpwingMode: function()
  {
  }, /* toggleEpwingMode */


  // Toggle Sanseido mode
  toggleSanseidoMode: function()
  {

  }, /* toggleSanseidoMode */


  // Parse definition from Sanseido page and display it in a popup
  parseAndDisplaySanseido: function(entryPageText)
  {

  }, /* parseAndDisplaySanseido */


 

  // Perform cleanup and reset variables after performing an EPWING search
  cleanupLookupEpwing: function()
  {
  }, /* cleanupLookupEpwing */


  // Lookup hilited word in EPWING dictionary
  lookupEpwing: function()
  {
	 
  }, /* lookupEpwing */


  // Callback that will be called when the rcxEpwing.lookupWords() function in lookupEpwing() is
  // complete. It saves the EPWING results to rcxMain.epwingResultList. If no results are found,
  // it will fallback. If results are found, it will show a popup containing the results.
  lookupEpwingPart2: function(resultList)
  {
 

  }, /* lookupEpwingPart2 */


  // Fetch entry page from sanseido, parse out definition and display
	lookupSanseido: function()
  {
   
  }, /* lookupSanseido */

  // Does the provided text contain a kanji?
  containsKanji: function(text)
  {
    for (i = 0; i < text.length; i++)
    {
      c = text[i];

      if((c >= '\u4E00') && (c <= '\u9FBF'))
      {
        return true;
      }
    }

    return false;
  },


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
          rcxMain.showTitle(tdata);
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


	inlineNames: {
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
	},


  // Configure this.inlineNames based on user settings.
  configureInlineNames: function()
  {
    this.inlineNames["DIV"] = rcxConfig.mergedivs;

  }, /* configureInlineNames */


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
		} while ((node) && (this.inlineNames[node.nodeName]));
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
			(this.inlineNames[nextNode.nodeName])) {
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
    while ((node) && (this.inlineNames[node.nodeName]));

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
			(this.inlineNames[prevNode.nodeName]))
    {
      textTemp = text;
      text = this.getInlineTextPrev(prevNode, selEndList, maxLength - text.length) + textTemp;
		}

		return text;
	},


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
		var text = this.getTextFromRange(rp, ro, selEndList, 20);
	//	console.log(text);

    // The text from the currently selection node + 50 more characters from the next nodes
		var sentence = this.getTextFromRange(rp, 0, selEndList, rp.data.length + 50);

    // 50 characters from the previous nodes.
    // The above sentence var will stop at first ruby tag encountered to the
    // left because it has a different node type. prevSentence will start where
    // the above sentence left off moving to the left and will capture the ruby tags.
    var prevSentence = this.getTextFromRangePrev(rp, 0, selEndList, 50);

    // Combine the full sentence text, including stuff that will be chopped off later.
    sentence = prevSentence + sentence;

		//this.word = text;

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
    sentence = rcxMain.trim(sentence);

		this.sentence = sentence;

		if (text.length == 0) {
			this.clearHi();
			this.hidePopup();
			return 0;
		}

		var e = rcxData.wordSearch(text);
		if (e == null) {
			this.hidePopup();
			this.clearHi();
			//console.log('exit because wordSearch return null for text: ' + text);
			return 0;
		}
		this.lastFound = [e];

    // Find the highlighted word, rather than the JMDICT lookup
		this.word = text.substring(0, e.matchLen);

		var wordPosInSentence = ro + prevSentence.length - sentenceStartPos + startOffset;

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

    // When auto play is enabled, the user must hilite a word for at least 500 ms before
    // the audio will be played.
    if(rcxConfig.autoplayaudio)
    {
      if(this.autoPlayAudioTimer)
      {
        clearTimeout(this.autoPlayAudioTimer);
        this.autoPlayAudioTimer = null;
      }

      this.autoPlayAudioTimer = setTimeout(function() { rcxMain.playJDicAudio(false) }, 500);
    }

    // If not in Super Sticky mode or the user manually requested a popup
    if(!this.superSticky || this.superStickyOkayToShow)
    {
		//console.log('ssshow')
      // Clear the one-time okay-to-show flag
      this.superStickyOkayToShow = false;

      // If we are in sanseido mode and the normal non-names, non-kanji dictionary is selected
      if(this.sanseidoMode
        && (rcxData.dicList[rcxData.selected].name.indexOf("Names") == -1)
        && (rcxData.dicList[rcxData.selected].name.indexOf("Kanji") == -1))
      {
        this.sanseidoFallbackState = 0; // 0 = Lookup with kanji form (if applicable)
        this.lookupSanseido();
      }
      // If we are in EPWING mode and the normal non-names, non-kanji dictionary is selected
      else if(this.epwingMode
        && (rcxData.dicList[rcxData.selected].name.indexOf("Names") == -1)
        && (rcxData.dicList[rcxData.selected].name.indexOf("Kanji") == -1))
      {
        if(this.epwingTimer)
        {
          clearTimeout(this.epwingTimer);
          this.epwingTimer = null;
        }

        // The user must hilite a word for at least 100 ms before the lookup will occur
        this.epwingTimer = setTimeout(function() { rcxMain.lookupEpwing() }, 0);
      }
      // Normal popup
      else
      {
		 // console.log(rcxData.makeHtml(e))
        this.showPopup(rcxMain.getKnownWordIndicatorText() + rcxData.makeHtml(e), tdata.prevTarget, tdata.pos);
      }
    }

		return 1;
	},


	showTitle: function(tdata) {
	},

	onMouseMove: function(ev) { rcxMain._onMouseMove(ev); },
	_onMouseMove: function(ev) {
		var tdata = ev.currentTarget.rikaichan;	// per-tab data
		var rp = ev.rangeParent;
		var ro = ev.rangeOffset;

/*
		var cb = this.getBrowser();
		var bbo = cb.boxObject;
		var z = cb.markupDocumentViewer ? cb.markupDocumentViewer.fullZoom : 1;
		var y = (ev.screenY - bbo.screenY);
		this.status('sy=' + ev.screenY + ' z=' + z +
			' bsy=' + bbo.screenY + ' y=' + y + ' y/z=' + Math.round(y / z));
*/
		
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
			rcxData.select(ev.shiftKey ? rcxData.kanjiPos : 0);
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
			tdata.timer = setTimeout(function() { rcxMain.showTitle(tdata) }, rcxConfig.popdelay);
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
		//if (!this.initDictionary()) return;
		var ok = this._enable(b, mode);


		if (ok) {
			if (mode == 1) {
				if (rcxConfig.enmode > 0) {
					this.enabled = 1;
					if (rcxConfig.enmode == 2) {
						this.global().rikaichanActive = true;
						this.rcxObs.notifyState('enable');
					}
				}
 
			}
		}
	},



	getSelected: function(win) {
		var text;
		var s = win.getSelection()
		if (s) {
			text = s.toString();
			if (text.search(/[^\s]/) != -1) return text;
		}
		for (var i = 0; i < win.frames.length; ++i) {
			text = this.getSelected(win.frames[i]);
			if (text.length > 0) return text;
		}
		return '';
	},

	clearSelected: function(win) {
		var s = win.getSelection();
		if (s) s.removeAllRanges();
		for (var i = 0; i < win.frames.length; ++i) {
			this.clearSelected(win.frames[i]);
		}
	},


  // Perform lookup bar search
	lookupSearch: function(text) {
		let s = text.replace(/^\s+|\s+$/g, '');
		if (!s.length) return;

		if ((this.lbLast == s) && (this.isVisible())) {
			rcxData.selectNext();
		}
		else {
			this.lbLast = s;
			rcxData.select(0);
		}

		if ((s.length == 0) || (!this.initDictionary())) {
			this.hidePopup();
		}
		else {
			let result;
			let html;
			if ((s.search(/^:/) != -1) || (s.search(/^([^\u3000-\uFFFF]+)$/) != -1)) {
				// ":word"  = force a text search of "word"
				result = rcxData.textSearch(s.replace(/^:/, ''));
			}
			else {
				result = rcxData.wordSearch(s, true);
			}
			if (result) {
				html = rcxData.makeHtml(result);
				this.lastFound = [result];
			}
			else {
				html = '\u300C ' + s + ' \u300D was not found.';
				this.lastFound = [];
			}
			this.lastFound.fromLB = 1;

			let kanji = '';
			let have = {};
			let t = s + html;
			for (let i = 0; i < t.length; ++i) {
				let c = t.charCodeAt(i);
				if ((c >= 0x3000) && (c <= 0xFFFF)) {
					c = t.charAt(i);
					if (!have[c]) {
						result = rcxData.kanjiSearch(c);
						if (result) {
							this.lastFound.push(result);
							have[c] = 1;
							kanji += '<td class="q-k">' + rcxData.makeHtml(result) + '</td>';
						}
					}
				}
			}

			this.showPopup('<table class="q-tb"><tr><td class="q-w">' + this.getKnownWordIndicatorText()
        + html + '</td>' + kanji + '</tr></table>', null, null, true);
		}
	},

	statusTimer: null,

};

/*
var rcxLookupBar = {
};
*/

var rcxConfig = {
	observer: {
		observe: function(subject, topic, data) {
			rcxConfig.load();
		},
		start: function() {
		},
		stop: function() {
		}
	},

	load: function() {
		let p = new rcxPrefs();

		// fix 1.xx -> 2.xx
		try {
			if (p.branch.getPrefType('wpos') != p.branch.PREF_BOOL) {
				p.branch.clearUserPref('wpos');
			}
		}
		catch (ex) {
		}

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

		rcxData.loadConfig();

	}
};

rcxMain.init();
