class ShakbataGame {
    constructor() {
        this.socket = null;
        this.roomId = null;
        this.players = [];
        this.currentPlayer = null;
        this.gameState = 'waiting';
        this.currentWord = null;
        this.timer = 60;
        this.canvas = null;
        this.ctx = null;
        this.isDrawing = false;
        this.lastX = 0;
        this.lastY = 0;
        
        this.init();
    }
    
    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.connectSocket();
    }
    
    setupCanvas() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Set canvas size
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        // Set drawing styles
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
    }
    
    setupEventListeners() {
        // Landing page buttons
        document.getElementById('hostGameBtn').addEventListener('click', () => {
            this.showHostModal();
        });
        
        document.getElementById('joinGameBtn').addEventListener('click', () => {
            this.showJoinModal();
        });
        
        // Modal controls
        document.getElementById('createRoom').addEventListener('click', () => {
            this.createRoom();
        });
        
        document.getElementById('joinRoom').addEventListener('click', () => {
            this.joinRoom();
        });
        
        // Game start
        document.getElementById('startGame').addEventListener('click', () => {
            this.startGame();
        });
        
        // Ready button
        document.getElementById('readyBtn').addEventListener('click', () => {
            this.toggleReady();
        });
        
        // Chat
        document.getElementById('sendMessage').addEventListener('click', () => {
            this.sendChatMessage();
        });
        
        document.getElementById('chatInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendChatMessage();
            }
        });
        
        // Canvas drawing
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', () => this.stopDrawing());
        this.canvas.addEventListener('mouseout', () => this.stopDrawing());
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            const mouseEvent = new MouseEvent('mouseup', {});
            this.canvas.dispatchEvent(mouseEvent);
        });
        
        // Avatar system
        this.setupAvatarSystem();
    }
    
    setupAvatarSystem() {
        const emojis = ['😊', '😄', '😃', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓'];
        
        const emojiGrid = document.getElementById('emojiGrid');
        emojis.forEach(emoji => {
            const btn = document.createElement('button');
            btn.className = 'emoji-btn';
            btn.textContent = emoji;
            btn.addEventListener('click', () => {
                this.updateAvatar(emoji);
            });
            emojiGrid.appendChild(btn);
        });
    }
    
    connectSocket() {
        this.socket = io();
        
        this.socket.on('connect', () => {
            console.log('Connected to server');
        });
        
        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
        });
        
        this.socket.on('error', (data) => {
            alert(data.message);
        });
        
        this.socket.on('roomCreated', (data) => {
            this.handleRoomCreated(data);
        });
        
        this.socket.on('roomJoined', (data) => {
            this.handleRoomJoined(data);
        });
        
        this.socket.on('roomUpdated', (data) => {
            this.handleRoomUpdated(data);
        });
        
        this.socket.on('gameStarted', (data) => {
            this.handleGameStarted(data);
        });
        
        this.socket.on('turnChanged', (data) => {
            this.handleTurnChanged(data);
        });
        
        this.socket.on('wordUpdate', (data) => {
            this.handleWordUpdate(data);
        });
        
        this.socket.on('timerUpdate', (data) => {
            this.handleTimerUpdate(data);
        });
        
        this.socket.on('correctGuess', (data) => {
            this.handleCorrectGuess(data);
        });
        
        this.socket.on('wrongGuess', (data) => {
            this.handleWrongGuess(data);
        });
        
        this.socket.on('chatMessage', (data) => {
            this.handleChatMessage(data);
        });
        
        this.socket.on('draw', (data) => {
            this.handleDraw(data);
        });
        
        this.socket.on('playerReadyUpdated', (data) => {
            this.handlePlayerReadyUpdated(data);
        });
        
        this.socket.on('playerAvatarUpdated', (data) => {
            this.handlePlayerAvatarUpdated(data);
        });
    }
    
    // UI Methods
    showHostModal() {
        document.getElementById('modalTitle').textContent = 'استضافة لعبة';
        document.getElementById('roomCodeInput').style.display = 'none';
        document.getElementById('createRoom').style.display = 'block';
        document.getElementById('joinRoom').style.display = 'none';
        document.getElementById('roomModal').style.display = 'block';
    }
    
    showJoinModal() {
        document.getElementById('modalTitle').textContent = 'انضمام للعبة';
        document.getElementById('roomCodeInput').style.display = 'block';
        document.getElementById('createRoom').style.display = 'none';
        document.getElementById('joinRoom').style.display = 'block';
        document.getElementById('roomModal').style.display = 'block';
    }
    
    showGameArea() {
        document.getElementById('landingPage').style.display = 'none';
        document.getElementById('gameArea').style.display = 'grid';
        document.getElementById('readySection').style.display = 'block';
        this.updateReadyStatus();
    }
    
    hideRoomModal() {
        document.getElementById('roomModal').style.display = 'none';
    }
    
    // Game Methods
    createRoom() {
        console.log('Create room button clicked');
        const playerName = document.getElementById('playerName').value.trim();
        console.log('Player name:', playerName);
        
        if (!playerName) {
            alert('يرجى إدخال اسمك');
            return;
        }
        
        if (!this.socket) {
            alert('غير متصل بالخادم');
            return;
        }
        
        console.log('Emitting createRoom event');
        this.socket.emit('createRoom', { playerName });
        this.hideRoomModal();
    }
    
    joinRoom() {
        const playerName = document.getElementById('playerName').value.trim();
        const roomCode = document.getElementById('roomCode').value.trim();
        
        if (!playerName || !roomCode) {
            alert('يرجى إدخال اسمك وكود الغرفة');
            return;
        }
        
        this.socket.emit('joinRoom', { roomId: roomCode, playerName });
        this.hideRoomModal();
    }
    
    startGame() {
        this.socket.emit('startGame', {});
    }
    
    toggleReady() {
        console.log('Toggle ready clicked');
        this.socket.emit('playerReady');
    }
    
    sendChatMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        if (message && this.socket) {
            this.socket.emit('chatMessage', { message });
            input.value = '';
        }
    }
    
    updateAvatar(emoji) {
        if (this.socket) {
            this.socket.emit('avatarUpdate', { avatar: { expression: emoji } });
        }
    }
    
    // Drawing Methods
    startDrawing(e) {
        if (!this.isCurrentPlayer()) return;
        
        this.isDrawing = true;
        const rect = this.canvas.getBoundingClientRect();
        this.lastX = e.clientX - rect.left;
        this.lastY = e.clientY - rect.top;
    }
    
    draw(e) {
        if (!this.isDrawing || !this.isCurrentPlayer()) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;
        
        // Draw on canvas
        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
        this.ctx.lineTo(currentX, currentY);
        this.ctx.stroke();
        
        // Send drawing data to other players
        this.socket.emit('draw', {
            lastX: this.lastX,
            lastY: this.lastY,
            currentX: currentX,
            currentY: currentY,
            color: this.ctx.strokeStyle,
            size: this.ctx.lineWidth
        });
        
        this.lastX = currentX;
        this.lastY = currentY;
    }
    
    stopDrawing() {
        this.isDrawing = false;
    }
    
    handleDraw(data) {
        if (this.isCurrentPlayer()) return;
        
        this.ctx.strokeStyle = data.color;
        this.ctx.lineWidth = data.size;
        this.ctx.beginPath();
        this.ctx.moveTo(data.lastX, data.lastY);
        this.ctx.lineTo(data.currentX, data.currentY);
        this.ctx.stroke();
    }
    
    // Event Handlers
    handleRoomCreated(data) {
        console.log('Room created:', data);
        this.roomId = data.roomId;
        this.currentPlayer = data.player;
        this.showGameArea();
        this.addChatMessage('system', `تم إنشاء الغرفة: ${data.roomId}`);
    }
    
    handleRoomJoined(data) {
        this.roomId = data.roomId;
        this.currentPlayer = data.player;
        this.showGameArea();
        this.addChatMessage('system', `انضممت للغرفة: ${data.roomId}`);
    }
    
    handleRoomUpdated(data) {
        this.players = data.room.players;
        this.updatePlayersList();
        this.updateUI();
    }
    
    handleGameStarted(data) {
        this.gameState = 'playing';
        this.currentPlayer = data.currentPlayer;
        this.timer = data.timer;
        this.updateUI();
        this.addChatMessage('system', 'بدأت اللعبة!');
    }
    
    handleTurnChanged(data) {
        this.currentPlayer = data.currentPlayer;
        this.timer = data.timer;
        this.updateUI();
        this.addChatMessage('system', `دور ${data.currentPlayer.name}`);
    }
    
    handleWordUpdate(data) {
        this.currentWord = data.word;
        this.updateUI();
    }
    
    handleTimerUpdate(data) {
        this.timer = data.timer;
        this.updateUI();
    }
    
    handleCorrectGuess(data) {
        this.players = this.players.map(p => 
            p.id === data.player.id ? data.player : p
        );
        this.updatePlayersList();
        this.addChatMessage('system', `🎉 ${data.player.name} خمن الكلمة بشكل صحيح!`);
        this.showConfetti();
    }
    
    handleWrongGuess(data) {
        this.addChatMessage('player', data.guess, data.player.name);
    }
    
    handleChatMessage(data) {
        this.addChatMessage('player', data.message, data.player.name);
    }
    
    handlePlayerReadyUpdated(data) {
        this.players = data.room.players;
        this.updatePlayersList();
        this.updateReadyStatus();
        this.addChatMessage('system', `${data.player.name} ${data.player.isReady ? 'جاهز' : 'غير جاهز'}`);
    }
    
    handlePlayerAvatarUpdated(data) {
        this.players = this.players.map(p => 
            p.id === data.player.id ? data.player : p
        );
        this.updatePlayersList();
    }
    
    // UI Update Methods
    updateUI() {
        // Update current player display
        const currentPlayerDiv = document.getElementById('currentPlayer');
        if (this.currentPlayer) {
            currentPlayerDiv.textContent = `اللاعب الحالي: ${this.currentPlayer.name}`;
        } else {
            currentPlayerDiv.textContent = 'انتظار اللاعبين...';
        }
        
        // Update word display
        const wordDisplay = document.getElementById('wordDisplay');
        if (this.isCurrentPlayer() && this.currentWord) {
            wordDisplay.textContent = this.currentWord;
        } else {
            wordDisplay.textContent = 'كلمة السر';
        }
        
        // Update timer
        const timerDiv = document.getElementById('timer');
        timerDiv.textContent = this.timer;
        
        // Update start button
        this.updateStartButton();
    }
    
    updateStartButton() {
        const startBtn = document.getElementById('startGame');
        const isHost = this.currentPlayer?.isHost || false;
        const hasEnoughPlayers = this.players.length >= 2;
        const readyCount = this.players.filter(p => p.isReady).length;
        
        console.log('Start button check:', {
            isHost,
            hasEnoughPlayers,
            playersCount: this.players.length,
            readyCount,
            gameState: this.gameState
        });
        
        if (this.gameState === 'playing') {
            startBtn.textContent = 'اللعبة جارية...';
            startBtn.disabled = true;
        } else if (!isHost) {
            startBtn.textContent = 'فقط المضيف يمكنه البدء';
            startBtn.disabled = true;
        } else if (!hasEnoughPlayers) {
            startBtn.textContent = 'انتظار المزيد من اللاعبين...';
            startBtn.disabled = true;
        } else if (readyCount < this.players.length) {
            startBtn.textContent = `انتظار ${this.players.length - readyCount} لاعبين...`;
            startBtn.disabled = true;
        } else {
            startBtn.textContent = 'بدء اللعبة';
            startBtn.disabled = false;
        }
    }
    
    updateReadyStatus() {
        const readyBtn = document.getElementById('readyBtn');
        const readyStatus = document.getElementById('readyStatus');
        const currentPlayer = this.players.find(p => p.id === this.socket?.id);
        
        if (currentPlayer) {
            if (currentPlayer.isReady) {
                readyBtn.textContent = 'غير جاهز ❌';
                readyBtn.classList.add('ready');
            } else {
                readyBtn.textContent = 'أنا جاهز! ✅';
                readyBtn.classList.remove('ready');
            }
        }
        
        const readyCount = this.players.filter(p => p.isReady).length;
        readyStatus.textContent = `${readyCount}/${this.players.length} لاعبين جاهزين`;
    }
    
    updatePlayersList() {
        const playersList = document.getElementById('playersList');
        playersList.innerHTML = '';
        
        this.players.forEach(player => {
            const playerDiv = document.createElement('div');
            playerDiv.className = 'player-item';
            
            const avatar = this.createPlayerAvatar(player.avatar || { expression: '😊' });
            const readyIcon = player.isReady ? '✅' : '⏳';
            
            playerDiv.innerHTML = `
                <div style="display: flex; align-items: center;">
                    ${avatar.outerHTML}
                    <span style="margin-right: 8px;">${player.name}</span>
                    <span style="margin-right: 4px;">${readyIcon}</span>
                </div>
                <span class="player-score">${player.score}</span>
            `;
            
            playersList.appendChild(playerDiv);
        });
    }
    
    createPlayerAvatar(avatar) {
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'player-avatar';
        avatarDiv.textContent = avatar.expression || '😊';
        return avatarDiv;
    }
    
    addChatMessage(type, message, playerName = '') {
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${type}`;
        
        if (type === 'player') {
            messageDiv.innerHTML = `<strong>${playerName}:</strong> ${message}`;
        } else {
            messageDiv.innerHTML = `<em>${message}</em>`;
        }
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    showConfetti() {
        // Simple confetti effect
        const confetti = document.createElement('div');
        confetti.style.position = 'fixed';
        confetti.style.top = '0';
        confetti.style.left = '0';
        confetti.style.width = '100%';
        confetti.style.height = '100%';
        confetti.style.pointerEvents = 'none';
        confetti.style.zIndex = '9999';
        confetti.innerHTML = '🎉';
        confetti.style.fontSize = '50px';
        confetti.style.textAlign = 'center';
        confetti.style.paddingTop = '200px';
        
        document.body.appendChild(confetti);
        
        setTimeout(() => {
            document.body.removeChild(confetti);
        }, 2000);
    }
    
    // Helper Methods
    isCurrentPlayer() {
        return this.currentPlayer && this.currentPlayer.isDrawing;
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new ShakbataGame();
});