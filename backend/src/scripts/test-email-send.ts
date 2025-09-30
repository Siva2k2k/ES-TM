require('dotenv').config();
import { EmailService } from '../services/EmailService';

(async () => {
  console.log('Verifying connection...');
  const ok = await EmailService.verifyConnection();
  console.log('verifyConnection ->', ok);

  console.log('Sending test email...');
  const sent = await EmailService.sendEmail({
    to: 'sivakumar@hibizsolutions.com',
    subject: 'Test email',
    html: '<p>test</p>',
    text: 'test'
  });
  console.log('send ->', sent);

  console.log('Sending test email...');
  const welcome = await EmailService.sendWelcomeEmail({
    fullName: 'Siva Kumar',
    email: 'sivakumar@hibizsolutions.com',
    temporaryPassword: '123employee',
    loginUrl: 'string',
    expirationTime: 'string'
  });
  console.log('welcome ->', welcome);
})();