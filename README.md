# FilApp - Advanced Note Taking Web Application

## Overview
FilApp is a comprehensive note-taking Progressive Web App (PWA) that combines the best features of OneNote and Obsidian. It works entirely in your browser with local storage and optional cloud sync capabilities.

## Features

### Core Features
- ✅ **Rich Text Editing** - Full formatting options like OneNote
- ✅ **Drawing Support** - Draw with Apple Pencil, mouse, or touch
- ✅ **PDF Export** - Automatic PDF generation and saving
- ✅ **Unlimited Notes** - Create unlimited notebooks, sections, and notes
- ✅ **Graph View** - Visualize connections between notes like Obsidian
- ✅ **Code Blocks** - Insert and run code with syntax highlighting
- ✅ **Calendar Integration** - Built-in calendar with Outlook sync capability
- ✅ **Claude AI Assistant** - Integrated AI help (requires API key)
- ✅ **Cross-Platform** - Works on Windows, macOS, Linux, iOS, and Android
- ✅ **Offline Support** - Full PWA with offline functionality
- ✅ **Search** - Fast search across all notes
- ✅ **Auto-Save** - Automatic saving every 30 seconds

### Additional Features from OneNote/Obsidian
- Markdown support
- Table insertion
- Image and PDF embedding
- Note linking
- Tags and categories
- Keyboard shortcuts
- Dark/Light theme
- Word count
- Export to various formats

## Deployment on GitHub Pages (FREE)

### Step 1: Create GitHub Repository
1. Go to [GitHub](https://github.com) and sign in
2. Click "New repository"
3. Name it `filapp` (or any name you prefer)
4. Make it public
5. Don't initialize with README (we have our own)

### Step 2: Upload Files
1. Upload all these files to your repository:
   - index.html
   - styles.css
   - app.js
   - manifest.json
   - service-worker.js
   - README.md

### Step 3: Enable GitHub Pages
1. Go to Settings → Pages
2. Under "Source", select "Deploy from a branch"
3. Choose "main" branch and "/ (root)" folder
4. Click Save

### Step 4: Access Your App
- Your app will be available at: `https://[your-username].github.io/filapp`
- It may take a few minutes to deploy

## Local Development

### Running Locally
1. Download all files to a folder
2. Open `index.html` in a modern browser
3. Or use a local server:
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Node.js
   npx http-server
   ```

## Data Storage Options

### Current Implementation (Free)
- **Local Storage**: All notes saved in browser
- **IndexedDB**: PDF storage and larger data
- **No server costs**: Everything runs client-side

### Future Enhancements (Paid Options)

#### Option 1: Netlify ($0-$19/month)
- Better than GitHub Pages for dynamic features
- Form handling for contact features
- Server-side functions for API calls
- Custom domain support

#### Option 2: Firebase ($0-$25/month)
- Real-time database for note sync
- User authentication
- Cloud storage for attachments
- Collaborative editing

#### Option 3: Cloudflare Pages + Workers ($0-$5/month)
- Edge computing for fast access
- KV storage for notes
- Durable Objects for real-time sync
- R2 storage for files

## Cloud Sync Setup

### iCloud Integration (Concept)
Since direct iCloud API access from web apps is limited, here are alternatives:

1. **Manual Export/Import**
   - Export notes as PDF to iCloud Drive manually
   - Use the auto-export feature in settings

2. **Shortcuts App (iOS)**
   - Create iOS shortcuts to save PDFs to iCloud
   - Automate with time-based triggers

3. **Desktop Sync**
   - Use the PWA on desktop
   - Save exports to iCloud folder on Mac

## Claude AI Setup

1. Get API key from [Anthropic Console](https://console.anthropic.com)
2. Add key in Settings → Claude API
3. Use the robot icon to ask questions

## Customization

### Themes
Edit the CSS variables in `styles.css`:
```css
:root {
    --primary-color: #6200ea;  /* Change main color */
    --background: #ffffff;      /* Background color */
}
```

### Features
Toggle features in `app.js`:
```javascript
// Disable features you don't need
const FEATURES = {
    drawing: true,
    calendar: true,
    claude: true,
    codeEditor: true
};
```

## Browser Compatibility
- Chrome 90+ ✅
- Safari 14+ ✅
- Firefox 88+ ✅
- Edge 90+ ✅
- Mobile browsers ✅

## Known Limitations
1. **File System**: Can't directly save to system folders (browser security)
2. **iCloud**: No direct API access from web apps
3. **Outlook Sync**: Requires OAuth setup and server
4. **Code Execution**: Limited to JavaScript and HTML

## Support & Updates

### Getting Help
- Check browser console for errors
- Ensure all external libraries load
- Clear cache if updates don't appear

### Contributing
Feel free to fork and improve! Key areas for contribution:
- Better graph physics
- More code language support
- Enhanced drawing tools
- Real-time collaboration

## License
MIT License - Free to use and modify

## Credits
- Icons: Font Awesome
- PDF: jsPDF
- Code Editor: CodeMirror
- Inspiration: OneNote & Obsidian

---

**Enjoy FilApp! 📝✨**

*Remember: Your notes are stored locally. Always keep backups!*
