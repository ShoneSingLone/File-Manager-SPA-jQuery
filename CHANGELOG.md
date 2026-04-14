# Change Log

## [2026-04-14]
### Added
- Breadcrumb navigation support.
- Custom scrollbar styling for a cleaner look.
- `CHANGELOG.md` to track project updates.
- **Enhanced Media Viewer**: Added "Previous" and "Next" navigation, playback speed control, and loop toggle.
- **Global Namespace Architecture**: Removed `import`/`export` syntax in favor of a global `spa` namespace for maximum compatibility.

### Changed
- Moved breadcrumbs from the header to a dedicated bar below the header.
- Refactored all JavaScript code to use **ES5 syntax** and global namespace.
- Updated `spa.browser.js` to only show filters during search.
- Optimized UI layout for mobile-first experience.
- **UI Refactoring**: Replaced Material 3 styling with an **Apple-inspired Glassmorphism** design.
- **BEM Implementation**: Adopted the **BEM (Block, Element, Modifier)** naming convention for all CSS classes to ensure a clean and maintainable style structure.
- **Unified Design**: Coordinated typography, spacing, and interaction patterns across all modules (`shell`, `browser`, `viewer`).
- **Fixed Style Loading**: Correctly linked `index.css` in `index.html` after removing the ES module entry point.
- **Enhanced Media Preview**:
    - **Images**: Added zoom controls (In/Out/Reset) and a Slideshow mode.
    - **Audio**: Implemented a spinning vinyl record animation that syncs with playback state.
    - **Video**: Improved layout with better shadows and centering.
    - **General**: Refined header/footer controls and added smoother transitions.
