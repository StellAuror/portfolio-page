const sections = [
  { id: 'fetch-me', file: 'me.html' },
  { id: 'fetch-journey', file: 'journey.html' },
  { id: 'fetch-projects', file: 'projects.html' },
  { id: 'fetch-skills', file: 'skills.html' },
  { id: 'fetch-testimonials', file: 'testimonials.html' },
];

// Resolves once every section is in the DOM, so the other modules never race the fetches
window.sectionsReady = Promise.all(sections.map(({ id, file }) =>
  fetch(file, { cache: 'no-cache' })
    .then(response => {
      if (!response.ok) throw new Error(`Network error loading ${file}`);
      return response.text();
    })
    .then(html => {
      const target = document.getElementById(id);
      // Unwrap: the fetched <section> replaces its placeholder
      target.outerHTML = html;
    })
    .catch(error => console.error(error))
));
