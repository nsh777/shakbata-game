const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: process.env.NODE_ENV === 'production' 
            ? [process.env.FRONTEND_URL || "https://your-app.railway.app"] 
            : "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.static(path.join(__dirname)));

// Game state
const rooms = new Map();
const players = new Map();

// Arabic words database
const arabicWords = [
    // Animals
    'قطة', 'كلب', 'أسد', 'فيل', 'حصان', 'بقرة', 'دجاجة', 'عصفور', 'سمكة', 'أرنب',
    'جمل', 'نمر', 'ذئب', 'دب', 'قرد', 'زرافة', 'فراشة', 'نحلة', 'عنكبوت', 'ثعبان',
    
    // Food
    'تفاح', 'موز', 'برتقال', 'عنب', 'فراولة', 'خبز', 'جبن', 'حليب', 'عسل', 'شاي',
    'قهوة', 'ماء', 'عصير', 'بيتزا', 'برجر', 'شاورما', 'كبسة', 'منسف', 'فتة', 'حمص',
    
    // Objects
    'كتاب', 'قلم', 'ورقة', 'مقص', 'مفتاح', 'ساعة', 'هاتف', 'كمبيوتر', 'تلفزيون', 'راديو',
    'سيارة', 'طائرة', 'قطار', 'دراجة', 'منزل', 'باب', 'نافذة', 'كرسي', 'طاولة', 'سرير',
    
    // Nature
    'شجرة', 'وردة', 'ورقة', 'جبل', 'بحر', 'نهر', 'صحراء', 'غابة', 'سماء', 'قمر',
    'شمس', 'نجمة', 'سحابة', 'مطر', 'ثلج', 'رياح', 'رمل', 'صخر', 'عشب', 'زهرة',
    
    // Saudi Culture
    'كعكة', 'تمر', 'قهوة عربية', 'شاي سعودي', 'عقال', 'شماغ', 'عباية', 'ثوب', 'خنجر', 'سيف',
    'نخلة', 'رمال', 'كثبان', 'واحة', 'قلعة', 'مسجد', 'مئذنة', 'قبة', 'سوق', 'حارة',
    
    // Professions
    'طبيب', 'معلم', 'مهندس', 'محاسب', 'محامي', 'شرطي', 'مطرب', 'فنان', 'كاتب', 'صحفي',
    'طباخ', 'سائق', 'بائع', 'خياط', 'نجار', 'حداد', 'كهربائي', 'سباك', 'مزارع', 'راعي',
    
    // Sports
    'كرة قدم', 'كرة سلة', 'كرة طائرة', 'تنس', 'سباحة', 'ركض', 'قفز', 'رمي', 'مصارعة', 'ملاكمة',
    'فروسية', 'رماية', 'تسلق', 'غوص', 'تزلج', 'تزلج على الجليد', 'ركوب الدراجة', 'مشي', 'رقص', 'جمباز',
    
    // Colors
    'أحمر', 'أزرق', 'أخضر', 'أصفر', 'برتقالي', 'بنفسجي', 'وردي', 'بني', 'أسود', 'أبيض',
    'رمادي', 'ذهبي', 'فضي', 'أزرق فاتح', 'أخضر فاتح', 'أحمر فاتح', 'أصفر فاتح', 'برتقالي فاتح', 'بنفسجي فاتح', 'وردي فاتح'
];

// Helper function to create safe player object
function createSafePlayer(player) {
    return {
        id: player.id,
        name: player.name,
        score: player.score,
        isDrawing: player.isDrawing,
        isHost: player.isHost || false,
        avatar: {
            expression: player.avatar?.expression || '😊'
        }
    };
}

// Helper function to create safe room object
function createSafeRoom(room) {
    return {
        id: room.id,
        players: room.players.map(p => ({
            id: p.id,
            name: p.name,
            score: p.score,
            isDrawing: p.isDrawing,
            isHost: p.isHost || false,
            avatar: {
                expression: p.avatar?.expression || '😊'
            }
        })),
        gameState: room.gameState,
        currentWord: room.currentWord,
        timer: room.timer
    };
}

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    // Handle room creation
    socket.on('createRoom', (data) => {
        const { playerName } = data;
        const roomId = generateRoomCode();
        
        // Create new room
        const room = {
            id: roomId,
            players: [],
            gameState: 'waiting',
            currentPlayer: null,
            currentWord: '',
            timer: 60,
            round: 0,
            maxRounds: 3,
            timerInterval: null
        };
        
        rooms.set(roomId, room);
        
        // Add player to room
        const player = {
            id: socket.id,
            name: playerName,
            score: 0,
            isDrawing: false,
            isHost: true, // Mark the creator as host
            avatar: {
                expression: '😊'
            }
        };
        
        room.players.push(player);
        room.currentPlayer = player;
        player.isDrawing = true;
        
        players.set(socket.id, { roomId, player });
        
        socket.join(roomId);
        socket.emit('roomCreated', { roomId, player: createSafePlayer(player) });
        socket.emit('roomJoined', { 
            room: createSafeRoom(room), 
            player: createSafePlayer(player) 
        });
        
        console.log(`Room created: ${roomId} by ${playerName}`);
    });
    
    // Handle joining room
    socket.on('joinRoom', (data) => {
        const { playerName, roomCode } = data;
        const room = rooms.get(roomCode);
        
        if (!room) {
            socket.emit('error', { message: 'الغرفة غير موجودة' });
            return;
        }
        
        if (room.players.length >= 8) {
            socket.emit('error', { message: 'الغرفة ممتلئة' });
            return;
        }
        
        // Add player to room
        const player = {
            id: socket.id,
            name: playerName,
            score: 0,
            isDrawing: false,
            isHost: false, // Joining players are not hosts
            avatar: {
                expression: '😊'
            }
        };
        
        room.players.push(player);
        players.set(socket.id, { roomId: roomCode, player });
        
        socket.join(roomCode);
        socket.emit('roomJoined', { 
            room: createSafeRoom(room), 
            player: createSafePlayer(player) 
        });
        
        // Notify all players in room
        io.to(roomCode).emit('playerJoined', { 
            player: createSafePlayer(player), 
            room: createSafeRoom(room) 
        });
        
        console.log(`${playerName} joined room ${roomCode}`);
    });
    
    // Handle starting game
    socket.on('startGame', () => {
        const playerData = players.get(socket.id);
        if (!playerData) return;
        
        const room = rooms.get(playerData.roomId);
        if (!room || room.players.length < 2) return;
        
        // Only the host can start the game
        if (!playerData.player.isHost) {
            socket.emit('error', { message: 'فقط مضيف الغرفة يمكنه بدء اللعبة' });
            return;
        }
        
        // Set the first player as current player if not set
        if (!room.currentPlayer && room.players.length > 0) {
            room.currentPlayer = room.players[0];
            room.currentPlayer.isDrawing = true;
        }
        
        room.gameState = 'playing';
        room.currentWord = getRandomWord();
        room.timer = 60;
        
        // Start timer
        room.timerInterval = setInterval(() => {
            room.timer--;
            io.to(room.id).emit('timerUpdate', { timer: room.timer });
            
            if (room.timer <= 0) {
                endTurn(room);
            }
        }, 1000);
        
        io.to(room.id).emit('gameStarted', { 
            currentWord: room.currentWord,
            currentPlayer: {
                id: room.currentPlayer.id,
                name: room.currentPlayer.name,
                score: room.currentPlayer.score,
                isDrawing: room.currentPlayer.isDrawing,
                isHost: room.currentPlayer.isHost,
                avatar: {
                    expression: room.currentPlayer.avatar?.expression || '😊'
                }
            },
            timer: room.timer
        });
        
        console.log(`Game started in room ${room.id} with ${room.players.length} players`);
        console.log(`Current player: ${room.currentPlayer ? room.currentPlayer.name : 'None'}`);
    });
    
    // Handle drawing data
    socket.on('drawing', (data) => {
        const playerData = players.get(socket.id);
        if (!playerData) return;
        
        const room = rooms.get(playerData.roomId);
        if (!room || !playerData.player.isDrawing) return;
        
        // Broadcast drawing data to other players
        socket.to(room.id).emit('drawing', data);
    });
    
    // Handle guess submission
    socket.on('guess', (data) => {
        const playerData = players.get(socket.id);
        if (!playerData) return;
        
        const room = rooms.get(playerData.roomId);
        if (!room || playerData.player.isDrawing) return;
        
        const { guess } = data;
        
        if (guess.toLowerCase() === room.currentWord.toLowerCase()) {
            // Correct guess
            playerData.player.score += 10;
            room.currentPlayer.score += 5; // Bonus for the drawer
            
            io.to(room.id).emit('correctGuess', {
                player: createSafePlayer(playerData.player),
                word: room.currentWord
            });
            
            endTurn(room);
        } else {
            // Wrong guess
            io.to(room.id).emit('wrongGuess', {
                player: createSafePlayer(playerData.player),
                guess: guess
            });
        }
    });
    
    // Handle chat messages
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
        
        // Update player avatar
        playerData.player.avatar = data.avatar;
        
        // Notify all players in room
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
        players.delete(socket.id);
        
        if (room.players.length === 0) {
            // Delete empty room
            if (room.timerInterval) {
                clearInterval(room.timerInterval);
            }
            rooms.delete(playerData.roomId);
        } else {
            // Notify remaining players
            io.to(playerData.roomId).emit('playerLeft', {
                player: createSafePlayer(playerData.player),
                room: createSafeRoom(room)
            });
        }
        
        console.log(`Player ${playerData.player.name} disconnected from room ${playerData.roomId}`);
    });
});

// Helper functions
function generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function getRandomWord() {
    return arabicWords[Math.floor(Math.random() * arabicWords.length)];
}

function endTurn(room) {
    if (room.timerInterval) {
        clearInterval(room.timerInterval);
    }
    
    // Move to next player
    const currentIndex = room.players.findIndex(p => p.id === room.currentPlayer.id);
    const nextIndex = (currentIndex + 1) % room.players.length;
    
    room.currentPlayer.isDrawing = false;
    room.currentPlayer = room.players[nextIndex];
    room.currentPlayer.isDrawing = true;
    
    room.currentWord = getRandomWord();
    room.timer = 60;
    
    // Start new timer
    room.timerInterval = setInterval(() => {
        room.timer--;
        io.to(room.id).emit('timerUpdate', { timer: room.timer });
        
        if (room.timer <= 0) {
            endTurn(room);
        }
    }, 1000);
    
    io.to(room.id).emit('turnChanged', {
        currentPlayer: {
            id: room.currentPlayer.id,
            name: room.currentPlayer.name,
            score: room.currentPlayer.score,
            isDrawing: room.currentPlayer.isDrawing,
            isHost: room.currentPlayer.isHost,
            avatar: {
                expression: room.currentPlayer.avatar?.expression || '😊'
            }
        },
        currentWord: room.currentWord,
        timer: room.timer
    });
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
    console.log(`🚀 شخبطة server running on ${HOST}:${PORT}`);
    if (process.env.NODE_ENV !== 'production') {
        console.log(`🎨 Visit http://localhost:${PORT} to play!`);
    }
});