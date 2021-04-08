var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var i;

var mongoose = require('mongoose');
const redis = require("redis");
const client = redis.createClient();
client.del("users") 
const Message = require('./model.js');

var alert = require('alert');

mongoose.set('useNewUrlParser', true)
mongoose.set('useFindAndModify', false)
mongoose.set('useCreateIndex', true)
mongoose.connect('mongodb://localhost:27017/messages', {useNewUrlParser: true, useUnifiedTopology: true})

client.on("error", function(error) {
  console.error(error);
});

var connStr = 'mongodb://localhost:27017/messages';
mongoose.connect(connStr, function (err) {
    if (err) throw err;
    console.log('Successfully connected to MongoDB');
});

client.on("ready", function(error) {
  console.log("Connected to redis")
});

// Gestion des requêtes HTTP des utilisateurs en leur renvoyant les fichiers du dossier 'public'
app.use('/', express.static(__dirname + '/public'));

// Liste des utilisateurs connectés
var users = [];

// Historique des messages
var messages = [];

// Liste des utilisateurs en train de saisir un message
var typingUsers = [];

// Evénements : utilisateur connecté
const UserConnect = async socket => {
   for (i = 0; i < messages.length; i++) {
    if (messages[i].type === 'chat-message') {
      socket.emit('chat-message', messages[i]);
    } else {
      socket.emit('service-message', messages[i]);
    }
  }

  //Evénements : message de l'historique
  const messagesBDD = await Message.find({}).sort({date: -1}).limit(50)
  messagesBDD.reverse().forEach(message => {
    if (message.type === 'chat') socket.emit('chat-message', message)
    else socket.emit('service', message)
  })
}

io.on('connection', function (socket) {

  //Utilisateur connecté à la socket
  var loggedUser;

  UserConnect(socket).catch(console.error)

  // Emission d'un événement "user-login" pour chaque utilisateur connecté
  for (i = 0; i < users.length; i++) {
    socket.emit('user-login', users[i]);
  }

  // Déconnexion d'un utilisateur
   socket.on('disconnect', async () => {
    if (loggedUser !== undefined) {
      // Broadcast d'un service-message
      var serviceMessage = {
        text: 'L utilisateur "' + loggedUser.username + '" est déconnecté',
        type: 'logout',
      };
      socket.broadcast.emit('service-message', serviceMessage);
      // Suppression de la liste des utilisateurs connectés
      client.lrem("users", loggedUser.username, () => console.log(loggedUser.username  + " s'est déconnecté"));

      // Ajout du message à l'historique
      await Message.create(serviceMessage)
      // Emission d'un user-logout contenant le user
      io.emit('user-logout', loggedUser);
      // S'il était en train de saisir un texte -> on enlève de la liste
      var typingUserIndex = typingUsers.indexOf(loggedUser);
      if (typingUserIndex !== -1) {
        typingUsers.splice(typingUserIndex, 1);
      }
    }
  });

  // Connexion d'un utilisateur via le formulaire :
   socket.on('user-login', function (user, callback) {

    client.sadd('allUsers', user.username, function(err, reply) {
      if (reply==1){
        console.log("Hello to this new users : "+user.username)
      }
    });

    // Vérification que l'utilisateur n'existe pas
    var userIndex = -1;
    for (i = 0; i < users.length; i++) {
      if (users[i].username === user.username) {
        userIndex = i;
      }
    }

    if (user !== undefined && userIndex === -1) { 
      
      // Sauvegarde de l'utilisateur et ajout à la liste des connectés
      loggedUser = user;
      users.push(loggedUser);

      client.rpush("users", loggedUser.username, function (err,reply){
            console.log(loggedUser.username  + "connected");
            console.log(reply + "users connected")
      })
      
      loggedUser = user;
      users.push(loggedUser);
      // Envoi et sauvegarde des messages de service
      var userServiceMessage = {
        text: 'You logged in as "' + loggedUser.username + '"',
        type: 'login'
      };
      var broadcastedServiceMessage = {
        text: 'User "' + loggedUser.username + '" logged in',
        type: 'login'
      };
      socket.emit('service-message', userServiceMessage);
      socket.broadcast.emit('service-message', broadcastedServiceMessage);
      messages.push(broadcastedServiceMessage);
      // Emission de 'user-login' et appel du callback
      io.emit('user-login', loggedUser);
      callback(true);
    } else {
      alert("Vous êtes déjà connecté")
      callback(false);
    }
  });

  // Réception de l'événement 'chat-message' et réémission vers tous les utilisateurs

  socket.on('chat-message', async(message) => {

    // Sauvegarde du message
    await Message.create({
      text: message.text,
      username: loggedUser.username
    })

    // On ajoute le username au message et on émet l'événement
    message.username = loggedUser.username;
    // On assigne le type "message" à l'objet
    message.type = 'chat-message';
    io.emit('chat-message', message);

    // Sauvegarde du message
    messages.push(message);
    if (messages.length > 150) {
      messages.splice(0, 1);
    }
  });

  // Réception de l'événement 'start-typing'
  // L'utilisateur commence à saisir son message
  socket.on('start-typing', function () {
    // Ajout du user à la liste des utilisateurs en cours de saisie
    if (typingUsers.indexOf(loggedUser) === -1) {
      typingUsers.push(loggedUser);
    }
    io.emit('update-typing', typingUsers);
  });

  // Réception de l'événement 'stop-typing'
  // L'utilisateur a arrêter de saisir son message
  socket.on('stop-typing', function () {
    var typingUserIndex = typingUsers.indexOf(loggedUser);
    if (typingUserIndex !== -1) {
      typingUsers.splice(typingUserIndex, 1);
    }
    io.emit('update-typing', typingUsers);
  });
});

// Lancement du serveur en écoutant les connexions arrivant sur le port 3000
http.listen(3000, function () {
  console.log('Server is listening on *:3000');
});