"use strict";

// HTML body ID for text display output
const RUBIK_BODY = "rubikBody";

// Number of tiles along a 1D line
const NTILESLINE = 3;

// Number of tiles on a face
const NTILESFACE = NTILESLINE ** 2;

// Number of dimensions
const NDIM = 3;

// Number of faces on cube
const NFACE = NDIM * 2;

// Total number of tiles on the cube
const NTILES = NFACE * NTILESFACE;

// Number of turns in a full rotation
const NTURNS = 4;

// Face move IDs
const
	MOVE_R  =  0,
	MOVE_U  =  1,
	MOVE_L  =  2,
	MOVE_D  =  3,
	MOVE_F  =  4,
	MOVE_B  =  5,
	MOVE_M  =  6,
	MOVE_E  =  7,
	MOVE_S  =  8,
	MOVE_R2 =  9,
	MOVE_U2 = 10,
	MOVE_L2 = 11,
	MOVE_D2 = 12,
	MOVE_F2 = 13,
	MOVE_B2 = 14,
	MOVE_X  = 15,
	MOVE_Y  = 16,
	MOVE_Z  = 17
	;

const
	CHAR_R  = "R",
	CHAR_U  = "U",
	CHAR_L  = "L",
	CHAR_D  = "D",
	CHAR_F  = "F",
	CHAR_B  = "B",
	CHAR_M  = "M",
	CHAR_E  = "E",
	CHAR_S  = "S",
	CHAR_R2 = "r",
	CHAR_U2 = "u",
	CHAR_L2 = "l",
	CHAR_D2 = "d",
	CHAR_F2 = "f",
	CHAR_B2 = "b",
	CHAR_X  = "x",
	CHAR_Y  = "y",
	CHAR_Z  = "z"
	;

const MOVE_MAP = new Map([
	[CHAR_R , MOVE_R ],
	[CHAR_U , MOVE_U ],
	[CHAR_L , MOVE_L ],
	[CHAR_D , MOVE_D ],
	[CHAR_F , MOVE_F ],
	[CHAR_B , MOVE_B ],
	[CHAR_M , MOVE_M ],
	[CHAR_E , MOVE_E ],
	[CHAR_S , MOVE_S ],
	[CHAR_R2, MOVE_R2],
	[CHAR_U2, MOVE_U2],
	[CHAR_L2, MOVE_L2],
	[CHAR_D2, MOVE_D2],
	[CHAR_F2, MOVE_F2],
	[CHAR_B2, MOVE_B2],
	[CHAR_X , MOVE_X ],
	[CHAR_Y , MOVE_Y ],
	[CHAR_Z , MOVE_Z ]
	]);

const MOVE_MAP_INV = new Map(Array.from(MOVE_MAP, a => a.reverse()));

// Twist amount IDs.  CW 90 degrees is default, otherwise CCW 90, or half turn
// (180 degrees).
const
	CHAR_CCW = "'",
	CHAR_2 = "2"
	;

// Map from face-major state ordering to an ordering for flat 2D text display
const FLAT_MAP =
[
	              0,  1,  2,
	              3,  4,  5,
	              6,  7,  8,

	 9, 10, 11,  18, 19, 20,  27, 28, 29,  36, 37, 38,
	12, 13, 14,  21, 22, 23,  30, 31, 32,  39, 40, 41,
	15, 16, 17,  24, 25, 26,  33, 34, 35,  42, 43, 44,

	             45, 46, 47,
	             48, 49, 50,
	             51, 52, 53
];

let stateg;
let commandHistory = [];

function state2string(state)
{
	// Convert the cube state to a flat 2D string display, arranged like in the
	// FLAT_MAP above

	let cmap = "wrbogy";

	let string = "";  // "[";
	for (let i = 0; i < NTILES; i++)
	{
		if (i % NTILESLINE == 0)
		{
			if (i <= NTILESFACE || i >= NTILES - NTILESFACE)
				// Newline (up or down face)
				string += "\n";
			else if ((i - NTILESFACE) % (NTILESLINE * 4) == 0)
				// Newline (left face)
				string += "\n";

			if (i == NTILESFACE || i == NTILES - NTILESFACE)
				// Double newline between faces vertically
				string += "\n";

			if (i < NTILESFACE || i >= NTILES - NTILESFACE)
				// Leading spaces for indentation of up and down faces
				string += "        ";
			else
				// Extra space between faces
				string += " ";
		}

		//string += state[FLAT_MAP[i]] + " ";  // numerical representation
		string += cmap[state[FLAT_MAP[i]]] + " ";  // color character representation

	}
	//string += "]";

	return string;
}

function initState()
{
	// Initialize solved cube state

	console.log("starting initState()");

	let state = [];
	let j = -1;
	for (let i = 0; i < NTILES; i++)
	{
		if (i % NTILESFACE == 0) j++;
		state[i] = j;
	}
	return state;
}

function parse(moves)
{
	// Parse moves from a string and return the moves encoded as an integer
	// array representing faces and number of turns

	console.log("starting parse()");

	let imoves = [];
	let i = 0;
	while (i < moves.length)
	{
		// Parse the face to be turned
		let c = moves[i];
		//console.log("c = " + c);

		let moveParsed = MOVE_MAP.has(c);
		i++;
		if (!moveParsed)
		{
			// TODO:  catch
			continue;
		}
		imoves.push(MOVE_MAP.get(c));

		// Parse the number (including direction) of turns as a multiple of 90
		// degrees CCW positive.  May need to pad end of string with a space.
		c = i < moves.length ? moves[i] : " ";
		//console.log("c = " + c);

		if (c == CHAR_CCW)
			imoves.push(1);
		else if (c == CHAR_2)
			imoves.push(2);
		else
		{
			// Default 90 degrees CW
			imoves.push(3);

			// TODO:  catch anything besides whitespace or EOL
		}
		i++;
	}
	console.log("imoves = " + imoves);

	return imoves;
}

function render(imoves)
{
	// Inverse of parse(): convert encoded moves to a string

	console.log("starting render()");

	let moves = "";
	for (let i = 0; i < imoves.length; i += 2)
	{
		moves += MOVE_MAP_INV.get(imoves[i]);

		// TODO:  map and invert, consolidate with parse()
		let turns = imoves[i+1];
		if (turns == 1)
			moves += CHAR_CCW;
		else if (turns == 2)
			moves += CHAR_2;
		else
		{
			// TODO:  catch
		}
		moves += " ";
	}

	return moves;
}

function expandMoves(imoves0)
{
	// Simplify two-layer moves and cube rotations by expanding to single-layer
	// moves.  This increases the size of imoves, but the result can be applied
	// with applyExpandedMoves(), which cannot handle multi-layer moves.

	console.log("starting expandMoves()");

	let imoves = [];
	for (let i0 = 0; i0 < imoves0.length; i0 += 2)
	{
		// Iterate through tuples of face IDs and twist amounts
		let face = imoves0[i0];
		let turns = imoves0[i0+1];

		if (face == MOVE_R2)
		{
			imoves.push(MOVE_R);
			imoves.push(turns);
			imoves.push(MOVE_M);
			imoves.push(NTURNS - turns);
		}
		else if (face == MOVE_U2)
		{
			imoves.push(MOVE_U);
			imoves.push(turns);
			imoves.push(MOVE_E);
			imoves.push(NTURNS - turns);
		}
		else if (face == MOVE_L2)
		{
			imoves.push(MOVE_L);
			imoves.push(turns);
			imoves.push(MOVE_M);
			imoves.push(turns);
		}
		else if (face == MOVE_D2)
		{
			imoves.push(MOVE_D);
			imoves.push(turns);
			imoves.push(MOVE_E);
			imoves.push(turns);
		}
		else if (face == MOVE_F2)
		{
			imoves.push(MOVE_F);
			imoves.push(turns);
			imoves.push(MOVE_S);  // weird convention but ok
			imoves.push(turns);
		}
		else if (face == MOVE_B2)
		{
			imoves.push(MOVE_B);
			imoves.push(turns);
			imoves.push(MOVE_S);
			imoves.push(NTURNS - turns);
		}
		else if (face == MOVE_X)
		{
			imoves.push(MOVE_R);
			imoves.push(turns);
			imoves.push(MOVE_M);
			imoves.push(NTURNS - turns);
			imoves.push(MOVE_L);
			imoves.push(NTURNS - turns);
		}
		else if (face == MOVE_Y)
		{
			imoves.push(MOVE_U);
			imoves.push(turns);
			imoves.push(MOVE_E);
			imoves.push(NTURNS - turns);
			imoves.push(MOVE_D);
			imoves.push(NTURNS - turns);
		}
		else if (face == MOVE_Z)
		{
			imoves.push(MOVE_F);
			imoves.push(turns);
			imoves.push(MOVE_S);
			imoves.push(turns);  // weird convention ibid
			imoves.push(MOVE_B);
			imoves.push(NTURNS - turns);
		}
		else
		{
			// Assume single-layer move.  Any errors should be caught later in
			// applyExpandedMoves()
			imoves.push(face);
			imoves.push(turns);
		}
	}
	console.log("imoves = " + imoves);

	return imoves;
}

function cycle(array, indices)
{
	// Cycle the elements of array at indices towards the beginning of indices.
	// JavaScript lacks the syntactic sugar to do things like this as easily as
	// Fortran.  There is something called destructuring assignment, but it is
	// very verbose for this task.

	let tmp = array[indices[0]];
	for (let i = 0; i < indices.length - 1; i++)
		array[indices[i]] = array[indices[i+1]];
	array[indices[indices.length - 1]] = tmp;
}

function turnR(state)
{
	// Corner tiles on right face
	cycle(state, [27, 29, 35, 33]);

	// Edge tiles on right face
	cycle(state, [28, 32, 34, 30]);

	// Adjacent corners
	cycle(state, [8, 36, 53, 26]);

	// More adjacent corners
	cycle(state, [20, 2, 42, 47]);

	// Adjacent edges
	cycle(state, [5, 39, 50, 23]);
}

function turnU(state)
{
	// Corner tiles on face
	cycle(state, [0, 2, 8, 6]);

	// Edge tiles on face
	cycle(state, [1, 5, 7, 3]);

	// Adjacent corners
	cycle(state, [36, 27, 18, 9]);

	// More adjacent corners
	cycle(state, [38, 29, 20, 11]);

	// Adjacent edges
	cycle(state, [37, 28, 19, 10]);
}

function turnL(state)
{
	// Corner tiles on face
	cycle(state, [9, 11, 17, 15]);

	// Edge tiles on face
	cycle(state, [10, 14, 16, 12]);

	// Adjacent corners
	cycle(state, [0, 18, 45, 44]);

	// More adjacent corners
	cycle(state, [6, 24, 51, 38]);

	// Adjacent edges
	cycle(state, [3, 21, 48, 41]);
}

function turnD(state)
{
	// Corner tiles on face
	cycle(state, [45, 47, 53, 51]);

	// Edge tiles on face
	cycle(state, [46, 50, 52, 48]);

	// Adjacent corners
	cycle(state, [15, 24, 33, 42]);

	// More adjacent corners
	cycle(state, [17, 26, 35, 44]);

	// Adjacent edges
	cycle(state, [16, 25, 34, 43]);
}

function turnF(state)
{
	// Corner tiles on face
	cycle(state, [18, 20, 26, 24]);

	// Edge tiles on face
	cycle(state, [19, 23, 25, 21]);

	// Adjacent corners
	cycle(state, [6, 27, 47, 17]);

	// More adjacent corners
	cycle(state, [8, 33, 45, 11]);

	// Adjacent edges
	cycle(state, [7, 30, 46, 14]);
}

function turnB(state)
{
	// Corner tiles on face
	cycle(state, [36, 38, 44, 42]);

	// Edge tiles on face
	cycle(state, [37, 41, 43, 39]);

	// Adjacent corners
	cycle(state, [0, 15, 53, 29]);

	// More adjacent corners
	cycle(state, [2, 9, 51, 35]);

	// Adjacent edges
	cycle(state, [1, 12, 52, 32]);
}

function turnM(state)
{
	// Slice-turns cycle fewer tiles than face-turns

	// Centers
	cycle(state, [4, 22, 49, 40]);

	// Edges
	cycle(state, [1, 19, 46, 43]);

	// More edges
	cycle(state, [7, 25, 52, 37]);
}

function turnE(state)
{
	// Centers
	cycle(state, [13, 22, 31, 40]);

	// Edges
	cycle(state, [12, 21, 30, 39]);

	// More edges
	cycle(state, [14, 23, 32, 41]);
}

function turnS(state)
{
	// Centers
	cycle(state, [4, 31, 49, 13]);

	// Edges
	cycle(state, [3, 28, 50, 16]);

	// More edges
	cycle(state, [5, 34, 48, 10]);
}

function applyExpandedMoves(imoves, state)
{
	// Apply parsed number-encoded moves to the cube state

	//console.log("starting applyExpandedMoves");
	//console.log("imoves = " + imoves);

	for (let i = 0; i < imoves.length; i += 2)
	{
		// Iterate through tuples of face IDs and twist amounts
		let face = imoves[i];
		let turns = imoves[i+1];

		for (let j = 0; j < turns; j++)
		{
			if      (face == MOVE_R)
				turnR(state);
			else if (face == MOVE_U)
				turnU(state);
			else if (face == MOVE_L)
				turnL(state);
			else if (face == MOVE_D)
				turnD(state);
			else if (face == MOVE_F)
				turnF(state);
			else if (face == MOVE_B)
				turnB(state);
			else if (face == MOVE_M)
				turnM(state);
			else if (face == MOVE_E)
				turnE(state);
			else if (face == MOVE_S)
				turnS(state);
			else
			{
				// TODO: catch (don't assume parser returns valid IDs)
			}
		}
	}
}

function parseAndExpand(moves)
{
	// Parse moves from a string and return expanded single-layer moves
	let imoves0 = parse(moves);
	let imoves = expandMoves(imoves0);
	return imoves;
}

function apply(moves, state)
{
	// Apply a string of moves to the cube state
	let imoves = parseAndExpand(moves);
	applyExpandedMoves(imoves, state);
}

function getScramble(n)
{
	// Generate a random scramble of n encoded moves.
	//
	// Note, "the implementation selects the initial seed to the random number
	// generation algorithm; it cannot be chosen or reset by the user."
	//
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random

	let imoves = [];
	for (let i = 0; i < n; i++)
	{
		// One of 6 basic single outer layer moves.  Could use middle-layer
		// moves to (up to 9).
		imoves.push(Math.floor(Math.random() * 6));

		// Turn by 90, 180, or 270 degrees
		imoves.push(Math.floor(Math.random() * 3) + 1);
	}

	return imoves;
}

function iundo(imoves)
{
	// Undo encoded moves, return the reversal imovesr

	let imovesr = [];
	for (let i = imoves.length - 2; i >= 0; i -= 2)
	{
		// Iterate backwards through tuples of face IDs and twist amounts

		// Same face
		imovesr.push(imoves[i]);

		// Opposite twist
		imovesr.push(NTURNS - imoves[i+1]);
	}
	return imovesr;
}

function undo(moves)
{
	// Undo a string of moves, return the reversal
	return render(iundo(parse(moves)));
}

function scramble(state)
{
	// Randomly scramble the cube state

	let n = 50;  // number of scramble moves
	let imoves = getScramble(n);
	applyExpandedMoves(imoves, state);

	//let moves0 = "R' F R2 R2 D M' B' R' D' M' E2 U M' U' E2 E2 F' F2 L2 S F F2 L' L F F F2 M' S E' E' R2 S F' S' R F R E' F2 B' R2 M' F2 S F2 M' U E F";
	//let imoves = parseAndExpand(moves0);
	//applyExpandedMoves(imoves, state);

	let moves = render(imoves);
	console.log("scramble = " + moves);
	console.log("reverse scramble = " + undo(moves));
}

function orient(state0)
{
	// Apply whole-cube rotations to put center tiles in a consistent
	// orientation

	// slice() for deep copy
	let state = state0.slice();

	// These follow the convention from initState()
	let upColor = 0;
	let frontColor = 2;

	// Orient up face
	if (state[4] != upColor)
	{
		let moves = "";
		if (state[13] == upColor)
			moves = CHAR_Z;
		else if (state[22] == upColor)
			moves = CHAR_X;
		else if (state[31] == upColor)
			moves = CHAR_Z + CHAR_CCW;
		else if (state[40] == upColor)
			moves = CHAR_X + CHAR_CCW;
		else if (state[49] == upColor)
			moves = CHAR_Z + CHAR_2;
		else
		{
			// TODO: catch
		}
		apply(moves, state);
	}

	// Orient front face
	while (state[22] != frontColor)
	{
		// TODO:  catch infinite loop
		apply(CHAR_Y, state);
	}

	return state;
}

function processRubikCommand()
{
	console.log("starting processRubikCommand()");

	let command = document.forms.rubikForm.command.value;

	console.log('command = "' + command + '"');

	//console.log("stateg = " + stateg);

	apply(command, stateg);

	// toString() is a hack to compare array values instead of pointers
	let solved = (orient(stateg).toString() == initState().toString());

	//console.log("stateg = " + orient(stateg).toString());

	commandHistory.push(command);

	let body = state2string(stateg) + "\n\n";

	// Show at most nshow commands
	let nshow = 10;
	let n = commandHistory.length;
	for (let i = Math.max(0, n - nshow); i < n; i++)
		body += commandHistory[i] + "\n";

	if (solved) body += "Successfully solved!\n";

	document.getElementById(RUBIK_BODY).innerHTML = body;

	// Reset text input
	document.forms.rubikForm.command.value = "";
}

function initRubikGame()
{
	console.log("starting initRubikGame()");

	stateg = initState();
	scramble(stateg);

	document.getElementById(RUBIK_BODY).innerHTML = state2string(stateg);
}

