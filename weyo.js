
function makeDefinition(word, meaning, add_margin) {
	let html = '';
	const meanings = meaning.split('||');
	//console.log('' + add_margin);
	html += '<div>';
	html += '<div class="w-kanji">' + word + '</div>';

	for(let i = 0; i < meanings.length; ++i) {
		def_and_samples = meanings[i].split('/');
		for(let j = 0; j < def_and_samples.length; ++j) {
			//html += '<tr><td class="w-def">';
			if(j>0) {
				html += "<div style=\"color: wheat\">"; // samples
			}
			else {
				html += "<div " + (i>0 ? "style=\"margin-top: 6px\"" : "") + ">"; // samples
			}
			html += def_and_samples[j];
			html += "</div>";		
		}
	}
	html += '</div>';
	return html;
}


const rcxMyDataZ = {
	/*
	  @param word  text up to the . ? ! etc.
	  @param noKanji 
	  @return entity passed to makeHtml function, null if nothing found
	*/
	wordSearch: function(word, noKanji) {
		let entries = [];
		let max_match = 0;
		for(let i = word.length; i >= 1; --i) {
			let subs = word.substr(0, i);
			let meaning = dalmaDict[subs];
			if(meaning) {
				if(max_match == 0) {
					max_match = i;
				}
				entries.push([subs, meaning]);
				// only 1st matching
				break;
			}
		}
		//	dentry = '';
		//	reason = "<polite";
		if(entries.length == 0)
			return null;
		else
			return { data: entries, matchLen: max_match, more: 0, name: 0 };
	},
	
	// entry returned by wordSearch
	makeHtml: function(entry) {
		if (entry.data.length == 0) {
			return "";
		}
		let html = '<div>';
		for(let i = 0; i < entry.data.length; ++i) {		
			const word = entry.data[i][0];
			const meaning = entry.data[i][1];
			//if(i >0) console.log('' + 'YYYY');
			html += makeDefinition(word, meaning, i > 0);
		}
		html += '</div>';
		return html;
	},
	
	/*
	@param dictNumber dictionary number
	*/
	select: function(dictNumber) {

	},

	loadConfig: function(rcxConfig) {
		this.rcxConfig = rcxConfig;
		//this.rcxData.loadConfig(this.rcxConfig);
	},
	
	rcxConfig: null,
	
	// kanji dictionary number, rcxData.kanjiPos
	kanjiPos: 0,
	
	// my data
	fake: true,
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
	title: false,

	wmax : 3, 
	namax : 3,
	
	kindex: '1',
	hidex: false,
	hidedef: false,
	showpitchaccent: false,
	showfreq: false,
	wpop: 3,
	wpos: 3,
	
    allowedSymbols: function(charCode) { return true; },
	
	load: function() { rcxMyDataZ.loadConfig(rcxConfigZ); },
};

rcxMain.init(rcxConfigZ, rcxMyDataZ);