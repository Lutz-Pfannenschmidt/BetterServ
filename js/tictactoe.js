main();

async function main() {
	const settings = await getGeneralSettings(window.location.host);
	const sidebar = document.getElementById("idesk-sidebar");
	const gridExists = !!document.getElementById("tictactoegrid");
	if (!settings.tictactoe || !sidebar || gridExists) return;

	const tictactoe = document.createElement("div");
	tictactoe.classList.add("panel");
	tictactoe.classList.add("panel-dashboard");
	tictactoe.classList.add("panel-default");
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

	const grid = document.getElementById("tictactoegrid");
	const cells = Array(9).fill(null);
	const xStarted = true;
	let canTurn = true;

	const handleClick = async (index, cell) => {
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
		makeMove(moves[moveIndex], "O", grid.children[moves[moveIndex]]);

		winner = checkTicTacToeWinner(cells);
		if (handleWinner(winner)) return;

		canTurn = true;
	};

	const makeMove = (index, symbol, cell) => {
		cells[index] = symbol;
		cell.classList.add(symbol.toLowerCase());
	};

	const handleWinner = (winner) => {
		if (winner) {
			switch (winner.toUpperCase()) {
				case "X":
					document.getElementById("xScore").textContent++;
					break;
				case "O":
					document.getElementById("oScore").textContent++;
					break;
			}
			resetGame();
			return true;
		}
		return false;
	};

	const resetGame = () => {
		cells.fill(null);
		resetGrid();
		canTurn = true;
	};

	const selectMove = (moves, difficulty) => {
		return Math.floor(moves.length * Math.log2(1 + Math.random() / difficulty));
	};

	cells.forEach((_, i) => {
		const cell = document.createElement("div");
		cell.dataset.index = i;
		cell.onclick = () => handleClick(i, cell);
		grid.appendChild(cell);
	});

	const emoji = document.querySelector(".asciimoji");
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

function encodeBoard(board, xStarted) {
	let res = 0;
	for (let i = 0; i < 9; i++) {
		const value =
			board[i] === "O" ? 1 + xStarted : board[i] === null ? 0 : 2 - xStarted;
		res += value * 3 ** i;
	}
	return res;
}

function resetGrid() {
	const grid = document.getElementById("tictactoegrid");
	for (const cell of grid.children) {
		cell.classList.remove("x");
		cell.classList.remove("o");
	}
}

function checkTicTacToeWinner(board) {
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

async function getNextMoves(cells, xStarted) {
	try {
		const num = encodeBoard(cells, xStarted);
		const response = await fetch(`https://tictactoe.responseplan.de/${num}`);
		const status = response.status;
		if (status !== 200) {
			console.error(`Failed to get moves: ${status}`);
			return null;
		}
		const data = await response.json();
		return data;
	} catch (e) {
		console.error(e);
		return null;
	}
}

async function getGeneralSettings(domain) {
	const generalSettings = await getStorage(`betterserv-general-${domain}`);
	if (!generalSettings) {
		await setStorage(`betterserv-general-${domain}`, {});
		return {};
	}
	return generalSettings;
}
async function getStorage(key) {
	return await browser.storage.sync.get(key).then((res) => res[key]);
}
