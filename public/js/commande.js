let isOpened = false;



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
    }

    let new_line = document.createElement('div');
    new_line.classList.add(type);   

    initialised_line(new_line);

    if(id == "first_line"){
        editor_div.insertBefore(new_line, editor_div.firstChild);
    } else if(id == "last_line"){
        editor_div.appendChild(new_line);
    }
    else{
        console.log(id);
        editor_div.insertBefore(new_line, editor_div.querySelector('#' + id).nextSibling);
    }

    if (type === 'normal') {
        new_line.innerHTML = '<br>';
        let range = document.createRange();
        range.selectNodeContents(new_line);
        range.collapse(false);
        let selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        new_line.focus();

    } else if (type === 'titre') {
        new_line.innerHTML = '<br>';
        let range = document.createRange();
        range.selectNodeContents(new_line);
        range.collapse(false);
        let selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        new_line.focus();
    } else if (type === 'liste') {
        new_line.innerHTML = '<ul><li></li></ul>';

        // focus sur le premier élément de la liste
        let range = document.createRange();
        range.selectNodeContents(new_line.querySelector('li'));
        range.collapse(false);
        let selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        new_line.querySelector('li').focus();

    } else if (type === 'liste_num') {
        new_line.innerHTML = '<ol><li></li></ol>';
        let range = document.createRange();
        range.selectNodeContents(new_line.querySelector('li'));
        range.collapse(false);
        let selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        new_line.querySelector('li').focus();
    }

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