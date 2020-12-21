"use strict";

import rubikVtk from 'rubikVtk';
import * as rc from 'rubikConstants';

// HTML IDs for text display output, button listeners, etc.
const RUBIK_BODY = "rubikBody";
const COMMAND_BODY = "commandHistoryBody";
const SCRAMBLE = "Scramble";
const UNSCRAMBLE = "Unscramble";

// Animate smooth rotations, or just swap colors instantly?
const ANIMATE = true;

let stateg;
let commandHistory = [];
let moveHistory = [];
let inputHistory = [];
let iHistory = 0;
let inputBuffer = "";

function state2string(state)
{
	// Convert the cube state to a flat 2D string display, arranged like in the
	// FLAT_MAP

	let string = "";  // "[";
	for (let i = 0; i < rc.NTILES; i++)
	{
		if (i % rc.NTILESLINE == 0)
		{
			if (i <= rc.NTILESFACE || i >= rc.NTILES - rc.NTILESFACE)
				// Newline (up or down face)
				string += "\n";
			else if ((i - rc.NTILESFACE) % (rc.NTILESLINE * 4) == 0)
				// Newline (left face)
				string += "\n";

			if (i == rc.NTILESFACE || i == rc.NTILES - rc.NTILESFACE)
				// Double newline between faces vertically
				string += "\n";

			if (i < rc.NTILESFACE || i >= rc.NTILES - rc.NTILESFACE)
				// Leading spaces for indentation of up and down faces
				string += "        ";
			else
				// Extra space between faces
				string += " ";
		}

		//string += state[rc.FLAT_MAP[i]] + " ";  // numerical representation
		string += rc.CMAP[state[rc.FLAT_MAP[i]]] + " ";  // color character representation

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
	for (let i = 0; i < rc.NTILES; i++)
	{
		if (i % rc.NTILESFACE == 0) j++;
		state[i] = j;
	}
	return state;
}

function parse(moves)
{
	// Parse moves from a string and return the moves encoded as an integer
	// array representing faces and number of turns

	//console.log("starting parse()");

	let imoves = [];
	let i = 0;
	while (i < moves.length)
	{
		// Parse the face to be turned
		let c = moves[i];
		//console.log("c = " + c);

		let moveParsed = rc.MOVE_MAP.has(c);
		i++;
		if (!moveParsed)
		{
			if (c.trim() === "")
				continue;
			else
			{
				throw ' '.repeat(i-1)
					+ '^\nError 0: unexpected non-whitespace character "' + c
					+ '" at column ' + i + ', character code ' + c.charCodeAt(0);
				return [];
			}
		}
		imoves.push(rc.MOVE_MAP.get(c));

		// Parse the number (including direction) of turns as a multiple of 90
		// degrees CCW positive.  May need to pad end of string with a space.
		c = i < moves.length ? moves[i] : " ";
		//console.log("c = " + c);

		let turnParsed = rc.TURN_MAP.has(c);
		i++;
		if (turnParsed)
		{
			imoves.push(rc.TURN_MAP.get(c));
		}
		else
		{
			if (c.trim() === "")
				imoves.push(rc.TURN_CW);
			else
			{
				throw ' '.repeat(i-1)
					+ '^\nError 1: unexpected non-whitespace character "' + c
					+ '" at column ' + i + ', character code ' + c.charCodeAt(0);
				return [];
			}
		}
	}
	//console.log("imoves = " + imoves);

	return imoves;
}

function render(imoves)
{
	// Inverse of parse(): convert encoded moves to a string

	//console.log("starting render()");

	let moves = "";
	for (let i = 0; i < imoves.length; i += 2)
	{
		moves += rc.MOVE_MAP_INV.get(imoves[i]);

		let turnParsed = rc.TURN_MAP_INV.has(imoves[i+1]);
		if (turnParsed)
			moves += rc.TURN_MAP_INV.get(imoves[i+1]);

		moves += " ";
	}

	return moves;
}

function expandMoves(imoves0)
{
	// Simplify two-layer moves and cube rotations by expanding to single-layer
	// moves.  This increases the size of imoves, but the result can be applied
	// with applyExpandedMoves(), which cannot handle multi-layer moves.

	//console.log("starting expandMoves()");

	let imoves = [];
	for (let i0 = 0; i0 < imoves0.length; i0 += 2)
	{
		// Iterate through tuples of face IDs and twist amounts
		let face = imoves0[i0];
		let turns = imoves0[i0+1];

		if (face == rc.MOVE_R2)
		{
			imoves.push(rc.MOVE_R);
			imoves.push(turns);
			imoves.push(rc.MOVE_M);
			imoves.push(rc.NTURNS - turns);
		}
		else if (face == rc.MOVE_U2)
		{
			imoves.push(rc.MOVE_U);
			imoves.push(turns);
			imoves.push(rc.MOVE_E);
			imoves.push(rc.NTURNS - turns);
		}
		else if (face == rc.MOVE_L2)
		{
			imoves.push(rc.MOVE_L);
			imoves.push(turns);
			imoves.push(rc.MOVE_M);
			imoves.push(turns);
		}
		else if (face == rc.MOVE_D2)
		{
			imoves.push(rc.MOVE_D);
			imoves.push(turns);
			imoves.push(rc.MOVE_E);
			imoves.push(turns);
		}
		else if (face == rc.MOVE_F2)
		{
			imoves.push(rc.MOVE_F);
			imoves.push(turns);
			imoves.push(rc.MOVE_S);  // weird convention but ok
			imoves.push(turns);
		}
		else if (face == rc.MOVE_B2)
		{
			imoves.push(rc.MOVE_B);
			imoves.push(turns);
			imoves.push(rc.MOVE_S);
			imoves.push(rc.NTURNS - turns);
		}
		else if (face == rc.MOVE_X)
		{
			imoves.push(rc.MOVE_R);
			imoves.push(turns);
			imoves.push(rc.MOVE_M);
			imoves.push(rc.NTURNS - turns);
			imoves.push(rc.MOVE_L);
			imoves.push(rc.NTURNS - turns);
		}
		else if (face == rc.MOVE_Y)
		{
			imoves.push(rc.MOVE_U);
			imoves.push(turns);
			imoves.push(rc.MOVE_E);
			imoves.push(rc.NTURNS - turns);
			imoves.push(rc.MOVE_D);
			imoves.push(rc.NTURNS - turns);
		}
		else if (face == rc.MOVE_Z)
		{
			imoves.push(rc.MOVE_F);
			imoves.push(turns);
			imoves.push(rc.MOVE_S);
			imoves.push(turns);  // weird convention ibid
			imoves.push(rc.MOVE_B);
			imoves.push(rc.NTURNS - turns);
		}
		else
		{
			// Assume single-layer move.  Any errors should be caught later in
			// applyExpandedMoves()
			imoves.push(face);
			imoves.push(turns);
		}
	}
	//console.log("imoves = " + imoves);

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
			if      (face == rc.MOVE_R)
				turnR(state);
			else if (face == rc.MOVE_U)
				turnU(state);
			else if (face == rc.MOVE_L)
				turnL(state);
			else if (face == rc.MOVE_D)
				turnD(state);
			else if (face == rc.MOVE_F)
				turnF(state);
			else if (face == rc.MOVE_B)
				turnB(state);
			else if (face == rc.MOVE_M)
				turnM(state);
			else if (face == rc.MOVE_E)
				turnE(state);
			else if (face == rc.MOVE_S)
				turnS(state);
			else
			{
				// TODO: catch (don't assume parser returns valid IDs)
			}
		}
	}
}

function apply(moves, state, animate)
{
	// Apply a string of moves to the cube state

	let imoves0 = parse(moves);

	if (ANIMATE && animate)
		rubikVtk.animate(imoves0);

	let imoves = expandMoves(imoves0);
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
	for (let i = 0; i < 2 * n; i += 2)
	{
		// One of 6 basic single outer layer moves.  Could use middle-layer
		// moves to (up to 9).
		let face = Math.floor(Math.random() * 6);

		// Don't push if same face as previous.  Don't need to check i>1 in js.
		while (face == imoves[i-2])
			face = Math.floor(Math.random() * 6);

		imoves.push(face);

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
		imovesr.push(rc.NTURNS - imoves[i+1]);
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

	let n = 25;  // number of scramble moves

	//let imoves = getScramble(n);
	//applyExpandedMoves(imoves, state);
	//let moves = render(imoves);

	let moves = render(getScramble(n));
	apply(moves, state, true);

	moveHistory.push(moves);

	console.log("scramble = " + moves);
	console.log("reverse scramble = " + undo(moves));
}

function unscramble(state)
{
	// Undo full history of moves, including user moves and random scrambles
	for (let i = moveHistory.length - 1; i >= 0; i--)
	{
		let moves = moveHistory.pop();
		apply(undo(moves), state, true);
	}
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
			moves = rc.CHAR_Z;
		else if (state[22] == upColor)
			moves = rc.CHAR_X;
		else if (state[31] == upColor)
			moves = rc.CHAR_Z + rc.CHAR_CCW;
		else if (state[40] == upColor)
			moves = rc.CHAR_X + rc.CHAR_CCW;
		else if (state[49] == upColor)
			moves = rc.CHAR_Z + rc.CHAR_2;
		else
		{
			// TODO: catch
		}
		apply(moves, state, false);
	}

	// Orient front face
	while (state[22] != frontColor)
	{
		// TODO:  catch infinite loop
		apply(rc.CHAR_Y, state, false);
	}

	return state;
}

function renderRubik()
{
	// Render the cube in the VTK render window and as text

	if (!ANIMATE)
		rubikVtk.setColors(stateg)

	document.getElementById(RUBIK_BODY).innerHTML = state2string(stateg);
}

function processCommand()
{
	//console.log("starting processCommand()");

	let command = document.forms.rubikForm.command.value;

	if (command == "")
	{
		// Do nothing
		return;
	}

	// Reset text input.
	document.forms.rubikForm.command.value = "";

	//console.log('command = "' + command + '"');
	//console.log("stateg = " + stateg);

	let caught = false;
	let errstr = "";
	try
	{
		apply(command, stateg, true);
	}
	catch (e)
	{
		caught = true;
		errstr = e;
		//console.log("caught: " + errstr);
	}

	// toString() is a hack to compare array values instead of pointers
	let solved = (orient(stateg).toString() == initState().toString());

	//console.log("stateg = " + orient(stateg).toString());

	inputHistory.push(command);
	iHistory = inputHistory.length;
	inputBuffer = "";

	commandHistory.push(command);
	renderRubik();

	// Show at most nshow commands
	let nshow = 10;
	let n = commandHistory.length;
	let cbody = "";
	for (let i = Math.max(0, n - nshow); i < n; i++)
		cbody += commandHistory[i] + "\n";

	if (caught)
	{
		cbody += errstr + "\n";
	}
	else
	{
		// Only save valid moves for unscrambling
		moveHistory.push(command);
	}

	if (solved)
	{
		// TODO:  move the solution indicator somewhere else.  After clicking
		// "Scramble", this isn't right.

		// Clear moveHistory to only unscrambling once
		moveHistory = [];

		cbody += "Successfully solved!\n";
	}

	document.getElementById(COMMAND_BODY).innerHTML = cbody;
	//console.log("ending processCommand()");
}

function processScramble()
{
	//console.log("starting processScramble()");
	scramble(stateg);
	renderRubik();
}

function processUnscramble()
{
	//console.log("starting processUnscramble()");
	unscramble(stateg);
	renderRubik();
}

function commandKeyDown(e)
{
	const upArrowKey = 38;
	const downArrowKey = 40;
	const enterKey = 13;

	let input0 = document.forms.rubikForm.command.value;

	//console.log("iHistory = " + iHistory);
	//console.log("inputHistory.length = " + inputHistory.length);

	if (e.keyCode == upArrowKey)
	{
		//console.log("up");

		if (input0 != "")
		{
			if (iHistory < inputHistory.length)
				inputHistory[iHistory] = input0;
			else
				inputBuffer = input0;
		}

		iHistory--;
		if (iHistory < 0)
			iHistory = 0;

		if (iHistory < inputHistory.length)
			document.forms.rubikForm.command.value = inputHistory[iHistory];

		// TODO: place cursor at end of input field
		//document.forms.rubikForm.command.selectionStart = document.forms.rubikForm.command.selectionEnd = document.forms.rubikForm.command.value.length;
	}
	else if (e.keyCode == downArrowKey)
	{
		//console.log("down");

		//if (input0 != "")
		//{
			if (iHistory < inputHistory.length)
				inputHistory[iHistory] = input0;
		//}

		iHistory++;
		if (iHistory > inputHistory.length)
			iHistory = inputHistory.length;

		if (iHistory < inputHistory.length)
			document.forms.rubikForm.command.value = inputHistory[iHistory];
		else
			document.forms.rubikForm.command.value = inputBuffer;
	}
	else if (e.keyCode == enterKey)
		processCommand();

}

function initialize()
{
	console.log("starting rubik.initialize()");

	stateg = initState();

	rubikVtk.initialize();
	rubikVtk.setColors(stateg);

	processScramble();

	document.forms.rubikForm.command.addEventListener("change", processCommand);
	document.forms.rubikForm.command.addEventListener("keydown", commandKeyDown);

	document.getElementById(SCRAMBLE).addEventListener("click", processScramble);
	document.getElementById(UNSCRAMBLE).addEventListener("click", processUnscramble);
}

//==============================================================================

export default
{
	initialize,
	parse
};

