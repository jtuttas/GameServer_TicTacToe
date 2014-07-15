$(document).ready(function() {
    $('.tabs .tab-links a').click(function(e)  {
        var currentAttrValue = $(this).attr('href');
 
        // Show/Hide Tabs
        $('.tabs ' + currentAttrValue).show().siblings().hide();
 
        // Change/remove current tab to active
        $(this).parent('li').addClass('active').siblings().removeClass('active');
 
        e.preventDefault();
    });
	
   /*
    $('.square').click(function(){
        $(this).addClass('flipped');
		//alert ("ok");
        return false;
    });
	*/
});