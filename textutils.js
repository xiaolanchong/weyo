

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
				if (sentence[i] == "?" || sentence[i] == "\n" || sentence[i] == "?" || sentence[i] == "!")
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
				if (sentence[i] == "?" || sentence[i] == "\n" || sentence[i] == "?" || sentence[i] == "!")
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
	
	///////////////////////////
	
	// doc  document
	// @param rp - The currently selected node
	// @param ro - The position of the hilited text in the currently selected node
	// @param matchLen - int, number of symbols matched
	// @param selEndList - selection end data
	// @param tdata   - tdata.selText attr
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
