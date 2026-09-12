# Requirements Document

## Introduction

The BanglaPath application's authentication page and leaf animation sequence are currently non-functional due to missing JavaScript functions. The application flow requires users to navigate through a video carousel screen, proceed to an authentication screen with tiger background video, and upon authentication, experience a leaf sweep animation that transitions to the main application. Currently, three critical functions (`buildSweep()`, `playSweep()`, and `launch()`) are called by script.js but do not exist in home.js, causing the authentication and animation flow to fail.

## Glossary

- **Script_Module**: The JavaScript file script.js that manages the intro flow and authentication screens
- **Home_Module**: The JavaScript file home.js that manages the main application and animation functions
- **Auth_Screen**: The tiger-themed authentication interface where users sign up or log in
- **Carousel_Screen**: The initial video carousel introduction screen with multiple destination videos
- **Leaf_Sweep**: The animated transition effect using foliage imagery that wipes across the screen
- **Canvas_Element**: HTML canvas elements with class names "sweep-left" and "sweep-right" used for rendering the leaf animation
- **Launch_Sequence**: The process that initializes the main application after authentication
- **App_Container**: The main application DOM element with id "app" that is revealed after animation
- **Whiteout_Element**: A white overlay element that fades during the launch transition
- **Mobile_Viewport**: Screen width of 768 pixels or less
- **Desktop_Viewport**: Screen width greater than 768 pixels

## Requirements

### Requirement 1

**User Story:** As a user completing authentication on desktop, I want to see a smooth leaf sweep animation, so that I experience a cinematic transition to the main application.

#### Acceptance Criteria

1. WHEN the user clicks a social authentication button (Google or Apple), THE Home_Module SHALL initialize the Leaf_Sweep animation
2. WHEN the user submits an email authentication form (signup or login), THE Home_Module SHALL initialize the Leaf_Sweep animation
3. WHEN the Skip button is clicked, THE Home_Module SHALL bypass the Leaf_Sweep animation and launch the application immediately
4. WHEN buildSweep function is called, THE Home_Module SHALL load branch images from the LEAF_LAYOUT configuration
5. WHEN buildSweep function executes, THE Home_Module SHALL paint foliage imagery onto both Canvas_Element instances
6. THE Home_Module SHALL render the left Canvas_Element with branches in their original orientation
7. THE Home_Module SHALL render the right Canvas_Element with branches in mirrored orientation
8. WHEN playSweep function is called, THE Home_Module SHALL animate both Canvas_Element instances to sweep across the viewport
9. WHEN the Leaf_Sweep animation plays, THE Canvas_Element instances SHALL swing in from opposite edges with easing effects
10. WHEN the Leaf_Sweep animation completes after 3600 milliseconds, THE Home_Module SHALL remove the "is-active" class from the sweep container

### Requirement 2

**User Story:** As a user on mobile, I want authentication to launch the app quickly without animation, so that I experience optimal performance on my device.

#### Acceptance Criteria

1. WHEN launch function is called with fast parameter set to true, THE Home_Module SHALL skip the Leaf_Sweep animation
2. WHEN launch function detects a Mobile_Viewport, THE Home_Module SHALL skip the Leaf_Sweep animation regardless of the fast parameter
3. WHEN launching on mobile, THE Home_Module SHALL immediately add the "is-launched" class to the document body
4. WHEN launching on mobile, THE Home_Module SHALL immediately reveal the App_Container
5. WHEN launching on mobile, THE Home_Module SHALL pause all intro video elements
6. WHEN launching on mobile, THE Home_Module SHALL reveal the mobile bottom navigation bar

### Requirement 3

**User Story:** As a user on desktop, I want the launch sequence to coordinate animation timing properly, so that I see the content swap happen while the leaves obscure the screen.

#### Acceptance Criteria

1. WHEN launch function is called with fast parameter set to false on Desktop_Viewport, THE Home_Module SHALL execute the full animation sequence
2. WHEN the launch sequence begins, THE Home_Module SHALL add the "is-launching" class to the document body
3. WHEN the launch sequence begins, THE Home_Module SHALL lock the scroll position at the current vertical offset
4. WHEN the launch sequence begins, THE Home_Module SHALL prevent wheel and touchmove scroll events
5. WHEN 300 milliseconds elapse after launch begins, THE Home_Module SHALL call the playSweep function
6. WHEN 1900 milliseconds elapse after launch begins, THE Home_Module SHALL add the "is-launched" class to the document body
7. WHEN the App_Container is revealed, THE Home_Module SHALL pause all intro video elements
8. WHEN the App_Container is revealed, THE Home_Module SHALL call the BanglaPath.enterHome function if it exists
9. IF BanglaPath.enterHome function does not exist, THEN THE Home_Module SHALL remove the hidden attribute from the App_Container
10. WHEN the App_Container is revealed, THE Home_Module SHALL remove scroll prevention event listeners
11. WHEN the App_Container is revealed, THE Home_Module SHALL reveal the mobile bottom navigation bar

### Requirement 4

**User Story:** As a developer, I want the buildSweep function to be called automatically on page load, so that canvas elements are pre-rendered before animation is triggered.

#### Acceptance Criteria

1. WHEN the Home_Module loads, THE Home_Module SHALL call buildSweep function during initialization
2. WHEN the Script_Module triggers a bp-launch custom event, THE Home_Module SHALL ensure buildSweep has executed before calling launch
3. WHEN buildSweep completes, THE Home_Module SHALL store the loaded branch images in a cache variable
4. WHEN the viewport is resized and launch has not occurred, THE Home_Module SHALL repaint both Canvas_Element instances with the cached images
5. THE Home_Module SHALL use device pixel ratio for canvas rendering with a maximum ratio of 1.25

### Requirement 5

**User Story:** As a user, I want the authentication screen tabs to switch properly between Sign Up and Log In, so that I can access the correct form fields.

#### Acceptance Criteria

1. WHEN the user clicks the "Sign Up" tab button, THE Script_Module SHALL add the "is-active" class to the Sign Up tab button
2. WHEN the user clicks the "Sign Up" tab button, THE Script_Module SHALL remove the "is-hidden" class from the form with id "form-signup"
3. WHEN the user clicks the "Sign Up" tab button, THE Script_Module SHALL add the "is-hidden" class to the form with id "form-login"
4. WHEN the user clicks the "Log In" tab button, THE Script_Module SHALL add the "is-active" class to the Log In tab button
5. WHEN the user clicks the "Log In" tab button, THE Script_Module SHALL remove the "is-hidden" class from the form with id "form-login"
6. WHEN the user clicks the "Log In" tab button, THE Script_Module SHALL add the "is-hidden" class to the form with id "form-signup"
7. WHEN a tab button receives focus or is clicked, THE Script_Module SHALL remove the "is-active" class from all other tab buttons

### Requirement 6

**User Story:** As a user completing authentication, I want my profile information captured, so that the application can personalize my experience.

#### Acceptance Criteria

1. WHEN the launch function executes, THE Home_Module SHALL read the name input value from the authentication form
2. WHEN the launch function executes, THE Home_Module SHALL read the email input value from the authentication form
3. IF a name value exists, THEN THE Home_Module SHALL store the name in localStorage under the key "banglapath_user_profile"
4. IF an email value exists, THEN THE Home_Module SHALL store the email in localStorage under the key "banglapath_user_profile"
5. WHEN storing the name, THE Home_Module SHALL generate a handle by converting the name to lowercase and removing non-alphanumeric characters
6. WHEN the launch function completes, THE Home_Module SHALL set the localStorage item "bp_launched" to the string "true"
7. IF localStorage operations fail, THEN THE Home_Module SHALL continue the launch sequence without throwing an error

### Requirement 7

**User Story:** As a user, I want the authentication screen to hide properly when I proceed, so that I see a clean transition to the next screen.

#### Acceptance Criteria

1. WHEN the launch function is called, THE Home_Module SHALL add the "is-hidden" class to the Carousel_Screen element
2. WHEN the launch function is called, THE Home_Module SHALL add the "is-hidden" class to the Auth_Screen element
3. WHEN the launch function is called, THE Home_Module SHALL add the "is-dismissed" class to the auth element if it exists
4. WHEN the launch function is called, THE Home_Module SHALL set the aria-hidden attribute to "true" on the auth element if it exists
5. WHEN the launch function is called more than once, THE Home_Module SHALL return immediately without re-executing the launch sequence

### Requirement 8

**User Story:** As a developer maintaining the codebase, I want the leaf sweep animation to be responsive to viewport changes, so that it renders correctly on different screen sizes.

#### Acceptance Criteria

1. THE Home_Module SHALL define LEAF_LAYOUT as an array containing 12 branch configuration objects
2. WHEN paintSide function executes, THE Home_Module SHALL set the canvas width to 82 percent of the window inner width
3. WHEN paintSide function executes, THE Home_Module SHALL set the canvas height to 100 percent of the window inner height
4. WHEN paintSide function executes, THE Home_Module SHALL calculate branch dimensions using viewport width and viewport height units
5. WHEN rendering the right Canvas_Element, THE Home_Module SHALL mirror each branch horizontally by applying a negative scale transform
6. WHEN rendering the right Canvas_Element, THE Home_Module SHALL negate rotation angles for each branch
7. WHEN paintSide function completes, THE Home_Module SHALL apply a linear gradient fade from 66 percent width to the canvas inner edge
8. THE Home_Module SHALL use "destination-out" composite operation for the fade effect to create transparency at the seam
