# AlRadai+ Features Guide

## Overview

AlRadai+ is a comprehensive AI-powered workspace that combines four powerful pillars: Notion-like organization, Obsidian-style knowledge graphs, Miro-inspired infinite canvas, and ChatGPT-powered intelligence. This guide explains all features and how to use them.

---

## 1. Voice & AI Chat

### Voice Input
- **Hands-Free Capture**: Use your microphone to capture thoughts without typing
- **Real-Time Transcription**: Web Speech API converts voice to text instantly
- **Multi-Language Support**: Supports 50+ languages
- **Automatic Punctuation**: AI adds proper punctuation to transcribed text

### AI Chat
- **Workspace-Aware**: AI understands all your notes and context
- **Persistent Threads**: Chat history is saved and searchable
- **Real-Time Streaming**: See AI responses as they're generated
- **Citations**: AI cites sources from your workspace
- **Multi-Provider**: Uses OpenRouter for access to 100+ models

### How to Use
1. Click the microphone icon in the capture bar
2. Speak your thought clearly
3. AI transcribes and creates a new note
4. Chat with AI about your notes using the chat panel
5. AI provides summaries, suggestions, and connections

---

## 2. File Uploads & Management

### Supported Formats
- **Images**: JPG, PNG, GIF, WebP (up to 50MB)
- **Documents**: PDF, Word (.docx), TXT
- **Automatic Indexing**: AI extracts and indexes content for search

### Upload Process
1. Click the attachment icon
2. Select files from your computer
3. Files are encrypted and stored in Supabase Storage
4. AI automatically extracts text for search
5. Files are linked to your notes

### File Organization
- **Workspace Storage**: All files are workspace-scoped
- **Version History**: Keep track of file changes
- **Sharing**: Share files with collaborators
- **Expiration**: Set automatic file deletion dates

---

## 3. Interactive Habit Tracker

### Features
- **Daily Tracking**: Check off habits as you complete them
- **Calendar View**: See your completion history
- **Streak Counter**: Track your longest streaks
- **Statistics**: View completion rates and trends
- **AI Insights**: Get personalized suggestions based on your habits

### How to Use
1. Go to the Tracker tab
2. Click "Add Habit"
3. Enter habit name and frequency
4. Check off days as you complete habits
5. View your progress in the calendar
6. Get AI-powered insights and recommendations

### Habit Types
- **Daily**: Track every day
- **Weekly**: Track specific days of the week
- **Monthly**: Track monthly goals
- **Custom**: Set your own frequency

### Analytics
- Completion rate percentage
- Longest streak
- Average completion per week
- Trend analysis with charts

---

## 4. Personalized AI Interview

### What It Does
The AI Interview helps personalize your experience by learning about:
- Your goals and aspirations
- Topics you're interested in
- Habits you want to track
- Challenges you face
- Preferred communication style

### Interview Questions
- **Goals**: What do you want to achieve?
- **Interests**: What topics fascinate you?
- **Habits**: What habits do you want to build?
- **Challenges**: What obstacles do you face?
- **Preferences**: How often do you want suggestions?

### How It Helps
- **Personalized Suggestions**: AI recommends content based on your interests
- **Smart Reminders**: Get reminders for habits you want to build
- **Relevant Connections**: AI finds related notes automatically
- **Adaptive Learning**: AI learns from your interactions
- **Better Search**: Results are ranked by relevance to your goals

### How to Access
1. First-time users see the interview on signup
2. Existing users can access via Settings → AI Profile
3. Update your profile anytime to improve personalization

---

## 5. Landing Page & App Introduction

### Landing Page Features
- **Feature Overview**: See what AlRadai+ can do
- **Pricing Plans**: Free, Pro, and Enterprise options
- **How It Works**: Step-by-step guide
- **Testimonials**: See what other users say
- **Newsletter**: Subscribe for updates

### In-App Introduction
- **Onboarding Tour**: Interactive walkthrough of features
- **Contextual Help**: Tips appear when you need them
- **Video Tutorials**: Learn features through short videos
- **Knowledge Base**: Searchable help articles

---

## 6. Security & API Key Management

### How API Keys Are Handled
- **Server-Side Only**: OpenRouter keys never leave your server
- **Environment Variables**: Keys stored in `.env.local` (not in code)
- **Encrypted Storage**: Keys encrypted at rest
- **No Client Exposure**: Frontend never sees API keys
- **Rate Limiting**: Automatic rate limiting per user

### Your OpenRouter Keys
Your OpenRouter API keys are:
- Stored securely in environment variables
- Never exposed to the browser
- Used only on the server for AI requests
- Rotated automatically if compromised
- Tracked for usage and billing

### Setting Up Your Keys
1. Create `.env.local` file (copy from `.env.local.example`)
2. Add your OpenRouter API keys:
   ```
   OPENROUTER_API_KEY=sk-or-v1-...
   ```
3. Never commit `.env.local` to git
4. Restart the app to load new keys

---

## 7. Database & Organization

### Database Features
- **Typed Properties**: Text, number, select, date, relation, formula
- **Multiple Views**: Table, board (Kanban), calendar, gallery, timeline
- **Filtering & Sorting**: Create custom views
- **Formulas**: Calculate values from other fields
- **Rollups**: Aggregate data from related records

### How to Create a Database
1. Click "New" → "Database"
2. Add properties (columns)
3. Create records (rows)
4. Switch between views
5. Set up filters and sorts

### View Types
- **Table**: Traditional spreadsheet view
- **Board**: Kanban board for workflows
- **Calendar**: Timeline view for dates
- **Gallery**: Visual grid view
- **Timeline**: Gantt chart for project management

---

## 8. Knowledge Graph & Connections

### Wikilinks
- **Create Links**: Type `[[note name]]` to link notes
- **Autocomplete**: Get suggestions as you type
- **Backlinks**: See all notes linking to current note
- **Unlinked Mentions**: Find mentions that aren't linked yet

### Graph Visualization
- **Force-Directed Graph**: Interactive visualization of connections
- **Local Graph**: See connections around current note
- **Cluster Detection**: AI groups related notes
- **Relationship Types**: Supports, contradicts, derives, asks

### How to Use
1. Type `[[` to start a wikilink
2. Select a note from suggestions
3. Click on links to navigate
4. View the graph in Graph tab
5. Explore connections visually

---

## 9. Infinite Canvas

### Features
- **Draggable Nodes**: Move notes around freely
- **Infinite Space**: No limits on canvas size
- **Minimap**: Navigate large canvases
- **Layers**: Organize nodes by layer
- **Frames**: Group related nodes
- **Virtualization**: Smooth performance with 5k+ nodes

### How to Use
1. Go to Canvas tab
2. Drag notes to arrange them
3. Draw connections between notes
4. Use minimap to navigate
5. Create frames to group related items
6. Use layers to organize visually

---

## 10. AI-Powered Actions

### Available Actions
- **Summarize**: Create a concise summary
- **Extend**: Add more details and context
- **Critique**: Get constructive feedback
- **Find Links**: Discover related notes
- **Generate Children**: Create sub-points

### How to Use
1. Select a note
2. Click the AI menu (⚡)
3. Choose an action
4. AI processes and returns results
5. Accept, edit, or regenerate

---

## 11. Collaboration Features

### Sharing & Permissions
- **Share Links**: Generate expiring share links
- **Role-Based Access**: Owner, editor, commenter, viewer
- **Workspace Members**: Invite team members
- **Comments**: Leave feedback on notes
- **@Mentions**: Tag specific people

### How to Collaborate
1. Click Share button
2. Generate link or invite members
3. Set role (editor, commenter, viewer)
4. Members can now access workspace
5. Leave comments and mentions
6. View activity log

---

## 12. Pricing & Plans

### Free Plan
- 100 API calls/day
- 1 GB storage
- Basic AI features
- Single user

### Pro Plan ($50/month)
- 10,000 API calls/day
- 100 GB storage
- Advanced AI features
- Up to 10 collaborators
- Priority support

### Enterprise Plan (Custom)
- Unlimited API calls
- Unlimited storage
- Custom AI models
- Unlimited collaborators
- Dedicated support

---

## Getting Started

### First Steps
1. **Sign Up**: Create account with email or OAuth
2. **Complete Interview**: Help AI personalize your experience
3. **Create First Note**: Capture a thought
4. **Explore Features**: Try each pillar
5. **Invite Collaborators**: Share your workspace

### Tips for Success
- Use voice capture for quick thoughts
- Create databases for structured data
- Link related notes with wikilinks
- Use AI actions to enhance notes
- Track habits to build consistency
- Review AI suggestions regularly

---

## Troubleshooting

### Voice Input Not Working
- Check microphone permissions
- Ensure browser supports Web Speech API
- Try a different browser (Chrome recommended)

### File Upload Failed
- Check file size (max 50MB)
- Verify file type is supported
- Check internet connection

### AI Not Responding
- Verify OpenRouter API key is set
- Check rate limits
- Ensure workspace has credits

### Performance Issues
- Clear browser cache
- Close unused tabs
- Reduce canvas node count
- Try a different browser

---

## Support & Resources

- **Documentation**: https://alradai.com/docs
- **GitHub**: https://github.com/alradaiplus/alradai
- **Discord**: https://discord.gg/alradai
- **Email**: support@alradai.com

---

**Last Updated**: June 18, 2026
**Version**: 2.0.0
