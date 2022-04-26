#!/bin/node
const fs = require('fs')

function puts(x, y = null) {
   if (y) {
      console.log(x, y);
      return;
   }
   console.log(x);
}


function randInt(max, min = 0) {
   return Math.floor(Math.random() * (max - min) + min);
}

function buildProbabilityMap(tileset) {
   let arr = [];
   arr.push( new Array(tileset.length).fill(1.0) );  
   for(let k=1; k < tileset.length; ++k) {
      arr.push( new Array() );
      for(let j=0; j < tileset.length; ++j) {
         arr[arr.length-1].push(Math.random());
      }
   }
   return arr;
}


class Board {
   board = [];
   width;
   height;
   cells;
   tileset;
   probMap;
   constructor(width = 25, height = 25, tileset, probMap) {
      this.width = width;
      this.height = height;
      this.tileset = tileset;
      this.probMap = (probMap) ? probMap : buildProbabilityMap(tileset);
      for (let x = 0; x < width; ++x) {
         let row = [];
         for (let y = 0; y < height; ++y) {
            // arr.push(new Array(height).fill(filler));
            row.push({
               idx: 0, // tile index
               prob: new Array(tileset.length).fill(1.0), // <=> Prob-Matrix-Row (simple array)
               pos: { x: x, y: y }
            });
         }
         this.board.push(row);
      }
      this.cells = this.board.flat(1);
      // "connect" neighbors
      this.cells.forEach( cell => {
         //cell.neighbors = this.getNeighbors(cell);
         cell.neighbors = [];

         for(let x = -1; x <= 1; ++x) {
            for(let y = -1; y <= 1; ++y) {
               if(0 == x && 0 == y) continue;
               const nx = this.normX(cell.pos.x + x);
               const ny = this.normY(cell.pos.y + y);
               // puts(`nx:${nx}, ny: ${ny}`);
               cell.neighbors.push(this.board[nx][ny]);
            }
         }

      });
   }

   normX(x) {
      let dump = x % this.width;
      if (0 > dump) dump += this.width;
      return dump;
   }

   normY(y) {
      let dump = y % this.height;
      if (0 > dump) dump += this.height;
      return dump;
   }


   draw() {
      const line = (new Array(this.height+2).fill("-")).join("");
      //puts(line);
      this.board.forEach( row => puts( "|" + row.map( cell => this.tileset[cell.idx] ).join("") + "|" ));
      //puts(line);
   }

   printRule() {
      // escape tileset
      let escaped = this.tileset.join("");
      escaped = escaped.replaceAll(';', '\\\;');
      escaped = escaped.replaceAll('?', '\\\?');
      escaped = escaped.replaceAll('\"', '\\\"');
      escaped = escaped.replaceAll('\"', '\\\'');
      
      puts(`${this.probMap.map(row => row.join(",")).join("\\;")} ${escaped}`);
   }

   /*
      water grass bushes trees

       w g b t
     w 1 1 0 0
     g 1 1 1 0
     b 0 1 1 1
     t 0 0 1 1
   */

   // get a probability row in 2d matrix by idx.
   // For example if we have a "grass" tile we
   // need the probs for, we choose the row beginning with "g" above.
   getProbCollapsed(idx) {
      return this.probMap[idx]; //now that I look at it, this method is a bit much
   }

   //obs! pull into constructor
   /*
      getNeighbors(cell) {
         puts("+++getNeighbors");
         let arr = [];
         for(let x = -1; x <= 1; ++x) {
            for(let y = -1; y <= 1; ++y) {
               if(0 == x && 0 == y) continue;
               const nx = this.normX(cell.pos.x + x);
               const ny = this.normY(cell.pos.y + y);
               console.log(`nx:${nx}, ny: ${ny}`);
               arr.push(this.board[nx][ny]);
            }
         }
         try{
            puts("returning ", arr.map( cell => `${cell.pos.x}, ${cell.pos.y}` ));
         }catch(er){
            // ignore
            //puts(arr.map(c => c.pos));
            puts(JSON.stringify(arr,null, 3));
         }
         return arr;
      }
   */
}

function printCell(cell) {
   puts(`idx:${cell.idx}, pos:(${cell.pos.x}, ${cell.pos.y}), score: ${cell.score.toFixed(2)}, prob: ${cell.prob.map( x => x.toFixed(2) ).join(",")}`);
}


function step(board) {
   board.cells.forEach( cell => {
      // cell.prob = cell.neighbors.map( other => other.prob )
      // .reduce((p, q) => {
      //    let arr = [];
      //    for(let k = 0; k < p.length; ++k)
      //       arr.push(p[k] * q[k]);
      //    return arr;
      // }, new Array(board.tileset.length));
      //console.log(cell);
      cell.prob = cell.neighbors.map( other => board.probMap[other.idx])
                  .reduce((p, q) => {
                     // puts( "p;q", p.map( x => x.toFixed(2) ).join(",") + " | " + q.map( x => x.toFixed(2)).join(",") );
                     let arr = [];
                     for(let k = 0; k < p.length; ++k) arr.push(p[k] * q[k]);
                     return arr;
                  }, (new Array(board.tileset.length)).fill(1) );
      // puts("computed cell prob:", cell.prob.map( x => x.toFixed(2)));
      // ok, now that we have computed the probabilities I guess
      // we just need to compute the actual wave collapse...
      // This means choosing a cell by random which has non-all-100%
      // probability. I think the guy suggested using the one with the
      // smallest cumulative probability, ergo sort all cells by
      // sum(cells.reduce( v,w => v.prob.reduce + w.prob.reduce ));
      // and then going from there... I would like to take a different
      // approach where each non-all-100% cells have an associated
      // probability of being chosen, but I guess this approach is a bit easier
      cell.score = cell.prob.reduce((v,w) => v + w, 0);
   });

   let sorted = board.cells.filter( cell => cell.idx == 0 )
                           .sort( (v,w) =>  v.score - w.score );

   // how about instead of sorting the whole array, we just choose the first
   // determinable & zero cell,
   // puts("sorted:");
   // sorted.map( x => printCell(x) );

   let head = sorted[0];
   // puts("head:", head);

   //doesn't seem all that faster tbh. I wonder where we're using up all our cycles in...
   // let head = board.cells.find( c => (c.idx == 0) && (c.score < board.tileset.length));

   if(!head) {
      return false;
      //throw new Error("No head found."); // ...or we are done, I suppose
   }
   //0123456789ABCDEF
   //   `    `    `
   //      ^

   // determine which prob we hit:
   head.idx = (function (prob) {
      // roll the dice...
      const rulerLength =  prob.reduce((v,w) => v+w, 0);
      // puts("rulerLength", rulerLength);
      // puts("probs: [\n", prob.join("\n") + "\n]");

      const roll = Math.random() * rulerLength; // we might be able to normalize earlier on, but lets worry about that later
      // puts("roll:", roll);
      let accum = prob[0];
      let idx = 0;
      for(;accum < roll; ++idx) {
         // puts("accum", accum);
         accum += prob[idx];
      }
      if(idx > (prob.length-1)) idx = prob.length - 1;
      return idx;
      // let idx = 0;
      // while(true) { // TODO make this less ugly
      //    puts(`${roll}:roll < ${accum}:accum ?`);
      //    if(roll < accum) {
      //       puts("...yes");
      //       accum += prob[idx++];
      //    }else{
      //       puts(`...no, returning ${idx}`);
      //       return idx;
      //    }
      //    if(idx > 8) {
      //       puts("somthing went wrong. idx too big");
      //       return idx;
      //    }
      // }
      // puts("...apparently all was too small");
      // return idx;
   })(head.prob);

   // puts("head.idx:", head.idx);
   return true;
}

// let tileset = [" ", "#", "@", "$", "%", "^", ":", "\"", "'", ",", "." ];
// let tileset = [" ", "@", "^", ":", ",", "." ];
let tileset = [...".:.0.%#T"];

//let tileset = [" ", ".", ",", ";", ":", "?", "#" ];
// let tileset = [" ", ".", ":", "S" ]
let probMap = null;
// look if we have any data to load
const argv = process.argv.slice(2);
if(argv.length > 0) {
   probMap = argv[0].split(";").map(x => x.split(",").map(parseFloat));
   puts("LOADED probMap", probMap);
   if(argv.length > 1) {
      tileset = [" ", ...argv[1]];
      puts("LOADED tileset", tileset);
   }
}

let board = new Board(32, 90, tileset, probMap);

//set random seed;

const origin = board.board[randInt(board.width)][randInt(board.height)];
// origin of course cannot be zero, or else it fails to seed.
origin.idx = 1 + Math.floor(Math.random()*(board.tileset.length - 1));

// puts("origin", origin);

   board.draw();
   for(let k = 0; k < 5024 && step(board);) {
      if((++k % 50) == 0) {
         board.draw();
      }
   }
   board.draw();
   board.printRule();


/*
   TODO: we can have a list of cells: undetermined cells. 
   Each iteration we can make it smaller by kicking out 
   determined cells from the list, possibly improving performance.
*/





