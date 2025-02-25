list_notif_texte = [];


async function displayNotifications() {
    while (true) {
        for (let text of list_notif_texte) {
            console.log(text);
            let time = 3000;
            if (Array.isArray(text)) {
                time = text[1] * 1000;
                text = text[0];
            }
            let notif = document.createElement("div");
            notif.className = "notif";
            notif.innerHTML = text;
            document.body.appendChild(notif);
            await new Promise(resolve => setTimeout(resolve, 10));
            notif.style.transform = "translateX(0)";
            await new Promise(resolve => setTimeout(resolve, time));
            notif.style.transform = "";
            await new Promise(resolve => setTimeout(resolve, 300));
            notif.remove();
            // remove the first element of the array
            list_notif_texte.shift();
        }
        await new Promise(resolve => setTimeout(resolve, 500));

    }
}
displayNotifications();

const ws = new WebSocket('ws://88.166.208.243:80');

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'change') {
        list_notif_texte.push(data.message);
    }
};

function send_message_to_id() {
    console.log('sending update');
    ws.send(JSON.stringify({
        type: 'update_project'
    }));
}