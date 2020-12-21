"use strict";

// These functions are extremely dangerous without size or bounds checking!

function dot(a, b)
{
	let d = 0.0;
	for (let i = 0; i < a.length; i++)
		d += a[i] * b[i];
	return d;
}

function dot3(a, b)
{
	return a[0] * b[0] +
	       a[1] * b[1] +
	       a[2] * b[2];
}

function norm(a)
{
	return Math.sqrt(dot(a, a));
}

// norm3?

function scale(vector, scalar)
{
	let s = [];
	for (let i = 0; i < vector.length; i++)
		s.push(scalar * vector[i]);
	return s;
}

function scale3(vector, scalar)
{
	return [
			scalar * vector[0],
			scalar * vector[1],
			scalar * vector[2]
		];
}

function add(a, b)
{
	let c = [];
	for (let i = 0; i < a.length; i++)
		c.push(a[i] + b[i]);
	return c;
}

function add3(a, b)
{
	return [
			a[0] + b[0],
			a[1] + b[1],
			a[2] + b[2]
		];
}

function sub(a, b)
{
	let c = [];
	for (let i = 0; i < a.length; i++)
		c.push(a[i] - b[i]);
	return c;
}

function sub3(a, b)
{
	return [
			a[0] - b[0],
			a[1] - b[1],
			a[2] - b[2]
		];
}

function cross(a, b)
{
	// 3D only
	return [
			a[1] * b[2] - a[2] * b[1],
			a[2] * b[0] - a[0] * b[2],
			a[0] * b[1] - a[1] * b[0]
		];
}

//function rotate(p, r0, u, stheta, ctheta)
function rotate(p, u, stheta, ctheta)
{
	// Given point p, rotate it by angle theta around vector u with a rotation
	// center at r0, and return the rotated point pr.
	//
	// See the last equation (without translations) here:
	//
	//     https://en.wikipedia.org/wiki/Rotation_matrix#Rotation_matrix_from_axis_and_angle

	//// Normalize vector (assumed)
	//let ul = scale3(u, 1.0 / norm(u));

	//// Initialize
	//let pr = p;//.slice();

	//// Translate to origin at r0
	//pr = sub3(pr, r0);

	// Temp var to save repeated calculation
	let ucp = cross(u, p);

	// Rotate
	p = add3(add3(
		scale3(u            , dot3(u, p)),
		scale3(cross(ucp, u), ctheta)),
		scale3(ucp          , stheta));

	//// Translate back
	//pr = add3(pr, r0);

	return p;
}

export default
{
	dot,
	dot3,
	norm,
	scale,
	scale3,
	add,
	add3,
	sub,
	sub3,
	cross,
	rotate
}

