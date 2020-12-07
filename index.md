
# Rubik's cube

<pre><p id="rubikBody"></p></pre>

<!-- onsubmit=... stops the whole page from reloading on form submission -->
<form name="rubikForm" onsubmit="return false">
	<p>
		Rubik command:
		<input name="command" type="text" onChange="processRubikCommand()">
	</p>
</form>

<script src="rubik.js" onload="initRubikGame()"></script>

<details>
  <summary>Command help</summary>

Clockwise face turns (`R`ight, `U`p, `L`eft, `D`own, `F`ront, and `B`ack):
- `R`
- `U`
- `L`
- `D`
- `F`
- `B`
- **case sensitive!**

Counterclockwise right face turn:
- `R'`
- and likewise using `'` for other faces

180 degree right face turn:
- `R2`
- and likewise with `2`

Whole cube rotations:
- `x`
- `y`
- `z`
- `x` rotates in the `R` face direction, `y` in `U`, and `z` in `F`

<details>
  <summary>More help</summary>

Middle-layer slice turns:
- `M` in `L` direction
- `E` in `D`
- `S` in `F`

Two-layer turns:
- `r`, `u`, `l`, `d`, `f`, `b`

## Rubik's algorithms
This CLI game is almost impossible to play without a physical cube in front of you to aid in muscle memory.  For help, here are some algorithms that can be copy-pasted into gameplay.

### First layer
If you don't know these algorithms, you're gonna have a bad time.

### Middle layer
Middle layer step, moving an edge piece from the top to the middle:

Upper-left to front-right:

    R U' R' U' F' U F 

Upper-right to front-left:

    L' U L U F U' F' 

### Top layer
Top step, top edge orientation:

    F R U R' U' R U R' U' F' 

Top step, top edge permutation (repeat as necessary then follow by a final `U`):

    R U R' U R U2 R' 

Top step, top corner permutation:

    U R U' L' U R' U' L 

Top step, top corner orientation:

    R' D' R D 

</details>

</details>

