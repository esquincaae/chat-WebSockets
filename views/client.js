/** @type {Socket} */
const socket = io();

/** @type {HTMLFormElement} */
const send = document.getElementById('send');
const message = document.getElementById('text-input');
const fileTrigger = document.getElementById('file-btn');
const login = document.getElementById('login');
const instruction = document.getElementById('instruction');
const username = document.getElementById('username');
const popup = document.getElementById('modal');
const chats = document.getElementById('chats-list')
let messageStack = []
let messageRendered = {}

let DataURL;
let room;
let usuarios;

/** @type {HTMLInputElement} */
const attach = document.getElementById('files');

const allMessage = document.getElementById('message-container');
const form = document.getElementById('message-form')

const log = document.getElementById('log');


function sendMessage(event) {
    if (room == undefined) {
        message.value = null;
        log.textContent = 'No seleccionaste un chat'
    }
    event.preventDefault();
    const content = message.value.trim()

    if (content.trim() == '' && DataURL == undefined) {
        return
    }

    let date = new Date()

    let info = {
        message: content,
        date: `${('0' + date.getHours()).slice(-2)}:${('0' + date.getMinutes()).slice(-2)}`,
        img: DataURL,
        user: username.value,
        room: room
    }

    socket.emit('message', info)
    saveMessages(info)

    render(info)

    // Restableciendo scroll y contenido del input
    if (info.img !== undefined) {
        fileTrigger.classList.toggle('attached');
        DataURL = undefined
    }
    allMessage.scrollTop = allMessage.scrollHeight - allMessage.clientHeight
    message.value = null;
}

function render(info) {
    const tags = document.getElementsByClassName('mine')
    let claz = "receive"
    let clazz = "author"
    let user = info.user

    if (info.user == username.value) {
        claz = "self";
        clazz = "mine"
        user = "You"

        if (tags.length > 0) {
            allMessage.removeChild(tags[0])
        }
    }


    const bubble_message = document.createElement('div');
    const message_meta_info = document.createElement('span')

    message_meta_info.classList.add(clazz);
    message_meta_info.textContent = `${user} - ${info.date}`;

    bubble_message.classList.add('message');
    bubble_message.classList.add(claz);
    bubble_message.textContent = info.message;


    if (info.img !== undefined) {
        const imagen = document.createElement('div')
        const bubble_image = document.createElement('div')
        bubble_image.classList.add('message');
        bubble_image.classList.add(claz);
        bubble_image.classList.add('img');
        imagen.classList.add('imagen')

        imagen.style.backgroundImage = `url(${info.img})`
        bubble_image.appendChild(imagen)
        allMessage.appendChild(bubble_image)
    }

    if (info.message !== '') {
        allMessage.appendChild(bubble_message)
    }

    allMessage.appendChild(message_meta_info);
    allMessage.scrollTop = allMessage.scrollHeight - allMessage.clientHeight
}

function loadChat(room) {
    allMessage.innerHTML = ""
    console.log(messageStack)
    messageStack.map((msg) => {
        if (msg.room === room) {
            render(msg)
        }
    })
}

function saveMessages(dat) {
    messageStack.push(dat)
    const chat = document.getElementById(dat.room)

    if (chat.children[0].children[0].classList.contains("active") && dat.room !== room) {
        chat.children[0].children[0].classList.toggle("active")
        chat.children[0].children[0].classList.toggle("new")
    }

    if (dat.img !== undefined) {
        chat.children[1].textContent = `${dat.user} envio archivo adjunto`
    } else {
        chat.children[1].textContent = `${dat.user}: ${dat.message}`
    }

    return room !== dat.room
}

function changeRoom(element) {
    const focus = document.getElementsByClassName('focus')

    if (element.children[0].children[0].classList.contains("new")) {
        element.children[0].children[0].classList.toggle("new")
        element.children[0].children[0].classList.add("active")
    }

    if (focus.length > 0) {
        focus[0].classList.toggle('focus')
    }
    element.classList.toggle('focus')

    room = element.id
    socket.emit('loadchat', room)
    log.textContent = `chat cambiado a ${element.children[0].textContent}`
    loadChat(room)
}

function enter(e) {
    e.preventDefault();
        console.log(usuarios.username)
        if(usuarios.username == username.value){
            alert("el usuario ya a sido tomado")
            return
        }
    if (username.value.trim() === '') {
        instruction.textContent = 'ingrese un nombre de usuario valido';
        return
    }

    console.log(usuarios)

    document.body.removeChild(popup);
    socket.emit('register', username.value)
}

socket.on('connect', () => {
    const chats = document.getElementsByClassName('chat');
    for (let i = 0; i < chats.length; i++) {
        chats[i].addEventListener('click', () => { changeRoom(chats[i]) })
    }
    log.textContent = 'Conexion establecida'
})

socket.on('register', (info) => {
    const cht = document.createElement('div')
    cht.classList.add('chat')
    cht.id = info.socket

    const stt = document.createElement('span')
    stt.classList.add('status')
    stt.classList.add('active')

    const usr = document.createElement('h1')
    usr.classList.add('chat-user')
    usr.appendChild(stt)
    usr.append(info.username)

    const msg = document.createElement('span')
    msg.classList.add('message-preview')
    msg.textContent = info.lastMessage

    cht.appendChild(usr)
    cht.appendChild(msg)

    cht.onclick = () => changeRoom(cht)

    chats.appendChild(cht)
    usuarios = info
})

socket.on('private', (data) => {
    if (saveMessages(data)) return
    render(data)
    allMessage.scrollTop = allMessage.scrollHeight - allMessage.clientHeight
})

socket.on('message', (data) => {

    if (saveMessages(data)) return

    render(data)
    allMessage.scrollTop = allMessage.scrollHeight - allMessage.clientHeight
})

socket.on('disconnect', () => {
    log.textContent = 'No hay conexion al servidor'
})

socket.on('left', (info) => {
    const cha = document.getElementById(info.socket)
    if (cha) {
        chats.removeChild(cha)
    }
    log.textContent = `${info.username} left`
})

socket.on('users', (data) => {
    usuarios = data;
    for (const key in data) {
        const cht = document.createElement('div')
        cht.classList.add('chat')
        cht.id = data[key].socket

        const stt = document.createElement('span')
        stt.classList.add('status')
        stt.classList.add('active')

        const usr = document.createElement('h1')
        usr.classList.add('chat-user')
        usr.appendChild(stt)
        usr.append(data[key].username)

        const msg = document.createElement('span')
        msg.classList.add('message-preview')
        msg.textContent = data[key].lastMessage

        cht.appendChild(usr)
        cht.appendChild(msg)

        cht.onclick = () => changeRoom(cht)

        chats.appendChild(cht)
    }
})

send.addEventListener('click', (e) => {
    sendMessage(e);
})

message.addEventListener('keypress', (e) => {
    if (e.keyCode == 13) sendMessage(e)
})

fileTrigger.addEventListener('click', () => attach.click())

attach.addEventListener('change', (e) => {
    // Get a reference to the file
    const file = e.target.files[0];
    log.textContent = `Subiendo ${attach.files[0].name} adjunto`

    // Encode the file using the FileReader API
    const reader = new FileReader();
    reader.onloadend = () => {
        // Use a regex to remove data url part
        DataURL = reader.result

        log.textContent = `Archivo ${attach.files[0].name} adjuntado satisfatoriamente`
        // Logs wL2dvYWwgbW9yZ...
    };
    fileTrigger.classList.toggle('attached');
    reader.readAsDataURL(file);
});

login.addEventListener('submit', (e) => enter(e))