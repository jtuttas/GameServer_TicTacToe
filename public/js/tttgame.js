        var URL = window.location.protocol + "//" + window.location.host;
        //console.log("Connecting to " + URL);
        var socket = io.connect(URL);
		var me;   // Spielername
		var gegner; // Name des gegners
		var game; // Spielname
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
						$("#info-invisible").attr("id","info-visible");
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
			$(".board-visible").attr("class","board-invisible");
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
                // call the server-side function 'adduser' and send one parameter (value of prompt)
				me=prompt("What's your name?");
				//game=prompt("What's the Game?");
				game="ttt";
				
				if (me!=null && game!=null) {
					var msg= {
						game:game,
						player: me
					}
					socket.emit('adduser',msg);
				}
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
				$("#choicebox-invisible").attr("id","choicebox-visible");
				$("#anfrage").text("Spielanfrage von Spieler "+data.from_player);		
			}
			else if (data.command=="cancelrequest") {
				$("#choicebox-visible").attr("id","choicebox-invisible");
				state=0;
			}
			else if (data.command=="request_acknowledged") {
				$("#info-visible").attr("id","info-invisible");
				state=2;
				//alert ("das Spiel kann beginnen");
				$(".board-invisible").attr("class","board-visible");
				currentplayer=data.from_player;
				gegner=data.from_player;
				//alert ("das Spiel kann beginnen: current_player="+currentplayer);
				currentsymbol="images/mark_x.png";
				$('#currentlogo').attr("src",currentsymbol);
				$("#msgbox").text("Warten auf "+currentplayer);
				$("#msgbox").attr("class","info");
			}
			else if (data.command=="request_rejected") {
				state=0;
				$("#info-visible").attr("id","info-invisible");
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
			}
			
		});
		
		// Wenn der Mitspieler die Verbindung beendet hat
        socket.on('updatedisconnected', function(msg) {
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
								$(this).attr("src",currentsymbol);
								var x = $(this).attr("elex");
								var y = $(this).attr("eley");
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
								}
								else if (penalty()) {
									msg.command="penalty"
									socket.emit('play', msg);	
									currentplayer="";
									$("#msgbox").text("Unentschieden");
									$("#msgbox").attr("class","info");
									state=3;
								}
								else {
									socket.emit('play', msg);	
									currentplayer="";
									$("#msgbox").text("Warten auf "+gegner);
									$("#msgbox").attr("class","info");
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
				});
				
				$("#cancel").click(function (e) {
					$("#info-visible").attr("id","info-invisible");
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
					$("#choicebox-visible").attr("id","choicebox-invisible");
					var msg = {
						game:"ttt",
						command:"request_acknowledged",
						from_player:me,
						to_player:gegner
					};
					// Der der das Spiel annimmt beginnt auch
					$(".board-invisible").attr("class","board-visible");
					state=2;
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
					$("#choicebox-visible").attr("id","choicebox-invisible");
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
			
        });
