/*
 Game logic module
 Exports:
  - createGame(cols, rows)
*/
export function createGame(cols = 7, rows = 6){
  const board = Array.from({length:rows}, ()=>Array(cols).fill(0)); // 0 empty, 1 p1, 2 p2
  let current = 1;
  let over = false;
  let winner = 0;

  function drop(col){
    if(over) return {ok:false,reason:'over'};
    if(col < 0 || col >= board[0].length) return {ok:false,reason:'col'};
    for(let r=board.length-1;r>=0;r--){
      if(board[r][col]===0){
        board[r][col]=current;
        const w = checkWin(r,col);
        const full = isFull();
        if(w){
          over = true; winner = current;
        } else if(full){
          over = true; winner = 0;
        } else {
          current = 3 - current;
        }
        return {ok:true,row:r,col,player:board[r][col],winner,over};
      }
    }
    return {ok:false,reason:'full'};
  }

  function isFull(){
    return board[0].every(c=>c!==0);
  }

  function reset(){
    for(let r=0;r<board.length;r++) for(let c=0;c<board[0].length;c++) board[r][c]=0;
    current=1; over=false; winner=0;
  }

  function getState(){ return {board:board.map(row=>row.slice()),current,over,winner,cols:board[0].length,rows:board.length} }

  function checkWin(r0,c0){
    const me = board[r0][c0];
    if(me===0) return false;
    const dirs = [[0,1],[1,0],[1,1],[1,-1]];
    for(const [dr,dc] of dirs){
      let count=1;
      for(let s=1;s<4;s++){
        const r=r0+dr*s, c=c0+dc*s;
        if(r<0||r>=board.length||c<0||c>=board[0].length||board[r][c]!==me) break;
        count++;
      }
      for(let s=1;s<4;s++){
        const r=r0-dr*s, c=c0-dc*s;
        if(r<0||r>=board.length||c<0||c>=board[0].length||board[r][c]!==me) break;
        count++;
      }
      if(count>=4) return true;
    }
    return false;
  }

  return {drop,reset,getState};
}