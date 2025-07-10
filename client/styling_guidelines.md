# Styling Guidelines for AI Marketing Web App

This document outlines the primary styling directives for the application's user interface, ensuring a consistent, modern, and user-friendly experience.

## I. Color Palette

The application will primarily use a clean and professional color scheme:

*   **Primary Blue**: A modern, accessible blue. Used for primary actions, links, highlights, and potentially headers or key navigation elements.
    *   Example Hex: `#007bff` (Bootstrap Primary Blue) or a similar shade like `#3B82F6` (Tailwind Blue 500). Specific shade to be finalized by UI designer.
*   **White**: Used for backgrounds, content areas, and text on dark/colored backgrounds.
    *   Example Hex: `#FFFFFF`
*   **Grays**: A range of grays for text, secondary information, borders, disabled states, and subtle background variations.
    *   Light Gray (backgrounds, borders): e.g., `#F3F4F6` (Tailwind Gray 100), `#E5E7EB` (Tailwind Gray 200)
    *   Medium Gray (secondary text, icons): e.g., `#6B7280` (Tailwind Gray 500)
    *   Dark Gray (primary text on light backgrounds): e.g., `#1F2937` (Tailwind Gray 800)
*   **Accent Colors (Optional & Limited Use)**:
    *   Success: A shade of green (e.g., `#10B981`)
    *   Warning: A shade of yellow/amber (e.g., `#F59E0B`)
    *   Error/Danger: A shade of red (e.g., `#EF4444`)

## II. UI Elements - "Friendly and Modern Look"

*   **Soft Shadows**: Apply subtle box shadows to elements like cards, modals, dropdowns, and buttons (on hover/focus) to create depth and a sense of elevation. Avoid harsh, dark shadows.
    *   Example CSS: `box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);` (Similar to Tailwind's `shadow-md`)
*   **Rounded Corners**: Use rounded corners consistently for buttons, input fields, cards, modals, and other container elements to enhance the friendly aesthetic.
    *   Example CSS: `border-radius: 0.375rem;` (6px, similar to Tailwind's `rounded-md`) or `border-radius: 0.5rem;` (8px, similar to `rounded-lg`). Consistency is key.

## III. Typography

*   **Font Family**: Choose a clean, modern sans-serif font family.
    *   Examples: Inter, Roboto, Open Sans, Lato, or system fonts (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, ...`).
*   **Hierarchy**: Establish clear visual hierarchy using font sizes, weights (e.g., regular, medium, semibold, bold), and color.
*   **Readability**: Ensure sufficient contrast between text and background colors for accessibility (WCAG AA guidelines).

## IV. Layout and Spacing

*   **Clean and Uncluttered**: Prioritize ample white space to prevent visual clutter and improve readability.
*   **Consistency**: Use a consistent spacing scale (e.g., multiples of 4px or 8px) for margins, paddings, and gaps between elements.
*   **Responsive Design**: The UI must be fully responsive and optimized for a seamless experience on both desktop and mobile devices. This includes adapting layouts, typography, and interactive elements.

## V. Iconography

*   Use a consistent set of clean, modern icons (e.g., Heroicons, Feather Icons, Font Awesome).
*   Icons should be clear and easily understandable.

## VI. General Principles

*   **Modern Aesthetic**: The overall feel should be current, light, and professional.
*   **User-Friendly**: Interactions should be intuitive, and visual cues should guide the user effectively.
*   **Accessibility**: Design with accessibility in mind from the start (color contrast, keyboard navigation, ARIA attributes where appropriate).

This document serves as a starting point. Detailed component-level styling will be developed during the frontend implementation phase. The backend will provide data in a way that supports these styling goals where applicable (e.g., for user-customizable content).
