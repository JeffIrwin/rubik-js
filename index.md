
<link rel="shortcut icon" type="image/png" href="favicon.png">

<pre><p id="commandHistoryBody"></p></pre>

<!-- onsubmit=... stops the whole page from reloading on form submission -->
<form name="rubikForm" onsubmit="return false">
	<p>
		Rubik command:
		<input name="command" type="text">
		<a href="https://jeffirwin.github.io/rubik-js/about" title="Command help link" target="_blank">help</a>
	</p>
</form>

<div id="rubikDiv" style="background: linear-gradient(#155799, #159957);"></div>

<input type="button" id="Scramble"   value="Scramble">
<input type="button" id="Unscramble" value="Unscramble">

<pre><p id="rubikBody"></p></pre>

<script src="./dist/main.js"></script>

Build revision `{{ site.github.build_revision }}`

