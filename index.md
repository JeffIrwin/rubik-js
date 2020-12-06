
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

