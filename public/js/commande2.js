function loadDocument() {

    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id')

    fetch('/documents', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            id: id
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                let titre = data.documents[0].title;
                document.querySelector('#title').value = titre;

                data.documents[0].content = decodeURIComponent(data.documents[0].content);

                if (data.documents[0].content == " ") {
                    document.querySelector('.load_div').style.display = 'none';
                    document.body.style.overflow = 'auto';
                    return;
                }
                data_json = JSON.parse(data.documents[0].content);  
                // data_json = JSON.parse(data_json);

                quill.root.innerHTML = data_json;

                // console.log('Document loaded:', data_json);
                document.querySelector('.load_div').style.display = 'none';
            } else {
                console.error('Load failed:', data.message);
            }
        })
        .catch(error => console.error('Error:', error));
}

async function save_doc(outputData) {
    let id = new URLSearchParams(window.location.search).get('id');
    let data = JSON.stringify(outputData);
    console.log(data);
    fetch('/save_document', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            data: encodeURIComponent(data),
            id: id,
            title: document.querySelector('#title').value
        })
    })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            if (data.success) {
                console.log('Document saved:', data.message);
            } else {
                console.error('Save failed:', data.message);
            }
        })
        .catch(error => console.error('Error:', error));
}