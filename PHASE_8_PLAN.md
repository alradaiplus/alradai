# PHASE 8 — MOBILE

## Scope
- Native-feeling capture with voice-to-node
- Review mode for mobile reading
- Canvas gestures (pinch, swipe)
- Responsive design for all surfaces
- Mobile-optimized editor

## Files to Create/Modify

### New Files
- `src/hooks/useVoiceCapture.ts` — Voice input hook
- `src/components/mobile/MobileCapture.tsx` — Mobile capture UI
- `src/components/mobile/MobileReview.tsx` — Review mode
- `src/components/mobile/GestureCanvas.tsx` — Touch gestures
- `src/styles/mobile.css` — Mobile-specific styles

### Modified Files
- `src/components/surfaces/` — Add mobile layouts
- `src/components/shell/Shell.tsx` — Mobile navigation
- All components — Add responsive design

## Implementation Order
1. Add voice capture with Web Speech API
2. Create mobile-optimized capture UI
3. Implement review mode
4. Add touch gestures to canvas
5. Optimize editor for mobile
6. Create responsive layouts
7. Add mobile navigation
8. Test on real devices

## Risks
- Voice recognition accuracy varies by device
- Touch gesture conflicts with scroll
- Performance on low-end devices

## Tradeoff
Voice capture will use Web Speech API (free) instead of Whisper API. This reduces cost but may have lower accuracy.
