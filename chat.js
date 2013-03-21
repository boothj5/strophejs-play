var BOSH_SERVICE = '/http-bind',
    connection = null;
    messagebox = null;

function log(msg) 
{
    $('#log').append('<div></div>').append(document.createTextNode(msg));
}

function onConnect(status)
{
    switch (status) {
    case Strophe.Status.CONNECTING:
    	log('Connecting.');
        break;
    case Strophe.Status.CONNFAIL:
	    log('Failed to connect.');
	    $('#connect').get(0).value = 'connect';
        break;
    case Strophe.Status.DISCONNECTING:
	    log('Disconnecting.');
        break;
    case Strophe.Status.DISCONNECTED:
	    log('Disconnected.');
	    $('#connect').get(0).value = 'connect';
        break;
    case Strophe.Status.CONNECTED:
	    log('Connected.');
	    connection.addHandler(onMessage, null, 'message', null, null,  null); 
	    connection.send($pres().tree());
        break;
    default:
        break;
    }
}

function onMessage(msg) {
    var from = msg.getAttribute("from"),
        type = msg.getAttribute("type"),
        elems = msg.getElementsByTagName("body");

    if (type == "chat" && elems.length > 0) {
        var body = elems[0],
            message = Strophe.getText(body);

        messagebox.val(messagebox.val() + from + ": " + message + "\n");
        messagebox.scrollTop(messagebox[0].scrollHeight - messagebox.height());
    }
    
    return true;
}

function login() {
    var button = $('#connect').get(0),
        jid = null,
        password = null;
    
    if (button.value == 'connect') {
        button.value = 'disconnect';
        jid = $('#jid').get(0).value;
        password = $('#password').get(0).value;
        connection.connect(jid, password, onConnect);
    } else {
        button.value = 'connect';
        connection.disconnect();
    }
}

function send() {
    var to = $('#to-jid').get(0).value,
        message = $('#message').get(0).value,
        reply = $msg({to: to, type: 'chat'})
            .c("body")
            .t(message);

    connection.send(reply.tree());
    messagebox.val(messagebox.val() + to + ": " + message + "\n");
    messagebox.scrollTop(messagebox[0].scrollHeight - messagebox.height());
}

$(document).ready(function () {
    connection = new Strophe.Connection(BOSH_SERVICE);
    messagebox = $("#messages");
    messagebox.val("");

    $('#connect').bind('click', login);
    $('#send').bind('click', send);
});
