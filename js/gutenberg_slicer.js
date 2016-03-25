var request = require('request');
var fs = require('fs');
var word_chunks = [];

var refreshCount = 0;


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

function slicer() {
    console.log("Inside slicer");
    if (word_chunks.length == 0) {
        console.log("NO CHUNKS! NEED LOADER");
        wordChunkLoader();
    }

    words = [];
    var wordsToAdd = 25;
    var index = parseInt((Math.random()*1000000)%word_chunks.length);

    var wordCount = 0;

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
                        //wordsInTile = 0
                        wordsInTile = -1
                    } else {
                        if (chunkWords[chunkIndex] != " ") {
                            if (magnetText != "") {
                                chunkWords[chunkIndex] = (chunkWords[chunkIndex]).toLowerCase();
                            }

                            magnetText += ((chunkWords[chunkIndex++]).trim());
                            if (wordsInTile != 0){
                                magnetText += '&nbsp';
                            }


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
    console.log("MADE WORD BANK INSIDE SLICER");
    return words
}

exports.g_slicer = slicer;
exports.loadWordChunks = wordChunkLoader;