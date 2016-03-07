
var request = require('request');
var fs = require('fs');

var word_chunks = [];

function wordChunkLoader() {
	fs.readFile('./Ulysses', 'utf8', (err, data) => {
  		if (err) throw err;

  	    word_chunks = data.split('\n\n');
  	    console.log("Loaded Ulysses chunks :)"+word_chunks.length);
	});

	fs.readFile('./Kama_Sutra', 'utf8', (err, data) => {
  		if (err) throw err;

  	    //word_chunks = data.split('\n\n');
  	    word_chunks.push(data.split('\n\n'));
  	    console.log("Loaded Kama Sutra chunks :)"+word_chunks.length);
	});
}

function slicer(){
   //var words = ["one", "two", "three", "four", "five"];

   if (word_chunks.length == 0){
   	wordChunkLoader();
   }

   /*
    //Ulysses
    request.get('http://www.gutenberg.org/cache/epub/4300/pg4300.txt', function (error, response, body) {
   	 if (!error && response.statusCode == 200) {
        var textToSlice = body;
       // console.log(textToSlice);

       //scan looking for substring *-- I --*
       // ending substring is *End of the Project Gutenberg EBook*
      // console.log("Text length: "+textToSlice.length);

       var textLines = textToSlice.slice('\n');

       console.log("Ulysses Text lines: "+textLines.length);


       var startDelimiter = "-- I --";
       var endDelimiter = "End of the Project Gutenberg EBook";

       // scan, randomly replacing spaces with a sigil (maybe count 1, 2 or 3 spaces)
       // split by this sigil 

     }
	});

     //Kama Sutra
	request.get('http://www.gutenberg.org/cache/epub/27827/pg27827.txt', function (error, response, body){
		if (!error && response.statusCode == 200) {
			var textToSlice = body;
       // console.log(textToSlice);

       //scan looking for substring *-- I --*
       // ending substring is *End of the Project Gutenberg EBook*
      // console.log("Text length: "+textToSlice.length);

       		var textLines = textToSlice.slice('\n');

       		console.log("Kama Sutra Text lines: "+textLines.length);


       		var startDelimiter = "-- I --";
       		var endDelimiter = "End of the Project Gutenberg EBook";

       // scan, randomly replacing spaces with a sigil (maybe count 1, 2 or 3 spaces)
       // split by this sigil 
		}
	});
	*/

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
					magnetText += chunkWords[chunkIndex++]+" ";
					wordsInTile--;
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