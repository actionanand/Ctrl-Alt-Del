const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const welcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'no-reply@ctrl-alt-del.com',
        subject: 'Welcome to Ctrl-Alt-Del App!',
        text: `Dear ${name},
        Thank you for joining with us.`
    });
}

const cancellationEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'no-reply@ctrl-alt-del.com',
        subject: 'Sorry to see you go!',
        text: `Goodbye ${name},
        We(Ctrl-Alt-Del App Team) hope to see you back soon! Thanks for being with us till now. We've removed all of your tasks as you(${name}) are the owner of them.`
    });
}

module.exports = {
    welcomeEmail,
    cancellationEmail
}