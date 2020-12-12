
# Rubik's cube

<pre><p id="rubikBody"></p></pre>

<pre><p id="commandHistoryBody"></p></pre>

<!-- onsubmit=... stops the whole page from reloading on form submission -->
<form name="rubikForm" onsubmit="return false">
	<p>
		Rubik command:
		<input name="command" type="text">
	</p>
</form>

<p><a href="https://jeffirwin.github.io/rubik-js/about" title="Command help link" target="_blank">Command help</a></p>

<div id="rubikDiv"></div>

<script src="./dist/rubik.js"></script>

