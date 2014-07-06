/*
var port = 5000;
var app = require('express')();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
*/
var port = 5000;
var express = require('express')
,   app = express()
,   server = require('http').createServer(app)
,   io = require('socket.io').listen(server);

console.log("Listening on port " + port);
server.listen(port);

/*
// routing
app.get('/nodetest/', function (req, res) {
  res.sendfile(__dirname + '/public/ttt.html');
  console.log("Delivered html page");
});
*/
app.configure(function(){
	// statische Dateien ausliefern
	app.use(express.static(__dirname + '/public'));
});

// gamenames and usernames which are currently connected to the system
var games = {
		"users":{
			"name":"noname",
			ingame:"freeplayer", // css Klasse des Spielers
			score:0
		}
	};
var clients = {};
var paarungen = {};

io.sockets.on('connection', function (socket) {

    // Send Chat msg to game partner
    socket.on('sendchat', function (data) {

        // we tell the client to execute 'updatechat' with 2 parameters
        //io.sockets.emit('updatechat', socket.username, data);
		var s = clients[data.to_player];
		s.emit('updatechat', socket.username, data);
    });

	
	 // Empfange Spielzug
    socket.on('play', function (data) {
		if (paarungen[data.from_player] != undefined) {
			var to_player=paarungen[data.from_player];
			console.log("Empfange play command "+data.command+" von "+data.from_player+" to "+to_player+ " game="+data.game);

			var s = clients[to_player];
			// Weiterleiten an Spielpartner
			s.emit('updateplay', data);
			
			if (data.command=="won") {
				games[data.game][data.from_player]["score"]++;
			}
		}
		else {
			console.log("Habe Spielzug empfangen aber keinen Partner dazu gefunden!");
		}
    });

	 // Empfange 
    socket.on('close', function (data) {
		if (paarungen[data.from_player] != undefined) {
			var to_player=paarungen[data.from_player];
			console.log("Send close von "+data.from_player+" to "+to_player+ " game="+data.game);

			var s = clients[to_player];
			// Weiterleiten an Spielpartner
			s.emit('updateclose', data);
			delete paarungen[data.from_player];
			delete paarungen[to_player]
			games[data.game][data.from_player]["ingame"]="freeplayer";
			games[data.game][to_player]["ingame"]=	"freeplayer";	
			for (key in games[data.game]) {
				var s = clients[key];
				s.emit('updateusers', games[data.game]);
				console.log("Sende Updateusers an:"+key);
			}
		}
		else {
			console.log("Habe Spielzug empfangen aber keinen Partner dazu gefunden!");
		}
    });
	
	 // Send Chat msg to all game players
    socket.on('sendgamechat', function (data) {

		for (key in games[data.game]) {
			//console.log("key="+key);
			var s = clients[key];
			s.emit('updategamechat', socket.username, data.content,"usermessage");
		}
    });
	
	// Update eines Spielerzustandes
    socket.on('update', function (data) {
		delete paarungen[data.me];
		games[data.game][data.me]["ingame"]="freeplayer";
		for (key in games[data.game]) {
			var s = clients[key];
			s.emit('updateusers', games[data.game]);
			console.log("Sende Updateusers an:"+key);
		}
	});
	// Anfrage an einen Spieler
    socket.on('request', function (data) {
        // we tell the client to execute 'updatechat' with 2 parameters
		console.log("request type"+data.command+" from:"+data.from_player+" to "+data.to_player+ " game="+data.game);
		
		if (data.command=="request") {
			games[data.game][data.from_player]["ingame"]="playerpending";
			games[data.game][data.to_player]["ingame"]="playerpending";
		}
		else if (data.command=="cancelrequest") {
			games[data.game][data.from_player]["ingame"]="freeplayer";
			games[data.game][data.to_player]["ingame"]="freeplayer";
		}
		// Sende an alle Spieler (außer den anfragenden), dass zwei Spieler sind angefragt haben
		for (key in games[data.game]) {
				var s = clients[key];
				s.emit('updateusers', games[data.game]);
				console.log("Sende Updateusers an:"+key);
		}
		// Sende Spielanfrage and to_player
		var socket = clients[data.to_player];
		socket.emit('requested', data);
		
    });
	
	// Anfrage Spiel bearbeiten
    socket.on('requestresult', function (data) {
        // we tell the client to execute 'updatechat' with 2 parameters
		console.log("requestresult from:"+data.from_player+" to "+data.to_player+" is "+ data.command+" game is"+data.game);
		
		// Sende Antwort an anfragenden Spieler
		var s = clients[data.from_player];
		s.emit('requestresult', data);

		if (data.command=="acknowledged") {
			games[data.game][data.from_player]["ingame"]="playerplay";
			games[data.game][data.to_player]["ingame"]="playerplay";
			paarungen[data.to_player]=data.from_player;
			paarungen[data.from_player]=data.to_player;
			console.log("setze Spielpaarung:"+data.from_player+"<->"+data.to_player);
		}
		else {
			games[data.game][data.from_player]["ingame"]="freeplayer";
			games[data.game][data.to_player]["ingame"]="freeplayer";
		}
		for (key in games[data.game]) {
			var s = clients[key];
			s.emit('updateusers', games[data.game]);
			console.log("Sende Updateusers an:"+key);
		}

    });
	
	

    // when the client emits 'adduser', this listens and executes
    socket.on('adduser', function(data){

		console.log("adduser:"+data.player+" for game "+data.the_game);
	
        // we store the username in the socket session for this client
        socket.username = data.player;
		socket.game=data.the_game;

        // add the client's username to the global lists
		if (games[data.the_game] == undefined) {
			games[data.the_game]={}
		}
		
		if (games[data.the_game][data.player]==undefined) {
			games[data.the_game][data.player]={};
			games[data.the_game][data.player]["name"]= data.player;
			games[data.the_game][data.player]["ingame"]="freeplayer";
			games[data.the_game][data.player]["score"]=0;
	
		        
			clients[data.player]=socket;
			// echo to client they've connected
			//socket.emit('updatechat', data.the_game+'- Game SERVER', 'you have connected');

			// echo (all clients for the game) that a person has connected
			//socket.broadcast.emit('updatechat', data.the_game+'- Game SERVER', data.player + ' has connected');
			
			for (key in games[data.the_game]) {
				var s = clients[key];
				s.emit('updategamechat', data.the_game+'- Game SERVER', data.player + ' has connected',"servermsg");
				s.emit('updateusers', games[data.the_game]);
				console.log("Sende Update an:"+key);
			}
			
			// update the list of users in chat, client-side
			//io.sockets.emit('updateusers', games[data.the_game]);
		}
		else {
			console.log("Der Spielername existiert bereits");
			socket.emit('connecterror', 'Der Spielername '+socket.username+" existiert bereits");
		}
    });

 

    // when the user disconnects.. perform this

    socket.on('disconnect', function(){
		console.log("Disconnect "+socket.username+" game "+socket.game);
        // remove the username from global usernames list
		if (socket.username!=undefined && socket.game!=undefined) {
			// Der Spieler war in einem Spiel
			if (paarungen[socket.username] != undefined) {
				var gegner = paarungen[socket.username];
				console.log("Der Spieler war in einer Paarung mit "+gegner);
				var s = clients[gegner];
				if (games[socket.game][gegner]!=undefined) {
					games[socket.game][gegner]["ingame"]="freeplayer";
					s.emit("updatedisconnected","Ich Mitspieler hat die Verbindung beendet");
					delete paarungen[gegner];
					delete paarungen[socket.username];
					
				}
			}

			delete games[socket.game][socket.username];
			
			for (key in games[socket.game]) {
					var s = clients[key];
					s.emit('updategamechat', socket.game+'- Game SERVER', socket.username + ' has disconnected',"servermsg");
					s.emit('updateusers', games[socket.game]);
			}
		}
    });

});

