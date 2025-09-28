# Testing Guide for YouTube Replay Extension

## Installation Testing

1. **Load the Extension**:
   - Open Chrome browser
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `youtube-replay` folder
   - Verify the extension appears in the extensions list
   - Verify the extension icon appears in the toolbar

2. **Check Manifest Loading**:
   - No errors should appear on the extension card
   - Version should show as "1.0.0"
   - All permissions should be listed

## Functionality Testing

### Basic Loop Test
1. Open any YouTube video (e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ)
2. Click the extension icon in toolbar
3. Enter start time: `0:10`
4. Enter end time: `0:20`
5. Click "Start Replay"
6. **Expected**: Video should loop between 10-20 seconds continuously

### "Now" Button Test
1. Open a YouTube video
2. Seek to 1:00 in the video
3. Click extension icon
4. Click "Now" button next to Start Time
5. **Expected**: Start time field should show "1:00"
6. Seek to 1:30
7. Click "Now" button next to End Time
8. **Expected**: End time field should show "1:30"

### Preset Duration Test
1. Open a YouTube video
2. Click extension icon
3. Seek to any time in the video
4. Click "30 sec" preset button
5. **Expected**: Start time = current time, End time = current time + 30 seconds

### Visual Indicators Test
1. Start a replay loop
2. **Expected**: Purple indicator appears in top-right showing "Replaying X:XX - X:XX"
3. Click "Stop Replay"
4. **Expected**: Indicator disappears

### Saved Loops Test
1. Create and start a replay loop
2. Close the popup
3. Reopen the popup
4. **Expected**: Your loop should appear in "Saved Loops" section
5. Click "Use" button on saved loop
6. **Expected**: Times should populate in the input fields

## Edge Cases Testing

### Invalid Time Inputs
1. Try entering end time before start time
2. **Expected**: Error message "End time must be after start time"

### Video Duration Boundary
1. Try setting end time beyond video duration
2. **Expected**: Error message "End time exceeds video duration"

### Non-YouTube Pages
1. Open extension on non-YouTube page
2. **Expected**: Message "Please open a YouTube video first"

### Multiple Tabs
1. Start replay in one tab
2. Open another YouTube video in different tab
3. **Expected**: Each tab maintains independent replay state

## Performance Testing

### Long Duration Loop
1. Set a 5-minute loop
2. Let it run for several iterations
3. **Expected**: Smooth transitions, no memory leaks

### Rapid Start/Stop
1. Rapidly click Start/Stop replay multiple times
2. **Expected**: No crashes, proper state management

## Browser Compatibility

Test on:
- [ ] Chrome (latest)
- [ ] Chrome (version 88+)
- [ ] Microsoft Edge
- [ ] Brave Browser
- [ ] Opera

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Extension icon not appearing | Check if extension is enabled in chrome://extensions |
| Popup shows "No video found" | Refresh the YouTube page and try again |
| Replay not starting | Ensure video is not paused, check time format |
| Times not saving | Check browser storage permissions |

## Chrome Web Store Submission Checklist

- [ ] All icons display correctly (16x16, 32x32, 48x48, 128x128)
- [ ] Manifest version is correct
- [ ] No console errors in background script
- [ ] No console errors in content script
- [ ] Privacy policy link works
- [ ] All features work as described
- [ ] Extension size is under 10MB
- [ ] No minified code (for initial review)
- [ ] Screenshots prepared (1280x800 or 640x400)

## Debugging

Enable debug mode by:
1. Open Developer Tools on YouTube page
2. Check Console for any errors
3. Look for messages prefixed with "YouTube Replay:"

## User Feedback Testing

Ask testers to:
1. Use the extension for 10 minutes
2. Try to break it intentionally
3. Report any confusion or unclear features
4. Suggest improvements

## Version Update Testing

When updating the extension:
1. Test that saved loops persist after update
2. Verify no breaking changes in API
3. Check backward compatibility