import { random } from "lodash";
import { BetterServLogger } from "./betterserv_logger";
import { getGeneralSettingsForDomain } from "./storage";

main();

async function main(): Promise<void> {
    const settings = await getGeneralSettingsForDomain(window.location.host);
    const sidebar = document.getElementById("idesk-sidebar");

    if (!settings.tictactoe || !sidebar) return;
    new TicTacToe(sidebar);
}

export class TicTacToe {
    parent: HTMLElement;
    cells: (string | null)[];
    xStarted = false;
    canTurn = false;
    scores: { X: number, O: number }; // X is the player, O is the computer
    logger = new BetterServLogger("TicTacToe");

    constructor(parent: HTMLElement) {
        this.parent = parent;
        this.cells = Array(9).fill(null);
        this.scores = { X: 0, O: 0 };

        this.makeGrid()
        this.logger.log("Initialised TicTacToe");
        this.randomFirstMove();
    }

    resetGame(): void {
        this.cells.fill(null);
        this.resetGrid();
        this.xStarted = Math.random() < 0.5;
        this.canTurn = this.xStarted;
        this.logger.log(`Game reset, ${this.xStarted ? "X" : "O"} starts`);
        if (!this.xStarted) this.randomFirstMove();
    }

    resetGrid(): void {
        const existing = this.parent.querySelector(".ttt-panel");
        if (existing) {
            existing.remove();
        }
        this.makeGrid();
    }

    makeGrid(): void {
        const tictactoe = document.createElement("div");
        tictactoe.classList.add("panel", "panel-dashboard", "panel-default", "ttt-panel");
        tictactoe.innerHTML = `
            <div class="panel-heading">
                <h2 class="panel-title">
                    <span class="rainbow">Tic Tac Toe 
                        <span class="asciimoji"></span>
                    </span>
                </h2>
            </div>
            <div class="panel-body ttt-wrapper">
                <span id="xScore">0</span>
                <div id="tictactoegrid"></div>
                <span id="oScore">0</span>
            </div>
        `;

        const grid = tictactoe.querySelector("#tictactoegrid") as HTMLElement;
        const xScore = tictactoe.querySelector("#xScore") as HTMLElement;
        const oScore = tictactoe.querySelector("#oScore") as HTMLElement;

        if (!grid || !xScore || !oScore) return;
        for (const [i, _] of this.cells.entries()) {
            const cell = document.createElement("div");
            cell.dataset.index = i.toString();
            cell.onclick = () => this.handleClick(i);
            grid.appendChild(cell);
        }

        xScore.textContent = this.scores.X.toString();
        oScore.textContent = this.scores.O.toString();

        this.parent.prepend(tictactoe);
    }

    handleClick(index: number): void {
        if (!this.canTurn || this.cells[index]) return;

        this.makeMove(index, "X");
        this.canTurn = false;

        const winner = this.checkWinner();
        if (winner) {
            this.handleWinner(winner);
            return;
        }

        this.makeAIMove();
    }

    makeMove(index: number, symbol: string): void {
        this.cells[index] = symbol;
        const cell = this.parent.querySelector(`[data-index="${index}"]`) as HTMLElement;
        cell.classList.add(symbol.toLowerCase());

        this.logger.log(`Made move ${symbol} at index ${index}`);
    }

    checkWinner(): string | null {
        const winningCombos = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];

        for (const combo of winningCombos) {
            const [a, b, c] = combo;
            if (this.cells[a] && this.cells[a] === this.cells[b] && this.cells[a] === this.cells[c]) {
                return this.cells[a];
            }
        }

        if (this.cells.every((cell) => cell)) {
            return "tie";
        }

        return null;
    }

    handleWinner(winner: string | null): void {
        if (!winner) return;
        if (["X", "O"].includes(winner.toUpperCase())) this.scores[winner.toUpperCase() as "X" | "O"]++;

        this.resetGame();
    }

    randomFirstMove() {
        this.makeMove(random(0, 8), "O");
    }

    async makeAIMove(): Promise<void> {
        const moves = await this.getAIMoves();
        if (!moves) return;

        const settings = await getGeneralSettingsForDomain(window.location.host);
        const diff = settings["tictactoe-difficulty"] || 5;
        this.logger.log(`Difficulty: ${diff}, recommendet moves: ${moves}`);
        const move = this.selectMove(moves, diff);
        this.makeMove(moves[move], "O");
        this.canTurn = true;

        this.handleWinner(this.checkWinner());
    }

    selectMove(moves: number[], difficulty: number): number {
        return Math.floor(moves.length * Math.log2(1 + Math.random() / difficulty));
    }

    async getAIMoves(): Promise<number[] | null> {
        try {
            const num = this.getEncodedBoard();
            const response = await fetch(`https://tictactoe.responseplan.de/${num}`);
            if (!response.ok) {
                this.logger.error(`Failed to get AI moves, status: ${response.status}`);
                return null;
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error(error);
            return null;
        }
    }

    getEncodedBoard(): number {
        let res = 0;
        for (let i = 0; i < 9; i++) {
            const value =
                this.cells[i] === "O" ? 1 + Number(this.xStarted) : this.cells[i] === null ? 0 : 2 - Number(this.xStarted);
            res += value * 3 ** i;
        }
        return res;
    }
}