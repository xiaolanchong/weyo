

const rcxMyDataZ = {
	/*
	  @param word  text up to the . ? ! etc.
	  @param noKanji 
	  @return entity passed to makeHtml function
	*/
	wordSearch: function(word, noKanji) {
		//console.log('This lookup word ---- ' + word);
		if (this.fake) {
			dentry = '';
			reason = "<polite";
			return { data: [[dentry, reason]], matchLen: 3, more: 0, name: 0 };
		}
		else {
			return this.rcxData.wordSearch(word, noKanji);
		}
	},
	
	// entry returned by wordSearch
	makeHtml: function(entry) {
		if (this.fake) {
			return '<pre>So it is a window!</pre>'
		} else {
			return this.rcxData.makeHtml(entry);
		}
	},
	
	/*
	@param dictNumber dictionary number
	*/
	select: function(dictNumber) {
		return rcxData.select(dictNumber);
	},

	loadConfig: function(rcxConfig, rcxData) {
		this.rcxConfig = rcxConfig;
		this.rcxData = rcxData;
		this.rcxData.loadConfig(this.rcxConfig);
	},
	
	rcxConfig: null,
	rcxData: null,
	
	// kanji dictionary number, rcxData.kanjiPos
	kanjiPos: 0,
	
	// my data
	fake: false,
};

var rcxConfigZ = {
	enmode: 3,
	startsupersticky: false,
	css: 'popup-blue.css',
	resizedoc: false,
	opacity: 100,
	roundedcorners: true,
	mergedivs: true,
	highlight: true,
	popdelay: 20,
	title: true,

	wmax : 3, 
	namax : 3,
	
	kindex: '1',
	hidex: false,
	hidedef: false,
	showpitchaccent: false,
	showfreq: false,
	wpop: 3,
	wpos: 3,
	
	load: function() { rcxMyDataZ.loadConfig(rcxConfigZ, rcxData); },
};

rcxMain.init(rcxConfigZ, rcxMyDataZ);
