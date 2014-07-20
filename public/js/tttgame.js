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
		var userlist;

		function update_userlist(data) {
			$('#users').empty();
			$.each(data, function(key, value) {
				var friendclass="addfriend";
				var friendsrc="images/heard+.png";
				if (localStorage.getItem(key)!= undefined) {
					friendclass="subfriend";
					var friendsrc="images/heard-.png";
				}
				if ($('#friendsonly').is(':checked')) {
					if (localStorage.getItem(key)!= undefined) {
						if (state!=0 && value.ingame=="freeplayer") {
							//$('#users').append('<div class="playerdisabled" name="'+key+'">' + key +" ("+value.score+")" + '</div>');
							if (key==me) {
								$('#users').append('<div class="playerbox"><div class="playerdisbaled" name="'+key+'">' + key + "  ("+value.score+")</div></div>");						
							}
							else {
								$('#users').append('<div class="playerbox"><div class="playerdisbaled" name="'+key+'">' + key + "  ("+value.score+")</div><div class='friend'><img name='"+key+"' class='"+friendclass+"' src='"+friendsrc+"'></div></div>");						
							}
						}
						else {
							if (key==me) {
								$('#users').append('<div class="playerbox"><div class="'+value.ingame+'" name="'+key+'">' + key + "  ("+value.score+")</div></div>");
							}
							else {
								//$('#users').append('<div class="'+value.ingame+'" name="'+key+'">' + key + " ("+value.score+")" + '</div>');
								$('#users').append('<div class="playerbox"><div class="'+value.ingame+'" name="'+key+'">' + key + "  ("+value.score+")</div><div class='friend'><img name='"+key+"'  class='"+friendclass+"' src='"+friendsrc+"'></div></div>");
							}
						}		
					}
				}
				else {
						if (state!=0 && value.ingame=="freeplayer") {
							//$('#users').append('<div class="playerdisabled" name="'+key+'">' + key +" ("+value.score+")" + '</div>');
							if (key==me) {
								$('#users').append('<div class="playerbox"><div class="playerdisbaled" name="'+key+'">' + key + "  ("+value.score+")</div></div>");						
							}
							else {
								$('#users').append('<div class="playerbox"><div class="playerdisbaled" name="'+key+'">' + key + "  ("+value.score+")</div><div class='friend'><img name='"+key+"' class='"+friendclass+"' src='"+friendsrc+"'></div></div>");						
							}
						}
						else {
							if (key==me) {
								$('#users').append('<div class="playerbox"><div class="'+value.ingame+'" name="'+key+'">' + key + "  ("+value.score+")</div></div>");
							}
							else {
								//$('#users').append('<div class="'+value.ingame+'" name="'+key+'">' + key + " ("+value.score+")" + '</div>');
								$('#users').append('<div class="playerbox"><div class="'+value.ingame+'" name="'+key+'">' + key + "  ("+value.score+")</div><div class='friend'><img name='"+key+"'  class='"+friendclass+"' src='"+friendsrc+"'></div></div>");
							}
						}
				}
            });	
		}
		
		function update_events() {
				$(".freeplayer").unbind();
				$("#cancelbutton").unbind();
				$("#yesbutton").unbind();
				$("#nobutton").unbind();
				$(".addfriend").unbind();
				$(".subfriend").unbind();
				
				$(".addfriend").click(function (e) {
					$(this).attr("class","subfriend");
					$(this).attr("src","images/heard-.png");
					localStorage.setItem($(this).attr("name"),$(this).attr("name"));
					update_userlist(userlist);
					update_events();
					
				});
				$(".subfriend").click(function (e) {
					$(this).attr("class","addfriend");
					$(this).attr("src","images/heard+.png");
					localStorage.removeItem($(this).attr("name"));
					update_userlist(userlist);
					update_events();
				});
				

				$("#cancelbutton").click(function (e) {
					$("#msgbox").empty();
					$("#msgbox").text("Tic Tac Toe - Multiplayer");	
					$("#msgbox").attr("class","nomsg");
					$('#randombutton').show();
					$('#namedplayer').show();
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
				$("#yesbutton").click(function (e) {
					$("#msgbox").empty();
					$("#msgbox").text("Sie sind am Zug");
					$("#msgbox").attr("class","success");
					// Show/Hide Tabs
					var currentAttrValue = "#tab2";
					$('.tabs ' + currentAttrValue).show().siblings().hide();
					// Change/remove current tab to active
					$("#gametab").addClass('active').siblings().removeClass('active');
 
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
				$("#nobutton").click(function (e) {
					$('#randombutton').show();
					$('#namedplayer').show();
					$("#msgbox").empty();
					$("#msgbox").text("Tic Tac Toe - Multiplayer");	
					$("#msgbox").attr("class","nomsg");

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

				
				// Wenn Spieler nicht am spieln kann er andere einladen
				$(".freeplayer").click(function (e) {
					if ($(this).attr("name")==me) {
						$("#msgbox").empty();
						$("#msgbox").text("Sie können nicht mit sich selber spieler!");	
						$("#msgbox").attr("class","error");
					}
					else {
						gegner=$(this).attr("name");
						$('#randombutton').hide();
						$('#namedplayer').hide();
						//alert ("show");

						$("#msgbox").text("Anfrage an Spieler "+gegner);	
						$("#msgbox").attr("class","info");
						$("#msgbox").append('<input type="submit" name="login" id="cancelbutton" class="login-submit" value="cancel">');
						update_events();
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
			$('#namedplayer').show();
			for (var y=0;y<3;y++) {
				for (var x=0;x<3;x++) {
					// Steine die umgedreht wurde noch einmal umdrehen
					if (board[y][x]!="images/empty.png") {
						document.querySelector("#e"+y+x).classList.toggle('hover');
					}
					board[y][x]="images/empty.png";
				}
			}

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
        /*
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
		*/
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

		// Update Highscores
		socket.on('updatehighscores',function (data) {
			//alert ("platzierung="+data.platzierung+" rows="+data.rows.length);
			var c=0;
			var inList=false;
			$( "#tab3" ).append('<div class="htitel"><div class="scolum colh">Ranking</div><div class="scolum colh">Score</div><div class="lcolum colh">Name</div><div class="scolum colh">Games</div><div class="scolum colh">won</div><div class="scolum colh">lost</div><div class="lcolum colh">Klasse/Location</div></div>');
			for (var i=0;i<data.rows.length;i++) {
				if (data.rows[i].Name==me) {
					$( "#tab3" ).append('<div class="scorelineme"><div class="scolum colm">'+(i+1)+'</div><div class="scolum colm">'+data.rows[i].score+'</div><div class="lcolum colm">'+data.rows[i].Name+'</div><div class="scolum colm">'+data.rows[i].games+'</div><div class="scolum colm">'+data.rows[i].won+'</div><div class="scolum colm">'+data.rows[i].lost+'</div><div class="lcolum colm">'+data.rows[i].location+'</div></div>');
					inList=true;
				}
				else {
					c++;
					if (c%2==0) {
						$( "#tab3" ).append('<div class="scoreline0"><div class="scolum col1">'+(i+1)+'</div><div class="scolum col1">'+data.rows[i].score+'</div><div class="lcolum col1">'+data.rows[i].Name+'</div><div class="scolum col1">'+data.rows[i].games+'</div><div class="scolum col1">'+data.rows[i].won+'</div><div class="scolum col1">'+data.rows[i].lost+'</div><div class="lcolum col1">'+data.rows[i].location+'</div></div>');
					}
					else {
						$( "#tab3" ).append('<div class="scoreline1"><div class="scolum col0">'+(i+1)+'</div><div class="scolum col0">'+data.rows[i].score+'</div><div class="lcolum col0">'+data.rows[i].Name+'</div><div class="scolum col0">'+data.rows[i].games+'</div><div class="scolum col0">'+data.rows[i].won+'</div><div class="scolum col0">'+data.rows[i].lost+'</div><div class="lcolum col0">'+data.rows[i].location+'</div></div>');
					}
				}
				
			}
			if (inList==false) {
				$( "#tab3" ).append('<div class="htitel"><div class="scolum colh">:</div><div class="scolum colh">:</div><div class="lcolum colh">:</div><div class="scolum colh">:</div><div class="scolum colh">:</div><div class="scolum colh">:</div><div class="lcolum colh">:</div></div>');
				$( "#tab3" ).append('<div class="scorelineme"><div class="scolum colm">'+data.ranking+'</div><div class="scolum colm">'+data.score+'</div><div class="lcolum colm">'+me+'</div><div class="scolum colm">'+data.games+'</div><div class="scolum  colm">'+data.won+'</div><div class="scolum  colm">'+data.lost+'</div><div class="lcolum  colm">'+data.location+'</div></div>');				
			}
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
				$('#namedplayer').hide();

				$("#msgbox").text("Spielanfrage von Spieler "+data.from_player);	
				$("#msgbox").attr("class","info");
				$("#msgbox").append('<input type="submit" name="login" id="yesbutton" class="login-submit" value="yes">&nbsp;&nbsp;');
				$("#msgbox").append('<input type="submit" name="login" id="nobutton" class="login-submit" value="no">');
				update_events();

			}
			else if (data.command=="cancelrequest") {
				$("#msgbox").empty();
				$("#msgbox").text("Der Spieler hat die Spielanfrage zurückgezogen");	
				$("#msgbox").attr("class","warning");
				$('#randombutton').show();
				$('#namedplayer').show();
				state=0;
			}
			else if (data.command=="request_acknowledged") {
				var currentAttrValue = "#tab2";
				$('.tabs ' + currentAttrValue).show().siblings().hide();
				// Change/remove current tab to active
				$("#gametab").addClass('active').siblings().removeClass('active');
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
				$('#randombutton').show();
				$('#namedplayer').show();
				$("#msgbox").empty();
				$("#msgbox").text("Der Spieler hat die Spielanfrage abgelehnt");	
				$("#msgbox").attr("class","warning");

			}
			else if (data.command=="request_random_failed") {
				state=0;
				$('#randombutton').show();
				$('#namedplayer').show();
				$("#msgbox").empty();
				$("#msgbox").text("Keinen freien Spieler gefunden!");	
				$("#msgbox").attr("class","error");

			}
			else if (data.command=="player_not_found") {
				state=0;
				$('#randombutton').show();
				$('#namedplayer').show();
				$("#msgbox").empty();
				$("#msgbox").text("Kann Spieler "+data.to_player+" nicht finden!");	
				$("#msgbox").attr("class","error");

			}

		});
		

		// Empfange einen Spielzug
        socket.on('updateplay', function(msg) {
			//alert ("empfange update play command="+msg.command);
			for (var y=0;y<3;y++) {
				for (var x=0;x<3;x++) {
					if (msg.current_turnx==x && msg.current_turny==y) {
						document.querySelector("#e"+y+x).classList.toggle('hover');
						if (currentsymbol=="images/mark_o.png") {
							$("#i"+y+x).attr("src","images/mark_x.png");
						}
						else {
							$("#i"+y+x).attr("src","images/mark_o.png");
						}
					}
					else {
						$("#i"+y+x).attr("src",msg.board[y][x]);
					}
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
				var msg={
					game:game,
					user:me,
					games_total:1,
					games_won:0,
					games_lost:1
				}
				socket.emit('stats', msg);
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
				var msg={
					game:game,
					user:me,
					games_total:1,
					games_won:0,
					games_lost:0
				}
				socket.emit('stats', msg);
			}
			else if (msg.command=="close") {
				cleargame();
				$("#msgbox").text("Ihr Mitspieler hat das Spiel beendet!");
				$("#msgbox").attr("class","error");
				var currentAttrValue = "#tab1";
				$('.tabs ' + currentAttrValue).show().siblings().hide();
				// Change/remove current tab to active
				$("#chattab").addClass('active').siblings().removeClass('active');

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
				var msg={
					game:game,
					user:me,
					games_total:1,
					games_won:1,
					games_lost:0
				}
				socket.emit('stats', msg);
				
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
			var msg={
				game:game,
				user:me,
				games_total:1,
				games_won:1,
				games_lost:0
			}
			socket.emit('stats', msg);
		
			cleargame();
			$("#msgbox").empty();
			$("#msgbox").text("Verbindung zum Spielpartner verloren!");	
			$("#msgbox").attr("class","error");
			var currentAttrValue = "#tab1";
			$('.tabs ' + currentAttrValue).show().siblings().hide();
			// Change/remove current tab to active
			$("#chattab").addClass('active').siblings().removeClass('active');
		});
		
        // listener, whenever the server emits 'updateusers', this updates the username list
        socket.on('updateusers', function(data) {
				userlist=data;
                update_userlist(data);
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
				
				
				
				$("#friendsonly").click(function () {
					update_userlist(userlist);
					update_events();	
				});
				
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

				$('#namedplayer').click ( function() {
					$("#msgbox").empty();
					$("#msgbox").text("Spiele mit Spielpartner Name:");
					$("#msgbox").attr("class","info");
					$("#msgbox").append('<input id="namedplayer_data"  /><input type="button" id="namedplayer_ok" class="login-submit" value="ok" /><input type="button" id="namedplayer_cancel" class="login-submit" value="cancel" />');
					update_events();
					$('#randombutton').hide();
					$('#namedplayer').hide();
					$('#namedplayer_ok').click (function () {
						if ($('#namedplayer_data').val()==me) {
							$("#msgbox").empty();
							$("#msgbox").text("Sie können nicht mit sich selbst spielen!");	
							$("#msgbox").attr("class","error");
							$('#randombutton').show();
							$('#namedplayer').show();
						}
						else {
							gegner=$('#namedplayer_data').val();
							$("#msgbox").empty();
							$("#msgbox").text("Anfrage an Spieler "+gegner);	
							$("#msgbox").attr("class","info");
							$("#msgbox").append('<input type="submit" name="login" id="cancelbutton" class="login-submit" value="cancel">');
							update_events();

							var msg = {
								game:"ttt",
								command:"request",
								from_player:me,
								to_player: gegner
							}
							socket.emit("request",msg);
							var ms = {
								game:"ttt",
								command:"send",
								from_player:me,
								content:"Spielanfrage von "+me+" an "+gegner,
								content_class:"usermsg"
							}
							socket.emit('sendgamechat', ms);
						}
					});
					$('#namedplayer_cancel').click (function () {
						$("#msgbox").empty();
						$('#randombutton').show();
						$('#namedplayer').show();

						$('#msgbox').attr("class","nomsg");
						$('#msgbox').text("Tic Tac Toe - Multiplayer");
					});
				});
				$('#randombutton').click ( function() {
						$("#msgbox").text("Suche zufälligen Spielpartner");
						$("#msgbox").attr("class","info");
						$("#msgbox").append('<input type="submit" name="login" id="cancelbutton" class="login-submit" value="cancel">');
						update_events();
						$('#randombutton').hide();
						$('#namedplayer').hide();
						
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
						game:game,
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
						$('#loginmsg').empty();		
						$('#loginmsg').attr("class","error");
						$('#loginmsg').text("Geben Sie ihre eMail Adresse an!");
					}
				});
				$('.registerpanel').click ( function() {
					$('#loginbox').hide();
					$('#forgottenbox').hide();
					$('#registerbox').show();
					$('#loginmsg').attr("class","nomsg");
					$('#loginmsg').text("Tic Tac Toe - Multiplayer");
				});
				$('.loginpanel').click ( function() {
					$('#loginbox').show();
					$('#forgottenbox').hide();
					$('#registerbox').hide();
					$('#loginmsg').attr("class","nomsg");
					$('#loginmsg').text("Tic Tac Toe - Multiplayer");

				});
				$('.forgottpanel').click ( function() {
					$('#forgottenbox').show();
					$('#loginbox').hide();
					$('#registerbox').hide();
					$('#loginmsg').attr("class","nomsg");
					$('#loginmsg').text("Tic Tac Toe - Multiplayer");

				});
				$('#registerbutton').click ( function() {
					if ($('#registeruser').val() =="") {
						$('#loginmsg').empty();
						$('#loginmsg').attr("class","error");
						$('#loginmsg').text("Bitte einen Benutzernamen angeben!");
					}
					else if ($('#registeremail').val() == "") {
						$('#loginmsg').empty();
						$('#loginmsg').attr("class","error");
						$('#loginmsg').text("Bitte eine EMail Adresse angeben!");
					}
					else if ($('#registerpassword').val() == "") {
						$('#loginmsg').empty();
						$('#loginmsg').attr("class","error");
						$('#loginmsg').text("Bitte eine Kennwort angeben!");
					}
					else if ($('#registerpassword').val() != $('#repassword').val()) {
						$('#loginmsg').empty();
						$('#loginmsg').attr("class","error");
						$('#loginmsg').text("Die Kennworte stimmen nicht überein!");
					}
					else {
						var msg={
							game:game,
							email:$('#registeremail').val(),
							user:$('#registeruser').val(),
							password:$('#registerpassword').val(),
							location:$('#registerlocation option:selected').text()
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
				$('.flip-container').click(function(e) {
						
                        if(currentplayer==me) {
							if (state==2) {
								
								var x = $(this).attr("elex");
								var y = $(this).attr("eley");
								if (board[y][x]=="images/empty.png") {
									$(this).addClass('flipped');
									document.querySelector("#e"+y+x).classList.toggle('hover');
									$("#i"+y+x).attr("src",currentsymbol);
									score--;
									$("#currentscore").text(score);
									board[y][x]=currentsymbol;
									var msg = {
										game:"ttt",
										command:"play",
										from_player:me,
										board:board,
										current_turnx:x,
										current_turny:y
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
										var msg={
											game:game,
											user:me,
											games_total:1,
											games_won:1,
											games_lost:0
										}
										socket.emit('stats', msg);

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
										var msg={
											game:game,
											user:me,
											games_total:1,
											games_won:0,
											games_lost:0
										}
										socket.emit('stats', msg);
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
								var currentAttrValue = "#tab1";
								$('.tabs ' + currentAttrValue).show().siblings().hide();
								// Change/remove current tab to active
								$("#chattab").addClass('active').siblings().removeClass('active');

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
								var currentAttrValue = "#tab1";
								$('.tabs ' + currentAttrValue).show().siblings().hide();
								// Change/remove current tab to active
								$("#chattab").addClass('active').siblings().removeClass('active');
							}
							else {
								$("#msgbox").empty();
								$("#msgbox").text("Sie sind nicht am Zug!");	
								$("#msgbox").attr("class","warning");
							}
						}
                });			

				$("#close").click(function(e) {
					$("#msgbox").text("Sie haben das Spiel beendet!");
					$("#msgbox").attr("class","error");
					var currentAttrValue = "#tab1";
					$('.tabs ' + currentAttrValue).show().siblings().hide();
					// Change/remove current tab to active
					$("#chattab").addClass('active').siblings().removeClass('active');
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
					var msg={
						game:game,
						user:me,
						games_total:1,
						games_won:0,
						games_lost:1
					}
					socket.emit('stats', msg);
				});
				
				
				$("#highscoreliste").click(function(e) {
					$( "#tab3" ).empty();
					var ms = {
						game:"ttt",
						max:15,
						player:me
					}
					// tell server to execute 'sendchat' and send along one parameter
					socket.emit('highscores', ms);
					
				});
			
        });
