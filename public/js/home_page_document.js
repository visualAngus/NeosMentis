let last_change = Date.now();
let update_skipped = false;

function open_profile_menu(parent) {
    const div = document.createElement('div');
    div.classList.add('div_profil_menu', 'open');

    let x = parent.getBoundingClientRect().x;
    let y = parent.getBoundingClientRect().y +35;

    div.style.left = `${x}px`;
    div.style.top = `${y}px`;

    

    
    document.body.appendChild(div);
}

async function get_all_user_info() {
    try {
        const response = await fetch('/get_all_user_info');
        const data = await response.json();
        if (data.success) {
            document.querySelector('.div_profil_bnt').style.display = 'none';
            const div = document.createElement('div');
            div.classList.add('div_profil_name');
            let h2 = document.createElement('h2');
            h2.innerHTML = data.data.username;
            div.appendChild(h2);
            document.querySelector('.div_compte_header').appendChild(div);

            h2.addEventListener('click', () => {
                // open_profile_menu(h2);
            });

            let settings = data.settings;

            localStorage.setItem('home_settings', JSON.stringify(settings.home_settings));
            localStorage.setItem('style_settings', JSON.stringify(settings.style_settings));

        } else {
            console.error('Error fetching users:', data.message);
        }
    } catch (error) {
        console.error('Failed to fetch users:', error);
    }
}

get_all_user_info()

setTimeout(() => {
    document.querySelector('.load_div').style.display = 'none';
}, 500);

async function fetchDocuments() {
    try {
        const response = await fetch(`/documents_by_user`);
        const data = await response.json();
        if (data.success) {
            return data.documents;
        } else {
            console.error('Error fetching documents:', data.message);
        }
    } catch (error) {
        console.error('Failed to fetch documents:', error);
    }
}

async function save_user_settings(pass = 0) {

    if (Date.now() - last_change < 1000 && pass === 0) {
        update_skipped = true;
        return;
    }
    try {
        let home_settings = JSON.parse(localStorage.getItem('home_settings'));
        let style_settings = JSON.parse(localStorage.getItem('style_settings'));

        const response = await fetch('/save_user_settings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                home_settings: home_settings,
                style_settings: style_settings
            })
        });
        const data = await response.json();
        if (data.success) {
            update_skipped = false;
            last_change = Date.now();
        } else {
            console.error('Error saving settings:', data.message);
        }
    } catch (error) {
        console.error('Failed to save settings:', error);
    }

}

async function create_document_base() {
    try {
        const response = await fetch('/create_document', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        if (data.success) {
            window.location.href = `/editor2?id=${data.id}`;
        } else {
            console.error('Error creating document:', data.message);
        }
    } catch (error) {
        console.error('Failed to create document:', error);
    }
    
}

async function remove_document(id_doc) {
    const response = await fetch('/delete_document', {  
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            id: id_doc
        })
    });
    const data = await response.json();
    if (data.success) {
        console.log('Document removed');
        document.querySelector(`.div_doc[id="${id_doc}"]`).remove();
        removeContextMenu();
    } else {
        console.error('Error removing document:', data.message);
    }
    
}

function getTimeBetween(date1) {
    let date_ = new Date(date1);
    date_ = Date.now()- date_.getTime();

    // convert to seconds
    date = Math.floor(date_ / 1000);
    if (date < 60) {
        date = date + 's';
    }
    // convert to minutes
    else if (date < 3600) {
        date = Math.floor(date / 60) + 'min';
    }
    // convert to hours
    else if (date < 86400) {
        date = Math.floor(date / 3600) + 'h' + Math.floor((date % 3600) / 60) + 'min';
    }
    // convert to days
    else if (date < 604800) {
        date = Math.floor(date / 86400) + 'd' + Math.floor((date % 86400) / 3600) + 'h';
    }
    // convert to weeks
    else if (date < 2419200) {
        date = Math.floor(date / 604800) + 'w' + Math.floor((date % 604800) / 86400) + 'd';
    }
    return date;
}

function add_document(parent, title, id, add_div,date) {
    const div = document.createElement('div');
    div.classList.add('div_doc');
    div.id = id;
    if (title == ""){
        title = "New document";
    }
    setInterval(() => {
        new_time = getTimeBetween(date);
        div.innerHTML = `<h2>${title}</h2> <p>${new_time}</p>`;
    }, 1000);
    new_time = getTimeBetween(date);
    div.innerHTML = `<h2>${title}</h2> <p>${new_time}</p>`;
    div.addEventListener('click', () => {
        window.location.href = `/editor2?id=${id}`;
    });       

    parent.appendChild(div);

    if (parent.children.length > 7) {
        add_div.classList.add("small")
    }
    else {
        add_div.classList.remove("small")
    }
}

function create_document_groupe(titre, id) {
    const div_content = document.createElement('div');
    div_content.classList.add('div_event', 'green', 'document', titre);

    const div_header = document.createElement('div');
    div_header.classList.add('div_header_event');

    const div_trou = document.createElement('div');
    div_trou.classList.add('div_round_trou', 'hand');

    const add_div = document.createElement('div');
    add_div.classList.add('div_add');
    add_div.innerHTML = '<h2>+</h2>';

    add_div.addEventListener('click', () => {
        create_document_base();
    });

    const div_content_inner = document.createElement('div');
    div_content_inner.classList.add('div_content');

    let grab = false;

    let div_snap;
    let div_snap_position;

    // Gérer le déplacement de div_content et la gestion des snaps
    window.addEventListener('mousemove', (e) => {
        if (grab) {
            const x = e.clientX - 32.5; // Ajuster les coordonnées
            const y = e.clientY - 105;
            div_content.style.transform = `translate(${x}px, ${y}px)`;

            const actuel_settings = JSON.parse(localStorage.getItem('home_settings')) || {};
            actuel_settings.document[id] = actuel_settings.document[id] || {};
            actuel_settings.document[id].position = { x, y };
            localStorage.setItem('home_settings', JSON.stringify(actuel_settings));

            save_user_settings();

            const snapSelector = div_content.style.height === '70px' ? '.div_snap_small' : '.div_snap_big';
            const snapElements = document.querySelectorAll(snapSelector);
            const snapPositions = Array.from(snapElements).map(el => [el.getBoundingClientRect(), el]);
            div_snap = null;
            div_snap_position = null;
            snapPositions.forEach(([rect, el]) => {
                const x_target = rect.x;
                const y_target = rect.y - (snapSelector === '.div_snap_small' ? 75 : 75);
                const distancex = snapSelector === '.div_snap_small' ? 200 : 200;
                const distancey = snapSelector === '.div_snap_small' ? 50 : 100;
                const inRange = Math.abs(x - x_target) < distancex && Math.abs(y - y_target) < distancey;

                el.style.backgroundColor = inRange && !el.classList.contains('take') ? 'var(--bleu-overlay)' : 'transparent';

                if (inRange) {
                    div_snap = el;
                    div_snap_position = { x: x_target, y: y_target + (snapSelector === '.div_snap_small' ? 75 : 75) };
                }
                 else if (div_snap && div_snap !== el) {
                    el.classList.remove('take');
                }
            });
        }
    });

    // Activer le grab lors du clic
    div_trou.addEventListener('mousedown', (e) => {
        grab = true;
    });

    // Désactiver le grab lors du relâchement de la souris
    window.addEventListener('mouseup', () => {
        grab = false;
        if (div_snap && div_snap_position) {
            div_content.style.transform = `translate(${div_snap_position.x}px, ${div_snap_position.y - 75}px)`;
            Array.from(div_snap.children).forEach(child => {
                if (!child.classList.contains('end')) {
                    child.classList.add('take');
                }
            });

            if (div_snap.children.length === 0) {
                div_snap.classList.add('take');
            }

            div_snap.style.backgroundColor = 'transparent';

            const actuel_settings = JSON.parse(localStorage.getItem('home_settings')) || {};

            actuel_settings.document = actuel_settings.document || {};
            actuel_settings.document[id] = actuel_settings.document[id] || {};
            actuel_settings.document[id].position = div_snap_position;
            actuel_settings.document[id].snap = div_snap.id;
            localStorage.setItem('home_settings', JSON.stringify(actuel_settings));


            div_snap = null;
            div_snap_position = null;
        }
    });

    const div_titre = document.createElement('div');
    div_titre.classList.add('div_document_titre');
    div_titre.innerHTML = `<h2>${titre}</h2>`;

    const div_trou2 = document.createElement('div');
    div_trou2.classList.add('div_round_trou', 'close');

    div_trou2.addEventListener('click', () => {
        div_snap = null;
        div_snap_position = null;

        let snap_big = document.querySelectorAll('.div_snap_big');
        snap_big.forEach((el) => {
            let children = el.children;
            for (let child of children) {
                if (child.classList.contains('take')) {
                    child.classList.remove('take');
                }
            }
            if (div_content_inner.children.length > 7){
                add_div.classList.add("small")
            }
            else{
                add_div.classList.remove("small")
            }
        });

        if (div_content.style.height === '70px') {
            div_content.style.height = '600px';

            setTimeout(() => {
                add_div.style.display = 'flex';
            }, 50);


            let actuel_settings = JSON.parse(localStorage.getItem('home_settings'));
            actuel_settings.document[id].close = false;
            localStorage.setItem('home_settings', JSON.stringify(actuel_settings));

        } else {
            div_content.style.height = '70px';
            add_div.style.display = 'none';


            let actuel_settings = JSON.parse(localStorage.getItem('home_settings'));
            actuel_settings.document[id].close = true;
            localStorage.setItem('home_settings', JSON.stringify(actuel_settings));

        }

        save_user_settings();
    });

    div_header.appendChild(div_trou);
    div_header.appendChild(div_titre);
    div_header.appendChild(div_trou2);

    div_content.appendChild(div_header);
    div_content.appendChild(div_content_inner);

    if (titre !== "Agenda") {
        div_content_inner.appendChild(add_div);
    }

    document.querySelector('main').appendChild(div_content);

    // get from local storage
    if (localStorage.getItem('home_settings')) {
        let actuel_settings = JSON.parse(localStorage.getItem('home_settings'));
        div_content.style.transform = `translate(${actuel_settings.document[id].position.x}px, ${actuel_settings.document[id].position.y}px)`;
        if (actuel_settings.document[id].close) {
            div_content.style.height = '70px';
            add_div.style.display = 'none';
        } else {
            div_content.style.height = '600px';
            add_div.style.display = 'flex';
        }

        div_snap = document.getElementById(actuel_settings.document[id].snap);
        if (!div_snap) {
            return;
        }
        div_snap_position = { x: div_snap.getBoundingClientRect().x, y: div_snap.getBoundingClientRect().y };

        div_content.style.transform = `translate(${div_snap_position.x}px, ${div_snap_position.y - 75}px)`;
        Array.from(div_snap.children).forEach(child => {
            if (!child.classList.contains('end')) {
                child.classList.add('take');
            }
        });

        if (div_snap.children.length === 0) {
            div_snap.classList.add('take');
        }

    }


    return [div_content_inner, add_div];
}

// Using an immediately invoked async function
// (async () => {
//     let allDocuments = await fetchDocuments();

//     if (!allDocuments) {
//         return;
//     }

//     [parent,add_div] = create_document_groupe()
//     allDocuments.forEach(doc => {
//         console.log(doc);
//         add_document(parent, doc.title, doc.id,add_div,doc.last_modified);
//     });
// })();

setInterval(() => {
    if (update_skipped) {
        save_user_settings();
    }
}, 1000);

// si la page est refresh, on sauvegarde les settings
window.addEventListener('beforeunload', () => {
    save_user_settings(1);
});
// si la page est fermée, on sauvegarde les settings
window.addEventListener('unload', () => {
    save_user_settings(1);
});

window.addEventListener('mousedown', (e) => {
    if (e.button === 2) {
        return;
    }
    if (!e.target.closest('.contextmenu')) {
        removeContextMenu();
    }
});



async function accepeterLesPartages(){
    fetch('/accepter_les_partages', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(async data => {
            console.log(data);
            if (data.success) {
                let allDocuments = await fetchDocuments();

            if (!allDocuments) {
                return;
            }
        
            [parent,add_div] = create_document_groupe("Documents",1);

            // supprimer les documents
            let divs = document.querySelectorAll('.div_doc');
            divs.forEach(div => {
                div.remove();
            });

            allDocuments.forEach(doc => {
                console.log(doc);
                add_document(parent, doc.title, doc.id,add_div,doc.last_modified);
            });
        } else {
            console.error('Share failed:', data.message);
        }
    })
    .catch(error => console.error('Error:', error));
}
accepeterLesPartages();