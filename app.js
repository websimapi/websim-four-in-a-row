import { createGame } from './game.js';

const DEFAULT_COLS = 7;
const DEFAULT_ROWS = 6;

const root = document.getElementById('boardContainer');
const turnEl = document.getElementById('turnIndicator');
const restartBtn = document.getElementById('restart');

let cols = DEFAULT_COLS, rows = DEFAULT_ROWS;
let game = createGame(cols, rows);

function buildBoard(cols, rows){
  root.innerHTML = '';
  const boardWrap = document.createElement('div');
  boardWrap.className = 'board';
  // expose rows/cols to CSS so the board can compute an appropriate --cell-size that fits the viewport
  boardWrap.style.setProperty('--rows', rows);
  boardWrap.style.setProperty('--cols', cols);
  // set grid template
  boardWrap.style.gridTemplateColumns = `repeat(${cols}, var(--cell-size))`;
  boardWrap.style.gridTemplateRows = `repeat(${rows}, var(--cell-size))`;
  boardWrap.setAttribute('role','grid');

  // create cells row-major (top-left first)
  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){
      const cell = document.createElement('button');
      cell.className = 'cell';
      cell.dataset.r = r;
      cell.dataset.c = c;
      cell.setAttribute('aria-label', `Column ${c+1}`);
      cell.style.touchAction = 'manipulation';
      const hole = document.createElement('div');
      hole.className = 'hole';
      const disc = document.createElement('div');
      disc.className = 'disc empty';
      hole.appendChild(disc);
      cell.appendChild(hole);
      cell.addEventListener('click', ()=>handleColumnClick(c));
      cell.addEventListener('touchstart', (e)=>{ e.preventDefault(); handleColumnClick(c); }, {passive:false});
      boardWrap.appendChild(cell);
    }
  }
  root.appendChild(boardWrap);
  render();
}

function render(){
  const {board,current,over,winner,rows:rs,cols:cs} = game.getState();
  const cells = root.querySelectorAll('.cell');
  // update discs
  cells.forEach(el=>{
    const r = +el.dataset.r, c = +el.dataset.c;
    const disc = el.querySelector('.disc');
    disc.classList.remove('p1','p2','empty');
    if(board[r][c]===1) disc.classList.add('p1');
    else if(board[r][c]===2) disc.classList.add('p2');
    else disc.classList.add('empty');
  });

  if(over){
    if(winner===0) turnEl.textContent = 'Draw';
    else turnEl.textContent = `Player ${winner} wins`;
    // highlight winning discs if desired (scan board)
    highlightWinning();
  } else {
    turnEl.textContent = `Player ${current}'s turn`;
  }
}

function highlightWinning(){
  // simple scan to mark 4 in a row; add overlay highlight
  const state = game.getState();
  const b = state.board;
  const rows = b.length, cols = b[0].length;
  const dirs = [[0,1],[1,0],[1,1],[1,-1]];
  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){
      const me = b[r][c];
      if(!me) continue;
      for(const [dr,dc] of dirs){
        let coords = [[r,c]];
        for(let s=1;s<4;s++){
          const rr=r+dr*s, cc=c+dc*s;
          if(rr<0||rr>=rows||cc<0||cc>=cols||b[rr][cc]!==me) break;
          coords.push([rr,cc]);
        }
        if(coords.length>=4){
          coords.forEach(([rr,cc])=>{
            const sel = root.querySelector(`.cell[data-r="${rr}"][data-c="${cc}"] .disc`);
            if(sel) sel.style.boxShadow = '0 6px 18px rgba(0,0,0,0.28), 0 0 0 6px rgba(255,255,255,0.06)';
          });
          return;
        }
      }
    }
  }
}

function handleColumnClick(col){
  const res = game.drop(col);
  if(res.ok){
    animateDrop(res.col, res.row, res.player).then(()=>render());
  } else {
    // invalid (full) - small shake
    if(res.reason==='full'){
      shakeColumn(col);
    }
  }
}

function animateDrop(col, row, player){
  return new Promise(resolve=>{
    // animate visually by finding top-most cell in that column, then move down by setting transform on disc
    // We'll animate each disc in column cells from top to landing cell
    const cellsInCol = Array.from(root.querySelectorAll(`.cell[data-c="${col}"]`));
    // clear any previous transforms
    cellsInCol.forEach(d=>d.querySelector('.disc').style.transition = 'none');
    // set the disc colors progressively to mimic falling
    let i = 0;
    const stepped = ()=>{
      if(i>row){
        // finalize state
        cellsInCol.forEach(d=>d.querySelector('.disc').style.transition = '');
        resolve();
        return;
      }
      // set color for current i and clear previous
      cellsInCol.forEach((el, idx)=>{
        const disc = el.querySelector('.disc');
        if(idx===i) { disc.classList.remove('empty'); disc.classList.add(player===1?'p1':'p2'); disc.style.transform='translateY(-8px) scale(1.02)'; }
        else if(idx < i){ disc.classList.remove('p1','p2'); disc.classList.add('empty'); disc.style.transform='translateY(-8px)'; }
        else { disc.classList.remove('p1','p2'); disc.classList.add('empty'); disc.style.transform='translateY(-8px)'; }
      });
      i++;
      setTimeout(stepped, 60);
    };
    stepped();
  });
}

function shakeColumn(col){
  const cells = root.querySelectorAll(`.cell[data-c="${col}"]`);
  cells.forEach((el, idx)=>{
    el.animate([{transform:'translateX(0)'},{transform:'translateX(-6px)'},{transform:'translateX(6px)'},{transform:'translateX(0)'}],{duration:260,delay:idx*12});
  });
}

restartBtn.addEventListener('click', ()=>{
  game.reset();
  // clear inline styles from discs
  root.querySelectorAll('.disc').forEach(d=>{ d.style.boxShadow=''; d.style.transform='translateY(-8px)'; });
  render();
});

// initialize
buildBoard(cols, rows);