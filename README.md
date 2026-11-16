# ULTIMATE MPC (Browser Prototype)

## Run
Open `index.html` in a modern browser, or publish this folder with GitHub Pages.

## Included in this working foundation
- 16-pad sample playback, simultaneous triggering, keyboard triggering
- Browser-supported audio import and microphone recording
- Per-pad volume, pan, pitch, start/end, ADSR-like envelope, low-pass, reverse, mute, solo, choke group
- Waveform display, selection trim, fade in/out, normalize, zoom
- Equal/grid slicing and basic transient-onset slicing, assignment to pads
- 16/32/64-step pattern sequencer with Web Audio clock lookahead scheduling, BPM and swing
- Basic channel mixer controls and master limiter
- Simple song-section list
- WAV export at 44.1/48 kHz and 16/24-bit
- IndexedDB save/load and JSON project backup/restore

## Known limitations (not falsely presented as implemented)
This is a functional foundation, not a finished professional DAW. Full time-stretch/pitch-preserving algorithms, advanced piano roll/MIDI export, complete multi-effect rack (EQ/compressor/reverb/delay/modulation), song arrangement playback, full undo coverage, robust mobile background audio, MP3 encoding, and exhaustive browser/device QA are not implemented yet. WAV rendering currently renders sequencer patterns; song sections are organizational metadata only. The "duplicate pattern" control currently duplicates the selected track's boolean pattern in memory rather than creating a separate pattern bank.

## Notes
- Audio formats depend on the browser's `decodeAudioData` support.
- Microphone recording uses MediaRecorder; the resulting format depends on the browser.
- iOS Safari requires a user gesture to start/resume Web Audio and microphone permission for recording.
- IndexedDB data can be removed by clearing browser website data. Export project backups regularly.
