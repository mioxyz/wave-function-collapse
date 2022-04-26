#!/bin/node
const fs = require('fs')

function randomNumberBetween(min, max) {
   return Math.floor( Math.random() * (max - min) + min);
}

class Board {
   board = [];
   constructor(width = 25, height = 25, tileset) {
      for(let x = 0; x < width; ++x) {
         let row = [];
         for(let y = 0; y < width; ++y) {        
            // arr.push(new Array(height).fill(filler));
            row.push({

            });
         }
         this.board.push(row);
      }
   



   }
   
}



// function buildBoard(width = 25, height = 25, filler = ' ') {
//    let arr  = [];
//    for(let k = 0; k < width; ++k) {
//       arr.push(new Array(height).fill(filler));
//    }
//    return arr;
// }

// function generateCellTileProbabilityArrays(width = 25, height = 25, tiles) {
//    let arrX = [];
//    for(let k = 0; k < width; ++k) {
//       //arr.push(new Array(height).fill(filler));
//       let arrY = [];
//       for(let j = 0; j < height; ++j) {
//          tiles.forEach( tile =>
//             arrY.push(new Array(tiles.length).fill(1.0))
//          );
//       }
//       arrX.push(arrY);
//    }
//    return arrX;
// }

// function drawBoard(board) {
//    board.forEach(row => console.log(row.join('')));
//}



function step(board, ctp) {
   // compute new ctp values


}

function main() {
   console.log("+++main");
   const width = 25;
   const height = 25;
   let board = buildBoard();
   let tiles = [' ', '@', '#', '$', '^', '&', '*', '.', ',', ';', ':'];
   let pta = [ ];
   // generate probability array template
   tiles.forEach( tile => {
      let arr = [];
      for(let k = 0; k < tiles.length; ++k)
         arr.push(Math.random()); // TODO add weight bias for if tile is itself.
      pta.push(arr);
   });

   // generate cell tile probability
   ctp = generateCellTileProbabilityArrays();


   let origin = { x: randomNumberBetween(0, width), y: randomNumberBetween(0, height) };
   board[origin.x][origin.y] = tiles[randomNumberBetween(1, tiles.length)];
   drawBoard(board);
   step(board, ctp);

   /* battle plan
      in the beginning all cells can be anything.
      Their value is ' '  aka void, so their differentiation
      potential is greatest.
      We can look at the cartesian product of tile types
      and each tuple is assigned a probability value [0,1) <- |R
      which is to say the probability of neighboring tiles to change into
      said other tile.
      -> it just occurred to me that these aren't real probabilities, since
      we need to consider all tiles simultaneously. If we have e.g. 5 tiles
      of probabilities 0.9, 0.8, 0.7 then these won't add up to 0. Maybe
      there is a clever way of fixing this, but the "dirty" way is by just
      allowing the cumulative value to be some number N, and then laying
      out the probabilities next to eachother on a ruler of size N,
      rolling some random number r <- (0,N) and thereby choosing a tile 
      (this normalizes stuff into the range (0,1) thereby).

      [  0.9   ][  0.7 ][0.3][.2]
                  ^-r           \N

      To get the cumulative probability score of a cell, we simply multiply the
      values together of all neighboring cells.
      Despite this not being a true probabillity it being smaller than 1 give
      us nice qualities we need
      This too can be randomized, that is the 2d grid of random prob vals.
      1. choose a cell to collapse
      2. update the
   */

}


main();











