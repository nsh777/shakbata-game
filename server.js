const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Serve static files
app.use(express.static(path.join(__dirname)));

// Game state
const rooms = new Map();
const players = new Map();

// Arabic words for the game
const words = [
    'قطة', 'كلب', 'أسد', 'فيل', 'حصان', 'بقرة', 'دجاجة', 'بط', 'سمكة', 'عصفور',
    'شجرة', 'زهرة', 'وردة', 'تفاح', 'برتقال', 'موز', 'عنب', 'فراولة', 'ليمون', 'طماطم',
    'منزل', 'سيارة', 'طائرة', 'قطار', 'دراجة', 'سفينة', 'حافلة', 'شاحنة', 'دراجة نارية', 'هليكوبتر',
    'شمس', 'قمر', 'نجمة', 'سحابة', 'مطر', 'ثلج', 'رياح', 'برق', 'رعد', 'قوس قزح',
    'كتاب', 'قلم', 'ورقة', 'ممحاة', 'مقص', 'صمغ', 'مسطرة', 'حقيبة', 'مكتب', 'كرسي',
    'هاتف', 'كمبيوتر', 'تلفزيون', 'راديو', 'كاميرا', 'ساعة', 'نظارة', 'قبعة', 'حذاء', 'جورب',
    'قميص', 'بنطلون', 'فستان', 'معطف', 'قفاز', 'حزام', 'ساعة يد', 'خاتم', 'سوار', 'قلادة',
    'طعام', 'ماء', 'حليب', 'عصير', 'شاي', 'قهوة', 'خبز', 'جبن', 'لحم', 'دجاج',
    'أحمر', 'أزرق', 'أخضر', 'أصفر', 'برتقالي', 'بنفسجي', 'وردي', 'بني', 'أسود', 'أبيض'
];

// Helper function to create safe player object
function createSafePlayer(player) {
    return {
        id: player.id,
        name: player.name,
        score: player.score,
        isDrawing: player.isDrawing,
        isHost: player.isHost || false,
        isReady: player.isReady || false,
        avatar: player.avatar || { expression: '😊' }
    };
}

// Helper function to create safe room object
function createSafeRoom(room) {
    return {
        id: room.id,
        players: room.players.map(p => createSafePlayer(p)),
        gameState: room.gameState,
        currentWord: room.currentWord,
        currentPlayer: room.currentPlayer ? createSafePlayer(room.currentPlayer) : null,
        timer: room.timer,
        round: room.round || 1,
        maxRounds: room.maxRounds || 3
    };
}

// Generate random word
function getRandomWord() {
    return words[Math.floor(Math.random() * words.length)];
}

// Start game timer
function startTimer(room) {
    if (room.timerInterval) {
        clearInterval(room.timerInterval);
    }
    
    room.timerInterval = setInterval(() => {
        room.timer--;
        
        // Send timer update to all players
        io.to(room.id).emit('timerUpdate', { timer: room.timer });
        
        if (room.timer <= 0) {
            endTurn(room);
        }
    }, 1000);
}

// End current turn
function endTurn(room) {
    if (room.timerInterval) {
        clearInterval(room.timerInterval);
        room.timerInterval = null;
    }
    
    // Find next player
    const currentIndex = room.players.findIndex(p => p.id === room.currentPlayer.id);
    const nextIndex = (currentIndex + 1) % room.players.length;
    const nextPlayer = room.players[nextIndex];
    
    // Update current player
    room.players.forEach(p => p.isDrawing = false);
    nextPlayer.isDrawing = true;
    room.currentPlayer = nextPlayer;
    room.currentWord = getRandomWord();
    room.timer = room.gameTime || 60;
    
    // Notify all players
    io.to(room.id).emit('turnChanged', {
        currentPlayer: createSafePlayer(room.currentPlayer),
        timer: room.timer,
        round: room.round
    });
    
    // Send word only to current player
    const currentPlayerSocket = Array.from(io.sockets.sockets.values())
        .find(socket => socket.id === room.currentPlayer.id);
    if (currentPlayerSocket) {
        currentPlayerSocket.emit('wordUpdate', { word: room.currentWord });
    }
    
    // Start timer for new turn
    startTimer(room);
}

// Socket connection handling
io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);
    
    // Create room
    socket.on('createRoom', (data) => {
        const { playerName } = data;
        if (!playerName) {
            socket.emit('error', { message: 'يرجى إدخال اسمك' });
            return;
        }
        
        const roomId = Math.random().toString(36).substr(2, 6).toUpperCase();
        const room = {
            id: roomId,
            players: [],
            gameState: 'waiting',
            currentWord: null,
            currentPlayer: null,
            timer: 60,
            gameTime: 60,
            round: 1,
            maxRounds: 3,
            timerInterval: null
        };
        
        const player = {
            id: socket.id,
            name: playerName,
            score: 0,
            isDrawing: false,
            isHost: true,
            isReady: false,
            avatar: { expression: '😊' }
        };
        
        room.players.push(player);
        room.currentPlayer = player;
        rooms.set(roomId, room);
        players.set(socket.id, { roomId, player });
        
        socket.join(roomId);
        socket.emit('roomCreated', { roomId, player: createSafePlayer(player) });
        io.to(roomId).emit('roomUpdated', { room: createSafeRoom(room) });
        
        console.log(`Room created: ${roomId} by ${playerName}`);
    });
    
    // Join room
    socket.on('joinRoom', (data) => {
        const { roomId, playerName } = data;
        if (!roomId || !playerName) {
            socket.emit('error', { message: 'يرجى إدخال كود الغرفة واسمك' });
            return;
        }
        
        const room = rooms.get(roomId);
        if (!room) {
            socket.emit('error', { message: 'الغرفة غير موجودة' });
            return;
        }
        
        if (room.gameState === 'playing') {
            socket.emit('error', { message: 'اللعبة جارية بالفعل' });
            return;
        }
        
        if (room.players.length >= 8) {
            socket.emit('error', { message: 'الغرفة ممتلئة' });
            return;
        }
        
        const player = {
            id: socket.id,
            name: playerName,
            score: 0,
            isDrawing: false,
            isHost: false,
            isReady: false,
            avatar: { expression: '😊' }
        };
        
        room.players.push(player);
        players.set(socket.id, { roomId, player });
        socket.join(roomId);
        
        socket.emit('roomJoined', { roomId, player: createSafePlayer(player) });
        io.to(roomId).emit('roomUpdated', { room: createSafeRoom(room) });
        
        console.log(`${playerName} joined room ${roomId}`);
    });
    
    // Start game
    socket.on('startGame', (data) => {
        const playerData = players.get(socket.id);
        if (!playerData) return;
        
        const room = rooms.get(playerData.roomId);
        if (!room) return;
        
        // Check if player is host
        if (!playerData.player.isHost) {
            socket.emit('error', { message: 'فقط مضيف الغرفة يمكنه بدء اللعبة' });
            return;
        }
        
        // Check if game is already playing
        if (room.gameState === 'playing') {
            socket.emit('error', { message: 'اللعبة جارية بالفعل' });
            return;
        }
        
        // Check if enough players
        if (room.players.length < 2) {
            socket.emit('error', { message: 'يجب أن يكون هناك لاعبين على الأقل' });
            return;
        }
        
        // Check if all players are ready
        const allReady = room.players.every(p => p.isReady);
        if (!allReady) {
            socket.emit('error', { message: 'يجب أن يكون جميع اللاعبين جاهزين' });
            return;
        }
        
        // Start the game
        room.gameState = 'playing';
        room.currentPlayer = room.players[0];
        room.currentPlayer.isDrawing = true;
        room.currentWord = getRandomWord();
        room.timer = room.gameTime || 60;
        room.round = 1;
        
        // Notify all players
        io.to(room.id).emit('gameStarted', {
            currentPlayer: createSafePlayer(room.currentPlayer),
            timer: room.timer,
            round: room.round
        });
        
        // Send word only to current player
        socket.emit('wordUpdate', { word: room.currentWord });
        
        // Start timer
        startTimer(room);
        
        console.log(`Game started in room ${room.id}`);
    });
    
    // Handle ready state
    socket.on('playerReady', () => {
        const playerData = players.get(socket.id);
        if (!playerData) return;
        
        const room = rooms.get(playerData.roomId);
        if (!room) return;
        
        // Toggle ready state
        playerData.player.isReady = !playerData.player.isReady;
        
        // Notify all players
        io.to(room.id).emit('playerReadyUpdated', {
            player: createSafePlayer(playerData.player),
            room: createSafeRoom(room)
        });
        
        console.log(`${playerData.player.name} is ${playerData.player.isReady ? 'ready' : 'not ready'}`);
    });
    
    // Handle drawing
    socket.on('draw', (data) => {
        const playerData = players.get(socket.id);
        if (!playerData) return;
        
        const room = rooms.get(playerData.roomId);
        if (!room) return;
        
        // Only current player can draw
        if (playerData.player.id !== room.currentPlayer.id) return;
        
        // Broadcast drawing to other players
        socket.to(room.id).emit('draw', data);
    });
    
    // Handle guess
    socket.on('guess', (data) => {
        const playerData = players.get(socket.id);
        if (!playerData) return;
        
        const room = rooms.get(playerData.roomId);
        if (!room) return;
        
        // Don't allow current player to guess
        if (playerData.player.id === room.currentPlayer.id) return;
        
        const guess = data.guess.toLowerCase().trim();
        const correctWord = room.currentWord.toLowerCase();
        
        if (guess === correctWord) {
            // Correct guess!
            playerData.player.score += 10;
            room.currentPlayer.score += 5;
            
            // Notify all players
            io.to(room.id).emit('correctGuess', {
                player: createSafePlayer(playerData.player),
                word: room.currentWord
            });
            
            // End turn
            endTurn(room);
        } else {
            // Wrong guess
            io.to(room.id).emit('wrongGuess', {
                player: createSafePlayer(playerData.player),
                guess: data.guess
            });
        }
    });
    
    // Handle chat
    socket.on('chatMessage', (data) => {
        const playerData = players.get(socket.id);
        if (!playerData) return;
        
        const room = rooms.get(playerData.roomId);
        if (!room) return;
        
        io.to(room.id).emit('chatMessage', {
            player: createSafePlayer(playerData.player),
            message: data.message
        });
    });
    
    // Handle avatar updates
    socket.on('avatarUpdate', (data) => {
        const playerData = players.get(socket.id);
        if (!playerData) return;
        
        const room = rooms.get(playerData.roomId);
        if (!room) return;
        
        playerData.player.avatar = data.avatar;
        
        io.to(room.id).emit('playerAvatarUpdated', {
            player: createSafePlayer(playerData.player),
            room: createSafeRoom(room)
        });
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
        const playerData = players.get(socket.id);
        if (!playerData) return;
        
        const room = rooms.get(playerData.roomId);
        if (!room) return;
        
        // Remove player from room
        room.players = room.players.filter(p => p.id !== socket.id);
        
        // If no players left, delete room
        if (room.players.length === 0) {
            rooms.delete(playerData.roomId);
            console.log(`Room ${playerData.roomId} deleted (no players)`);
        } else {
            // If host left, make first player host
            if (playerData.player.isHost) {
                room.players[0].isHost = true;
            }
            
            // If current player left, move to next
            if (room.currentPlayer && room.currentPlayer.id === socket.id) {
                if (room.players.length > 0) {
                    room.currentPlayer = room.players[0];
                    room.currentPlayer.isDrawing = true;
                }
            }
            
            // Notify remaining players
            io.to(playerData.roomId).emit('roomUpdated', { room: createSafeRoom(room) });
        }
        
        players.delete(socket.id);
        console.log(`Player ${playerData.player.name} disconnected`);
    });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 شخبطة server running on 0.0.0.0:${PORT}`);
    console.log(`🎨 Visit http://localhost:${PORT} to play!`);
});