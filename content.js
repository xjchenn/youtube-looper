let replayConfig = null;
let isReplaying = false;
let replayInterval = null;

function getVideo() {
  return document.querySelector('video.html5-main-video') || document.querySelector('video');
}

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

function startReplay(config) {
  const video = getVideo();
  if (!video) return;

  stopReplay();

  replayConfig = config;
  isReplaying = true;

  video.currentTime = config.startTime;
  video.play();

  showNotification('Replay started', `Looping from ${formatTime(config.startTime)} to ${formatTime(config.endTime)}`);

  replayInterval = setInterval(() => {
    if (!isReplaying || !video) {
      stopReplay();
      return;
    }

    if (video.currentTime >= config.endTime || video.currentTime < config.startTime) {
      video.currentTime = config.startTime;
    }
  }, 100);

  updateReplayIndicator(true);
}

function stopReplay() {
  isReplaying = false;
  replayConfig = null;

  if (replayInterval) {
    clearInterval(replayInterval);
    replayInterval = null;
  }

  updateReplayIndicator(false);
  hideNotification();
}

function updateReplayIndicator(active) {
  let indicator = document.getElementById('yt-replay-indicator');

  if (active) {
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'yt-replay-indicator';
      indicator.style.cssText = `
        position: fixed;
        top: 70px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 14px;
        font-weight: 500;
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: pulse 2s infinite;
        cursor: pointer;
      `;

      const style = document.createElement('style');
      style.textContent = `
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
      `;
      document.head.appendChild(style);

      indicator.onclick = () => {
        if (confirm('Stop replay?')) {
          stopReplay();
          chrome.runtime.sendMessage({ action: 'stopReplay' });
        }
      };

      document.body.appendChild(indicator);
    }

    if (replayConfig) {
      indicator.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 1A7 7 0 1 1 1 8a7 7 0 0 1 7-7zm0 1A6 6 0 1 0 14 8 6 6 0 0 0 8 2z"/>
          <path d="M8 4.5a.5.5 0 0 1 .5.5v3.5H11a.5.5 0 0 1 0 1H8a.5.5 0 0 1-.5-.5V5a.5.5 0 0 1 .5-.5z"/>
        </svg>
        Replaying ${formatTime(replayConfig.startTime)} - ${formatTime(replayConfig.endTime)}
      `;
    }
  } else if (indicator) {
    indicator.remove();
  }
}

function showNotification(title, message) {
  hideNotification();

  const notification = document.createElement('div');
  notification.id = 'yt-replay-notification';
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #333;
    color: white;
    padding: 16px 20px;
    border-radius: 8px;
    max-width: 300px;
    z-index: 9999;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    animation: slideIn 0.3s ease;
  `;

  notification.innerHTML = `
    <div style="font-weight: bold; margin-bottom: 4px;">${title}</div>
    <div style="font-size: 14px; opacity: 0.9;">${message}</div>
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    hideNotification();
  }, 3000);
}

function hideNotification() {
  const notification = document.getElementById('yt-replay-notification');
  if (notification) {
    notification.remove();
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const video = getVideo();

  switch (request.action) {
    case 'getVideoInfo':
      if (video) {
        sendResponse({
          duration: video.duration,
          currentTime: video.currentTime,
          isReplaying: isReplaying,
          replayConfig: replayConfig
        });
      } else {
        sendResponse({ error: 'No video found' });
      }
      break;

    case 'startReplay':
      if (video) {
        startReplay(request.config);
        sendResponse({ success: true });
      } else {
        sendResponse({ error: 'No video found' });
      }
      break;

    case 'stopReplay':
      stopReplay();
      sendResponse({ success: true });
      break;

    case 'setCurrentTime':
      if (video) {
        video.currentTime = request.time;
        sendResponse({ success: true });
      } else {
        sendResponse({ error: 'No video found' });
      }
      break;
  }

  return true;
});

const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;
document.head.appendChild(style);