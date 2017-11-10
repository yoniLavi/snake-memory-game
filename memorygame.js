const ROWS = 9; // should be an odd number
const COLS = 9; // should be an odd number
const TICK_DURATION = 1200;
const COMPUTER_MOVE_SOUND = NUDGE_SOUND;
const PLAYER_MOVE_SOUND = NOTIFY_SOUND;
const GAME_OVER_SOUND = FAIL_SOUND;

let Board = null;
let Trail = [];
let PlayerTrailIndex = 0;

function initializeBoard(svgId) {
    // set the global Board object
    Board = document.getElementById(svgId);

    let cellHeight = Board.height.baseVal.value / ROWS;
    let cellWidth = Board.width.baseVal.value / COLS;
    let radius = Math.round(Math.min(cellHeight, cellWidth) * 0.3);

    for (let row=0; row<ROWS; row++) {
        for (let col=0; col<COLS; col++) {
            let circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('id', `cell:${row}:${col}`);
            circle.setAttribute('cx', Math.round((col+0.5)*cellWidth));
            circle.setAttribute('cy', Math.round((row+0.5)*cellHeight));
            circle.setAttribute('r', radius);
            circle.setAttribute('onmouseenter', 'touchCell(event)');
            if (row === (ROWS-1)/2 && col === (COLS-1)/2) {
                circle.setAttribute('class', 'origin');
            }
            Board.appendChild(circle);
        }
    }
}

function getCell(row, col) {
    return Board.getElementById(`cell:${row}:${col}`);
}

function setCellState(cell, alive) {
    if (alive) {
        cell.classList.add('active');
    } else {
        cell.classList.remove('active');
    }
}

function drawLine(startRow, startCol, endRow, endCol) {
    let startCell = getCell(startRow, startCol);
    let endCell = getCell(endRow, endCol);
    let line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', startCell.getAttribute('cx'));
    line.setAttribute('y1', startCell.getAttribute('cy'));
    line.setAttribute('x2', endCell.getAttribute('cx'));
    line.setAttribute('y2', endCell.getAttribute('cy'));
    Board.appendChild(line);
}

function touchCell(event) {
    let cell = event.target;
    let phase = Board.dataset.phase;
    if (phase === 'GO_TO_ORIGIN' && cell.classList.contains('origin')) {
        PLAYER_MOVE_SOUND.play();
        setCellState(cell, true);
        let [_, row, col] = cell.id.split(':');
        PlayerTrailIndex = 1;
        setTimeout(beginPlayerTurn, 0);
    } else if (phase === 'PLAYER_TURN' && !cell.classList.contains('active')) {
        let [_, row, col] = cell.id.split(':');
        let [correctRow, correctCol] = Trail[PlayerTrailIndex];
        if (parseInt(row) === correctRow && parseInt(col) === correctCol) {
            PLAYER_MOVE_SOUND.play();
            setCellState(cell, true);
            let [oldRow, oldCol] = Trail[PlayerTrailIndex-1];
            drawLine(oldRow, oldCol, correctRow, correctCol);
            PlayerTrailIndex++;
            if (PlayerTrailIndex === Trail.length) {
                setTimeout(beginComputerTurn, TICK_DURATION);
                return;
            }
        } else {
            setTimeout(youLose, 0);
        }
    }
}

function extendTrail() {
    let lastCoords = Trail[Trail.length-1];
    let possibleCoords = findFreeNeighbours(lastCoords[0], lastCoords[1]);
    if (!possibleCoords) {
        youWin();
        return true;
    }
    let randomIndex = Math.floor(Math.random() * possibleCoords.length);
    Trail.push(possibleCoords[randomIndex]);
}

function showMessage(messageText) {
    let messageElem = document.getElementById('message');
    messageElem.innerText = messageText;
    messageElem.classList.remove('hidden');
}

function displayTrail(index) {
    if (index === undefined) { // we're just beginning
        index = 0;
        showMessage(`Computer's turn - ${Trail.length} circles`);
    }
    if (index >= Trail.length) { // we're done
        setTimeout(goToOrigin, 0);
        return;
    }
    COMPUTER_MOVE_SOUND.play();
    let [row, col] = Trail[index];
    setCellState(getCell(row, col), true);
    if (index>0) {
        let [oldRow, oldCol] = Trail[index-1];
        drawLine(oldRow, oldCol, row, col);
    }
    setTimeout(() => displayTrail(index+1), TICK_DURATION);
}

function isInTrail(row, col) {
    for (let [x, y] of Trail) {
        if (x === row && y === col) {
            return true;
        }
    }
    return false;
}

function findFreeNeighbours(row, col) {
    let inactiveNeighbours = [];
    for (let [x, y] of [[row, col-1], [row, col+1], [row-1, col], [row+1, col]]) {
        if (!isInTrail(x, y) && x>=0 && x<ROWS && y>=0 && y<COLS) {
            inactiveNeighbours.push([x, y]);
        }
    }
    return inactiveNeighbours.length>0 ? inactiveNeighbours : null;
}

function clearBoard() {
    for (let row=0; row<ROWS; row++) {
        for (let col=0; col<COLS; col++) {
            setCellState(getCell(row, col), false);
        }
    }

    let allLines = Board.getElementsByTagName('line');
    while (allLines.length>0) {
       Board.removeChild(allLines[0]);
    }
}

function beginComputerTurn() {
    Board.dataset.phase = 'COMPUTER_TURN';
    clearBoard();
    let victory = extendTrail();
    if (victory) {
        youWin();
    } else {
        displayTrail();
    }
}

function goToOrigin() {
    clearBoard();
    showMessage("Move cursor to the origin circle to begin your move");
    Board.dataset.phase = 'GO_TO_ORIGIN';
}

function beginPlayerTurn() {
    Board.dataset.phase = 'PLAYER_TURN';
    showMessage('Start tracing the trail');
}

function youLose() {
    GAME_OVER_SOUND.play();
    Board.dataset.phase = 'GAME_OVER';
    showMessage(`Wrong circle - you survived through ${Trail.length-1} circles. Want to try again?`);
}

function youWin() {
    GAME_OVER_SOUND.play();
    Board.dataset.phase = 'GAME_OVER';
    showMessage(`You win! You survived through ${Trail.length} circles and the trail can\'t grow anymore`);
}


function startNewGame() {
    Trail = [[(ROWS-1)/2, (COLS-1)/2]]
    PlayerTrailIndex = 0
    beginComputerTurn();
}
