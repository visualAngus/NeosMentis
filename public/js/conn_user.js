const ws = new WebSocket('ws://88.166.208.243:80');

ws.onopen = () => {
    ws.send(JSON.stringify({
        type: 'connection_to_project',
        message: new URLSearchParams(window.location.search).get('project')
    }));
};

function send_update() {
    console.log('sending update');
    ws.send(JSON.stringify({
        type: 'update_project'
    }));
}



ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'update_project' && data.message === 'update') {
        console.log('received update');
        refresh();
    }
};