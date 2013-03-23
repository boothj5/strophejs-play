var BOSH_SERVICE = '/http-bind',
    connection = null,
    messagebox = null,
    logbox = null,
    rosterbox = null;

function log(msg)
{
    logbox.val(logbox.val() + msg + "\n");
    logbox.scrollTop(logbox[0].scrollHeight - logbox.height());
}

function onConnect(status)
{
    var iq = null;

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

        iq = $iq({type: 'get'}).c('query', {xmlns: 'jabber:iq:roster'});
        connection.sendIQ(iq, onRoster);

        break;
    default:
        break;
    }
}

function onRoster(iq) {
    $(iq).find('item').each(function () {
        var jid = $(this).attr('jid'),
            name = $(this).attr('name'),
            show = "";

        show += jid;
        if (name) {
            show += " (" + name + ")";
        }

        rosterbox.val(rosterbox.val() + show + "\n");
    });

    connection.send($pres().tree());
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
    logbox = $("#log-messages");
    logbox.val("");
    rosterbox = $("#roster");
    rosterbox.val("");

    connection.rawInput = function (data) { log('RECV: ' + data); };
    connection.rawOutput = function (data) { log('SEND: ' + data); };

    Strophe.log = function (level, msg) { log('LOG: ' + msg); };

    $('#connect').bind('click', login);
    $('#send').bind('click', send);
});
