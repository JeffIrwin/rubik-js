
<pre><p id="commandHistoryBody"></p></pre>

<!-- onsubmit=... stops the whole page from reloading on form submission -->
<form name="rubikForm" onsubmit="return false">
	<p>
		Rubik command:
		<input name="command" type="text">
		<a href="https://jeffirwin.github.io/rubik-js/about" title="Command help link" target="_blank">help</a>
	</p>
</form>

<div id="rubikDiv"></div>

<pre><p id="rubikBody"></p></pre>

<script src="./dist/rubik.js"></script>

