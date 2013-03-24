var BOSH_SERVICE = '/http-bind',
    connection = null,
    messagebox = null,
    logbox = null,
    rosterbox = null,
    onlineContacts = [],
    roster = [];

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
        connection.addHandler(onPresence, null, 'presence', null, null, null);

        iq = $iq({type: 'get'}).c('query', {xmlns: 'jabber:iq:roster'});
        connection.sendIQ(iq, onRoster);

        break;
    default:
        break;
    }
}

function onPresence(pres) {
    var fromJid = $(pres).attr("from"),
        fromBareJid = Strophe.getBareJidFromJid(fromJid),
        myBareJid = Strophe.getBareJidFromJid(connection.jid),
        type = $(pres).attr("type"),
        show = $(pres).children("show").text(),
        statusMsg = $(pres).children("status").text(),
        contactDropDown = $('#to-jid'),
        line;

    $.each(roster, function (index, rosterEntry) {
        if (rosterEntry.jid === fromBareJid) {
            if (type === "unavailable") {
                rosterEntry.presence = "offline";
                rosterEntry.message = null;
            } else {
                if (show) {
                    rosterEntry.presence = show;
                } else {
                    rosterEntry.presence = 'online';
                }
                if (statusMsg) {
                    rosterEntry.message = statusMsg;
                } else {
                    rosterEntry.message = null;
                }
            }
        }
    });

    showRoster();

    if (fromBareJid !== myBareJid) {
        if (type !== 'unavailable') {
            if (!_.contains(onlineContacts, fromBareJid)) {
                onlineContacts.push(fromBareJid);
            }

            line = fromBareJid + " is ";

            if (show) {
                line += show;
            } else {
                line += "online";
            }

            if (statusMsg) {
                line += ", \"" + statusMsg + "\"";
            }

            showMessage(line);
        } else {
            onlineContacts = _.reject(onlineContacts, function (jid) {
                return (jid === fromBareJid);
            });
            showMessage(fromBareJid + " is offline");
        }

        contactDropDown.empty();
        contactDropDown.append($("<option />").text("Choose a contact..."));
        $.each(onlineContacts, function (index, contact) {
            contactDropDown.append($("<option />").val(contact).text(contact));
        });
    }

    return true;
}

function onRoster(iq) {
    $(iq).find('item').each(function () {
        var jid = $(this).attr('jid'),
            name = $(this).attr('name'),
            show = "",
            rosterEntry = {
                jid: jid,
                name: name,
                presence: 'offline',
                message: null
            };

        roster.push(rosterEntry);
    });

    showRoster();

    connection.send($pres().tree());
}

function showRoster() {
    rosterbox.val("");
    $.each(roster, function (index, rosterEntry) {
        var line = "";

        line += rosterEntry.jid;

        if (rosterEntry.name) {
            line += " (" + rosterEntry.name + ")";
        }

        line += ": " + rosterEntry.presence;

        if (rosterEntry.message !== null) {
            line += ", \"" + rosterEntry.message + "\"";
        }

        rosterbox.val(rosterbox.val() + line + "\n");
    });
}

function showMessage(message) {
    messagebox.val(messagebox.val() + message + "\n");
    messagebox.scrollTop(messagebox[0].scrollHeight - messagebox.height());
}

function onMessage(msg) {
    var fromJid = msg.getAttribute("from"),
        bareFromJid = Strophe.getBareJidFromJid(fromJid),
        type = msg.getAttribute("type"),
        elems = msg.getElementsByTagName("body");

    if (type == "chat" && elems.length > 0) {
        var body = elems[0],
            message = Strophe.getText(body);

        showMessage(bareFromJid + ": " + message);
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
        myBareJid = Strophe.getBareJidFromJid(connection.jid);
        message = $('#message').get(0).value,
        reply = $msg({to: to, type: 'chat'})
            .c("body")
            .t(message);

    connection.send(reply.tree());
    showMessage(myBareJid + ": " + message);
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
