// [parent,add_div] = create_document_groupe("Collaborateur",3);

async function get_collaborator(){
    let response = await fetch('/get_all_collaborators_of_one_user');
    let data = await response.json();
    return data;
}

async function get_collaborator_recherche(input){
    let response = await fetch('/recherche_collaborators', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({search: input})
    });
    let data = await response.json();
    return data;
}

async function get_user_recherche(input){
    let response = await fetch('/rechercher_user', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({search: input})
    });
    let data = await response.json();
    return data;
}

async function have_request_collaborator(){
    let response = await fetch('/have_request_collaborator');
    let data = await response.json();
    return data;
}

async function request_add_collaborator(collaborator){
    let response = await fetch('/request_add_collaborator', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({collaborator: collaborator})
    });
    let data = await response.json();
    list_notif_texte.push(data.message);
    return data;
}

async function accept_request_collaborator(id_request){
    let response = await fetch('/accept_request_collaborator', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({id_request: id_request})
    });
    let data = await response.json();
    list_notif_texte.push(data.message);
    return data;
}

async function add_collaborator_graphique(requests_bnt, parent){
    await get_collaborator().then(data => {
        if (requests_bnt.classList.contains("active_menu")){
            return;
        }
        let div_collaborator = document.createElement("div");
        div_collaborator.className = "div_collaborators";


        data.collaborators.forEach(collaborator_data => {
            let collaborator = document.createElement("div");
            collaborator.className = "collaborator";

            if (collaborator_data.img){
                let img = document.createElement("img");
                img.src = collaborator_data.img;
                img.alt = "logo collaborateur";
                collaborator.title = collaborator_data.name;
                collaborator.title = "Collaborator " + 1;
                collaborator.appendChild(img);
            }else{
                console.log(collaborator_data.name);
                let nom = collaborator_data.name;
                collaborator.innerHTML = nom.slice(0,2);
                collaborator.title = nom;
            }

            div_collaborator.appendChild(collaborator);
        });

        parent.appendChild(div_collaborator);
    });
}
// async function transforme_groupe_to_collaborator_groupe(parent){ 
//     let bnt = parent.querySelector(".div_add");
//     bnt.remove();

//     let div_top = document.createElement("div");
//     div_top.className = "div_top";

//     let div_collaborator_recherche = document.createElement("div");
//     div_collaborator_recherche.className = "div_collaborator_recherche";

    
//     let recherche = document.createElement("input");
//     recherche.type = "text";
//     recherche.placeholder = "Rechercher un collaborateur";
//     recherche.className = "recherche_collaborator";

//     recherche.addEventListener("input", async function(){
//         if (requests_bnt.classList.contains("active_menu")){
//             return;
//         }
//         let value = recherche.value;
//         if (value == ""){
//             let div_collaborator = parent.querySelectorAll(".div_collaborators");
//             div_collaborator.forEach(collaborator => {
//                 collaborator.remove();
//             });
//             await get_collaborator().then(data => {
//                 let div_collaborator = document.createElement("div");
//                 div_collaborator.className = "div_collaborators";
        
//                 data.collaborators.forEach(collaborator_data => {
//                     let collaborator = document.createElement("div");
//                     collaborator.className = "collaborator";
        
//                     if (collaborator_data.img){
//                         let img = document.createElement("img");
//                         img.src = collaborator_data.img;
//                         img.alt = "logo collaborateur";
//                         collaborator.title = collaborator_data.name;
//                         collaborator.title = "Collaborator " + 1;
//                         collaborator.appendChild(img);
//                     }else{
//                         console.log(collaborator_data.name);
//                         let nom = collaborator_data.name;
//                         collaborator.innerHTML = nom.slice(0,2);
//                         collaborator.title = nom;
//                     }
        
//                     div_collaborator.appendChild(collaborator);
//                 });
//                 parent.appendChild(div_collaborator);
        
//             });
//         }else{
//             let div_collaborator = parent.querySelectorAll(".div_collaborators");
//             div_collaborator.forEach(collaborator => {
//                 collaborator.remove();
//             });
//             div_collaborator = document.createElement("div");
//             div_collaborator.className = "div_collaborators";

//             await get_user_recherche(value).then(data => {
//                 data.users.forEach(collaborator_data => {
//                     let collaborator = document.createElement("div");
//                     collaborator.className = "collaborator";
//                     collaborator.setAttribute("data-clicked", "false");
        
//                     if (collaborator_data.img){
//                         let img = document.createElement("img");
//                         img.src = collaborator_data.img;
//                         img.alt = "logo collaborateur";
//                         collaborator.title = collaborator_data.name;
//                         collaborator.title = "Collaborator " + 1;
//                         collaborator.appendChild(img);
//                     }else{
//                         console.log(collaborator_data.name);
//                         let nom = collaborator_data.name;
//                         collaborator.innerHTML = nom.slice(0,2);
//                         collaborator.title = nom;
//                     }

//                     collaborator.addEventListener("click", async function(){

//                         if (collaborator.getAttribute("data-clicked") == "false"){
//                             console.log("clidfsdfsdfck");
//                             collaborator.innerHTML = "";
//                             let div_plus  = document.createElement("div");
//                             div_plus.className = "div_plus";
//                             div_plus.innerHTML = "+";
//                             collaborator.appendChild(div_plus);
//                             div_plus.style.opacity = "1";

//                             collaborator.setAttribute("data-clicked", "true");
//                         }else{
//                             await request_add_collaborator(collaborator_data.id).then(data => {
//                                 console.log(data);
//                                 recherche.value = "";
//                                 recherche.dispatchEvent(new Event('input'));
//                             });
//                         }
//                     });
        
//                     div_collaborator.appendChild(collaborator);
//                 });
//                 parent.appendChild(div_collaborator);
//             });
//         }

//     });

//     let switch_collaborator_request = document.createElement("div");
//     switch_collaborator_request.className = "switch_collaborator_request";

//     let collaborator_bnt = document.createElement("div");
//     collaborator_bnt.className = "collaborator_bnt";
//     collaborator_bnt.classList.add("active_menu");
//     collaborator_bnt.innerHTML = "Collaborateurs";
//     switch_collaborator_request.appendChild(collaborator_bnt);

//     let requests_bnt = document.createElement("div");
//     requests_bnt.className = "requests_bnt";
//     requests_bnt.innerHTML = "Demandes";
//     switch_collaborator_request.appendChild(requests_bnt);


//     collaborator_bnt.addEventListener("click", function(){
//         collaborator_bnt.classList.add("active_menu");
//         requests_bnt.classList.remove("active_menu");
//         let div_collaborator = parent.querySelectorAll(".div_collaborators");
//         div_collaborator.forEach(collaborator => {
//             collaborator.remove();
//         });
//         add_collaborator_graphique(requests_bnt, parent);
//     });

//     requests_bnt.addEventListener("click", async function(){
//         requests_bnt.classList.add("active_menu");
//         collaborator_bnt.classList.remove("active_menu");

//         let div_collaborator = parent.querySelectorAll(".div_collaborators");
//         div_collaborator.forEach(collaborator => {
//             collaborator.remove();
//         });
//         await have_request_collaborator().then(data => {
//             let div_collaborator = document.createElement("div");
//             div_collaborator.className = "div_collaborators";

//             data.requests.forEach(collaborator_data => {
//                 let collaborator = document.createElement("div");
//                 collaborator.className = "collaborator";
//                 collaborator.setAttribute("data-clicked", "false");
    
//                 if (collaborator_data.img){
//                     let img = document.createElement("img");
//                     img.src = collaborator_data.img;
//                     img.alt = "logo collaborateur";
//                     collaborator.title = collaborator_data.name;
//                     collaborator.title = "Collaborator " + 1;
//                     collaborator.appendChild(img);
//                 }else{
//                     console.log(collaborator_data.name);
//                     let nom = collaborator_data.name;
//                     collaborator.innerHTML = nom.slice(0,2);
//                     collaborator.title = nom;
//                 }

//                 collaborator.addEventListener("click", async function(){
//                     if (collaborator.getAttribute("data-clicked") == "false"){
//                         console.log("clidfsdfsdfck");
//                         collaborator.innerHTML = "";
//                         let div_plus  = document.createElement("div");
//                         div_plus.className = "div_plus";
//                         div_plus.innerHTML = "+";
//                         collaborator.appendChild(div_plus);
//                         div_plus.style.opacity = "1";

//                         collaborator.setAttribute("data-clicked", "true");
//                     }else{
//                         console.log("click");
//                         await accept_request_collaborator(collaborator_data.id_request).then(data => {
//                             collaborator_bnt.dispatchEvent(new Event('click'));
//                         });
//                     }
//                 });
    
//                 div_collaborator.appendChild(collaborator);
//             });
//             parent.appendChild(div_collaborator);
//         });
//     });


//     let bnt_recherche = document.createElement("button");
//     bnt_recherche.className = "bnt_recherche_collaborator";

//     let p = document.createElement("p");
//     p.innerHTML = "↺";
//     bnt_recherche.appendChild(p);

//     bnt_recherche.addEventListener("click", async function(){
//         console.log("click");
//         p.style.transition = "all var(--transition)";
//         p.style.transform = "rotate(-360deg)";

//         setTimeout(function(){
//             p.style.transition = "0s";
//             p.style.transform = "rotate(0deg)";
//         }, 200);
//     });


//     div_collaborator_recherche.appendChild(recherche);
//     div_collaborator_recherche.appendChild(bnt_recherche);
//     div_top.appendChild(div_collaborator_recherche);
//     parent.appendChild(div_top);
//     parent.appendChild(switch_collaborator_request);

    
//     add_collaborator_graphique(requests_bnt, parent);

//     await have_request_collaborator().then(data => {
//         console.log("fqssdfsdfsdfsdfsdfsdf");
//         if (data.requests.length == 0){
//             return;
//         }
//         list_notif_texte.push("Vous avez "+data.requests.length+" demande"+(data.requests.length > 1 ? "s" : "")+" de collaborateur"+(data.requests.length > 1 ? "s" : ""));
//     });

// }

// transforme_groupe_to_collaborator_groupe(parent);

async function add_contributor_to_task(id_task, id_collaborator) {
    let response = await fetch('/carte/add_contributor_to_task', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
            id_task: id_task, 
            id_collaborator: id_collaborator ,
            id_project: id_project
        })
    });
    send_update();
    return await response.json();
}


async function get_collaborator_by_task(id_task){
    let response = await fetch('/carte/get_collaborator_by_task', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
            id_task: id_task
        })
    });
    return await response.json();
}