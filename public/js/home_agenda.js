[parent,add_div] = create_document_groupe("Agenda",2);


function convert_hours_to_int(hours) {
    let [hour, minute] = hours.split(":");
    return parseInt(hour) + parseInt(minute) / 60;
}

function get_only_date(date) {
    return date.split("T")[0];
}

function convert_date_into_day_nome_plus_hours(date) {
    let [day, time] = date.split("T");
    let [year, month, day_number] = day.split("-");
    let [hour, minute] = time.split(":");

    let days = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
    let months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

    let day_name = days[new Date(year, month - 1, day_number).getDay()];

    
    return `${day_name} ${day_number} à ${hour}:${minute}`;
}

function get_only_time(date) {
    return date.split("T")[1].split(":").slice(0,2).join(":");
}

function convert_hours_into_int_from_date(date) {
    let [hour, minute] = date.split(":");
    return parseInt(hour) + parseInt(minute) / 60;
}

function convert_int_to_hours(int_hour) {
    return int_hour.toString().padStart(2, '0') + ':00';
}


function add_event_to_groupe(groupe, event){
    var div = document.createElement("div");
    div.className = "event_in_groupe";

    let event_name = document.createElement("h3");
    if (event.title){
        event_name.innerHTML = event.title;
    }else{
        event_name.innerHTML = "Événement sans titre";
    }
    div.appendChild(event_name);

    let event_date_debut = document.createElement("p");
    console.log(event.date_debut);
    event_date_debut.innerHTML = "<strong>De</strong> "+convert_date_into_day_nome_plus_hours(event.startTime);
    div.appendChild(event_date_debut);

    let event_date_fin = document.createElement("p");
    event_date_fin.innerHTML = "<strong>À</strong> "+convert_date_into_day_nome_plus_hours(event.endTime);
    div.appendChild(event_date_fin);

    let event_description = document.createElement("p");
    event_description.innerHTML = "<strong>Description : </strong>"+event.description;

    if (event.description){
        div.appendChild(event_description);
    }

    div.addEventListener("click", function(){
        window.location.href = `/agenda?date=${event.startTime.split("T")[0]}`;
    });

    groupe.appendChild(div);
}


async function get_all_2_weeks_events_base(){
    let response = await fetch('/agenda/2weeks');
    let data = await response.json();
    data.events.forEach(event => {
        console.log(event);
        add_event_to_groupe(parent, event);
    });
}
get_all_2_weeks_events_base();