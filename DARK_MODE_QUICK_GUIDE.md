# 🌓 Dark Mode Quick Reference Guide

## CSS Variables Cheat Sheet

### Background Colors
```css
var(--bg-primary)    /* Main page background */
var(--bg-secondary)  /* Section backgrounds */
var(--bg-tertiary)   /* Input fields, subtle backgrounds */
var(--card-bg)       /* Cards, panels */
```

### Text Colors
```css
var(--text-dark)     /* Primary text (headings, body) */
var(--text-muted)    /* Secondary text (labels, captions) */
```

### Theme Colors
```css
var(--primary)       /* Primary brand color */
var(--primary-dark)  /* Darker shade */
var(--primary-light) /* Lighter shade */
var(--secondary-bg)  /* Secondary accent background */
```

### UI Elements
```css
var(--border-color)  /* Borders, dividers */
var(--shadow-sm)     /* Small shadow */
var(--shadow-md)     /* Medium shadow */
var(--radius)        /* Border radius */
```

## Common Patterns

### Basic Card
```tsx
<div className="card">
  <div className="card-body">
    <h5 className="card-title">Title</h5>
    <p className="text-muted">Description</p>
  </div>
</div>
```

### Custom Styled Component
```css
.my-component {
  background-color: var(--card-bg);
  color: var(--text-dark);
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
  transition: all 0.3s ease;
}

.my-component:hover {
  box-shadow: var(--shadow-md);
}
```

### Dark Mode Specific Styles
```css
/* Only apply in dark mode */
[data-theme='dark'] .my-element {
  background: var(--bg-tertiary);
  border-color: var(--primary);
}
```

## Do's and Don'ts

### ✅ DO
- Use CSS variables for all colors
- Test in both light and dark mode
- Use `var(--text-dark)` for readable text
- Add transitions for smooth theme switching
- Use semantic class names

### ❌ DON'T
- Hardcode colors like `#fff` or `#000`
- Use `bg-white` class from Bootstrap
- Forget to test contrast ratios
- Mix inline styles with CSS variables
- Use opacity alone for text visibility

## Quick Fixes

### Problem: White background in dark mode
```tsx
/* Before */
<div className="bg-white p-3">

/* After */
<div className="p-3" style={{ backgroundColor: 'var(--card-bg)' }}>
/* OR create a CSS class */
```

### Problem: Text too dark to read
```css
/* Before */
.my-text {
  color: #475569;
}

/* After */
.my-text {
  color: var(--text-muted);
}
```

### Problem: Border invisible in dark mode
```css
/* Before */
.my-box {
  border: 1px solid #e5e7eb;
}

/* After */
.my-box {
  border: 1px solid var(--border-color);
}
```

## Bootstrap Component Overrides

All Bootstrap components work out of the box! Just use standard classes:

```tsx
<Button variant="primary">Primary</Button>
<Card className="shadow-sm">
  <Card.Header>Header</Card.Header>
  <Card.Body>Content</Card.Body>
</Card>
<Form.Control type="text" />
<Modal show={true}>
  <Modal.Header>Title</Modal.Header>
  <Modal.Body>Content</Modal.Body>
</Modal>
```

## Testing Checklist

Before committing your component:
- [ ] Check in light mode
- [ ] Check in dark mode
- [ ] Verify text is readable
- [ ] Check hover states
- [ ] Test forms/inputs
- [ ] Verify borders are visible
- [ ] Check shadows work
- [ ] Test on mobile

## Common Components Reference

### Job Card
```tsx
<div className="job-card card-hover p-3">
  <h6 className="job-title">Title</h6>
  <div className="job-details">
    <div className="job-detail-item">
      <i className="bi bi-geo-alt" />
      <span>Location</span>
    </div>
  </div>
</div>
```

### Section with Background
```tsx
<section className="section section-categories">
  <Container>
    <div className="categories-wrapper rounded-4 p-4 shadow-sm">
      {/* Content */}
    </div>
  </Container>
</section>
```

### Message Bubble
```tsx
<div className={mine ? 'bg-primary text-white' : 'message-bubble-received'}>
  {message.text}
</div>
```

## Need Help?

1. Check `global.css` for available CSS variables
2. Look at existing components for patterns
3. Read `DARK_MODE.md` for detailed docs
4. Test your component with the theme toggle

---

**Pro Tip**: Install a browser extension like "Dark Reader" to test your components against various dark themes!
