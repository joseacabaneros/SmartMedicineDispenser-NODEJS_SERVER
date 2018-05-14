$(document).ready(function(){
	//Refrescar pagina cada 1 minuto
	setInterval(function() {
		window.location.reload();
	}, 60000); 
	
	$('.count').each(function () {
	    $(this).prop('Counter',0).animate({
	        Counter: $(this).text()
	    }, {
	        duration: 2000,
	        easing: 'swing',
	        step: function (now) {
	            $(this).text(Math.ceil(now*100)/100);
	        }
	    });
	});
});