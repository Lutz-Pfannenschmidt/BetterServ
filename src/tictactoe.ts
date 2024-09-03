import { getGeneralSettingsForDomain } from "./storage";

main();

async function main(): Promise<void> {
    const settings = await getGeneralSettingsForDomain(window.location.host);
    const sidebar = document.getElementById("idesk-sidebar");
    const gridExists = !!document.getElementById("tictactoegrid");

    if (!settings.tictactoe || !sidebar || gridExists) return;

    const tictactoe = document.createElement("div");
    tictactoe.classList.add("panel", "panel-dashboard", "panel-default");
    tictactoe.innerHTML = `
        <div class="panel-heading">
            <h2 class="panel-title"><span class="rainbow">Tic Tac Toe <span class="asciimoji"></span></span></h2>
        </div>
        <div class="panel-body ttt-wrapper">
            <span id="xScore">0</span>
            <div id="tictactoegrid"></div>
            <span id="oScore">0</span>
        </div>`;

    sidebar.prepend(tictactoe);

    const grid = document.getElementById("tictactoegrid") as HTMLElement;
    const cells: (string | null)[] = Array(9).fill(null);
    let xStarted = false;
    let canTurn = false;

    cells.forEach((_, i) => {
        const cell = document.createElement("div");
        cell.dataset.index = i.toString();
        cell.onclick = () => handleClick(i, cell);
        grid.appendChild(cell);
    });

    const makeMove = (index: number, symbol: string, cell: HTMLElement): void => {
        cells[index] = symbol;
        cell.classList.add(symbol.toLowerCase());
    };

    const handleWinner = (winner: string | null): boolean => {
        if (!winner) return false

        const xScoreElem = document.getElementById("xScore");
        const oScoreElem = document.getElementById("oScore");

        if (!xScoreElem || !oScoreElem) return false;

        const xScore = Number.parseInt(xScoreElem.textContent as string);
        const oScore = Number.parseInt(oScoreElem.textContent as string);

        switch (winner.toUpperCase()) {
            case "X":
                xScoreElem.textContent = (xScore + 1).toString();
                break;
            case "O":
                oScoreElem.textContent = (oScore + 1).toString();
                break;
        }

        resetGame();
        return true;
    };

    const resetGame = (): void => {
        cells.fill(null);
        resetGrid();
        xStarted = Math.random() < 0.5;
        canTurn = xStarted;
    };

    const selectMove = (moves: number[], difficulty: number): number => {
        return Math.floor(moves.length * Math.log2(1 + Math.random() / difficulty));
    };

    if (!xStarted) {
        const move = Math.floor(9 * Math.random());
        makeMove(move, "O", grid.children[move] as HTMLElement);
        canTurn = true;
    }

    const handleClick = async (index: number, cell: HTMLElement): Promise<void> => {
        if (cells[index] !== null || !canTurn) return;
        canTurn = false;

        makeMove(index, "X", cell);

        let winner = checkTicTacToeWinner(cells);
        if (handleWinner(winner)) return;

        const difficulty = Math.max(settings["tictactoe-difficulty"] || 1, 1);
        const moves = await getNextMoves(cells, xStarted);
        if (!moves) {
            resetGame();
            return;
        }

        const moveIndex = selectMove(moves, difficulty);
        makeMove(moves[moveIndex], "O", grid.children[moves[moveIndex]] as HTMLElement);

        winner = checkTicTacToeWinner(cells);
        if (handleWinner(winner)) return;

        canTurn = true;
    };

    const emoji = document.querySelector(".asciimoji") as HTMLElement;
    const asciimojis = [
        "／人◕ ‿‿ ◕人＼",
        "ヽ(´▽`)/",
        "ᕕ( ᐛ )ᕗ",
        "¯\\_(ツ)_/¯",
        "ಠ_ಠ",
        "ಠ‿↼",
        "( ͡° ͜ʖ ͡°)",
        "ʕ•ᴥ•ʔ",
    ];
    emoji.textContent = asciimojis[Math.floor(Math.random() * asciimojis.length)];
}

function encodeBoard(board: (string | null)[], xStarted: boolean): number {
    let res = 0;
    for (let i = 0; i < 9; i++) {
        const value =
            board[i] === "O" ? 1 + Number(xStarted) : board[i] === null ? 0 : 2 - Number(xStarted);
        res += value * 3 ** i;
    }
    return res;
}

function resetGrid(): void {
    const grid = document.getElementById("tictactoegrid") as HTMLElement;
    for (const cell of Array.from(grid.children)) {
        cell.classList.remove("x", "o");
    }
}

function checkTicTacToeWinner(board: (string | null)[]): string | null {
    const winningCombinations = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6],
    ];

    const winner = winningCombinations.find((combination) => {
        const [a, b, c] = combination;
        return board[a] && board[a] === board[b] && board[a] === board[c];
    });

    if (winner) {
        return board[winner[0]];
    }

    if (board.every((cell) => cell)) {
        return "tie";
    }

    return null;
}

async function getNextMoves(cells: (string | null)[], xStarted: boolean): Promise<number[] | null> {
    try {
        const num = encodeBoard(cells, xStarted);
        const response = await fetch(`https://tictactoe.responseplan.de/${num}`);
        if (!response.ok) {
            console.error(`Failed to get moves: ${response.status}`);
            return null;
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(error);
        return null;
    }
}
