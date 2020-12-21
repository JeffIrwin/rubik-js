"use strict";

// Number of tiles along a 1D line
export const NTILESLINE = 3;

// Number of tiles on a face
export const NTILESFACE = NTILESLINE ** 2;

// Number of dimensions
export const NDIM = 3;

// Number of faces on cube
export const NFACE = NDIM * 2;

// Total number of tiles on the cube
export const NTILES = NFACE * NTILESFACE;

// Number of turns in a full rotation
export const NTURNS = 4;

// Face move IDs
export const
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

export const
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

export const MOVE_MAP = new Map([
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

export const MOVE_MAP_INV = new Map(Array.from(MOVE_MAP, a => a.reverse()));

// Twist amount IDs.  CW 90 degrees is default, otherwise CCW 90, or half turn
// (180 degrees).
export const
	TURN_CCW = 1,
	TURN_2 = 2,
	TURN_CW = 3
	;

export const
	CHAR_CCW = "'",
	CHAR_2 = "2",
	CHAR_CCW_ALT0 = "’",  // iOS ’ character(s)
	CHAR_CCW_ALT1 = String.fromCharCode(8217); 
	;

// Put the alternative character(s) first so they aren't used in the inverse map
export const TURN_MAP = new Map([
		[CHAR_CCW_ALT0, TURN_CCW],
		[CHAR_CCW_ALT1, TURN_CCW],
		[CHAR_CCW     , TURN_CCW],
		[CHAR_2       , TURN_2]
		]);

export const TURN_MAP_INV = new Map(Array.from(TURN_MAP, a => a.reverse()));

// Map from face-major state ordering to an ordering for flat 2D text display
export const FLAT_MAP =
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

// Colormap
export const CMAP = "wrbogy";

