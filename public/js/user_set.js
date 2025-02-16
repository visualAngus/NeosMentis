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
        let div_stt_profil = document.createElement('div');
        div.addEventListener('click', () => {
            console.log('click');
            div_stt_profil.classList.add('div_stt_profil');

            let div_profil = document.createElement('div');
            div_profil.classList.add('div_profil');
            div_profil.innerHTML = `<h3>Profil</h3>`;
            div_profil.addEventListener('click', () => {
                window.location.href = '/profil';
            });
            div_stt_profil.appendChild(div_profil);

            let div_settings = document.createElement('div');
            div_settings.classList.add('div_settings');
            div_settings.innerHTML = `<h3>Settings</h3>`;
            div_settings.addEventListener('click', () => {
                window.location.href = '/settings';
            });
            div_stt_profil.appendChild(div_settings);

            let div_logout = document.createElement('div');
            div_logout.classList.add('div_logout');
            div_logout.innerHTML = `<h3>Logout</h3>`;
            div_logout.addEventListener('click', () => {
                window.location.href = '/logout';
            });
            div_stt_profil.appendChild(div_logout);

            document.querySelector('header').appendChild(div_stt_profil);
        });
        document.addEventListener('click', (event) => {
            if (!div_stt_profil.contains(event.target) && !h2.contains(event.target) && !div.contains(event.target)) {
                console.log('clickout');
                div_stt_profil.remove();
            }
        });
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