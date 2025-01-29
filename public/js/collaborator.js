[parent,add_div] = create_document_groupe("Collaborateur",3);

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
    let response = await fetch('/recher_user', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({search: input})
    });
    let data = await response.json();
    return data;
}

async function add_collaborator(collaborator){
    let response = await fetch('/add_collaborator', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({collaborator: collaborator})
    });
    let data = await response.json();
    return data;
}

async function transforme_groupe_to_collaborator_groupe(parent){
    let bnt = parent.querySelector(".div_add");
    bnt.remove();

    let div_top = document.createElement("div");
    div_top.className = "div_top";

    let div_collaborator_recherche = document.createElement("div");
    div_collaborator_recherche.className = "div_collaborator_recherche";

    
    let recherche = document.createElement("input");
    recherche.type = "text";
    recherche.placeholder = "Rechercher un collaborateur";
    recherche.className = "recherche_collaborator";

    recherche.addEventListener("input", async function(){
        let value = recherche.value;
        if (value == ""){
            let div_collaborator = parent.querySelectorAll(".div_collaborators");
            div_collaborator.forEach(collaborator => {
                collaborator.remove();
            });
            await get_collaborator().then(data => {
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
        }else{
            let div_collaborator = parent.querySelectorAll(".div_collaborators");
            div_collaborator.forEach(collaborator => {
                collaborator.remove();
            });
            div_collaborator = document.createElement("div");
            div_collaborator.className = "div_collaborators";

            await get_user_recherche(value).then(data => {
                data.users.forEach(collaborator_data => {
                    let collaborator = document.createElement("div");
                    collaborator.className = "collaborator";
                    collaborator.setAttribute("data-clicked", "false");
        
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

                    collaborator.addEventListener("click", async function(){

                        if (collaborator.getAttribute("data-clicked") == "false"){
                            console.log("clidfsdfsdfck");
                            collaborator.innerHTML = "";
                            let div_plus  = document.createElement("div");
                            div_plus.className = "div_plus";
                            div_plus.innerHTML = "+";
                            collaborator.appendChild(div_plus);
                            div_plus.style.opacity = "1";

                            collaborator.setAttribute("data-clicked", "true");
                        }else{
                            await add_collaborator(collaborator_data.id).then(data => {
                                console.log(data);
                                recherche.value = "";
                                recherche.dispatchEvent(new Event('input'));
                            });
                        }
                    });
        
                    div_collaborator.appendChild(collaborator);
                });
                parent.appendChild(div_collaborator);
            });
        }

    });

    let bnt_recherche = document.createElement("button");
    bnt_recherche.className = "bnt_recherche_collaborator";

    let p = document.createElement("p");
    p.innerHTML = "↺";
    bnt_recherche.appendChild(p);

    bnt_recherche.addEventListener("click", async function(){
        console.log("click");
        p.style.transition = "all var(--transition)";
        p.style.transform = "rotate(-360deg)";

        setTimeout(function(){
            p.style.transition = "0s";
            p.style.transform = "rotate(0deg)";
        }, 200);
    });


    await get_collaborator().then(data => {
        div_collaborator_recherche.appendChild(recherche);
        div_collaborator_recherche.appendChild(bnt_recherche);
        div_top.appendChild(div_collaborator_recherche);
        parent.appendChild(div_top);


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

transforme_groupe_to_collaborator_groupe(parent);