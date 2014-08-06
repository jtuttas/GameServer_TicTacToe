/*

Erhält der Server einen Befehl von einem Client, so leitet er diesen über eine Updatexxxx Methode an die betreffenden Clients weiter
Also z.B.
 OBJ -> "play"
 Server sendet "updateplay" mit OBJ

*/
var port = 8080;
var express = require('express')
,   app = express()
,   server = require('http').createServer(app)
,   io = require('socket.io').listen(server),
	mysql = require('mysql'),
	nodemailer = require('nodemailer');

var auth=  require('./mailconfig.json');
var dbconfig = require('./dbconfig.json');
//var connection = mysql.createConnection(dbconfig);
var transport = nodemailer.createTransport("SMTP", auth);
var connection;

function handleDisconnect() {
  connection = mysql.createConnection(dbconfig); // Recreate the connection, since
                                                  // the old one cannot be reused.

  connection.connect(function(err) {              // The server is either down
    if(err) {                                     // or restarting (takes a while sometimes).
      console.log('error when connecting to db:', err);
      setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
    }                                     // to avoid a hot loop, and to allow our node script to
  });                                     // process asynchronous requests in the meantime.
                                          // If you're also serving http, display a 503 error.
  connection.on('error', function(err) {
    console.log('db error', err);
    if(err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
      handleDisconnect();                         // lost due to either server restart, or a
    } else {                                      // connnection idle timeout (the wait_timeout
      throw err;                                  // server variable configures this)
    }
  });
};

handleDisconnect();
io.set('log level', 2);

var message = {

    // sender info
    from: 'Tuttas <tuttas68@gmail.com>',

    // Comma separated list of recipients
    to: '"Receiver Name" <jtuttas@gmx.net>',

    // Subject of the message
    subject: 'Ihre Benutzerdaten für den Gameserver', //

    // plaintext body
    text: 'Hello to myself!',

    // HTML body
    html:'<p><b>Hello</b> to myself <img src="cid:note@node"/></p>'+
         '<p>Here\'s a nyan cat for you as an embedded attachment:<br/><img src="cid:nyan@node"/></p>',

};

console.log(new Date()+":Listening on port " + port);
/*
connection.connect(function(err){
	if(err != null) {
		console.log(new Date()+':Error connecting to mysql:' + err+'\n');
	}
	else {
		console.log(new Date()+':connected to MYSQL Server');
	}
});

*/
server.listen(port);



app.configure(function(){
	// statische Dateien ausliefern
	app.use(express.static(__dirname + '/public'));
});

Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

function random (low, high) {
	var r= Math.round(Math.random() * (high - low) + low);
	
	//console.log ("Random zwischen "+low+" und "+high+" ist "+r);
    return r;
}

function get_NumberOfFreePlayer(players) {
	var num=0;
	for (var prop in players) {
		if (players[prop].ingame=="freeplayer") {
			num++;
		}
	}
	return num;
}

function get_Player(players,index) {
	//console.log ("Suche Spieler mit index "+index);
	var num=0;
	for (var prop in players) {
		if (num==index) {
			//console.log ("Habe den Spiler gefunden der Name ist "+players[prop].name+" ingame="+players[prop].ingame);
			return players[prop];
		}
		num++;
	}
}

function get_random_player(players,from_player) {
	//console.log ("get_random Player Number of free Playres="+get_NumberOfFreePlayer(players))
	var size=Object.size(players);
	if (get_NumberOfFreePlayer(players)>=2) {
		var pl = get_Player(players,random(0,size-1));
		//console.log ("gewählt wurde Spieler "+pl.name +" ingame="+pl.ingame);
		while (pl.ingame!="freeplayer" || pl.name==from_player) {
			pl = get_Player(players,random(0,size-1));
			//console.log ("Der Spieler war leider nicht frei oder sie selsbt => neuer Spieler ist "+pl.name +" ingame="+pl.ingame);
		}
		return pl.name;
	}
}

// gamenames and usernames which are currently connected to the system
var games = {
		"users":{
			"name":"noname",
			ingame:"freeplayer", // css Klasse des Spielers (zeigt an ob sich der Spieler in einem Spiel gefindet)
			score:0
		}
	};
// Objekt mit allen Client-Sockets des Servers
var clients = {};
// Objekt mit Spielernamen die sich in einer Spielpaarung befinden
var paarungen = {};
// Objekt mit Spielernamen die sich in einer Spielpaarunganfrage befinden
var paaringrequests = {
	player: "mo",
	type: "no"
};


io.sockets.on('connection', function (socket) {

	console.log(new Date()+'Socket Connection');

	/* Highscoreliste abfragen
		var ms = {
			game:"ttt",
			max:10,
			player:xyz
		}
		
	    Rückgabeobject:
		var msg= {
			rows:{}, 		Platzierungen mit Name,Score,location
			ranking:0, 		eigene Platzierung
			location:0,		eigene Location
			score:0			eigene Score,
			games:10		gespielte Spiele
			won:6			gewonnene Spiele
			lost:			verlorene Spiele
		}
	*/
	socket.on('highscores', function (data) {
		var msg= {
			rows:{},
			ranking:0,
			location:0,
			score:0,
			games:0,
			won:0,
			lost:0
		}
		console.log(new Date()+":Highscore for game "+data.game+" for user "+data.player);
		connection.query("Select `User`.Name,user_game.score,user_game.games,user_game.won,user_game.lost,`User`.location from User inner join user_game on `User`.`name`=user_game.`Name` inner join Game on user_game.Game=Game.id where Game.`name`='"+data.game+"' ORDER BY user_game.score DESC Limit "+data.max, function(err, rows){
			if(err != null) {
				console.log(new Date()+":Query error:" + err);
			} 
			msg.rows=rows;	
			connection.query("Select `User`.`location`,user_game.score,user_game.games,user_game.won,user_game.lost from User inner join user_game on `User`.`name`=user_game.`Name` inner join Game on user_game.Game=Game.id where Game.`name`='"+data.game+"' AND `User`.`name`='"+data.player+"'", function(err, rows){
				if(err != null) {
					console.log(new Date()+":Query error:" + err);
				} 
				msg.location=rows[0].location;
				msg.score=rows[0].score;
				msg.games=rows[0].games;
				msg.won=rows[0].won;
				msg.lost=rows[0].lost;
				connection.query("Select count(*) as num from User inner join user_game on `User`.`name`=user_game.`Name` inner join Game on user_game.Game=Game.id where Game.`name`='"+data.game+"' AND user_game.score>=(select user_game.score from user_game inner join Game on user_game.Game=Game.id  where user_game.`Name`='"+data.player+"' and Game.name='"+data.game+"') ORDER BY user_game.score DESC", function(err, rows){
					if(err != null) {
						console.log(new Date()+":Query error:" + err);
					} 
					msg.ranking=rows[0].num;
					socket.emit('updatehighscores',msg);
				});
			});
		});
	});

	/* Benutzerdaten zusenden
		var msg={
			email:email
		}
	*/
	socket.on('resendlogin', function (data) {
		connection.query("SELECT * from User where email='"+data.email+"'", function(err, rows){
			// There was a error or not?
			if(err != null) {
				console.log(new Date()+":Query error:" + err);
			} 
			else {			
				if (rows[0]==undefined) {
					msg= {
						success:false,
						message:"Kann eMail adresse '"+data.email+"' nicht finden!"
					}
					// Shows the result on console window
					console.log(new Date()+":Kann eMail adresse '"+data.email+"' nicht finden!");
					socket.emit('updateresendlogin',msg);
				}
				else {
					message.to='"Gameserver User" <'+data.email+'>';
					message.test="Hallo,\nIhre Benutzerdaten für den Gameserver lauten\n\nBenutzername: "+rows[0].name+"\nKennwort: "+rows[0].kennwort+"\n\nMit freundlichen Grüßen\n\nJörg Tuttas";
					message.html="<p>Hallo,</p><p>Ihre Benutzerdaten für den Gameserver lauten</p></br><b>Benutzername:</b> "+rows[0].name+"</br><b>Kennwort: </b>"+rows[0].kennwort+"</br></br>Mit freundlichen Grüßen</br></br>Jörg Tuttas";
					console.log(new Date()+':Sending Mail');
					transport.sendMail(message, function(error){
						if(error){
							console.log(new Date()+':Error occured');
							console.log(new Date()+":"+error.message);
							msg= {
								success:false,
								message:"Serverfehler:"+error.message
							}
							// Shows the result on console window
							socket.emit('updateresendlogin',msg);
						}
						else {
							console.log(new Date()+':Message sent successfully!');
							msg= {
								success:true,
								message:"Benutzerdaten gesendet an "+data.email
							}
							// Shows the result on console window
							socket.emit('updateresendlogin',msg);
						}

						// if you don't want to use this transport object anymore, uncomment following line
						//transport.close(); // close the connection pool
					});
					
				}
			}
		});
	});
	
	/* Spielstatistik aktualisieren (hier wird keine update routine angesprochen!)
		var msg={
			game:game,
			user:benutzername,
			games_total:0,
			games_won:0,
			games_lost:0
		}
	*/
	socket.on('stats', function (data) {
		console.log (new Date()+":Empfange Stats für "+data.user+" für Spiel "+data.game);
		connection.query("UPDATE user_game SET games=games+"+data.games_total+",won=won+"+data.games_won+",lost=lost+"+data.games_lost+" WHERE name='"+data.user+"' and game=(select id from Game where name='"+data.game+"')", function(err, rows){
			if(err != null) {
				console.log(new Date()+":Query error:" + err);
			} 
		});
	});
	
	/* Registrierung am System
		var msg={
			game:game,
			user:benutzername,
			password:kennwort,
			email:email
			location:deutschland
		}
	*/
	socket.on('register', function (data) {
		console.log (new Date()+":Empfange Register von "+data.user+" mit Kennwort "+data.password+" location="+data.location+" email="+data.email);
		connection.query("SELECT * from User where email='"+data.email+"'", function(err, rows){
			if(err != null) {
				console.log(new Date()+":Query error:" + err);
			} 
			if (rows[0]!=undefined) {
				msg= {
					success:false,
					message:"Die eMail Adresse '"+data.email+"' existiert bereits!",
					user:data.user,
					password:data.password
				}
				// Shows the result on console window
				console.log(new Date()+":EMail Adresse "+data.email+" existiert bereits!");
				socket.emit('updateregister',msg);
			}
			else {
				connection.query("SELECT * from User where name='"+data.user+"'", function(err, rows){
					if(err != null) {
						console.log(new Date()+":Query error:" + err);
					} 
					if (rows[0]==undefined) {
						connection.query("INSERT INTO User (name,kennwort,email,location) VALUES ('"+data.user+"','"+data.password+"','"+data.email+"','"+data.location+"');", function(err, rows){
							if(err != null) {
								console.log(new Date()+":Query error:" + err);
							}
						});					
						connection.query("INSERT INTO user_game (Name,game,score,games,won,lost) VALUES ('"+data.user+"',(Select id from Game where name='"+data.game+"'),0,0,0,0);", function(err, rows){
							if(err != null) {
								console.log(new Date()+":Query error:" + err);
							}
							else {
								console.log(new Date()+":Neuer Benutzer angelegt!");
								msg= {
									success:true,
									message:"Registrierung erfolgreich!",
									user:data.user,
									password:data.password,
									score:0
								}
								// Shows the result on console window
								console.log(new Date()+":Registrierung erfolgreich für "+data.user);
								socket.emit('updateregister',msg);
							}
						});	
					}
					else {
						msg= {
							success:false,
							message:"Der Benutzer '"+data.user+"' existiert bereits!",
							user:data.user,
							password:data.password
						}
						// Shows the result on console window
						console.log(new Date()+":Benutzername "+data.user+" existiert bereits!");
						socket.emit('updateregister',msg);
					}
				});
			}
		});
		
	});
	/* Anmeldung am System
		var msg={
			user:benutzername,
			password:kennwort,
			game:game
		}
	*/
	socket.on('login', function (data) {
		console.log (new Date()+":Empfange Login von "+data.user+" mit Kennwort "+data.password+" game="+data.game);
		if (games[data.game]!=undefined && games[data.game][data.user]!=undefined) {
			msg= {
				success:false,
				message:"Der Benutzer '"+data.user+"' ist bereits eingeloggt!",
				user:data.user,
				password:data.password
			}
			// Shows the result on console window
			console.log(new Date()+":Der Benutzer "+data.user+" ist bereits eingeloggt!");
			socket.emit('updatelogin',msg);
		}
		else {
			connection.query("SELECT User.name,user_game.score,User.kennwort from User inner join user_game on User.name=user_game.Name where `User`.name='"+data.user+"'", function(err, rows){
			// There was a error or not?
			if(err != null) {
				console.log(new Date()+":Query error:" + err);
			} else {			
				if (rows[0]==undefined) {
					msg= {
						success:false,
						message:"Kann den Benuternamen '"+data.user+"' nicht finden",
						user:data.user,
						password:data.password
					}
					// Shows the result on console window
					console.log(new Date()+":Benutzername "+data.user+" unbekannt!");
					socket.emit('updatelogin',msg);
				}
				else if (rows[0].kennwort!=data.password) {
					msg= {
						success:false,
						message:"Das Kennwort für Benutzer '"+data.user+"' ist falsch!",
						user:data.user,
						password:data.password
					}
					// Shows the result on console window
					console.log(new Date()+":Benutzername "+data.user+" bekannt aber Kennwort falsch, Kennwort war "+rows[0].kennwort);
					socket.emit('updatelogin',msg);
				}
				else {
					msg= {
						success:true,
						message:"Login Erfolgreich!",
						user:data.user,
						password:data.password,
						score:rows[0].score
					}
					// Shows the result on console window
					console.log(new Date()+":Login erfolgreich für "+data.user);
					socket.emit('updatelogin',msg);
				}
			}
			});

		}
        // Close connection
        //connection.end();
	});

    // Sende die Chatnachricht an Mitspieler-Client
	/*
		Das minimal gesendete Objekt sieht so aus (weitere Attribute sind Sache des Clients)
		
		var ms = {
			from_player: me,
			to_player:partner
		}
	*/
    socket.on('sendchat', function (data) {
		console.log(new Date()+":Empfange Chat from "+data.from_player+" an "+data.to_player);
		if (clients[data.to_player]!=undefined) {
			var s = clients[data.to_player];
			s.emit('updatechat',data);
		}
    });

	 // Send Chat msg to all game players 
	 /*
		Das (min) gesendete Objekt sieht so aus:(weitere Attribute sind Sache des Clients)
		
		var ms = {
			game:"ttt",
		}
	 */
    socket.on('sendgamechat', function (data) {
		console.log(new Date()+":Empfange GameChat "+data.message);
		for (key in games[data.game]) {
			console.log("Sende updategamechat an "+key);
			var s = clients[key];
			s.emit('updategamechat', data);
		}
    });
	
	
	
	 // Empfange Spielzug, der Spielzur wird an den gepaarten Partner weitergeleitet.
	/*
		Das (min) gesendete Objekt sieht so aus:(weitere Attribute sind Sache des Clients)
		
		var ms = {
			game:"ttt",
			command:play,  Spielkommando (play,timeout,won,penalty,close)
			from_player: xy
		}
	*/
	socket.on('play', function (data) {
		if (paarungen[data.from_player] != undefined) {
			var to_player=paarungen[data.from_player];
			console.log(new Date()+":Empfange play command "+data.command+" von "+data.from_player+" game="+data.game);

			var s = clients[to_player];
			// Weiterleiten an Spielpartner
			s.emit('updateplay', data);
			
		}
		else {
			console.log(new Date()+":Habe Spielzug empfangen aber keinen Partner dazu gefunden!");
		}
    });

	
	
	// Quit Paaring, Eine Paarung wird beendet und der neue Zustand allen Client mitgeteilt
	/*
	Das (min) gesendete Objekt sieht so aus:(weitere Attribute sind Sache des Clients)
		
		var ms = {
			game:"ttt",
			from_player: xy
		}
	*/
    socket.on('quitpaaring', function (data) {
		console.log(new Date()+":Quit Paaring from:"+data.from_player);
		delete paarungen[data.from_player];
		games[data.game][data.from_player]["ingame"]="freeplayer";
		for (key in games[data.game]) {
			var s = clients[key];
			s.emit('updateusers', games[data.game]);
			console.log(new Date()+":Sende Updateusers an:"+key);
		}
	});

	/*
	Das (min) gesendete Objekt sieht so aus:(weitere Attribute sind Sache des Clients)
		
		var ms = {
			game:"ttt",
			from_player: xy,
			score: 1      Der Betrag der der Score hinzugefügt wird
		}
	*/
    socket.on('addscore', function (data) {
		connection.query("UPDATE user_game SET score=score+"+data.score+" WHERE name='"+data.from_player+"' and game=(select id from Game where name='"+data.game+"');", function(err, rows){
			if(err != null) {
				console.log(new Date()+":Query error:" + err);
			} 
			else {
				games[data.game][data.from_player].score+=data.score;
				for (key in games[data.game]) {
					var s = clients[key];
					s.emit('updateusers', games[data.game]);
					console.log(new Date()+":Sende Updateusers an:"+key);
				}
			}
		});
	});
	
	// Anfrage an einen Spieler (Wunsch nach Paarung oder Zurückziehen des Wunsches)
	/*
	Das (min) gesendete Objekt sieht so aus:(weitere Attribute sind Sache des Clients)
		
		var ms = {
			game:"ttt",
			from_player: xy,
			to_player: yz,      Wenn to_player nicht gesetzt, dann wird ein zufälliger Spieler gewählt
			command:request   	request=Wunsch nach Paarung
								cancelrequest=Paarungswunsch wird zurückgezogen
								request_acknowladged = Paarungswunsch angenommen
								request_rejected = Paarungswunsch abgelehnt
								request_random_failed = Keine Zufällige Spielparung möglich
								player_not_found = Der Gegenspieler wurde nicht gefunden
		}
	*/
    socket.on('request', function (data) {
        // we tell the client to execute 'updatechat' with 2 parameters
		console.log(new Date()+":Request type:"+data.command+" from:"+data.from_player+" to "+data.to_player+ " game="+data.game);
		
		if (data.command=="request") {
			if (data.to_player == undefined) {
				console.log(new Date()+":Paarungsanfrage von "+data.from_player+" an zufälligen Spieler");
				
				var to_player=get_random_player(games[data.game],data.from_player);
				if (to_player!=undefined) {
					data.to_player=to_player;
					console.log(new Date()+":Paarungsanfrage von "+data.from_player+" an "+data.to_player);
					games[data.game][data.from_player]["ingame"]="playerpending";
					games[data.game][data.to_player]["ingame"]="playerpending";
					paaringrequests[data.from_player]={};
					paaringrequests[data.from_player].player=data.to_player;
					paaringrequests[data.from_player].type="request";
					
					paaringrequests[data.to_player]={};
					paaringrequests[data.to_player].player=data.from_player;
					paaringrequests[data.to_player].type="requested";
				}
				else {
					console.log(new Date()+":Paarung nicht möglich weil keine freien Spieler !");
					data.command="request_random_failed";
					var socket = clients[data.from_player];
					socket.emit('updaterequest', data);					
				}
			}
			else {
				console.log(new Date()+":Paarungsanfrage von "+data.from_player+" an "+data.to_player);
				if (games[data.game][data.to_player]==undefined) {
					console.log(new Date()+":Gegenspieler "+data.to_player+" nicht gefunden!");
					data.command="player_not_found";
					var socket = clients[data.from_player];
					socket.emit('updaterequest', data);					
				}
				else {
					games[data.game][data.from_player]["ingame"]="playerpending";
					games[data.game][data.to_player]["ingame"]="playerpending";
					paaringrequests[data.from_player]={};
					paaringrequests[data.from_player].player=data.to_player;
					paaringrequests[data.from_player].type="request";
					
					paaringrequests[data.to_player]={};
					paaringrequests[data.to_player].player=data.from_player;
					paaringrequests[data.to_player].type="requested";
				}
			}
		}
		else if (data.command=="cancelrequest") {
			if (data.to_player==undefined) {
				data.to_player=paaringrequests[data.from_player].player;
			}
			console.log(new Date()+":Paarungsanfrage von "+data.from_player+" an "+data.to_player+" zurückgezogen");
			games[data.game][data.from_player]["ingame"]="freeplayer";
			games[data.game][data.to_player]["ingame"]="freeplayer";
			delete paaringrequests[data.from_player];
			delete paaringrequests[data.to_player];

		}
		else if (data.command=="request_acknowledged") {
			games[data.game][data.from_player]["ingame"]="playerplay";
			games[data.game][data.to_player]["ingame"]="playerplay";
			paarungen[data.to_player]=data.from_player;
			paarungen[data.from_player]=data.to_player;
			console.log(new Date()+":Setze Spielpaarung:"+data.from_player+"<->"+data.to_player);
			delete paaringrequests[data.from_player];
			delete paaringrequests[data.to_player];
		}
		else if (data.command=="request_rejected") {
			console.log(new Date()+":Paarungsanfrage von "+data.from_player+" an "+data.to_player+" zurückgewiesen");
			games[data.game][data.from_player]["ingame"]="freeplayer";
			games[data.game][data.to_player]["ingame"]="freeplayer";
			delete paaringrequests[data.from_player];
			delete paaringrequests[data.to_player];
		}

		// Sende Spielanfrage and to_player
		if (data.to_player!=undefined) {
			var socket = clients[data.to_player];
			if (socket!=undefined) {
				socket.emit('updaterequest', data);
			}
		}

		// Sende an alle Spieler, dass zwei Spieler sind angefragt haben (Zustand dieser Spieler muss ggf. auf der Cleint-Seite aktualisiert werden)
		for (key in games[data.game]) {
				var s = clients[key];
				s.emit('updateusers', games[data.game]);
				console.log(new Date()+":Sende Updateusers an:"+key);
		}
		
    });
	
		

    // Ein Spieler wird hinzugefügt
	/*
	Das (min) gesendete Objekt sieht so aus:(weitere Attribute sind Sache des Clients)
		
		var ms = {
			game:"ttt",
			player: xy,
			score:000   // Score des Spielers
		}
	*/
    socket.on('adduser', function(data){

		console.log(new Date()+":adduser:"+data.player+" for game "+data.game);
	
        // we store the username in the socket session for this client
        socket.username = data.player;
		socket.game=data.game;

        // add the client's username to the global lists
		if (games[data.game] == undefined) {
			games[data.game]={}
		}
		
		if (games[data.game][data.player]==undefined) {
			games[data.game][data.player]={};
			games[data.game][data.player]["name"]= data.player;
			games[data.game][data.player]["ingame"]="freeplayer";
			games[data.game][data.player]["score"]=data.score;
	
		        
			clients[data.player]=socket;
			
			var ms = {
				game:data.game,
				from_player:"Server",
				content:socket.username + ' has connected!',
				content_class:"servermsg"
			}

			for (key in games[data.game]) {
				var s = clients[key];
				console.log(new Date()+":Sende Update an:"+key);
				s.emit('updategamechat', ms);
				s.emit('updateusers', games[data.game]);
			}
			
		}
    });

 

    // Ein Client hat die Verbindung verloren, wenn dieser Client in einem Spiel oder einer Paarung War, werden die 
	// jeweils anderen Partner benachrichtigt

    socket.on('disconnect', function(){
		console.log(new Date()+":Disconnect "+socket.username+" game "+socket.game);
        // remove the username from global usernames list
		if (socket.username!=undefined && socket.game!=undefined) {
			// Der Spieler war in einem Spiel -> Spiel wird beendet (close)
			if (paarungen[socket.username] != undefined) {
				var gegner = paarungen[socket.username];
				console.log(new Date()+":Der Spieler war in einer Paarung mit "+gegner);
				var s = clients[gegner];
				if (games[socket.game][gegner]!=undefined) {
					games[socket.game][gegner]["ingame"]="freeplayer";
					s.emit("updatedisconnected","Ihr Mitspieler hat die Verbindung beendet");
					delete paarungen[gegner];
					delete paarungen[socket.username];
					
				}
			}
			// Der Spieler war in einer Paarung -> (Paarung wird abgelehnt)
			if (paaringrequests[socket.username] != undefined) {
				var gegner = paaringrequests[socket.username].player;
				console.log(new Date()+":Der Spieler hatte eine Paarungsanfrage an "+gegner);
				var s = clients[gegner];
				if (games[socket.game][gegner]!=undefined) {
					games[socket.game][gegner]["ingame"]="freeplayer";
					var ms = {
						game:socket.game,
						from_player: socket.username,
						to_player: gegner,
						command:"cancelrequest"
					}
					if (paaringrequests[gegner]["type"]=="request") {
						ms.command="request_rejected";
					}
					console.log(new Date()+":Sende Updaterequest an "+gegner+" mit command="+ms.command);
					s.emit('updaterequest', ms);
					delete paaringrequests[gegner];
					delete paaringrequests[socket.username];					
				}
			}

			delete games[socket.game][socket.username];
			
			for (key in games[socket.game]) {
					var s = clients[key];
					var ms = {
						game:socket.game,
						from_player:"Server",
						content:socket.username + ' has disconnected',
						content_class:"servermsg"
					}
					s.emit('updategamechat', ms);
					s.emit('updateusers', games[socket.game]);
			}
			delete socket;
		}
		else {
			//socket.socket.reconnectionDelay /= 2;
		}
	});

});

