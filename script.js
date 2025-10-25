// شخبطة Game
class ShakbataGame {
    constructor() {
        this.canvas = document.getElementById('drawingCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.socket = null;
        this.isDrawing = false;
        this.currentTool = 'brush';
        this.currentColor = '#000000';
        this.brushSize = 5;
        this.gameState = 'waiting'; // waiting, playing, finished
        this.currentPlayer = null;
        this.players = [];
        this.currentWord = '';
        this.timer = 60;
        this.timerInterval = null;
        this.sounds = {};
        this.avatar = {
            expression: '😊'
        };
        this.initializeSounds();
        
        // Arabic words database
        this.arabicWords = [
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
        
        this.init();
    }
    
    initializeSounds() {
        // Create audio context for sound effects
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API not supported');
        }
    }
    
    playSound(frequency, duration, type = 'sine') {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    playSuccessSound() {
        // Play a success melody
        this.playSound(523, 0.1); // C5
        setTimeout(() => this.playSound(659, 0.1), 100); // E5
        setTimeout(() => this.playSound(784, 0.2), 200); // G5
    }
    
    playErrorSound() {
        // Play an error sound
        this.playSound(200, 0.3, 'sawtooth');
    }
    
    playTimerSound() {
        // Play a timer tick
        this.playSound(800, 0.05);
    }
    
    playDrawingSound() {
        // Play a subtle drawing sound
        this.playSound(400, 0.02, 'sawtooth');
    }
    
    showConfetti() {
        // Create confetti animation
        const confetti = document.createElement('div');
        confetti.style.position = 'fixed';
        confetti.style.top = '0';
        confetti.style.left = '0';
        confetti.style.width = '100%';
        confetti.style.height = '100%';
        confetti.style.pointerEvents = 'none';
        confetti.style.zIndex = '9999';
        
        // Create confetti particles
        for (let i = 0; i < 50; i++) {
            const particle = document.createElement('div');
            particle.style.position = 'absolute';
            particle.style.width = '10px';
            particle.style.height = '10px';
            particle.style.backgroundColor = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'][Math.floor(Math.random() * 6)];
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = '-10px';
            particle.style.borderRadius = '50%';
            particle.style.animation = `confetti-fall ${Math.random() * 3 + 2}s linear forwards`;
            confetti.appendChild(particle);
        }
        
        document.body.appendChild(confetti);
        
        // Remove confetti after animation
        setTimeout(() => {
            document.body.removeChild(confetti);
        }, 5000);
    }
    
    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.setupDrawing();
        this.updateUI();
    }
    
    setupCanvas() {
        // Set canvas size
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        // Set default drawing properties
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.strokeStyle = this.currentColor;
        this.ctx.lineWidth = this.brushSize;
        
        // Fill canvas with white background
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    setupEventListeners() {
        // Tool buttons
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectTool(e.target.dataset.tool);
            });
        });
        
        // Color buttons
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectColor(e.target.dataset.color);
            });
        });
        
        // Brush size
        const brushSizeSlider = document.getElementById('brushSize');
        brushSizeSlider.addEventListener('input', (e) => {
            this.brushSize = parseInt(e.target.value);
            document.getElementById('brushSizeValue').textContent = this.brushSize;
            this.ctx.lineWidth = this.brushSize;
        });
        
        // Landing page controls
        document.getElementById('hostGameBtn').addEventListener('click', () => {
            this.showHostModal();
        });
        
        document.getElementById('joinGameBtn').addEventListener('click', () => {
            this.showJoinModal();
        });
        
        // Game controls
        document.getElementById('createRoom').addEventListener('click', () => {
            this.showRoomModal();
        });
        
        document.getElementById('joinRoom').addEventListener('click', () => {
            this.showRoomModal();
        });
        
        document.getElementById('startGame').addEventListener('click', () => {
            this.startGame();
        });
        
        // Modal controls
        document.getElementById('joinRoomBtn').addEventListener('click', () => {
            this.joinRoom();
        });
        
        document.getElementById('createRoomBtn').addEventListener('click', () => {
            this.createRoom();
        });
        
        document.getElementById('closeModal').addEventListener('click', () => {
            this.hideRoomModal();
        });
        
        // Chat
        document.getElementById('sendMessage').addEventListener('click', () => {
            this.sendMessage();
        });
        
        document.getElementById('chatInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });
        
        // Guess input
        document.getElementById('submitGuess').addEventListener('click', () => {
            this.submitGuess();
        });
        
        document.getElementById('guessInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.submitGuess();
            }
        });
        
        // Avatar customization
        this.setupAvatarCustomization();
    }
    
    setupDrawing() {
        // Mouse events
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
    }
    
    startDrawing(e) {
        if (this.gameState !== 'playing' || !this.isCurrentPlayer()) return;
        
        this.isDrawing = true;
        this.ctx.beginPath();
        this.ctx.moveTo(e.offsetX, e.offsetY);
    }
    
    draw(e) {
        if (!this.isDrawing || this.gameState !== 'playing' || !this.isCurrentPlayer()) return;
        
        this.ctx.lineTo(e.offsetX, e.offsetY);
        this.ctx.stroke();
        
        // Play drawing sound occasionally
        if (Math.random() < 0.1) {
            this.playDrawingSound();
        }
        
        // Send drawing data to other players
        if (this.socket) {
            this.socket.emit('drawing', {
                x: e.offsetX,
                y: e.offsetY,
                color: this.currentColor,
                size: this.brushSize,
                tool: this.currentTool
            });
        }
    }
    
    stopDrawing() {
        this.isDrawing = false;
    }
    
    selectTool(tool) {
        this.currentTool = tool;
        
        // Update active tool button
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tool="${tool}"]`).classList.add('active');
        
        // Update cursor
        if (tool === 'eraser') {
            this.canvas.style.cursor = 'grab';
            this.ctx.globalCompositeOperation = 'destination-out';
        } else {
            this.canvas.style.cursor = 'crosshair';
            this.ctx.globalCompositeOperation = 'source-over';
        }
        
        // Handle clear tool
        if (tool === 'clear') {
            this.clearCanvas();
        }
    }
    
    selectColor(color) {
        this.currentColor = color;
        
        // Update active color button
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-color="${color}"]`).classList.add('active');
        
        this.ctx.strokeStyle = color;
    }
    
    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    showHostModal() {
        // Initialize socket connection first
        this.initSocket();
        
        // Show modal for host
        document.getElementById('roomModal').style.display = 'block';
        document.getElementById('createRoomBtn').style.display = 'block';
        document.getElementById('joinRoomBtn').style.display = 'none';
        
        // Hide room code input for hosting
        document.getElementById('roomCodeInput').style.display = 'none';
        
        // Change modal title
        document.getElementById('modalTitle').textContent = 'إنشاء غرفة جديدة';
    }
    
    showJoinModal() {
        // Initialize socket connection first
        this.initSocket();
        
        // Show modal for join
        document.getElementById('roomModal').style.display = 'block';
        document.getElementById('createRoomBtn').style.display = 'none';
        document.getElementById('joinRoomBtn').style.display = 'block';
        
        // Show room code input for joining
        document.getElementById('roomCodeInput').style.display = 'block';
        
        // Change modal title
        document.getElementById('modalTitle').textContent = 'انضمام للغرفة';
    }
    
    showRoomModal() {
        document.getElementById('roomModal').style.display = 'block';
    }
    
    hideRoomModal() {
        document.getElementById('roomModal').style.display = 'none';
    }
    
    showGameArea() {
        document.getElementById('landingPage').style.display = 'none';
        document.getElementById('gameArea').style.display = 'grid';
    }
    
    createRoom() {
        const playerName = document.getElementById('playerName').value.trim();
        if (!playerName) {
            alert('يرجى إدخال اسمك');
            return;
        }
        
        // Initialize socket connection
        this.initSocket();
        
        // Create room without room code
        this.socket.emit('createRoom', { playerName });
        
        this.hideRoomModal();
    }
    
    joinRoom() {
        const roomCode = document.getElementById('roomCode').value.trim().toUpperCase();
        const playerName = document.getElementById('playerName').value.trim();
        
        if (!roomCode || !playerName) {
            alert('يرجى إدخال كود الغرفة واسمك');
            return;
        }
        
        // Initialize socket connection
        this.initSocket();
        
        // Join room
        this.socket.emit('joinRoom', { playerName, roomCode });
        
        this.hideRoomModal();
    }
    
    initSocket() {
        // Connect to Socket.io server
        this.socket = io();
        
        // Socket event listeners
        this.socket.on('roomCreated', (data) => {
            this.handleRoomCreated(data);
        });
        
        this.socket.on('roomJoined', (data) => {
            this.handleRoomJoined(data);
        });
        
        this.socket.on('playerJoined', (data) => {
            this.handlePlayerJoined(data);
        });
        
        this.socket.on('playerLeft', (data) => {
            this.handlePlayerLeft(data);
        });
        
        this.socket.on('gameStarted', (data) => {
            this.handleGameStarted(data);
        });
        
        this.socket.on('turnChanged', (data) => {
            this.handleTurnChanged(data);
        });
        
        this.socket.on('drawing', (data) => {
            this.handleDrawing(data);
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
        
        this.socket.on('timerUpdate', (data) => {
            this.handleTimerUpdate(data);
        });
        
        this.socket.on('error', (data) => {
            alert(data.message);
        });
        
        this.socket.on('playerAvatarUpdated', (data) => {
            this.handlePlayerAvatarUpdated(data);
        });
    }
    
    // Socket event handlers
    handleRoomCreated(data) {
        this.roomId = data.roomId;
        this.currentPlayer = data.player;
        this.addPlayer(data.player.name, 0, true);
        this.addChatMessage('system', `تم إنشاء الغرفة: ${data.roomId}`);
        this.addChatMessage('system', `شارك هذا الكود مع أصدقائك: ${data.roomId}`);
        this.showGameArea();
    }
    
    handleRoomJoined(data) {
        this.roomId = data.room.id;
        this.currentPlayer = data.player;
        this.players = data.room.players;
        this.updatePlayersList();
        this.addChatMessage('system', `انضممت للغرفة: ${data.roomId}`);
        this.showGameArea();
    }
    
    handlePlayerJoined(data) {
        this.players = data.room.players;
        this.updatePlayersList();
        this.addChatMessage('system', `${data.player.name} انضم للغرفة`);
    }
    
    handlePlayerLeft(data) {
        this.players = data.room.players;
        this.updatePlayersList();
        this.addChatMessage('system', `${data.player.name} غادر الغرفة`);
    }
    
    handleGameStarted(data) {
        console.log('Game started! Data:', data);
        this.gameState = 'playing';
        this.currentWord = data.currentWord;
        this.timer = data.timer;
        this.updateUI();
        this.addChatMessage('system', 'بدأت اللعبة!');
        
        // Update timer display
        const timerElement = document.getElementById('timer');
        if (timerElement) {
            timerElement.textContent = this.timer;
        }
    }
    
    handleTurnChanged(data) {
        this.currentWord = data.currentWord;
        this.timer = data.timer;
        this.updateUI();
        this.addChatMessage('system', `دور ${data.currentPlayer.name}`);
    }
    
    handleDrawing(data) {
        // Draw on canvas from other players
        if (this.gameState === 'playing' && !this.isCurrentPlayer()) {
            this.drawFromData(data);
        }
    }
    
    handleCorrectGuess(data) {
        this.players = this.players.map(p => 
            p.id === data.player.id ? data.player : p
        );
        this.updatePlayersList();
        this.addChatMessage('system', `🎉 ${data.player.name} خمن الكلمة بشكل صحيح!`);
        this.playSuccessSound();
        this.showConfetti();
    }
    
    handleWrongGuess(data) {
        this.addChatMessage('player', data.guess, data.player.name);
    }
    
    handleChatMessage(data) {
        this.addChatMessage('player', data.message, data.player.name);
    }
    
    handleTimerUpdate(data) {
        this.timer = data.timer;
        const timerElement = document.getElementById('timer');
        timerElement.textContent = this.timer;
        
        // Update timer styling based on time remaining
        timerElement.classList.remove('warning', 'critical');
        if (this.timer <= 10 && this.timer > 5) {
            timerElement.classList.add('warning');
        } else if (this.timer <= 5) {
            timerElement.classList.add('critical');
        }
        
        // Play timer sound when time is running low
        if (this.timer <= 10 && this.timer > 0) {
            this.playTimerSound();
        }
    }
    
    handlePlayerAvatarUpdated(data) {
        // Update player in the list
        this.players = this.players.map(p => 
            p.id === data.player.id ? data.player : p
        );
        this.updatePlayersList();
    }
    
    drawFromData(data) {
        // Draw on canvas from other players' drawing data
        this.ctx.strokeStyle = data.color;
        this.ctx.lineWidth = data.size;
        this.ctx.globalCompositeOperation = data.tool === 'eraser' ? 'destination-out' : 'source-over';
        
        this.ctx.lineTo(data.x, data.y);
        this.ctx.stroke();
    }
    
    addPlayer(name, score, isCurrent = false) {
        const player = { name, score, isCurrent };
        this.players.push(player);
        this.updatePlayersList();
        
        if (isCurrent) {
            this.currentPlayer = player;
        }
    }
    
    updatePlayersList() {
        const playersList = document.getElementById('playersList');
        playersList.innerHTML = '';
        
        this.players.forEach(player => {
            const playerDiv = document.createElement('div');
            playerDiv.className = 'player-item';
            
            // Create avatar for player
            const avatar = this.createPlayerAvatar(player.avatar || {
                expression: '😊'
            });
            
            playerDiv.innerHTML = `
                <div style="display: flex; align-items: center;">
                    ${avatar.outerHTML}
                    <span style="margin-right: 8px;">${player.name}</span>
                </div>
                <span class="player-score">${player.score}</span>
            `;
            playersList.appendChild(playerDiv);
        });
    }
    
    addChatMessage(type, message, playerName = '') {
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${type}`;
        
        if (type === 'player') {
            messageDiv.textContent = `${playerName}: ${message}`;
        } else {
            messageDiv.textContent = message;
        }
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    sendMessage() {
        const chatInput = document.getElementById('chatInput');
        const message = chatInput.value.trim();
        
        if (message && this.socket) {
            this.socket.emit('chatMessage', { message });
            chatInput.value = '';
        }
    }
    
    startGame() {
        console.log('Start game clicked. Players:', this.players.length);
        console.log('Game state:', this.gameState);
        
        if (this.players.length < 2) {
            alert('يجب أن يكون هناك لاعبين على الأقل لبدء اللعبة');
            return;
        }
        
        if (this.gameState === 'playing') {
            alert('اللعبة جارية بالفعل');
            return;
        }
        
        if (this.socket) {
            console.log('Sending startGame event to server');
            this.socket.emit('startGame');
        } else {
            alert('غير متصل بالخادم');
        }
    }
    
    selectRandomWord() {
        const randomIndex = Math.floor(Math.random() * this.arabicWords.length);
        this.currentWord = this.arabicWords[randomIndex];
        this.updateWordDisplay();
    }
    
    updateWordDisplay() {
        const wordDisplay = document.getElementById('wordDisplay');
        if (this.isCurrentPlayer()) {
            wordDisplay.textContent = this.currentWord;
        } else {
            wordDisplay.textContent = 'كلمة السر';
        }
    }
    
    isCurrentPlayer() {
        return this.currentPlayer && this.currentPlayer.isCurrent;
    }
    
    startTimer() {
        this.timer = 60;
        this.timerInterval = setInterval(() => {
            this.timer--;
            document.getElementById('timer').textContent = this.timer;
            
            if (this.timer <= 0) {
                this.endTurn();
            }
        }, 1000);
    }
    
    endTurn() {
        clearInterval(this.timerInterval);
        this.gameState = 'waiting';
        this.addChatMessage('system', 'انتهى الوقت!');
        this.updateUI();
    }
    
    submitGuess() {
        const guessInput = document.getElementById('guessInput');
        const guess = guessInput.value.trim();
        
        if (!guess || !this.socket) return;
        
        this.socket.emit('guess', { guess });
        guessInput.value = '';
    }
    
    setupAvatarCustomization() {
        // Avatar option buttons
        document.querySelectorAll('.emoji-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.target.dataset.type;
                const value = e.target.dataset.value;
                
                // Update active button
                document.querySelectorAll(`[data-type="${type}"]`).forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                // Update avatar
                this.updateAvatar(type, value);
            });
        });
        
        // Initialize avatar display
        this.updateAvatarDisplay();
    }
    
    updateAvatar(type, value) {
        this.avatar[type] = value;
        this.updateAvatarDisplay();
        
        // Send avatar update to server
        if (this.socket) {
            this.socket.emit('avatarUpdate', { avatar: this.avatar });
        }
    }
    
    updateAvatarDisplay() {
        const emojiElement = document.getElementById('avatarEmoji');
        if (!emojiElement) return;
        
        // Simply display the selected emoji
        emojiElement.textContent = this.avatar.expression;
    }
    
    createPlayerAvatar(avatar) {
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'player-avatar';
        
        // Simply display the emoji
        avatarDiv.textContent = avatar.expression || '😊';
        return avatarDiv;
    }

    updateUI() {
        // Update current player display
        const currentPlayerDiv = document.getElementById('currentPlayer');
        if (this.currentPlayer) {
            currentPlayerDiv.textContent = `اللاعب الحالي: ${this.currentPlayer.name}`;
        } else {
            currentPlayerDiv.textContent = 'انتظار اللاعبين...';
        }
        
        // Update start game button
        const startGameBtn = document.getElementById('startGame');
        const isHost = this.currentPlayer?.isHost || false;
        const shouldDisable = this.players.length < 2 || this.gameState === 'playing' || !isHost;
        
        startGameBtn.disabled = shouldDisable;
        
        // Update button text based on state
        if (this.gameState === 'playing') {
            startGameBtn.textContent = 'اللعبة جارية...';
        } else if (!isHost) {
            startGameBtn.textContent = 'فقط المضيف يمكنه البدء';
        } else {
            startGameBtn.textContent = 'بدء اللعبة';
        }
        
        // Debug logging
        console.log('UpdateUI - Players:', this.players.length, 'GameState:', this.gameState, 'CurrentPlayer:', this.currentPlayer?.name, 'IsHost:', isHost, 'Button disabled:', shouldDisable);
        
        // Update word display
        this.updateWordDisplay();
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ShakbataGame();
});
