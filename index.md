
# Rubik's cube

See my [GitHub profile](https://github.com/JeffIrwin).

<pre><p id="rubikBody" onload="initRubikGame()"></p></pre>
<!-- onsubmit=... stops the whole page from reloading on form submission -->
<form name="rubikForm" onsubmit="return false">
	<p>
		Rubik command:
		<input name="command" type="text" onChange="processRubikCommand()">
	</p>
</form>

<script src="rubik.js"></script>

