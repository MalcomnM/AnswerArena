import type { AiBoardResponse } from '@answer-arena/shared';

export const SAMPLE_BOARD: AiBoardResponse = {
  gameTitle: 'AnswerArena Classic',
  difficulty: 'medium',
  categories: [
    {
      name: 'World Geography',
      clues: [
        { value: 200, clue: 'This river is the longest in Africa.', answer: 'What is the Nile?', acceptable: ['Nile', 'the Nile River'], explanation: 'The Nile stretches approximately 6,650 km through northeastern Africa.' },
        { value: 400, clue: 'This European country is shaped like a boot.', answer: 'What is Italy?', acceptable: ['Italy', 'the Italian Peninsula'], explanation: 'Italy\'s distinctive boot shape is one of the most recognizable country outlines.' },
        { value: 600, clue: 'This is the smallest country in the world by area.', answer: 'What is Vatican City?', acceptable: ['Vatican City', 'the Vatican'], explanation: 'Vatican City covers only about 44 hectares (110 acres).' },
        { value: 800, clue: 'This strait separates Europe from Africa at its narrowest point.', answer: 'What is the Strait of Gibraltar?', acceptable: ['Gibraltar', 'Strait of Gibraltar'], explanation: 'The Strait of Gibraltar is only about 14 km wide at its narrowest.' },
        { value: 1000, clue: 'This Central Asian country is the largest landlocked nation in the world.', answer: 'What is Kazakhstan?', acceptable: ['Kazakhstan'], explanation: 'Kazakhstan covers about 2.7 million square kilometers without any ocean coastline.' },
      ],
    },
    {
      name: 'Science & Nature',
      clues: [
        { value: 200, clue: 'This gas makes up about 78% of Earth\'s atmosphere.', answer: 'What is nitrogen?', acceptable: ['nitrogen', 'N2'], explanation: 'Nitrogen is the most abundant gas in our atmosphere.' },
        { value: 400, clue: 'This is the hardest natural substance on Earth.', answer: 'What is diamond?', acceptable: ['diamond', 'diamonds'], explanation: 'Diamond scores 10 on the Mohs hardness scale.' },
        { value: 600, clue: 'This organ in the human body produces bile.', answer: 'What is the liver?', acceptable: ['liver', 'the liver'], explanation: 'The liver produces bile to aid in digestion of fats.' },
        { value: 800, clue: 'This subatomic particle has no electric charge.', answer: 'What is a neutron?', acceptable: ['neutron', 'neutrons'], explanation: 'Neutrons are found in the nucleus alongside positively charged protons.' },
        { value: 1000, clue: 'This effect describes the bending of light as it passes from one medium to another.', answer: 'What is refraction?', acceptable: ['refraction', 'light refraction'], explanation: 'Refraction is governed by Snell\'s Law.' },
      ],
    },
    {
      name: 'Pop Culture',
      clues: [
        { value: 200, clue: 'This wizarding school is the setting for a famous book series by J.K. Rowling.', answer: 'What is Hogwarts?', acceptable: ['Hogwarts', 'Hogwarts School'], explanation: 'Hogwarts School of Witchcraft and Wizardry is central to the Harry Potter series.' },
        { value: 400, clue: 'This animated film features a clownfish searching for his son.', answer: 'What is Finding Nemo?', acceptable: ['Finding Nemo', 'Nemo'], explanation: 'Finding Nemo was released by Pixar in 2003.' },
        { value: 600, clue: 'This band released the album "Abbey Road" in 1969.', answer: 'Who are The Beatles?', acceptable: ['The Beatles', 'Beatles'], explanation: 'Abbey Road was one of the last albums recorded by The Beatles.' },
        { value: 800, clue: 'This streaming service produced the series "Stranger Things".', answer: 'What is Netflix?', acceptable: ['Netflix'], explanation: 'Stranger Things debuted on Netflix in 2016.' },
        { value: 1000, clue: 'This director is known for films like "Inception", "The Dark Knight", and "Interstellar".', answer: 'Who is Christopher Nolan?', acceptable: ['Christopher Nolan', 'Nolan'], explanation: 'Nolan is known for his complex narrative structures and practical effects.' },
      ],
    },
    {
      name: 'U.S. History',
      clues: [
        { value: 200, clue: 'This document begins with "We the People".', answer: 'What is the U.S. Constitution?', acceptable: ['Constitution', 'the Constitution', 'US Constitution'], explanation: 'The Constitution was adopted in 1787.' },
        { value: 400, clue: 'This president delivered the Gettysburg Address.', answer: 'Who is Abraham Lincoln?', acceptable: ['Abraham Lincoln', 'Lincoln'], explanation: 'Lincoln delivered the address on November 19, 1863.' },
        { value: 600, clue: 'This 1773 protest involved colonists dumping tea into Boston Harbor.', answer: 'What is the Boston Tea Party?', acceptable: ['Boston Tea Party', 'the Boston Tea Party'], explanation: 'Colonists protested British taxation without representation.' },
        { value: 800, clue: 'This amendment to the Constitution abolished slavery.', answer: 'What is the 13th Amendment?', acceptable: ['13th Amendment', 'the Thirteenth Amendment'], explanation: 'Ratified in 1865, it formally ended slavery in the United States.' },
        { value: 1000, clue: 'This 1803 land deal doubled the size of the United States.', answer: 'What is the Louisiana Purchase?', acceptable: ['Louisiana Purchase', 'the Louisiana Purchase'], explanation: 'The U.S. purchased the territory from France for about $15 million.' },
      ],
    },
    {
      name: 'Food & Drink',
      clues: [
        { value: 200, clue: 'This Italian dish is made of layers of pasta, meat sauce, and cheese.', answer: 'What is lasagna?', acceptable: ['lasagna', 'lasagne'], explanation: 'Lasagna is a classic Italian comfort food.' },
        { value: 400, clue: 'This Japanese dish consists of vinegared rice topped with raw fish.', answer: 'What is sushi?', acceptable: ['sushi'], explanation: 'Sushi originated in Japan and has become popular worldwide.' },
        { value: 600, clue: 'This spice, derived from the crocus flower, is the most expensive by weight.', answer: 'What is saffron?', acceptable: ['saffron'], explanation: 'Saffron requires hand-harvesting of delicate stigmas from crocus flowers.' },
        { value: 800, clue: 'This French cooking term means to cook food quickly in a small amount of fat over high heat.', answer: 'What is sauté?', acceptable: ['sauté', 'saute', 'sautéing'], explanation: 'Sauté comes from the French word meaning "to jump".' },
        { value: 1000, clue: 'This fermented Korean side dish is made primarily from napa cabbage and chili peppers.', answer: 'What is kimchi?', acceptable: ['kimchi', 'kimchee'], explanation: 'Kimchi is a staple of Korean cuisine with thousands of varieties.' },
      ],
    },
    {
      name: 'Technology',
      clues: [
        { value: 200, clue: 'This company created the iPhone.', answer: 'What is Apple?', acceptable: ['Apple', 'Apple Inc.'], explanation: 'Apple released the first iPhone in 2007.' },
        { value: 400, clue: 'This programming language shares its name with a large island in Indonesia.', answer: 'What is Java?', acceptable: ['Java'], explanation: 'Java was developed by Sun Microsystems in 1995.' },
        { value: 600, clue: 'This acronym stands for the protocol that secures web browsing with encryption.', answer: 'What is HTTPS?', acceptable: ['HTTPS', 'Hypertext Transfer Protocol Secure'], explanation: 'HTTPS uses TLS/SSL encryption to secure data in transit.' },
        { value: 800, clue: 'This 1969 network, funded by DARPA, was the precursor to the modern internet.', answer: 'What is ARPANET?', acceptable: ['ARPANET'], explanation: 'ARPANET made its first node-to-node communication in October 1969.' },
        { value: 1000, clue: 'This mathematical concept, essential to blockchain technology, converts input of any size into a fixed-size output.', answer: 'What is a hash function?', acceptable: ['hash function', 'hashing', 'cryptographic hash'], explanation: 'Hash functions are one-way functions used extensively in cryptography and data structures.' },
      ],
    },
  ],
};
