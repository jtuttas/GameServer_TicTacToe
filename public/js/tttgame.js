        var URL = window.location.protocol + "//" + window.location.host;
        //console.log("Connecting to " + URL);
        var socket = io.connect(URL);

		var me;   // Spielername
		var gegner; // Name des gegners
		var score=0;
		var game="ttt"; // Spielname
		var state=0; // 0= Warten auf Spielpaarung, 1== angefragt ,2== gepaart (am Spielen), 3== beendet
		var board = new Array();
		board[0] = new Array();
		board[0][0] = "images/empty.png"; 
		board[0][1] = "images/empty.png"; 
		board[0][2] = "images/empty.png"; 
 		board[1] = new Array();
		board[1][0] = "images/empty.png"; 
		board[1][1] = "images/empty.png"; 
		board[1][2] = "images/empty.png"; 
 		board[2] = new Array();
		board[2][0] = "images/empty.png"; 
		board[2][1] = "images/empty.png"; 
		board[2][2] = "images/empty.png"; 
		
		var currentplayer;
		var currentsymbol;
		
		function update_events() {
				$(".freeplayer").unbind();
				
				// Wenn Spieler nicht am spieln kann er andere einladen
				$(".freeplayer").click(function (e) {
					if ($(this).attr("name")==me) {
						alert ("Sie können nicht mit sich selbst spielen!");
					}
					else {
						gegner=$(this).attr("name");
						$("#info-visible").show();
						$('#randombutton').hide();
						//alert ("show");
						
						$("#anfrage2").text("Anfrage an Spieler "+gegner);
						
						state=1;
						var msg = {
							game:"ttt",
							command:"request",
							from_player:me,
							to_player:$(this).attr("name")
						}
						socket.emit("request",msg);
						var ms = {
							game:"ttt",
							command:"send",
							from_player:me,
							to_player:$(this).attr("name"),
							content:"Spielanfrage von "+me+" an "+$(this).attr("name"),
							content_class:"servermsg"
						}
				
                        // tell server to execute 'sendchat' and send along one parameter
                        socket.emit('sendgamechat', ms);
						
					}
				});
				
		}
		
		function cleargame() {
			currentplayer="";
			state=0;
			$("#board-visible").hide();
			$('#randombutton').show();
			for (var y=0;y<3;y++) {
				for (var x=0;x<3;x++) {
					$("#"+y+x).attr("src","images/empty.png");
					board[y][x]="images/empty.png";
				}
			}
			$("#msgbox").text(" ");
			$("#msgbox").attr("class","nomsg");

		}
		function penalty() {
			for (var y=0;y<3;y++) {
				for (var x=0;x<3;x++) {
					if (board[y][x]=="images/empty.png") {
						return false;
					}
				}
			}
			return true;
		}
		
		function winning() {
			
			// vertikal
			for (var x=0;x<3;x++) {
				if (board[0][x]==currentsymbol && board[1][x]==currentsymbol && board[2][x]==currentsymbol) {
					return true;
				}
			}
			// horizontal
			for (var y=0;y<3;y++) {
				if (board[y][0]==currentsymbol && board[y][1]==currentsymbol && board[y][2]==currentsymbol) {
					return true;
				}
			}
			
			// Diagonale
			if (board[0][0]==currentsymbol && board[1][1]==currentsymbol && board[2][2]==currentsymbol) {
				return true;
			}
			if (board[0][2]==currentsymbol && board[1][1]==currentsymbol && board[2][0]==currentsymbol) {
				return true;
			}
			
			return false;
		}
		

        // on connection to server, ask for user's name with an anonymous callback
        socket.on('connect', function(){
				$("#loginbox").show();
        });
		
		// on connection to server, ask for user's name with an anonymous callback
        socket.on('connecterror', function(msg){
                // call the server-side function 'adduser' and send one parameter (value of prompt)
				alert (msg);
				
				me=prompt("What's your name?");
				
				if (me!=null && game!=null) {
					var msg= {
						the_game:game,
						player: me
					}
					socket.emit('adduser',msg );
				}
				
        });

		// Update Login
		socket.on('updateresendlogin',function (data) {
			if (data.success) {
				$('#loginmsg').attr("class","success");
				$('#loginmsg').text(data.message);
			}
			else {
				$('#loginmsg').attr("class","error");
				$('#loginmsg').text(data.message);
			}
		});

		// Update Login
		socket.on('updatehighscores',function (data) {
			
			for (var i=0;i<data.length;i++) {
				$( "#sliste" ).append( "<p>"+data[i].score+" .. "+data[i].name+"</p>");
			}
			$( "#sliste" ).append( "<a href='#' id='sclose'>close</a>");
			$('#sclose').click(function(e) {
				$( "#sliste" ).empty();
			});
		});
		
		// Update Login
		socket.on('updatelogin',function (data) {
			if (data.success) {
				$('#loginbox').hide();
				$('#loginmsg').hide();
				$('#tttgamefield').show();
				me=data.user;
				var msg= {
						game:game,
						player: me,
						score:data.score
					}
				socket.emit('adduser',msg);
			}
			else {
				$('#loginmsg').text(data.message);
				$( "#loginmsg" ).append( "<a href='#' id='forgotten'> Benutzernamen oder Kennwort vergessen?</a>" );
				$('#forgotten').click(function (e) {
					$('#forgottenbox').show();
					$('#loginbox').hide();
					$('#loginmsg').attr("class","warning");
					$('#loginmsg').text("Geben Sie Ihre eMail Adresse an!");
					
				});
				$('#loginmsg').attr("class","error");
			}
		});
		// Update Rgister
		socket.on('updateregister',function (data) {
			if (data.success) {
				$('#registerbox').hide();
				$('#loginmsg').hide();
				$('#tttgamefield').show();
				me=data.user;
				var msg= {
						game:game,
						player: me
					}
				socket.emit('adduser',msg);
			}
			else {
				$('#loginmsg').text(data.message);
				$('#loginmsg').attr("class","error");
			}
		});
		
        // listener, whenever the server emits 'updatechat', this updates the chat body
        socket.on('updategamechat', function (data) {
				var n =$(".chatmsg").length; 
				while (n > 7) {
					$('.chatmsg:eq(0)').detach();
					n=$(".chatmsg").length;
				}
                $('#conversation').append('<div class="chatmsg"><b class='+data.content_class+'>'+data.from_player + ':</b> ' + data.content + '<br></div>');
        });

		// Der Client wir von einem anderen Spieler zum Mitspiele aufgefordert bzw. eine Aufforderung wurde angenommen oder abgelehnt
		socket.on('updaterequest',function (data) {
			//alert ("empfange update request command="+data.command);
			gegner=data.from_player;

			// Dieser Client wird zum Mitspielen aufgefordert
			if (data.command=="request") {
				$("#choicebox-visible").show();
				$('#randombutton').hide();

				$("#anfrage").text("Spielanfrage von Spieler "+data.from_player);		
			}
			else if (data.command=="cancelrequest") {
				$("#choicebox-visible").hide();
				$('#randombutton').show();
				state=0;
			}
			else if (data.command=="request_acknowledged") {
				$("#info-visible").hide();
				state=2;
				score=9;
				//alert ("das Spiel kann beginnen");
				$("#board-visible").show();
				currentplayer=data.from_player;
				gegner=data.from_player;
				//alert ("das Spiel kann beginnen: current_player="+currentplayer);
				currentsymbol="images/mark_x.png";
				$('#currentlogo').attr("src",currentsymbol);
				$("#msgbox").text("Warten auf "+currentplayer);
				$("#msgbox").attr("class","info");
				$("#currentscore").text(score);
			}
			else if (data.command=="request_rejected") {
				state=0;
				$("#info-visible").hide();
				$('#randombutton').show();
			}

		});
		

		// Empfange einen Spielzug
        socket.on('updateplay', function(msg) {
			//alert ("empfange update play command="+msg.command);
			for (var y=0;y<3;y++) {
				for (var x=0;x<3;x++) {
					$("#"+y+x).attr("src",msg.board[y][x]);
				}
			}
			board=msg.board;
			currentplayer=me;
			if (msg.command=="play") {
				$("#msgbox").text("Sie sind am Zug!");
				$("#msgbox").attr("class","success");
			}
			else if (msg.command=="won") {
				$("#msgbox").text(gegner+" hat gewonnen!");
				$("#msgbox").attr("class","error");
				state=3;				
			}
			else if (msg.command=="penalty") {
				$("#msgbox").text("Unentschieden");
				$("#msgbox").attr("class","info");
				var msg = {
					game:"ttt",
					from_player:me,
					score:score
				}
				socket.emit('addscore', msg);
				state=3;
			}
			else if (msg.command=="close") {
				cleargame();
				alert ("Ihr Mitspieler hat das Spiel beendet!");
				var msg = {
					game:"ttt",
					from_player:me
				}
				socket.emit('quitpaaring',msg);
				var msg = {
					game:"ttt",
					from_player:me,
					score:score
				}
				socket.emit('addscore', msg);
			}
			
		});
		
		// Wenn der Mitspieler die Verbindung beendet hat
        socket.on('updatedisconnected', function(msg) {
			var msg = {
				game:"ttt",
				from_player:me,
				score:score
			}
			socket.emit('addscore', msg);
		
			cleargame();
			alert ("System Message:"+msg);
		});
		
        // listener, whenever the server emits 'updateusers', this updates the username list
        socket.on('updateusers', function(data) {
                $('#users').empty();
                $.each(data, function(key, value) {
						if (state!=0 && value.ingame=="freeplayer") {
							$('#users').append('<div class="playerdisabled" name="'+key+'">' + key +" ("+value.score+")" + '</div>');
						}
						else {
							$('#users').append('<div class="'+value.ingame+'" name="'+key+'">' + key + " ("+value.score+")" + '</div>');
						}
						
                });
				update_events();	
        });

        // on load of page
        $(function(){
				$('#tttgamefield').hide();
				$("#loginbox").hide();
				$("#registerbox").hide();
				$("#forgottenbox").hide();
				$("#board-visible").hide();
				$("#info-visible").hide();
				$("#choicebox-visible").hide();
				
				
				
                // when the client clicks SEND
                $('#datasend').click( function() {
                        var message = $('#data').val();
                        $('#data').val('');
						var msg = {
							game:"ttt",
							from_player:me,
							content:message,
							content_class:"usermsg"
						}
                        socket.emit('sendgamechat', msg);
                });

				$('#randombutton').click ( function() {
						$("#info-visible").show();
						$('#randombutton').hide();
						$("#anfrage2").text("Suche Zufallsgegner");
						
						//state=1;
						var msg = {
							game:"ttt",
							command:"request",
							from_player:me
						}
						socket.emit("request",msg);
						var ms = {
							game:"ttt",
							command:"send",
							from_player:me,
							content:"Spielanfrage von "+me+" an zufälligen Spieler",
							content_class:"usermsg"
						}
                        socket.emit('sendgamechat', ms);
				});
								
				
				$('#loginbutton').click ( function() {
					var msg={
						user:$('#user').val(),
						password:$('#password').val()
					}
					socket.emit('login',msg);
				});
				$('#forgottenbutton').click ( function() {
					
					if ($('#forgottenemail').val()!="") {
						var msg={
							email:$('#forgottenemail').val()
						}
						socket.emit('resendlogin',msg);
						$('#loginmsg').attr("class","info");
						$('#loginmsg').text("Benutzerdaten angefodert für "+$('#forgottenemail').val());
						$('#forgottenemail').val('');
					}
					else {
						alert ("Geben Sie ihre eMail Adresse an!");
					}
				});
				$('.registerpanel').click ( function() {
					$('#loginbox').hide();
					$('#forgottenbox').hide();
					$('#registerbox').show();
					$('#loginmsg').attr("class","nomsg");
					$('#loginmsg').text("");
				});
				$('.loginpanel').click ( function() {
					$('#loginbox').show();
					$('#forgottenbox').hide();
					$('#registerbox').hide();
					$('#loginmsg').attr("class","nomsg");
					$('#loginmsg').text("");

				});
				$('.forgottpanel').click ( function() {
					$('#forgottenbox').show();
					$('#loginbox').hide();
					$('#registerbox').hide();
					$('#loginmsg').attr("class","nomsg");
					$('#loginmsg').text("");

				});
				$('#registerbutton').click ( function() {
					if ($('#registeruser').val() =="") {
						alert ("Bitte einen Benutzernamen angeben!");
					}
					else if ($('#registeremail').val() == "") {
						alert ("Bitte eine EMail Adresse angeben!");
					}
					else if ($('#registerpassword').val() == "") {
						alert ("Bitte eine Kennwort angeben!");
					}
					else if ($('#registerpassword').val() != $('#repassword').val()) {
						alert ("Die Kennworte stimmen nicht überein!");
					}
					else {
						var msg={
							game:game,
							email:$('#registeremail').val(),
							user:$('#registeruser').val(),
							password:$('#registerpassword').val()
						}
						socket.emit('register',msg);
					}
				});
				

				
                // when the client hits ENTER on their keyboard
                $('#data').keypress(function(e) {
                        if(e.which == 13) {
                                $(this).blur();
                                $('#datasend').focus().click();
                        }
                });
				
				$('.square').click(function(e) {
                        if(currentplayer==me) {
							if (state==2) {
								var x = $(this).attr("elex");
								var y = $(this).attr("eley");
								if (board[y][x]=="images/empty.png") {
									$(this).attr("src",currentsymbol);
									score--;
									$("#currentscore").text(score);
									board[y][x]=currentsymbol;
									var msg = {
										game:"ttt",
										command:"play",
										from_player:me,
										board:board
									}
									
									if (winning()) {
										msg.command="won"
										socket.emit('play', msg);	
										currentplayer="";
										$("#msgbox").text("Sie haben gewonnen!!!");
										$("#msgbox").attr("class","info");
										state=3;
										var ms = {
											game:"ttt",
											command:"send",
											from_player:me,
											content:"Hat das Spiel gewonnen",
											content_class:"usermsg"
										}
										socket.emit('sendgamechat', ms);
										var msg = {
											game:"ttt",
											from_player:me,
											score:score
										}
										socket.emit('addscore', msg);

									}
									else if (penalty()) {
										msg.command="penalty"
										socket.emit('play', msg);	
										currentplayer="";
										$("#msgbox").text("Unentschieden");
										$("#msgbox").attr("class","info");
										state=3;
										var ms = {
											game:"ttt",
											command:"send",
											from_player:me,
											content:"Das Spiel ist unentschieden",
											content_class:"usermsg"
										}
										socket.emit('sendgamechat', ms);
										var msg = {
											game:"ttt",
											from_player:me,
											score:score
										}
										socket.emit('addscore', msg);										
									}
									else {
										socket.emit('play', msg);	
										currentplayer="";
										$("#msgbox").text("Warten auf "+gegner);
										$("#msgbox").attr("class","info");
									}
								}
							}
							else if (state==3) {
								cleargame();
								var msg = {
									game:"ttt",
									from_player:me
								}
								socket.emit('quitpaaring',msg);
							}
                        }
						else {
							if (winning() || penalty()) {
								cleargame();
								var msg = {
									game:"ttt",
									from_player:me
								}
								socket.emit('quitpaaring',msg);
							}
							else {
								alert ("Sie sind nicht am Zug");
							}
						}
                });			

				$("#close").click(function(e) {
					var msg = {
						game:"ttt",
						command:"close",
						from_player:me,
						to_player:gegner,
						board:board
					}
					// send to server
					socket.emit('play', msg);	
					var msg = {
						game:"ttt",
						from_player:me
					}
					socket.emit('quitpaaring',msg);
					cleargame();
					var ms = {
						game:"ttt",
						command:"send",
						from_player:me,
						content:"Hat das Spiel beendet",
						content_class:"usermsg"
					}
					socket.emit('sendgamechat', ms);

				});
				
				$("#cancel").click(function (e) {
					$("#info-visible").hide();
					$('#randombutton').show();
					var msg = {
						game:"ttt",
						command:"cancelrequest",
						from_player:me,
						to_player:gegner
					};
					state=0;
					var ms = {
						game:"ttt",
						from_player:me,
						content:"Spielanfrage zurückgezogen!",
						content_class:"servermsg"
					}
					socket.emit('sendgamechat', ms);
					socket.emit("request",msg);
					
				});
				$("#yes").click(function (e) {
					$("#choicebox-visible").hide();
					var msg = {
						game:"ttt",
						command:"request_acknowledged",
						from_player:me,
						to_player:gegner
					};
					// Der der das Spiel annimmt beginnt auch
					$("#board-visible").show();
					state=2;
					score=9;
					$("#currentscore").text(score);
					currentplayer=me;
					currentsymbol="images/mark_o.png";
					$('#currentlogo').attr("src",currentsymbol);
					$("#msgbox").text("Sie sind am Zug");
					$("#msgbox").attr("class","success");
					var ms = {
						game:"ttt",
						from_player:me,
						to_player:gegner,
						content:"Spielanfrage von "+me+" angenommen!",
						content_class:"servermsg"
					}
					// tell server to execute 'sendchat' and send along one parameter
					socket.emit('sendgamechat', ms);
					socket.emit("request",msg);
				})
				$("#no").click(function (e) {
					$("#choicebox-visible").hide();
					$('#randombutton').show();
					var msg = {
						game:"ttt",
						command:"request_rejected",
						from_player:me,
						to_player:gegner
					};
					state=0;
					var ms = {
						game:"ttt",
						from_player:me,
						to_player:gegner,
						content:"Spielanfrage von "+me+" abgelehnt!",
						content_class: "servermsg"
					}
					// tell server to execute 'sendchat' and send along one parameter
					socket.emit('sendgamechat', ms);
					socket.emit("request",msg);
					
				});
				
				$("#highscoreliste").click(function(e) {
					$( "#sliste" ).empty();
					var ms = {
						game:"ttt",
						max:10
					}
					// tell server to execute 'sendchat' and send along one parameter
					socket.emit('highscores', ms);
					
				});
				$("#test").click(function(e) {
					$("#info-visible").show();
				});
			
        });
