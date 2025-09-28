let videoInfo = null;

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function parseTime(timeStr) {
  const parts = timeStr.split(':').map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return parts[0];
}

async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function getVideoInfo() {
  const tab = await getCurrentTab();

  if (!tab.url.includes('youtube.com/watch')) {
    document.getElementById('error').style.display = 'block';
    document.getElementById('content').style.display = 'none';
    return null;
  }

  try {
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'getVideoInfo' });

    if (response.error) {
      document.getElementById('error').style.display = 'block';
      document.getElementById('content').style.display = 'none';
      return null;
    }

    document.getElementById('error').style.display = 'none';
    document.getElementById('content').style.display = 'block';

    return response;
  } catch (error) {
    console.error('Error getting video info:', error);
    document.getElementById('error').style.display = 'block';
    document.getElementById('content').style.display = 'none';
    return null;
  }
}

async function startReplay() {
  const startTimeStr = document.getElementById('startTime').value;
  const endTimeStr = document.getElementById('endTime').value;

  if (!startTimeStr || !endTimeStr) {
    alert('Please enter both start and end times');
    return;
  }

  const startTime = parseTime(startTimeStr);
  const endTime = parseTime(endTimeStr);

  if (startTime >= endTime) {
    alert('End time must be after start time');
    return;
  }

  if (endTime > videoInfo.duration) {
    alert('End time exceeds video duration');
    return;
  }

  const tab = await getCurrentTab();
  const response = await chrome.tabs.sendMessage(tab.id, {
    action: 'startReplay',
    config: { startTime, endTime }
  });

  if (response.success) {
    updateUI(true);
    await saveSavedLoop(startTime, endTime);
  }
}

async function stopReplay() {
  const tab = await getCurrentTab();
  await chrome.tabs.sendMessage(tab.id, { action: 'stopReplay' });
  updateUI(false);
}

function updateUI(isReplaying) {
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const status = document.getElementById('status');

  if (isReplaying) {
    startBtn.style.display = 'none';
    stopBtn.style.display = 'flex';
    status.style.display = 'flex';
    status.classList.add('replaying');
  } else {
    startBtn.style.display = 'flex';
    stopBtn.style.display = 'none';
    status.style.display = 'none';
    status.classList.remove('replaying');
  }
}

async function setCurrentTimeInput(inputId) {
  const tab = await getCurrentTab();
  const response = await chrome.tabs.sendMessage(tab.id, { action: 'getVideoInfo' });

  if (response && !response.error) {
    document.getElementById(inputId).value = formatTime(response.currentTime);
  }
}

async function saveSavedLoop(startTime, endTime) {
  const tab = await getCurrentTab();
  const videoId = new URL(tab.url).searchParams.get('v');

  const savedLoops = await chrome.storage.local.get(['savedLoops']) || {};
  const loops = savedLoops.savedLoops || {};

  if (!loops[videoId]) {
    loops[videoId] = [];
  }

  const loopKey = `${startTime}-${endTime}`;
  if (!loops[videoId].some(loop => loop.key === loopKey)) {
    loops[videoId].unshift({
      key: loopKey,
      startTime,
      endTime,
      timestamp: Date.now()
    });

    loops[videoId] = loops[videoId].slice(0, 5);
  }

  await chrome.storage.local.set({ savedLoops: loops });
  await loadSavedLoops();
}

async function loadSavedLoops() {
  const tab = await getCurrentTab();
  if (!tab.url.includes('youtube.com/watch')) return;

  const videoId = new URL(tab.url).searchParams.get('v');
  const savedLoops = await chrome.storage.local.get(['savedLoops']) || {};
  const loops = (savedLoops.savedLoops || {})[videoId] || [];

  const container = document.getElementById('savedLoops');
  const loopsList = document.getElementById('loopsList');

  if (loops.length === 0) {
    container.style.display = 'none';
    return;
  }

  container.style.display = 'block';
  loopsList.innerHTML = loops.map(loop => `
    <div class="loop-item">
      <span>${formatTime(loop.startTime)} - ${formatTime(loop.endTime)}</span>
      <button data-start="${loop.startTime}" data-end="${loop.endTime}">Use</button>
    </div>
  `).join('');

  loopsList.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('startTime').value = formatTime(parseFloat(btn.dataset.start));
      document.getElementById('endTime').value = formatTime(parseFloat(btn.dataset.end));
    });
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  videoInfo = await getVideoInfo();

  if (videoInfo) {
    document.getElementById('duration').textContent = formatTime(videoInfo.duration);
    updateUI(videoInfo.isReplaying);

    if (videoInfo.isReplaying && videoInfo.replayConfig) {
      document.getElementById('startTime').value = formatTime(videoInfo.replayConfig.startTime);
      document.getElementById('endTime').value = formatTime(videoInfo.replayConfig.endTime);
      document.getElementById('statusText').textContent =
        `Replaying ${formatTime(videoInfo.replayConfig.startTime)} - ${formatTime(videoInfo.replayConfig.endTime)}`;
    }

    await loadSavedLoops();
  }

  document.getElementById('startBtn').addEventListener('click', startReplay);
  document.getElementById('stopBtn').addEventListener('click', stopReplay);

  document.getElementById('setStartTime').addEventListener('click', () => {
    setCurrentTimeInput('startTime');
  });

  document.getElementById('setEndTime').addEventListener('click', () => {
    setCurrentTimeInput('endTime');
  });

  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const duration = parseInt(btn.dataset.duration);
      const tab = await getCurrentTab();
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'getVideoInfo' });

      if (response && !response.error) {
        const startTime = response.currentTime;
        const endTime = Math.min(startTime + duration, response.duration);

        document.getElementById('startTime').value = formatTime(startTime);
        document.getElementById('endTime').value = formatTime(endTime);
      }
    });
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'stopReplay') {
    updateUI(false);
  }
});