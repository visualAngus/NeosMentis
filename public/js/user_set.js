async function get_all_user_info() {
    const response = await fetch('/get_all_user_info_only');
    const data = await response.json();
    if (data.success) {
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
        if (hour < 10) {
            var message = "Good morning, ";
        }
        else if (hour < 15) {
            var message = "hello, ";
        }
        else if (hour < 18) {
            var message = "Good afternoon, ";
        }
        else {
            var message = "Good evening, ";
        }
    } else {
        console.error('Error fetching users:', data.message);
    }
}
get_all_user_info();