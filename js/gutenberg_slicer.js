
var request = require('request');
var fs = require('fs');

var word_chunks = [];

function wordChunkLoader() {
	fs.readFile('./library/Ulysses.txt', 'utf8', (err, data) => {
  		if (err) throw err;
  	    word_chunks = word_chunks.concat(data.split('\n\n'));
  	    console.log("Loaded Ulysses chunks :)"+word_chunks.length);
	});

	fs.readFile('./library/Grimms_Tales.txt', 'utf8', (err, data) => {
  		if (err) throw err;
  	    //word_chunks = data.split('\n\n');
  	    word_chunks = word_chunks.concat(data.split('\n\n'));
  	    console.log("Loaded Grimm Chunks :)"+word_chunks.length);
	});
}

function slicer(){
   //var words = ["one", "two", "three", "four", "five"];
    if (word_chunks.length == 0) {
        wordChunkLoader();
    }

	words = [];
	var wordsToAdd = 25;
	//var index = 0;
	var index = parseInt((Math.random()*1000000)%word_chunks.length);
	//console.log("index: " + index);
    
	while (wordsToAdd>0) {
		if (index>=word_chunks.length) {  //handle wraparound. For now we'll only use Ulysses
			index = 0;
		}

		if ((Math.random()*10)&1 == 1) {
			var chunkWords = word_chunks[index].split(' ');
			var chunkIndex = 0;

			while (chunkIndex<chunkWords.length) {
				var wordsInTile = parseInt((Math.random()*1000)%3);
				var magnetText = "";
				while (wordsInTile > 0) {
					if (!chunkWords[chunkIndex]) {
                        wordsInTile = 0
                    } else {
    					if (chunkWords[chunkIndex] != " ") {
    						if (magnetText != "") {
                                chunkWords[chunkIndex] = chunkWords[chunkIndex].toLowerCase();
                            }
    						//magnetText += chunkWords[chunkIndex++]+" ";
                magnetText += chunkWords[chunkIndex++]+'&nbsp';
    						wordsInTile--;
    					} else {
    						chunkIndex++;
    					}
    				}
				}
				if (magnetText != "") {
					words.push(magnetText);
					wordsToAdd--;
				}
				chunkIndex += 4;  //We don't want to have too many tiles from one text chunk :)
			}
		}
		index++;
	}
    return words
}

exports.g_slicer = slicer;
exports.loadWordChunks = wordChunkLoader;