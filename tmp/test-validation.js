import handler from '../api/validate.js';

// Mock request and response
const req = {
  method: 'POST',
  body: {
    type: 'recipe',
    data: {
      title: 'Nigerian Jollof Rice',
      ingredients: [{ item: 'Rice', amount: '2', unit: 'cups' }],
      steps: ['Boil water', 'Add rice']
    }
  }
};

const res = {
  status: (code) => {
    console.log('Status:', code);
    return res;
  },
  json: (data) => {
    console.log('Response JSON:', JSON.stringify(data, null, 2));
    return res;
  }
};

console.log('Testing Validation with Real Recipe...');
handler(req, res).catch(err => {
  console.error('Error Details:', err);
});

const fakeReq = {
  method: 'POST',
  body: {
    type: 'recipe',
    data: {
      title: 'How to build a PC',
      ingredients: [{ item: 'CPU', amount: '1', unit: '' }],
      steps: ['Plug it in', 'Turn it on']
    }
  }
};

console.log('\nTesting Validation with Fake Recipe...');
handler(fakeReq, res).catch(err => console.error('Error:', err));
