
const io = require('socket.io-client');

const socket = io('http://localhost:5000', {
    path: '/socket.io',
    transports: ['websocket']
});

socket.on('connect', () => {
    console.log('Ghost client connected:', socket.id);

    // Create a room
    socket.emit('create_room', {
        name: 'GhostUser',
        instrument: 'violao',
        noMedia: true
    }, (response) => {
        if (response.error) {
            console.error('Error creating room:', response.error);
        } else {
            console.log('Ghost Room created:', response.room.id);
            console.log('Keeping connection alive...');
        }
    });
});

socket.on('disconnect', () => {
    console.log('Ghost client disconnected');
});

// Keep process alive
setInterval(() => { }, 10000);
