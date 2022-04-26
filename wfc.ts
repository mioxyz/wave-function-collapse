// import argv from "process.argv";


class Cell {
   idx: number;
   pos_x: number;
   pos_y: number;
   crowded: number; // aka "mature neightbor count", aka "differentiated neightboring cell count"
   prob: Array<number>;
   neighbors: Array<Cell>;
   game: Game;

   constructor(game: Game, pos_x: number, pos_y: number, probLength: number, idx: number = null) {
      this.pos_x = pos_x;
      this.pos_y = pos_y;
      this.prob = new Array<number>(probLength).fill(1.0);
      this.idx = (idx) ? idx : 0;
      this.game = game;
      this.crowded = 0;
   }

   getProbRow():Array<number> { return this.game.probMap[this.idx] }

   collapse(newIdx):void
   {
      // console.log("+++collapse()");
      this.idx = newIdx;
      this.game.border.delete(this);
      this.neighbors.forEach( neighbor => {
         if(0 == neighbor.idx) {
            zipMultiply(neighbor.prob, this.getProbRow());
            neighbor.crowded += 1;
            this.game.border.add(neighbor);
         }
      });
   }
}

class Game {
   width: number;
   height: number;

   tileset: Array<string>;
   probMap: Array<Array<number>>;    // 2d probability Matrix, think: "cartesian prod. of tileset"

   board: Array<Array<Cell>>;        // 2d structured "board of cells"
   border: Set<Cell>                 // any undifferentiated cell with (crowded > 0).
   //collapsed: Array<Array<boolean>>; // 2d structured, is true for collapsed[x][y] if cell has been collapsed.
   cells: Array<Cell> = [];          // 1d unstructured, cells
   // differentiated:Array<Cell>;    // 1d unstructured cells array aka collapsed

   // prev: Cell;                    // previously collapsed cell

   line:string; 

   constructor(width: number = 25, height: number = 25, tileset: Array<string>, probMap: Array<Array<number>> = null)
   {
      this.board = [];
      // this.collapsed = [];
      this.width = width;
      this.height = height;
      this.tileset = tileset;
      this.border = new Set<Cell>();
      this.probMap = (probMap) ? probMap : buildProbabilityMap(tileset.length);
      this.line = (new Array(this.height + 2).fill("-")).join("");
      for (let x = 0; x < width; ++x) {
         let row = [ ];
         for (let y = 0; y < height; ++y) {
            let cell = new Cell(this, x, y, tileset.length);
            this.cells.push(cell);
            row.push(cell);
         }
         // this.collapsed.push((new Array(height)).fill(false));
         this.board.push(row);
      }
      // this.cells = this.board.flat(1);
      // "connect" neighbors
      this.cells.forEach( cell => {
         cell.neighbors = [];
         for (let x = -1; x <= 1; ++x) {
            for (let y = -1; y <= 1; ++y) {
               if (0 == x && 0 == y) continue;
               const nx = (function(x, width) {
                  let dump = x % width;
                  if (0 > dump) dump += width;
                  return dump;
               })(cell.pos_x + x, width);

               const ny = (function(y, height) {
                  let dump = y % height;
                  if (0 > dump) dump += height;
                  return dump;
               })(cell.pos_y + y, height);

               // console.log(`(nx:${nx}, ny:${ny})`);

               cell.neighbors.push(this.board[nx][ny]);
            }
         }

      });
   }


   execute(step: Function, count = 1, printInterval = 0): void {
      if(printInterval > 0) {
         for (let k = 0; k < count; ++k) {
            if(0 == (k % printInterval)) this.draw();
            if(!step(this)) break;
         }
      }else{
         for (let k = 0; k < count; ++k) {
            if(!step(this)) break;
         }
      }
   }

   draw(): void {      
      // console.log(this.line);
      this.board.forEach(row => console.log("|" + row.map(cell => this.tileset[cell.idx]).join("") + "|"));
   }

   printRule(): void {
      // escape tileset, mostly
      // let escaped = this.tileset.join("")
      //             .split(';').join("\\;")
      //             .split("?").join("\\?")
      //             .split("\"").join("\\\"")
      //             .split("\'").join("\\\'");

      let escaped = this.tileset.join("").split("\"").join("\\\"");
      console.log(`${this.probMap.map(row => row.join(",")).join("\\;")} "${escaped}"`);
   }

   getRandomCell() {
      return this.cells[Math.floor(Math.random() * this.cells.length)];
   }


}



function buildProbabilityMap(tilesetLength: number): Array<Array<number>> {
   let arr = [];
   arr.push(new Array(tilesetLength).fill(1.0));
   for (let k = 1; k < tilesetLength; ++k) {
      arr.push(new Array());
      for (let j = 0; j < tilesetLength; ++j) {
         arr[arr.length - 1].push(Math.random());
      }
   }
   return arr;
}



function zipMultiply(recipient, donor) {
	try {
		for (let k = 0; k < recipient.length; ++k)
			recipient[k] *= donor[k];
	} catch (error) {
      if(!recipient) throw new Error("no recipient!");
      if(!donor) throw new Error("no donor!");
		if (recipient.length != donor.length) {
			throw new Error("recipient and donor lengths need to be the same!");
		}
		throw error;
	}
}


function rollIdx(prob)
{
   let idx = 0;
   const rulerLength =  prob.reduce((v,w) => v+w, 0);
   const roll = Math.random() * rulerLength;

   let accum = prob[0];

   for(;accum < roll; ++idx) accum += prob[idx];

   if(idx > (prob.length-1)) return prob.length - 1;

   return idx;
}


function step(game:Game)
{
   let mostCrowded = 0;
   let mostCrowdedCell = null;
   game.border.forEach( function(cell) {
      if(cell.crowded > mostCrowded)
      {
         mostCrowdedCell = cell;
         mostCrowded = cell.crowded;
      }
   });
   if(!mostCrowdedCell) return false;
   mostCrowdedCell.collapse( rollIdx(mostCrowdedCell.prob) );
   return true;
}


function parseParams(game) {
   console.log("+++parseParams");
   const argv = process.argv.slice(2);

   if(argv.length > 0) {
      game.probMap = argv[0].split(";").map(x => x.split(",").map(parseFloat));
      console.log("LOADED probMap", game.probMap);
      if(argv.length > 1) {
         // game.tileset = [" ", ...argv[1]]; // we don't want normal whitespace char to be a special character anymore.
         game.tileset = [...argv[1]];
         console.log("LOADED tileset", game.tileset);
      }
   }
   
}


function main() {
   //const tileset = [..."? ,'*#»«%^"];
   const tileset = [..."? ,;:%"]
   const game = new Game(45, 128, tileset);
   parseParams(game);
   const nucleus = game.getRandomCell();
   nucleus.collapse(Math.floor(Math.random() * tileset.length));
   game.execute(step, 50000, 0);
   game.draw();
   game.printRule();
}


main();
