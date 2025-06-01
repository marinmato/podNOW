function sanitizeTopic(raw) {
  if (!raw || typeof raw !== 'string') return '';
  
  const trimmed = raw.trim().toLowerCase();
  
  // Check for exact matches (case-insensitive)
  if (trimmed === 'sports') return 'Sports';
  if (trimmed === 'ai') return 'AI';
  if (trimmed === 'business') return 'Business';
  if (trimmed === 'history') return 'History';
  
  // Strip leading phrases (case-insensitive)
  let cleaned = raw.trim();
  const phrases = [
    'I want to learn more about',
    'I want to learn about',
    'Tell me about',
    'Give me a podcast on'
  ];
  
  for (const phrase of phrases) {
    const regex = new RegExp(`^${phrase}\\s*`, 'i');
    cleaned = cleaned.replace(regex, '');
  }
  
  // Trim leading/trailing whitespace and punctuation
  cleaned = cleaned.replace(/^[\s?.!]+|[\s?.!]+$/g, '').trim();
  
  // Split into words
  const words = cleaned.split(/\s+/).filter(word => word.length > 0);
  
  // If more than 4 words or longer than 40 characters, keep only first 4 words
  if (words.length > 4 || cleaned.length > 40) {
    cleaned = words.slice(0, 4).join(' ');
  }
  
  return cleaned;
}

module.exports = sanitizeTopic;