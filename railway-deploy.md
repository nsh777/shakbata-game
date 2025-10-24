# 🚀 Deploy شخبطة to Railway

## Step 1: Login to Railway
```bash
railway login
```
- This will open your browser
- Sign in with GitHub, Google, or email
- Authorize Railway

## Step 2: Initialize Project
```bash
railway init
```
- Choose "Empty Project"
- Give it a name like "shakbata-game"

## Step 3: Deploy
```bash
railway up
```
- Railway will automatically detect Node.js
- It will install dependencies and start your app
- You'll get a URL like: `https://shakbata-game.railway.app`

## Step 4: Test Your Game
1. **Open the URL** in your browser
2. **Create a room** and get the room code
3. **Open another browser tab** and join with the room code
4. **Test multiplayer** with friends!

## 🎮 Testing with Friends

### Share Your Game:
- **Send the Railway URL** to friends
- **One person creates a room**
- **Share the room code**
- **Start playing together!**

### Example URL:
```
https://your-app-name.railway.app
```

## 🔧 Railway Benefits:
- ✅ **Free $5 credit monthly**
- ✅ **Perfect for Socket.io games**
- ✅ **Automatic HTTPS**
- ✅ **Easy deployment**
- ✅ **Real-time multiplayer support**

## 🚨 Troubleshooting:

### If deployment fails:
1. **Check package.json** - make sure "start" script exists
2. **Check server.js** - make sure it listens on process.env.PORT
3. **Check dependencies** - all required packages installed

### If WebSocket doesn't work:
- Railway supports WebSockets automatically
- No additional configuration needed

## 📱 Mobile Testing:
- **Open the URL on your phone**
- **Test the responsive design**
- **Try the avatar system**
- **Test drawing on touch screen**

## 🎯 Quick Commands:
```bash
# Login
railway login

# Initialize
railway init

# Deploy
railway up

# View logs
railway logs

# Open in browser
railway open
```

Your game will be live and ready for testing with real players! 🎉
