
var request = require('request');
var fs = require('fs');

var word_chunks = [];

function wordChunkLoader() {
 
    var dir = './library'
    var files = fs.readdirSync(dir);
    for(var i in files){
        if (!files.hasOwnProperty(i)) continue;
        var name = dir+'/'+files[i];
        //console.log(name)
        if (!fs.statSync(name).isDirectory() && name.substr(name.length-3, 3)=="txt"){
          //console.log(name)
            //fileList.push(name);

        fs.readFile(name, 'utf8', (err, data) => {
          if (err) throw err;
          word_chunks = word_chunks.concat(data.split('\n\n'));
          //console.log("Loaded " + name + " chunks :)"+word_chunks.length);
        
        });

        }

        
      }
      console.log("Finished loading word chunks");
    }

  //console.log(fileList)

	// fs.readFile('./library/Ulysses.txt', 'utf8', (err, data) => {
 //  		if (err) throw err;
 //  	    word_chunks = word_chunks.concat(data.split('\n\n'));
 //  	    console.log("Loaded Ulysses chunks :)"+word_chunks.length);
	// });

	// fs.readFile('./library/Grimms_Tales.txt', 'utf8', (err, data) => {
 //  		if (err) throw err;
 //  	    //word_chunks = data.split('\n\n');
 //  	    word_chunks = word_chunks.concat(data.split('\n\n'));
 //  	    console.log("Loaded Grimm Chunks :)"+word_chunks.length);
	// });
//}

function slicer(){
   //var words = ["one", "two", "three", "four", "five"];
    if (word_chunks.length == 0) {
        wordChunkLoader();
    }

	words = [];
	var wordsToAdd = 25;
	var index = parseInt((Math.random()*1000000)%word_chunks.length);
    
	while (wordsToAdd>0) {
		if (index>=word_chunks.length) {  //handle wraparound.
			index = 0;
		}

    word_chunks[index] = word_chunks[index].replace(/(?:\r\n|\r|\n)/g, ' ');

		if ((Math.random()*10)&1 == 1) {
			var chunkWords = word_chunks[index].split(' ');
			var chunkIndex = 0;

			while (chunkIndex<chunkWords.length-3) {
				var wordsInTile = parseInt((Math.random()*1000)%3);
				var magnetText = "";
				while (wordsInTile >= 0) {
					if (!chunkWords[chunkIndex]) {
                        wordsInTile = 0
                    } else {
    					if (chunkWords[chunkIndex] != " ") {
    						if (magnetText != "") {
                                chunkWords[chunkIndex] = (chunkWords[chunkIndex]).toLowerCase();
                            }
                magnetText += ((chunkWords[chunkIndex++]).trim())+'&nbsp';
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