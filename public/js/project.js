const div_menu = document.querySelector(".div_menu");
let url_param = new URLSearchParams(window.location.search);
let id_project = url_param.get('project');
let transit_collaborator = {};
let temps_vise = 13.5;
let max_all_time = 0;
let avancement = 0;
let max_path = [];
let time_left = 0;
let date_start;
let settings_connection_global;
let settings_bloc_global;




function create_tache(id, titre, temps, pourcentage, etat, description, contributeur, event = null) {
    // Créer les éléments HTML
    const newBloc = document.createElement('div');
    const divGestion = document.createElement('div');
    const divEtat = document.createElement('div');
    const divTemps = document.createElement('div');
    const h2Titre = document.createElement('h2');
    const pDescription = document.createElement('p');
    const divListPeople = document.createElement('div');
    const divBtnClose = document.createElement('div');
    // Définir les classes et IDs
    newBloc.id = id;
    let actual_localStorage = JSON.parse(settings_bloc_global) || {};
    if (actual_localStorage[id]) {
        newBloc.style.top = actual_localStorage[id].position.y + 'px';
        newBloc.style.left = actual_localStorage[id].position.x + 'px';

        if (actual_localStorage[id].position.closed) {
            newBloc.style.height = '0px';
            newBloc.style.width = '250px';
            newBloc.style.padding = '0px 25px 0px 25px';
            divBtnClose.style.transform = 'rotate(180deg) translateX(-50%)';
            divBtnClose.style.borderRadius = '0 0 5px 5px';
            // display none pour les enfants
            h2Titre.style.opacity = '0';
            pDescription.style.display = 'none';
            divListPeople.style.display = 'none';

            // les point d'accroche les remonter de 150px
            jsPlumb.selectEndpoints({ element: newBloc.id }).each(function (endpoint) {
                endpoint.anchor.y = 0;
            });
            jsPlumb.repaintEverything();
        }
    } else {
        newBloc.style.top = 'calc(50vh - 100px)';
        newBloc.style.left = 'calc(50vw - 100px)';
    }
    newBloc.className = 'bloc';
    newBloc.setAttribute('data-time', temps);
    newBloc.setAttribute('data-progress', pourcentage);

    if (event) {
        newBloc.style.top = event.clientY+transformY + 'px';
        newBloc.style.left = event.clientX +transformX+ 'px';
    }

    newBloc.addEventListener('dblclick', function () {
        open_menu(newBloc);
    });

    divBtnClose.className = 'btn_close';
    divGestion.className = 'div_gestion';
    divEtat.className = 'div_etat';
    divTemps.className = 'div_temps_tache';
    divListPeople.className = 'div_list_people';

    if (etat == "Done"){
        newBloc.classList.add('done');
        newBloc.style.background = '';

    }else if(etat == "In progress"){
        newBloc.classList.add('in_progress');
        newBloc.style.background = 'linear-gradient(to right, var(--blue) ' + newBloc.getAttribute('data-progress') + '%, var(--white) ' + newBloc.getAttribute('data-progress') + '%)';
    }else{
        newBloc.classList.add('waiting');
        newBloc.style.background = '';

    }


    // Définir le contenu
    divEtat.textContent = etat;
    divTemps.textContent = convert_float_to_hours(temps);
    h2Titre.textContent = titre;
    pDescription.textContent = description;
    divBtnClose.textContent = '△';


    contributeur = JSON.parse(contributeur);
    for (const [key, value] of Object.entries(contributeur)) {
        const divPeople = document.createElement('div');
        divPeople.className = 'people';
        divPeople.textContent = value.slice(0, 2);
        divListPeople.appendChild(divPeople);
    }

    // Construire la structure
    divGestion.appendChild(divEtat);
    divGestion.appendChild(divTemps);
    newBloc.appendChild(divGestion);
    newBloc.appendChild(h2Titre);
    newBloc.appendChild(pDescription);
    newBloc.appendChild(divListPeople);
    newBloc.appendChild(divBtnClose);


    divBtnClose.addEventListener('click', function () {
        let actual_localStorage = JSON.parse(settings_bloc_global) || {};

        if (newBloc.style.height !== '0px') {
            newBloc.style.height = '0px';
            // newBloc.style.width = '250px';
            newBloc.style.padding = '0px 25px 0px 25px';
            // display none pour les enfants
            h2Titre.style.opacity = '0';
            pDescription.style.display = 'none';
            divListPeople.style.display = 'none';
            divBtnClose.style.transform = 'rotate(180deg) translateX(-50%)';
            divBtnClose.style.borderRadius = '0 0 5px 5px';

            // les point d'accroche les remonter de 150px
            jsPlumb.repaintEverything();
            actual_localStorage[newBloc.id].position = {
                x: parseFloat(newBloc.style.left),
                y: parseFloat(newBloc.style.top),
                closed: true
            };


        } else {
            newBloc.style.height = '';
            newBloc.style.width = '';
            newBloc.style.padding = '15px 25px 5px 25px';
            // display none pour
            h2Titre.style.opacity = '1';
            pDescription.style.display = 'flex';
            divListPeople.style.display = 'flex';
            divBtnClose.style.transform = 'translateX(50%)';
            divBtnClose.style.borderRadius = '5px 5px 0 0';

            // remettre les point d'accroche à leur place

            jsPlumb.repaintEverything();
            actual_localStorage[newBloc.id].position = {
                x: parseFloat(newBloc.style.left),
                y: parseFloat(newBloc.style.top),
                closed: false
            };

        }
        settings_bloc_global = JSON.stringify(actual_localStorage);
        localStorage.setItem('blocs', JSON.stringify(actual_localStorage));
    });

    // Ajouter au document et configurer jsPlumb
    workspace.appendChild(newBloc);
    jsPlumb.addEndpoint(newBloc.id, { anchors: "LeftMiddle" }, endpointOptions_out);
    jsPlumb.addEndpoint(newBloc.id, { anchors: "RightMiddle" }, endpointOptions_in);

    jsPlumb.draggable(newBloc.id, {
        drag: function (event) {
            jsPlumb.setZoom(scale);
        },
        stop: function (event) {

            let actual_localStorage = JSON.parse(settings_bloc_global) || {};

            if (!actual_localStorage[newBloc.id]) {
                actual_localStorage = {
                    ...actual_localStorage,
                    [newBloc.id]: {
                        position: {
                            x: event.pos[0],
                            y: event.pos[1],
                            closed: actual_localStorage[newBloc.id] ? actual_localStorage[newBloc.id].position.closed : false
                        }
                    }
                };
            } else {
                actual_localStorage[newBloc.id].position = {
                    x: event.pos[0],
                    y: event.pos[1],
                    closed: actual_localStorage[newBloc.id].position.closed
                };
            }
            settings_bloc_global = JSON.stringify(actual_localStorage);
            localStorage.setItem('blocs', JSON.stringify(actual_localStorage));
            save_project_settings(false);

        }
    });

    show_colaborator_task(newBloc.id);
    return newBloc;
}

function convert_float_to_hours(float_hour) {
    const hours = Math.floor(float_hour);
    const minutes = Math.round((float_hour % 1) * 60);
    return (hours) + 'h' + (minutes < 10 ? '0' + minutes : minutes);
}

function add_time_left(parent, time, liste_path) {
    // si le parent a déjà un div_time_left, on le supprime
    if (parent.querySelector('.div_time_left')) {
        parent.querySelector('.div_time_left').remove();
    }
    const divTimeLeft = document.createElement('div');
    divTimeLeft.className = 'div_time_left';
    divTimeLeft.textContent = convert_float_to_hours(time);
    if (time > temps_vise) {
        divTimeLeft.style.backgroundColor = 'var(--rouge-ok)';
    } else if (time >= temps_vise * 0.9) {
        divTimeLeft.style.backgroundColor = 'var(--orange-ok)';
    } else {
        divTimeLeft.style.backgroundColor = 'var(--blue)';
    }
    divTimeLeft.setAttribute('data-liste-path', JSON.stringify(liste_path));
    parent.appendChild(divTimeLeft);

    divTimeLeft.addEventListener('mouseover', function () {
        let noeud = document.querySelectorAll('.bloc');
        noeud.forEach(n => {
            if (liste_path.includes(n.id)) {
                n.style.animation = 'none';
                n.style.backgroundColor = 'var(--blue)';
            } else {
                n.style.backgroundColor = '';
            }
        });
    });

    divTimeLeft.addEventListener('mouseout', function () {
        let noeud = document.querySelectorAll('.bloc');
        noeud.forEach(n => {
            n.style.backgroundColor = '';
            n.style.animation = '';
        });
    });
}

function findAllPaths(nodeId, visitedNodes = []) {
    // Add current node to visited nodes
    visitedNodes.push(nodeId);

    // Get all connections where this node is the target
    const connections = jsPlumb.getConnections({ target: nodeId });

    // Base case: if no connections, return path with just this node
    if (connections.length === 0) {
        return [[nodeId]];
    }

    let paths = [];
    // For each connection, recursively find paths
    connections.forEach(connection => {
        // Avoid cycles by checking if node was already visited
        if (!visitedNodes.includes(connection.sourceId)) {
            // Recursive call with new copy of visited nodes
            const subPaths = findAllPaths(connection.sourceId, [...visitedNodes]);
            // Add current node to start of each subpath
            subPaths.forEach(subPath => {
                paths.push([nodeId, ...subPath]);
            });
        }
    });
    return paths;
}

function total_time_from_path(path) {
    let total_time = 0;
    if (!Array.isArray(path)) {
        path = [path];
    }
    path.slice(1).forEach(node => {
        let time = parseFloat(document.getElementById(node).getAttribute('data-time'));
        // let pourcent  = (100-parseFloat(document.getElementById(node).getAttribute('data-progress')))/100;
        let pourcent = 1;
        total_time += time*pourcent;
    });
    return total_time;
}
function update_connection_progress() {
    jsPlumb.getAllConnections().forEach(function (conn) {

        conn.addOverlay(["Arrow", { location: 1, width: 10, length: 10 }]);

        // Add an overlay to the connection
        let elem = document.getElementById(conn.sourceId);

        if (!elem.getAttribute('data-progress')) {
            elem.setAttribute('data-progress', 100);
        }
        let progress = (elem.getAttribute('data-progress'));
        let random_id = Math.random().toString(36).substring(7);
        // verify if the id is already used
        while (document.getElementById(random_id)) {
            random_id = Math.random().toString(36).substring(7);
        }

        conn.addOverlay(["Label", {
            label: progress,
            cssClass: "aLabel " + random_id
        }]);
        let div_pourcentage = document.createElement('div');
        div_pourcentage.className = 'div_pourcentage';
        div_pourcentage.style.width = progress + '%';

        if (progress == 100) {
            div_pourcentage.style.backgroundColor = 'var(--vert-ok)';
        }


        document.getElementsByClassName(random_id)[0].appendChild(div_pourcentage);
    });
    jsPlumb.repaintEverything();
}



function get_all_time() {
    let json_layer = {}
    let sourceDepthMap = {};

    document.querySelectorAll('.bloc').forEach(bloc => {
        const blocId = bloc.id;
        const blocConnections = jsPlumb.getConnections({ target: blocId });

        let conn = jsPlumb.getConnections({ target: blocId });
        let all_100 = true;
        if (conn.length > 0) {
            conn.forEach(con => {
                let pourcentage = parseFloat(document.getElementById(con.sourceId).getAttribute('data-progress'));
                if (pourcentage != 100) {
                    all_100 = false;
                }
            });
        }

        if (bloc.getAttribute('data-progress') >= 100) {
            bloc.classList.add('done');
            bloc.classList.remove('in_progress');
            bloc.classList.remove('waiting');
            bloc.style.background = '';

        }else if (bloc.getAttribute('data-progress') > 0) {
            bloc.classList.add('in_progress');
            bloc.classList.remove('done');
            bloc.classList.remove('waiting');
            bloc.style.background = 'linear-gradient(to right, var(--blue) ' + bloc.getAttribute('data-progress') + '%, var(--white) ' + bloc.getAttribute('data-progress') + '%)';
        }else{
            bloc.classList.add('waiting');
            bloc.classList.remove('done');
            bloc.classList.remove('in_progress');
            bloc.style.background = '';

        }

        if (bloc.getAttribute('data-progress') == 0 && all_100) {
            bloc.classList.add('have_to_start');
            bloc.classList.remove('done');
            bloc.classList.remove('in_progress');
            bloc.classList.remove('waiting');
            bloc.style.background = '';

        }else{
            bloc.classList.remove('have_to_start');
        }


        if (blocConnections.length === 0) {
            json_layer = {
                ...json_layer,
                [0]: [{
                    source: blocId,
                    target: null
                }]
            };
        } else {
            const allPaths = findAllPaths(blocConnections[0].target.id);
            allPaths.forEach(path => {
                const depth = path.length - 1;
                path.push(total_time_from_path(path));
                if (sourceDepthMap[blocId] === undefined || depth > sourceDepthMap[blocId]) {
                    // rajoute a la fin de chaque liste le temps qu'il faut pour la parcourir

                    // Remove from previous depth if exists
                    if (sourceDepthMap[blocId] !== undefined) {
                        json_layer[sourceDepthMap[blocId]] = json_layer[sourceDepthMap[blocId]].filter(item => item.source !== blocId);
                    }
                    // Add to current depth
                    if (json_layer[depth]) {

                        json_layer[depth].push({
                            source: blocId,
                            target: path[path.length - 1],
                            visited: [path]
                        });
                    } else {
                        json_layer[depth] = [{
                            source: blocId,
                            target: path[path.length - 1],
                            visited: [path]
                        }];
                    }
                    // Update the source depth map
                    sourceDepthMap[blocId] = depth;
                } else {
                    // cherche dans le json la source qui est égale à blocId
                    Object.keys(json_layer).forEach(layer => {
                        json_layer[layer].forEach(elem => {
                            if (elem.source === blocId) {
                                elem.visited = [...elem.visited, path];
                            }
                        });
                    });
                }
            });
        }
    });

    max_all_time = 0;
    max_path = [];
    // console.log(json_layer);
    Object.keys(json_layer).forEach(layer => {
        json_layer[layer].forEach(elem => {
            if (elem.visited) {
                let visited = elem.visited;
                let max_time = 0;
                let finale_path;
                visited.forEach(visit => {
                    let time = visit[visit.length - 1];
                    let time_with_pourcent = 0;
                    visit.slice(0, -1).forEach(node => {
                        if (document.getElementById(node)){
                            time_with_pourcent += parseFloat(document.getElementById(node).getAttribute('data-time')) * (100 - parseFloat(document.getElementById(node).getAttribute('data-progress'))) / 100;
                        }
                    });

                    if (time_with_pourcent == 0){
                        time_with_pourcent = time
                    }
                    if (time_with_pourcent > max_time) {
                        max_time = time_with_pourcent;
                        finale_path = visit;
                    }
                });
                document.getElementById(elem.source).setAttribute('data-time-start', max_time);
                add_time_left(document.getElementById(elem.source), max_time, finale_path);

                let time = max_time + parseFloat(document.getElementById(elem.source).getAttribute('data-time'));

                if (finale_path && max_path.length < finale_path.length) {
                    max_path = finale_path;
                }

                if (time > max_all_time) {
                    max_all_time = time;
                }
            }
        });
    });

    // supprimer les .div_pourcentage 
    document.querySelectorAll('.div_pourcentage').forEach(div => {
        div.remove();
    });

    // supprimer les .jtk-overlay
    document.querySelectorAll('.jtk-overlay').forEach(div => {
        div.remove();
    });

    update_connection_progress();
    jsPlumb.repaintEverything();
    update_header();
}

function update_header(){


    time_left = 0;
    max_path.slice(0,-1).forEach(path => {
        let elem = document.getElementById(path);
        if (elem){
            let time = parseFloat(elem.getAttribute('data-time'));
            let pourcent  = (100-parseFloat(elem.getAttribute('data-progress')))/100;
            time_left += time*pourcent;
        }
    });

    avancement = (max_all_time - time_left);

    let diff=0;
    if (date_start != null){
        let time = new Date().getTime() - date_start.getTime();
        // convert en heure
        diff = time / 3600000;
    } 

    let div_temps_total = document.querySelector('.temps_total');
    div_temps_total.textContent = convert_float_to_hours(time_left);
    div_temps_total.style.color = time_left > temps_vise-diff ? 'var(--rouge-ok)' : 'var(--vert-ok)';

    let temps_viser = document.querySelector('.temps_total_vise');
    let signe = time_left > temps_vise-diff ? '-' : '+';
    temps_viser.textContent = signe + convert_float_to_hours(Math.abs(temps_vise-diff-time_left));
    temps_viser.style.color = time_left > temps_vise-diff ? 'var(--rouge-ok)' : 'var(--text-color)';

    let temps_avancer = document.querySelector('.avancement');
    temps_avancer.textContent = convert_float_to_hours(avancement);

    let start_time = document.querySelector('.start_time');
    if (date_start != null){
        start_time.textContent = date_start.toLocaleDateString() + ' ' + date_start.toLocaleTimeString();
    }else{
        start_time.textContent = 'Maintenant';
    }

    let end_time = document.querySelector('.end_time');
    if (date_start != null){
        let end = new Date(date_start.getTime() + (max_all_time) * 3600000);
        end_time.textContent = end.toLocaleDateString() + ' ' + end.toLocaleTimeString();
    }else{
        let now = new Date();
        let end = new Date(now.getTime() + (time_left) * 3600000);
        end_time.textContent = end.toLocaleDateString() + ' ' + end.toLocaleTimeString();
    }
    
}

async function save_project_settings(auto = true) {
    if (auto) {
        return;
    }
    let connections = JSON.parse(settings_connection_global) || {};
    let blocs = JSON.parse(settings_bloc_global) || {};

    if (Object.keys(connections).length === 0 && Object.keys(blocs).length === 0) {
        console.error('No data to save');
        return;
    }
    const response = await fetch('/carte/save_carte_settings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            carte_connections: connections,
            carte_blocs: blocs
        })
    });
    const data = await response.json();
    if (data.success) {
        console.log('Settings saved successfully');
    } else {
        console.error('Error saving settings:', data.message);
    }

    send_update();
}

async function get_project_settings() {
    console.log('get_project_settings');
    const response = await fetch('/carte/get_carte_settings', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    const data = await response.json();
    if (data.success) {
        let settings_connection = data.data.settings_connection;
        let settings_bloc = data.data.settings_bloc;
        localStorage.setItem('connections', settings_connection);
        localStorage.setItem('blocs', settings_bloc);
        settings_connection_global = settings_connection;
        settings_bloc_global = settings_bloc;
        if (data.data.date_start != null){
            date_start = new Date(data.data.date_start);
        }
    } else {
        console.error('Error retrieving settings:', data.message);
    }
}

async function add_task(title, duree_theorique, pourcentage_avancemennt, materiels, description, contributeurs, id_project, link_ressources, e) {
    if (pourcentage_avancemennt > 0 && pourcentage_avancemennt < 100) {
        etat = 'In progress';
    } else if (pourcentage_avancemennt >= 100) {
        etat = 'Done';
    } else {
        etat = 'Waiting';
    }
    const response = await fetch('/carte/add_task', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            title: title,
            duree_theorique: duree_theorique,
            pourcentage_avancemennt: pourcentage_avancemennt,
            materiels: materiels,
            description: description,
            contributeurs: contributeurs,
            id_project: id_project,
            link_ressources: link_ressources,
            etat: etat
        })
    });
    const data = await response.json();
    if (data.success) {
        data.tasks.forEach(task => {
            let newB = create_tache(task.id_tache, task.title, task.duree_theorique, task.pourcentage_avancemennt, task.etat, task.description, task.contributeurs, e);
            open_menu(newB);
        });
        console.log('Task added successfully');
    } else {
        console.error('Error adding task:', data.message);
    }

}

async function delete_task(id) {
    const response = await fetch('/carte/delete_task', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            id: id,
            id_project: id_project
        })
    });
    const data = await response.json();
    if (data.success) {
        console.log('Task deleted successfully');
    } else {
        console.error('Error deleting task:', data.message);
    }

}

async function get_all_project_tasks(id_project) {
    const response = await fetch('/carte/get_all_project_tasks', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            id_project: id_project
        })
    });
    const data = await response.json();
    if (data.success) {
        data.tasks.forEach(task => {
            create_tache(task.id_tache, task.title, task.duree_theorique, task.pourcentage_avancemennt, task.etat, task.description, task.contributeurs);
        });
    } else {
        console.error('Error adding task:', data.message);
    }

}
async function get_all_project_tasks_infos(id_project) {
    const response = await fetch('/carte/get_all_project_tasks', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            id_project: id_project
        })
    });
    const data = await response.json();
    if (data.success) {
        return data.tasks;
    } else {
        console.error('Error adding task:', data.message);
    }
}

async function update_task(id, titre, temps, pourcentage, etat, description, contributeurs, link_ressources, materiels) {
    const response = await fetch('/carte/update_task', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            id: id,
            title: titre,
            duree_theorique: temps,
            pourcentage_avancemennt: pourcentage,
            etat: etat,
            description: description,
            contributeurs: contributeurs,
            link_ressources: link_ressources,
            materiels: materiels
        })
    });
    const data = await response.json();
    if (data.success) {
        console.log('Task updated successfully');
    } else {
        console.error('Error updating task:', data.message);
    }

    send_update();
}

document.addEventListener('mousedown', function (e) {

    if (e.ctrlKey && e.altKey) {
        let url_param = new URLSearchParams(window.location.search);
        let id = url_param.get('project');
        if (id) {
            // create_tache("t8", '7', 10, 31, 'En cours', 'Acheter du pain pour nourir les oiseaux', "{}",e);
            add_task('', 0, 0, '{}', '', '{}', id, '{}', e);
        }
    } else if (!e.target.closest('.div_menu')) {
        closed_menu();
    }
});
