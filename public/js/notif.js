list_notif_texte = [];


async function displayNotifications() {
    while (true) {
        for (const text of list_notif_texte) {
            console.log(text);
            let notif = document.createElement("div");
            notif.className = "notif";
            notif.innerHTML = text;
            document.body.appendChild(notif);
            await new Promise(resolve => setTimeout(resolve, 10));
            notif.style.transform = "translateX(0)";
            await new Promise(resolve => setTimeout(resolve, 3000));
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

