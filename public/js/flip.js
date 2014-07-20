/*

  Created by David Walsh

  http://davidwalsh.name/css-flip
  
*/
$(document).ready(function() {
  	$("#flip-toggle").click (function() {
      	//alert ("back");
		document.querySelector('#flip-toggle').classList.toggle('hover');
    });
});