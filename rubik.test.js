"use strict";

const parse = require("./rubik.js");

// TODO:  refactor these with a loop over all parse tests

// Use toBe() to compare primitives.  Use toStrictEqual() to compare array elements.
let moves0 = "R L'";
let imoves0 = [0,3,2,1];
test("parse(" + moves0 + ")", () => {expect(parse(moves0)).toStrictEqual(imoves0);});

// Note the moves1 string ends with a face ID, not "'", "2", or whitespace
let moves1 = "R L U D' F' B' x y' z2 S E2 M' b f2 d' u' l2 r";
let imoves1 = [0,3,2,3,1,3,3,1,4,1,5,1,15,3,16,1,17,2,8,3,7,2,6,1,14,3,13,2,
	12,1,10,1,11,2,9,3];
test("parse(" + moves1 + ")", () => {expect(parse(moves1)).toStrictEqual(imoves1);});

// iOS ’ character
let moves2 = "R’ L";
let imoves2 = [0,1,2,3];
test("parse(" + moves2 + ")", () => {expect(parse(moves2)).toStrictEqual(imoves2);});

