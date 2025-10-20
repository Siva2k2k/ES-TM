require('dotenv').config();
import { EmailService } from '../services/EmailService';

(async () => {
  const ok = await EmailService.verifyConnection();

  const sent = await EmailService.sendEmail({
    to: 'sivakumar@hibizsolutions.com',
    subject: 'Test email',
    html: '<p>test</p>',
    text: 'test'
  });

  const welcome = await EmailService.sendWelcomeEmail({
    fullName: 'Siva Kumar',
    email: 'sivakumar@hibizsolutions.com',
    temporaryPassword: '123employee',
    loginUrl: 'string',
    expirationTime: 'string'
  });
})();