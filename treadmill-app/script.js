// Setup the YouTube IFrame API
var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

var player;
var currentMinuteIndex = -1;
var syncInterval;

// Called automatically when the IFrame API is loaded
function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: '100%',
        width: '100%',
        videoId: videoId,
        playerVars: {
            'playsinline': 1,
            'rel': 0,
            'modestbranding': 1,
            'color': 'white'
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

function onPlayerReady(event) {
    setupControls();
    buildChart();
    // Start an initial sync to setup UI state before playing
    syncApp();
}

function onPlayerStateChange(event) {
    // If playing
    if (event.data == YT.PlayerState.PLAYING) {
        // Start high-frequency tick for accurate synchronization
        if (!syncInterval) syncInterval = setInterval(syncApp, 500);
    } else {
        clearInterval(syncInterval);
        syncInterval = null;
        // Do one last sync to make sure state is perfect upon pausing
        syncApp();
    }
}

function buildChart() {
    const chart = document.getElementById('bar-chart');
    chart.innerHTML = ''; 
    
    // Determine scale by finding the highest speed
    const maxSpeed = Math.max(...workoutData, 1); 
    
    workoutData.forEach((speed, index) => {
        // Minimum visual height of 5% even for 0 speed, max 100%
        const normalizedHeight = Math.max((speed / maxSpeed) * 100, 5); 
        
        const wrapper = document.createElement('div');
        wrapper.className = 'bar-wrapper';
        wrapper.id = `wrapper-${index}`;
        
        const label = document.createElement('div');
        label.className = 'bar-label';
        label.innerText = speed.toFixed(1);
        
        const bar = document.createElement('div');
        bar.className = 'bar';
        bar.style.height = `${normalizedHeight}%`;
        bar.id = `bar-${index}`;
        
        // Add click listener to seek video directly to that minute mark
        wrapper.addEventListener('click', () => {
            const offset = typeof videoOffsetSeconds !== 'undefined' ? videoOffsetSeconds : 0;
            const timeInSeconds = (index * 60) + offset;
            if (player && player.seekTo) {
                player.seekTo(timeInSeconds, true);
                player.playVideo();
                // Immediately trigger a sync round to fix UI visual sluggishness
                setTimeout(syncApp, 50);
            }
        });
        
        wrapper.appendChild(label);
        wrapper.appendChild(bar);
        chart.appendChild(wrapper);
    });
}

function formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

function syncApp() {
    if (!player || !player.getCurrentTime) return;
    
    const rawTime = player.getCurrentTime();
    const offset = typeof videoOffsetSeconds !== 'undefined' ? videoOffsetSeconds : 0;
    const workoutTime = Math.max(0, rawTime - offset);
    
    document.getElementById('time-display').innerText = formatTime(workoutTime);
    
    const minute = Math.floor(workoutTime / 60);
    
    // Bounds limit the index based on the configuration array's size
    const clampedMinute = Math.min(Math.max(0, minute), workoutData.length - 1);
    
    // Only update DOM classes if the target minute has actually changed
    if (currentMinuteIndex !== clampedMinute) {
        
        // Remove 'active' class from old target
        if (currentMinuteIndex >= 0) {
            const oldWrapper = document.getElementById(`wrapper-${currentMinuteIndex}`);
            const oldBar = document.getElementById(`bar-${currentMinuteIndex}`);
            if (oldWrapper) oldWrapper.classList.remove('active');
            if (oldBar) oldBar.classList.remove('active');
        }
        
        currentMinuteIndex = clampedMinute;
        
        // Add 'active' class to new target
        const newWrapper = document.getElementById(`wrapper-${currentMinuteIndex}`);
        const newBar = document.getElementById(`bar-${currentMinuteIndex}`);
        if (newWrapper) newWrapper.classList.add('active');
        if (newBar) newBar.classList.add('active');
        
        // Update the current speed big numerical display 
        document.getElementById('speed-display').innerText = workoutData[currentMinuteIndex].toFixed(1) + ' km/h';
    }
    
    // Update 'completed' state colors for bars progressively
    workoutData.forEach((_, index) => {
        const bar = document.getElementById(`bar-${index}`);
        if (!bar) return;
        
        if (index < currentMinuteIndex) {
            bar.classList.add('completed');
        } else {
            bar.classList.remove('completed');
        }
    });
}

function setupControls() {
    document.getElementById('speed-up').addEventListener('click', () => adjustSpeed(0.5));
    document.getElementById('speed-down').addEventListener('click', () => adjustSpeed(-0.5));
    document.getElementById('export-btn').addEventListener('click', exportSpeeds);
    
    // Check localStorage for saved session
    const saved = localStorage.getItem('treadmill_workout');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (parsed.length === workoutData.length) {
                for(let i=0; i<parsed.length; i++) workoutData[i] = parsed[i];
            }
        } catch (e) {}
    }
}

function adjustSpeed(delta) {
    if (currentMinuteIndex < 0 || currentMinuteIndex >= workoutData.length) return;
    
    // Update data
    workoutData[currentMinuteIndex] = Math.max(0, workoutData[currentMinuteIndex] + delta);
    
    // Save to local storage
    localStorage.setItem('treadmill_workout', JSON.stringify(workoutData));
    
    // Update DOM
    const maxSpeed = Math.max(...workoutData, 1);
    const wrapper = document.getElementById(`wrapper-${currentMinuteIndex}`);
    
    if (wrapper) {
        const label = wrapper.querySelector('.bar-label');
        if (label) label.innerText = workoutData[currentMinuteIndex].toFixed(1);
        
        // Update all bars since max scale might have changed
        workoutData.forEach((speed, index) => {
            const b = document.getElementById(`bar-${index}`);
            if (b) {
                const h = Math.max((speed / maxSpeed) * 100, 5);
                b.style.height = `${h}%`;
            }
        });
    }
    
    // Update text
    document.getElementById('speed-display').innerText = workoutData[currentMinuteIndex].toFixed(1) + ' km/h';
}

function exportSpeeds() {
    const str = `const workoutData = [\n    ${workoutData.join(', ')}\n];`;
    navigator.clipboard.writeText(str).then(() => {
        const btn = document.getElementById('export-btn');
        const origText = btn.innerText;
        btn.innerText = 'Copied!';
        setTimeout(() => btn.innerText = origText, 2000);
    });
}
