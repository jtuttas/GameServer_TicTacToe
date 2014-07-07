/*

Erhält der Server einen Befehl von einem Client, so leitet er diesen über eine Updatexxxx Methode an die betreffenden Clients weiter

*/
var port = 5000;
var express = require('express')
,   app = express()
,   server = require('http').createServer(app)
,   io = require('socket.io').listen(server);

console.log("Listening on port " + port);
server.listen(port);

app.configure(function(){
	// statische Dateien ausliefern
	app.use(express.static(__dirname + '/public'));
});

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

    // Sende die Chatnachricht an einen Client
	/*
		Das minimal gesendete Objekt sieht so aus (weitere Attribute sind Sache des Clients)
		
		var ms = {
			to_player:partnet,
		}
	*/
    socket.on('sendchat', function (data) {
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
		for (key in games[data.game]) {
			//console.log("key="+key);
			var s = clients[key];
			s.emit('updategamechat', data);
		}
    });
	
	
	
	 // Empfange Spielzug, der Spielzur wird an den gepaarten Partner weitergeleitet.
	/*
		Das (min) gesendete Objekt sieht so aus:(weitere Attribute sind Sache des Clients)
		
		var ms = {
			game:"ttt",
			command:play,  Spielkommando (play,won,pending,giveup)
			from_player: xy
		}
	*/
	socket.on('play', function (data) {
		if (paarungen[data.from_player] != undefined) {
			var to_player=paarungen[data.from_player];
			console.log("Empfange play command "+data.command+" von "+data.from_player+" game="+data.game);

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

	
	
	// Quit Paaring, Eine Paarung wird beendet und der neue Zustand allen Client mitgeteilt
	/*
	Das (min) gesendete Objekt sieht so aus:(weitere Attribute sind Sache des Clients)
		
		var ms = {
			game:"ttt",
			from_player: xy
		}
	*/
    socket.on('quitpaaring', function (data) {
		console.log("Quit Paaring from:"+data.from_player);
		delete paarungen[data.from_player];
		games[data.game][data.from_player]["ingame"]="freeplayer";
		for (key in games[data.game]) {
			var s = clients[key];
			s.emit('updateusers', games[data.game]);
			console.log("Sende Updateusers an:"+key);
		}
	});
	
	// Anfrage an einen Spieler (Wunsch nach Paarung oder Zurückziehen des Wunsches)
	/*
	Das (min) gesendete Objekt sieht so aus:(weitere Attribute sind Sache des Clients)
		
		var ms = {
			game:"ttt",
			from_player: xy,
			to_player: yz,
			command:request   	request=Wunsch nach Paarung, cancelrequest=Paarungswunsch wird zurückgezogen
								request_acknowladged = Paarungswunsch angenommen, request_rejected = Paarungswunsch abgelehnt
		}
	*/
    socket.on('request', function (data) {
        // we tell the client to execute 'updatechat' with 2 parameters
		console.log("request type:"+data.command+" from:"+data.from_player+" to "+data.to_player+ " game="+data.game);
		
		if (data.command=="request") {
			console.log("Paarungsanfrage von "+data.from_player+" an "+data.to_player);

			games[data.game][data.from_player]["ingame"]="playerpending";
			games[data.game][data.to_player]["ingame"]="playerpending";
			paaringrequests[data.from_player]={};
			paaringrequests[data.from_player].player=data.to_player;
			paaringrequests[data.from_player].type="request";
			
			paaringrequests[data.to_player]={};
			paaringrequests[data.to_player].player=data.from_player;
			paaringrequests[data.to_player].type="requested";
		}
		else if (data.command=="cancelrequest") {
			console.log("Paarungsanfrage von "+data.from_player+" an "+data.to_player+" zurückgezogen");
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
			console.log("Setze Spielpaarung:"+data.from_player+"<->"+data.to_player);
			delete paaringrequests[data.from_player];
			delete paaringrequests[data.to_player];
		}
		else if (data.command=="request_rejected") {
			console.log("Paarungsanfrage von "+data.from_player+" an "+data.to_player+" zurückgewiesen");
			games[data.game][data.from_player]["ingame"]="freeplayer";
			games[data.game][data.to_player]["ingame"]="freeplayer";
			delete paaringrequests[data.from_player];
			delete paaringrequests[data.to_player];
		}

		// Sende Spielanfrage and to_player
		var socket = clients[data.to_player];
		socket.emit('updaterequest', data);

		// Sende an alle Spieler, dass zwei Spieler sind angefragt haben (Zustand dieser Spieler muss ggf. auf der Cleint-Seite aktualisiert werden)
		for (key in games[data.game]) {
				var s = clients[key];
				s.emit('updateusers', games[data.game]);
				console.log("Sende Updateusers an:"+key);
		}
		
    });
	
		

    // Ein Spieler wird hinzugefügt
	/*
	Das (min) gesendete Objekt sieht so aus:(weitere Attribute sind Sache des Clients)
		
		var ms = {
			game:"ttt",
			player: xy,
		}
	*/
    socket.on('adduser', function(data){

		console.log("adduser:"+data.player+" for game "+data.game);
	
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
			games[data.game][data.player]["score"]=0;
	
		        
			clients[data.player]=socket;
			
			var ms = {
				game:data.game,
				from_player:"Server",
				content:socket.username + ' has connected!',
				content_class:"servermsg"
			}

			for (key in games[data.game]) {
				var s = clients[key];
				console.log("Sende Update an:"+key);
				s.emit('updategamechat', ms);
				s.emit('updateusers', games[data.game]);
			}
			
		}
		else {
			console.log("Der Spielername existiert bereits");
			socket.emit('connecterror', 'Der Spielername '+socket.username+" existiert bereits");
		}
    });

 

    // Ein Client hat die Verbindung verloren, wenn dieser Client in einem Spiel oder einer Paarung War, werden die 
	// jeweils anderen Partner benachrichtigt

    socket.on('disconnect', function(){
		console.log("Disconnect "+socket.username+" game "+socket.game);
        // remove the username from global usernames list
		if (socket.username!=undefined && socket.game!=undefined) {
			// Der Spieler war in einem Spiel -> Spiel wird beendet (close)
			if (paarungen[socket.username] != undefined) {
				var gegner = paarungen[socket.username];
				console.log("Der Spieler war in einer Paarung mit "+gegner);
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
				console.log("Der Spieler hatte eine Paarungsanfrage an "+gegner+ " vom type="+paaringrequests[gegner].type);
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
					console.log("Sende Updaterequest an "+gegner+" mit command="+ms.command);
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
		}
    });

});

