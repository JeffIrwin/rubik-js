"use strict";

const parse = require("./rubik.js");

// Use toBe() to compare primitives.  Use toStrictEqual() to compare array elements.
test("parse(R L')", () =>
		{
			//expect(sum1(1, 2)).toBe(3);
			expect(parse("R L'")).toStrictEqual([0,3,2,1]);
		}
	);

// Note the moves1 string ends with a face ID, not "'", "2", or whitespace
let moves1 = "R L U D' F' B' x y' z2 S E2 M' b f2 d' u' l2 r";
let imoves1 = [0,3,2,3,1,3,3,1,4,1,5,1,15,3,16,1,17,2,8,3,7,2,6,1,14,3,13,2,
	12,1,10,1,11,2,9,3];
test("parse(" + moves1 + ")", () => {expect(parse(moves1)).toStrictEqual(imoves1);});

