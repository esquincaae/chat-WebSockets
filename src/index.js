const express = require('express');
const path = require('path');
const app = express();

const server = require('http').Server(app);
const socketio = require('socket.io')(server);

app.set('port', process.env.PORT || 3000);

//Ejecutamos la función de grupal.js
require('./grupal')(socketio);
//Ejecutamos la funcion private.js
//require('./private')(socketio);

//Archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

//Lanzamos el servidor
server.listen(app.get('port'), () =>{
    console.log("Servidor en el puerto ", app.get('port'));
});
