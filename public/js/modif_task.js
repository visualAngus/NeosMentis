const endpointOptions_in = {
    isSource: true,
    isTarget: false,
    maxConnections: -1,
    endpoint: ["Dot", { radius: 6 }],
    paintStyle: { fill: "var(--transparent)" },
    connectorStyle: { stroke: "var(--blue-dark)", strokeWidth: 2 },
    connector: ["Bezier", { curviness: 50 }],
    cssClass: "endpoint-in",
    overlays: [
        ["PlainArrow", {
            location: 1,
            width: 10,
            length: 10,
            paintStyle: { fill: "var(--blue-dark)" },
            foldback: 0.8,
            detachable: true
        }]
    ]
};
const endpointOptions_out = {
    isSource: false,
    isTarget: true,
    maxConnections: -1,
    endpoint: ["Rectangle", { width: 20, height: 50 }],
    paintStyle: { fill: "var(--transparent)" },
    connectorStyle: { stroke: "red", strokeWidth: 2 },
    connector: ["Bezier", { curviness: 50 }],
    overlays: [
        ["PlainArrow", {
            location: 1,
            width: 10,
            length: 10,
            detachable: true
        }]
    ],
    cssClass: "endpoint-out",  // Class for endpoints
    connectorClass: "connector-class"  // Class for connectors
};

jsPlumb.ready(function () {
    if (id_project == null) {
        console.error('No project selected');
        return;
    }

    (async function () {
        await get_project_settings();
        await get_all_project_tasks(id_project);
    })();
    jsPlumb.setContainer(workspace);
    jsPlumb.draggable(workspace.querySelectorAll('.draggable-element'), {
        containment: 'parent'
    });

    setTimeout(() => {
        jsPlumb.bind("connection", function (info) {
            const connection = info.connection;
            info.id = "connection_" + connection.sourceId + "_" + connection.targetId;
            let conn_localStorage = JSON.parse(settings_connection_global) || {};
            conn_localStorage = {
                ...conn_localStorage,
                [info.id]: {
                    source: connection.sourceId,
                    target: connection.targetId
                }
            };
            settings_connection_global = JSON.stringify(conn_localStorage);
            localStorage.setItem('connections', JSON.stringify(conn_localStorage));


            connection.setParameter("info", "fssdfsffe");
            update_connection_progress();

            save_project_settings(false);


            // connection.setPaintStyle({ stroke: "yellow" });
            // Ajouter un événement de double-clic pour éditer les informations
            // connection.bind("dblclick", function (conn) {
            //     console.log(info);
            //     const newInfo = prompt("Entrez les nouvelles informations pour cette connexion:", conn.getParameter("info"));
            //     if (newInfo !== null) {
            //         conn.setParameter("info", newInfo);
            //     }
            // });
            // get_all_time();
        });

        jsPlumb.bind("connectionDetached", function (info) {
            const connection = info.connection;
            info.id = "connection_" + connection.sourceId + "_" + connection.targetId;
            let conn_localStorage = JSON.parse(settings_connection_global);
            delete conn_localStorage[info.id];
            settings_connection_global = JSON.stringify(conn_localStorage);
            localStorage.setItem('connections', JSON.stringify(conn_localStorage));
            // Properly clean up jsPlumb to avoid keeping unnecessary information
            jsPlumb.deleteConnection(connection);
            jsPlumb.repaintEverything();
            save_project_settings(false);

            // get_all_time();
        });


        let conn_localStorage = JSON.parse(settings_connection_global);

        if (conn_localStorage) {
            Object.keys(conn_localStorage).forEach(conn => {
                var endpointsOnFsdhg = jsPlumb.selectEndpoints({ element: conn_localStorage[conn].source });
                var endpointsOnFsd = jsPlumb.selectEndpoints({ element: conn_localStorage[conn].target });
                jsPlumb.connect({
                    source: endpointsOnFsdhg.get(1),
                    target: endpointsOnFsd.get(0),
                    paintStyle: { stroke: "var(--blue)", strokeWidth: 2 },
                    connectorStyle: { stroke: "var(--blue)", strokeWidth: 2 },
                    connector: ["Bezier", { curviness: 50 }],
                    cssClass: "connection1",
                    detachable: true,
                });
            });
        }
        get_all_time();


        document.querySelector('.load_div').style.display = 'none';
    }, 500);



});

function open_menu(selected) {
    // supprimer la class selected
    document.querySelectorAll('.selected').forEach(bloc => {
        bloc.classList.remove('selected');
    });

    selected.classList.add('selected');
    div_menu.classList.add('selected');
    div_menu.classList.remove('unselected');
    let time = selected.getAttribute('data-time');
    let progress = selected.getAttribute('data-progress');
    let titre = selected.querySelector('h2').textContent;
    let description = selected.querySelector('p').textContent;

    let jour = Math.floor(time / 24);
    let heure = Math.floor(time % 24);
    let min = Math.round((time % 1) * 60);

    let transit_collaborator = {};

    div_menu.style.display = 'flex';
    div_menu.querySelector('#titre_tache').value = titre;
    div_menu.querySelector('#description_tache').value = description;
    div_menu.querySelector('#temps_tache_jour').value = jour;
    div_menu.querySelector('#temps_tache_heure').value = heure;
    div_menu.querySelector('#temps_tache_min').value = min;
    div_menu.querySelector('#pourcentage_tache').value = progress;

    // select le textre dans l'input :
    div_menu.querySelector('#pourcentage_tache').select();



    div_menu.setAttribute('data-selected', selected.id);
    show_colaborator_in_menu(selected.id);
}

function closed_menu() {
    accept_modif();
    
    document.querySelectorAll('.selected').forEach(bloc => {
        bloc.classList.remove('selected');
    });
    div_menu.style.display = 'flex';
    div_menu.querySelector('#titre_tache').value = "";
    div_menu.querySelector('#description_tache').value = "";
    div_menu.querySelector('#temps_tache_jour').value = "";
    div_menu.querySelector('#temps_tache_heure').value = "";
    div_menu.querySelector('#temps_tache_min').value = "";
    div_menu.querySelector('#pourcentage_tache').value = "";
    div_menu.classList.add('unselected');
    div_menu.classList.remove('selected');
    div_menu.setAttribute('data-selected', "");
}

function accept_modif(){
    let titre = div_menu.querySelector('#titre_tache').value;
    let description = div_menu.querySelector('#description_tache').value;
    let jour = div_menu.querySelector('#temps_tache_jour').value;
    let heure = div_menu.querySelector('#temps_tache_heure').value;
    let min = div_menu.querySelector('#temps_tache_min').value;
    let pourcentage = div_menu.querySelector('#pourcentage_tache').value;
    let contributeurs = div_menu.querySelector('#contributeurs_tache').value;
    let link_ressources = '{"resources1":"https://www.google.com","resources2":"https://www.google.com"}';

    if (div_menu.getAttribute('data-selected') == "") {
        return;
    }
    let selected = document.getElementById(div_menu.getAttribute('data-selected'));
    if (selected == null) {
        return;
    }
    selected.querySelector('h2').textContent = titre;
    selected.querySelector('p').textContent = description;
    selected.querySelector('.div_temps_tache').textContent = convert_float_to_hours(parseFloat(jour) * 24 + parseFloat(heure) + parseFloat(min) / 60);
    selected.setAttribute('data-time', parseFloat(jour) * 24 + parseFloat(heure) + parseFloat(min) / 60);
    selected.setAttribute('data-progress', pourcentage);
    let etat = '';
    if (pourcentage > 0 && pourcentage < 100) {
        selected.querySelector('.div_etat').textContent = 'In progress';
        etat = 'In progress';
    } else if (pourcentage == 100) {
        selected.querySelector('.div_etat').textContent = 'Done';
        etat = 'Done';
    } else {
        selected.querySelector('.div_etat').textContent = 'Wainting';
        etat = 'Waiting';
    }

    // selected.querySelector('.div_etat').textContent = 'En cours';
    // selected.querySelector('.div_temps_tache').textContent = convert_float_to_hours(parseFloat(jour) + parseFloat(heure) / 24 + parseFloat(min) / 1440);
    update_task(selected.id, titre, parseFloat(jour) * 24 + parseFloat(heure) + parseFloat(min) / 60, pourcentage, etat, description, '{}', link_ressources, '{}');
    get_all_time();
}

function show_colaborator_task(id_task){
    let div_list_people = document.getElementById(id_task).querySelector('.div_list_people');
    get_collaborator_by_task(id_task).then(data => {
        div_list_people.innerHTML = '';
        data.collaborators.forEach(collaborator => {
            let div_personne = document.createElement('div');
            div_personne.className = 'people';
            div_personne.textContent = collaborator.name.slice(0, 2);
            div_list_people.appendChild(div_personne);
        });
    });
}

function show_colaborator_in_menu(id_task){
    let div_list_people = div_menu.querySelector('.div_recherche_resultat');
    let input = div_menu.querySelector('#contributeurs_tache');

    input.value = '';
    div_list_people.innerHTML = '';
    get_collaborator_by_task(id_task).then(data => {
        data.collaborators.forEach(collaborator => {
            let div_personne = document.createElement('div');
            div_personne.className = 'div_result';
            div_personne.textContent = collaborator.name.slice(0, 2);
            div_list_people.appendChild(div_personne);
        });
    });
}

document.querySelector('#contributeurs_tache').addEventListener('input', async function () {
    let id_task = div_menu.getAttribute('data-selected');
    let value = this.value;
    let div_recherche_resultat = document.querySelector('.div_recherche_resultat');

    div_recherche_resultat.innerHTML = '';
    if (value.length > 0) {
        await get_collaborator_recherche(value).then(data => {
            data.collaborators.forEach(collaborator => {
                let div_result = document.createElement('div');
                div_result.setAttribute("data-clicked", "false");
                div_result.className = 'div_result';
                div_result.textContent = collaborator.name.slice(0, 2);
                div_recherche_resultat.appendChild(div_result);

                div_result.addEventListener("click", async function () {

                    if (div_result.getAttribute("data-clicked") == "false") {
                        div_result.innerHTML = "";
                        let div_plus = document.createElement("div");
                        div_plus.className = "div_plus";
                        div_plus.innerHTML = "+";
                        div_result.appendChild(div_plus);
                        div_plus.style.opacity = "1";

                        div_result.setAttribute("data-clicked", "true");
                    } else {
                        let response = await add_contributor_to_task(id_task, collaborator.id);
                        if (response.success == true) {
                            show_colaborator_in_menu(id_task);
                            show_colaborator_task(id_task);
                        }else{
                            alert(response.message);
                        }
                    }
                });
            });
        });
    }else{
        div_recherche_resultat.innerHTML = '';
        show_colaborator_in_menu(id_task);
    }
});

div_menu.querySelector(".div_acept_event").addEventListener('click', function () {
    accept_modif();
});

div_menu.querySelector(".div_supp_event").addEventListener('click', function () {
    let selected = document.getElementById(div_menu.getAttribute('data-selected'));
    let id = selected.id;
    count = 0;
    while (count < 1000) {
        let all_connections = jsPlumb.getAllConnections();

        if (all_connections.length === 0) {
            break;
        }

        all_connections.forEach(connection => {
            if (connection.sourceId === selected.id || connection.targetId === selected.id) {
                try {
                    jsPlumb.deleteConnection(connection);
                }
                catch (error) {
                }
            }
        });
        count++;
    }
    jsPlumb.remove(selected);
    let blocs = JSON.parse(settings_bloc_global);
    delete blocs[selected.id];
    localStorage.setItem('blocs', JSON.stringify(blocs));
    delete_task(id);
    get_all_time();
    closed_menu();
    save_project_settings(false);
});
document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && document.querySelectorAll('.selected')) {
        console.log('Enter');
        accept_modif();
    }
});

function update_graphic_task(id_task, title, time, progress, description, contributeurs) {
    let selected = document.getElementById(id_task);
    selected.querySelector('h2').textContent = title;
    selected.querySelector('p').textContent = description;
    selected.querySelector('.div_temps_tache').textContent = convert_float_to_hours(time);
    selected.setAttribute('data-time', time);
    selected.setAttribute('data-progress', progress);
    let etat = '';
    if (progress > 0 && progress < 100) {
        selected.querySelector('.div_etat').textContent = 'In progress';
        etat = 'In progress';
    } else if (progress == 100) {
        selected.querySelector('.div_etat').textContent = 'Done';
        etat = 'Done';
    } else {
        selected.querySelector('.div_etat').textContent = 'Wainting';
        etat = 'Waiting';
    }

    //  update position
    let blocs = JSON.parse(settings_bloc_global);
    let bloc = blocs[id_task];

    selected.style.left = bloc.position.x + 'px';
    selected.style.top = bloc.position.y + 'px';
    jsPlumb.repaintEverything();

    show_colaborator_task(id_task);
}

async function refresh() {
    let blocs = JSON.parse(localStorage.getItem('blocs'));
    let tasks = await get_all_project_tasks_infos(id_project);
    await get_project_settings();
    tasks.forEach(task => {
        if (blocs[task.id_tache] == null) {
            let new___ = create_tache(task.id_tache, task.title, task.duree_theorique, task.pourcentage_avancemennt, task.etat, task.description, task.contributeurs);
            // rajouter le nouveau bloc dans le local storage
            blocs[task.id_tache] = {
                position: {
                    x: 0,
                    y: 0
                }
            };
        }else{
            update_graphic_task(task.id_tache, task.title, task.duree_theorique, task.pourcentage_avancemennt, task.description, task.contributeurs);
        }
    });
    localStorage.setItem('blocs', JSON.stringify(blocs));

    let conn_localStorage = JSON.parse(settings_connection_global);
    let allConnections = jsPlumb.getAllConnections();

    // Remove connections that are no longer in settings_connection_global
    allConnections.forEach(connection => {
        if (connection.sourceId && connection.targetId) {
            let connectionId = "connection_" + connection.sourceId + "_" + connection.targetId;
            if (!conn_localStorage[connectionId]) {
                jsPlumb.deleteConnection(connection);
            }
        }
    });

    // Add connections that are in settings_connection_global but not in jsPlumb
    Object.keys(conn_localStorage).forEach(conn => {
        var existingConnection = jsPlumb.getConnections({
            source: conn_localStorage[conn].source,
            target: conn_localStorage[conn].target
        });

        if (existingConnection.length === 0) {
            var endpointsOnFsdhg = jsPlumb.selectEndpoints({ element: conn_localStorage[conn].source });
            var endpointsOnFsd = jsPlumb.selectEndpoints({ element: conn_localStorage[conn].target });
            jsPlumb.connect({
                source: endpointsOnFsdhg.get(1),
                target: endpointsOnFsd.get(0),
                paintStyle: { stroke: "var(--blue)", strokeWidth: 2 },
                connectorStyle: { stroke: "var(--blue)", strokeWidth: 2 },
                connector: ["Bezier", { curviness: 50 }],
                cssClass: "connection1",
                detachable: true,
            });
        }
    });    

    setTimeout(() => {
        get_all_time();
    }, 500);

}