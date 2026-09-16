/* ============================================================================
   EVENANT · MODULE REGISTRY
   ----------------------------------------------------------------------------
   The single source of truth for what tools exist, shared by the module
   switcher in every header and by the tools home page. Adding a tool is an
   entry here plus its destination — no navigation code changes.

   Loaded before evenant-nav.js, both deferred, so EVENANT_MODULES is already
   defined by the time the switcher is built. Nothing exports; top-level const
   is the module system, as everywhere else in this repo.

   Include it as:
     <script defer src="evenant-modules.js" data-module="atlas"></script>
   `data-module` is the id of the tool the page IS, which is how the switcher
   knows what to mark active. It is the page's own declaration rather than a
   guess from the URL, so it keeps working behind a preview domain, in an
   iframe, or at a path we have not thought of.
   ============================================================================ */

/* Paths in the registry are relative to the SITE ROOT, and the root is derived
   from this script's own URL. That is what lets a tool sitting one directory
   down — dojo/, valley-sunrise-app/ — use the same table as one at the top
   without a per-page base constant to keep in step. */
const EVENANT_ROOT = (() => {
  const s = document.currentScript;
  return s && s.src ? new URL('.', s.src).href : './';
})();

const EVENANT_ACTIVE = (() => {
  const s = document.currentScript;
  return (s && s.dataset.module) || '';
})();

/* 16px outline glyphs, one weight, stroke only. Kept here rather than in the
   nav so that a new tool arrives complete — name, mark, destination, blurb. */
/* The Evenant mark, once. Every header renders this same image at the same
   size from the same string — the accelerator used to draw its own three-bar
   mark and the score viewer had no logo at all. */
const EVENANT_LOGO = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACsAAAAoCAYAAABnyQNuAAABg2lDQ1BJQ0MgUHJvZmlsZQAAKJGFkT9Lw1AUxU+jooiUKg5uPtChQ5SQ0nbRoU2LCra0xYKKS5ombSU2IY3/cBbcHF3FT+Dg4ODQwc1JBSc/gZMguGiJ9zUtRYX2hJf7u+c93r28Cwhnqm2bQgjYq7tOYSXJNre22egbxugLgmFW1Rp2IpdbB6kbf+vzBQEenxf4Xf/3+2q8rDc0it+07jTbcYHALfHcoWtzfiWedqgp4nfOlTYLw5xLPs+0z2wUFGKROFTyeYlzxWfed0irqmXiHWKxU5eLJdPZPMsk5LhUZIplWg7LOZZRM3UxFYtKUrdXhiTSyCJPlEECMuKQUKRMgQWTlkOco78FAzVydIhIIYYonWtfEx5QihnkZFQNfeXqRy6PimUfO7VK1WUJenmdrdW1RZHJkhwD+Bz/zqfnnTaB5Sf+zj1v9RG4Jj943vPCaWDSAu5PtH3noFM+IESAQXnDiMh+NjEFjDx43sc8MLoLtG487+vS81pXwBDNt3nxAwgfdRuKLiZgAAAAOGVYSWZNTQAqAAAACAABh2kABAAAAAEAAAAaAAAAAAACoAIABAAAAAEAAAAroAMABAAAAAEAAAAoAAAAAAq0HxIAAALmSURBVFgJ7VnPT9RAFH5vOtuysGCaLJEfwejBixoTD3ow4WZCOHEwRC/+CSQePHr05Mm7f4jEK8aEGEAlagwGA4iySFyQtrvdtjO+WXdiGzDUZYHWMNnsvJn3zTdfX9s3s7N49/63808elhfCCAwJQJ/sFAbAIoFR5Ucw/WLef8wDZKzfNnoZQyM7MpNKRgaMOyDQIvEAQoBIurPXGhni15tisydtryIEKOZGLMmX+RFLr35+xFJoT8XufT060ENvGOMckHMsdIDuSCkKHC0eBMybf9+YbTSiImC2VjB99bRgFXYcWKHgAkxOSmPZnmP1arHZ1qAs1e8uXwqzpOf/0tL2bV9ZkfbsR2909JoVrX8Pwe7mcmndR9cDuHHFkvMffCzbBvTbHJbXfbgwbMnVio9F05CDZQ5+A6BWD8XLN7XBcwPm5lDZkLwL0DJAbmwBDp/lcmbOxbGbPXLbA/Zq0Q3aFuv48mqPCa8jAWhQthZqhWmx0cYIWCuDqx2SMiX5UfuVTX26nbj/5FNOzUf8oPi3f0bVFmUCnqpBuS4iYF0RqaKFNu0YqzbjwhQ23m4S6K/WBWk+zR/QbJpLQ1PXdBdVnlNxOK4i2hZ7XArj85yKjUejk/ZpZDsZzTjXoSLbyjJxvqOzabK2xZq/x3Yfnboks8mxxJNd6VtrVaeysIjTUSS7WHM9UmNby08i/ar4x9NxvK1tVeuisTEfAnp1sRZHaXTqenxqyVrdaGj21OP+Feg7Jn56dtH/13EniqfISrz3oNJtlKyCWVPbjXSlSjA7HfTQKIeOuAJ/t87HpzbKE2Olp4jYi/LPw6V3S/vNpH26jmP264v7D7L/Mt5wa2e+8L4u1nf7VmniIJKT9rueqDMhpQhDqTZRmS6uJ5228+xJXFl+xFIyz49YSlv5EUtpIj9iacnNjVj6teuxQoTqYC6zf37orLO1E73lgSHl182Q0eGX7s9UTWcQn3drkft8xnn0C+Jy45OGlP6OAAAAAElFTkSuQmCC';

const EVENANT_ICONS = {
  tools:`<path d="M2.5 2.5h4.2v4.2H2.5zM9.3 2.5h4.2v4.2H9.3zM2.5 9.3h4.2v4.2H2.5zM9.3 9.3h4.2v4.2H9.3z"/>`,
  atlas:`<path d="M8 4.2C6.7 3.2 4.9 2.8 2.5 3v9.4c2.4-.2 4.2.2 5.5 1.2 1.3-1 3.1-1.4 5.5-1.2V3c-2.4-.2-4.2.2-5.5 1.2z"/><path d="M8 4.2v9.4"/>`,
  score:`<path d="M2.2 3.4h11.6M2.2 8h11.6M2.2 12.6h11.6"/><path d="M5 1.9v3M10.4 6.5v3M7 11.1v3"/>`,
  ear:`<path d="M3.2 10.8a5.6 5.6 0 1 1 3.4 2.6"/><path d="M5.9 9.6a2.7 2.7 0 1 1 2 1.3"/><circle cx="8" cy="8" r=".9"/>`,
  accelerator:`<path d="M3 11.5l4-4 2.4 2.4L13.4 5"/><path d="M10.2 5h3.2v3.2"/>`
};

/* The hub. A tool in every respect except that it lists the others. */
const EVENANT_TOOLS_HOME = {
  id:'tools', name:'All tools', path:'tools.html', icon:'tools', status:'available',
  blurb:'Every Evenant tool in one place.'
};

/* `status` is 'available' or 'soon'. A 'soon' entry renders as a disabled row
   with a Coming soon label and never navigates — it is not a link at all, so
   there is nothing to click through to a page that does not exist.

   The 3D Viewer is deliberately absent: it is reached from the 2D/3D toggle on
   an instrument plate, so it is part of the Atlas rather than a sibling tool.
   Adding it later means one entry below and nothing else. */
const EVENANT_MODULES = [
  {
    id:'atlas', name:'Instrument Atlas', navName:'The Instrument Atlas',
    icon:'atlas', status:'available', path:'index.html',
    blurb:'Every instrument of the orchestra: range, registers, what it blends with, and where it stops.'
  },
  {
    id:'score', name:'Score Viewer', icon:'score', status:'available',
    path:'valley-sunrise-app/score.html',
    blurb:'A composition taken apart stem by stem, with a piano roll, loops and section annotations.'
  },
  {
    id:'dojo', name:'Ear Training', icon:'ear', status:'available',
    path:'dojo/',
    blurb:'Hear an instrument and name it. Get it wrong and the two are played back to back.'
  },
  {
    id:'accelerator', name:'The Accelerator', icon:'accelerator', status:'available',
    path:'accelerator.html',
    blurb:'The interactive companion to the ebook. Six lessons, each with something to play with.'
  }
];

const evenantHref = m => EVENANT_ROOT + m.path;
/* the hub is addressable by id like any other tool, so the switcher on
   tools.html names itself and ticks its own row */
const evenantModule = id =>
  EVENANT_MODULES.find(m => m.id === id) ||
  (id === EVENANT_TOOLS_HOME.id ? EVENANT_TOOLS_HOME : null);
