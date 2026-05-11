window.addEventListener('DOMContentLoaded', () => {
  const blockedUrlElement = document.getElementById('blockedUrl');
  const quoteTextElement = document.getElementById('quoteText');
  const quoteAuthorElement = document.getElementById('quoteAuthor');
  const backButton = document.getElementById('backButton');

  blockedUrlElement.textContent = document.referrer || 'Unknown site';

  const randomIndex = Math.floor(Math.random() * quotes.length);
  const quote = quotes[randomIndex];

  quoteTextElement.textContent = `“${quote.quote}”`;
  quoteAuthorElement.textContent = quote.author ? `— ${quote.author}` : '';

  backButton.addEventListener('click', () => {
    window.history.back();
  });

  const optionsButton = document.getElementById('optionsButton');
  optionsButton.addEventListener('click', () => {
    if (chrome && chrome.runtime && chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open('options.html', '_blank');
    }
  });
});
