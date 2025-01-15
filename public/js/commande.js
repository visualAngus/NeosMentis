let isOpened = false;
const editor_div = document.getElementById('editor_div');
const editor = document.querySelector('.editor');
const editor_top = editor.getBoundingClientRect().top;
const ce_toolbar = document.querySelector('.ce-toolbar');


// Gestion des commandes
function unfocus_commande() {
    ce_toolbar.setAttribute('type', '');
    ce_toolbar.querySelector('.ce-toolbox').classList.add('closed');

    setTimeout(() => {
        ce_toolbar.querySelector('.ce-popover__items').innerHTML = '';
    }, 200);
    isOpened = false;
}

function show_commande(top, index, type = 'normal') {
    if (isOpened) {
        return;
    }
    ce_toolbar.style.top = `${top}px`;
    ce_toolbar.setAttribute('id_line', index);
    ce_toolbar.setAttribute('type', type);
}


// Modification du style d'une ligne
function change_style_line(lineIndex, style) {
    const lines = Array.from(editor_div.children);
    if (lines[lineIndex]) {
        // Retirer les classes de style existantes
        lines[lineIndex].className = 'line';
        // Ajouter le nouveau style
        lines[lineIndex].classList.add(style);
        // Mettre à jour le miroir
        getVisualLines();
    }
}

function add_style_line(line_id, style) {
    const line = editor_div.querySelector(`#${line_id}`);
    if (line) {

        // Retirer les classes de style existantes
        line.classList.remove('gauche');
        line.classList.remove('centre');
        line.classList.remove('droite');

        line.classList.add(style);
    }
}

function initialised_line(line) {
    let id;
    do {
        let random_id = Math.floor(Math.random() * 1000);
        let random_letters = Math.random().toString(36).substring(7);
        id = `AUTO_${random_id}_${random_letters}`;
    } while (document.getElementById(id) !== null);

    line.id = id;

    // line.classList.add('line');

    line.addEventListener('mouseover', (e) => {
        let y = line.getBoundingClientRect().top - editor_top - 50;
        show_commande(y, line.id);
    });
}


function insert_new_line(id, type) {

    if (typeof type == 'string') {
        type = type.toLowerCase();
    }else if (type.contains('titre')) {
        type = 'titre';
    } else if (type.contains('liste')) {
        type = 'liste';
    } else if (type.contains('liste_num')) {
        type = 'liste_num';
    }else{
        type = 'normal';
    }

    let classes = type.split(" ")
    let new_line = document.createElement('div');
    console.log(new_line);
    classes.forEach(classe => {
        console.log(classe);
        new_line.classList.add(classe);   
    });

    initialised_line(new_line);

    if(id == "first_line"){
        editor_div.insertBefore(new_line, editor_div.firstChild);
    } else if(id == "last_line"){
        editor_div.appendChild(new_line);
    }
    else if (id) {
        editor_div.insertBefore(new_line, editor_div.querySelector('#' + id).nextSibling);
    }else{
        editor_div.appendChild(new_line);
    }

    if (type.includes('normal') || type.includes('line')) {
        new_line.innerHTML = '<br>';
        let range = document.createRange();
        range.selectNodeContents(new_line);
        range.collapse(false);
        let selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        new_line.focus();
        console.log("édfghjkqdfghjhjdfgqdfghjkldfhjkldfghjk");

    } else if (type.includes('titre')) {
        new_line.innerHTML = '<br>';
        let range = document.createRange();
        range.selectNodeContents(new_line);
        range.collapse(false);
        let selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        new_line.focus();
    } else if (type.includes('liste')) {
        new_line.innerHTML = '<ul><li></li></ul>';

        // focus sur le premier élément de la liste
        let range = document.createRange();
        range.selectNodeContents(new_line.querySelector('li'));
        range.collapse(false);
        let selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        new_line.querySelector('li').focus();

    } else if (type.includes('liste_nom')) {
        new_line.innerHTML = '<ol><li></li></ol>';
        let range = document.createRange();
        range.selectNodeContents(new_line.querySelector('li'));
        range.collapse(false);
        let selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        new_line.querySelector('li').focus();
    }
    return new_line;
}


function insert_new_line_with_text(id, text) {

    
    let new_line = document.createElement('div');
    new_line.innerHTML = text;
    new_line.classList.add('line');
    initialised_line(new_line);
    if(id == "first_line"){
        editor_div.insertBefore(new_line, editor_div.firstChild);
    } else if(id == "last_line"){
        editor_div.appendChild(new_line);
    }
    else if (id.length > 5) {
        editor_div.insertBefore(new_line, editor_div.querySelector('#' + id).nextSibling);
    }else{
        editor_div.appendChild(new_line);
    }
    return new_line;
}
// Configuration de la liste des commandes
function set_commande_list() {
    let list = ["Titre", "Liste", "Liste numérotée", "Checklist", "Citation", "Tableau", "Lien", "Image", "Fichier"];
    let ce_popover_items = document.querySelector('.ce-popover__items');
    let recherche_input = document.querySelector('.div_recherche_input');
    ce_popover_items.innerHTML = '';


    list.forEach(element => {
        let div = document.createElement('div');
        div.className = 'ce-popover_item';
        div.setAttribute('element', element);

        div.addEventListener('click', function (event) {
            let id = ce_toolbar.getAttribute('id_line');
            if (element === "Titre") {
                insert_new_line(id, 'titre');
                unfocus_commande();
            }
            if (element === "Liste") {
                insert_new_line(id, 'liste');
                unfocus_commande();
            }
            if (element === "Liste numérotée") {
                insert_new_line(id, 'liste_num');
                unfocus_commande();
            }
        });

        let div_logo = document.createElement('div');
        div_logo.className = 'ce-popover_item_logo';

        let div_nom = document.createElement('div');
        div_nom.className = 'ce-popover_item_nom';
        let h3 = document.createElement('div');
        h3.innerHTML = element;
        div_nom.appendChild(h3);

        div.appendChild(div_logo);
        div.appendChild(div_nom);
        ce_popover_items.appendChild(div);
    });

    recherche_input.addEventListener('input', function (event) {
        let value = event.target.value;
        let items = Array.from(ce_popover_items.children);
        items.forEach(element => {
            let nom = element.getAttribute('element');
            if (nom.toLowerCase().includes(value.toLowerCase())) {
                element.style.display = 'flex';
            } else {
                element.style.display = 'none';
            }
        });
    });

}


function set_commande_list_sett() {
    let list = ["Convertir en", "Gauche", "Centre", "Droite", "Monter", "Supprimer", "Descendre"];
    let ce_popover_items = document.querySelector('.ce-popover__items');
    let recherche_input = document.querySelector('.div_recherche_input');
    ce_popover_items.innerHTML = '';
    console.log(ce_toolbar.getAttribute('type'));

    list.forEach(element => {
        let div = document.createElement('div');
        let id = ce_toolbar.getAttribute('id_line');
        div.className = 'ce-popover_item';
        div.setAttribute('element', element);

        if (document.querySelector('#' + id).classList.contains(element.toLowerCase())) {
            div.classList.add('selected');
        }
        if (!document.querySelector('#' + id).classList.contains('gauche') && !document.querySelector('#' + id).classList.contains('centre') && !document.querySelector('#' + id).classList.contains('droite')) {
            const gaucheElement = document.querySelector('[element="Gauche"]');
            if (gaucheElement) {
                gaucheElement.classList.add('selected');
            }
        }
        div.addEventListener('click', function (event) {
            if (element === "Gauche") {
                add_style_line(id, 'gauche');
                unfocus_commande();
            }
            if (element === "Centre") {
                add_style_line(id, 'centre');
                unfocus_commande();
            }
            if (element === "Droite") {
                add_style_line(id, 'droite');
                unfocus_commande();
            }
        });

        let div_logo = document.createElement('div');
        div_logo.className = 'ce-popover_item_logo';

        let div_nom = document.createElement('div');
        div_nom.className = 'ce-popover_item_nom';

        let h3 = document.createElement('div');

        if (element === "Before") {
            div.classList.add('little_bnt');
            div.classList.add('little_bnt_before');
            div.appendChild(h3);
        } else if (element === "Gauche") {
            h3.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" id="Layer" enable-background="new 0 0 64 64" height="20" viewBox="0 0 64 64" width="20"><path d="m54 8h-44c-1.104 0-2 .896-2 2s.896 2 2 2h44c1.104 0 2-.896 2-2s-.896-2-2-2z"></path><path d="m54 52h-44c-1.104 0-2 .896-2 2s.896 2 2 2h44c1.104 0 2-.896 2-2s-.896-2-2-2z"></path><path d="m10 23h28c1.104 0 2-.896 2-2s-.896-2-2-2h-28c-1.104 0-2 .896-2 2s.896 2 2 2z"></path><path d="m54 30h-44c-1.104 0-2 .896-2 2s.896 2 2 2h44c1.104 0 2-.896 2-2s-.896-2-2-2z"></path><path d="m10 45h28c1.104 0 2-.896 2-2s-.896-2-2-2h-28c-1.104 0-2 .896-2 2s.896 2 2 2z"></path></svg>';
            div.classList.add('little_bnt');
            div.appendChild(h3);

        } else if (element === "Droite") {
            h3.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" id="Layer" enable-background="new 0 0 64 64" height="20" viewBox="0 0 64 64" width="20"><path d="m54 8h-44c-1.104 0-2 .896-2 2s.896 2 2 2h44c1.104 0 2-.896 2-2s-.896-2-2-2z"></path><path d="m54 52h-44c-1.104 0-2 .896-2 2s.896 2 2 2h44c1.104 0 2-.896 2-2s-.896-2-2-2z"></path><path d="m54 19h-28c-1.104 0-2 .896-2 2s.896 2 2 2h28c1.104 0 2-.896 2-2s-.896-2-2-2z"></path><path d="m54 30h-44c-1.104 0-2 .896-2 2s.896 2 2 2h44c1.104 0 2-.896 2-2s-.896-2-2-2z"></path><path d="m54 41h-28c-1.104 0-2 .896-2 2s.896 2 2 2h28c1.104 0 2-.896 2-2s-.896-2-2-2z"></path></svg>';
            div.classList.add('little_bnt');
            div.appendChild(h3);


        } else if (element == "Centre") {
            h3.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" id="Layer" enable-background="new 0 0 64 64" height="20" viewBox="0 0 64 64" width="20"><path d="m54 8h-44c-1.104 0-2 .896-2 2s.896 2 2 2h44c1.104 0 2-.896 2-2s-.896-2-2-2z"></path><path d="m54 52h-44c-1.104 0-2 .896-2 2s.896 2 2 2h44c1.104 0 2-.896 2-2s-.896-2-2-2z"></path><path d="m46 23c1.104 0 2-.896 2-2s-.896-2-2-2h-28c-1.104 0-2 .896-2 2s.896 2 2 2z"></path><path d="m54 30h-44c-1.104 0-2 .896-2 2s.896 2 2 2h44c1.104 0 2-.896 2-2s-.896-2-2-2z"></path><path d="m46 45c1.104 0 2-.896 2-2s-.896-2-2-2h-28c-1.104 0-2 .896-2 2s.896 2 2 2z"></path></svg>'
            div.classList.add('little_bnt');
            div.appendChild(h3);


        } else {
            h3.innerHTML = element;
            div_nom.appendChild(h3);
            div.appendChild(div_logo);
            div.appendChild(div_nom);
        }
        ce_popover_items.appendChild(div);
    });

    recherche_input.addEventListener('input', function (event) {
        let value = event.target.value;
        let items = Array.from(ce_popover_items.children);
        items.forEach(element => {
            let nom = element.getAttribute('element');
            if (nom.toLowerCase().includes(value.toLowerCase())) {
                element.style.display = 'flex';
            } else {
                element.style.display = 'none';
            }
        });
    });

}

// Event Listeners
editor.addEventListener('click', function (event) {
    if (event.target.classList.contains('editor-content') || event.target.closest('.line')) {
        unfocus_commande();
    }
});

ce_toolbar.querySelector('.ce-toolbar__plus').addEventListener('click', function (event) {
    const toolbox = ce_toolbar.querySelector('.ce-toolbox');
    toolbox.classList.toggle('closed');

    if (toolbox.classList.contains('closed')) {
        unfocus_commande();
    } else {
        set_commande_list();
        isOpened = true;
    }
});

ce_toolbar.querySelector('.ce-toolbar__settings').addEventListener('click', function (event) {
    const toolbox = ce_toolbar.querySelector('.ce-toolbox');
    toolbox.classList.toggle('closed');

    if (toolbox.classList.contains('closed')) {
        unfocus_commande();
    } else {
        set_commande_list_sett();
        isOpened = true;

    }
});

insert_new_line('first_line', "normal");


lineCounter = 0;

editor_div.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        e.preventDefault();

        let selection = window.getSelection();
        let range = selection.getRangeAt(0);
        // let type = range.startContainer.nodeType;
        let element = range.startContainer.parentElement;
        if (element.tagName === "LI") {
            element = element.parentElement;
            if (element.tagName === "OL" || element.tagName === "UL") {
                element = element.parentElement;
            }
        }
        let type = element.classList
        let id_line = element.id;

        // recupère tout le texte de la ligne avant le curseur
        let text = range.startContainer.textContent;
        let text_before = text.substring(0, range.startOffset);
        let text_after = text.substring(range.startOffset, text.length);

        new_line = insert_new_line(id_line, type.value);

        // insère le texte apres le curseur dans la nouvelle ligne
        new_line.innerHTML = text_after;

        // supprimer le texte qui est apres le curseur dans la ligne actuelle
        range.startContainer.textContent = text_before;

    }
    // tabulation
    if (e.key === "Tab") {
        e.preventDefault(); // Empêche le comportement par défaut (changement d'élément)

        // Crée un espace insécable
        const space = document.createTextNode("\t");
        const range = document.getSelection().getRangeAt(0);

        // Insère l'espace à la position actuelle du curseur
        range.deleteContents(); // Supprime tout ce qui est sélectionné (si nécessaire)
        range.insertNode(space);

        // Déplace le curseur après l'espace inséré
        range.setStartAfter(space);
        range.collapse(true);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    }
});

editor_div.addEventListener('input', (e) => {
    let children = Array.from(editor_div.children);
    children.forEach(child => {
        if (!child.id) {
            initialised_line(child);
        }
    });
    save_doc(save_editor());
});

// quand l'utilisateur fais un ctrl v
editor_div.addEventListener('paste', (e) => {
    e.preventDefault();
    let text = (e.originalEvent || e).clipboardData.getData('text/plain');
    
    text = text.split('\n');
    
    let selection = window.getSelection();
    let range = selection.getRangeAt(0);
    let element = range.startContainer.parentElement;

    if (element.tagName === "LI") {
        element = element.parentElement;
        if (element.tagName === "OL" || element.tagName === "UL") {
            element = element.parentElement;
        }
    }
    let id_line = element.id;
    id = id_line;

    text.forEach((line, index) => {

        id = insert_new_line_with_text(index, line).id;
        console.log(id);
    });
});

function insert_line_id_position(id_line, position) {
    let line = document.createElement('div');
    line.id = id_line;
    line.classList.add('line');
    line.innerHTML = '';
    let children = Array.from(editor_div.children);
    if (position === 0) {
        editor_div.insertBefore(line, children[position]);
    } else {
        editor_div.insertBefore(line, children[position - 1]);
    }
}


function modified_line(id_line, new_text) {
    // verifier si la ligne existe
    if (document.getElementById(id_line) === null) {
        insert_line_id_position(id_line, 0);
    }
    let line = document.getElementById(id_line);
    line.innerHTML = new_text;
}


function save_editor() {
    editor_div_tmp = editor_div.cloneNode(true);

    let curseurs = Array.from(editor_div_tmp.getElementsByClassName('curseur'));
    curseurs.forEach(curseur => {
        curseur.remove();
    });


    const data = Array.from(editor_div_tmp.children).map(child => ({
        id: child.id,
        id_element_before: child.previousElementSibling ? child.previousElementSibling.id : null,
        classList: Array.from(child.classList),
        innerHTML: child.innerHTML,
        children: Array.from(child.children).map(grandChild => ({
            id: grandChild.id,
            classList: Array.from(grandChild.classList),
            innerHTML: grandChild.innerHTML
        }))
    }));
    const jsonData = JSON.stringify(data, null, 2);
    ws.send(JSON.stringify({
        type: 'modification',
        doc: new URLSearchParams(window.location.search).get('id'),
        message: jsonData
    }));
    return jsonData;
}

function load_editor(data) {
    // Récupère la position du curseur
    const selection = window.getSelection();
    const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
    const cursor_position = range ? range.startOffset : 0;
    const cursor_line = range && range.commonAncestorContainer.nodeType === Node.TEXT_NODE
        ? range.commonAncestorContainer.parentNode.id
        : range && range.commonAncestorContainer.classList.contains('line')
            ? range.commonAncestorContainer.id
            : "none";

    // Supprime les lignes
    // editor_div.innerHTML = '';
    last_id = 0;
    liste_id = [];
    
    // data == json
    data.forEach(child => {
        if (document.getElementById(child.id) !== null) {
            child.classList.forEach(cls => document.getElementById(child.id).classList.add(cls));
            document.getElementById(child.id).innerHTML = child.innerHTML;
            last_id = child.id;
            liste_id.push(child.id);
            return;
        }

        let line = document.createElement('div');
        line.id = child.id;
        child.classList.forEach(cls => line.classList.add(cls));
        line.innerHTML = child.innerHTML;

        line.addEventListener('mouseover', (e) => {
            let y = line.getBoundingClientRect().top - editor_top - 50;
            show_commande(y, line.id);
        });

        if (child.id_element_before === null || !document.getElementById(child.id_element_before)) {
            // append au debut de l'editeur 
            editor_div.insertBefore(line, editor_div.firstChild);
        } else {
            const referenceNode = document.getElementById(child.id_element_before);
            editor_div.insertBefore(line, referenceNode.nextSibling);
        }
        // editor_div.appendChild(line);

        last_id = child.id;
        liste_id.push(child.id);
    });

    // Supprime les lignes qui ne sont plus dans le document
    const children = Array.from(editor_div.children);
    children.forEach(child => {
        if (!liste_id.includes(child.id)) {
            child.remove();
        }
    });

    // Replace le curseur
    if (cursor_line !== "none") {
        const cursor_line_element = document.getElementById(cursor_line);
        if (cursor_line_element && cursor_line_element.childNodes.length > 0) {
            const textNode = cursor_line_element.childNodes[0];
            const newRange = document.createRange();
            newRange.setStart(textNode, Math.min(cursor_position, textNode.length));
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);
        }
    }
    
    setTimeout(() => {
        document.querySelector('.load_div').style.display = 'none';
        document.body.style.overflow = 'auto';
    }, 1000);
}

function move_cursor_other(id_other, id_line, position) {

    if (!id_other || !id_line || !position) {
        return;
    }
    // Remove existing cursor if any
    let cursor = document.getElementById(id_other);

    const line = document.getElementById(id_line);
    if (!line) return;

    if (!cursor) {
        // Create cursor element
        cursor = document.createElement('div');
        cursor.id = id_other;
        cursor.classList.add('curseur');
        let nom = document.createElement('div');
        nom.innerHTML = id_other;
        nom.classList.add('nom_cursor');
        cursor.appendChild(nom);
        line.appendChild(cursor);
    }

    // Get the line's content and create a range for measurement
    const text = line.textContent || line.innerText;
    const range = document.createRange();
    let offset_more = 0;
    let textNode;

    if (line.classList.contains('liste')) {
        // Handle list items specifically
        textNode = line.firstChild.firstChild;
        textNode = Array.from(textNode.childNodes).find(node =>
            node.nodeType === Node.TEXT_NODE
        ) || line.appendChild(document.createTextNode(''));
        offset_more = 48;
    } else {
        textNode = Array.from(line.childNodes).find(node =>
            node.nodeType === Node.TEXT_NODE
        ) || line.appendChild(document.createTextNode(''));
    }

    // Ensure the cursor position is within the bounds of the text length
    const cursorPos = Math.min(position, text.length);
    if (cursorPos > textNode.length) {
        console.error('Cursor position exceeds text node length');
        return;
    }
    // Set range to cover text up to cursor position
    range.setStart(textNode, 0);
    range.setEnd(textNode, cursorPos);

    const measureElement = document.createElement('span');
    measureElement.style.whiteSpace = 'pre-wrap';

    // chaque lettre est dans un span
    measureElement.innerHTML = text.substring(0, cursorPos).split('').map(char => `<span>${char}</span>`).join('');

    const style = window.getComputedStyle(line);
    const copyProperties = [
        'width', 'padding', 'border', 'font-size',
        'font-family', 'line-height', 'text-indent',
        'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
        'box-sizing'
    ];

    copyProperties.forEach(prop => {
        measureElement.style[prop] = style[prop];
    });
    measureElement.style.wordBreak = 'break-word';



    // Insérer temporairement l'élément de mesure
    const originalDisplay = line.style.display;
    line.style.display = 'none';
    document.body.appendChild(measureElement);

    let last_lettre = measureElement.lastChild;
    let lastLine = last_lettre.getBoundingClientRect();
    document.body.removeChild(measureElement);
    line.style.display = originalDisplay;


    const lineRect = line.getBoundingClientRect();
    const xOffset = lastLine.right - lineRect.left;
    const yOffset = (lineRect.top - 180) + window.scrollY + offset_more;

    console.log(xOffset, yOffset);

    cursor.style.position = 'absolute';
    cursor.style.left = `${xOffset}px`;
    cursor.style.top = `${yOffset}px`;

    range.detach();
}

const ws = new WebSocket('ws://192.168.1.74:3000');


// des que le curseur bouge

// document.addEventListener('selectionchange', () => {
//     const selection = window.getSelection();
//     const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
//     const cursor_position = range ? range.startOffset : 0;

//     let range_elem = range.commonAncestorContainer.parentNode;

//     if (range_elem.tagName === "LI") {
//         range_elem = range_elem.parentElement;
//         if (range_elem.tagName === "OL" || range_elem.tagName === "UL") {
//             range_elem = range_elem.parentElement;
//         }
//     }

//     const cursor_line = range_elem.id;

//     const jsonData = JSON.stringify({
//         cursor_position: cursor_position,
//         cursor_line: cursor_line
//     });

//     if (ws.readyState === WebSocket.OPEN) {
//         ws.send(JSON.stringify({
//             type: 'cursor_move',
//             doc: new URLSearchParams(window.location.search).get('id'),
//             message: jsonData
//         }));
//     }
// });



// envoyer un message au serveur
ws.onopen = () => {
    console.log('Connexion établie.');
    ws.send(JSON.stringify({
        type: 'info',
        message: new URLSearchParams(window.location.search).get('id')
    }));
    console.log('Connexion établie 2.');
    ws.send(JSON.stringify({
        type: 'notification',
        doc: new URLSearchParams(window.location.search).get('id'),
        message: 'Je suis connecté.'
    }));
};

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'welcome') {
        console.log(`Mon ID est : ${data.clientId}`);
    } else if (data.type === 'modification_text') {
        Json_data = JSON.parse(data.message);
        load_editor(Json_data);
    } else if (data.type === 'cursor_move') {
        let message = JSON.parse(data.message);
        // move_cursor_other(data.from, message.cursor_line, message.cursor_position);
    }
};

async function save_doc(outputData) {
    let id = new URLSearchParams(window.location.search).get('id');

    fetch('/save_document', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            data: JSON.stringify(outputData),
            id: id,
            title: document.querySelector('#title').value
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('Document saved:', data.message);
            } else {
                console.error('Save failed:', data.message);
            }
        })
        .catch(error => console.error('Error:', error));
}
document.getElementById('shareButton').addEventListener('click', () => {
    let id = 3;
    fetch('/partage_document', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            id_user:id,
            id_doc: new URLSearchParams(window.location.search).get('id')
        })
    })
    .then(response => response.text())
    .then(data => {
        console.log(data);
        if (data.success) {
            console.log('Document shared:', data.message);
        } else {
            console.error('Share failed:', data.message);
        }
    })
    .catch(error => console.error('Error:', error));
});


function loadDocument() {

    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id')

    fetch('/documents', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            id: id
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                let titre = data.documents[0].title;
                document.querySelector('#title').value = titre;

                if (data.documents[0].content ==" ") {
                    document.querySelector('.load_div').style.display = 'none';
                    document.body.style.overflow = 'auto';
                    return;
                }
                data_json = JSON.parse(data.documents[0].content);
                data_json = JSON.parse(data_json);


                load_editor(data_json);

                console.log('Document loaded:', data_json);
            } else {
                console.error('Load failed:', data.message);
            }
        })
        .catch(error => console.error('Error:', error));
}
loadDocument();