const sections = [
  { id: 'fetch-journey', file: 'journey.html' },
  { id: 'fetch-projects', file: 'projects.html' },
  { id: 'fetch-skills', file: 'skills.html' },
];

sections.forEach(({ id, file }) => {
  fetch(file)
    .then(response => {
      if (!response.ok) throw new Error(`Network error loading ${file}`);
      return response.text();
    })
    .then(html => {
      document.getElementById(id).innerHTML = html;
    })
    .catch(error => {
      console.error(error);
    });
});
