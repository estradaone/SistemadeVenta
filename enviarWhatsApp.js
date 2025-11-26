const accountSid = 'AC51c0970d496c1000257bb244e3e6fb2c';
const authToken = 'fc5f5c3d3f4bc4c0476e97c44789d4ea';
const client = require('twilio')(accountSid, authToken);

client.messages
    .create({
        body: 'Your appointment is coming up on July 21 at 3PM',
        from: 'whatsapp:+14155238886',
        to: 'whatsapp:+5219932802311'
    })
    .then(message => console.log(message.sid))
    .done();