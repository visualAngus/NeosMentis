function convert_date_into_day_name(date) {
    console.log(date);
    let dateObj = new Date(date);
    let day_name = dateObj.toLocaleString('default', { weekday: 'long' });
    day_name = day_name.slice(0, 1).toUpperCase() + day_name.slice(1,2);
    return `${day_name}`;
}

async function get_all_user_info() {
    const response = await fetch('/get_all_user_info');
    const data = await response.json();
    if (data.success) {
        console.log(data);
        document.querySelector('.div_profil_bnt').style.display = 'none';
        const div = document.createElement('div');
        div.classList.add('div_profil_name');
        let h2 = document.createElement('h2');
        h2.innerHTML = data.data.username;
        div.appendChild(h2);
        document.querySelector('.div_compte_header').appendChild(div);

        // si ont est le matin alors bonjour sinon bonsoir
        let date = new Date();
        let hour = date.getHours(); 
        console.log(hour);
        const morningMessages = [
            `Good morning, sunshine ${data.data.username} ! `, 
            `Wakey, wakey, ${data.data.username} ! `, 
            `Top of the morning to you, ${data.data.username} ! `,
            `Rise and shine, ${data.data.username} ! `,
            `Morning glory, ${data.data.username} ! `
        ];
        const helloMessages = [
            `Hey there ${data.data.username} ! `, 
            `Howdy, ${data.data.username} ! `, 
            `What's up, ${data.data.username} ! `,
            `Hi there, ${data.data.username} ! `,
        ];
        const afternoonMessages = [
            `Good afternoon, champ ${data.data.username} ! `, 
            `Hope you're crushing it, ${data.data.username} ! `, 
            `Afternoon delight, ${data.data.username} ! `,
            `Having a good day, ${data.data.username} ? `,
            `Keep up the great work, ${data.data.username} ! `
        ];
        const eveningMessages = [
            `Good evening, night owl ${data.data.username} ! `, 
            `Evening, superstar ${data.data.username} ! `, 
            `Hope you had a blast today, ${data.data.username} ! `,
            `Sweet evening, ${data.data.username} ! `
        ];

        let message;
        if (hour < 10) {
            message = morningMessages[Math.floor(Math.random() * morningMessages.length)];
        } else if (hour < 15) {
            message = helloMessages[Math.floor(Math.random() * helloMessages.length)];
        } else if (hour < 18) {
            message = afternoonMessages[Math.floor(Math.random() * afternoonMessages.length)];
        } else {
            message = eveningMessages[Math.floor(Math.random() * eveningMessages.length)];
        }

        document.querySelector('.div_titre_welcome').children[0].innerHTML = message;

        h2.addEventListener('click', () => {
            // open_profile_menu(h2);
        });

        let settings = data.settings;
        console.log(settings.home_settings);
        console.log(settings.style_settings);
        localStorage.setItem('home_settings', JSON.stringify(settings.home_settings));
        localStorage.setItem('style_settings', JSON.stringify(settings.style_settings));

        list_notif_texte.push("Bienvenue "+data.data.username);


        let events = data.events;
        let today = new Date();
        let séparator = 0;
        console.log("events.length:",events.length);
        if (events.length >10) {
            events = events.slice(0,10);
            events.push({title: "See more"});
        }
        let nb_events = 0;
        let is_for_tomorrow = 0;

        if (events.length == 0) {
            let div = document.createElement('div');
            div.classList.add('nothing_div');
            div.innerHTML = `<h3>Nothing planned for today</h3>`;
            document.querySelector('.div_events').appendChild(div);

            div = document.createElement('div');
            div.classList.add('div_separator');
            div.classList.add('tomorrow');
            document.querySelector('.div_events').appendChild(div);

            div = document.createElement('div');
            div.classList.add('nothing_div');
            div.innerHTML = `<h3>Nothing planned for tomorrow</h3>`;
            document.querySelector('.div_events').appendChild(div);

            div = document.createElement('div');
            div.classList.add('div_separator');
            div.classList.add('tomorrow');
            document.querySelector('.div_events').appendChild(div);
        }

        events.forEach(event => {
            console.log("event:",event);
            let start = convert_date_into_day_name(event.startTime);
            let end = convert_date_into_day_name(event.endTime);

            let date_start = new Date(event.startTime);

            if (date_start.getDate() != today.getDate() && nb_events == 0) {
                let div = document.createElement('div');
                div.classList.add('nothing_div');
                div.innerHTML = `<h3>Nothing planned for today</h3>`;
                document.querySelector('.div_events').appendChild(div);
            }

            // si date_start est demain
            if (date_start.getDate() == today.getDate() + 1) {
                if (séparator == 0) {
                    let div = document.createElement('div');
                    div.classList.add('div_separator');
                    div.classList.add('tomorrow');
                    document.querySelector('.div_events').appendChild(div);
                }
                séparator = 1;
                is_for_tomorrow = 1;
            }else if (date_start.getDate() != today.getDate() && date_start.getDate() != today.getDate() + 1) {
                if (is_for_tomorrow == 0){
                    let div = document.createElement('div');
                    div.classList.add('div_separator');
                    div.classList.add('tomorrow');
                    document.querySelector('.div_events').appendChild(div);

                    div = document.createElement('div');
                    div.classList.add('nothing_div');
                    div.innerHTML = `<h3>Nothing planned for tomorrow</h3>`;
                    document.querySelector('.div_events').appendChild(div);
                    is_for_tomorrow = 1;
                }
                if (séparator == 0 || séparator == 1) {
                    let div = document.createElement('div');
                    div.classList.add('div_separator');
                    div.classList.add('later');
                    document.querySelector('.div_events').appendChild(div);
                }
                séparator = 2;
            }            
            if (event.title == "See more") {
                let div = document.createElement('div');
                div.classList.add('div_see_more');
                div.innerHTML = `<h3>See more</h3>`;
                div.addEventListener('click', () => {
                    window.location.href = '/agenda';
                });
                document.querySelector('.div_events').appendChild(div);
            } else {
                let ev = createEventDiv(event.title, start, event.startTime.split("T")[1].split(":").slice(0,2).join(":"), end, event.endTime.split("T")[1].split(":").slice(0,2).join(":"),event.startTime,event.color, event.id);
                document.querySelector('.div_events').appendChild(ev);
            }
            nb_events++;
        });

        let documents = data.documents;
        documents.forEach(document__ => {
            let doc = createDocumentDiv(document__.title, "", document__.last_modified, document__.id);
            document.querySelector('.div_documents').appendChild(doc);
        });

        let projects = data.projects;
        projects.forEach(project => {
            let proj = createProjectDiv(project.title, "", project.last_modified, project.id);
            document.querySelector('.div_projects').appendChild(proj);
        });
        document.querySelector('.load_div').style.display = 'none';

        let collaborateurs = data.collaborators;
        collaborateurs.forEach(collaborateur => {
            let collab = createCollaboratorDiv(collaborateur.name, collaborateur.email, collaborateur.id);
            document.querySelector('.div_collaborators').appendChild(collab);
        });

    } else {
        console.error('Error fetching users:', data.message);
    }
}
get_all_user_info();

function createDocumentDiv(title, content, time,id) {
    const docDiv = document.createElement('div');
    docDiv.className = 'document_div';
    docDiv.id = id;

    const titleDiv = document.createElement('div');
    titleDiv.className = 'titre_doc';
    titleDiv.innerHTML = `<h3>${title}</h3>`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'div_doc';
    contentDiv.innerHTML = `<p>${content}</p>`;

    const timeContribDiv = document.createElement('div');
    timeContribDiv.className = 'div_time_and_contributor';  
    
    
    const timeP = document.createElement('p');
    timeP.id = 'time';

    let date = new Date(time);
    let actual_date = new Date();
    let diff = actual_date - date;
    setInterval(() => {
        let actual_date = new Date();
        diff = actual_date - date;

        let seconds = Math.floor(diff / 1000);
       

        if (seconds < 60) {
            diff = `${seconds} seconds ago`;
        }
        else if (seconds < 3600) {
            diff = `${Math.floor(seconds / 60)} minutes ago`;
        }
        else if (seconds < 86400) {
            diff = `${Math.floor(seconds / 3600)} hours ago`;
        }
        else if (seconds < 604800) {
            diff = `${Math.floor(seconds / 86400)} days ago`;
        }
        else if (seconds < 2592000) {
            diff = `${Math.floor(seconds / 604800)} weeks ago`;
        }
        else if (seconds < 31536000) {
            diff = `${Math.floor(seconds / 2592000)} months ago`;
        }
        else {
            diff = `${Math.floor(seconds / 31536000)} years ago`;
        }

        timeP.textContent = diff;
    }, 1000);


    timeContribDiv.appendChild(timeP);

    docDiv.appendChild(titleDiv);
    docDiv.appendChild(contentDiv);
    docDiv.appendChild(timeContribDiv);

    docDiv.addEventListener('click', () => {
        window.location.href = `/editor?id=${id}`;
    });

    return docDiv;
}

function createEventDiv(title, fromDay, fromHour, toDay, toHour,fromdate,color, id) {
    const eventDiv = document.createElement('div');
    eventDiv.className = 'event_div';
    eventDiv.id = id;

    const titleDiv = document.createElement('div');
    titleDiv.className = 'titre_event';
    titleDiv.innerHTML = `<h3>${title}</h3>`;

    const dateDiv = document.createElement('div');
    dateDiv.className = 'div_date_event';

    const fromDiv = document.createElement('div');
    fromDiv.className = 'div_from';
    fromDiv.innerHTML = `
        <p id="day">${fromDay}</p>
        <p id="hour">${fromHour}</p>
    `;

    const connDiv = document.createElement('div');
    connDiv.className = 'div_conn';
    connDiv.innerHTML = '<p> to </p>';

    const toDiv = document.createElement('div');
    toDiv.className = 'div_to';
    toDiv.innerHTML = `
        <p id="day">${toDay}</p>
        <p id="hour">${toHour}</p>
    `;

    dateDiv.appendChild(fromDiv);
    dateDiv.appendChild(connDiv);
    dateDiv.appendChild(toDiv);

    eventDiv.appendChild(titleDiv);
    eventDiv.appendChild(dateDiv);

    eventDiv.addEventListener('click', () => {
        window.location.href = `/agenda?date=${fromdate}`;
    });

    return eventDiv;
}

function createCollaboratorDiv(name, email, id) {
    const collabDiv = document.createElement('div');
    collabDiv.className = 'collaborator_div';
    collabDiv.id = id;
    collabDiv.innerHTML = name.slice(0, 2).toUpperCase();

    collabDiv.addEventListener('click', () => {
        collabDiv.style.width = '100px';
        collabDiv.style.height = '50px';
        collabDiv.style.borderRadius = '10px';

        collabDiv.innerHTML = name;

        let otherCollabs = document.querySelectorAll('.collaborator_div');
        otherCollabs.forEach(otherCollab => {
            if (otherCollab.id != id) {
                otherCollab.style.width = '50px';
                otherCollab.style.height = '50px';
                otherCollab.style.borderRadius = '50%';
                otherCollab.innerHTML = otherCollab.innerHTML.slice(0, 2).toUpperCase();
            }
        });
    });


    return collabDiv;
}



function createProjectDiv(title, content, time, id) {
    const projectDiv = document.createElement('div');
    projectDiv.className = 'project_div';
    projectDiv.id = id;

    const titleDiv = document.createElement('div');
    titleDiv.className = 'titre_doc';
    titleDiv.innerHTML = `<h3>${title}</h3>`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'div_doc';
    contentDiv.innerHTML = `<p>${content}</p>`;

    const timeContribDiv = document.createElement('div');
    timeContribDiv.className = 'div_time_and_contributor';
    
    const timeP = document.createElement('p');
    timeP.id = 'time';

    let date = new Date(time);
    let actual_date = new Date();
    let diff = actual_date - date;
    setInterval(() => {
        let actual_date = new Date();
        diff = actual_date - date;

        let seconds = Math.floor(diff / 1000);
       

        if (seconds < 60) {
            diff = `${seconds} seconds ago`;
        }
        else if (seconds < 3600) {
            diff = `${Math.floor(seconds / 60)} minutes ago`;
        }
        else if (seconds < 86400) {
            diff = `${Math.floor(seconds / 3600)} hours ago`;
        }
        else if (seconds < 604800) {
            diff = `${Math.floor(seconds / 86400)} days ago`;
        }
        else if (seconds < 2592000) {
            diff = `${Math.floor(seconds / 604800)} weeks ago`;
        }
        else if (seconds < 31536000) {
            diff = `${Math.floor(seconds / 2592000)} months ago`;
        }
        else {
            diff = `${Math.floor(seconds / 31536000)} years ago`;
        }

        timeP.textContent = diff;
    }, 1000);

    timeContribDiv.appendChild(timeP);

    projectDiv.appendChild(titleDiv);
    projectDiv.appendChild(contentDiv);
    projectDiv.appendChild(timeContribDiv);

    projectDiv.addEventListener('click', () => {
        window.location.href = `/carte?project=${id}`;
    });

    return projectDiv;
}

document.querySelector('.add_doc').addEventListener('click', create_document_base);
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
            window.location.href = `/editor?id=${data.id}`;
        } else {
            console.error('Error creating document:', data.message);
        }
    } catch (error) {
        console.error('Failed to create document:', error);
    }
}


document.querySelector('.open_agenda').addEventListener('click', open_agenda);
function open_agenda() {
    window.location.href = '/agenda';
}

document.querySelector('.add_project').addEventListener('click', new_project);
async function new_project() {
    try {
        const response = await fetch('/carte/create_project', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        if (data.success) {
            window.location.href = `/carte?project=${data.id}`;
        } else {
            console.error('Error creating project:', data.message);
        }
    } catch (error) {
        console.error('Failed to create project:', error);
    }
}